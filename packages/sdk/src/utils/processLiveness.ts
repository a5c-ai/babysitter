/**
 * Cross-platform process liveness check.
 *
 * POSIX: uses `process.kill(pid, 0)` which sends no signal but performs the
 * permission/existence check. Windows has no equivalent, so we shell out to
 * `tasklist`.
 */

import { execSync } from "node:child_process";

export function isProcessAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;

  if (process.platform === "win32") {
    try {
      const out = execSync(
        `tasklist /FI "PID eq ${pid}" /NH /FO CSV`,
        { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 3000 },
      );
      // tasklist returns a CSV line containing the quoted pid when present.
      return out.includes(`"${pid}"`);
    } catch {
      return false;
    }
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "EPERM") return true;
    // ESRCH and everything else => dead / unknowable.
    return false;
  }
}
