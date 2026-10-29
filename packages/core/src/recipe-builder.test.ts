import { describe, it, expect } from 'bun:test';
import { buildRecipe } from './recipe-builder.js';

describe('buildRecipe', () => {
  it('creates a valid Connectome Host recipe', () => {
    const recipe = buildRecipe({
      name: 'test-agent',
      systemPrompt: 'You are a test agent.',
    });

    expect(recipe.name).toBe('Test-agent');
    expect(recipe.agent.name).toBe('test-agent');
    expect(recipe.agent.model).toBe('anthropic/claude-haiku-4');
    expect(recipe.agent.provider).toBe('openrouter');
    expect(recipe.agent.systemPrompt).toBe('You are a test agent.');
    expect(recipe.agent.strategy?.type).toBe('autobiographical');
    expect(recipe.modules?.webui).toBeDefined();
  });

  it('normalizes uppercase names to kebab-case keys but title display names', () => {
    const recipe = buildRecipe({
      name: 'MAITO GAI',
      systemPrompt: 'You are a test agent.',
      model: 'deepseek/deepseek-r1'
    });

    expect(recipe.agent.name).toBe('maito-gai');
    expect(recipe.agent.model).toBe('deepseek/deepseek-r1');
  });
});
