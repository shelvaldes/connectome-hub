// deployer.ts — deploys Connectome agents locally or on a remote VPS.
// In nomine Sancti Michaelis Archangeli.

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import chalk from 'chalk';

export interface AgentSpec {
  name: string;
  recipe: unknown;
  env: Record<string, string>;
}

export interface DeployOptions {
  target: 'local' | 'remote';
  baseDir: string;
  remoteHost?: string;
  remoteUser?: string;
  remoteKeyPath?: string;
  agents: AgentSpec[];
}

export async function writeAgentInstallDir(agent: AgentSpec, baseDir: string): Promise<string> {
  const agentDir = path.join(baseDir, agent.name);
  await fs.mkdir(path.join(agentDir, 'recipes'), { recursive: true });
  await fs.mkdir(path.join(agentDir, 'data'), { recursive: true });
  await fs.chmod(path.join(agentDir, 'data'), 0o700);
  await fs.writeFile(path.join(agentDir, 'recipes', `${agent.name}.json`), JSON.stringify(agent.recipe, null, 2));
  const envLines = [`DATA_DIR=${agentDir}/data`];
  for (const [k, v] of Object.entries(agent.env)) envLines.push(`${k}=${v}`);
  await fs.writeFile(path.join(agentDir, '.env'), envLines.join('\n') + '\n');
  await fs.chmod(path.join(agentDir, '.env'), 0o600);
  return agentDir;
}

export function buildSystemdUnit(agent: AgentSpec, baseDir: string, homeDir: string): string {
  const hostScript = path.join(baseDir, 'node_modules', '@animalabs', 'connectome-host', 'src', 'index.ts');
  const recipePath = path.join(baseDir, agent.name, 'recipes', `${agent.name}.json`);
  return [
    '[Unit]', `Description=Connectome agent: ${agent.name}`, 'After=network.target', '',
    '[Service]', 'Type=simple',
    `WorkingDirectory=${path.join(baseDir, agent.name)}`,
    `EnvironmentFile=${path.join(baseDir, agent.name, '.env')}`,
    `ExecStart=${homeDir}/.bun/bin/bun ${hostScript} ${recipePath} --headless`,
    'Restart=on-failure', 'RestartSec=5', '',
    '[Install]', 'WantedBy=default.target',
  ].join('\n');
}

