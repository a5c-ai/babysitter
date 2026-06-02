import * as crypto from 'crypto';

/**
 * Resolve a session ID for Gemini CLI.
 *
 * Gemini CLI does not provide a native session ID on stdin.
 * The session ID is derived from available signals:
 *
 *   1. Explicit env: AGENT_SESSION_ID or HOOKS_PROXY_SESSION_ID
 *   2. Gemini-specific env: GEMINI_SESSION_ID
 *   3. Derived from workspace (cwd) + a date-bucket to avoid accidental
 *      cross-session merging while keeping the ID stable within a session window.
 *
 * Spec section 9.2 — session ID quality: 'derived'.
 */
export function resolveSessionId(
  stdinData: Record<string, unknown>,
  env: Record<string, string>,
): string | null {
  // 1. Explicit session ID from env (highest priority)
  if (env['AGENT_SESSION_ID']) {
    return env['AGENT_SESSION_ID'];
  }
  if (env['HOOKS_PROXY_SESSION_ID']) {
    return env['HOOKS_PROXY_SESSION_ID'];
  }

  // 2. Gemini-specific session env
  if (env['GEMINI_SESSION_ID']) {
    return env['GEMINI_SESSION_ID'];
  }

  // 3. Derive from workspace + date bucket
  const cwd = (stdinData.cwd as string | undefined) ?? env['PWD'] ?? null;
  if (cwd != null) {
    return deriveSessionId(cwd);
  }

  return null;
}

/**
 * Derive a deterministic session ID from the workspace directory.
 *
 * Uses a 15-minute time bucket so that hooks fired within the same
 * working session are grouped together, while separate launches
 * in different time windows get different IDs.
 *
 * The bucket window is intentionally coarse to keep the same session ID
 * stable across rapid hook invocations within a single CLI session.
 */
export function deriveSessionId(cwd: string): string {
  const bucketMs = 15 * 60 * 1000; // 15 minutes
  const timeBucket = Math.floor(Date.now() / bucketMs);
  const input = `gemini:${cwd}:${timeBucket}`;
  const hash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
  return `gemini-derived-${hash}`;
}
