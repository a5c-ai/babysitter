import { describe, it, expect, beforeEach } from 'vitest';
import { PluginSandbox } from '../sandbox';
import { PluginLoader } from '../loader';
import { PluginVersionChecker } from '../version-check';
import type { PluginManifest } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    permissions: ['fs:read'],
    entrypoint: './index.js',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PluginSandbox
// ---------------------------------------------------------------------------

describe('PluginSandbox', () => {
  let sandbox: PluginSandbox;

  beforeEach(() => {
    sandbox = new PluginSandbox();
  });

  it('grant/check/revoke permission lifecycle', () => {
    sandbox.grantPermission('p1', 'fs:read');
    expect(sandbox.checkPermission('p1', 'fs:read')).toBe(true);

    sandbox.revokePermission('p1', 'fs:read');
    expect(sandbox.checkPermission('p1', 'fs:read')).toBe(false);
  });

  it('isAllowed with fs:read permission allows read action', () => {
    sandbox.grantPermission('p1', 'fs:read');
    expect(sandbox.isAllowed('p1', 'read')).toBe(true);
  });

  it('isAllowed denies unpermitted action', () => {
    // No permissions granted at all
    expect(sandbox.isAllowed('p1', 'write')).toBe(false);
  });

  it('isAllowed denies unknown action', () => {
    sandbox.grantPermission('p1', 'fs:read');
    expect(sandbox.isAllowed('p1', 'unknown-action')).toBe(false);
  });

  it('getPermissions returns all granted permissions', () => {
    sandbox.grantPermission('p1', 'fs:read');
    sandbox.grantPermission('p1', 'fs:write');
    sandbox.grantPermission('p1', 'net:outbound');

    const perms = sandbox.getPermissions('p1');
    expect(perms).toHaveLength(3);
    expect(perms).toContain('fs:read');
    expect(perms).toContain('fs:write');
    expect(perms).toContain('net:outbound');
  });

  it('getPermissions returns empty array for unknown plugin', () => {
    expect(sandbox.getPermissions('ghost')).toEqual([]);
  });

  it('isAllowed enforces allowedPaths for filesystem operations', () => {
    sandbox.grantPermission('p1', 'fs:read');
    sandbox.setConfig('p1', { allowedPaths: ['/safe/dir'] });

    expect(sandbox.isAllowed('p1', 'read', '/safe/dir/file.txt')).toBe(true);
    expect(sandbox.isAllowed('p1', 'read', '/unsafe/dir/file.txt')).toBe(false);
  });

  it('clear removes all state for a plugin', () => {
    sandbox.grantPermission('p1', 'fs:read');
    sandbox.setConfig('p1', { maxMemoryMb: 128 });

    sandbox.clear('p1');
    expect(sandbox.checkPermission('p1', 'fs:read')).toBe(false);
    expect(sandbox.getConfig('p1')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PluginLoader
// ---------------------------------------------------------------------------

describe('PluginLoader', () => {
  let loader: PluginLoader;

  beforeEach(() => {
    loader = new PluginLoader();
  });

  it('load sets status to loaded for valid manifest', () => {
    const instance = loader.load(makeManifest());
    expect(instance.status).toBe('loaded');
    expect(instance.loadedAt).toBeDefined();
    expect(instance.error).toBeUndefined();
  });

  it('load sets status to error for invalid manifest', () => {
    const instance = loader.load(makeManifest({ id: '' }));
    expect(instance.status).toBe('error');
    expect(instance.error).toContain('missing id');
  });

  it('unload sets status to unloaded', () => {
    loader.load(makeManifest({ id: 'x' }));
    const unloaded = loader.unload('x');
    expect(unloaded).toBe(true);

    const instance = loader.get('x');
    expect(instance!.status).toBe('unloaded');
    expect(instance!.loadedAt).toBeUndefined();
  });

  it('unload returns false for unknown plugin', () => {
    expect(loader.unload('nonexistent')).toBe(false);
  });

  it('reload cycles status through unloaded then back to loaded', () => {
    loader.load(makeManifest({ id: 'y' }));
    const reloaded = loader.reload('y');
    expect(reloaded).toBeDefined();
    expect(reloaded!.status).toBe('loaded');
  });

  it('reload returns undefined for unknown plugin', () => {
    expect(loader.reload('ghost')).toBeUndefined();
  });

  it('list returns all instances', () => {
    loader.load(makeManifest({ id: 'a', name: 'A' }));
    loader.load(makeManifest({ id: 'b', name: 'B' }));

    const all = loader.list();
    expect(all).toHaveLength(2);
    expect(all.map((i) => i.manifest.id).sort()).toEqual(['a', 'b']);
  });

  it('isLoaded returns true only for loaded plugins', () => {
    loader.load(makeManifest({ id: 'loaded-one' }));
    loader.load(makeManifest({ id: 'unloaded-one' }));
    loader.unload('unloaded-one');

    expect(loader.isLoaded('loaded-one')).toBe(true);
    expect(loader.isLoaded('unloaded-one')).toBe(false);
    expect(loader.isLoaded('nonexistent')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PluginVersionChecker
// ---------------------------------------------------------------------------

describe('PluginVersionChecker', () => {
  let checker: PluginVersionChecker;

  beforeEach(() => {
    checker = new PluginVersionChecker();
  });

  it('compatible returns true for matching version', () => {
    const result = checker.checkCompatibility(
      makeManifest({ minPlatformVersion: '2.0.0' }),
      '2.1.0',
    );
    expect(result.compatible).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('compatible returns true for exact version match', () => {
    const result = checker.checkCompatibility(
      makeManifest({ minPlatformVersion: '3.5.2' }),
      '3.5.2',
    );
    expect(result.compatible).toBe(true);
  });

  it('incompatible returns false with issues', () => {
    const result = checker.checkCompatibility(
      makeManifest({ minPlatformVersion: '5.0.0' }),
      '4.9.9',
    );
    expect(result.compatible).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]).toContain('requires platform');
  });

  it('no minPlatformVersion always compatible', () => {
    const result = checker.checkCompatibility(
      makeManifest({ minPlatformVersion: undefined }),
      '1.0.0',
    );
    expect(result.compatible).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('invalid minPlatformVersion string returns incompatible', () => {
    const result = checker.checkCompatibility(
      makeManifest({ minPlatformVersion: 'not-a-version' }),
      '2.0.0',
    );
    expect(result.compatible).toBe(false);
    expect(result.issues[0]).toContain('Invalid minPlatformVersion');
  });
});
