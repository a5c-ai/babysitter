import { type SessionFlowModel } from "@a5c-ai/tula-ui/session-flow";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/comm-adapter";
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
