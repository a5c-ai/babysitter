import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  readFilesParallel,
  writeFilesParallel,
  globParallel,
} from '../parallelFileOps';

// ---------------------------------------------------------------------------
// Temp directory helpers
// ---------------------------------------------------------------------------

let testDir: string;

async function makeTestDir(): Promise<string> {
  return fs.mkdtemp(join(tmpdir(), 'par-file-ops-'));
}

beforeEach(async () => {
  testDir = await makeTestDir();
});

afterEach(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// readFilesParallel
// ---------------------------------------------------------------------------

describe('readFilesParallel', () => {
  it('reads multiple files concurrently', async () => {
    const a = join(testDir, 'a.txt');
    const b = join(testDir, 'b.txt');
    await fs.writeFile(a, 'alpha', 'utf-8');
    await fs.writeFile(b, 'beta', 'utf-8');

    const results = await readFilesParallel([a, b]);
    expect(results).toHaveLength(2);
    expect(results[0].content).toBe('alpha');
    expect(results[1].content).toBe('beta');
  });

  it('returns error for missing files without throwing', async () => {
    const missing = join(testDir, 'nope.txt');
    const results = await readFilesParallel([missing]);
    expect(results[0].error).toBeDefined();
    expect(results[0].content).toBeUndefined();
  });

  it('preserves order of input paths', async () => {
    const files = ['c.txt', 'a.txt', 'b.txt'];
    for (const f of files) {
      await fs.writeFile(join(testDir, f), f, 'utf-8');
    }
    const paths = files.map((f) => join(testDir, f));
    const results = await readFilesParallel(paths, 1);
    expect(results.map((r) => r.path)).toEqual(paths);
  });

  it('respects concurrency limit', async () => {
    // With concurrency=1, execution is effectively serial
    const f = join(testDir, 'single.txt');
    await fs.writeFile(f, 'data', 'utf-8');
    const results = await readFilesParallel([f], 1);
    expect(results[0].content).toBe('data');
  });
});

// ---------------------------------------------------------------------------
// writeFilesParallel
// ---------------------------------------------------------------------------

describe('writeFilesParallel', () => {
  it('writes multiple files concurrently', async () => {
    const entries = [
      { path: join(testDir, 'x.txt'), content: 'X' },
      { path: join(testDir, 'y.txt'), content: 'Y' },
    ];
    const results = await writeFilesParallel(entries);
    expect(results.every((r) => r.ok)).toBe(true);

    const xContent = await fs.readFile(entries[0].path, 'utf-8');
    expect(xContent).toBe('X');
  });

  it('creates parent directories as needed', async () => {
    const nested = join(testDir, 'deep', 'nested', 'file.txt');
    const results = await writeFilesParallel([{ path: nested, content: 'deep' }]);
    expect(results[0].ok).toBe(true);
    const content = await fs.readFile(nested, 'utf-8');
    expect(content).toBe('deep');
  });

  it('reports errors without throwing', async () => {
    // Writing to a path where a directory already exists as a file
    const blocker = join(testDir, 'blocker');
    await fs.writeFile(blocker, 'occupied', 'utf-8');
    const impossible = join(blocker, 'sub', 'file.txt');
    const results = await writeFilesParallel([{ path: impossible, content: 'nope' }]);
    expect(results[0].ok).toBe(false);
    expect(results[0].error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// globParallel
// ---------------------------------------------------------------------------

describe('globParallel', () => {
  it('matches files by pattern', async () => {
    await fs.writeFile(join(testDir, 'foo.ts'), '', 'utf-8');
    await fs.writeFile(join(testDir, 'bar.ts'), '', 'utf-8');
    await fs.writeFile(join(testDir, 'baz.js'), '', 'utf-8');

    const matches = await globParallel(['*.ts'], testDir);
    expect(matches).toHaveLength(2);
    expect(matches.every((m) => m.endsWith('.ts'))).toBe(true);
  });

  it('deduplicates across multiple patterns', async () => {
    await fs.writeFile(join(testDir, 'shared.ts'), '', 'utf-8');
    const matches = await globParallel(['*.ts', 'shared.*'], testDir);
    expect(matches).toHaveLength(1);
  });

  it('matches nested files with **/', async () => {
    await fs.mkdir(join(testDir, 'sub'), { recursive: true });
    await fs.writeFile(join(testDir, 'sub', 'deep.ts'), '', 'utf-8');
    await fs.writeFile(join(testDir, 'top.ts'), '', 'utf-8');

    const matches = await globParallel(['**/*.ts'], testDir);
    expect(matches).toHaveLength(2);
  });

  it('returns empty for no matches', async () => {
    const matches = await globParallel(['*.xyz'], testDir);
    expect(matches).toEqual([]);
  });
});
