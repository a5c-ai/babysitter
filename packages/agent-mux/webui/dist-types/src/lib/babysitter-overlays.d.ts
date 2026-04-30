import type { KanbanBacklogSnapshot, KanbanBoardSnapshot, KanbanReviewDecision, KanbanReviewArtifact, KanbanWorkflowState } from "@a5c-ai/agent-mux-core/kanban";
import type { Run } from "@/types";
export type BabysitterOverlayStage = "dispatch" | "executing" | "review" | "recovery" | "done";
export interface BoardExecutionOverlay {
    issueId: string;
    issueKey: string;
    issueTitle: string;
    workflowState: KanbanWorkflowState;
    stage: BabysitterOverlayStage;
    stageLabel: string;
    reviewDecision?: KanbanReviewDecision;
    runIds: string[];
    sessionIds: string[];
    runCount: number;
    activeRuns: number;
    failedRuns: number;
    completedRuns: number;
    staleRuns: number;
    retryCount: number;
    pendingBreakpoints: number;
    stuck: boolean;
    primaryRunId?: string;
    primarySessionId?: string;
    updatedAt?: string;
}
export interface RunHealthRecord {
    runId: string;
    processId: string;
    projectName?: string;
    sessionId?: string;
    status: Run["status"];
    retryCount: number;
    stuck: boolean;
    pendingBreakpoints: number;
    severity: "healthy" | "attention" | "critical";
    recoveryHref: string;
    reviewHref?: string;
    summary: string;
    updatedAt: string;
}
export interface RunArtifactShortcut {
    runId: string;
    processId: string;
    status: Run["status"];
    sessionId?: string;
    breakpointEffectId?: string;
    errorEffectId?: string;
    logTaskCount: number;
    resultTaskCount: number;
    pendingBreakpointCount: number;
    failedTaskCount: number;
}
export interface SessionTimelineItem {
    id: string;
    runId: string;
    kind: "run" | "user" | "assistant" | "thinking" | "tool" | "approval" | "error" | "complete";
    label: string;
    text: string;
    href?: string;
}
interface SessionEventBuffer {
    events: Array<Record<string, unknown>>;
}
export declare function buildBoardExecutionOverlays(input: {
    snapshot?: KanbanBacklogSnapshot;
    board?: KanbanBoardSnapshot;
    runs: Run[];
    reviewArtifacts?: readonly KanbanReviewArtifact[];
    nowMs?: number;
}): BoardExecutionOverlay[];
export declare function buildRunHealthRecords(runs: Run[], nowMs?: number): RunHealthRecord[];
export declare function buildRunArtifactShortcuts(runs: Array<Record<string, unknown>>): RunArtifactShortcut[];
export declare function buildSessionTimeline(runs: Array<Record<string, unknown>>, eventBuffers: Record<string, SessionEventBuffer | undefined>): SessionTimelineItem[];
export {};
