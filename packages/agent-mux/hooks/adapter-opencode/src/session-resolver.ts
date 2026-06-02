import * as crypto from 'crypto';

/**
 * Resolve a session ID for OpenCode.
 *
 * OpenCode provides a native session ID in the event payload.
 * Resolution priority:
 *
 *   1. Explicit env: AGENT_SESSION_ID or HOOKS_PROXY_SESSION_ID
 *   2. Native session ID from the event payload (`sessionId`)
 *   3. OpenCode-specific env: OPENCODE_SESSION_ID
 *   4. Derived from workspace (cwd) + a date-bucket fallback
 *
 * Spec section 9.2 -- session ID quality: 'native'.
 */
export function resolveSessionId(
  eventData: Record<string, unknown>,
  env: Record<string, string>,
): string | null {
  // 1. Explicit session ID from env (highest priority)
  if (env['AGENT_SESSION_ID']) {
    return env['AGENT_SESSION_ID'];
  }
  if (env['HOOKS_PROXY_SESSION_ID']) {
    return env['HOOKS_PROXY_SESSION_ID'];
  }

  // 2. Native session ID from event payload
  if (typeof eventData['sessionId'] === 'string' && eventData['sessionId']) {
    return eventData['sessionId'] as string;
  }

  // 3. OpenCode-specific env
  if (env['OPENCODE_SESSION_ID']) {
    return env['OPENCODE_SESSION_ID'];
  }

  // 4. Derive from workspace + date bucket
  const cwd = (eventData['cwd'] as string | undefined) ?? env['PWD'] ?? null;
  if (cwd != null) {
    return deriveSessionId(cwd);
  }

  return null;
}

/**
 * Derive a deterministic session ID from the workspace directory.
 *
 * Uses a 15-minute time bucket so that events within the same working
 * session are grouped together, while separate launches in different
 * time windows get different IDs.
 */
export function deriveSessionId(cwd: string): string {
  const bucketMs = 15 * 60 * 1000; // 15 minutes
  const timeBucket = Math.floor(Date.now() / bucketMs);
  const input = `opencode:${cwd}:${timeBucket}`;
  const hash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
  return `opencode-derived-${hash}`;
}
