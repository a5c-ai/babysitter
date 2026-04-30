export declare function useRunDetail(runId: string, intervalOverride?: number): {
    run: import("@/types").Run | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    hasBreakpointWaiting: boolean;
};
export declare function useTaskDetail(runId: string, effectId: string | null): {
    task: import("@/types").TaskDetail | null;
    loading: boolean;
    error: string | null;
};
