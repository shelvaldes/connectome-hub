import { select, input, password } from '@inquirer/prompts';
import chalk from 'chalk';
import { buildRecipe } from './recipe-builder.js';
import { deployLocal, buildRemoteScript, saveHubConfig, type AgentSpec, type DeployOptions } from './deployer.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// In nomine Sancti Michaelis Archangeli
export async function runInit() {
  console.log(chalk.cyan('\n😈 Mike (temporary guide): I\'ll help you set up your first Connectome agent.\n'));

  const target = await select({
    message: 'Where do you want to run your agents?',
    choices: [
      { name: 'Local (this machine)', value: 'local' },
      { name: 'Remote VPS (via SSH)', value: 'remote' }
    ]
  });

  const apiKey = await password({ message: 'OpenRouter API key:' });
  const agentName = await input({ message: 'Name of your first agent:' });
  const agentPersonality = await input({ message: 'Describe your agent\'s personality:' });
  const promptChoice = await select({
    message: 'How do you want to set the system prompt?',
    choices: [
      { name: 'I\'ll paste my own prompt', value: 'manual' },
      { name: 'Generate from personality description', value: 'generated' }
    ]
  });
  const systemPrompt = promptChoice === 'manual'
    ? await input({ message: 'Paste the system prompt:' })
    : `You are ${agentName}. ${agentPersonality}.`;

  const recipe = buildRecipe({ name: agentName, systemPrompt });
  const slug = agentName.toLowerCase().replace(/\s+/g, '-');
  const agent: AgentSpec = { name: slug, recipe, env: { OPENROUTER_API_KEY: apiKey } };

  if (target === 'local') {
    const baseDir = path.join(os.homedir(), '.connectome-hub');
    const dirs = await deployLocal({ target: 'local', baseDir, agents: [agent] });
    await saveHubConfig({ target: 'local', baseDir, agents: [{ name: slug }] });
    console.log(chalk.green(`\n✅ Agent created locally at ${dirs[0]}`));
    console.log(chalk.gray('Next: cd ~/.connectome-hub && bun install, then start the agent.'));
  } else {
    const host = await input({ message: 'VPS IP or hostname:' });
    const user = await input({ message: 'SSH user:', default: 'root' });
    const baseDir = await input({ message: 'Remote install path:', default: '/opt/connectome-hub' });
    const opts: DeployOptions = { target: 'remote', baseDir, remoteHost: host, remoteUser: user, agents: [agent] };
    const script = buildRemoteScript(opts);
    const scriptPath = path.join(os.homedir(), '.connectome-hub', 'deploy.sh');
    await fs.mkdir(path.dirname(scriptPath), { recursive: true });
    await fs.writeFile(scriptPath, script);
    await saveHubConfig({ target: 'remote', baseDir, remoteHost: host, remoteUser: user, agents: [{ name: slug }] });
    console.log(chalk.green(`\n✅ Remote deploy script written to ${scriptPath}`));
    console.log(chalk.gray('Next: scp that script to your VPS and run `bash deploy.sh` there.'));
  }

  console.log(chalk.gray('Mike: my job is done. Passing the torch to your agent. 🍥\n'));
}
