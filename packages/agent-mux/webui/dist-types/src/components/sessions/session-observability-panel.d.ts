import { type SessionFlowModel } from "@a5c-ai/agent-mux-ui/session-flow";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-comm";
interface EventBuffer {
    events: Array<Record<string, unknown>>;
}
export declare function SessionObservabilityPanel(props: {
    sessionId: string;
    runs: Array<Record<string, unknown>>;
    eventBuffers: Record<string, EventBuffer | undefined>;
    workspacePath?: string | null;
    runtime?: WorkspaceRuntimeSurface | null;
    flowModelOverride?: SessionFlowModel;
}): import("react/jsx-runtime").JSX.Element;
export {};
