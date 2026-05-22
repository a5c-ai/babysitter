/**
 * Background process lifecycle management for the bash agentic tool (GAP-TOOLS-036).
 *
 * Tracks child processes spawned with `run_in_background: true`, collects
 * stdout/stderr, fires completion callbacks, and enforces a concurrency limit.
 */

import * as childProcess from "node:child_process";
import { nextUlid } from "@a5c-ai/babysitter-sdk";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Snapshot of a tracked background process. */
export interface BackgroundTaskRecord {
  backgroundTaskId: string;
  pid: number;
  command: string;
  description?: string;
  startedAt: string;
  status: "running" | "completed" | "exited" | "cancelled" | "killed";
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number | null;
}

/** Payload delivered to `onComplete` callbacks. */
export interface BackgroundCompletionEvent {
  backgroundTaskId: string;
  pid: number;
  command: string;
  description?: string;
  status: "completed" | "exited";
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

/** Options for spawning a background process. */
export interface SpawnOptions {
  command: string;
  cwd: string;
  env?: Record<string, string>;
  description?: string;
  onComplete?: (event: BackgroundCompletionEvent) => void;
}

// ---------------------------------------------------------------------------
// Internal mutable entry (tracks live state + child handle)
// ---------------------------------------------------------------------------

interface TrackedProcess {
  backgroundTaskId: string;
  pid: number;
  command: string;
  description?: string;
  startedAt: string;
  startMs: number;
  status: "running" | "completed" | "exited" | "cancelled" | "killed";
  exitCode: number | null;
  stdoutChunks: Buffer[];
  stderrChunks: Buffer[];
  durationMs: number | null;
  child: childProcess.ChildProcess;
  onComplete?: (event: BackgroundCompletionEvent) => void;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const DEFAULT_MAX_CONCURRENT = 16;

export class BackgroundProcessRegistry {
  private readonly processes = new Map<string, TrackedProcess>();
  private readonly maxConcurrent: number;

  constructor(options?: { maxConcurrent?: number }) {
    this.maxConcurrent = options?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT;
  }

  /**
   * Spawn a command in the background and begin tracking it.
   * Returns a snapshot of the initial record.
   */
  spawn(opts: SpawnOptions): BackgroundTaskRecord {
    const runningCount = [...this.processes.values()].filter(
      (p) => p.status === "running",
    ).length;
    if (runningCount >= this.maxConcurrent) {
      throw new Error(
        `Max concurrent background processes limit reached (${this.maxConcurrent}). ` +
          `Cancel or wait for existing processes before spawning new ones.`,
      );
    }

    const backgroundTaskId = nextUlid();
    const startMs = Date.now();
    const shell = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
    const shellArgs =
      process.platform === "win32"
        ? ["/c", opts.command]
        : ["-c", opts.command];

    const child = childProcess.spawn(shell, shellArgs, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const tracked: TrackedProcess = {
      backgroundTaskId,
      pid: child.pid ?? -1,
      command: opts.command,
      description: opts.description,
      startedAt: new Date(startMs).toISOString(),
      startMs,
      status: "running",
      exitCode: null,
      stdoutChunks: [],
      stderrChunks: [],
      durationMs: null,
      child,
      onComplete: opts.onComplete,
    };

    child.stdout?.on("data", (chunk: Buffer) => {
      tracked.stdoutChunks.push(chunk);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      tracked.stderrChunks.push(chunk);
    });

    child.on("close", (code) => {
      if (tracked.status === "running") {
        tracked.status = code === 0 ? "completed" : "exited";
      }
      tracked.exitCode = code ?? 1;
      tracked.durationMs = Date.now() - tracked.startMs;
      if (tracked.onComplete) {
        try {
          tracked.onComplete({
            backgroundTaskId: tracked.backgroundTaskId,
            pid: tracked.pid,
            command: tracked.command,
            description: tracked.description,
            status: tracked.status as "completed" | "exited",
            exitCode: tracked.exitCode,
            stdout: Buffer.concat(tracked.stdoutChunks).toString("utf8"),
            stderr: Buffer.concat(tracked.stderrChunks).toString("utf8"),
            durationMs: tracked.durationMs,
          });
        } catch {
          // Fire-and-forget — callback errors must not crash.
        }
      }
    });

    child.on("error", () => {
      if (tracked.status === "running") {
        tracked.status = "exited";
      }
      tracked.exitCode = 1;
      tracked.durationMs = Date.now() - tracked.startMs;
    });

    this.processes.set(backgroundTaskId, tracked);
    return this.snapshot(tracked);
  }

  /** Get a snapshot of a tracked process by ID, or undefined. */
  get(backgroundTaskId: string): BackgroundTaskRecord | undefined {
    const tracked = this.processes.get(backgroundTaskId);
    if (!tracked) return undefined;
    return this.snapshot(tracked);
  }

  /** List snapshots of all tracked processes. */
  list(): BackgroundTaskRecord[] {
    return [...this.processes.values()].map((t) => this.snapshot(t));
  }

  /** Cancel (SIGTERM) a running process. Returns true if found and killed. */
  cancel(backgroundTaskId: string): boolean {
    const tracked = this.processes.get(backgroundTaskId);
    if (!tracked) return false;
    if (tracked.status !== "running") return true;
    tracked.status = "cancelled";
    tracked.durationMs = Date.now() - tracked.startMs;
    try {
      tracked.child.kill("SIGTERM");
    } catch {
      // Already dead — fine.
    }
    return true;
  }

  /** Kill all running processes. */
  killAll(): void {
    for (const tracked of this.processes.values()) {
      if (tracked.status === "running") {
        tracked.status = "killed";
        tracked.durationMs = Date.now() - tracked.startMs;
        try {
          tracked.child.kill("SIGTERM");
        } catch {
          // Already dead.
        }
      }
    }
  }

  /** Kill all processes and clear tracking state. */
  dispose(): void {
    this.killAll();
    this.processes.clear();
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private snapshot(t: TrackedProcess): BackgroundTaskRecord {
    return {
      backgroundTaskId: t.backgroundTaskId,
      pid: t.pid,
      command: t.command,
      description: t.description,
      startedAt: t.startedAt,
      status: t.status,
      exitCode: t.exitCode,
      stdout: Buffer.concat(t.stdoutChunks).toString("utf8"),
      stderr: Buffer.concat(t.stderrChunks).toString("utf8"),
      durationMs: t.durationMs,
    };
  }
}
