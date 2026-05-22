import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { MemoryTokenStore, SqliteTokenStore } from '../src/index.js';

describe('gateway token stores', () => {
  it('memory token store creates, verifies, lists, touches, and revokes tokens', async () => {
    const store = new MemoryTokenStore();
    const issued = await store.create({ name: 'cli', ttlMs: 60_000 });
    expect(issued.plaintext).toBeTruthy();
    expect((await store.list())[0]).not.toHaveProperty('hash');

    const verified = await store.verify(issued.plaintext);
    expect(verified?.id).toBe(issued.id);

    const touched = await store.touch(issued.id);
    expect(touched).toBe(true);

    const revoked = await store.revoke(issued.id);
    expect(revoked).toBe(true);
    expect(await store.verify(issued.plaintext)).toBeNull();
  });

  it('sqlite token store persists and hides hashes from list()', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-tokens-'));
    const dbPath = path.join(tempDir, 'tokens.db');
    const store = new SqliteTokenStore(dbPath);
    const issued = await store.create({ name: 'browser' });

    const listed = await store.list();
    expect(listed).toHaveLength(1);
    expect(listed[0]).not.toHaveProperty('hash');
    expect((await store.verify(issued.plaintext))?.id).toBe(issued.id);

    store.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('supports creating seeded plaintext bootstrap tokens', async () => {
    const store = new MemoryTokenStore();
    const issued = await store.create({ name: 'bootstrap-admin', plaintext: 'seeded-token-value' });

    expect(issued.plaintext).toBe('seeded-token-value');
    expect((await store.verify('seeded-token-value'))?.id).toBe(issued.id);
  });
});
