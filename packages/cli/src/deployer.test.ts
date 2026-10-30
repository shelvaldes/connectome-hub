import { describe, it, expect } from 'bun:test';
import { buildSystemdUnit, buildRemoteScript, type AgentSpec, type DeployOptions } from './deployer.js';

const agent: AgentSpec = {
  name: 'maito-gai',
  recipe: { name: 'Maito Gai', agent: { name: 'maito-gai', model: 'x', provider: 'openrouter', systemPrompt: 'hi' } },
  env: { OPENROUTER_API_KEY: 'sk-test' }
};

describe('deployer', () => {
  it('builds a systemd unit named <agent>-agent.service', () => {
    const unit = buildSystemdUnit(agent, '/opt/connectome-hub', '/root');
    expect(unit).toContain('maito-gai-agent.service');
    expect(unit).toContain('--headless');
  });

  it('builds a remote script with install steps', () => {
    const opts: DeployOptions = { target: 'remote', baseDir: '/opt/connectome-hub', remoteUser: 'root', remoteHost: '1.2.3.4', agents: [agent] };
    const script = buildRemoteScript(opts);
    expect(script).toContain('bun.sh/install');
    expect(script).toContain('maito-gai');
    expect(script).toContain('systemctl --user start maito-gai-agent.service');
  });
});
