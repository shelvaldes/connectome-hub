// recipe-builder.ts — generates official Connectome Host recipes.
// In nomine Sancti Michaelis Archangeli.

import type { Recipe } from './types.js';

export interface AgentOptions {
  name: string;
  systemPrompt: string;
  model?: string;
  timezone?: string;
  port?: number;
}

export function buildRecipe(options: AgentOptions): Recipe {
  const name = options.name;
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    description: `Agent created by Connectome Hub`,
    agent: {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      model: options.model || 'anthropic/claude-haiku-4',
      provider: 'openrouter',
      timezone: options.timezone || 'America/Monterrey',
      systemPrompt: options.systemPrompt,
      maxTokens: 8192,
      contextBudgetTokens: 160000,
      recentWindowTokens: 60000,
      cacheTtl: '1h',
      strategy: {
        type: 'autobiographical',
        adaptiveResolution: true,
        foldingStrategy: 'kv-unified',
        targetChunkTokens: 3000,
        compressionSlackRatio: 0.1,
        mergeThreshold: 6,
        headWindowTokens: 4000,
        recentWindowTokens: 60000,
        maxMessageTokens: 10000,
        compressionModel: options.model || 'anthropic/claude-haiku-4',
        enforceBudget: true,
        overBudgetGraceRatio: 0.35,
        maxSpeculativeL1s: 36,
        summaryParticipant: name
      },
      proseRouting: 'locus'
    },
    modules: {
      webui: {
        port: options.port || 7340,
        host: '127.0.0.1'
      },
      workspace: {
        mounts: [
          { name: 'notes', path: './notes', mode: 'read-write' },
          { name: 'shared', path: '../shared', mode: 'read-write' }
        ]
      },
      heartbeat: true,
      identity: true,
      history: true
    }
  };
}
