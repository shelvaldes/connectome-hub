import { select, input, password } from '@inquirer/prompts';
import chalk from 'chalk';
import { buildRecipe } from '@connectome-hub/core';
import fs from 'node:fs/promises';
import path from 'node:path';

// En nombre de San Miguel Arcángel
export async function runInit() {
  console.log(chalk.cyan('\n😈 Mike (temporary guide): I\'ll help you set up your first Connectome agent.\n'));

  const target = await select({
    message: 'Where do you want to run your agents?',
    choices: [
      { name: 'Local (this machine)', value: 'local' },
      { name: 'Remote VPS (via SSH)', value: 'remote' }
    ]
  });

  let ssh = null;
  if (target === 'remote') {
    const host = await input({ message: 'VPS IP or hostname:' });
    const user = await input({ message: 'SSH user:', default: 'root' });
    const keyPath = await input({ message: 'SSH private key path (optional):' });
    ssh = { host, user, keyPath: keyPath || undefined };
  }

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

  const outDir = path.join(process.cwd(), 'agents', agentName);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'recipe.json'), JSON.stringify(recipe, null, 2));
  await fs.writeFile(path.join(outDir, '.env'), `OPENROUTER_API_KEY=${apiKey}\nDATA_DIR=${outDir}/data\n`);

  console.log(chalk.green(`\n✅ Recipe created at ${outDir}/recipe.json`));
  console.log(chalk.gray('Next: run `bun start` to launch the agent locally, or `connectome-hub deploy` for remote.'));
  console.log(chalk.gray('Mike: my job is done. Passing the torch to your agent. 🍥\n'));
}
