import * as fs from 'fs';
import * as path from 'path';
import { SessionState, ContextFragment } from '../types/session';
import { getDefaultSessionDir, getSessionFilePath } from './paths';
import { acquireLock, releaseLock } from './lock';

/** Schema version written into every persisted session envelope. */
export const SESSION_SCHEMA_VERSION = 'a5c.hooks.session.v1';

interface SessionEnvelope {
  schemaVersion: string;
  session: SessionState;
}

/**
 * Return the resolved session directory.
 */
export function getSessionDir(): string {
  return getDefaultSessionDir();
}

/**
 * Load a session from disk.  Returns null when the file does not exist or
 * cannot be parsed (corruption -> backup + null).
 */
export async function loadSession(
  sessionId: string,
  sessionDir?: string,
): Promise<SessionState | null> {
  const filePath = getSessionFilePath(sessionId, sessionDir);

  let raw: string;
  try {
    raw = await fs.promises.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }

  try {
    const envelope = JSON.parse(raw) as SessionEnvelope;
    return envelope.session;
  } catch {
    // Corruption detected -- back up and return null
    const backupPath = `${filePath}.corrupt.${Date.now()}`;
    await fs.promises.rename(filePath, backupPath).catch(() => {/* best effort */});
    console.warn(
      `[session-store] Corrupt session file for "${sessionId}"; backed up to ${backupPath}`,
    );
    return null;
  }
}

/**
 * Persist a session atomically (temp -> fsync -> rename).
 */
export async function saveSession(
  session: SessionState,
  sessionDir?: string,
): Promise<void> {
  const filePath = getSessionFilePath(session.sessionId, sessionDir);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  const envelope: SessionEnvelope = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    session,
  };

  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const fd = await fs.promises.open(tmpPath, 'w');
  try {
    await fd.writeFile(JSON.stringify(envelope, null, 2), 'utf-8');
    await fd.sync();
  } finally {
    await fd.close();
  }

  await fs.promises.rename(tmpPath, filePath);
}

/**
 * Delete a session file.  Silently succeeds if the file is already gone.
 */
export async function deleteSession(
  sessionId: string,
  sessionDir?: string,
): Promise<void> {
  const filePath = getSessionFilePath(sessionId, sessionDir);
  try {
    await fs.promises.unlink(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/**
 * Read-modify-write a session under a file lock.
 */
export async function updateSession(
  sessionId: string,
  updater: (state: SessionState) => SessionState,
  sessionDir?: string,
): Promise<void> {
  const filePath = getSessionFilePath(sessionId, sessionDir);
  await acquireLock(filePath);
  try {
    const current = await loadSession(sessionId, sessionDir);
    if (!current) {
      throw new Error(`Session "${sessionId}" not found -- cannot update`);
    }
    const updated = updater(current);
    await saveSession(updated, sessionDir);
  } finally {
    await releaseLock(filePath);
  }
}

/**
 * Append a context fragment to a session's ordered list.
 */
export async function addContextFragment(
  sessionId: string,
  fragment: ContextFragment,
  sessionDir?: string,
): Promise<void> {
  await updateSession(
    sessionId,
    (state) => ({
      ...state,
      contextFragments: [...state.contextFragments, fragment],
      updatedAt: new Date().toISOString(),
    }),
    sessionDir,
  );
}
