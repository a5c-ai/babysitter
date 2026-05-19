import crypto from "crypto";
import { appendEvent } from "../../storage/journal";
import { readTaskDefinition } from "../../storage/tasks";
import type { JournalEvent } from "../../storage/types";
import { nextUlid } from "../../storage/ulids";
import {
  EffectPendingError,
  EffectRequestedError,
  InvalidTaskDefinitionError,
  InvocationCollisionError,
  RunFailedError,
} from "../exceptions";
import { hashInvocationKey } from "../invocation";
import type { EffectIndex } from "../replay/effectIndex";
import type { ReplayCursor } from "../replay/replayCursor";
import type {
  DefinedTask,
  EffectRecord,
  ProcessLogger,
  TaskDef,
  TaskInvokeOptions,
} from "../types";
import { emitRuntimeMetric } from "../instrumentation";
import { createTaskBuildContext } from "../../tasks/context";
import { globalTaskRegistry } from "../../tasks/registry";
import { serializeAndWriteTaskDefinition } from "../../tasks/serializer";
import { readRules } from "../../breakpoints/rules";
import { evaluateAutoApproval } from "../../breakpoints/evaluator";
import type {
  PolicyDecisionReporter,
  PolicyEngine,
  PolicyEvaluationContext,
} from "../policy/types";
import {
  buildEffectAction,
  handleResolvedRecord,
  collectInvocationLabels,
  deriveEffectLabel,
} from "./taskHelpers";

let _newEffectRequestCount = 0;
export function getNewEffectRequestCount(): number { return _newEffectRequestCount; }
export function resetNewEffectRequestCount(): void { _newEffectRequestCount = 0; }

export interface TaskIntrinsicContext {
  runId: string;
  runDir: string;
  processId: string;
  effectIndex: EffectIndex;
  replayCursor: ReplayCursor;
  now: () => Date;
  logger?: ProcessLogger;
  subprocessSupport?: "disabled" | "babysitter-agent";
  policyEngine?: PolicyEngine;
  reportPolicyDecision?: PolicyDecisionReporter;
  invocationKeyCounts?: Map<string, number>;
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

  const explicitKey = options.invokeOptions?.key ?? options.invokeOptions?.stableKey;
  const legacyStepId = explicitKey === undefined ? options.context.replayCursor.nextStepId() : undefined;
  const stepId = explicitKey ?? deriveStableTaskKey(options);
  const invocation = hashInvocationKey({
    processId: options.context.processId,
    key: stepId,
    taskId: task.id,
  });

  const legacyInvocation = legacyStepId
    ? hashInvocationKey({ processId: options.context.processId, stepId: legacyStepId, taskId: task.id })
    : undefined;
  const existing = options.context.effectIndex.getByInvocation(invocation.key)
    ?? (legacyInvocation ? options.context.effectIndex.getByInvocation(legacyInvocation.key) : undefined);
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
  return await handleResolvedRecord(options.context.runDir, record) as TResult;
}

