import type { GatewayStoreState } from '@a5c-ai/agent-mux-ui';
export type WearStateProjection = {
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
export type WearStateEnvelope = {
    full: WearStateProjection;
    diff: Partial<WearStateProjection>;
    byteLength: number;
};
export declare function projectWearState(state: GatewayStoreState, previous?: WearStateProjection): WearStateEnvelope;
//# sourceMappingURL=wearState.d.ts.map