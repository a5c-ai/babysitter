/**
 * Tests for atomic-fs: concurrent writers don't corrupt, reads during writes
 * see either old or new bytes (never torn), and stale lockfiles are reclaimed.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { writeFileAtomic, writeJsonAtomic } from '../src/atomic-fs.js';

async function tmpdir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'amux-atomic-'));
}

describe('atomic-fs', () => {
  it('writeJsonAtomic round-trips and creates parent dirs', async () => {
    const dir = await tmpdir();
    const p = path.join(dir, 'nested', 'cfg.json');
    await writeJsonAtomic(p, { a: 1, b: 'two' });
    const raw = await fs.readFile(p, 'utf8');
    expect(JSON.parse(raw)).toEqual({ a: 1, b: 'two' });
  });

  it('writeFileAtomic is atomic: concurrent writers produce one valid final state', async () => {
    const dir = await tmpdir();
    const p = path.join(dir, 'data.json');
    const writers = Array.from({ length: 8 }, (_, i) =>
      writeJsonAtomic(p, { writer: i, payload: 'x'.repeat(200) }),
    );
    await Promise.all(writers);
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw);
    expect(typeof parsed.writer).toBe('number');
    expect(parsed.payload).toBe('x'.repeat(200));
    // Lockfile cleaned up.
    await expect(fs.access(`${p}.lock`)).rejects.toBeTruthy();
  });

  it(
    'concurrent reads during writes never see a torn file',
    async () => {
    const dir = await tmpdir();
    const p = path.join(dir, 'big.json');
    // Seed with a valid baseline so readers always find *something*.
    await writeJsonAtomic(p, { v: 0 });
    let stopped = false;
    const seenBad: string[] = [];
    const reader = (async () => {
      while (!stopped) {
        try {
          const raw = await fs.readFile(p, 'utf8');
          JSON.parse(raw);
        } catch (err) {
          seenBad.push(String(err));
        }
      }
    })();
    for (let i = 1; i <= 25; i++) {
      await writeJsonAtomic(p, { v: i, pad: 'y'.repeat(1024) });
    }
    stopped = true;
    await reader;
    expect(seenBad).toEqual([]);
    },
    15000,
  );

  it('reclaims a stale lockfile whose holder PID is dead', async () => {
    const dir = await tmpdir();
    const p = path.join(dir, 'stale.json');
    const lockPath = `${p}.lock`;
    await fs.mkdir(path.dirname(p), { recursive: true });
    // Fake lock from a non-existent PID, fresh timestamp but impossible pid.
    await fs.writeFile(
      lockPath,
      JSON.stringify({ pid: 2 ** 31 - 1, host: 'local', at: Date.now() }),
    );
    // Should reclaim because pid is dead.
    await writeJsonAtomic(p, { ok: true }, { lockTimeoutMs: 2000 });
    const raw = await fs.readFile(p, 'utf8');
    expect(JSON.parse(raw)).toEqual({ ok: true });
  });

  it('reclaims a stale lockfile whose timestamp is older than staleMs', async () => {
    const dir = await tmpdir();
    const p = path.join(dir, 'aged.json');
    const lockPath = `${p}.lock`;
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(
      lockPath,
      // Claim to be held by ourselves but with an ancient timestamp.
      JSON.stringify({ pid: process.pid, host: 'local', at: 1 }),
    );
    await writeJsonAtomic(p, { aged: true }, { staleMs: 1, lockTimeoutMs: 2000 });
    expect(JSON.parse(await fs.readFile(p, 'utf8'))).toEqual({ aged: true });
  });

  it('writeFileAtomic writes binary payloads intact', async () => {
    const dir = await tmpdir();
    const p = path.join(dir, 'bin');
    const bytes = new Uint8Array([0, 1, 2, 3, 255, 254]);
    await writeFileAtomic(p, bytes);
    const out = await fs.readFile(p);
    expect(Array.from(out)).toEqual(Array.from(bytes));
  });
});
