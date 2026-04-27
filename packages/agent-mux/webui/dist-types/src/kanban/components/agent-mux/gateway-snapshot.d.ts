export type GatewayBootstrapResponse = {
    agents?: {
        agents: unknown[];
        agentDescriptors?: unknown[];
    };
    runs?: {
        runs: Array<Record<string, unknown>>;
    };
    sessions?: {
        sessions: Array<Record<string, unknown>>;
    };
};
export declare function loadGatewayBootstrapSnapshot(fetcher: (pathname: string) => Promise<unknown>): Promise<GatewayBootstrapResponse>;
