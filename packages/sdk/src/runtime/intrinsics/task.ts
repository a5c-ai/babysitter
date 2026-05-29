import { promises as fs } from "fs";
import path from "path";
import { appendEvent } from "../../storage/journal";
import { readTaskDefinition, readTaskResult } from "../../storage/tasks";
import { JournalEvent, StoredTaskResult } from "../../storage/types";
import { nextUlid } from "../../storage/ulids";
import {
  EffectPendingError,
  EffectRequestedError,
  InvalidTaskDefinitionError,
  InvocationCollisionError,
  RunFailedError,
  StrikeBudgetExhaustedError,
  rehydrateSerializedError,
} from "../exceptions";
import { hashInvocationKey } from "../invocation";
import { EffectIndex } from "../replay/effectIndex";
import { ReplayCursor } from "../replay/replayCursor";
import {
  DefinedTask,
  EffectAction,
  EffectRecord,
  EffectSchedulerHints,
  ForwardFixStrikeBudget,
  ProcessLogger,
  StrikeTracker,
  TaskBuildContext,
  TaskDef,
  TaskInvokeOptions,
} from "../types";
import { emitRuntimeMetric } from "../instrumentation";
import { createTaskBuildContext } from "../../tasks/context";
import { collapseDoubledA5cRuns } from "../../cli/resolveInputPath";
import { globalTaskRegistry } from "../../tasks/registry";
import { serializeAndWriteTaskDefinition } from "../../tasks/serializer";

export interface TaskIntrinsicContext {
  runId: string;
  runDir: string;
  processId: string;
  effectIndex: EffectIndex;
  replayCursor: ReplayCursor;
  now: () => Date;
  logger?: ProcessLogger;
  /** When true, strike-budget exhaustion auto-pivots instead of requesting a breakpoint. */
  nonInteractive?: boolean;
  /** Configured forward-fix strike budget, if any. */
  forwardFixStrikeBudget?: ForwardFixStrikeBudget;
  /** Per-run failed-fix tracker. */
  strikeTracker?: StrikeTracker;
}

/**
 * Derives the bugClass for a task invocation. Priority:
 *   1. Explicit `invokeOptions.metadata.bugClass` (deterministic).
 *   2. Heuristic from `invokeOptions.label` (e.g. "fix:ios-cloud-stt-wedge" → "ios-cloud-stt-wedge").
 *   3. `undefined` — task is not tracked.
 */
