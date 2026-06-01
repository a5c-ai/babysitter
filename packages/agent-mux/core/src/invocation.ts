/**
 * Invocation mode types for @a5c-ai/agent-mux.
 *
 * Defines how a harness process is spawned: locally, in Docker,
 * on a remote machine via SSH, or on a remote k8s cluster.
 */

import {
  getHarnessImages,
  lookupHarnessImage as lookupCatalogHarnessImage,
} from '@a5c-ai/atlas/catalog';

// ---------------------------------------------------------------------------
// Invocation Mode Discriminated Union
// ---------------------------------------------------------------------------

/** Local process invocation (default). Spawns directly on the host machine. */
export interface LocalInvocation {
  readonly mode: 'local';
}

/**
 * Docker invocation. Runs the harness inside a Docker container with
 * the working directory mounted.
 */
export interface DockerInvocation {
  readonly mode: 'docker';
  /** Docker image to use. If omitted, uses the catalog default for the harness. */
  readonly image?: string;
  /** Additional volumes to mount (host:container format). */
  readonly volumes?: string[];
  /** Additional environment variables for the container. */
  readonly env?: Record<string, string>;
  /** Docker network to attach to. */
  readonly network?: string;
  /** Working directory inside the container. @default '/workspace' */
  readonly workdir?: string;
}

/**
 * Remote SSH invocation. Connects to a remote machine, installs the
 * harness if needed, transfers files, invokes the CLI, and copies
 * modified files back.
 */
export interface SshInvocation {
  readonly mode: 'ssh';
  /** SSH host (user@host or just host). */
  readonly host: string;
  /** SSH port. @default 22 */
  readonly port?: number;
  /** Path to SSH identity file (private key). */
  readonly identityFile?: string;
  /** Remote working directory. Files are scp'd here before invocation. */
  readonly remoteDir?: string;
  /** Whether to install the harness on the remote machine if missing. @default true */
  readonly autoInstall?: boolean;
}

/**
 * Remote Kubernetes invocation. Snapshots relevant data, transfers it
 * to a pod, runs the harness in a container, and copies results back.
 */
export interface K8sInvocation {
  readonly mode: 'k8s';
  /** Kubernetes namespace. @default 'default' */
  readonly namespace?: string;
  /** Docker image for the pod. Uses the catalog default if omitted. */
  readonly image?: string;
  /** Resource requests/limits for the pod. */
  readonly resources?: {
    readonly cpu?: string;
    readonly memory?: string;
  };
  /** Kubernetes context to use. */
  readonly context?: string;
  /** Service account for the pod. */
  readonly serviceAccount?: string;
  /** Timeout for pod startup in milliseconds. @default 120000 */
  readonly podStartupTimeoutMs?: number;
  /**
   * If set, `kubectl exec` into this existing pod instead of creating a new
   * one. Mutually exclusive with `ephemeral`.
   */
  readonly pod?: string;
  /**
   * When true (default if `pod` is not provided), create a fresh ephemeral
   * pod via `kubectl run --rm` and tear it down on exit. When false, expect
   * `pod` to be set and `kubectl exec` into it.
   */
  readonly ephemeral?: boolean;
}

/** Discriminated union of all invocation modes. */
export type InvocationMode =
  | LocalInvocation
  | DockerInvocation
  | SshInvocation
  | K8sInvocation;

/** All valid invocation mode discriminant strings. */
export type InvocationModeType = InvocationMode['mode'];

// ---------------------------------------------------------------------------
// Harness Image Catalog
// ---------------------------------------------------------------------------

/** Entry in the harness Docker image catalog. */
export interface HarnessImageEntry {
  /** Harness name (e.g., 'claude-code', 'codex'). */
  readonly harness: string;
  /** Default Docker image for this harness. */
  readonly image: string;
  /** Tag to use. @default 'latest' */
  readonly tag?: string;
  /** Whether the image includes the harness CLI pre-installed. */
  readonly preinstalled: boolean;
}

/** Default image catalog for built-in harnesses. */
export const HARNESS_IMAGE_CATALOG: readonly HarnessImageEntry[] = getHarnessImages();

/**
 * Look up the default image for a harness.
 * Returns undefined if no catalog entry exists.
 */
export function lookupHarnessImage(harness: string): HarnessImageEntry | undefined {
  return lookupCatalogHarnessImage(harness);
}
