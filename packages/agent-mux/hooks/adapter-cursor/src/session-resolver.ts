import { createHash } from 'crypto';

/**
 * Resolve session ID from Cursor hook invocation context.
 *
 * Cursor does NOT provide a native session_id in stdin payloads,
 * giving it 'derived' sessionIdQuality in the capability model.
 * The session ID is derived from workspace/cwd as a stable hash.
 *
 * Resolution precedence (per spec 9.2):
 *   1. Explicit AGENT_SESSION_ID env var
 *   2. CURSOR_SESSION_ID env var (Cursor-specific, if ever provided)
 *   3. Derived from workspace or cwd via stable hash
 *   4. null (no session available)
 */

export interface SessionResolutionResult {
  sessionId: string | null;
  source: 'explicit_env' | 'cursor_env' | 'derived' | 'none';
  /** Whether the ID was derived (hashed) rather than provided natively. */
  isDerived: boolean;
}

/**
 * Resolve the session ID for a Cursor hook invocation.
 *
 * @param stdinPayload - Parsed stdin JSON payload from Cursor
 * @param env - Environment variables at invocation time
 */
export function resolveSessionId(
  stdinPayload: Record<string, unknown>,
  env: Record<string, string> = {},
): SessionResolutionResult {
  // Priority 1: explicit env override
  const explicit = env['AGENT_SESSION_ID'];
  if (typeof explicit === 'string' && explicit.length > 0) {
    return { sessionId: explicit, source: 'explicit_env', isDerived: false };
  }

  // Priority 2: Cursor-specific env var (if Cursor ever adds one)
  const cursorEnv = env['CURSOR_SESSION_ID'];
  if (typeof cursorEnv === 'string' && cursorEnv.length > 0) {
    return { sessionId: cursorEnv, source: 'cursor_env', isDerived: false };
  }

  // Priority 3: derive from workspace or cwd
  const workspace = typeof stdinPayload['workspace'] === 'string'
    ? stdinPayload['workspace']
    : undefined;
  const cwd = typeof stdinPayload['cwd'] === 'string'
    ? stdinPayload['cwd']
    : env['PWD'] ?? env['HOMEDRIVE'] ?? undefined;

  const derivationSource = workspace ?? cwd;
  if (derivationSource) {
    const derived = deriveSessionId(derivationSource);
    return { sessionId: derived, source: 'derived', isDerived: true };
  }

  // Priority 4: no session
  return { sessionId: null, source: 'none', isDerived: false };
}

/**
 * Derive a stable session ID from a workspace or directory path.
 * Uses a truncated SHA-256 hash prefixed with 'cursor-' for identifiability.
 */
export function deriveSessionId(path: string): string {
  const hash = createHash('sha256').update(path).digest('hex').slice(0, 16);
  return `cursor-${hash}`;
}

/**
 * Validate that a session ID looks reasonable.
 */
export function isValidSessionId(sessionId: string): boolean {
  return sessionId.length > 0 && sessionId.length <= 256;
}
