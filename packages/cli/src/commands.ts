// commands.ts — comandos agent:add y agent:list con persistencia en hub config.
// En nombre de San Miguel Arcángel.

import { select, input, password } from '@inquirer/prompts';
import chalk from 'chalk';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { buildRecipe } from './recipe-builder.js';
import {
  loadHubConfig,
  saveHubConfig,
  writeAgentInstallDir,
  buildRemoteScript,
  type AgentSpec,
  type DeployOptions
} from './deployer.js';

export interface AgentRecord {
  name: string;
  createdAt: string;
}

const MODEL_CHOICES = [
  { name: 'Claude Haiku 4 (cheap / fast)', value: 'anthropic/claude-haiku-4' },
  { name: 'Claude Sonnet 4 (balanced)', value: 'anthropic/claude-sonnet-4' },
  { name: 'DeepSeek R1 (reasoning)', value: 'deepseek/deepseek-r1' },
  { name: 'Gemini 2.5 Flash (Google)', value: 'google/gemini-2.5-flash-preview-04-17' }
];

export async function addAgent(): Promise<void> {
  const config = await loadHubConfig();
  if (!config.target) {
    console.log(chalk.yellow('No hub configured yet. Run `connectome-hub init` first.'));
    return;
  }

  const apiKey = await password({ message: 'OpenRouter API key:' });
  const name = await input({ message: 'Name of your new agent:' });
  const personality = await input({ message: "Describe your agent's personality:" });
  const model = await select({ message: 'Which model?', choices: MODEL_CHOICES });
  const promptChoice = await select({
    message: 'How do you want to set the system prompt?',
    choices: [
      { name: "I'll paste my own prompt", value: 'manual' },
      { name: 'Generate from personality description', value: 'generated' }
    ]
  });
  const systemPrompt = promptChoice === 'manual'
    ? await input({ message: 'Paste the system prompt:' })
    : `You are ${name}. ${personality}.`;

  const recipe = buildRecipe({ name, systemPrompt, model });
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const agentSpec: AgentSpec = { name: slug, recipe, env: { OPENROUTER_API_KEY: apiKey } };

  if (config.target === 'local') {
    const baseDir = config.baseDir as string;
    const dir = await writeAgentInstallDir(agentSpec, baseDir);
    console.log(chalk.green(`\n✅ Agent created at ${dir}`));
  } else {
    const baseDir = config.baseDir as string;
    const opts: DeployOptions = {
      target: 'remote', baseDir,
      remoteHost: config.remoteHost as string,
      remoteUser: config.remoteUser as string,
      agents: [agentSpec]
    };
    const script = buildRemoteScript(opts);
    const scriptPath = path.join(os.homedir(), '.connectome-hub', `deploy-${slug}.sh`);
    await fs.mkdir(path.dirname(scriptPath), { recursive: true });
    await fs.writeFile(scriptPath, script);
    console.log(chalk.green(`\n✅ Remote deploy script written to ${scriptPath}`));
    console.log(chalk.gray(`Copy it to your VPS and run: bash deploy-${slug}.sh`));
  }

  const agents = (config.agents as AgentRecord[]) || [];
  agents.push({ name: slug, createdAt: new Date().toISOString() });
  await saveHubConfig({ ...config, agents });
  console.log(chalk.green(`\n✅ Agent "${slug}" added to your hub.\n`));
}

export function formatAgentList(agents: AgentRecord[]): string {
  if (agents.length === 0) return '';
  return agents.map(a => `  • ${a.name}${a.createdAt ? '  (created ' + a.createdAt + ')' : ''}`).join('\n');
}

export async function listAgents(): Promise<void> {
  const config = await loadHubConfig();
  const agents = (config.agents as AgentRecord[]) || [];
  if (agents.length === 0) {
    console.log(chalk.yellow('No agents yet. Run `connectome-hub init` first.'));
    return;
  }
  console.log(chalk.cyan(`\n🍥 ${agents.length} agent(s) in your hub:\n`));
  console.log(formatAgentList(agents) + '\n');
}
