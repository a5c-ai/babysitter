import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { AutomationRule } from '../../../../agent-mux/core/src/automation.js';
import type { KanbanIssue, KanbanProject } from '../../../../agent-mux/core/src/kanban.js';

export const KANBAN_BACKLOG_FILE_PATH =
  process.env.KANBAN_BACKLOG_FILE ?? path.join(os.homedir(), '.a5c', 'kanban-backlog.json');

export type StoredKanbanProject = Omit<KanbanProject, 'metrics'>;

export type StoredKanbanIssue = Omit<KanbanIssue, 'dispatch'> & {
  readonly dispatch?: Partial<KanbanIssue['dispatch']>;
};

export interface KanbanStoragePayload {
  projects?: readonly StoredKanbanProject[];
  issues?: readonly StoredKanbanIssue[];
  automationRules?: readonly AutomationRule[];
}

export interface KanbanStorageDeps {
  readFile: typeof fs.readFile;
  writeFile: typeof fs.writeFile;
  backlogFilePath: string;
}

export const defaultKanbanStorageDeps: KanbanStorageDeps = {
  readFile: fs.readFile,
  writeFile: fs.writeFile,
  backlogFilePath: KANBAN_BACKLOG_FILE_PATH,
};

export async function readKanbanStorageFile(
  deps: KanbanStorageDeps,
): Promise<KanbanStoragePayload | null> {
  try {
    const raw = await deps.readFile(deps.backlogFilePath, 'utf8');
    return JSON.parse(raw) as KanbanStoragePayload;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeKanbanStorageFile(
  deps: KanbanStorageDeps,
  payload: KanbanStoragePayload,
): Promise<void> {
  await deps.writeFile(deps.backlogFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}
