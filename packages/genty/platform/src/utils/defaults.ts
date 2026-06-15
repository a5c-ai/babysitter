/**
 * Local orchestration defaults.
 *
 * These constants were previously imported from @a5c-ai/babysitter-sdk DEFAULTS.
 * Defined locally so the platform does not need a runtime SDK import for them.
 */

export const ORCHESTRATION_DEFAULTS = {
  /** Maximum iterations for a single orchestration run. */
  maxIterations: 65_000,
} as const;
