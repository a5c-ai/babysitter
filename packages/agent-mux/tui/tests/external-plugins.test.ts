import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadExternalPlugins } from '../src/external-plugins.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-tui-ext-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadExternalPlugins', () => {
  it('returns empty when dir does not exist', async () => {
    const r = await loadExternalPlugins(path.join(tmpDir, 'missing'));
    expect(r.plugins).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  it('loads default-export plugin from a flat .mjs file', async () => {
    const file = path.join(tmpDir, 'my-plugin.mjs');
    fs.writeFileSync(
      file,
      `export default { name: 'user:hello', register(ctx) { ctx.__hit = true; } };\n`,
      'utf8',
    );
    const r = await loadExternalPlugins(tmpDir);
    expect(r.errors).toEqual([]);
    expect(r.plugins).toHaveLength(1);
    expect(r.plugins[0]!.name).toBe('user:hello');
  });

  it('loads named-export plugins from index.mjs in subdir', async () => {
    const sub = path.join(tmpDir, 'pkg');
    fs.mkdirSync(sub);
    fs.writeFileSync(
      path.join(sub, 'index.mjs'),
      `export const a = { name: 'user:a', register() {} };
       export const b = { name: 'user:b', register() {} };\n`,
      'utf8',
    );
    const r = await loadExternalPlugins(tmpDir);
    expect(r.errors).toEqual([]);
    expect(r.plugins.map((p) => p.name).sort()).toEqual(['user:a', 'user:b']);
  });

  it('reports errors for files with no plugin export', async () => {
    const file = path.join(tmpDir, 'bad.mjs');
    fs.writeFileSync(file, `export const notAPlugin = 42;\n`, 'utf8');
    const r = await loadExternalPlugins(tmpDir);
    expect(r.plugins).toEqual([]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]!.error).toMatch(/no TuiPlugin export/);
  });

  it('reports import errors without crashing', async () => {
    const file = path.join(tmpDir, 'broken.mjs');
    fs.writeFileSync(file, `this is not valid javascript ===\n`, 'utf8');
    const r = await loadExternalPlugins(tmpDir);
    expect(r.plugins).toEqual([]);
    expect(r.errors).toHaveLength(1);
  });
});
