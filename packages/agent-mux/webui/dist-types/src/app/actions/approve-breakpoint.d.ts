export interface ApproveBreakpointResult {
    success: boolean;
    error?: string;
}
export declare function approveBreakpoint(runId: string, effectId: string, answer: string): Promise<ApproveBreakpointResult>;
