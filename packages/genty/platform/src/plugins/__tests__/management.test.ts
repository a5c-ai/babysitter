import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PluginManager } from '../management';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'plugin-mgmt-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// PluginManager
// ---------------------------------------------------------------------------

describe('PluginManager', () => {
  it('returns empty list when no plugins exist', () => {
    const mgr = new PluginManager(tempDir);
    expect(mgr.list()).toEqual([]);
  });

  it('installs a plugin and marks it installed + enabled', () => {
    const mgr = new PluginManager(tempDir);
    const info = mgr.install('my-plugin');
    expect(info.id).toBe('my-plugin');
    expect(info.installed).toBe(true);
    expect(info.enabled).toBe(true);
  });

  it('returns the same info when installing twice', () => {
    const mgr = new PluginManager(tempDir);
    mgr.install('my-plugin');
    const second = mgr.install('my-plugin');
    expect(second.installed).toBe(true);
    expect(second.enabled).toBe(true);
  });

  it('persists state across manager instances', () => {
    const mgr1 = new PluginManager(tempDir);
    mgr1.install('persisted-plugin');

    const mgr2 = new PluginManager(tempDir);
    const info = mgr2.getInfo('persisted-plugin');
    expect(info).toBeDefined();
    expect(info!.installed).toBe(true);
  });

  it('lists installed plugins', () => {
    const mgr = new PluginManager(tempDir);
    mgr.install('alpha');
    mgr.install('beta');
    const list = mgr.list();
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.id).sort()).toEqual(['alpha', 'beta']);
  });

  it('uninstalls a plugin', () => {
    const mgr = new PluginManager(tempDir);
    mgr.install('removable');
    mgr.uninstall('removable');
    const info = mgr.getInfo('removable');
    expect(info).toBeDefined();
    expect(info!.installed).toBe(false);
    expect(info!.enabled).toBe(false);
  });

  it('disables a plugin without uninstalling', () => {
    const mgr = new PluginManager(tempDir);
    mgr.install('toggle-plugin');
    mgr.disable('toggle-plugin');
    const info = mgr.getInfo('toggle-plugin');
    expect(info!.installed).toBe(true);
    expect(info!.enabled).toBe(false);
  });

  it('re-enables a disabled plugin', () => {
    const mgr = new PluginManager(tempDir);
    mgr.install('toggle-plugin');
    mgr.disable('toggle-plugin');
    mgr.enable('toggle-plugin');
    const info = mgr.getInfo('toggle-plugin');
    expect(info!.enabled).toBe(true);
  });

  it('throws when enabling a non-installed plugin', () => {
    const mgr = new PluginManager(tempDir);
    expect(() => mgr.enable('ghost')).toThrow('not installed');
  });

  it('throws when disabling a non-installed plugin', () => {
    const mgr = new PluginManager(tempDir);
    expect(() => mgr.disable('ghost')).toThrow('not installed');
  });

  it('returns undefined for unknown plugin id', () => {
    const mgr = new PluginManager(tempDir);
    expect(mgr.getInfo('unknown')).toBeUndefined();
  });

  it('creates the state directory if it does not exist', () => {
    const nested = join(tempDir, 'deep', 'nested');
    const mgr = new PluginManager(nested);
    mgr.install('nested-plugin');
    const info = mgr.getInfo('nested-plugin');
    expect(info!.installed).toBe(true);
  });
});
