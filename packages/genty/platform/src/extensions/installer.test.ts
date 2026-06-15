import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installFromLocal, listInstalled } from './installer.js';

describe('extensions/installer', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'genty-ext-install-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('installs from a local path', () => {
    const extDir = join(tempDir, 'my-extension');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(join(extDir, 'package.json'), JSON.stringify({
      name: '@test/my-extension',
      version: '1.0.0',
      description: 'Test extension',
      main: 'index.js',
    }));
    writeFileSync(join(extDir, 'index.js'), 'module.exports = { activate() {} }');

    const result = installFromLocal(extDir);
    expect(result.manifest.name).toBe('@test/my-extension');
    expect(result.manifest.version).toBe('1.0.0');
    expect(result.source).toEqual({ type: 'local', path: extDir });
    expect(result.installPath).toBe(extDir);
    expect(result.installedAt).toBeTruthy();
  });

  it('throws for missing package.json', () => {
    const emptyDir = join(tempDir, 'empty');
    mkdirSync(emptyDir, { recursive: true });
    expect(() => installFromLocal(emptyDir)).toThrow('No package.json');
  });

  it('reads genty permissions from package.json', () => {
    const extDir = join(tempDir, 'perm-ext');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(join(extDir, 'package.json'), JSON.stringify({
      name: 'perm-ext', version: '1.0.0', main: 'index.js',
      genty: { permissions: ['tools:register', 'events:listen'] },
    }));

    const result = installFromLocal(extDir);
    expect(result.manifest.permissions).toEqual(['tools:register', 'events:listen']);
  });
});
