import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageDir, '../../..');
const distEntry = path.join(packageDir, 'dist', 'index.js');
const packageJson = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8')) as {
  exports?: Record<string, unknown>;
};

function runNode(args: string[]): string {
  return execFileSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

describe('@a5c-ai/agent-mux package contract', () => {
  it('declares import and require entry points', () => {
    expect(packageJson.exports).toMatchObject({
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        require: './dist/index.js',
      },
    });
  });

  it('builds the package entry before contract validation', () => {
    expect(existsSync(distEntry)).toBe(true);
  });

  it('loads through import()', () => {
    const stdout = runNode([
      '--input-type=module',
      '-e',
      "const mod = await import('@a5c-ai/agent-mux'); if (typeof mod.createClient !== 'function' || typeof mod.registerBuiltInAdapters !== 'function') { throw new Error('agent-mux import contract failed'); } console.log('ok');",
    ]);

    expect(stdout.trim()).toBe('ok');
  });

  it('loads through require()', () => {
    const stdout = runNode([
      '-e',
      "const mod = require('@a5c-ai/agent-mux'); if (typeof mod.createClient !== 'function' || typeof mod.registerBuiltInAdapters !== 'function') { throw new Error('agent-mux require contract failed'); } console.log('ok');",
    ]);

    expect(stdout.trim()).toBe('ok');
  });
});
