import type { JsonRecord, RunMetadata } from "../storage/types";
import type { DefinedTask, TaskDef, TaskInvokeOptions } from "../tasks/types";
import type { StateCacheJournalHead } from "./replay/stateCache";

export type { DefinedTask, TaskBuildContext, TaskDef, TaskInvokeOptions } from "../tasks/types";
export type { StateCacheJournalHead } from "./replay/stateCache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProcessLogger = (...args: any[]) => void;

export type BreakpointStrategy = 'single' | 'first-response-wins' | 'collect-all' | 'quorum';

export interface BreakpointRoutingOptions {
  expert?: string | string[];
  tags?: string[];
  strategy?: BreakpointStrategy;
}

export interface BreakpointResult {
  approved: boolean;
  response?: string;
  feedback?: string;
  option?: string;
  respondedBy?: string;
  allResponses?: Array<{ expert: string; approved: boolean; response?: string }>;
  [key: string]: unknown;
}

export type EffectStatus = "requested" | "resolved_ok" | "resolved_error";

export interface SerializedEffectError {
  name?: string;
  message?: string;
  stack?: string;
  data?: unknown;
}

export interface EffectRecord {
  effectId: string;
  invocationKey: string;
  invocationHash?: string;
  stepId: string;
  taskId: string;
  status: EffectStatus;
  kind?: string;
  label?: string;
  labels?: string[];
  taskDefRef?: string;
  inputsRef?: string;
  resultRef?: string;
  error?: SerializedEffectError;
  stdoutRef?: string;
  stderrRef?: string;
  requestedAt?: string;
  resolvedAt?: string;
}

export interface EffectSchedulerHints {
  pendingCount?: number;
  parallelGroupId?: string;
  sleepUntilEpochMs?: number;
}

export interface EffectAction {
  effectId: string;
  invocationKey: string;
  kind: string;
  label?: string;
  labels?: string[];
  taskDef: TaskDef;
  taskId?: string;
  stepId?: string;
  taskDefRef?: string;
  inputsRef?: string;
  requestedAt?: string;
  schedulerHints?: EffectSchedulerHints;
}

/**
 * Forward-fix strike-budget configuration. Codifies the "two strikes, switch to
 * instrumentation" rule: when the same `bugClass` reaches `perBugClass`
 * consecutive failed forward-fix attempts, the next iteration auto-pivots to
 * instrumentation (in non-interactive mode) or surfaces a pivot breakpoint
 * (in interactive mode).
 */
export interface ForwardFixStrikeBudget {
  /**
   * Number of consecutive failed forward-fix attempts allowed for a single
   * `bugClass` before pivot. Default 2.
   */
  perBugClass: number;
  /**
   * Optional named phase the orchestrator should jump to once the budget is
   * exhausted. The runtime emits this in the `strike-budget-exhausted`
   * PROCESS_LOG event; downstream harnesses use it to render the pivot.
   * Default "instrumentation".
   */
  pivotPhase?: string;
  /**
   * Optional instrumentation-task template id (e.g. `verbose-logs.preview`)
   * the harness should auto-dispatch on pivot in non-interactive mode.
   */
  instrumentationTemplate?: string;
}

/**
 * Internal: per-run counter of failed forward-fix attempts per `bugClass`.
 * Rebuilt deterministically from the journal on every replay-engine init.
 */
export interface StrikeTracker {
  readonly budget: ForwardFixStrikeBudget;
  /** Current strike counts keyed by bugClass. */
  readonly counts: Record<string, number>;
  /** Increment the count for a bugClass and return the new value. */
  recordFailure(bugClass: string): number;
  /** Reset the count for a bugClass (call on a successful resolution). */
  reset(bugClass: string): void;
  /** Returns true when the bugClass has reached or exceeded the budget. */
  isExhausted(bugClass: string): boolean;
  /** Returns the current strike count for a bugClass. */
  get(bugClass: string): number;
}

export interface CreateRunOptions {
  runsDir: string;
  runId?: string;
  harness?: string;
  process: {
    processId: string;
    importPath: string;
    exportName?: string;
  };
  request?: string;
  prompt?: string;
  inputs?: unknown;
  processRevision?: string;
  layoutVersion?: string;
  metadata?: JsonRecord;
  lockOwner?: string;
  logger?: ProcessLogger;
  /**
   * Optional forward-fix strike-budget config. When provided, the runtime
   * tracks per-`bugClass` failed forward-fix attempts and auto-pivots to
   * instrumentation when the budget is exhausted.
   */
  forwardFixStrikeBudget?: ForwardFixStrikeBudget;
}

export interface CreateRunResult {
  runId: string;
  runDir: string;
  metadata: RunMetadata;
}

export interface ParallelHelpers {
  all<T>(thunks: Array<() => T | Promise<T>>): Promise<T[]>;
  map<TItem, TOut>(items: TItem[], fn: (item: TItem) => TOut | Promise<TOut>): Promise<TOut[]>;
}

export interface ProcessContext {
  now(): Date;
  task<TArgs, TResult>(
    task: DefinedTask<TArgs, TResult>,
    args: TArgs,
    options?: TaskInvokeOptions
  ): Promise<TResult>;
  breakpoint<T = unknown>(payload: T, options?: { label?: string } & BreakpointRoutingOptions): Promise<BreakpointResult>;
  sleepUntil(target: string | number, options?: { label?: string }): Promise<void>;
  orchestratorTask<TArgs = unknown, TResult = unknown>(
    payload: TArgs,
    options?: { label?: string }
  ): Promise<TResult>;
  hook(
    hookType: string,
    payload: Record<string, unknown>,
    options?: { label?: string; timeout?: number; throwOnFailure?: boolean }
  ): Promise<import("../hooks/types").HookResult>;
  parallel: ParallelHelpers;
  log?: ProcessLogger;
}

export interface OrchestrateOptions {
  runDir: string;
  process?: {
    importPath: string;
    exportName?: string;
  };
  inputs?: unknown;
  now?: Date | (() => Date);
  context?: Record<string, unknown>;
  logger?: ProcessLogger;
}

export interface IterationMetadata {
  stateVersion?: number;
  stateRebuilt?: boolean;
  stateRebuildReason?: string | null;
  pendingEffectsByKind?: Record<string, number>;
  journalHead?: StateCacheJournalHead | null;
}

export type IterationResult =
  | { status: "completed"; output: unknown; metadata?: IterationMetadata }
  | { status: "waiting"; nextActions: EffectAction[]; metadata?: IterationMetadata }
  | { status: "failed"; error: unknown; metadata?: IterationMetadata };

export interface CommitEffectResultOptions {
  runDir: string;
  effectId: string;
  invocationKey?: string;
  logger?: ProcessLogger;
  result: {
    status: "ok" | "error";
    value?: unknown;
    error?: unknown;
    stdout?: string;
    stderr?: string;
    stdoutRef?: string;
    stderrRef?: string;
    startedAt?: string;
    finishedAt?: string;
    metadata?: JsonRecord;
  };
}

export interface CommitEffectResultArtifacts {
  resultRef: string;
  stdoutRef?: string;
  stderrRef?: string;
  startedAt?: string;
  finishedAt?: string;
}
