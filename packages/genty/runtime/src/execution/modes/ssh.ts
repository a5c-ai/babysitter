/**
 * SshExecutor — constructs `ssh` commands from SshExecutionConfig and
 * spawns them via child_process.
 *
 * This is a structural stub: it correctly assembles the SSH CLI invocation
 * but the host must have an SSH client installed and the target must be
 * reachable for it to work at runtime.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import type {
  ExecutionHandle,
  SshExecutionConfig,
} from "../types";
import { resolveExecutionEnvironment } from "../policy";
import type { Executor } from "./local";

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface SshProcess {
  handle: MutableHandle;
  process: ChildProcess;
  config: SshExecutionConfig;
}

interface MutableHandle {
  readonly id: string;
  readonly mode: "ssh";
  status: "running" | "stopped" | "failed";
}

// ---------------------------------------------------------------------------
// SshExecutor
// ---------------------------------------------------------------------------

export class SshExecutor implements Executor<SshExecutionConfig> {
  private readonly processes = new Map<string, SshProcess>();

  async spawn(
    command: string,
    args: string[],
    config: SshExecutionConfig,
  ): Promise<ExecutionHandle> {
    const id = randomUUID();

    const sshArgs = this._buildSshArgs(command, args, config);
    const child = spawn("ssh", sshArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const handle: MutableHandle = {
      id,
      mode: "ssh",
      status: "running",
    };

    const entry: SshProcess = { handle, process: child, config };
    this.processes.set(id, entry);

    child.on("exit", (code) => {
      handle.status = code === 0 ? "stopped" : "failed";
    });
    child.on("error", () => {
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

  /** Build the full `ssh` argument list. */
  _buildSshArgs(
    command: string,
    args: string[],
    config: SshExecutionConfig,
  ): string[] {
    const sshArgs: string[] = [];

    // Identity file.
    if (config.keyPath) {
      sshArgs.push("-i", config.keyPath);
    }

    // Port.
    if (config.port && config.port !== 22) {
      sshArgs.push("-p", String(config.port));
    }

    const sshPolicy = config.policy?.ssh;
    if (sshPolicy?.insecureSkipHostKeyChecking) {
      sshArgs.push("-o", "StrictHostKeyChecking=no");
    } else {
      sshArgs.push("-o", `StrictHostKeyChecking=${sshPolicy?.strictHostKeyChecking ?? "yes"}`);
      if (sshPolicy?.knownHostsFile) {
        sshArgs.push("-o", `UserKnownHostsFile=${sshPolicy.knownHostsFile}`);
      }
    }
    sshArgs.push("-o", "BatchMode=yes");

    // Target: user@host.
    sshArgs.push(`${config.user}@${config.host}`);

    // Build the remote command string.
    // Prepend env vars if provided.
    let remoteCommand = "";
    const env = resolveExecutionEnvironment(config.env, config.policy);
    if (Object.keys(env).length > 0) {
      const envPrefix = Object.entries(env)
        .map(([k, v]) => `${k}=${this._shellEscape(v)}`)
        .join(" ");
      remoteCommand = `${envPrefix} `;
    }
    remoteCommand += [command, ...args].map((a) => this._shellEscape(a)).join(" ");

    sshArgs.push("--", remoteCommand);

    return sshArgs;
  }

  /** Minimal shell escaping for remote command construction. */
  private _shellEscape(s: string): string {
    if (/^[a-zA-Z0-9_/.:=-]+$/.test(s)) return s;
    return `'${s.replace(/'/g, "'\\''")}'`;
  }

  private _toPublicHandle(entry: SshProcess): ExecutionHandle {
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
