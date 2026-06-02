/**
 * KubernetesExecutor — kubectl-backed Kubernetes Job execution.
 */

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import type {
  ExecutionHandle,
  KubernetesExecutionConfig,
} from "../types";
import {
  resolveExecutionEnvironment,
  validateFilesystemMounts,
} from "../policy";
import type { Executor } from "./local";

export interface KubectlResult {
  stdout: string;
  stderr: string;
}

export type KubectlInvoker = (
  args: string[],
  options?: { input?: string; timeoutMs?: number },
) => Promise<KubectlResult>;

export interface KubernetesExecutorOptions {
  kubectl?: KubectlInvoker;
  kubectlPath?: string;
  pollIntervalMs?: number;
}

interface K8sEntry {
  handle: MutableHandle;
  config: KubernetesExecutionConfig;
  manifest: string;
  jobName: string;
  logs?: string;
}

interface MutableHandle {
  readonly id: string;
  readonly mode: "kubernetes";
  status: "running" | "stopped" | "failed";
}

export interface KubernetesExecutionHandle extends ExecutionHandle {
  readonly mode: "kubernetes";
  readonly manifest: string;
  readonly jobName: string;
  readonly logs?: string;
}

export class KubernetesExecutor implements Executor<KubernetesExecutionConfig> {
  private readonly entries = new Map<string, K8sEntry>();
  private readonly kubectl: KubectlInvoker;
  private readonly pollIntervalMs: number;

  constructor(options?: KubernetesExecutorOptions) {
    this.kubectl = options?.kubectl ?? createKubectlInvoker(options?.kubectlPath ?? "kubectl");
    this.pollIntervalMs = options?.pollIntervalMs ?? 1_000;
  }

  async spawn(
    command: string,
    args: string[],
    config: KubernetesExecutionConfig,
  ): Promise<KubernetesExecutionHandle> {
    const id = randomUUID();
    const jobName = `babysitter-${id.slice(0, 8)}`;
    const manifest = this._buildManifest(jobName, command, args, config);

    const handle: MutableHandle = {
      id,
      mode: "kubernetes",
      status: "running",
    };
    const entry: K8sEntry = { handle, config, manifest, jobName };

    try {
      await this.kubectl(["apply", "-f", "-"], { input: manifest, timeoutMs: config.kubectlTimeoutMs });
    } catch (error) {
      handle.status = "failed";
      throw normalizeKubectlError("kubectl apply failed", error);
    }

    this.entries.set(id, entry);
    return this._toPublicHandle(entry);
  }

  async attach(id: string): Promise<KubernetesExecutionHandle | undefined> {
    const entry = this.entries.get(id);
    if (!entry) return undefined;
    return this._toPublicHandle(entry);
  }

  list(): KubernetesExecutionHandle[] {
    return [...this.entries.values()].map((e) => this._toPublicHandle(e));
  }

  async destroy(id: string): Promise<void> {
    const entry = this.entries.get(id);
    if (!entry) return;

    try {
      await this.kubectl([
        "delete",
        "job",
        entry.jobName,
        "-n",
        entry.config.namespace,
        "--ignore-not-found=true",
      ], { timeoutMs: entry.config.kubectlTimeoutMs });
      entry.handle.status = "stopped";
    } catch (error) {
      entry.handle.status = "failed";
      throw normalizeKubectlError("kubectl delete failed", error);
    } finally {
      this.entries.delete(id);
    }
  }

