import type { KanbanExecutionContextEnvelope } from "@a5c-ai/agent-mux-comm/kanban";
export declare function ExecutionContextPanel(props: {
    contexts: readonly KanbanExecutionContextEnvelope[];
    title?: string;
    description?: string;
    className?: string;
    compact?: boolean;
}): import("react/jsx-runtime").JSX.Element | null;
