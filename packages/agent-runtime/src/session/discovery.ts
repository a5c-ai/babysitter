import { resolveSessionIdWithMarker } from "@a5c-ai/babysitter-sdk";

/**
 * Mapping of harness identifiers to their native session environment variables.
 *
 * Only Pi-specific env vars are kept here. External harness session discovery
 * is handled by agent-mux session management.
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
 *   3. PID-scoped marker for the given harness (fallback only)
 *
 * External harness session discovery is delegated to agent-mux.
 */
export function resolveAmbientSessionId(harness?: string): string | undefined {
  if (!harness) {
    return process.env.AGENT_SESSION_ID;
  }

  const envVars = HARNESS_ENV_VARS[harness] || [];
  return resolveSessionIdWithMarker(harness, {}, envVars);
}
