// Types that mirror the Connectome Host recipe schema.
// We stay as close as possible to @animalabs/connectome-host/src/recipe.ts

export interface Recipe {
  name: string;
  description?: string;
  agent: AgentConfig;
  modules?: Record<string, unknown>;
  mcpServers?: Record<string, unknown>;
}

export interface AgentConfig {
  name: string;
  model: string;
  provider: string;
  timezone?: string;
  systemPrompt: string;
  maxTokens?: number;
  contextBudgetTokens?: number;
  recentWindowTokens?: number;
  cacheTtl?: string;
  strategy?: Record<string, unknown>;
  proseRouting?: string;
}
