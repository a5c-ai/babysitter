import path from "node:path";
import type {
  ExecutionPolicy,
  LocalExecutionConfig,
  NormalizedResourceLimits,
} from "./types";

export interface ResourceAdmission {
  readonly accepted: boolean;
  readonly osLimits: NormalizedResourceLimits;
  readonly unsupported: string[];
  readonly warnings: string[];
}

export function resolveExecutionEnvironment(
  explicitEnv?: Record<string, string>,
  policy?: ExecutionPolicy,
  parentEnv: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const env: Record<string, string> = {};
  const environment = policy?.environment;

  if (environment?.inheritParentEnv) {
    for (const [key, value] of Object.entries(parentEnv)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
  }

  for (const key of environment?.allow ?? []) {
    const value = parentEnv[key];
    if (value !== undefined) {
      env[key] = value;
    }
  }

  Object.assign(env, explicitEnv ?? {}, environment?.values ?? {});

  for (const key of environment?.deny ?? []) {
    delete env[key];
  }

  return env;
}

export function validateFilesystemPolicy(cwd: string, policy?: ExecutionPolicy): void {
  const filesystem = policy?.filesystem;
  if (!filesystem?.allowedRoots?.length) {
    return;
  }

  const resolvedCwd = path.resolve(cwd);
  const allowedRoots = filesystem.allowedRoots.map((root) => path.resolve(root));

  if (!allowedRoots.some((root) => isPathInside(resolvedCwd, root))) {
    throw new Error(
      `Execution cwd "${cwd}" is outside the configured filesystem allowed roots`,
    );
  }

  for (const mount of filesystem.mounts ?? []) {
    if (!allowedRoots.some((root) => isPathInside(path.resolve(mount.hostPath), root))) {
      throw new Error(
        `Execution mount "${mount.hostPath}" is outside the configured filesystem allowed roots`,
      );
    }
  }
}

export function validateLocalExecutionPolicy(config: LocalExecutionConfig): void {
  const policy = config.policy;
  validateFilesystemPolicy(config.cwd, policy);

  if (!policy) {
    return;
  }

  const allowUnsupported = policy.sandbox?.allowUnsupportedLocal === true;
  const requestedSandbox =
    policy.sandbox?.requireNamespaces ||
    policy.sandbox?.requireChroot ||
    policy.sandbox?.requireSeccomp ||
    policy.sandbox?.requireCapabilitiesDrop;

  if (requestedSandbox && !allowUnsupported) {
    throw new Error(
      "Local executor cannot enforce sandbox guarantees such as namespaces, chroot, seccomp, or capabilities",
    );
  }

  if (policy.network && !allowUnsupported) {
    throw new Error(
      "Local executor cannot enforce network policy; use Docker/Kubernetes or allowUnsupportedLocal explicitly",
    );
  }

  const unsupportedResourceRequests = [];
  if (policy.resources?.cpuCount !== undefined) unsupportedResourceRequests.push("cpu");
  if (policy.resources?.memoryBytes !== undefined) unsupportedResourceRequests.push("memory");
  if (policy.resources?.pidsLimit !== undefined) unsupportedResourceRequests.push("pids");
  if (policy.resources?.openFilesLimit !== undefined) unsupportedResourceRequests.push("openFiles");

  if (unsupportedResourceRequests.length > 0 && !allowUnsupported) {
    throw new Error(
      `Local executor cannot enforce OS resource limits: ${unsupportedResourceRequests.join(", ")}`,
    );
  }
}

export function normalizeResourceLimits(policy?: ExecutionPolicy): NormalizedResourceLimits {
  const resources = policy?.resources;
  return {
    cpuCount: resources?.cpuCount,
    memoryBytes: resources?.memoryBytes,
    pidsLimit: resources?.pidsLimit,
    openFilesLimit: resources?.openFilesLimit,
    timeoutMs: resources?.timeoutMs,
    maxOutputBytes: resources?.maxOutputBytes,
  };
}

export function admitExecutionPolicy(policy?: ExecutionPolicy): ResourceAdmission {
  const osLimits = normalizeResourceLimits(policy);
  const unsupported: string[] = [];

  if (osLimits.openFilesLimit !== undefined) {
    unsupported.push("openFilesLimit");
  }

  return {
    accepted: unsupported.length === 0,
    osLimits,
    unsupported,
    warnings: unsupported.map(
      (name) => `${name} is tracked as policy metadata but is not enforced by ResourceManagerImpl`,
    ),
  };
}

export function shouldInheritParentEnv(policy?: ExecutionPolicy): boolean {
  return policy?.environment?.inheritParentEnv === true;
}

function isPathInside(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
