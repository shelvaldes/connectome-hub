import { describe, it, expect } from 'bun:test';
import { formatAgentList } from './commands.js';
import { buildControlCommand } from './deployer.js';

describe('formatAgentList', () => {
  it('formats a list of agents with creation date', () => {
    const out = formatAgentList([{ name: 'maito-gai', createdAt: '2026-10-30T00:00:00Z' }]);
    expect(out).toContain('maito-gai');
    expect(out).toContain('2026-10-30');
  });
  it('returns an empty string for no agents', () => {
    expect(formatAgentList([])).toBe('');
  });
});

describe('buildControlCommand', () => {
  it('builds a local systemd user command', () => {
    expect(buildControlCommand('local', 'start', 'maito-gai')).toBe('systemctl --user start maito-gai-agent.service');
  });
  it('builds a remote SSH command', () => {
    expect(buildControlCommand('remote', 'stop', 'maito-gai', 'root', '1.2.3.4'))
      .toBe('ssh root@1.2.3.4 "systemctl --user stop maito-gai-agent.service"');
  });
});
