/**
 * DockerExecutor — constructs `docker run` commands and spawns them
 * via child_process.
 *
 * This is a structural stub: it correctly assembles the Docker CLI
 * invocation from DockerExecutionConfig, but the host must have Docker
 * installed and the daemon running for it to work at runtime.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import type {
  ExecutionHandle,
  DockerExecutionConfig,
} from "../types";
import {
  resolveExecutionEnvironment,
  validateFilesystemMounts,
} from "../policy";
import type { Executor } from "./local";

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface DockerProcess {
  handle: MutableHandle;
  process: ChildProcess;
  config: DockerExecutionConfig;
}

interface MutableHandle {
  readonly id: string;
  readonly mode: "docker";
  status: "running" | "stopped" | "failed";
}

// ---------------------------------------------------------------------------
// DockerExecutor
// ---------------------------------------------------------------------------

export class DockerExecutor implements Executor<DockerExecutionConfig> {
  private readonly processes = new Map<string, DockerProcess>();
  private readonly preflight: (config: DockerExecutionConfig) => Promise<void>;

  constructor(options?: { preflight?: (config: DockerExecutionConfig) => Promise<void> }) {
    this.preflight = options?.preflight ?? (async () => {});
  }

  async spawn(
    command: string,
    args: string[],
    config: DockerExecutionConfig,
  ): Promise<ExecutionHandle> {
    const id = randomUUID();

    if (config.policy?.docker?.skipPreflight !== true) {
      await this.preflight(config);
    }

    const dockerArgs = this._buildDockerArgs(id, command, args, config);
    const child = spawn("docker", dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const handle: MutableHandle = {
      id,
      mode: "docker",
      status: "running",
    };

    const entry: DockerProcess = { handle, process: child, config };
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

    // Attempt `docker stop` on the container (uses the handle id as name).
    const child = entry.process;
    if (!child.killed && child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (!child.killed && child.exitCode === null) {
            child.kill("SIGKILL");
          }
          resolve();
        }, 5_000);
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

  /** Build the full `docker run` argument list. */
  _buildDockerArgs(
    id: string,
    command: string,
    args: string[],
    config: DockerExecutionConfig,
  ): string[] {
    const dockerArgs: string[] = ["run", "--rm", "--name", `babysitter-${id.slice(0, 8)}`];
    const policy = config.policy;
    validateFilesystemMounts(policy);

    const dockerPolicy = policy?.docker;
    const insecureDocker = dockerPolicy?.insecureAllowPrivilegedOptions === true;

    const readOnlyRoot = dockerPolicy?.readOnlyRootFilesystem ?? policy?.filesystem?.readOnlyRootFilesystem ?? true;
    if (readOnlyRoot) {
      dockerArgs.push("--read-only");
    } else if (!insecureDocker) {
      throw new Error("Writable Docker root filesystem requires insecureAllowPrivilegedOptions");
    }

    for (const cap of dockerPolicy?.capDrop ?? ["ALL"]) {
      dockerArgs.push("--cap-drop", cap);
    }

    for (const opt of dockerPolicy?.securityOpt ?? ["no-new-privileges"]) {
      dockerArgs.push("--security-opt", opt);
    }

    dockerArgs.push("--user", dockerPolicy?.user ?? "65532:65532");

    // Volume mounts.
    if (config.volumes) {
      for (const vol of config.volumes) {
        dockerArgs.push("-v", vol);
      }
    }
    for (const mount of policy?.filesystem?.mounts ?? []) {
      const suffix = mount.readOnly ?? true ? ":ro" : "";
      dockerArgs.push("-v", `${mount.hostPath}:${mount.containerPath}${suffix}`);
    }

    // Network.
    const network = this._dockerNetwork(config);
    if (network === "host" && !insecureDocker) {
      throw new Error("Docker host network requires insecureAllowPrivilegedOptions");
    }
    dockerArgs.push("--network", network);

    for (const dns of policy?.network?.dns ?? []) {
      dockerArgs.push("--dns", dns);
    }

    if (policy?.resources?.cpuCount !== undefined) {
      dockerArgs.push("--cpus", String(policy.resources.cpuCount));
    }
    if (policy?.resources?.memoryBytes !== undefined) {
      dockerArgs.push("--memory", String(policy.resources.memoryBytes));
    }
    if (policy?.resources?.pidsLimit !== undefined) {
      dockerArgs.push("--pids-limit", String(policy.resources.pidsLimit));
    }

    // Environment variables.
    for (const [key, value] of Object.entries(
      resolveExecutionEnvironment(config.env, policy),
    )) {
      dockerArgs.push("-e", `${key}=${value}`);
    }

    // Image.
    dockerArgs.push(config.image);

    // Command and arguments.
    dockerArgs.push(command, ...args);

    return dockerArgs;
  }

  private _dockerNetwork(config: DockerExecutionConfig): string {
    if (config.network) {
      return config.network;
    }
    const network = config.policy?.network;
    if (!network) {
      return "none";
    }
    if (network.mode === "custom") {
      if (!network.name) {
        throw new Error("Docker custom network policy requires a network name");
      }
      return network.name;
    }
    return network.mode ?? "none";
  }

  private _toPublicHandle(entry: DockerProcess): ExecutionHandle {
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
