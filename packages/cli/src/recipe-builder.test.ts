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
    expect(recipe.modules?.workspace).toBeDefined();
    expect(recipe.modules?.workspace?.mounts).toHaveLength(2);
  });

  it('uses provided model and port', () => {
    const recipe = buildRecipe({
      name: 'porty',
      systemPrompt: 'hi',
      model: 'deepseek/deepseek-r1',
      port: 7500
    });
    expect(recipe.agent.model).toBe('deepseek/deepseek-r1');
    expect(recipe.modules?.webui?.port).toBe(7500);
  });
});
