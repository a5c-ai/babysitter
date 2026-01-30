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
  ProcessLogger,
  TaskBuildContext,
  TaskDef,
  TaskInvokeOptions,
} from "../types";
import { emitRuntimeMetric } from "../instrumentation";
import { createTaskBuildContext } from "../../tasks/context";
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

  const stepId = options.context.replayCursor.nextStepId();
  const invocation = hashInvocationKey({
    processId: options.context.processId,
    stepId,
    taskId: task.id,
  });

  const existing = options.context.effectIndex.getByInvocation(invocation.key);
  if (existing) {
    return handleExistingInvocation(existing, options);
  }

  return requestNewEffect(stepId, invocation.key, invocation.digest, options);
}

async function handleExistingInvocation<TArgs, TResult>(
  record: EffectRecord,
  options: TaskIntrinsicInvokeOptions<TArgs, TResult>
): Promise<TResult> {
  if (record.status === "requested") {
    const taskDef = await ensureTaskDefinition(options.context.runDir, record);
    throw new EffectPendingError(buildEffectAction(record, taskDef));
  }

  if (record.status === "resolved_error") {
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
    options.context.effectIndex.applyEvent(syntheticEvent);
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
  return path.isAbsolute(ref) ? ref : path.join(runDir, ref);
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
