/**
 * Execution module — execution mode abstraction interfaces and implementations.
 */
export type {
  ExecutionMode,
  LocalExecutionConfig,
  DockerExecutionConfig,
  SshExecutionConfig,
  KubernetesExecutionConfig,
  ExecutionConfig,
  ExecutionHandle,
  ExecutionProvider,
  ExecutionPolicy,
  ExecutionEnvironmentPolicy,
  ExecutionFilesystemPolicy,
  ExecutionNetworkPolicy,
  ExecutionResourcePolicy,
  ExecutionSandboxPolicy,
  ExecutionMount,
  DockerPolicy,
  SshHostKeyPolicy,
  KubernetesPolicy,
  NormalizedResourceLimits,
} from "./types";

export {
  resolveExecutionEnvironment,
  validateFilesystemPolicy,
  validateFilesystemMounts,
  validateLocalExecutionPolicy,
  normalizeResourceLimits,
  admitExecutionPolicy,
  shouldInheritParentEnv,
} from "./policy";
export type { ResourceAdmission } from "./policy";

// Mode executors
export {
  LocalExecutor,
  DockerExecutor,
  SshExecutor,
  KubernetesExecutor,
} from "./modes";
export type { Executor, KubernetesExecutionHandle } from "./modes";

// Provider
export { ExecutionProviderImpl } from "./provider";
