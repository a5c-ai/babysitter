/**
 * Resolve session ID from Codex hook invocation context.
 *
 * Codex provides a native session_id in stdin payloads, giving it
 * 'native' sessionIdQuality in the capability model.
 *
 * Resolution precedence (per spec 9.2):
 *   1. Explicit --session-id CLI flag (handled upstream)
 *   2. Explicit AGENT_SESSION_ID env var
 *   3. Native session_id from stdin payload
 *   4. CODEX_THREAD_ID env var (Codex-specific)
 *   5. null (no session; caller decides fallback)
 */

/**
 * Extract session ID from Codex stdin payload and environment.
 *
 * @param stdinPayload - Parsed stdin JSON from Codex hook
 * @param env - Environment variables at invocation time
 * @returns Resolved session ID or null
 */
export function resolveSessionId(
  stdinPayload: Record<string, unknown>,
  env: Record<string, string> = {},
): string | null {
  // Priority 1: explicit env override
  const explicit = env['AGENT_SESSION_ID'];
  if (typeof explicit === 'string' && explicit.length > 0) {
    return explicit;
  }

  // Priority 2: native session_id from stdin payload
  const native = stdinPayload['session_id'];
  if (typeof native === 'string' && native.length > 0) {
    return native;
  }

  // Priority 3: Codex-specific env var
  const codexThreadId = env['CODEX_THREAD_ID'];
  if (typeof codexThreadId === 'string' && codexThreadId.length > 0) {
    return codexThreadId;
  }

  return null;
}

/**
 * Validate that a session ID looks reasonable.
 * Codex session IDs are typically UUIDs or similar opaque strings.
 */
export function isValidSessionId(sessionId: string): boolean {
  // Accept non-empty strings of reasonable length
  return sessionId.length > 0 && sessionId.length <= 256;
}
