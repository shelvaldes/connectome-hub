#!/usr/bin/env bun
// In nomine Sancti Michaelis Archangeli

import { program } from 'commander';
import chalk from 'chalk';
import { runInit } from './wizard.js';
import { addAgent, listAgents, startAgents, stopAgents, restartAgents } from './commands.js';
import { updateHub } from './update.js';

program
  .name('chub')
  .description('A human-friendly installer and manager for Connectome agents.')
  .version('0.1.9');

program
  .command('init')
  .description('Start the interactive wizard to install Connectome agents')
  .action(async () => {
    console.log(chalk.cyan('\n🍥 Connectome Hub — installer for the Anima Research stack\n'));
    await runInit();
  });

program
  .command('agent:add')
  .description('Add a new agent to an existing Connectome Hub setup')
  .action(addAgent);

program
  .command('agent:list')
  .description('List deployed agents')
  .action(listAgents);

program
  .command('agent:start')
  .argument('[name]', 'agent name (omit to pick interactively)')
  .description('Start one agent or all')
  .action(startAgents);

program
  .command('agent:stop')
  .argument('[name]', 'agent name (omit to pick interactively)')
  .description('Stop one agent or all')
  .action(stopAgents);

program
  .command('agent:restart')
  .argument('[name]', 'agent name (omit to pick interactively)')
  .description('Restart one agent or all, reloading its recipe')
  .action(restartAgents);

program
  .command('update')
  .description('Update Connectome Hub from its git checkout')
  .action(updateHub);

program
  .command('gemini-bridge')
  .description('Run the native Gemini bridge (safety filters off)')
  .action(async () => {
    await import('./gemini-bridge.js');
  });

program.parse();

program.parse();
