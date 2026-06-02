/**
 * Background process lifecycle management for the bash agentic tool (GAP-TOOLS-036).
 *
 * Tracks child processes spawned with `run_in_background: true`, collects
 * stdout/stderr, fires completion callbacks, and enforces a concurrency limit.
 */

import * as childProcess from "node:child_process";
import { nextUlid } from "@a5c-ai/babysitter-sdk";
import type { ExecutionPolicy } from "./execution";
import {
  normalizeResourceLimits,
  resolveExecutionEnvironment,
  validateFilesystemPolicy,
} from "./execution";
import { buildShellInvocation } from "./shellInvocation";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Snapshot of a tracked background process. */
export type BackgroundTaskStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "exited"
  | "cancelled"
  | "killed"
  | "timed_out"
  | "skipped"
  | "failed";

export interface BackgroundStreamMetadata {
  retainedBytes: number;
  droppedBytes: number;
  truncated: boolean;
}

export interface BackgroundHookError {
  hook: keyof BackgroundLifecycleHooks;
  message: string;
}

export interface BackgroundLifecycleHooks {
  preSpawn?: (record: BackgroundTaskRecord) => void;
  postSpawn?: (record: BackgroundTaskRecord) => void;
  preDestroy?: (record: BackgroundTaskRecord) => void;
  postDestroy?: (record: BackgroundTaskRecord) => void;
  onTimeout?: (record: BackgroundTaskRecord) => void;
}

export interface BackgroundTaskRecord {
  backgroundTaskId: string;
  pid: number;
  command: string;
  description?: string;
  startedAt: string;
  status: BackgroundTaskStatus;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  stdoutTruncated?: boolean;
  stderrTruncated?: boolean;
  stdoutRetainedBytes?: number;
  stderrRetainedBytes?: number;
  stdoutDroppedBytes?: number;
  stderrDroppedBytes?: number;
  dependsOn?: string[];
  dependencyFailure?: string;
  hookErrors?: BackgroundHookError[];
  durationMs: number | null;
}

/** Payload delivered to `onComplete` callbacks. */
export interface BackgroundCompletionEvent {
  backgroundTaskId: string;
  pid: number;
  command: string;
  description?: string;
  status: BackgroundTaskStatus;
  exitCode: number;
  stdout: string;
  stderr: string;
  stdoutTruncated?: boolean;
  stderrTruncated?: boolean;
  stdoutRetainedBytes?: number;
  stderrRetainedBytes?: number;
  stdoutDroppedBytes?: number;
  stderrDroppedBytes?: number;
  dependsOn?: string[];
  dependencyFailure?: string;
  hookErrors?: BackgroundHookError[];
  durationMs: number;
}

/** Options for spawning a background process. */
export interface SpawnOptions {
  command: string;
  cwd: string;
  env?: Record<string, string>;
  executionPolicy?: ExecutionPolicy;
  description?: string;
  dependsOn?: string[];
  hooks?: BackgroundLifecycleHooks;
  hookTimeoutMs?: number;
  terminationGraceMs?: number;
  terminateProcessGroup?: boolean;
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
  status: BackgroundTaskStatus;
  exitCode: number | null;
  stdout: RetainedStream;
  stderr: RetainedStream;
  durationMs: number | null;
  child?: childProcess.ChildProcess;
  timeout?: NodeJS.Timeout;
  terminationTimer?: NodeJS.Timeout;
  terminating?: boolean;
  terminalIntent?: Extract<BackgroundTaskStatus, "cancelled" | "killed" | "timed_out">;
  maxOutputBytes?: number;
  opts: SpawnOptions;
  dependsOn: string[];
  dependencyFailure?: string;
  hookErrors: BackgroundHookError[];
  onComplete?: (event: BackgroundCompletionEvent) => void;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const DEFAULT_MAX_CONCURRENT = 16;
const DEFAULT_TERMINATION_GRACE_MS = 3_000;
const TERMINAL_STATUSES = new Set<BackgroundTaskStatus>([
  "completed",
  "exited",
  "cancelled",
  "killed",
  "timed_out",
  "skipped",
  "failed",
]);

interface RetainedStream {
  chunks: Buffer[];
  retainedBytes: number;
  droppedBytes: number;
}

export class BackgroundProcessRegistry {
  private readonly processes = new Map<string, TrackedProcess>();
  private readonly maxConcurrent: number;
  private readonly spawnFn: typeof childProcess.spawn;
  private readonly processKillFn: typeof process.kill;
  private readonly platform: NodeJS.Platform;

