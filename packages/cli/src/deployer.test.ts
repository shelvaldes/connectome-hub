import { describe, it, expect } from 'bun:test';
import { buildSystemdUnit, buildLaunchdPlist, buildRemoteScript, buildControlCommand, type AgentSpec, type DeployOptions } from './deployer.js';

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
