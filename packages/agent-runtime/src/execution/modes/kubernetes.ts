/**
 * KubernetesExecutor — generates Kubernetes Job manifests from
 * KubernetesExecutionConfig.
 *
 * This is a structural stub: it generates a valid Job YAML manifest and
 * stores it on the handle. In production this would `kubectl apply` the
 * manifest and poll for completion; here it creates a placeholder process
 * to satisfy the handle contract.
 */

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

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface K8sEntry {
  handle: MutableHandle;
  config: KubernetesExecutionConfig;
  /** The generated Job manifest YAML. */
  manifest: string;
}

interface MutableHandle {
  readonly id: string;
  readonly mode: "kubernetes";
  status: "running" | "stopped" | "failed";
}

// ---------------------------------------------------------------------------
// Extended handle that carries the manifest
// ---------------------------------------------------------------------------

export interface KubernetesExecutionHandle extends ExecutionHandle {
  readonly mode: "kubernetes";
  /** The generated Kubernetes Job manifest (YAML string). */
  readonly manifest: string;
}

// ---------------------------------------------------------------------------
// KubernetesExecutor
// ---------------------------------------------------------------------------

export class KubernetesExecutor implements Executor<KubernetesExecutionConfig> {
  private readonly entries = new Map<string, K8sEntry>();

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

    const entry: K8sEntry = { handle, config, manifest };
    this.entries.set(id, entry);

    // In production: kubectl apply -f - <<< manifest
    // Stub: mark as running immediately.

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

    // In production: kubectl delete job <name> -n <namespace>
    entry.handle.status = "stopped";
    this.entries.delete(id);
  }

  // ---------- Manifest generation -------------------------------------------

  /** Build a Kubernetes Job manifest YAML. */
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
      `apiVersion: batch/v1`,
      `kind: Job`,
      `metadata:`,
      `  name: ${jobName}`,
      `  namespace: ${config.namespace}`,
      `  labels:`,
      `    app.kubernetes.io/managed-by: babysitter`,
      `spec:`,
      `  backoffLimit: 0`,
      `  template:`,
      `    spec:`,
      serviceAccountLine ? serviceAccountLine.trimEnd() : null,
      `      restartPolicy: Never`,
      `      containers:`,
      `        - name: main`,
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

  /** Render a resources block for the container spec. */
  private _resourcesYaml(resources: Record<string, string>): string {
    const lines = Object.entries(resources).map(
      ([key, value]) => `              ${key}: "${value}"`,
    );
    return [
      `          resources:`,
      `            requests:`,
      ...lines,
      `            limits:`,
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
        `              value: ${JSON.stringify(value)}`,
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
      async attach() {
        // In production: kubectl logs -f job/<name> -n <namespace>
        // Stub: no-op.
      },
      async destroy() {
        await self.destroy(entry.handle.id);
      },
    };
  }
}