  constructor(options?: {
    maxConcurrent?: number;
    spawnFn?: typeof childProcess.spawn;
    processKillFn?: typeof process.kill;
    platform?: NodeJS.Platform;
  }) {
    this.maxConcurrent = options?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT;
    this.spawnFn = options?.spawnFn ?? childProcess.spawn;
    this.processKillFn = options?.processKillFn ?? process.kill;
    this.platform = options?.platform ?? process.platform;
  }

  /**
   * Spawn a command in the background and begin tracking it.
   * Returns a snapshot of the initial record.
   */
  spawn(opts: SpawnOptions): BackgroundTaskRecord {
    validateFilesystemPolicy(opts.cwd, opts.executionPolicy);
    const dependsOn = [...(opts.dependsOn ?? [])];
    validateDependencies(dependsOn);
    for (const dependencyId of dependsOn) {
      const dependency = this.processes.get(dependencyId);
      if (!dependency) {
        throw new Error(`Unknown background process dependency "${dependencyId}"`);
      }
    }

    const runningCount = [...this.processes.values()].filter(
      (p) => p.status === "running" || p.status === "paused",
    ).length;
    if (runningCount >= this.maxConcurrent && dependsOn.length === 0) {
      throw new Error(
        `Max concurrent background processes limit reached (${this.maxConcurrent}). ` +
          `Cancel or wait for existing processes before spawning new ones.`,
      );
    }

    const backgroundTaskId = nextUlid();
    const startMs = Date.now();
    const resources = normalizeResourceLimits(opts.executionPolicy);

    const tracked: TrackedProcess = {
      backgroundTaskId,
      pid: -1,
      command: opts.command,
      description: opts.description,
      startedAt: new Date(startMs).toISOString(),
      startMs,
      status: dependsOn.length === 0 ? "running" : "queued",
      exitCode: null,
      stdout: createRetainedStream(),
      stderr: createRetainedStream(),
      durationMs: null,
      maxOutputBytes: resources.maxOutputBytes,
      opts,
      dependsOn,
      hookErrors: [],
      onComplete: opts.onComplete,
    };

    this.processes.set(backgroundTaskId, tracked);
    this.runHook(tracked, "preSpawn");

    if (tracked.status === "failed") {
      tracked.durationMs = Date.now() - tracked.startMs;
      return this.snapshot(tracked);
    }

    if (dependsOn.length === 0) {
      this.startTrackedProcess(tracked);
    } else {
      this.resolveQueuedProcess(tracked);
    }

    return this.snapshot(tracked);
  }

  private startTrackedProcess(tracked: TrackedProcess): void {
    if (tracked.status !== "queued" && tracked.status !== "running") {
      return;
    }

    const runningCount = [...this.processes.values()].filter(
      (p) => p !== tracked && (p.status === "running" || p.status === "paused"),
    ).length;
    if (runningCount >= this.maxConcurrent) {
      tracked.status = "queued";
      return;
    }

    const opts = tracked.opts;
    const shellInvocation = buildShellInvocation(opts.command);
    const child = this.spawnFn(shellInvocation.command, shellInvocation.args, {
      cwd: opts.cwd,
      env: resolveExecutionEnvironment(opts.env, opts.executionPolicy),
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      detached: opts.terminateProcessGroup === true && this.platform !== "win32",
    });

    tracked.child = child;
    tracked.pid = child.pid ?? -1;
    tracked.status = "running";

    child.stdout?.on("data", (chunk: Buffer) => {
      appendCapped(tracked.stdout, chunk, tracked.maxOutputBytes);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      appendCapped(tracked.stderr, chunk, tracked.maxOutputBytes);
    });

    const resources = normalizeResourceLimits(opts.executionPolicy);
    if (resources.timeoutMs !== undefined) {
      tracked.timeout = setTimeout(() => {
        if (tracked.status === "running" || tracked.status === "paused") {
          this.terminate(tracked, "timed_out");
        }
      }, resources.timeoutMs);
    }

    child.on("close", (code) => {
      if (tracked.timeout) clearTimeout(tracked.timeout);
      if (tracked.terminationTimer) clearTimeout(tracked.terminationTimer);
      if (tracked.status === "running" || tracked.status === "paused") {
        tracked.status = code === 0 ? "completed" : "exited";
      }
      tracked.exitCode = code ?? 1;
      tracked.durationMs = Date.now() - tracked.startMs;
      this.runHook(tracked, "postDestroy");
      if (tracked.onComplete) {
        try {
          tracked.onComplete(this.completionEvent(tracked));
        } catch {
          // Fire-and-forget — callback errors must not crash.
        }
      }
      this.resolveDependents(tracked.backgroundTaskId);
    });

    child.on("error", () => {
      if (tracked.timeout) clearTimeout(tracked.timeout);
      if (tracked.terminationTimer) clearTimeout(tracked.terminationTimer);
      if (tracked.status === "running" || tracked.status === "paused") {
        tracked.status = "exited";
      }
      tracked.exitCode = 1;
      tracked.durationMs = Date.now() - tracked.startMs;
      this.runHook(tracked, "postDestroy");
      this.resolveDependents(tracked.backgroundTaskId);
    });

    this.runHook(tracked, "postSpawn");
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
    if (isTerminal(tracked.status)) return true;
    this.terminate(tracked, "cancelled");
    return true;
  }

