import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_TIMEOUT_MS = 5_000;
const RETRY_INTERVAL_MS = 50;

function lockPath(filePath: string): string {
  return `${filePath}.lock`;
}

/**
 * Acquire a lock file for the given path.
 * Retries until timeout.  The lock file contains the PID of the owner.
 */
export async function acquireLock(filePath: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
  const lp = lockPath(filePath);
  const dir = path.dirname(lp);
  await fs.promises.mkdir(dir, { recursive: true });

  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      // wx = create exclusively; fails if file already exists
      await fs.promises.writeFile(lp, String(process.pid), { flag: 'wx' });
      return;
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST') throw err;

      // Check if the lock is stale (owner process gone)
      try {
        const ownerPid = parseInt(await fs.promises.readFile(lp, 'utf-8'), 10);
        if (!isNaN(ownerPid) && !isProcessRunning(ownerPid)) {
          // Stale lock — remove and retry immediately
          await fs.promises.unlink(lp).catch(() => {/* ignore */});
          continue;
        }
      } catch {
        // Lock file disappeared between check — retry
        continue;
      }

      if (Date.now() >= deadline) {
        throw new Error(`Failed to acquire lock for ${filePath} within ${timeoutMs}ms`);
      }
      await sleep(RETRY_INTERVAL_MS);
    }
  }
}

/**
 * Release the lock file for the given path.
 */
export async function releaseLock(filePath: string): Promise<void> {
  const lp = lockPath(filePath);
  try {
    await fs.promises.unlink(lp);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw err;
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
