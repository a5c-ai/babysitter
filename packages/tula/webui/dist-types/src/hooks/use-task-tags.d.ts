import type { KanbanTaskTag } from "@a5c-ai/comm-adapter/kanban";
export declare function useTaskTags(): {
    taskTags: readonly KanbanTaskTag[];
    loading: boolean;
    error: string | null;
};
