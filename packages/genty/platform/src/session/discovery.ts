import { getGlobalRegistry } from "../orchestration/global";

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
 * Resolve the current session ID from the ambient environment (markers + env vars).
 *
 * This is used for "autodiscovery" in contexts where no explicit session ID
 * was provided (e.g. journaling low-level events).
 *
 * Precedence:
 *   1. Harness-native env vars (Pi / oh-my-pi)
 *   2. AGENT_SESSION_ID
 *   3. SessionProvider.resolveSessionId() (provider-backed discovery)
 *
 * External harness session discovery is delegated to adapters.
 */
export function resolveAmbientSessionId(harness?: string): string | undefined {
  if (!harness) {
    return process.env.AGENT_SESSION_ID;
  }

  // Check harness-native env vars first.
  const envVars = HARNESS_ENV_VARS[harness] || [];
  for (const envVar of envVars) {
    const value = process.env[envVar];
    if (value) return value;
  }

  // Fall back to the generic env var.
  if (process.env.AGENT_SESSION_ID) {
    return process.env.AGENT_SESSION_ID;
  }

  // Ask the session provider for a marker-based session ID.
  try {
    return getGlobalRegistry().getSession().resolveSessionId();
  } catch {
    return undefined;
  }
}
