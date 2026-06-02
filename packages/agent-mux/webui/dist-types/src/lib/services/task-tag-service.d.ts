import { type KanbanTaskTag } from "@a5c-ai/agent-mux-comm/kanban";
import { type KanbanStorageDeps } from "./kanban-storage";
export interface CreateTaskTagInput {
    readonly key: string;
    readonly label: string;
    readonly content: string;
    readonly description?: string;
    readonly order?: number;
}
export interface UpdateTaskTagInput {
    readonly key?: string;
    readonly label?: string;
    readonly content?: string;
    readonly description?: string;
    readonly order?: number;
}
export interface TaskTagMutationResult {
    readonly taskTag: KanbanTaskTag;
    readonly taskTags: readonly KanbanTaskTag[];
}
export interface TaskTagDeleteResult {
    readonly taskTags: readonly KanbanTaskTag[];
}
interface TaskTagServiceDeps extends KanbanStorageDeps {
    readonly now: () => string;
    readonly createId: () => string;
}
export declare class TaskTagService {
    private readonly deps;
    constructor(overrides?: Partial<TaskTagServiceDeps>);
    private readStorage;
    private writeStorage;
    private assertUniqueKey;
    listTaskTags(): Promise<readonly KanbanTaskTag[]>;
    createTaskTag(input: CreateTaskTagInput): Promise<TaskTagMutationResult>;
    updateTaskTag(taskTagId: string, input: UpdateTaskTagInput): Promise<TaskTagMutationResult>;
    deleteTaskTag(taskTagId: string): Promise<TaskTagDeleteResult>;
}
export {};
