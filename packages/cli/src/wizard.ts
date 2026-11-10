import { select, input, password } from '@inquirer/prompts';
import chalk from 'chalk';
import { buildRecipe } from './recipe-builder.js';
import { deployLocal, buildRemoteScript, loadHubConfig, saveHubConfig, type AgentSpec, type DeployOptions } from './deployer.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// In nomine Sancti Michaelis Archangeli
export async function runInit() {
  console.log(chalk.cyan('\n😇 Mike (temporary guide): I\'ll help you set up your first Connectome agent.\n'));

  const target = await select({
    message: 'Where do you want to run your agents?',
    choices: [
      { name: 'Local (this machine)', value: 'local' },
      { name: 'Remote VPS (via SSH)', value: 'remote' }
    ]
  });

  const apiKey = await password({ message: 'OpenRouter API key:' });
  const agentName = await input({ message: 'Name of your first agent:' });
  const agentPersonality = await input({ message: "Describe your agent's personality:" });
  const model = await input({
    message: 'OpenRouter model ID (provider/model):',
    default: 'anthropic/claude-haiku-4'
  });
  const promptChoice = await select({
    message: 'How do you want to set the system prompt?',
    choices: [
      { name: "I'll paste my own prompt", value: 'manual' },
      { name: 'Generate from personality description', value: 'generated' }
    ]
  });
  const systemPrompt = promptChoice === 'manual'
    ? await input({ message: 'Paste the system prompt:' })
    : `You are ${agentName}. ${agentPersonality}.`;

  const previous = await loadHubConfig();
  const previousAgents = previous.target === target && Array.isArray(previous.agents)
    ? previous.agents as Array<{ name: string; createdAt?: string }>
    : [];
  const port = 7340 + previousAgents.length;
  const recipe = buildRecipe({ name: agentName, systemPrompt, model, port });
  const slug = agentName.toLowerCase().replace(/\s+/g, '-');
  const agent: AgentSpec = { name: slug, recipe, env: { OPENROUTER_API_KEY: apiKey } };
  const nextAgents = previousAgents.some(a => a.name === slug)
    ? previousAgents
    : [...previousAgents, { name: slug, createdAt: new Date().toISOString() }];

  if (target === 'local') {
    const baseDir = path.join(os.homedir(), '.connectome-hub');
    const result = await deployLocal({ target: 'local', baseDir, agents: [agent] });
    await saveHubConfig({ ...previous, target: 'local', baseDir, agents: nextAgents });
    if (result.started.includes(slug)) {
      console.log(chalk.green(`\n✅ Agent installed and started at ${result.dirs[0]}`));
      console.log(chalk.gray('Use `chub agent:stop` or `chub agent:start` to control it.'));
    } else {
      console.log(chalk.green(`\n✅ Agent files written to ${result.dirs[0]}`));
      console.log(chalk.yellow('It could not be started automatically.'));
    }
  } else {
    const host = await input({ message: 'VPS IP or hostname:' });
    const user = await input({ message: 'SSH user:', default: 'root' });
    const baseDir = await input({ message: 'Remote install path:', default: '/opt/connectome-hub' });
    const opts: DeployOptions = { target: 'remote', baseDir, remoteHost: host, remoteUser: user, agents: [agent] };
    const script = buildRemoteScript(opts);
    const scriptPath = path.join(os.homedir(), '.connectome-hub', 'deploy.sh');
    await fs.mkdir(path.dirname(scriptPath), { recursive: true });
    await fs.writeFile(scriptPath, script);
    await saveHubConfig({ ...previous, target: 'remote', baseDir, remoteHost: host, remoteUser: user, agents: nextAgents });
    console.log(chalk.green(`\n✅ Remote deploy script written to ${scriptPath}`));
    console.log(chalk.gray('Next: scp that script to your VPS and run `bash deploy.sh` there.'));
  }

  console.log(chalk.gray('Mike: my job is done. Passing the torch to your agent. 🍥\n'));
}
