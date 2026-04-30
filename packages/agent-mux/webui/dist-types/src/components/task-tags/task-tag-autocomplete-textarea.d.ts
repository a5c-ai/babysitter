import type { ReactNode, TextareaHTMLAttributes } from "react";
import type { KanbanTaskTag } from "@a5c-ai/agent-mux-core/kanban";
interface TaskTagAutocompleteTextareaProps {
    value: string;
    onValueChange: (value: string) => void;
    taskTags: readonly KanbanTaskTag[];
    disabled?: boolean;
    className?: string;
    emptyText?: string;
    renderTextarea?: (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => ReactNode;
}
export declare function TaskTagAutocompleteTextarea({ value, onValueChange, taskTags, disabled, className, emptyText, renderTextarea, }: TaskTagAutocompleteTextareaProps): import("react/jsx-runtime").JSX.Element;
export {};
