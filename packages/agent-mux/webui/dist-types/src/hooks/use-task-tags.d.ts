import type { KanbanTaskTag } from "@a5c-ai/agent-mux-comm/kanban";
export declare function useTaskTags(): {
    taskTags: readonly KanbanTaskTag[];
    loading: boolean;
    error: string | null;
};
