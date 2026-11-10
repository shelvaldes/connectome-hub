import { describe, it, expect } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { findHubRoot } from './update.js';

describe('findHubRoot', () => {
  it('finds the repository root from the CLI source', () => {
    const root = findHubRoot();
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'packages', 'cli', 'src', 'index.ts'))).toBe(true);
  });
});
