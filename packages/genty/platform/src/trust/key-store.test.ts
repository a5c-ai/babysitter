import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tempHome: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => tempHome,
  };
});

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), 'genty-keys-test-'));
  vi.resetModules();
});

afterEach(() => {
  rmSync(tempHome, { recursive: true, force: true });
});

describe('key-store', () => {
  it('returns empty list when keys dir does not exist', async () => {
    const { listKeys } = await import('./key-store.js');
    expect(listKeys()).toEqual([]);
  });

  it('generates and stores a key pair', async () => {
    const { generateAndStore, loadKey, getKeysDir } = await import('./key-store.js');
    expect(getKeysDir()).toBe(join(tempHome, '.genty', 'keys'));

    const stored = generateAndStore('agent-1', 'My Agent');
    expect(stored.id).toBe('agent-1');
    expect(stored.label).toBe('My Agent');
    expect(stored.keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(stored.keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
    expect(stored.keyPair.fingerprint).toHaveLength(64);
    expect(stored.createdAt).toBeTruthy();

    const loaded = loadKey('agent-1');
    expect(loaded).toEqual(stored);
  });

  it('returns undefined for missing key', async () => {
    const { loadKey } = await import('./key-store.js');
    expect(loadKey('nonexistent')).toBeUndefined();
  });

  it('loadOrCreate creates if missing, returns existing if present', async () => {
    const { loadOrCreate } = await import('./key-store.js');
    const first = loadOrCreate('auto-key', 'Auto');
    const second = loadOrCreate('auto-key', 'Auto');
    expect(second.keyPair.fingerprint).toBe(first.keyPair.fingerprint);
    expect(second.createdAt).toBe(first.createdAt);
  });

  it('lists all stored keys', async () => {
    const { generateAndStore, listKeys } = await import('./key-store.js');
    generateAndStore('k1');
    generateAndStore('k2');
    generateAndStore('k3');
    const keys = listKeys();
    expect(keys).toHaveLength(3);
    expect(keys.map(k => k.id).sort()).toEqual(['k1', 'k2', 'k3']);
  });

  it('deletes a key', async () => {
    const { generateAndStore, deleteKey, loadKey } = await import('./key-store.js');
    generateAndStore('del-me');
    expect(deleteKey('del-me')).toBe(true);
    expect(loadKey('del-me')).toBeUndefined();
    expect(deleteKey('del-me')).toBe(false);
  });
});