export function deriveBugClass(
  invokeOptions?: TaskInvokeOptions,
  taskId?: string
): string | undefined {
  const explicit = invokeOptions?.metadata?.bugClass;
  if (typeof explicit === "string" && explicit.length > 0) {
    return explicit;
  }
  const label = invokeOptions?.label;
  if (typeof label === "string" && label.length > 0) {
    const match = label.match(/^(?:fix|forward-fix|forwardfix)[:/-]\s*(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  // Fallback: don't auto-derive from arbitrary taskId — too noisy.
  void taskId;
  return undefined;
}

export interface TaskIntrinsicInvokeOptions<TArgs, TResult> {
  task: DefinedTask<TArgs, TResult>;
  args: TArgs;
  invokeOptions?: TaskInvokeOptions;
  context: TaskIntrinsicContext;
}

export async function runTaskIntrinsic<TArgs, TResult>(
  options: TaskIntrinsicInvokeOptions<TArgs, TResult>
): Promise<TResult> {
  const { task } = options;
  if (!task || typeof task.build !== "function" || typeof task.id !== "string" || !task.id) {
    throw new InvalidTaskDefinitionError("ctx.task requires a DefinedTask created via defineTask()");
  }

  const bugClass = deriveBugClass(options.invokeOptions, task.id);

  const stepId = options.context.replayCursor.nextStepId();
  const invocation = hashInvocationKey({
    processId: options.context.processId,
    stepId,
    taskId: task.id,
  });

  const existing = options.context.effectIndex.getByInvocation(invocation.key);
  if (existing) {
    // Replay path: re-emit the prior outcome. handleExistingInvocation
    // records (dedup'd) strikes for resolved_error effects.
    return handleExistingInvocation(existing, options, bugClass);
  }

  // Fresh-dispatch path: this is the place to enforce the strike budget.
  // If the bugClass has already exhausted its budget from prior failed-fix
  // attempts in this run, short-circuit BEFORE creating a new effect.
  await maybeEnforceStrikeBudget(bugClass, options.context);

  return requestNewEffect(stepId, invocation.key, invocation.digest, options);
}

/**
 * Enforces the strike budget for a `bugClass`. When the tracker reports the
 * budget is exhausted:
 *   - In non-interactive mode, writes PROCESS_LOG + process artifact and
 *     throws StrikeBudgetExhaustedError so the orchestrator can pivot.
 *   - In interactive mode, throws StrikeBudgetExhaustedError immediately;
 *     callers surface this as a pivot breakpoint.
 */
async function maybeEnforceStrikeBudget(
  bugClass: string | undefined,
  context: TaskIntrinsicContext
): Promise<void> {
  if (!bugClass || !context.strikeTracker || !context.forwardFixStrikeBudget) {
    return;
  }
  if (!context.strikeTracker.isExhausted(bugClass)) {
    return;
  }
  const strikes = context.strikeTracker.get(bugClass);
  const budget = context.forwardFixStrikeBudget;

  // Emit PROCESS_LOG (reuses existing event type — no schema migration needed).
  try {
    await appendEvent({
      runDir: context.runDir,
      eventType: "PROCESS_LOG",
      event: {
        logSeq: -1,
        label: "strike-budget-exhausted",
        bugClass,
        strikes,
        budgetPerBugClass: budget.perBugClass,
        pivotPhase: budget.pivotPhase,
        instrumentationTemplate: budget.instrumentationTemplate,
        nonInteractive: Boolean(context.nonInteractive),
        message:
          `Forward-fix strike budget exhausted for bugClass "${bugClass}" ` +
          `(${strikes} strikes, budget ${budget.perBugClass}). ` +
          `${context.nonInteractive ? "Auto-pivoting" : "Requesting pivot breakpoint"} ` +
          `to ${budget.pivotPhase ?? "instrumentation"}.`,
      },
    });
  } catch {
    // Never let logging block orchestration.
  }

  // In non-interactive mode, ALSO write a small process artifact summarizing
  // the strike sequence so the orchestrator/operator can read it later.
  if (context.nonInteractive) {
    try {
      const artifactsDir = path.join(context.runDir, "artifacts");
      await fs.mkdir(artifactsDir, { recursive: true });
      const artifactPath = path.join(artifactsDir, `strike-budget-${bugClass}.json`);
      const payload = {
        bugClass,
        strikes,
        budgetPerBugClass: budget.perBugClass,
        pivotPhase: budget.pivotPhase ?? "instrumentation",
        instrumentationTemplate: budget.instrumentationTemplate,
        recordedAt: context.now().toISOString(),
        runId: context.runId,
      };
      await fs.writeFile(artifactPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    } catch {
      // Artifact emission is best-effort; never block on it.
    }
  }

  throw new StrikeBudgetExhaustedError(
    bugClass,
    strikes,
    budget.perBugClass,
    budget.pivotPhase,
    budget.instrumentationTemplate
  );
}

/**
 * Records a forward-fix strike for `bugClass` keyed by `effectId` and emits a
 * PROCESS_LOG event so the strike survives replay. Returns the new strike
 * count, or null when the strike was already recorded for this effectId
 * (deduplicates across replay iterations).
 */
async function recordStrike(
  bugClass: string,
  effectId: string,
  context: TaskIntrinsicContext
): Promise<number | null> {
  if (!context.strikeTracker || !context.forwardFixStrikeBudget) {
    return null;
  }
  // Cast: TaskIntrinsicContext exposes the public StrikeTracker; the runtime
  // builder hands us the InternalStrikeTracker which has effect-keyed APIs.
  const tracker = context.strikeTracker as StrikeTracker & {
    recordEffectFailure?: (bugClass: string, effectId: string) => boolean;
    hasRecordedEffect?: (effectId: string) => boolean;
  };
  if (tracker.hasRecordedEffect?.(effectId)) {
    return null;
  }
  const newlyRecorded = tracker.recordEffectFailure
    ? tracker.recordEffectFailure(bugClass, effectId)
    : Boolean(tracker.recordFailure(bugClass));
  if (!newlyRecorded) {
    return null;
  }
  const next = context.strikeTracker.get(bugClass);
  try {
    await appendEvent({
      runDir: context.runDir,
      eventType: "PROCESS_LOG",
      event: {
        logSeq: -1,
        label: "strike-budget:failure",
        bugClass,
        effectId,
        strikes: next,
        budgetPerBugClass: context.forwardFixStrikeBudget.perBugClass,
        message: `Forward-fix strike recorded for bugClass "${bugClass}" (now ${next}/${context.forwardFixStrikeBudget.perBugClass}).`,
      },
    });
  } catch {
    // Never let logging block orchestration.
  }
  return next;
}

async function handleExistingInvocation<TArgs, TResult>(
  record: EffectRecord,
  options: TaskIntrinsicInvokeOptions<TArgs, TResult>,
  bugClass?: string
): Promise<TResult> {
  if (record.status === "requested") {
    const taskDef = await ensureTaskDefinition(options.context.runDir, record);
    throw new EffectPendingError(buildEffectAction(record, taskDef));
  }

  if (record.status === "resolved_error") {
    // Record a strike, keyed by effectId for replay-safe dedupe. If the
    // journal already contains a `strike-budget:failure` event for this
    // effectId (seeded into the tracker during replay-engine init), this
    // is a no-op.
    if (bugClass) {
      await recordStrike(bugClass, record.effectId, options.context);
    }
    const error = record.error ? rehydrateSerializedError(record.error) : new Error("Task failed");
    throw error;
  }

  const stored: StoredTaskResult | undefined = await readTaskResult(
    options.context.runDir,
    record.effectId,
    record.resultRef ? normalizeRef(options.context.runDir, record.resultRef) : undefined
  );
  if (!stored) {
    throw new RunFailedError(`Result for effect ${record.effectId} is missing from disk`, {
      effectId: record.effectId,
    });
  }
  if (stored.status !== "ok") {
    const err = stored.error ? rehydrateSerializedError(stored.error) : new Error("Task reported failure");
    throw err;
  }
  const value = await resolveStoredResultValue(options.context.runDir, stored);
  return value as TResult;
}

async function requestNewEffect<TArgs, TResult>(
  stepId: string,
  invocationKey: string,
  invocationHash: string,
  options: TaskIntrinsicInvokeOptions<TArgs, TResult>
): Promise<TResult> {
  const effectId = nextUlid();
  const buildCtx = createTaskBuildContext({
    effectId,
    runId: options.context.runId,
    runDir: options.context.runDir,
    invocationKey,
    taskId: options.task.id,
    label: options.invokeOptions?.label,
  });
  const taskDef = await Promise.resolve(options.task.build(options.args, buildCtx));
  if (!taskDef || typeof taskDef.kind !== "string") {
    throw new InvalidTaskDefinitionError(`Task ${options.task.id} did not provide a kind`);
  }
  const { taskRef: taskDefRef, inputsRef } = await serializeAndWriteTaskDefinition({
    runDir: options.context.runDir,
    effectId,
    taskId: options.task.id,
    invocationKey,
    stepId,
    task: taskDef,
    inputs: options.args,
  });
  const kind = taskDef.kind;
  const normalizedLabels = collectInvocationLabels(buildCtx, taskDef);
  const label = deriveEffectLabel(buildCtx, taskDef, normalizedLabels, options.task.id);
  const labelMetadata = normalizedLabels.length ? normalizedLabels : undefined;
  const eventPayload = {
    effectId,
    invocationKey,
    invocationHash,
    stepId,
    taskId: options.task.id,
    kind,
    label,
    taskDefRef,
    inputsRef,
    labels: labelMetadata,
  };
  const appendResult = await appendEvent({
    runDir: options.context.runDir,
    eventType: "EFFECT_REQUESTED",
    event: eventPayload,
  });
  const syntheticEvent: JournalEvent = {
    seq: appendResult.seq,
    ulid: appendResult.ulid,
    filename: appendResult.filename,
    path: appendResult.path,
    type: "EFFECT_REQUESTED",
    recordedAt: appendResult.recordedAt,
    data: eventPayload,
    checksum: appendResult.checksum,
  };
  try {
    options.context.effectIndex.applyEvent(syntheticEvent, undefined, { skipSequenceValidation: true });
  } catch (error) {
    emitRuntimeMetric(options.context.logger, "invocation.collision", {
      invocationKey,
      effectId,
    });
    throw new InvocationCollisionError(invocationKey);
  }
  globalTaskRegistry.recordEffect({
    effectId,
    invocationKey,
    taskId: options.task.id,
    kind,
    label,
    labels: normalizedLabels,
    status: "pending",
    taskDefRef,
    inputsRef,
    metadata: taskDef.metadata,
    stepId,
    requestedAt: appendResult.recordedAt,
  });
  const actionRecord: EffectRecord = {
    effectId,
    invocationKey,
    invocationHash,
    stepId,
    taskId: options.task.id,
    status: "requested",
    kind,
    label,
    labels: labelMetadata,
    taskDefRef,
    inputsRef,
    requestedAt: appendResult.recordedAt,
  };
  const action = buildEffectAction(actionRecord, taskDef);
  throw new EffectRequestedError(action);
}

async function ensureTaskDefinition(runDir: string, record: EffectRecord): Promise<TaskDef> {
  const stored = await readTaskDefinition(runDir, record.effectId);
  if (!stored) {
    throw new RunFailedError(`Task definition missing for effect ${record.effectId}`, {
      effectId: record.effectId,
    });
  }
  return stored as TaskDef;
}

function buildEffectAction(record: EffectRecord, taskDef: TaskDef): EffectAction {
  const schedulerHints = deriveSchedulerHints(taskDef);
  return {
    effectId: record.effectId,
    invocationKey: record.invocationKey,
    kind: record.kind ?? taskDef.kind,
    label: record.label ?? record.labels?.[0] ?? taskDef.title,
    labels: record.labels ?? taskDef.labels,
    taskDef,
    taskId: record.taskId,
    stepId: record.stepId,
    taskDefRef: record.taskDefRef,
    inputsRef: record.inputsRef,
    requestedAt: record.requestedAt,
    schedulerHints,
  };
}

function deriveSchedulerHints(taskDef: TaskDef): EffectSchedulerHints | undefined {
  const hints: EffectSchedulerHints = {};
  const sleepHint = extractSleepTarget(taskDef);
  if (typeof sleepHint === "number" && Number.isFinite(sleepHint)) {
    hints.sleepUntilEpochMs = sleepHint;
  }
  return Object.keys(hints).length ? hints : undefined;
}

function extractSleepTarget(taskDef: TaskDef): number | undefined {
  if (typeof taskDef.sleep?.targetEpochMs === "number") {
    return taskDef.sleep.targetEpochMs;
  }
  const metadataTarget = (taskDef.metadata as { targetEpochMs?: number } | undefined)?.targetEpochMs;
  return typeof metadataTarget === "number" ? metadataTarget : undefined;
}

function normalizeRef(runDir: string, ref: string) {
  return path.isAbsolute(ref) ? ref : collapseDoubledA5cRuns(path.join(runDir, ref));
}

async function resolveStoredResultValue(runDir: string, stored: StoredTaskResult): Promise<unknown> {
  if (stored.result !== undefined) {
    return stored.result;
  }
  if (stored.value !== undefined) {
    return stored.value;
  }
  if (stored.resultRef) {
    const absolute = normalizeRef(runDir, stored.resultRef);
    const raw = await fs.readFile(absolute, "utf8");
    return JSON.parse(raw) as unknown;
  }
  throw new RunFailedError("Result payload missing data", { effectId: stored.effectId });
}

function collectInvocationLabels(ctx: TaskBuildContext, taskDef: TaskDef): string[] {
  const combined: string[] = [];
  const addLabels = (values?: string[]) => {
    if (!Array.isArray(values)) return;
    combined.push(...values);
  };
  addLabels(ctx.labels);
  addLabels(taskDef.labels);
  return dedupeLabels(combined);
}

function dedupeLabels(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

function deriveEffectLabel(
  ctx: TaskBuildContext,
  taskDef: TaskDef,
  labels: string[],
  fallbackTaskId: string
): string {
  return ctx.label ?? labels[0] ?? taskDef.title ?? fallbackTaskId;
}
