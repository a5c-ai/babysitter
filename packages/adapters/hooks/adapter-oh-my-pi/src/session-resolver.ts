import { createHash } from 'crypto';

/**
 * Resolve session ID from Oh-My-Pi extension event context.
 *
 * Oh-My-Pi provides NATIVE session IDs via the Pi runtime, giving
 * it 'native' sessionIdQuality in the capability model. When
 * a native session ID is not available, derivation from workspace
 * or cwd is used as a fallback.
 *
 * Resolution precedence (per spec 9.2):
 *   1. Explicit AGENT_SESSION_ID env var
 *   2. Native sessionId from event context (Pi runtime)
 *   3. OMP_SESSION_ID env var (harness-specific)
 *   4. Derived from workspace or cwd via stable hash
 *   5. null (no session available)
 */

export interface SessionResolutionResult {
  sessionId: string | null;
  source: 'explicit_env' | 'native' | 'harness_env' | 'derived' | 'none';
  /** Whether the ID was derived (hashed) rather than provided natively. */
  isDerived: boolean;
}

/**
 * Resolve the session ID for an Oh-My-Pi extension event.
 *
 * @param eventContext - Parsed event context object from the Pi extension API
 * @param env - Environment variables at invocation time
 */
export function resolveSessionId(
  eventContext: Record<string, unknown>,
  env: Record<string, string> = {},
): SessionResolutionResult {
  // Priority 1: explicit env override
  const explicit = env['AGENT_SESSION_ID'];
  if (typeof explicit === 'string' && explicit.length > 0) {
    return { sessionId: explicit, source: 'explicit_env', isDerived: false };
  }

  // Priority 2: native session ID from event context (Pi runtime)
  const nativeSessionId = eventContext['sessionId'];
  if (typeof nativeSessionId === 'string' && nativeSessionId.length > 0) {
    return { sessionId: nativeSessionId, source: 'native', isDerived: false };
  }

  // Priority 3: harness-specific env var
  const harnessEnv = env['OMP_SESSION_ID'];
  if (typeof harnessEnv === 'string' && harnessEnv.length > 0) {
    return { sessionId: harnessEnv, source: 'harness_env', isDerived: false };
  }

  // Priority 4: derive from workspace or cwd
  const workspace = typeof eventContext['workspace'] === 'string'
    ? eventContext['workspace']
    : undefined;
  const cwd = typeof eventContext['cwd'] === 'string'
    ? eventContext['cwd']
    : env['PWD'] ?? env['HOMEDRIVE'] ?? undefined;

  const derivationSource = workspace ?? cwd;
  if (derivationSource) {
    const derived = deriveSessionId(derivationSource);
    return { sessionId: derived, source: 'derived', isDerived: true };
  }

  // Priority 5: no session
  return { sessionId: null, source: 'none', isDerived: false };
}

/**
 * Derive a stable session ID from a workspace or directory path.
 * Uses a truncated SHA-256 hash prefixed with 'omp-' for identifiability.
 */
export function deriveSessionId(path: string): string {
  const hash = createHash('sha256').update(path).digest('hex').slice(0, 16);
  return `omp-${hash}`;
}

/**
 * Validate that a session ID looks reasonable.
 */
export function isValidSessionId(sessionId: string): boolean {
  return sessionId.length > 0 && sessionId.length <= 256;
}
