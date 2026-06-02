/**
 * LocalExecutor — spawns processes on the host machine via child_process.
 *
 * This is the fully-functional executor: it creates real child processes,
 * tracks them by handle ID, and supports attach (reconnect to streams)
 * and destroy (kill process) operations.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import type {
  ExecutionHandle,
  LocalExecutionConfig,
} from "../types";
import {
  resolveExecutionEnvironment,
  validateLocalExecutionPolicy,
} from "../policy";

// ---------------------------------------------------------------------------
// Internal state per spawned process
// ---------------------------------------------------------------------------

interface LocalProcess {
  handle: MutableHandle;
  process: ChildProcess;
  config: LocalExecutionConfig;
}

interface MutableHandle {
  readonly id: string;
  readonly mode: "local";
  status: "running" | "stopped" | "failed";
}

// ---------------------------------------------------------------------------
// Executor interface (shared shape across all mode executors)
// ---------------------------------------------------------------------------

export interface Executor<C> {
  spawn(command: string, args: string[], config: C): Promise<ExecutionHandle>;
  attach(id: string): Promise<ExecutionHandle | undefined>;
  list(): ExecutionHandle[];
  destroy(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// LocalExecutor
// ---------------------------------------------------------------------------

export class LocalExecutor implements Executor<LocalExecutionConfig> {
  private readonly processes = new Map<string, LocalProcess>();

  async spawn(
    command: string,
    args: string[],
    config: LocalExecutionConfig,
  ): Promise<ExecutionHandle> {
    validateLocalExecutionPolicy(config);

    const id = randomUUID();

    const child = spawn(command, args, {
      cwd: config.cwd,
      env: resolveExecutionEnvironment(config.env, config.policy),
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timeoutMs = config.policy?.resources?.timeoutMs;
    let timeout: NodeJS.Timeout | undefined;
    if (timeoutMs !== undefined) {
      timeout = setTimeout(() => {
        if (!child.killed && child.exitCode === null) {
          child.kill("SIGTERM");
        }
      }, timeoutMs);
    }

    const handle: MutableHandle = {
      id,
      mode: "local",
      status: "running",
    };

    const entry: LocalProcess = { handle, process: child, config };
    this.processes.set(id, entry);

    // Update status when the child exits.
    child.on("exit", (code) => {
      if (timeout) clearTimeout(timeout);
      handle.status = code === 0 ? "stopped" : "failed";
    });
    child.on("error", () => {
      if (timeout) clearTimeout(timeout);
      handle.status = "failed";
    });

    return this._toPublicHandle(entry);
  }

  async attach(id: string): Promise<ExecutionHandle | undefined> {
    const entry = this.processes.get(id);
    if (!entry) return undefined;
    return this._toPublicHandle(entry);
  }

  list(): ExecutionHandle[] {
    return [...this.processes.values()].map((e) => this._toPublicHandle(e));
  }

  async destroy(id: string): Promise<void> {
    const entry = this.processes.get(id);
    if (!entry) return;

    const child = entry.process;
    if (!child.killed && child.exitCode === null) {
      child.kill("SIGTERM");

      // Give the process a short window to exit gracefully before SIGKILL.
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (!child.killed && child.exitCode === null) {
            child.kill("SIGKILL");
          }
          resolve();
        }, 3_000);

        child.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    entry.handle.status = "stopped";
    this.processes.delete(id);
  }

  // ---------- Helpers -------------------------------------------------------

  private _toPublicHandle(entry: LocalProcess): ExecutionHandle {
    const self = this;
    return {
      get id() {
        return entry.handle.id;
      },
      get mode() {
        return entry.handle.mode;
      },
      get status() {
        return entry.handle.status;
      },
      async attach() {
        // Re-attach to stdout/stderr by piping to the current process streams.
        if (entry.process.stdout) {
          entry.process.stdout.pipe(process.stdout, { end: false });
        }
        if (entry.process.stderr) {
          entry.process.stderr.pipe(process.stderr, { end: false });
        }
      },
      async destroy() {
        await self.destroy(entry.handle.id);
      },
    };
  }
}
