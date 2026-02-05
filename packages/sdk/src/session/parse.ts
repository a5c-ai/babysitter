/**
 * Session state file parsing utilities.
 * Parses markdown files with YAML frontmatter for session state.
 */

import { promises as fs } from 'node:fs';
import type { SessionState, SessionFile } from './types';
import { SessionError, SessionErrorCode } from './types';

/**
 * Default session state values.
 */
export const DEFAULT_SESSION_STATE: SessionState = {
  active: false,
  iteration: 1,
  maxIterations: 256,
  runId: '',
  startedAt: '',
  lastIterationAt: '',
  iterationTimes: [],
};

/**
 * Parse YAML frontmatter from a string.
 * Expects format:
 * ```
 * ---
 * key: value
 * ---
 * content
 * ```
 */
export function parseYamlFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const lines = content.split('\n');
  const frontmatter: Record<string, string> = {};
  let inFrontmatter = false;
  let frontmatterEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        frontmatterEnd = i;
        break;
      }
    }

    if (inFrontmatter && line) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        frontmatter[key] = value;
      }
    }
  }

  const body = frontmatterEnd >= 0
    ? lines.slice(frontmatterEnd + 1).join('\n').trim()
    : content;

  return { frontmatter, body };
}

/**
 * Parse session state from YAML frontmatter values.
 */
export function parseSessionState(frontmatter: Record<string, string>): SessionState {
  const parseNumber = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  };

  const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  };

  const parseNumberArray = (value: string | undefined): number[] => {
    if (!value || value.trim() === '') return [];
    return value
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0);
  };

  return {
    active: parseBoolean(frontmatter.active, DEFAULT_SESSION_STATE.active),
    iteration: parseNumber(frontmatter.iteration, DEFAULT_SESSION_STATE.iteration),
    maxIterations: parseNumber(frontmatter.max_iterations, DEFAULT_SESSION_STATE.maxIterations),
    runId: frontmatter.run_id ?? DEFAULT_SESSION_STATE.runId,
    startedAt: frontmatter.started_at ?? DEFAULT_SESSION_STATE.startedAt,
    lastIterationAt: frontmatter.last_iteration_at ?? DEFAULT_SESSION_STATE.lastIterationAt,
    iterationTimes: parseNumberArray(frontmatter.iteration_times),
  };
}

/**
 * Read and parse a session state file.
 */
export async function readSessionFile(filePath: string): Promise<SessionFile> {
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new SessionError(
        `Session state file not found: ${filePath}`,
        SessionErrorCode.SESSION_NOT_FOUND,
        { filePath }
      );
    }
    throw new SessionError(
      `Failed to read session state file: ${err.message}`,
      SessionErrorCode.FS_ERROR,
      { filePath, originalError: err.message }
    );
  }

  const { frontmatter, body } = parseYamlFrontmatter(content);
  const state = parseSessionState(frontmatter);

  return {
    state,
    prompt: body,
    filePath,
  };
}

/**
 * Check if a session state file exists.
 */
export async function sessionFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate session state values.
 * Throws SessionError if validation fails.
 */
export function validateSessionState(state: SessionState): void {
  if (typeof state.iteration !== 'number' || !Number.isFinite(state.iteration) || state.iteration < 0) {
    throw new SessionError(
      `Invalid iteration value: ${state.iteration}`,
      SessionErrorCode.INVALID_STATE_VALUE,
      { field: 'iteration', value: state.iteration }
    );
  }

  if (typeof state.maxIterations !== 'number' || !Number.isFinite(state.maxIterations) || state.maxIterations < 0) {
    throw new SessionError(
      `Invalid maxIterations value: ${state.maxIterations}`,
      SessionErrorCode.INVALID_STATE_VALUE,
      { field: 'maxIterations', value: state.maxIterations }
    );
  }
}

/**
 * Get the state file path for a session.
 */
export function getSessionFilePath(stateDir: string, sessionId: string): string {
  return `${stateDir}/${sessionId}.md`;
}
