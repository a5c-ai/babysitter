/**
 * Session ID resolution for Claude Code.
 *
 * Claude Code provides a native session_id in stdin JSON payloads,
 * so the resolution quality is 'native'.
 *
 * Resolution precedence (spec section 9.2):
 *   1. Explicit CLI flag --session-id
 *   2. Explicit env AGENT_SESSION_ID
 *   3. Native session_id from Claude stdin payload
 *   4. Fallback: null (no synthetic generation — Claude always provides session_id)
 */

export interface SessionResolutionResult {
  sessionId: string | null;
  source: 'explicit_flag' | 'explicit_env' | 'native' | 'none';
}

/**
 * Resolve the session ID for a Claude Code hook invocation.
 *
 * @param stdinData - Parsed stdin JSON payload from Claude.
 * @param env - Environment variables at invocation time.
 * @param explicitSessionId - Session ID from explicit CLI flag, if any.
 */
export function resolveSessionId(
  stdinData: Record<string, unknown>,
  env: Record<string, string> = {},
  explicitSessionId?: string,
): SessionResolutionResult {
  // 1. Explicit CLI flag
  if (explicitSessionId) {
    return { sessionId: explicitSessionId, source: 'explicit_flag' };
  }

  // 2. Explicit env
  const envSessionId = env['AGENT_SESSION_ID'];
  if (envSessionId) {
    return { sessionId: envSessionId, source: 'explicit_env' };
  }

  // 3. Native session_id from Claude stdin
  const nativeSessionId = stdinData.session_id;
  if (typeof nativeSessionId === 'string' && nativeSessionId.length > 0) {
    return { sessionId: nativeSessionId, source: 'native' };
  }

  // 4. No session ID available
  return { sessionId: null, source: 'none' };
}
