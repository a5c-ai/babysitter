import { promises as fs } from "fs";
import path from "path";
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
