import { promises as fs } from "fs";
import { RunLockInfo } from "./types";
import { getLockPath } from "./paths";
import { getClockIsoString } from "./clock";

export async function acquireRunLock(runDir: string, owner: string): Promise<RunLockInfo> {
  const lockPath = getLockPath(runDir);
  const lockInfo: RunLockInfo = { pid: process.pid, owner, acquiredAt: getClockIsoString() };
  try {
    await fs.writeFile(lockPath, JSON.stringify(lockInfo, null, 2) + "\n", { flag: "wx" });
    return lockInfo;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EEXIST") {
      const existing = JSON.parse(await fs.readFile(lockPath, "utf8")) as RunLockInfo;
      throw new Error(`run.lock already held by pid ${existing.pid} (${existing.owner})`);
    }
    throw err;
  }
}

export async function releaseRunLock(runDir: string) {
  const lockPath = getLockPath(runDir);
  await fs.rm(lockPath, { force: true });
}

export async function readRunLock(runDir: string): Promise<RunLockInfo | null> {
  const lockPath = getLockPath(runDir);
  try {
    const data = await fs.readFile(lockPath, "utf8");
    return JSON.parse(data) as RunLockInfo;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function isLockHeldError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.startsWith("run.lock already held");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface WithRunLockOptions {
  retries?: number;
  delayMs?: number;
}

export async function withRunLock<T>(
  runDir: string,
  owner: string,
  fn: () => Promise<T>,
  options: WithRunLockOptions = {}
): Promise<T> {
  const retries = typeof options.retries === "number" ? Math.max(0, Math.floor(options.retries)) : 40;
  const delayMs = typeof options.delayMs === "number" ? Math.max(0, Math.floor(options.delayMs)) : 250;
  let acquired = false;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await acquireRunLock(runDir, owner);
      acquired = true;
      break;
    } catch (error) {
      if (!isLockHeldError(error) || attempt === retries) {
        throw error;
      }
      await sleep(delayMs);
    }
  }
  try {
    return await fn();
  } finally {
    if (acquired) {
      await releaseRunLock(runDir);
    }
  }
}
