/**
 * Mapping of harness identifiers to their native session environment variables.
 *
 * Only Pi-specific env vars are kept here. External harness session discovery
 * is handled by adapters session management.
 */
export const HARNESS_ENV_VARS: Record<string, string[]> = {
  "pi": ["PI_SESSION_ID"],
  "oh-my-pi": ["OMP_SESSION_ID"],
};

/**
 * Resolve the current session ID from the ambient environment.
 *
 * This is used for "autodiscovery" in contexts where no explicit session ID
 * was provided (e.g. journaling low-level events).
 *
 * Precedence:
 *   1. Harness-native env vars (Pi / oh-my-pi)
 *   2. AGENT_SESSION_ID
 *
 * PID-scoped marker resolution is handled by the SDK session layer if
 * the SDK is present at runtime. This local implementation covers the
 * environment-variable path which is sufficient for genty-runtime's
 * internal needs (cost journaling, health observation).
 */
export function resolveAmbientSessionId(harness?: string): string | undefined {
  if (!harness) {
    return process.env.AGENT_SESSION_ID;
  }

  // Check harness-native env vars first.
  const envVars = HARNESS_ENV_VARS[harness] || [];
  for (const key of envVars) {
    const value = process.env[key];
    if (value) return value;
  }

  // Fall back to the generic agent session ID.
  return process.env.AGENT_SESSION_ID;
}
