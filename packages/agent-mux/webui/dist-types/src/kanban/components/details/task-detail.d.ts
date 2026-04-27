import type { KanbanExecutionContextEnvelope } from "@a5c-ai/agent-mux-core/kanban";
import type { DispatchContextAuditRecord } from "@/lib/dispatch-context-audit";
interface TaskDetailPanelProps {
    runId: string;
    effectId: string | null;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    runDuration?: number;
    allTasks?: import("@/types").TaskEffect[];
    executionContexts?: readonly KanbanExecutionContextEnvelope[];
    executionAudits?: readonly DispatchContextAuditRecord[];
}
export declare function TaskDetailPanel({ runId, effectId, activeTab, onTabChange, runDuration, allTasks, executionContexts, executionAudits, }: TaskDetailPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