async function requestNewEffect<TArgs, TResult>(
  stepId: string,
  invocationKey: string,
  invocationHash: string,
  options: TaskIntrinsicInvokeOptions<TArgs, TResult>
): Promise<TResult> {
  _newEffectRequestCount++;
  const effectId = nextUlid();
  const buildCtx = createTaskBuildContext({
    effectId, runId: options.context.runId, runDir: options.context.runDir,
    invocationKey, taskId: options.task.id, label: options.invokeOptions?.label,
  });
  const taskDef = await Promise.resolve(options.task.build(options.args, buildCtx));
  if (!taskDef || typeof taskDef.kind !== "string") {
    throw new InvalidTaskDefinitionError(`Task ${options.task.id} did not provide a kind`);
  }

  // Policy evaluation
  if (options.context.policyEngine) {
    const policyCtx: PolicyEvaluationContext = {
      effectKind: taskDef.kind, taskId: options.task.id, processId: options.context.processId,
      runId: options.context.runId, labels: taskDef.labels,
      metadata: taskDef.metadata as Record<string, string> | undefined,
    };
    const decision = options.context.policyEngine.evaluate(policyCtx);
    if (options.context.reportPolicyDecision) {
      try { await options.context.reportPolicyDecision({ timestamp: new Date().toISOString(), context: policyCtx, decision, ruleId: decision.rule?.id }); }
      catch { /* Best-effort */ }
    }
    if (!decision.allowed) {
      throw new RunFailedError(`Policy denied effect dispatch: ${decision.reason} [rule: ${decision.rule?.id ?? "unknown"}]`, { details: { ruleId: decision.rule?.id, decision } });
    }
  }

  // Pre-compute autoApproval for breakpoint effects
  if (taskDef.kind === "breakpoint") {
    try {
      const meta = taskDef.metadata as Record<string, unknown> | undefined;
      const breakpointId = meta?.breakpointId as string | undefined;
      if (breakpointId) {
        const rules = await readRules();
        const autoApproval = evaluateAutoApproval({
          breakpointId, tags: meta?.tags as string[] | undefined,
          expert: meta?.expert as string | undefined, rules,
          autoApproveAfterN: meta?.autoApproveAfterN as number | undefined,
        });
        (taskDef as Record<string, unknown>).autoApproval = autoApproval;
      }
    } catch { /* Non-critical */ }
  }

  const { taskRef: taskDefRef, inputsRef } = await serializeAndWriteTaskDefinition({
    runDir: options.context.runDir, effectId, taskId: options.task.id,
    invocationKey, stepId, task: taskDef, inputs: options.args,
  });
  const kind = taskDef.kind;
  const normalizedLabels = collectInvocationLabels(buildCtx, taskDef);
  const label = deriveEffectLabel(buildCtx, taskDef, normalizedLabels, options.task.id);
  const labelMetadata = normalizedLabels.length ? normalizedLabels : undefined;
  const eventPayload = {
    effectId, invocationKey, invocationHash, stepId, taskId: options.task.id,
    kind, label, taskDefRef, inputsRef, labels: labelMetadata,
  };
  const appendResult = await appendEvent({ runDir: options.context.runDir, eventType: "EFFECT_REQUESTED", event: eventPayload });
  const syntheticEvent: JournalEvent = {
    seq: appendResult.seq, ulid: appendResult.ulid, filename: appendResult.filename,
    path: appendResult.path, type: "EFFECT_REQUESTED", recordedAt: appendResult.recordedAt,
    data: eventPayload, checksum: appendResult.checksum,
  };
  try {
    options.context.effectIndex.applyEvent(syntheticEvent, undefined, { skipSequenceValidation: true });
  } catch (error) {
    emitRuntimeMetric(options.context.logger, "invocation.collision", { invocationKey, effectId });
    throw new InvocationCollisionError(invocationKey);
  }
  globalTaskRegistry.recordEffect({
    effectId, invocationKey, taskId: options.task.id, kind, label, labels: normalizedLabels,
    status: "pending", taskDefRef, inputsRef, metadata: taskDef.metadata, stepId, requestedAt: appendResult.recordedAt,
  });
  const actionRecord: EffectRecord = {
    effectId, invocationKey, invocationHash, stepId, taskId: options.task.id,
    status: "requested", kind, label, labels: labelMetadata, taskDefRef, inputsRef, requestedAt: appendResult.recordedAt,
  };
  const action = buildEffectAction(actionRecord, taskDef);
  throw new EffectRequestedError(action);
}

async function ensureTaskDefinition(runDir: string, record: EffectRecord): Promise<TaskDef> {
  const stored = await readTaskDefinition(runDir, record.effectId);
  if (!stored) throw new RunFailedError(`Task definition missing for effect ${record.effectId}`, { effectId: record.effectId });
  return stored as TaskDef;
}

function deriveStableTaskKey<TArgs, TResult>(options: TaskIntrinsicInvokeOptions<TArgs, TResult>): string {
  const label = normalizeKeyPart(options.invokeOptions?.label ?? "default");
  const shapeHash = hashArgsShape(options.args);
  const baseKey = `${normalizeKeyPart(options.task.id)}.${label}.${shapeHash}`;
  const counts = options.context.invocationKeyCounts ??= new Map<string, number>();
  const idx = counts.get(baseKey) ?? 0;
  counts.set(baseKey, idx + 1);
  return `${baseKey}.${idx}`;
}

function hashArgsShape(value: unknown): string {
  const shape = stableNormalizeShape(value);
  return crypto.createHash("sha256").update(JSON.stringify(shape)).digest("hex").slice(0, 12);
}

function normalizeKeyPart(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9_-]+/g, "-") || "default";
}

function stableNormalizeShape(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableNormalizeShape(entry));
  }
  if (value && typeof value === "object") {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort((a, b) => a.localeCompare(b))) {
      normalized[key] = stableNormalizeShape((value as Record<string, unknown>)[key]);
    }
    return normalized;
  }
  return value === null ? "null" : typeof value;
}