  async waitForCompletion(id: string): Promise<KubernetesExecutionHandle> {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Unknown Kubernetes execution handle: ${id}`);
    }

    const deadline = Date.now() + (entry.config.timeoutMs ?? 300_000);
    while (Date.now() < deadline) {
      const status = await this.readJobStatus(entry);
      if ((status.succeeded ?? 0) > 0) {
        entry.handle.status = "stopped";
        if (entry.config.cleanupAfterCompletion) await this.destroy(id);
        return this._toPublicHandle(entry);
      }
      if ((status.failed ?? 0) > 0) {
        entry.handle.status = "failed";
        if (entry.config.cleanupAfterCompletion) {
          await this.destroy(id);
          entry.handle.status = "failed";
        }
        throw new Error(`Kubernetes job ${entry.jobName} failed`);
      }
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) break;
      await sleep(Math.min(this.pollIntervalMs, remainingMs));
    }

    entry.handle.status = "failed";
    if (entry.config.cleanupAfterCompletion) {
      await this.destroy(id);
      entry.handle.status = "failed";
    }
    throw new Error(`Kubernetes job ${entry.jobName} timed out`);
  }

  _buildManifest(
    jobName: string,
    command: string,
    args: string[],
    config: KubernetesExecutionConfig,
  ): string {
    validateFilesystemMounts(config.policy);

    const resourceBlock = this._resourcesFromConfig(config)
      ? this._resourcesYaml(this._resourcesFromConfig(config) as Record<string, string>)
      : "";
    const serviceAccountLine = config.serviceAccount
      ? `      serviceAccountName: ${config.serviceAccount}\n`
      : "";
    const commandYaml = `          command: ${JSON.stringify([command, ...args])}`;
    const envBlock = this._envYaml(resolveExecutionEnvironment(config.env, config.policy));
    const securityContextBlock = this._securityContextYaml(config);
    const volumeMountBlock = this._volumeMountsYaml(config);
    const volumesBlock = this._volumesYaml(config);

    return [
      "apiVersion: batch/v1",
      "kind: Job",
      "metadata:",
      `  name: ${jobName}`,
      `  namespace: ${config.namespace}`,
      "  labels:",
      "    app.kubernetes.io/managed-by: babysitter",
      `    babysitter.a5c.ai/execution-id: ${jobName}`,
      "spec:",
      "  backoffLimit: 0",
      "  template:",
      "    metadata:",
      "      labels:",
      `        babysitter.a5c.ai/execution-id: ${jobName}`,
      "    spec:",
      serviceAccountLine ? serviceAccountLine.trimEnd() : null,
      "      restartPolicy: Never",
      "      containers:",
      "        - name: main",
      `          image: ${config.image}`,
      commandYaml,
      envBlock || null,
      volumeMountBlock || null,
      securityContextBlock,
      resourceBlock || null,
      volumesBlock || null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  }

  private async streamLogs(entry: K8sEntry): Promise<void> {
    const result = await this.kubectl([
      "logs",
      `job/${entry.jobName}`,
      "-n",
      entry.config.namespace,
      "--all-containers=true",
    ], { timeoutMs: entry.config.kubectlTimeoutMs });
    entry.logs = redactText(result.stdout);
  }

  private async readJobStatus(entry: K8sEntry): Promise<{ active?: number; succeeded?: number; failed?: number }> {
    try {
      const result = await this.kubectl([
        "get",
        "job",
        entry.jobName,
        "-n",
        entry.config.namespace,
        "-o",
        "json",
      ], { timeoutMs: entry.config.kubectlTimeoutMs });
      const parsed = JSON.parse(result.stdout) as { status?: { active?: number; succeeded?: number; failed?: number } };
      return parsed.status ?? {};
    } catch (error) {
      entry.handle.status = "failed";
      throw normalizeKubectlError("kubectl get job failed", error);
    }
  }

  private _resourcesYaml(resources: Record<string, string>): string {
    const lines = Object.entries(resources).map(
      ([key, value]) => `              ${key}: "${value}"`,
    );
    return [
      "          resources:",
      "            requests:",
      ...lines,
      "            limits:",
      ...lines,
    ].join("\n");
  }

  private _resourcesFromConfig(config: KubernetesExecutionConfig): Record<string, string> | undefined {
    const resources: Record<string, string> = { ...(config.resources ?? {}) };
    if (config.policy?.resources?.cpuCount !== undefined) {
      resources.cpu = String(config.policy.resources.cpuCount);
    }
    if (config.policy?.resources?.memoryBytes !== undefined) {
      resources.memory = String(config.policy.resources.memoryBytes);
    }
    return Object.keys(resources).length > 0 ? resources : undefined;
  }

  private _envYaml(env: Record<string, string>): string {
    const entries = Object.entries(env);
    if (entries.length === 0) {
      return "";
    }
    return [
      `          env:`,
      ...entries.flatMap(([key, value]) => [
        `            - name: ${key}`,
        `              value: ${JSON.stringify(redactEnvValue(key, value))}`,
      ]),
    ].join("\n");
  }

  private _volumeMountsYaml(config: KubernetesExecutionConfig): string {
    const mounts = config.policy?.filesystem?.mounts ?? [];
    if (mounts.length === 0) {
      return "";
    }
    return [
      `          volumeMounts:`,
      ...mounts.flatMap((mount, index) => [
        `            - name: policy-mount-${index}`,
        `              mountPath: ${mount.containerPath}`,
        `              readOnly: ${mount.readOnly ?? true}`,
      ]),
    ].join("\n");
  }

  private _volumesYaml(config: KubernetesExecutionConfig): string {
    const mounts = config.policy?.filesystem?.mounts ?? [];
    if (mounts.length === 0) {
      return "";
    }
    return [
      `      volumes:`,
      ...mounts.flatMap((mount, index) => [
        `        - name: policy-mount-${index}`,
        `          hostPath:`,
        `            path: ${mount.hostPath}`,
      ]),
    ].join("\n");
  }

  private _securityContextYaml(config: KubernetesExecutionConfig): string {
    const policy = config.policy?.kubernetes;
    return [
      `          securityContext:`,
      `            runAsNonRoot: ${policy?.runAsNonRoot ?? true}`,
      `            readOnlyRootFilesystem: ${policy?.readOnlyRootFilesystem ?? true}`,
      `            allowPrivilegeEscalation: ${policy?.allowPrivilegeEscalation ?? false}`,
    ].join("\n");
  }

  // ---------- Handle --------------------------------------------------------

  private _toPublicHandle(entry: K8sEntry): KubernetesExecutionHandle {
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
      get manifest() {
        return entry.manifest;
      },
      get jobName() {
        return entry.jobName;
      },
      get logs() {
        return entry.logs;
      },
      async attach() {
        await self.streamLogs(entry);
      },
      async destroy() {
        await self.destroy(entry.handle.id);
      },
    };
  }
}

function createKubectlInvoker(kubectlPath: string): KubectlInvoker {
  return (args, options) => new Promise<KubectlResult>((resolve, reject) => {
    const child = spawn(kubectlPath, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = options?.timeoutMs
      ? setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`kubectl timed out after ${options.timeoutMs}ms`));
      }, options.timeoutMs)
      : null;

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      if (timeout) clearTimeout(timeout);
      reject(error);
    });
    child.on("exit", (code) => {
      if (timeout) clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`kubectl exited with code ${code}: ${stderr.trim()}`));
      }
    });
    if (options?.input) {
      child.stdin?.end(options.input);
    } else {
      child.stdin?.end();
    }
  });
}

function normalizeKubectlError(prefix: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${prefix}: ${redactText(message)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redactEnvValue(name: string, value: string): string {
  return isSecretKey(name) ? "[REDACTED]" : value;
}

function redactText(value: string): string {
  return value.replace(/(token|secret|password|api[_-]?key)=\S+/gi, "$1=[REDACTED]");
}

function isSecretKey(key: string): boolean {
  return /(token|secret|password|api[_-]?key|credential)/i.test(key);
}
