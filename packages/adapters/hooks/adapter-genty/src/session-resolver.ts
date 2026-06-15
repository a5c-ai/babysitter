/**
 * Resolve session ID from genty hook invocation context.
 *
 * Genty provides session identity via the AGENT_SESSION_ID env var,
 * giving it 'generated' sessionIdQuality in the capability model.
 *
 * Resolution precedence:
 *   1. Explicit AGENT_SESSION_ID env var
 *   2. HOOKS_PROXY_SESSION_ID env var (cross-adapter override)
 *   3. null (no session; caller decides)
 */

/**
 * Extract session ID from genty environment.
 *
 * @param stdinPayload - Parsed stdin JSON (may contain session_id)
 * @param env - Environment variables at invocation time
 * @returns Resolved session ID or null
 */
export function resolveSessionId(
  stdinPayload: Record<string, unknown>,
  env: Record<string, string> = {},
): string | null {
  // Priority 1: explicit session ID from env
  const agentSession = env['AGENT_SESSION_ID'];
  if (typeof agentSession === 'string' && agentSession.length > 0) {
    return agentSession;
  }

  // Priority 2: cross-adapter override
  const proxySession = env['HOOKS_PROXY_SESSION_ID'];
  if (typeof proxySession === 'string' && proxySession.length > 0) {
    return proxySession;
  }

  // Priority 3: session_id from stdin payload
  const stdinSession = stdinPayload['session_id'];
  if (typeof stdinSession === 'string' && stdinSession.length > 0) {
    return stdinSession;
  }

  return null;
}

/**
 * Validate that a session ID looks reasonable.
 */
export function isValidSessionId(sessionId: string): boolean {
  return sessionId.length > 0 && sessionId.length <= 256;
}
