import { type KanbanDispatchContextLabelDefinition } from "@a5c-ai/agent-mux-comm/kanban";
import { type KanbanStorageDeps } from "./kanban-storage";
export interface CreateDispatchContextLabelInput {
    readonly key: string;
    readonly label: string;
    readonly instruction: string;
    readonly description?: string;
    readonly order?: number;
}
export interface UpdateDispatchContextLabelInput {
    readonly key?: string;
    readonly label?: string;
    readonly instruction?: string;
    readonly description?: string;
    readonly order?: number;
}
export interface DispatchContextLabelMutationResult {
    readonly dispatchContextLabel: KanbanDispatchContextLabelDefinition;
    readonly dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
}
export interface DispatchContextLabelDeleteResult {
    readonly dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
}
interface DispatchContextLabelServiceDeps extends KanbanStorageDeps {
    readonly now: () => string;
    readonly createId: () => string;
}
export declare class DispatchContextLabelService {
    private readonly deps;
    constructor(overrides?: Partial<DispatchContextLabelServiceDeps>);
    private readStorage;
    private writeStorage;
    private assertUniqueKey;
    listDispatchContextLabels(): Promise<readonly KanbanDispatchContextLabelDefinition[]>;
    createDispatchContextLabel(input: CreateDispatchContextLabelInput): Promise<DispatchContextLabelMutationResult>;
    updateDispatchContextLabel(dispatchContextLabelId: string, input: UpdateDispatchContextLabelInput): Promise<DispatchContextLabelMutationResult>;
    deleteDispatchContextLabel(dispatchContextLabelId: string): Promise<DispatchContextLabelDeleteResult>;
}
export {};
