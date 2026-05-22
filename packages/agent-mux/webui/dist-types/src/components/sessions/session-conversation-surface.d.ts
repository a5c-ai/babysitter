import type { Attachment, WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import type { SessionCost, SessionFlowModel } from "@a5c-ai/agent-mux-ui/session-flow";
type EventBuffer = {
    events: Array<Record<string, unknown>>;
};
type ApprovalMode = "yolo" | "prompt" | "deny";
type ComposerSubmitInput = {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
    attachments?: Attachment[];
    approvalMode?: ApprovalMode;
};
type SessionConversationSurfaceProps = {
    sessionId: string;
    sessionLabel: string;
    sessionAgent: string;
    sessionStatus: string;
    sessionModel?: string | null;
    runs: Array<Record<string, unknown>>;
    eventBuffers: Record<string, EventBuffer | undefined>;
    workspacePath?: string | null;
    runtime?: WorkspaceRuntimeSurface;
    disabled?: boolean;
    emptyStateTitle: string;
    emptyStateBody: string;
    openSessionHref?: string;
    submitLabel?: string;
    placeholder: string;
    flowModelOverride?: SessionFlowModel;
    sessionCostOverride?: SessionCost | null;
    onSubmit: (input: ComposerSubmitInput) => Promise<void>;
};
export type { ComposerSubmitInput };
export declare function SessionConversationSurface(props: SessionConversationSurfaceProps): import("react/jsx-runtime").JSX.Element;
