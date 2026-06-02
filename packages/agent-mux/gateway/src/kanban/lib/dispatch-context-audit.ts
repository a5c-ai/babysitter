import type {
  KanbanBacklogSnapshot,
  KanbanDispatchContextExecutionEnvelope,
  KanbanIssue,
} from "@a5c-ai/agent-mux-comm/kanban";

export interface DispatchContextAuditRecord {
  readonly issueId: string;
  readonly issueKey: string;
  readonly issueTitle: string;
  readonly runIds: readonly string[];
  readonly sessionIds: readonly string[];
  readonly lastDispatchedAt?: string;
  readonly executionContext: KanbanDispatchContextExecutionEnvelope;
}

function compareAuditRecords(left: DispatchContextAuditRecord, right: DispatchContextAuditRecord): number {
  const leftTimestamp = Date.parse(left.lastDispatchedAt ?? "");
  const rightTimestamp = Date.parse(right.lastDispatchedAt ?? "");
  return (
    (Number.isFinite(rightTimestamp) ? rightTimestamp : 0) - (Number.isFinite(leftTimestamp) ? leftTimestamp : 0) ||
    right.runIds.length - left.runIds.length ||
    left.issueKey.localeCompare(right.issueKey)
  );
}

function toAuditRecord(issue: KanbanIssue): DispatchContextAuditRecord | null {
  if (!issue.dispatch.executionContext) {
    return null;
  }

  return {
    issueId: issue.id,
    issueKey: issue.key,
    issueTitle: issue.title,
    runIds: issue.dispatch.runIds,
    sessionIds: issue.dispatch.sessionIds,
    lastDispatchedAt: issue.dispatch.lastDispatchedAt,
    executionContext: issue.dispatch.executionContext,
  };
}

export function findDispatchContextAuditsByRunId(
  snapshot: KanbanBacklogSnapshot | null | undefined,
  runId: string,
): DispatchContextAuditRecord[] {
  if (!snapshot || !runId) {
    return [];
  }

  return snapshot.issues
    .flatMap((issue) => {
      const audit = toAuditRecord(issue);
      return audit && audit.runIds.includes(runId) ? [audit] : [];
    })
    .sort(compareAuditRecords);
}

export function findDispatchContextAuditsBySessionId(
  snapshot: KanbanBacklogSnapshot | null | undefined,
  sessionId: string,
): DispatchContextAuditRecord[] {
  if (!snapshot || !sessionId) {
    return [];
  }

  return snapshot.issues
    .flatMap((issue) => {
      const audit = toAuditRecord(issue);
      return audit && audit.sessionIds.includes(sessionId) ? [audit] : [];
    })
    .sort(compareAuditRecords);
}
