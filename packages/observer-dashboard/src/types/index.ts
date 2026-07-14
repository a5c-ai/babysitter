// Re-export breakpoint types
export * from "./breakpoint";

// Run status
export type RunStatus = "pending" | "waiting" | "completed" | "failed";

// Task/effect kind
export type TaskKind = "node" | "agent" | "skill" | "breakpoint" | "shell" | "sleep";

// Task status
export type TaskStatus = "requested" | "resolved" | "error";

// Journal event types
export type EventType =
  | "RUN_CREATED"
  | "EFFECT_REQUESTED"
  | "EFFECT_RESOLVED"
  | "RUN_COMPLETED"
  | "RUN_FAILED";

// Journal event
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

// Parsed task/effect
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
  duration?: number; // ms
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

// Full task detail (on-demand)
export interface TaskDetail extends TaskEffect {
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stdout?: string;
  stderr?: string;
  taskDef?: Record<string, unknown>;
  breakpoint?: import("./breakpoint").BreakpointPayload;
}

// Run summary
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
  duration?: number; // ms
  failedStep?: string;
  failureError?: string;
  failureMessage?: string;
  breakpointQuestion?: string;
  /** Number of requested-but-unresolved breakpoints (answerable "needs you"). */
  pendingBreakpoints?: number;
  sourceLabel?: string;
  projectName?: string;
  isStale?: boolean;
  waitingKind?: 'breakpoint' | 'task';
  /** Orchestrator attachment (read from run.lock + pid liveness).
   *  §15.1: "scheduled" = a sleeping forever-run between ticks (newest journal
   *  event is an unresolved `sleep` effect) — idle-healthy, not orphaned. */
  driver?: 'live' | 'orphaned' | 'none' | 'scheduled';
  /**
   * §15.1 (AC-84/85): when `driver === "scheduled"`, the parsed wake time
   * (`sleep:<ISO>`) from the sleep effect. Future → calm "next run <rel>";
   * past → amber "wake overdue <rel> — resume". Absent otherwise.
   */
  sleepWakeAt?: string;
  /**
   * UX-R3 §14.5 (AC-59): the observer recorded an answer for a breakpoint
   * (result.json written by "observer-dashboard") but the run has NOT been
   * resumed/advanced yet — non-terminal, no live driver. Keeps the card in
   * Needs-you in the amber-gray "answer recorded — awaiting resume" state
   * instead of silently sliding to Stalled, derived from disk (survives a page
   * refresh) until a resume actually consumes it.
   */
  recordedAwaitingResume?: boolean;
  /** The effectId of the observer-recorded breakpoint awaiting resume (AC-59):
   *  lets the Needs-you card fetch the recorded answer + render the copyable
   *  resume command / overwrite control. */
  recordedBreakpointEffectId?: string;
}

// Lightweight digest for polling
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
  /** Orchestrator attachment (read from run.lock + pid liveness).
   *  §15.1: "scheduled" = sleeping forever-run between ticks (idle-healthy). */
  driver?: 'live' | 'orphaned' | 'none' | 'scheduled';
  // ---------------------------------------------------------------------------
  // Card-parity fields (perf slimming): the default /api/runs list is served
  // from digests, so getRunDigest computes these cheaply (same journal scan +
  // breakpoint result.json reads it already performs) to mirror parseRunDir.
  // ---------------------------------------------------------------------------
  /** Failed-column "Failed at:" text — the first errored effect's step. */
  failedStep?: string;
  /** Failure detail from RUN_FAILED or the last errored EFFECT_RESOLVED. */
  failureMessage?: string;
  /** §15.1: parsed wake time (`sleep:<ISO>`) when driver === "scheduled". */
  sleepWakeAt?: string;
  /** UX-R3 §14.5 (AC-59): observer-recorded breakpoint answer awaiting resume. */
  recordedAwaitingResume?: boolean;
  /** The effectId of the observer-recorded breakpoint awaiting resume. */
  recordedBreakpointEffectId?: string;
}

// Project grouping for dashboard
export interface ProjectGroup {
  projectName: string;
  runs: Run[];
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  failedRuns: number;
  latestUpdate: string;
}

// Breakpoint info for a single waiting run
export interface BreakpointRunInfo {
  runId: string;
  effectId: string;
  projectName: string;
  processId: string;
  /**
   * The REAL on-disk question, when one exists (UX-R2 §13.1). Left unset for
   * genuinely question-less breakpoints — the data layer never pre-fills the
   * honest fallback copy (a truthy pre-fill would mask downstream task-level
   * fallbacks); display surfaces apply it at render time (AC-32).
   */
  breakpointQuestion?: string;
  /** Orchestrator attachment — whether an answer can actually be applied now. */
  driver?: 'live' | 'orphaned' | 'none' | 'scheduled';
}

// Project summary (lightweight, no run payloads)
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
  /** Non-terminal runs (waiting/pending) whose orchestrator is not attached. */
  orphanedRuns: number;
  breakpointRuns: BreakpointRunInfo[];
  /**
   * True when the project is in the registry's hiddenProjects list. Hiding
   * only removes the project from the GRID — alarm surfaces (needs-you
   * banner/counts) and search still include it (QA F4).
   */
  hidden?: boolean;
}

// Session info
export interface SessionInfo {
  sessionId: string;
  active: boolean;
  startedAt?: string;
  runId?: string;
  iteration?: number;
}

// API response types
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
