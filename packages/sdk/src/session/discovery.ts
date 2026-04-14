import { resolveSessionIdWithMarker } from "../utils/sessionMarker";

/**
 * Mapping of harness identifiers to their native session environment variables.
 * These are used as the primary ambient discovery sources for harnesses that
 * inject their own per-session env vars. PID-scoped markers are only used as
 * the final fallback when direct/env-based resolution is unavailable.
 */
export const HARNESS_ENV_VARS: Record<string, string[]> = {
  "codex": ["CODEX_THREAD_ID", "CODEX_SESSION_ID"],
  "gemini-cli": ["GEMINI_SESSION_ID"],
  "github-copilot": ["COPILOT_SESSION_ID"],
  "pi": ["PI_SESSION_ID"],
  "oh-my-pi": ["OMP_SESSION_ID"],
  "claude-code": [], // Claude Code uses the marker or BABYSITTER_SESSION_ID directly
  "cursor": [],
};

/**
 * Resolve the current session ID from the ambient environment (markers + env vars).
 *
 * This is used for "autodiscovery" in contexts where no explicit session ID
 * was provided (e.g. journaling low-level events).
 *
 * Precedence matches the standard adapter resolution:
 *   1. Harness-native env vars (e.g. GEMINI_SESSION_ID)
 *   2. BABYSITTER_SESSION_ID
 *   3. PID-scoped marker for the given harness (fallback only)
 *
 * If BABYSITTER_TRUST_ENV_SESSION=1 is set, env vars are preferred over markers.
 */
export function resolveAmbientSessionId(harness?: string): string | undefined {
  if (!harness) {
    return process.env.BABYSITTER_SESSION_ID;
  }

  const envVars = HARNESS_ENV_VARS[harness] || [];
  return resolveSessionIdWithMarker(harness, {}, envVars);
}
