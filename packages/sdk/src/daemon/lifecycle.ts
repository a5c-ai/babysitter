/**
 * GAP-REMOTE-001: Daemon Lifecycle — start/stop/status management.
 *
 * In foreground mode, the daemon runs in the current process (for dev/debug).
 * In background mode, it spawns a detached child process.
 */

import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { ok, fail } from "../api/utils";
import type { ApiResult } from "../api/runs";
import { readDaemonLoopStatus } from "./loop";
import type {
  DaemonStartOptions,
  DaemonStartOutput,
  DaemonStopOptions,
  DaemonStopOutput,
  DaemonStatusOptions,
  DaemonStatusOutput,
  DaemonMetadata,
} from "./types";
import { appendDaemonLog } from "./daemonLog";

const DEFAULT_GRACE_PERIOD_MS = 10_000;

// ── Atomic write helper ─────────────────────────────────────────────────────

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, content, "utf-8");
  await fs.rename(tmpPath, filePath);
}

// ── PID checking ────────────────────────────────────────────────────────────

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readPidFile(daemonDir: string): Promise<number | null> {
  try {
    const content = await fs.readFile(path.join(daemonDir, "daemon.pid"), "utf-8");
    const pid = parseInt(content.trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

async function readDaemonMetadata(daemonDir: string): Promise<DaemonMetadata | null> {
  try {
    const content = await fs.readFile(path.join(daemonDir, "daemon.json"), "utf-8");
    return JSON.parse(content) as DaemonMetadata;
  } catch {
    return null;
  }
}

async function cleanupDaemonFiles(daemonDir: string): Promise<void> {
  await fs.unlink(path.join(daemonDir, "daemon.pid")).catch(() => {});
  await fs.unlink(path.join(daemonDir, "daemon.json")).catch(() => {});
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── startDaemon ─────────────────────────────────────────────────────────────

export async function startDaemon(
  options: DaemonStartOptions,
): Promise<ApiResult<DaemonStartOutput>> {
  try {
    const { daemonDir, workspace, foreground = false, config } = options;

    // Check for existing daemon
    const existingPid = await readPidFile(daemonDir);
    if (existingPid !== null) {
      if (isProcessAlive(existingPid)) {
        return fail("DAEMON_RUNNING", `Daemon already running with PID ${existingPid}`);
      }
      // Stale PID — clean up both files
      await cleanupDaemonFiles(daemonDir);
    }

    await fs.mkdir(daemonDir, { recursive: true });

    let pid: number;
    const startedAt = new Date().toISOString();
    const maxConcurrentRuns = config?.maxConcurrentRuns ?? 4;

    if (foreground) {
      pid = process.pid;
    } else {
      // Spawn detached child process running daemon:run
      const child = spawn(process.execPath, [process.argv[1], "daemon:run", "--daemon-dir", daemonDir], {
        detached: true,
        stdio: "ignore",
        cwd: workspace,
      });
      child.unref();
      if (child.pid == null) {
        return fail("SPAWN_FAILED", "Failed to spawn daemon process — no PID returned");
      }
      pid = child.pid;
    }

    // Write PID file atomically
    await atomicWrite(path.join(daemonDir, "daemon.pid"), String(pid));

    // Write daemon.json metadata atomically
    const metadata: DaemonMetadata = {
      workspace,
      startedAt,
      triggers: config?.triggers ?? [],
      maxConcurrentRuns,
      pid,
    };
    await atomicWrite(
      path.join(daemonDir, "daemon.json"),
      JSON.stringify(metadata, null, 2),
    );

    // Log daemon start
    await appendDaemonLog(daemonDir, {
      timestamp: startedAt,
      event: "DAEMON_STARTED",
      data: { pid, workspace, foreground },
    });

    return ok({
      pid,
      daemonDir,
      startedAt,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

// ── stopDaemon ──────────────────────────────────────────────────────────────

export async function stopDaemon(
  options: DaemonStopOptions,
): Promise<ApiResult<DaemonStopOutput>> {
  try {
    const { daemonDir, gracePeriodMs = DEFAULT_GRACE_PERIOD_MS } = options;

    const pid = await readPidFile(daemonDir);
    if (pid === null) {
      return fail("DAEMON_NOT_RUNNING", "No daemon PID file found");
    }

    const stoppedAt = new Date().toISOString();

    if (!isProcessAlive(pid)) {
      // PID exists but process is dead — clean up stale files
      await cleanupDaemonFiles(daemonDir);
      return ok({ pid, stoppedAt });
    }

    // For foreground mode (same process), just clean up files
    if (pid === process.pid) {
      await cleanupDaemonFiles(daemonDir);
      await appendDaemonLog(daemonDir, {
        timestamp: stoppedAt,
        event: "DAEMON_STOPPED",
        data: { pid, reason: "foreground-stop" },
      }).catch(() => {});
      return ok({ pid, stoppedAt });
    }

    // Send SIGTERM first
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Process may have exited between check and kill
      await cleanupDaemonFiles(daemonDir);
      return ok({ pid, stoppedAt });
    }

    // Wait for graceful shutdown with polling
    const pollInterval = 100;
    const maxPolls = Math.ceil(gracePeriodMs / pollInterval);
    for (let i = 0; i < maxPolls; i++) {
      await sleep(pollInterval);
      if (!isProcessAlive(pid)) {
        await cleanupDaemonFiles(daemonDir);
        await appendDaemonLog(daemonDir, {
          timestamp: new Date().toISOString(),
          event: "DAEMON_STOPPED",
          data: { pid, reason: "sigterm" },
        }).catch(() => {});
        return ok({ pid, stoppedAt: new Date().toISOString() });
      }
    }

    // Escalate to SIGKILL after grace period
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Already exited
    }

    await cleanupDaemonFiles(daemonDir);
    await appendDaemonLog(daemonDir, {
      timestamp: new Date().toISOString(),
      event: "DAEMON_KILLED",
      data: { pid, reason: "sigkill-after-grace-period", gracePeriodMs },
    }).catch(() => {});

    return ok({ pid, stoppedAt: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

// ── getDaemonStatus ─────────────────────────────────────────────────────────

export async function getDaemonStatus(
  options: DaemonStatusOptions,
): Promise<ApiResult<DaemonStatusOutput>> {
  try {
    const { daemonDir } = options;

    const pid = await readPidFile(daemonDir);
    if (pid === null) {
      return ok({ running: false });
    }

    if (!isProcessAlive(pid)) {
      // Stale PID — clean up
      await fs.unlink(path.join(daemonDir, "daemon.pid")).catch(() => {});
      return ok({ running: false });
    }

    const metadata = await readDaemonMetadata(daemonDir);
    const startedAt = metadata?.startedAt;
    const uptime = startedAt
      ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      : 0;

    const loopStatus = await readDaemonLoopStatus(daemonDir);

    return ok({
      running: true,
      pid,
      uptime,
      startedAt,
      activeTriggers: metadata?.triggers?.length ?? 0,
      pendingRuns: loopStatus?.pendingRuns ?? 0,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}