export function buildLaunchdPlist(agent: AgentSpec, baseDir: string, homeDir: string): string {
  const hostScript = path.join(baseDir, 'node_modules', '@animalabs', 'connectome-host', 'src', 'index.ts');
  const recipePath = path.join(baseDir, agent.name, 'recipes', `${agent.name}.json`);
  const agentDir = path.join(baseDir, agent.name);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>cc.${agent.name}.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>${homeDir}/.bun/bin/bun</string>
    <string>${hostScript}</string>
    <string>${recipePath}</string>
    <string>--headless</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${agentDir}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>OPENROUTER_API_KEY</key>
    <string>${agent.env.OPENROUTER_API_KEY || ''}</string>
    <key>DATA_DIR</key>
    <string>${path.join(agentDir, 'data')}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${path.join(agentDir, 'data', 'launchd-stdout.log')}</string>
  <key>StandardErrorPath</key>
  <string>${path.join(agentDir, 'data', 'launchd-stderr.log')}</string>
</dict>
</plist>`;
}

export async function installServiceLocal(agent: AgentSpec, baseDir: string): Promise<void> {
  const platform = os.platform();
  const homeDir = os.homedir();
  if (platform === 'linux') {
    const unitDir = path.join(homeDir, '.config', 'systemd', 'user');
    await fs.mkdir(unitDir, { recursive: true });
    await fs.writeFile(path.join(unitDir, `${agent.name}-agent.service`), buildSystemdUnit(agent, baseDir, homeDir));
  } else if (platform === 'darwin') {
    const launchDir = path.join(homeDir, 'Library', 'LaunchAgents');
    await fs.mkdir(launchDir, { recursive: true });
    await fs.writeFile(path.join(launchDir, `cc.${agent.name}.agent.plist`), buildLaunchdPlist(agent, baseDir, homeDir));
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

export async function startAgentLocal(agentName: string): Promise<void> {
  const platform = os.platform();
  if (platform === 'linux') {
    execSync('systemctl --user daemon-reload');
    execSync(`systemctl --user enable ${agentName}-agent.service`);
    execSync(`systemctl --user start ${agentName}-agent.service`);
  } else if (platform === 'darwin') {
    const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', `cc.${agentName}.agent.plist`);
    execSync(`launchctl bootstrap gui/$(id -u) ${plistPath}`);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

export async function deployLocal(options: DeployOptions): Promise<{ dirs: string[]; started: string[]; failed: string[] }> {
  const dirs: string[] = [];
  const started: string[] = [];
  const failed: string[] = [];
  for (const agent of options.agents) {
    const dir = await writeAgentInstallDir(agent, options.baseDir);
    dirs.push(dir);
    try {
      await installServiceLocal(agent, options.baseDir);
      await startAgentLocal(agent.name);
      started.push(agent.name);
      console.log(chalk.green(`✅ ${agent.name} installed and started.`));
    } catch (err) {
      failed.push(agent.name);
      console.log(chalk.yellow(`⚠️ Could not start ${agent.name} automatically: ${(err as Error).message}`));
      console.log(chalk.gray(`Run manually: ${buildControlCommand('local', 'start', agent.name)}`));
    }
  }
  return { dirs, started, failed };
}

// Generates the bash deploy script for a remote VPS.
export function buildRemoteScript(options: DeployOptions): string {
  const lines: string[] = [];
  const user = options.remoteUser || 'root';
  const homeDir = user === 'root' ? '/root' : `/home/${user}`;

  const packageJson = {
    name: 'connectome-hub-remote',
    version: '0.1.1',
    type: 'module',
    dependencies: {
      '@animalabs/connectome-host': '^0.19.0',
      '@animalabs/agent-framework': '^0.30.0',
      '@animalabs/context-manager': '^0.24.0',
      '@animalabs/membrane': '^0.8.0',
      '@animalabs/chronicle': '^0.5.0'
    },
    devDependencies: {
      '@types/bun': '^1.3.13',
      '@types/node': '^22.0.0',
      'typescript': '^7.0.2'
    }
  };

  lines.push('#!/bin/bash', 'set -e', '');
  lines.push('# Connectome Hub remote deploy script');
  lines.push('# In nomine Sancti Michaelis Archangeli', '');
  lines.push('echo "[1/6] Installing system packages..."');
  lines.push('apt-get update -y && apt-get install -y curl git build-essential unzip || true', '');
  lines.push('echo "[2/6] Installing Bun..."');
  lines.push('command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash');
  lines.push('export PATH="${HOME}/.bun/bin:${PATH}"', '');
  lines.push('echo "[3/6] Preparing Connectome install directory..."');
  lines.push(`mkdir -p ${options.baseDir} && cd ${options.baseDir}`);
  lines.push('cat > package.json <<'PKG_EOF'');
  lines.push(JSON.stringify(packageJson, null, 2));
  lines.push('PKG_EOF', '');
  lines.push('echo "[4/6] Installing Connectome dependencies..."');
  lines.push('bun install', '');

  for (const agent of options.agents) {
    const agentDir = path.join(options.baseDir, agent.name);
    lines.push(`echo "[5/6] Writing ${agent.name} install dir..."`);
    lines.push(`mkdir -p ${agentDir}/recipes ${agentDir}/data && chmod 700 ${agentDir}/data`);
    lines.push(`cat > ${agentDir}/recipes/${agent.name}.json <<'RECIPE_EOF'`);
    lines.push(JSON.stringify(agent.recipe, null, 2));
    lines.push('RECIPE_EOF', '');
    lines.push(`cat > ${agentDir}/.env <<'ENV_EOF'`);
    lines.push(`DATA_DIR=${agentDir}/data`);
    for (const [k, v] of Object.entries(agent.env)) lines.push(`${k}=${v}`);
    lines.push('ENV_EOF', `chmod 600 ${agentDir}/.env`, '');
    lines.push(`echo "[6/6] Installing systemd --user service for ${agent.name}..."`);
    lines.push(`mkdir -p ${homeDir}/.config/systemd/user`);
    lines.push(`cat > ${homeDir}/.config/systemd/user/${agent.name}-agent.service <<'UNIT_EOF'`);
    lines.push(buildSystemdUnit(agent, options.baseDir, homeDir));
    lines.push('UNIT_EOF');
    lines.push(`loginctl enable-linger ${user} 2>/dev/null || true`);
    lines.push('systemctl --user daemon-reload 2>/dev/null || true');
    lines.push(`systemctl --user enable ${agent.name}-agent.service 2>/dev/null || echo "Warning: could not enable ${agent.name}-agent.service"`);
    lines.push(`systemctl --user start ${agent.name}-agent.service 2>/dev/null || echo "Warning: could not start ${agent.name}-agent.service"`, '');
  }

  lines.push('echo "✅ Done. Check logs with: journalctl --user -u <agent>-agent.service"');
  return lines.join('\n');
}

export function buildControlCommand(
  target: 'local' | 'remote',
  action: 'start' | 'stop' | 'restart' | 'status',
  agentName: string,
  remoteUser?: string,
  remoteHost?: string
): string {
  const svc = `${agentName}-agent.service`;
  if (target === 'local') return `systemctl --user ${action} ${svc}`;
  return `ssh ${remoteUser}@${remoteHost} "systemctl --user ${action} ${svc}"`;
}

export function hubConfigPath(): string { return path.join(os.homedir(), '.connectome-hub', 'config.json'); }

export async function loadHubConfig(): Promise<Record<string, unknown>> {
  try { return JSON.parse(await fs.readFile(hubConfigPath(), 'utf-8')); } catch { return {}; }
}

export async function saveHubConfig(config: Record<string, unknown>): Promise<void> {
  await fs.mkdir(path.dirname(hubConfigPath()), { recursive: true });
  await fs.writeFile(hubConfigPath(), JSON.stringify(config, null, 2));
}
