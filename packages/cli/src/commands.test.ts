import { describe, it, expect } from 'bun:test';
import { formatAgentList } from './commands.js';

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
