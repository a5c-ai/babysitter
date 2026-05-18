import type { JsonRecord, RunMetadata } from "../storage/types";
import type { DefinedTask, TaskDef, TaskInvokeOptions } from "../tasks/types";
import type { StateCacheJournalHead } from "./replay/stateCache";
import type { RuntimeGovernanceConfig } from "./policy";

export type { DefinedTask, TaskBuildContext, TaskDef, TaskInvokeOptions } from "../tasks/types";
export type { StateCacheJournalHead } from "./replay/stateCache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProcessLogger = (...args: any[]) => void;

export type BreakpointStrategy = 'single' | 'first-response-wins' | 'collect-all' | 'quorum';

export interface BreakpointRoutingOptions {
  expert?: string | string[];
  tags?: string[];
  strategy?: BreakpointStrategy;
  /** Canonical breakpoint identity for cross-run/cross-process matching. Dotted namespace, kebab-case. */
  breakpointId?: string;
  /** Auto-approve after N consecutive approvals (-1 = disabled, default). */
  autoApproveAfterN?: number;
  /** Whether to present "Always Approve" option to the user (default true). */
  presentAlwaysApprove?: boolean;
}

// AutoApprovalResult is defined in breakpoints/types.ts and re-exported from breakpoints/index.ts

export interface BreakpointResult {
  approved: boolean;
  response?: string;
  feedback?: string;
  option?: string;
  respondedBy?: string;
  allResponses?: Array<{ expert: string; approved: boolean; response?: string }>;
  [key: string]: unknown;
}

export type EffectStatus = "requested" | "resolved_ok" | "resolved_error" | "cancelled";

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
  // Progress tracking (GAP-SUBOBS-002)
  progressPercent?: number;
  progressLabel?: string;
  currentStep?: string;
  progressEta?: string;
  // Background effect tracking (GAP-PAR-002)
  background?: boolean;
  dispatchedAt?: string;
  lastPolledAt?: string;
  // Cost tracking (GAP-SUBOBS-003)
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  costUsd?: number;
  costModel?: string;
}

export interface EffectSchedulerHints {
  pendingCount?: number;
  parallelGroupId?: string;
  sleepUntilEpochMs?: number;
  maxConcurrency?: number;
  executionStrategy?: 'sequential' | 'concurrent' | 'adaptive';
  background?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
  effectGroupId?: string;
  groupRole?: 'coordinator' | 'worker';
  preferredHarness?: string;
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

export interface CreateRunOptions {
  runsDir?: string;
  runId?: string;
  harness?: string;
  /** Process to execute. Optional — bare runs track session state without a process. */
  process?: {
    processId: string;
    importPath: string;
    exportName?: string;
  };
  request?: string;
  prompt?: string;
  inputs?: unknown;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  processRevision?: string;
  layoutVersion?: string;
  metadata?: JsonRecord;
  nested?: {
    parentRunId: string;
    parentEffectId?: string;
    parentInvocationKey?: string;
    sessionId?: string;
    shareSession?: boolean;
    skipRunStartHook?: boolean;
  };
  lockOwner?: string;
  logger?: ProcessLogger;
  governance?: RuntimeGovernanceConfig;
}

export interface CreateRunResult {
  runId: string;
  runDir: string;
  metadata: RunMetadata;
}

export interface SubprocessInvocation {
  processPath: string;
  exportName?: string;
  processId?: string;
  prompt?: string;
  inputs?: unknown;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  harness?: string;
  model?: string;
  maxIterations?: number;
  shareSession?: boolean;
  metadata?: JsonRecord;
}

export interface SubprocessResult {
  runId: string;
  runDir: string;
  output: unknown;
}

export interface ParallelHelpers {
  all<T>(thunks: Array<() => T | Promise<T>>): Promise<T[]>;
  map<TItem, TOut>(items: TItem[], fn: (item: TItem) => TOut | Promise<TOut>): Promise<TOut[]>;
}

export interface ProcessContext {
  /** ULID of the current run — same as the run directory name. */
  runId: string;
  /** Absolute path to the run directory (e.g. `.a5c/runs/<runId>`). */
  runDir: string;
  /**
   * Absolute path to the per-run artifacts directory (`<runDir>/artifacts`),
   * created on first context construction. Processes can write reports,
   * logs, and other generated files here without computing the path
   * themselves.
   */
  artifactsDir: string;
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
  subprocess(
    invocation: SubprocessInvocation,
    options?: TaskInvokeOptions,
  ): Promise<SubprocessResult>;
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
  /** Internal-only gate for subprocess effects resolved by babysitter-agent. */
  subprocessSupport?: "disabled" | "babysitter-agent";
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
  | { status: "failed"; error: unknown; metadata?: IterationMetadata }
  | { status: "process-error"; error: unknown; metadata?: IterationMetadata };

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
