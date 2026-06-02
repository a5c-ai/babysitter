/**
 * Resolve session ID from Hermes hook invocation context.
 *
 * Hermes provides session identity via the HERMES_SESSION env var,
 * giving it 'native' sessionIdQuality in the capability model.
 *
 * Resolution precedence (per spec 9.2):
 *   1. Explicit AGENT_SESSION_ID env var (cross-adapter override)
 *   2. HERMES_SESSION env var (Hermes-native)
 *   3. HERMES_RUN_ID env var (Hermes run-scoped fallback)
 *   4. null (no session; caller decides fallback)
 */

/**
 * Extract session ID from Hermes environment and optional stdin payload.
 *
 * Unlike Codex, Hermes does not embed session_id in the stdin payload.
 * Session identity is purely environment-driven.
 *
 * @param stdinPayload - Parsed stdin JSON from Hermes hook (unused for session, kept for API symmetry)
 * @param env - Environment variables at invocation time
 * @returns Resolved session ID or null
 */
export function resolveSessionId(
  stdinPayload: Record<string, unknown>,
  env: Record<string, string> = {},
): string | null {
  // Priority 1: explicit cross-adapter env override
  const explicit = env['AGENT_SESSION_ID'];
  if (typeof explicit === 'string' && explicit.length > 0) {
    return explicit;
  }

  // Priority 2: Hermes-native session env var
  const hermesSession = env['HERMES_SESSION'];
  if (typeof hermesSession === 'string' && hermesSession.length > 0) {
    return hermesSession;
  }

  // Priority 3: Hermes run ID fallback
  const hermesRunId = env['HERMES_RUN_ID'];
  if (typeof hermesRunId === 'string' && hermesRunId.length > 0) {
    return hermesRunId;
  }

  return null;
}

/**
 * Validate that a session ID looks reasonable.
 * Hermes session IDs are typically opaque strings from the runtime.
 */
export function isValidSessionId(sessionId: string): boolean {
  // Accept non-empty strings of reasonable length
  return sessionId.length > 0 && sessionId.length <= 256;
}
