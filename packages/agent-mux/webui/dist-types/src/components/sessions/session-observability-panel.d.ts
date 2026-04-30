import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
interface EventBuffer {
    events: Array<Record<string, unknown>>;
}
export declare function SessionObservabilityPanel(props: {
    sessionId: string;
    runs: Array<Record<string, unknown>>;
    eventBuffers: Record<string, EventBuffer | undefined>;
    workspacePath?: string | null;
    runtime?: WorkspaceRuntimeSurface | null;
}): import("react/jsx-runtime").JSX.Element;
export {};
