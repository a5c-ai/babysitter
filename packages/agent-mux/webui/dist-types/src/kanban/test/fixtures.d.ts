import type { EventType, JournalEvent, ProjectSummary, Run, RunDigest, RunStatus, TaskDetail, TaskEffect, TaskKind, TaskStatus } from '@/types';
import type { BreakpointPayload } from '@/types/breakpoint';
export declare function resetIdCounter(): void;
export interface CreateMockTaskEffectOptions {
    effectId?: string;
    kind?: TaskKind;
    title?: string;
    label?: string;
    status?: TaskStatus;
    invocationKey?: string;
    stepId?: string;
    taskId?: string;
    requestedAt?: string;
    resolvedAt?: string;
    startedAt?: string;
    finishedAt?: string;
    duration?: number;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    breakpointQuestion?: string;
    agent?: {
        name: string;
        prompt?: {
            role: string;
            task: string;
            instructions: string[];
        };
    };
}
export declare function createMockTaskEffect(overrides?: CreateMockTaskEffectOptions): TaskEffect;
export interface CreateMockJournalEventOptions {
    seq?: number;
    id?: string;
    ts?: string;
    type?: EventType;
    payload?: Record<string, unknown>;
}
export declare function createMockJournalEvent(overrides?: CreateMockJournalEventOptions): JournalEvent;
export interface CreateMockRunOptions {
    runId?: string;
    processId?: string;
    status?: RunStatus;
    createdAt?: string;
    updatedAt?: string;
    completedAt?: string;
    sessionId?: string;
    tasks?: TaskEffect[];
    events?: JournalEvent[];
    totalTasks?: number;
    completedTasks?: number;
    failedTasks?: number;
    duration?: number;
    failedStep?: string;
    breakpointQuestion?: string;
    sourceLabel?: string;
    projectName?: string;
    isStale?: boolean;
    waitingKind?: 'breakpoint' | 'task';
}
export declare function createMockRun(overrides?: CreateMockRunOptions): Run;
export interface CreateMockTaskDetailOptions extends CreateMockTaskEffectOptions {
    input?: Record<string, unknown>;
    result?: Record<string, unknown>;
    stdout?: string;
    stderr?: string;
    taskDef?: Record<string, unknown>;
    breakpoint?: BreakpointPayload;
}
export declare function createMockTaskDetail(overrides?: CreateMockTaskDetailOptions): TaskDetail;
export interface CreateMockProjectSummaryOptions {
    projectName?: string;
    totalRuns?: number;
    activeRuns?: number;
    completedRuns?: number;
    failedRuns?: number;
    staleRuns?: number;
    totalTasks?: number;
    completedTasksAggregate?: number;
    latestUpdate?: string;
}
export declare function createMockProjectSummary(overrides?: CreateMockProjectSummaryOptions): ProjectSummary;
export interface CreateMockRunDigestOptions {
    runId?: string;
    latestSeq?: number;
    status?: RunStatus;
    taskCount?: number;
    completedTasks?: number;
    updatedAt?: string;
    pendingBreakpoints?: number;
    breakpointQuestion?: string;
    sourceLabel?: string;
    projectName?: string;
    isStale?: boolean;
    waitingKind?: 'breakpoint' | 'task';
}
export declare function createMockRunDigest(overrides?: CreateMockRunDigestOptions): RunDigest;
