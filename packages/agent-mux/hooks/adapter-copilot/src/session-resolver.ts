import { createHash } from 'crypto';

/**
 * Resolve a synthetic session ID for GitHub Copilot.
 *
 * Copilot CLI does not expose a stable native session ID.
 * We derive a deterministic synthetic ID from cwd + workspace,
 * producing a stable session key for a given project context.
 *
 * Derivation strategy:
 * - Primary key: workspace path (if available), else cwd
 * - Hashed with SHA-256 to produce a fixed-length, filesystem-safe ID
 * - Prefixed with 'copilot-' for easy identification
 *
 * This means all sessions in the same workspace share context,
 * which is acceptable since Copilot hooks are short-lived.
 * The session store handles timestamp-based staleness if needed.
 *
 * @param cwd - Current working directory
 * @param workspace - Workspace or project root path
 * @returns A deterministic synthetic session ID string
 */
export function resolveSyntheticSessionId(
  cwd?: string,
  workspace?: string,
): string {
  const key = workspace ?? cwd ?? 'unknown';
  const normalized = normalizePath(key);
  const hash = createHash('sha256').update(`copilot:${normalized}`).digest('hex').slice(0, 16);
  return `copilot-${hash}`;
}

/**
 * Normalize a file path for consistent hashing across platforms.
 * Lowercases on Windows-style paths and normalizes separators.
 */
function normalizePath(p: string): string {
  // Normalize backslashes to forward slashes
  let normalized = p.replace(/\\/g, '/');
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  // Lowercase drive letter on Windows paths (e.g. C:/ -> c:/)
  if (/^[A-Z]:\//.test(normalized)) {
    normalized = normalized[0].toLowerCase() + normalized.slice(1);
  }
  return normalized;
}
