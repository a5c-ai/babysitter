import type { KanbanBacklogSnapshot, KanbanDispatchContextExecutionEnvelope } from "@a5c-ai/agent-mux-core/kanban";
export interface DispatchContextAuditRecord {
    readonly issueId: string;
    readonly issueKey: string;
    readonly issueTitle: string;
    readonly runIds: readonly string[];
    readonly sessionIds: readonly string[];
    readonly lastDispatchedAt?: string;
    readonly executionContext: KanbanDispatchContextExecutionEnvelope;
}
export declare function findDispatchContextAuditsByRunId(snapshot: KanbanBacklogSnapshot | null | undefined, runId: string): DispatchContextAuditRecord[];
export declare function findDispatchContextAuditsBySessionId(snapshot: KanbanBacklogSnapshot | null | undefined, sessionId: string): DispatchContextAuditRecord[];
