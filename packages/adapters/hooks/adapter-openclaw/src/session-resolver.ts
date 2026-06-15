/**
 * Session ID resolution for OpenClaw.
 *
 * OpenClaw provides session IDs through two channels:
 *   - Plugin hooks: sessionId field in event data
 *   - Gateway hooks: correlationId field (NOT a true session ID)
 *
 * Resolution quality is 'derived' because the session ID comes from
 * plugin context rather than a native harness session mechanism.
 *
 * Resolution precedence (spec section 9.2):
 *   1. Explicit CLI flag --session-id
 *   2. Explicit env AGENT_SESSION_ID
 *   3. Plugin sessionId from event data
 *   4. Gateway correlationId as fallback (tagged as 'derived')
 *   5. null
 */

export interface SessionResolutionResult {
  sessionId: string | null;
  source: 'explicit_flag' | 'explicit_env' | 'plugin' | 'gateway_correlation' | 'none';
}

/**
 * Resolve the session ID for an OpenClaw hook invocation.
 *
 * @param eventData - Parsed event data from OpenClaw.
 * @param env - Environment variables at invocation time.
 * @param explicitSessionId - Session ID from explicit CLI flag, if any.
 */
export function resolveSessionId(
  eventData: Record<string, unknown>,
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

  // 3. Plugin sessionId
  const pluginSessionId = eventData.sessionId;
  if (typeof pluginSessionId === 'string' && pluginSessionId.length > 0) {
    return { sessionId: pluginSessionId, source: 'plugin' };
  }

  // 4. Gateway correlationId as fallback
  const correlationId = eventData.correlationId;
  if (typeof correlationId === 'string' && correlationId.length > 0) {
    return { sessionId: correlationId, source: 'gateway_correlation' };
  }

  // 5. No session ID available
  return { sessionId: null, source: 'none' };
}
