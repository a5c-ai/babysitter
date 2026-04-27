import type { Attachment } from "@a5c-ai/agent-mux-core";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
type EventBuffer = {
    events: Array<Record<string, unknown>>;
};
type SessionWorkspaceShellProps = {
    sessionId: string;
    sessionTitle: string;
    sessionAgent: string;
    sessionStatus: string;
    totalCostLabel: string;
    runs: Array<Record<string, unknown>>;
    eventBuffers: Record<string, EventBuffer | undefined>;
    workspacePath: string | null;
    runtime?: WorkspaceRuntimeSurface;
    sessionModel?: string | null;
    onSubmit: (input: {
        sessionId: string;
        prompt: string;
        agent?: string;
        model?: string;
        attachments?: Attachment[];
        approvalMode?: "yolo" | "prompt" | "deny";
    }) => Promise<void>;
};
export declare function SessionWorkspaceShell(props: SessionWorkspaceShellProps): import("react/jsx-runtime").JSX.Element;
export {};
