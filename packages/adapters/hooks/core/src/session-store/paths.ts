import * as path from 'path';
import * as os from 'os';

const SESSION_DIR_NAME = 'sessions';
const XDG_SUBPATH = path.join('a5c-hooks', SESSION_DIR_NAME);
const FALLBACK_SUBPATH = path.join('.a5c', 'state', 'hooks', SESSION_DIR_NAME);

/**
 * Resolve the default session directory, respecting XDG_STATE_HOME on POSIX.
 *
 * POSIX:    ${XDG_STATE_HOME:-~/.local/state}/a5c-hooks/sessions/
 * Fallback: ~/.a5c/state/hooks/sessions/
 */
export function getDefaultSessionDir(): string {
  const xdg = process.env['XDG_STATE_HOME'];
  if (xdg) {
    return path.join(xdg, XDG_SUBPATH);
  }

  if (process.platform !== 'win32') {
    return path.join(os.homedir(), '.local', 'state', XDG_SUBPATH);
  }

  // Windows / generic fallback
  return path.join(os.homedir(), FALLBACK_SUBPATH);
}

/**
 * Get the full file path for a session JSON file.
 */
export function getSessionFilePath(sessionId: string, sessionDir?: string): string {
  const dir = sessionDir ?? getDefaultSessionDir();
  return path.join(dir, `${sessionId}.json`);
}
