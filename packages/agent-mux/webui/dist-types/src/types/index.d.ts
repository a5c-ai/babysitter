export * from "./breakpoint";
export type RunStatus = "pending" | "waiting" | "completed" | "failed";
export type TaskKind = "node" | "agent" | "skill" | "breakpoint" | "shell" | "sleep";
export type TaskStatus = "requested" | "resolved" | "error";
export type EventType = "RUN_CREATED" | "EFFECT_REQUESTED" | "EFFECT_RESOLVED" | "RUN_COMPLETED" | "RUN_FAILED";
export interface JournalEvent {
    seq: number;
    id: string;
    ts: string;
    type: EventType;
    payload: Record<string, unknown>;
}
export interface RunCreatedPayload {
    runId: string;
    processId: string;
    processRevision?: string;
    entrypoint?: {
        importPath: string;
        exportName: string;
    };
    inputsRef?: string;
}
export interface EffectRequestedPayload {
    effectId: string;
    invocationKey: string;
    stepId: string;
    taskId: string;
    kind: TaskKind;
    label: string;
    taskDefRef?: string;
    inputsRef?: string;
}
export interface EffectResolvedPayload {
    effectId: string;
    status: "ok" | "error";
    resultRef?: string;
    stdoutRef?: string;
    stderrRef?: string;
    startedAt?: string;
    finishedAt?: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}
export interface TaskEffect {
    effectId: string;
    kind: TaskKind;
    title: string;
    label: string;
    status: TaskStatus;
    invocationKey: string;
    stepId: string;
    taskId: string;
    requestedAt: string;
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
export interface TaskDetail extends TaskEffect {
    input?: Record<string, unknown>;
    result?: Record<string, unknown>;
    stdout?: string;
    stderr?: string;
    taskDef?: Record<string, unknown>;
    breakpoint?: import("./breakpoint").BreakpointPayload;
}
export interface Run {
    runId: string;
    processId: string;
    status: RunStatus;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    sessionId?: string;
    tasks: TaskEffect[];
    events: JournalEvent[];
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    duration?: number;
    failedStep?: string;
    failureError?: string;
    failureMessage?: string;
    breakpointQuestion?: string;
    sourceLabel?: string;
    projectName?: string;
    isStale?: boolean;
    waitingKind?: 'breakpoint' | 'task';
}
export interface RunDigest {
    runId: string;
    latestSeq: number;
    status: RunStatus;
    taskCount: number;
    completedTasks: number;
    updatedAt: string;
    pendingBreakpoints?: number;
    breakpointQuestion?: string;
    breakpointEffectId?: string;
    sourceLabel?: string;
    projectName?: string;
    isStale?: boolean;
    waitingKind?: 'breakpoint' | 'task';
}
export interface ProjectGroup {
    projectName: string;
    runs: Run[];
    totalRuns: number;
    activeRuns: number;
    completedRuns: number;
    failedRuns: number;
    latestUpdate: string;
}
export interface BreakpointRunInfo {
    runId: string;
    effectId: string;
    projectName: string;
    processId: string;
    breakpointQuestion: string;
}
export interface ProjectSummary {
    projectName: string;
    totalRuns: number;
    activeRuns: number;
    completedRuns: number;
    failedRuns: number;
    staleRuns: number;
    totalTasks: number;
    completedTasksAggregate: number;
    latestUpdate: string;
    pendingBreakpoints: number;
    breakpointRuns: BreakpointRunInfo[];
}
export interface SessionInfo {
    sessionId: string;
    active: boolean;
    startedAt?: string;
    runId?: string;
    iteration?: number;
}
export interface DigestResponse {
    runs: RunDigest[];
}
export interface RunsResponse {
    runs: Run[];
}
export interface RunDetailResponse {
    run: Run;
}
export interface EventsResponse {
    events: JournalEvent[];
    total: number;
}
export interface TaskDetailResponse {
    task: TaskDetail;
}