  /** Kill all running processes. */
  killAll(): void {
    for (const tracked of this.processes.values()) {
      if (!isTerminal(tracked.status)) {
        this.terminate(tracked, "killed");
      }
    }
  }

  /** Kill all processes and clear tracking state. */
  dispose(): void {
    this.killAll();
    this.processes.clear();
  }

  pause(backgroundTaskId: string): boolean {
    const tracked = this.processes.get(backgroundTaskId);
    if (!tracked || tracked.status !== "running" || !this.canSignal(tracked)) {
      return false;
    }
    if (!this.sendSignal(tracked, "SIGSTOP")) {
      return false;
    }
    tracked.status = "paused";
    return true;
  }

  resume(backgroundTaskId: string): boolean {
    const tracked = this.processes.get(backgroundTaskId);
    if (!tracked || tracked.status !== "paused" || !this.canSignal(tracked)) {
      return false;
    }
    if (!this.sendSignal(tracked, "SIGCONT")) {
      return false;
    }
    tracked.status = "running";
    return true;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private snapshot(t: TrackedProcess): BackgroundTaskRecord {
    const stdoutTruncated = t.stdout.droppedBytes > 0;
    const stderrTruncated = t.stderr.droppedBytes > 0;
    return {
      backgroundTaskId: t.backgroundTaskId,
      pid: t.pid,
      command: t.command,
      description: t.description,
      startedAt: t.startedAt,
      status: t.status,
      exitCode: t.exitCode,
      stdout: Buffer.concat(t.stdout.chunks).toString("utf8"),
      stderr: Buffer.concat(t.stderr.chunks).toString("utf8"),
      stdoutTruncated: stdoutTruncated || undefined,
      stderrTruncated: stderrTruncated || undefined,
      stdoutRetainedBytes: t.stdout.retainedBytes,
      stderrRetainedBytes: t.stderr.retainedBytes,
      stdoutDroppedBytes: t.stdout.droppedBytes,
      stderrDroppedBytes: t.stderr.droppedBytes,
      dependsOn: t.dependsOn.length > 0 ? [...t.dependsOn] : undefined,
      dependencyFailure: t.dependencyFailure,
      hookErrors: t.hookErrors.length > 0 ? [...t.hookErrors] : undefined,
      durationMs: t.durationMs,
    };
  }

  private completionEvent(t: TrackedProcess): BackgroundCompletionEvent {
    return {
      ...this.snapshot(t),
      exitCode: t.exitCode ?? 1,
      durationMs: t.durationMs ?? Date.now() - t.startMs,
    };
  }

  private terminate(
    tracked: TrackedProcess,
    intent: Extract<BackgroundTaskStatus, "cancelled" | "killed" | "timed_out">,
  ): void {
    if (tracked.terminating || isTerminal(tracked.status)) {
      return;
    }

    const wasPaused = tracked.status === "paused";
    tracked.terminating = true;
    tracked.terminalIntent = intent;
    tracked.status = intent;
    tracked.durationMs = Date.now() - tracked.startMs;

    if (intent === "timed_out") {
      this.runHook(tracked, "onTimeout");
    }
    this.runHook(tracked, "preDestroy");

    if (wasPaused) {
      this.sendSignal(tracked, "SIGCONT");
    }
    this.sendSignal(tracked, "SIGTERM");

    tracked.terminationTimer = setTimeout(() => {
      if (this.isStillRunning(tracked)) {
        this.sendSignal(tracked, "SIGKILL");
      }
    }, tracked.opts.terminationGraceMs ?? DEFAULT_TERMINATION_GRACE_MS);
  }

  private canSignal(tracked: TrackedProcess): boolean {
    return this.platform !== "win32" && tracked.pid > 0 && tracked.child !== undefined;
  }

  private sendSignal(tracked: TrackedProcess, signal: NodeJS.Signals): boolean {
    if (!tracked.child || tracked.pid <= 0) {
      return false;
    }

    try {
      if (this.shouldSignalProcessGroup(tracked)) {
        this.processKillFn(-tracked.pid, signal);
      } else if (this.processKillFn !== process.kill) {
        this.processKillFn(tracked.pid, signal);
      } else {
        tracked.child.kill(signal);
      }
      return true;
    } catch {
      return false;
    }
  }

  private shouldSignalProcessGroup(tracked: TrackedProcess): boolean {
    return tracked.opts.terminateProcessGroup === true
      && this.platform !== "win32"
      && tracked.pid > 0;
  }

  private isStillRunning(tracked: TrackedProcess): boolean {
    const child = tracked.child as (childProcess.ChildProcess & {
      killed?: boolean;
      exitCode?: number | null;
    }) | undefined;
    if (!child) return false;
    return child.exitCode === null && child.killed !== true;
  }

  private resolveDependents(backgroundTaskId: string): void {
    for (const candidate of this.processes.values()) {
      if (candidate.status !== "queued" || !candidate.dependsOn.includes(backgroundTaskId)) {
        continue;
      }
      this.resolveQueuedProcess(candidate);
    }
  }

  private resolveQueuedProcess(tracked: TrackedProcess): void {
    const dependencies = tracked.dependsOn.map((id) => this.processes.get(id));
    const failed = dependencies.find((dependency) => dependency && dependency.status !== "completed");
    if (failed && isTerminal(failed.status)) {
      tracked.status = "skipped";
      tracked.dependencyFailure = failed.backgroundTaskId;
      tracked.durationMs = Date.now() - tracked.startMs;
      this.resolveDependents(tracked.backgroundTaskId);
      return;
    }
    if (dependencies.every((dependency) => dependency?.status === "completed")) {
      this.startTrackedProcess(tracked);
    }
  }

  private runHook(tracked: TrackedProcess, hook: keyof BackgroundLifecycleHooks): void {
    const fn = tracked.opts.hooks?.[hook];
    if (!fn) return;
    try {
      const result = fn(this.snapshot(tracked)) as unknown;
      if (result != null && typeof (result as Promise<void>).then === "function") {
        tracked.hookErrors.push({
          hook,
          message: "Async lifecycle hooks are not supported by synchronous spawn",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      tracked.hookErrors.push({ hook, message });
      if (hook === "preSpawn") {
        tracked.status = "failed";
      }
    }
  }
}

function createRetainedStream(): RetainedStream {
  return {
    chunks: [],
    retainedBytes: 0,
    droppedBytes: 0,
  };
}

function appendCapped(stream: RetainedStream, chunk: Buffer, maxBytes?: number): void {
  if (maxBytes === undefined) {
    stream.chunks.push(chunk);
    stream.retainedBytes += chunk.byteLength;
    return;
  }

  const remaining = maxBytes - stream.retainedBytes;
  if (remaining <= 0) {
    stream.droppedBytes += chunk.byteLength;
    return;
  }

  if (chunk.byteLength <= remaining) {
    stream.chunks.push(chunk);
    stream.retainedBytes += chunk.byteLength;
    return;
  }

  stream.chunks.push(chunk.subarray(0, remaining));
  stream.retainedBytes += remaining;
  stream.droppedBytes += chunk.byteLength - remaining;
}

function validateDependencies(dependsOn: string[]): void {
  const unique = new Set(dependsOn);
  if (unique.size !== dependsOn.length) {
    throw new Error("Background process dependency cycle or duplicate dependency detected");
  }
}

function isTerminal(status: BackgroundTaskStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
