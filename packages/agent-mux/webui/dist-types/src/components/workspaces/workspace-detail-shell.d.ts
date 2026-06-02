import type { Attachment } from "@a5c-ai/agent-mux-comm";
import type { KanbanIntegrationProvider, KanbanReviewArtifact } from "@a5c-ai/agent-mux-comm/kanban";
import type { WorkspaceInventoryItem, WorkspaceSessionSnapshot } from "@/lib/workspace-lifecycle";
import { type WorkspaceSidebarFeedback } from "@/components/workspaces/workspace-details-sidebar";
type EventBuffer = {
    events: Array<Record<string, unknown>>;
};
type WorkspaceSidebarAction = "rebase-start" | "rebase-auto-resolve" | "rebase-open-in-editor" | "rebase-mark-resolved" | "rebase-abort";
type WorkspaceDetailShellProps = {
    workspace: WorkspaceInventoryItem;
    sessions: WorkspaceSessionSnapshot[];
    activeSession: WorkspaceSessionSnapshot | null;
    runs: Array<Record<string, unknown>>;
    eventBuffers: Record<string, EventBuffer | undefined>;
    totalCostLabel: string;
    selectedSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    pendingAction: string | null;
    notesSaving: boolean;
    canSendMessages?: boolean;
    reviewArtifact?: KanbanReviewArtifact | null;
    reviewPending: boolean;
    feedback?: WorkspaceSidebarFeedback | null;
    onSubmit: (input: {
        sessionId: string;
        prompt: string;
        agent?: string;
        model?: string;
        attachments?: Attachment[];
        approvalMode?: "yolo" | "prompt" | "deny";
    }) => Promise<void>;
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
};
export declare function WorkspaceDetailShell(props: WorkspaceDetailShellProps): import("react/jsx-runtime").JSX.Element;
export {};
