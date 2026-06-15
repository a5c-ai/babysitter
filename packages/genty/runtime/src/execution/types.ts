/**
 * Execution mode abstraction for Babysitter Agent Runtime.
 *
 * Defines how effects and sub-agents are spawned — locally, in Docker,
 * over SSH, or on Kubernetes. Interface-only stubs; implementations
 * will follow in issue #217.
 */

// ---------------------------------------------------------------------------
// Execution Mode
// ---------------------------------------------------------------------------

/** Supported execution environments. */
export type ExecutionMode = "local" | "docker" | "ssh" | "kubernetes";

// ---------------------------------------------------------------------------
// Execution Policy
// ---------------------------------------------------------------------------

export interface ExecutionEnvironmentPolicy {
  readonly inheritParentEnv?: boolean;
  readonly allow?: string[];
  readonly values?: Record<string, string>;
  readonly deny?: string[];
  readonly redact?: string[];
}

export interface ExecutionMount {
  readonly hostPath: string;
  readonly containerPath: string;
  readonly readOnly?: boolean;
}

export interface ExecutionFilesystemPolicy {
  readonly allowedRoots?: string[];
  readonly mounts?: ExecutionMount[];
  readonly readOnlyRootFilesystem?: boolean;
}

export interface ExecutionNetworkPolicy {
  readonly mode?: "none" | "bridge" | "host" | "custom";
  readonly name?: string;
  readonly dns?: string[];
  readonly allowEgress?: string[];
  readonly blockEgress?: string[];
}

export interface ExecutionResourcePolicy {
  readonly cpuCount?: number;
  readonly memoryBytes?: number;
  readonly pidsLimit?: number;
  readonly openFilesLimit?: number;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

export type NormalizedResourceLimits = ExecutionResourcePolicy;

export interface ExecutionSandboxPolicy {
  readonly requireNamespaces?: boolean;
  readonly requireChroot?: boolean;
  readonly requireSeccomp?: boolean;
  readonly requireCapabilitiesDrop?: boolean;
  readonly allowUnsupportedLocal?: boolean;
}

export interface DockerPolicy {
  readonly readOnlyRootFilesystem?: boolean;
  readonly user?: string;
  readonly capDrop?: string[];
  readonly securityOpt?: string[];
  readonly skipPreflight?: boolean;
  readonly insecureAllowPrivilegedOptions?: boolean;
}

export interface SshHostKeyPolicy {
  readonly strictHostKeyChecking?: "yes" | "accept-new";
  readonly knownHostsFile?: string;
  readonly insecureSkipHostKeyChecking?: boolean;
}

export interface KubernetesPolicy {
  readonly runAsNonRoot?: boolean;
  readonly readOnlyRootFilesystem?: boolean;
  readonly allowPrivilegeEscalation?: boolean;
}

export interface ExecutionPolicy {
  readonly environment?: ExecutionEnvironmentPolicy;
  readonly filesystem?: ExecutionFilesystemPolicy;
  readonly network?: ExecutionNetworkPolicy;
  readonly resources?: ExecutionResourcePolicy;
  readonly sandbox?: ExecutionSandboxPolicy;
  readonly docker?: DockerPolicy;
  readonly ssh?: SshHostKeyPolicy;
  readonly kubernetes?: KubernetesPolicy;
}

// ---------------------------------------------------------------------------
// Per-Mode Config
// ---------------------------------------------------------------------------

/** Configuration for local (host-process) execution. */
export interface LocalExecutionConfig {
  readonly mode: "local";
  /** Working directory for spawned processes. */
  readonly cwd: string;
  /** Optional environment variable overrides. */
  readonly env?: Record<string, string>;
  /** Shared execution policy. Secure defaults apply when omitted. */
  readonly policy?: ExecutionPolicy;
}

/** Configuration for Docker-based execution. */
export interface DockerExecutionConfig {
  readonly mode: "docker";
  /** Container image reference (e.g. "node:20-slim"). */
  readonly image: string;
  /** Volume mounts in "host:container" format. */
  readonly volumes?: string[];
  /** Docker network to attach to. */
  readonly network?: string;
  /** Optional environment variable overrides. */
  readonly env?: Record<string, string>;
  /** Shared execution policy. Secure defaults apply when omitted. */
  readonly policy?: ExecutionPolicy;
}

/** Configuration for SSH-based remote execution. */
export interface SshExecutionConfig {
  readonly mode: "ssh";
  /** Remote hostname or IP address. */
  readonly host: string;
  /** SSH port; defaults to 22. */
  readonly port?: number;
  /** Remote user. */
  readonly user: string;
  /** Path to the private key file. */
  readonly keyPath?: string;
  /** Optional environment variable overrides. */
  readonly env?: Record<string, string>;
  /** Shared execution policy. Secure defaults apply when omitted. */
  readonly policy?: ExecutionPolicy;
}

/** Configuration for Kubernetes pod-based execution. */
export interface KubernetesExecutionConfig {
  readonly mode: "kubernetes";
  /** Kubernetes namespace. */
  readonly namespace: string;
  /** Container image reference. */
  readonly image: string;
  /** Optional environment variable overrides. */
  readonly env?: Record<string, string>;
  /** Service account to run under. */
  readonly serviceAccount?: string;
  /** Resource requests/limits (e.g. `{ cpu: "500m", memory: "256Mi" }`). */
  readonly resources?: Record<string, string>;
  /** Shared execution policy. Secure defaults apply when omitted. */
  readonly policy?: ExecutionPolicy;
  /** Maximum time to wait for Job completion. Defaults to 5 minutes. */
  readonly timeoutMs?: number;
  /** Maximum time for each kubectl invocation. */
  readonly kubectlTimeoutMs?: number;
  /** Delete the Job after terminal success, failure, or timeout. */
  readonly cleanupAfterCompletion?: boolean;
}

// ---------------------------------------------------------------------------
// Discriminated Union
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all execution config types.
 * Discriminant field is `mode`.
 */
export type ExecutionConfig =
  | LocalExecutionConfig
  | DockerExecutionConfig
  | SshExecutionConfig
  | KubernetesExecutionConfig;

// ---------------------------------------------------------------------------
// Handle
// ---------------------------------------------------------------------------

/** Handle to a running or completed execution. */
export interface ExecutionHandle {
  /** Unique identifier for this execution instance. */
  readonly id: string;
  /** The execution mode this handle was spawned with. */
  readonly mode: ExecutionMode;
  /** Current lifecycle status. */
  readonly status: "running" | "stopped" | "failed";
  /**
   * Attach to the execution's I/O streams (e.g. for log tailing).
   */
  attach(): Promise<void>;
  /**
   * Tear down the execution and release its resources.
   */
  destroy(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/** Abstraction over an execution backend. */
export interface ExecutionProvider {
  /**
   * Spawn a new execution from the given config.
   *
   * @param config - Discriminated execution configuration.
   * @returns A handle to the running execution.
   */
  spawn(config: ExecutionConfig): Promise<ExecutionHandle>;

  /**
   * Re-attach to a previously spawned execution.
   *
   * @param id - Execution identifier returned by a prior `spawn`.
   * @returns The handle, or undefined if not found.
   */
  attach(id: string): Promise<ExecutionHandle | undefined>;

  /**
   * List all known execution handles managed by this provider.
   */
  list(): Promise<ExecutionHandle[]>;

  /**
   * Destroy an execution by ID.
   *
   * @param id - Execution identifier.
   */
  destroy(id: string): Promise<void>;
}
