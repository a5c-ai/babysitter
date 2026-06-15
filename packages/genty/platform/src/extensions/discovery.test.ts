import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverExtensions, activateDiscoveredExtensions } from './discovery.js';
import { ExtensionRegistry } from '@a5c-ai/genty-core/extensions';

describe('extensions/discovery', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'genty-ext-disc-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function createExtension(name: string, opts?: { noMain?: boolean; noName?: boolean }) {
    const dir = join(tempDir, name);
    mkdirSync(dir, { recursive: true });
    const pkg: Record<string, unknown> = {
      version: '1.0.0',
      main: 'index.js',
    };
    if (!opts?.noName) pkg.name = `@test/${name}`;
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
    if (!opts?.noMain) {
      writeFileSync(join(dir, 'index.js'),
        `module.exports = { name: '${name}', activate(ctx) { ctx.registerCommand('hello', () => {}); } };`);
    }
  }

  it('discovers extensions with valid package.json and main', () => {
    createExtension('ext-a');
    createExtension('ext-b');
    const found = discoverExtensions(tempDir);
    expect(found).toHaveLength(2);
    expect(found.map(e => e.manifest.name).sort()).toEqual(['@test/ext-a', '@test/ext-b']);
  });

  it('skips extensions with missing main file', () => {
    createExtension('no-main', { noMain: true });
    const found = discoverExtensions(tempDir);
    expect(found).toHaveLength(0);
  });

  it('skips extensions with invalid package.json', () => {
    createExtension('no-name', { noName: true });
    const found = discoverExtensions(tempDir);
    expect(found).toHaveLength(0);
  });

  it('returns empty for nonexistent directory', () => {
    expect(discoverExtensions(join(tempDir, 'nope'))).toEqual([]);
  });

  it('activates discovered extensions into registry', async () => {
    createExtension('act-ext');
    const registry = new ExtensionRegistry();
    const result = await activateDiscoveredExtensions(registry, tempDir);
    expect(result.activated).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    // The module registers as 'act-ext' (its name field), while activated tracks manifest name
    expect(registry.getExtensionNames()).toContain('act-ext');
  });

  it('reports failed activations', async () => {
    createExtension('bad-ext', { noMain: true });
    // Create main that won't work as extension module
    mkdirSync(join(tempDir, 'bad-ext'), { recursive: true });
    writeFileSync(join(tempDir, 'bad-ext', 'index.js'), 'module.exports = {};');
    // Fix pkg to have a name so it's discovered
    writeFileSync(join(tempDir, 'bad-ext', 'package.json'), JSON.stringify({
      name: '@test/bad-ext', version: '1.0.0', main: 'index.js',
    }));

    const registry = new ExtensionRegistry();
    const result = await activateDiscoveredExtensions(registry, tempDir);
    expect(result.failed).toContain('@test/bad-ext');
    expect(result.activated).toHaveLength(0);
  });
});
