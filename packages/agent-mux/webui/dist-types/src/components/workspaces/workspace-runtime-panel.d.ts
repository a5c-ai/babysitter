import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-comm";
import type { KanbanExecutionContextEnvelope } from "@a5c-ai/agent-mux-comm/kanban";
import type { DispatchContextAuditRecord } from "@/lib/dispatch-context-audit";
export declare function WorkspaceRuntimePanel(props: {
    runtime: WorkspaceRuntimeSurface;
    rebase?: WorkspaceRuntimeSurface["rebase"];
    sessionId?: string;
    sessionStatus?: string;
    audits?: readonly DispatchContextAuditRecord[];
    className?: string;
    executionContexts?: readonly KanbanExecutionContextEnvelope[];
}): import("react/jsx-runtime").JSX.Element;
