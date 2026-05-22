import { promises as fs } from 'node:fs';
import type { AutomationExecutionRecord, AutomationRule } from '@a5c-ai/agent-mux-core';
import type { KanbanActivityEntry, KanbanCollaborator, KanbanDispatchContextLabelDefinition, KanbanDispatchContextLabelRef, KanbanIssue, KanbanPermissionGrant, KanbanProject, KanbanProjectSettings, KanbanTaskTag, KanbanTeam } from '@a5c-ai/agent-mux-core/kanban';
export declare const KANBAN_BACKLOG_FILE_PATH: string;
export type StoredKanbanProject = Omit<KanbanProject, 'metrics' | 'team' | 'settings' | 'permissions' | 'activity'> & {
    readonly team?: Partial<KanbanTeam>;
    readonly settings?: Partial<KanbanProjectSettings>;
    readonly permissions?: readonly KanbanPermissionGrant[];
    readonly activity?: readonly KanbanActivityEntry[];
};
export type StoredKanbanIssueDispatchState = Omit<Partial<KanbanIssue['dispatch']>, 'contextLabels' | 'executionContext' | 'renderedContext'> & {
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
export declare const defaultKanbanStorageDeps: KanbanStorageDeps;
export declare function readKanbanStorageFile(deps: KanbanStorageDeps): Promise<KanbanStoragePayload | null>;
export declare function writeKanbanStorageFile(deps: KanbanStorageDeps, payload: KanbanStoragePayload): Promise<void>;
