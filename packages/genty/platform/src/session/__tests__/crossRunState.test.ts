import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCrossRunStateStore } from '../crossRunState';

describe('crossRunState', () => {
  let tempDir: string;

  beforeEach(() => { tempDir = mkdtempSync(join(tmpdir(), 'cross-run-')); });
  afterEach(() => { rmSync(tempDir, { recursive: true, force: true }); });

  it('stores and retrieves values', () => {
    const store = createCrossRunStateStore(tempDir);
    store.set('memory:facts', ['TS strict mode']);
    expect(store.get('memory:facts')).toEqual(['TS strict mode']);
  });

  it('returns undefined for missing keys', () => {
    const store = createCrossRunStateStore(tempDir);
    expect(store.get('missing')).toBeUndefined();
  });

  it('deletes keys', () => {
    const store = createCrossRunStateStore(tempDir);
    store.set('k', 'v');
    expect(store.delete('k')).toBe(true);
    expect(store.get('k')).toBeUndefined();
    expect(store.delete('k')).toBe(false);
  });

  it('lists all keys', () => {
    const store = createCrossRunStateStore(tempDir);
    store.set('a', 1);
    store.set('b:nested', 2);
    expect(store.listKeys().sort()).toEqual(['a', 'b:nested']);
  });

  it('persists across store instances', () => {
    const store1 = createCrossRunStateStore(tempDir);
    store1.set('persist', 'yes');
    const store2 = createCrossRunStateStore(tempDir);
    expect(store2.get('persist')).toBe('yes');
  });
});
