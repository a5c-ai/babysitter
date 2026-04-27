import type { DispatchContextAuditRecord } from "@/lib/dispatch-context-audit";
import type { TaskDetail } from "@/types";
import type { KanbanExecutionContextEnvelope } from "@a5c-ai/agent-mux-core/kanban";
export declare function AgentPanel({ task, executionContexts, executionAudits, }: {
    task: TaskDetail | null;
    executionContexts?: readonly KanbanExecutionContextEnvelope[];
    executionAudits?: readonly DispatchContextAuditRecord[];
}): import("react/jsx-runtime").JSX.Element;
