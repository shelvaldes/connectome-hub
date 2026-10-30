// deployer.ts — despliega agentes Connectome localmente o en un VPS remoto.
// Compatible con @animalabs/connectome-host según docs/DEPLOYMENTS.md.
// In nomine Sancti Michaelis Archangeli.

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

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

export async function deployLocal(options: DeployOptions): Promise<string[]> {
  const dirs: string[] = [];
  for (const agent of options.agents) dirs.push(await writeAgentInstallDir(agent, options.baseDir));
  return dirs;
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

// Genera el comando systemd para arrancar/parar un agente.
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

export function buildRemoteScript(options: DeployOptions): string {
  const lines: string[] = [];
  const user = options.remoteUser || 'root';
  const homeDir = user === 'root' ? '/root' : `/home/${user}`;
  lines.push('#!/bin/bash', 'set -e', '', '# Connectome Hub remote deploy script', '# In nomine Sancti Michaelis Archangeli', '');
  lines.push('echo "[1/5] Installing system packages..."');
  lines.push('apt-get update -y && apt-get install -y curl git build-essential unzip', '');
  lines.push('echo "[2/5] Installing Bun..."');
  lines.push('command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash', '');
  lines.push('echo "[3/5] Installing Connectome dependencies..."');
  lines.push(`mkdir -p ${options.baseDir} && cd ${options.baseDir}`, 'bun install', '');
  for (const agent of options.agents) {
    const agentDir = path.join(options.baseDir, agent.name);
    lines.push(`echo "[4/5] Writing ${agent.name} install dir..."`);
    lines.push(`mkdir -p ${agentDir}/recipes ${agentDir}/data && chmod 700 ${agentDir}/data`);
    lines.push(`cat > ${agentDir}/recipes/${agent.name}.json <<'RECIPE_EOF'`);
    lines.push(JSON.stringify(agent.recipe, null, 2));
    lines.push('RECIPE_EOF', '');
    lines.push(`cat > ${agentDir}/.env <<'ENV_EOF'`);
    lines.push(`DATA_DIR=${agentDir}/data`);
    for (const [k, v] of Object.entries(agent.env)) lines.push(`${k}=${v}`);
    lines.push('ENV_EOF', `chmod 600 ${agentDir}/.env`, '');
    lines.push(`echo "[5/5] Installing systemd --user service for ${agent.name}..."`);
    lines.push(`mkdir -p ${homeDir}/.config/systemd/user`);
    lines.push(`cat > ${homeDir}/.config/systemd/user/${agent.name}-agent.service <<'UNIT_EOF'`);
    lines.push(buildSystemdUnit(agent, options.baseDir, homeDir));
    lines.push('UNIT_EOF');
    lines.push(`loginctl enable-linger ${user} 2>/dev/null || true`);
    lines.push('systemctl --user daemon-reload');
    lines.push(`systemctl --user enable ${agent.name}-agent.service`);
    lines.push(`systemctl --user start ${agent.name}-agent.service`, '');
  }
  lines.push('echo "✅ Done. Agents deployed."');
  return lines.join('\n');
}

export function hubConfigPath(): string { return path.join(os.homedir(), '.connectome-hub', 'config.json'); }

export async function loadHubConfig(): Promise<Record<string, unknown>> {
  try { return JSON.parse(await fs.readFile(hubConfigPath(), 'utf-8')); } catch { return {}; }
}

export async function saveHubConfig(config: Record<string, unknown>): Promise<void> {
  await fs.mkdir(path.dirname(hubConfigPath()), { recursive: true });
  await fs.writeFile(hubConfigPath(), JSON.stringify(config, null, 2));
}
