/**
 * Session state file writing utilities.
 * Provides atomic writes for session state files.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { SessionState } from './types';
import { SessionError, SessionErrorCode } from './types';

/**
 * Serialize session state to YAML frontmatter format.
 */
export function serializeSessionState(state: SessionState): string {
  const lines: string[] = [];

  lines.push(`active: ${state.active}`);
  lines.push(`iteration: ${state.iteration}`);
  lines.push(`max_iterations: ${state.maxIterations}`);
  lines.push(`run_id: "${state.runId}"`);
  lines.push(`run_ids: ${state.runIds.join(',')}`);
  lines.push(`started_at: "${state.startedAt}"`);
  lines.push(`last_iteration_at: "${state.lastIterationAt}"`);
  lines.push(`iteration_times: ${state.iterationTimes.join(',')}`);
  for (const [key, value] of Object.entries(state.metadata ?? {})) {
    lines.push(`metadata_${key}: "${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  }

  return lines.join('\n');
}

/**
 * Create full session file content with YAML frontmatter and prompt.
 */
export function createSessionFileContent(state: SessionState, prompt: string): string {
  const frontmatter = serializeSessionState(state);
  return `---\n${frontmatter}\n---\n\n${prompt}\n`;
}

/**
 * Write session state file atomically.
 * Uses temp file + rename pattern to ensure atomic writes.
 */
export async function writeSessionFile(
  filePath: string,
  state: SessionState,
  prompt: string
): Promise<void> {
  const content = createSessionFileContent(state, prompt);
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;

  try {
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write to temp file
    await fs.writeFile(tempPath, content, 'utf8');

    // Atomic rename
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    const err = error as NodeJS.ErrnoException;
    throw new SessionError(
      `Failed to write session state file: ${err.message}`,
      SessionErrorCode.FS_ERROR,
      { filePath, originalError: err.message }
    );
  }
}

/**
 * Update specific fields in an existing session state file.
 * Reads, modifies, and atomically writes the file.
 */
export async function updateSessionState(
  filePath: string,
  updates: Partial<SessionState>,
  existingContent?: { state: SessionState; prompt: string }
): Promise<SessionState> {
  let state: SessionState;
  let prompt: string;

  if (existingContent) {
    state = existingContent.state;
    prompt = existingContent.prompt;
  } else {
    // Read existing file
    const { readSessionFile } = await import('./parse');
    const file = await readSessionFile(filePath);
    state = file.state;
    prompt = file.prompt;
  }

  // Apply updates
  const updatedState: SessionState = {
    ...state,
    ...updates,
  };

  // Write updated file
  await writeSessionFile(filePath, updatedState, prompt);

  return updatedState;
}


/**
 * Bind a new run to the session, retiring the previous active run to history.
 *
 * Invariant: only one run is active at a time (`runId`).
 * The previous `runId` (if any) is pushed into `runIds` as audit history.
 * Idempotent: re-binding the same runId is a no-op.
 *
 * Throws if the caller tries to bind a new run while `runId` is still set
 * and `retirePrevious` is not explicitly true — this forces callers to
 * acknowledge that the prior run is done.
 */
export function addRunToSession(
  state: SessionState,
  runId: string,
  options?: { retirePrevious?: boolean },
): SessionState {
  // Idempotent: already bound to this run
  if (state.runId === runId) return state;

  // Guard: refuse to silently overwrite an active run
  if (state.runId && !options?.retirePrevious) {
    throw new SessionError(
      `Session already bound to run ${state.runId}. ` +
      `Pass { retirePrevious: true } to retire it and bind ${runId}.`,
      SessionErrorCode.RUN_ALREADY_ASSOCIATED,
      { currentRunId: state.runId, requestedRunId: runId },
    );
  }

  // Retire the old runId into history (if not already there)
  const runIds = [...state.runIds];
  if (state.runId && !runIds.includes(state.runId)) {
    runIds.push(state.runId);
  }
  // Add the new one to the audit trail too
  if (!runIds.includes(runId)) {
    runIds.push(runId);
  }

  return { ...state, runId, runIds };
}

/**
 * Get the historical audit trail of all run IDs for this session (GAP-SESSION-001).
 * Falls back to [runId] when runIds is empty for backward compatibility
 * with sessions created before the runIds field existed.
 */
export function getSessionRuns(state: SessionState): string[] {
  if (state.runIds.length > 0) return state.runIds;
  return state.runId ? [state.runId] : [];
}

/**
 * Get current ISO timestamp.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Convert ISO timestamp to epoch seconds.
 * Returns null if conversion fails.
 */
export function isoToEpochSeconds(isoTimestamp: string): number | null {
  if (!isoTimestamp) return null;
  try {
    const date = new Date(isoTimestamp);
    if (Number.isNaN(date.getTime())) return null;
    return Math.floor(date.getTime() / 1000);
  } catch {
    return null;
  }
}

/**
 * Calculate iteration duration and update times array.
 * Keeps only the last 10 durations for diagnostics.
 */
export function updateIterationTimes(
  existingTimes: number[],
  lastIterationAt: string,
  currentTime: string
): number[] {
  const lastEpoch = isoToEpochSeconds(lastIterationAt);
  const currentEpoch = isoToEpochSeconds(currentTime);

  if (lastEpoch === null || currentEpoch === null) {
    return existingTimes;
  }

  const duration = currentEpoch - lastEpoch;
  if (duration <= 0) {
    return existingTimes;
  }

  const newTimes = [...existingTimes, duration];
  // Keep only last 10
  return newTimes.slice(-10);
}



