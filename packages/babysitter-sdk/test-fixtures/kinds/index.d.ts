export declare const nodeKindFixtures: {
    id: string;
    args: {
        target: string;
        cacheKey: string;
    };
    helperLabels: string[];
    metadata: {
        subsystem: string;
    };
    env: {
        sample: {
            NODE_AUTH_TOKEN: string;
            CI_SECRET: string;
            GITHUB_TOKEN: string;
            DB_PASSWORD: string;
            PUBLIC_URL: string;
            LOG_LEVEL: string;
        };
        expectedSafe: {
            PUBLIC_URL: string;
            LOG_LEVEL: string;
        };
        expectedRedacted: string[];
    };
};
export declare const breakpointKindFixtures: {
    id: string;
    payload: {
        reason: string;
        branch: string;
    };
    metadata: {
        severity: string;
    };
};
export declare const orchestratorKindFixtures: {
    id: string;
    payload: {
        op: string;
        stage: string;
    };
    metadata: {
        iteration: number;
    };
    resumeCommand: string;
};
export declare const sleepKindFixtures: {
    id: string;
    args: {
        iso: string;
        targetEpochMs: number;
    };
    helperLabels: string[];
};
//# sourceMappingURL=index.d.ts.map