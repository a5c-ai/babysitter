/**
 * Session ID resolution for Pi.
 *
 * Pi provides a native session ID via its programmatic API,
 * so the resolution quality is 'native'.
 *
 * Resolution precedence (spec section 9.2):
 *   1. Explicit override (e.g. from caller)
 *   2. Explicit env/extension-state AGENT_SESSION_ID
 *   3. Native sessionId from Pi event payload
 *   4. PI_SESSION_ID from extension-state
 *   5. Fallback: null
 */

export interface SessionResolutionResult {
  sessionId: string | null;
  source: 'explicit_override' | 'explicit_env' | 'native' | 'harness_env' | 'none';
}

/**
 * Resolve the session ID for a Pi hook invocation.
 *
 * @param data - Parsed event payload from Pi.
 * @param extensionState - Extension-state key-value pairs.
 * @param explicitSessionId - Explicit session ID override from caller, if any.
 */
export function resolveSessionId(
  data: Record<string, unknown>,
  extensionState: Record<string, string> = {},
  explicitSessionId?: string,
): SessionResolutionResult {
  // 1. Explicit override
  if (explicitSessionId) {
    return { sessionId: explicitSessionId, source: 'explicit_override' };
  }

  // 2. Explicit env
  const envSessionId = extensionState['AGENT_SESSION_ID'];
  if (envSessionId) {
    return { sessionId: envSessionId, source: 'explicit_env' };
  }

  // 3. Native sessionId from Pi event
  const nativeSessionId = data.sessionId;
  if (typeof nativeSessionId === 'string' && nativeSessionId.length > 0) {
    return { sessionId: nativeSessionId, source: 'native' };
  }

  // 4. PI_SESSION_ID from extension-state
  const piSessionId = extensionState['PI_SESSION_ID'];
  if (piSessionId) {
    return { sessionId: piSessionId, source: 'harness_env' };
  }

  // 5. No session ID available
  return { sessionId: null, source: 'none' };
}
