import type { Attachment } from "@a5c-ai/agent-mux-core";
import type { WorkspaceInventoryItem, WorkspaceInventoryResponse, WorkspaceSessionSnapshot } from "@/lib/workspace-lifecycle";
type WorkspaceSurfaceMode = "full" | "attention";
export declare function getWorkspaceOwnershipLabel(isAuthenticated: boolean, sessions: WorkspaceSessionSnapshot[], workspaces?: WorkspaceInventoryItem[]): string;
export declare function loadInventory(sessions: WorkspaceSessionSnapshot[], focusWorkspacePath?: string | null): Promise<WorkspaceInventoryResponse>;
export declare function runWorkspaceAction(action: "pin" | "unpin" | "archive" | "cleanup" | "recover" | "notes-save" | "rebase-start" | "rebase-auto-resolve" | "rebase-open-in-editor" | "rebase-mark-resolved" | "rebase-abort", workspacePath: string, sessions: WorkspaceSessionSnapshot[], note?: string): Promise<WorkspaceInventoryResponse>;
export declare function getWorkspaceAttentionReasons(workspace: WorkspaceInventoryItem): string[];
export declare function workspaceNeedsAttention(workspace: WorkspaceInventoryItem): boolean;
export declare function WorkspacesPageContent(props: {
    isAuthenticated: boolean;
    sessions: WorkspaceSessionSnapshot[];
    selectedWorkspacePath?: string | null;
    allRuns?: Array<Record<string, unknown>>;
    eventBuffers?: Record<string, {
        events: Record<string, unknown>[];
    } | undefined>;
    onSendPrompt?: (input: {
        sessionId: string;
        prompt: string;
        agent?: string;
        model?: string;
        attachments?: Attachment[];
        approvalMode?: "yolo" | "prompt" | "deny";
    }) => Promise<{
        runId?: string;
        sessionId?: string;
    } | void>;
    mode?: WorkspaceSurfaceMode;
}): import("react/jsx-runtime").JSX.Element;
export {};
