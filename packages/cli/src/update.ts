// update.ts — updates the Connectome Hub checkout in place.
// In nomine Sancti Michaelis Archangeli.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

function git(dir: string, args: string[]): string {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf-8' });
}

export function findHubRoot(): string {
  let dir = import.meta.dir;
  for (let i = 0; i < 6; i += 1) {
    try {
      const root = git(dir, ['rev-parse', '--show-toplevel']).trim();
      if (root) return root;
    } catch {
      // Keep walking up until we find the checkout.
    }
    dir = path.dirname(dir);
  }
  throw new Error('No se encontró el checkout de git de Connectome Hub.');
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} ${args.join(' ')} falló con código ${result.status ?? 'desconocido'}.`);
  }
}

export async function updateHub(): Promise<void> {
  try {
    const root = findHubRoot();
    const dirty = git(root, ['status', '--porcelain'])
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => !/\sbun\.lock$/.test(line));

    if (dirty.length > 0) {
      console.error(chalk.red('\nHay cambios locales. Haz commit o stash antes de actualizar:'));
      for (const line of dirty) console.error(chalk.gray(`  ${line}`));
      process.exitCode = 1;
      return;
    }

    if (git(root, ['status', '--porcelain']).includes('bun.lock')) {
      git(root, ['checkout', '--', 'bun.lock']);
    }

    console.log(chalk.cyan('\nActualizando Connectome Hub...\n'));
    run('git', ['-C', root, 'pull', '--ff-only'], root);
    run(process.execPath, ['install'], root);
    run(process.execPath, ['link'], path.join(root, 'packages', 'cli'));

    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8')) as { version?: string };
    console.log(chalk.green(`\nConnectome Hub actualizado a v${pkg.version ?? 'desconocida'}.`));
    console.log(chalk.gray('Si el runtime cambió, reinicia tus agentes: chub agent:stop && chub agent:start'));
  } catch (err) {
    console.error(chalk.red(`\nNo se pudo actualizar: ${(err as Error).message}`));
    process.exitCode = 1;
  }
}
