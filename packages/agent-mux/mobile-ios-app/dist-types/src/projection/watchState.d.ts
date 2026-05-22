import type { GatewayStoreState } from '@a5c-ai/agent-mux-ui';
export type WatchStateProjection = {
    generatedAt: number;
    runs: Array<{
        runId: string;
        agent: string;
        status: string;
    }>;
    hooks: Array<{
        hookRequestId: string;
        runId: string;
        kind: string;
        secondsRemaining: number;
    }>;
};
export type WatchStateEnvelope = {
    full: WatchStateProjection;
    diff: Partial<WatchStateProjection>;
    byteLength: number;
};
export declare function projectWatchState(state: GatewayStoreState, previous?: WatchStateProjection): WatchStateEnvelope;
//# sourceMappingURL=watchState.d.ts.map