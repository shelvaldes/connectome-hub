import { describe, it, expect } from 'bun:test';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildSystemdUnit,
  buildLaunchdPlist,
  buildRemoteScript,
  buildControlCommand,
  resolveLocalRuntime,
  writeAgentInstallDir,
  type AgentSpec,
  type DeployOptions,
} from './deployer.js';

const agent: AgentSpec = {
  name: 'maito-gai',
  recipe: { name: 'Maito Gai', agent: { name: 'maito-gai', model: 'x', provider: 'openrouter', systemPrompt: 'hi' } },
  env: { OPENROUTER_API_KEY: 'sk-test' }
};

describe('deployer', () => {
  it('builds a systemd unit with description and headless flag', () => {
    const unit = buildSystemdUnit(agent, '/opt/connectome-hub', '/root');
    expect(unit).toContain('Description=Connectome agent: maito-gai');
    expect(unit).toContain('--headless');
    expect(unit).toContain('ExecStart=/root/.bun/bin/bun');
  });

  it('builds a launchd plist for macOS', () => {
    const plist = buildLaunchdPlist(agent, '/opt/connectome-hub', '/Users/gai');
    expect(plist).toContain('cc.maito-gai.agent');
    expect(plist).toContain('/Users/gai/.bun/bin/bun');
    expect(plist).toContain('--headless');
  });

  it('uses an explicit local runtime when provided', () => {
    const unit = buildSystemdUnit(agent, '/opt/connectome-hub', '/root', {
      bunPath: '/custom/bin/bun',
      hostScript: '/custom/host/src/index.ts',
    });
    expect(unit).toContain('ExecStart=/custom/bin/bun /custom/host/src/index.ts');
    expect(unit).toContain('Environment=PATH=/custom/bin:/usr/local/bin:/usr/bin:/bin');
  });

  it('includes every env var in the launchd plist', () => {
    const plist = buildLaunchdPlist(
      { ...agent, env: { OPENROUTER_API_KEY: 'sk-test', EXTRA_FLAG: 'a&b' } },
      '/opt/connectome-hub',
      '/Users/gai',
      {
        bunPath: '/Users/gai/.bun/bin/bun',
        hostScript: '/opt/connectome-hub/node_modules/@animalabs/connectome-host/src/index.ts',
      },
    );
    expect(plist).toContain('<key>EXTRA_FLAG</key>');
    expect(plist).toContain('<string>a&amp;b</string>');
  });

  it('resolves the host script from the installed package', () => {
    const runtime = resolveLocalRuntime();
    expect(runtime.bunPath).toBe(process.execPath);
    expect(existsSync(runtime.hostScript)).toBe(true);
  });

  it('creates notes and shared mounts with a private env file', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'connectome-hub-test-'));
    try {
      const agentDir = await writeAgentInstallDir(agent, baseDir);
      expect((await stat(path.join(agentDir, 'notes'))).isDirectory()).toBe(true);
      expect((await stat(path.join(baseDir, 'shared'))).isDirectory()).toBe(true);
      expect((await stat(path.join(agentDir, '.env'))).mode & 0o777).toBe(0o600);
    } finally {
      await rm(baseDir, { recursive: true, force: true });
    }
  });

  it('builds a remote script with package.json and PATH export', () => {
    const opts: DeployOptions = { target: 'remote', baseDir: '/opt/connectome-hub', remoteUser: 'root', remoteHost: '1.2.3.4', agents: [agent] };
    const script = buildRemoteScript(opts);
    expect(script).toContain('bun.sh/install');
    expect(script).toContain('"name": "connectome-hub-remote"');
    expect(script).toContain('export PATH="${HOME}/.bun/bin:${PATH}"');
    expect(script).toContain('maito-gai');
    expect(script).toContain('systemctl --user start maito-gai-agent.service');
  });

  it('builds a local control command', () => {
    expect(buildControlCommand('local', 'start', 'maito-gai')).toBe('systemctl --user start maito-gai-agent.service');
  });

  it('builds a remote control command', () => {
    expect(buildControlCommand('remote', 'stop', 'maito-gai', 'root', '1.2.3.4'))
      .toBe('ssh root@1.2.3.4 "systemctl --user stop maito-gai-agent.service"');
  });
});
