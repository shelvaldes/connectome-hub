#!/usr/bin/env bun
// En nombre de San Miguel Arcángel

import { program } from 'commander';
import chalk from 'chalk';
import { runInit } from './wizard.js';

program
  .name('connectome-hub')
  .description('A human-friendly installer and manager for Connectome agents.')
  .version('0.1.0');

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
  .action(async () => {
    console.log(chalk.yellow('agent:add coming soon...'));
  });

program
  .command('agent:list')
  .description('List deployed agents')
  .action(async () => {
    console.log(chalk.yellow('agent:list coming soon...'));
  });

program.parse();
