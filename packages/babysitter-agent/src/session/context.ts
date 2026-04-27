/**
 * Session context persistence for cross-run knowledge sharing (GAP-SESSION-001).
 * Stores accumulated notes and shared knowledge as a JSON file alongside the session state file.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { SessionContext } from './types';

/**
 * Get the file path for a session's context JSON file.
 */
export function getSessionContextPath(stateDir: string, sessionId: string): string {
  return `${stateDir}/${sessionId}.context.json`;
}

const EMPTY_CONTEXT: SessionContext = {
  notes: [],
  sharedKnowledge: {},
  worktree: undefined,
};

/**
 * Read session context from disk.
 * Returns empty context if the file does not exist.
 * Logs a warning and returns empty context if the file is corrupt.
 */
export async function getSessionContext(stateDir: string, sessionId: string): Promise<SessionContext> {
  const filePath = getSessionContextPath(stateDir, sessionId);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return { ...EMPTY_CONTEXT, sharedKnowledge: {} };
    }
    // Unexpected FS error — return empty rather than crash
    return { ...EMPTY_CONTEXT, sharedKnowledge: {} };
  }
  try {
    const data = JSON.parse(raw) as Partial<SessionContext>;
    return {
      notes: Array.isArray(data.notes) ? data.notes : [],
      sharedKnowledge: data.sharedKnowledge && typeof data.sharedKnowledge === 'object'
        ? data.sharedKnowledge
        : {},
      worktree: data.worktree && typeof data.worktree === 'object'
        ? data.worktree
        : undefined,
    };
  } catch {
    // Corrupt JSON — return empty context rather than crash
    return { ...EMPTY_CONTEXT, sharedKnowledge: {} };
  }
}

/**
 * Update session context by merging new data with existing context.
 * Notes are appended; sharedKnowledge keys are merged (newer values win).
 * Uses atomic temp-file + rename pattern to prevent partial writes.
 */
export async function updateSessionContext(
  stateDir: string,
  sessionId: string,
  updates: Partial<SessionContext>,
): Promise<SessionContext> {
  const existing = await getSessionContext(stateDir, sessionId);

  const merged: SessionContext = {
    notes: updates.notes ? [...existing.notes, ...updates.notes] : existing.notes,
    sharedKnowledge: updates.sharedKnowledge
      ? { ...existing.sharedKnowledge, ...updates.sharedKnowledge }
      : existing.sharedKnowledge,
    worktree: updates.worktree ? { ...(existing.worktree ?? {}), ...updates.worktree } : existing.worktree,
  };

  const filePath = getSessionContextPath(stateDir, sessionId);
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(merged), 'utf8');
  await fs.rename(tempPath, filePath);

  return merged;
}
