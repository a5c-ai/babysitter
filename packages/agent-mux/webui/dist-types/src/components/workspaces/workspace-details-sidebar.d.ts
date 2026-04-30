import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import type { KanbanIntegrationProvider, KanbanReviewArtifact } from "@a5c-ai/agent-mux-core/kanban";
import type { WorkspaceInventoryItem } from "@/lib/workspace-lifecycle";
type WorkspaceSidebarAction = "rebase-start" | "rebase-auto-resolve" | "rebase-open-in-editor" | "rebase-mark-resolved" | "rebase-abort";
export interface WorkspaceSidebarFeedback {
    tone: "success" | "error";
    message: string;
}
export declare function WorkspaceDetailsSidebar(props: {
    workspace: WorkspaceInventoryItem;
    runtime?: WorkspaceRuntimeSurface;
    reviewArtifact?: KanbanReviewArtifact | null;
    sessionId?: string;
    sessionStatus?: string;
    pendingAction: string | null;
    notesSaving: boolean;
    reviewPending: boolean;
    feedback?: WorkspaceSidebarFeedback | null;
    onAction: (action: WorkspaceSidebarAction, workspace: WorkspaceInventoryItem) => void;
    onOpenInEditor: (workspace: WorkspaceInventoryItem, href: string | null) => void;
    onSaveNote: (workspace: WorkspaceInventoryItem, note: string) => void;
    onCreatePullRequest: (workspace: WorkspaceInventoryItem, input: {
        provider: KanbanIntegrationProvider;
        title: string;
        reviewers?: string;
        branchName?: string;
        baseBranch?: string;
    }) => void;
    onLinkPullRequest: (workspace: WorkspaceInventoryItem, input: {
        provider: KanbanIntegrationProvider;
        number: number;
        title: string;
        branchName?: string;
        baseBranch?: string;
    }) => void;
}): import("react/jsx-runtime").JSX.Element;
export {};
