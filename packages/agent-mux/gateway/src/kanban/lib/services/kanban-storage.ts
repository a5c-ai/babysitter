import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type {
  AutomationExecutionRecord,
  AutomationRule,
} from '@a5c-ai/agent-mux-comm';

import type {
  KanbanActivityEntry,
  KanbanCollaborator,
  KanbanDispatchContextLabelDefinition,
  KanbanDispatchContextLabelRef,
  KanbanIssue,
  KanbanPermissionGrant,
  KanbanProject,
  KanbanProjectSettings,
  KanbanTaskTag,
  KanbanTeam,
} from '@a5c-ai/agent-mux-comm/kanban';

export const KANBAN_BACKLOG_FILE_PATH =
  process.env.KANBAN_BACKLOG_FILE ?? path.join(os.homedir(), '.a5c', 'kanban-backlog.json');

export type StoredKanbanProject = Omit<
  KanbanProject,
  'metrics' | 'team' | 'settings' | 'permissions' | 'activity'
> & {
  readonly team?: Partial<KanbanTeam>;
  readonly settings?: Partial<KanbanProjectSettings>;
  readonly permissions?: readonly KanbanPermissionGrant[];
  readonly activity?: readonly KanbanActivityEntry[];
};

export type StoredKanbanIssueDispatchState = Omit<
  Partial<KanbanIssue['dispatch']>,
  'contextLabels' | 'contextLabelProjections' | 'executionContext' | 'renderedContext'
> & {
  readonly contextLabels?: readonly KanbanDispatchContextLabelRef[];
};

export type StoredKanbanIssue = Omit<KanbanIssue, 'dispatch' | 'collaborators' | 'activity'> & {
  readonly collaborators?: readonly KanbanCollaborator[];
  readonly activity?: readonly KanbanActivityEntry[];
  readonly dispatch?: StoredKanbanIssueDispatchState;
};

export type StoredKanbanTaskTag = KanbanTaskTag;
export type StoredKanbanDispatchContextLabel = KanbanDispatchContextLabelDefinition;

export interface KanbanStoragePayload {
  projects?: readonly StoredKanbanProject[];
  issues?: readonly StoredKanbanIssue[];
  taskTags?: readonly StoredKanbanTaskTag[];
  dispatchContextLabels?: readonly StoredKanbanDispatchContextLabel[];
  automationRules?: readonly AutomationRule[];
  automationExecutions?: readonly AutomationExecutionRecord[];
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
