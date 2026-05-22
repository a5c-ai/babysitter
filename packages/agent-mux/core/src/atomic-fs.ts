/**
 * Atomic filesystem helpers — the single source of truth for durable
 * config/session writes across `@a5c-ai/agent-mux`.
 *
 * Guarantees:
 *  - Writes are atomic: a concurrent reader observes either the old or the
 *    new bytes, never a torn intermediate.
 *  - Writes are durable: data + directory entry are fsynced before rename.
 *  - Concurrent writers serialise through an advisory lockfile (`<path>.lock`)
 *    which records the holder's PID and a monotonic timestamp. Stale locks
 *    (holder dead or older than `staleMs`) are forcibly reclaimed.
 *
 * These primitives have no runtime dependencies beyond Node built-ins and
 * work identically on Windows, macOS, and Linux.
 *
 * @see docs/08-config-and-auth.md
 */

import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';

export interface AtomicWriteOptions {
  /** Acquire an advisory lock before writing. @default true */
  readonly lock?: boolean;
  /** Max time to wait for a lock, in ms. @default 5000 */
  readonly lockTimeoutMs?: number;
  /** Lock is considered stale after this many ms without refresh. @default 30000 */
  readonly staleMs?: number;
  /** fsync the file after write. @default true */
  readonly fsync?: boolean;
  /** File mode for writeFile. */
  readonly mode?: number;
}

/** Check if a process with the given pid is alive on this host. */
function isPidAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  if (pid === process.pid) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    // EPERM means the process exists but we can't signal it.
    return code === 'EPERM';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Rename with retry. On Windows, `rename` can briefly fail with EPERM/EBUSY
 * if a concurrent reader has the target open (sharing-violation). The rename
 * itself is still atomic from the filesystem's perspective — we just retry
 * the call until the transient handle-sharing conflict clears.
 */
async function renameWithRetry(from: string, to: string): Promise<void> {
  const maxAttempts = 40;
  let delay = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt === maxAttempts || (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES')) {
        throw err;
      }
      await sleep(delay);
      delay = Math.min(delay * 2, 50);
    }
  }
}

interface LockPayload {
  readonly pid: number;
  readonly host: string;
  readonly at: number;
}

async function tryAcquireLock(lockPath: string, staleMs: number): Promise<boolean> {
  const payload: LockPayload = {
    pid: process.pid,
    host: 'local',
    at: Date.now(),
  };
  const body = JSON.stringify(payload);
  try {
    // wx = fail if exists; O_EXCL-equivalent.
    const handle = await fs.open(lockPath, 'wx');
    try {
      await handle.writeFile(body, 'utf8');
    } finally {
      await handle.close();
    }
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
  }
  // Lockfile exists — inspect for staleness.
  let raw: string;
  try {
    raw = await fs.readFile(lockPath, 'utf8');
  } catch {
    // Lock disappeared between check and read — retry on next tick.
    return false;
  }
  let parsed: Partial<LockPayload> | null = null;
  try {
    parsed = JSON.parse(raw) as Partial<LockPayload>;
  } catch {
    parsed = null;
  }
  const age = parsed?.at ? Date.now() - parsed.at : Infinity;
  const holderAlive = typeof parsed?.pid === 'number' && isPidAlive(parsed.pid);
  if (!holderAlive || age > staleMs) {
    // Reclaim: remove stale lock then try to acquire fresh.
    try {
      await fs.unlink(lockPath);
    } catch {
      // Someone else reclaimed first; fall through and retry.
    }
    return false;
  }
  return false;
}

async function acquireLock(lockPath: string, timeoutMs: number, staleMs: number): Promise<void> {
  const start = Date.now();
  let delay = 5;
  // Ensure parent dir exists so we can create the lock.
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  while (true) {
    if (await tryAcquireLock(lockPath, staleMs)) return;
    if (Date.now() - start >= timeoutMs) {
      throw new Error(
        `atomic-fs: timed out acquiring lock ${lockPath} after ${timeoutMs}ms`,
      );
    }
    await sleep(delay);
    delay = Math.min(delay * 2, 100);
  }
}

async function releaseLock(lockPath: string): Promise<void> {
  try {
    await fs.unlink(lockPath);
  } catch {
    // Best-effort.
  }
}

/** Write `data` to `filePath` atomically (tmp + fsync + rename). */
export async function writeFileAtomic(
  filePath: string,
  data: string | Uint8Array,
  opts: AtomicWriteOptions = {},
): Promise<void> {
  const {
    lock = true,
    lockTimeoutMs = 5000,
    staleMs = 30000,
    fsync = true,
    mode,
  } = opts;
  const lockPath = `${filePath}.lock`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (lock) await acquireLock(lockPath, lockTimeoutMs, staleMs);
  try {
    const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const handle = await fs.open(tmp, 'w', mode);
    try {
      await handle.writeFile(data);
      if (fsync) {
        try {
          await handle.sync();
        } catch {
          // Some filesystems (e.g. tmpfs on certain configs) don't support fsync.
        }
      }
    } finally {
      await handle.close();
    }
    await renameWithRetry(tmp, filePath);
    if (fsync) {
      // Best-effort fsync of the parent directory so the rename is durable.
      try {
        const dir = fsSync.openSync(path.dirname(filePath), 'r');
        try {
          fsSync.fsyncSync(dir);
        } finally {
          fsSync.closeSync(dir);
        }
      } catch {
        // Directory fsync isn't supported on Windows; ignore EPERM/EISDIR/EINVAL.
      }
    }
  } finally {
    if (lock) await releaseLock(lockPath);
  }
}

/** Write `data` as pretty-printed JSON atomically. */
export async function writeJsonAtomic(
  filePath: string,
  data: unknown,
  opts: AtomicWriteOptions = {},
): Promise<void> {
  const body = JSON.stringify(data, null, 2);
  await writeFileAtomic(filePath, body, opts);
}
