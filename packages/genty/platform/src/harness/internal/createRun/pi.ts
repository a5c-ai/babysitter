/**
 * Legacy Pi module — re-exports from agent-core-loop.ts for backwards compat.
 *
 * All canonical implementations now live in ./agent-core-loop.ts.
 * This file preserves the old Pi-prefixed names so existing imports
 * continue to work during migration.
 */

export {
  // Canonical exports
  TRANSIENT_PROMPT_RETRY_DELAYS_MS,
  PARENT_PROMPT_TIMEOUT_MS,
  DEFAULT_PROMPT_TIMEOUT_MS,
  WORKER_TIMEOUT_MS,
  readBooleanMetadata,
  readBashSandboxMetadata,
  readStringMetadata,
  isProcessModuleLoadFailure,
  isRetryablePromptFailure,
  isIgnorablePromptFailure,
  promptWithRetry,
  buildWorkerSessionOptions,
  resolveAgentCoreBackendForHarness,
} from "./agent-core-loop";

// Legacy Pi aliases
export {
  TRANSIENT_PROMPT_RETRY_DELAYS_MS as TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS,
  PARENT_PROMPT_TIMEOUT_MS as PI_PARENT_PROMPT_TIMEOUT_MS,
  DEFAULT_PROMPT_TIMEOUT_MS as PI_DEFAULT_PROMPT_TIMEOUT_MS,
  WORKER_TIMEOUT_MS as PI_WORKER_TIMEOUT_MS,
  isRetryablePromptFailure as isRetryablePiPromptFailure,
  isIgnorablePromptFailure as isIgnorablePiPromptFailure,
  promptWithRetry as promptPiWithRetry,
  buildWorkerSessionOptions as buildPiWorkerSessionOptions,
} from "./agent-core-loop";
