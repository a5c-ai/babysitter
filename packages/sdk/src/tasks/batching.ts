import { createHash } from "crypto";
import type { EffectAction, EffectSchedulerHints } from "../runtime/types";
import type { JsonRecord } from "../storage/types";

export interface BatchedEffectSummary {
  effectId: string;
  invocationKey: string;
  taskId?: string;
  stepId?: string;
  kind: string;
  label?: string;
  labels?: string[];
  taskDefRef?: string;
  inputsRef?: string;
  requestedAt?: string;
  metadata?: JsonRecord;
  parallelGroupId?: string;
}

export interface ParallelBatch {
  actions: EffectAction[];
  summaries: BatchedEffectSummary[];
}

export interface ParallelPendingPayload {
  effects: BatchedEffectSummary[];
}

export interface BuildParallelBatchOptions {
  maxConcurrency?: number;
  executionStrategy?: 'sequential' | 'concurrent' | 'adaptive';
}

/**
 * Deduplicates EffectAction entries by effectId while preserving order and builds summaries.
 */
export function buildParallelBatch(
  actions: EffectAction[],
  options?: BuildParallelBatchOptions
): ParallelBatch {
  const seen = new Set<string>();
  const deduped: EffectAction[] = [];

  for (const action of actions) {
    if (seen.has(action.effectId)) continue;
    seen.add(action.effectId);
    deduped.push(action);
  }

  let annotated = assignParallelGroupHints(deduped);

  // Propagate maxConcurrency and executionStrategy options to schedulerHints
  if (options?.maxConcurrency !== undefined || options?.executionStrategy !== undefined) {
    annotated = annotated.map((action) => {
      const extraHints: EffectSchedulerHints = {};
      if (options.maxConcurrency !== undefined) {
        extraHints.maxConcurrency = options.maxConcurrency;
      }
      if (options.executionStrategy !== undefined) {
        extraHints.executionStrategy = options.executionStrategy;
      }
      return {
        ...action,
        schedulerHints: mergeSchedulerHints(action.schedulerHints, extraHints),
      };
    });
  }

  const summaries = annotated.map(summarizeEffectAction);

  return {
    actions: annotated,
    summaries,
  };
}

export function summarizeEffectAction(action: EffectAction): BatchedEffectSummary {
  const summary: BatchedEffectSummary = {
    effectId: action.effectId,
    invocationKey: action.invocationKey,
    taskId: action.taskId,
    stepId: action.stepId,
    kind: action.kind,
    label: action.label,
    labels: action.labels ? [...action.labels] : undefined,
    taskDefRef: action.taskDefRef,
    inputsRef: action.inputsRef,
    requestedAt: action.requestedAt,
    metadata: action.taskDef?.metadata,
  };

  if (action.schedulerHints?.parallelGroupId) {
    summary.parallelGroupId = action.schedulerHints.parallelGroupId;
  }

  return summary;
}

export function toParallelPendingPayload(batch: ParallelBatch): ParallelPendingPayload {
  return {
    effects: batch.summaries,
  };
}

function assignParallelGroupHints(actions: EffectAction[]): EffectAction[] {
  if (actions.length <= 1) {
    return actions;
  }
  const hash = createHash("sha1");
  actions.forEach((action) => {
    hash.update(action.invocationKey ?? action.effectId);
    hash.update("|");
  });
  const generatedGroupId = hash.digest("hex").slice(0, 16);
  return actions.map((action) => {
    // Don't overwrite existing parallelGroupId
    const existingGroupId = action.schedulerHints?.parallelGroupId;
    const parallelGroupId = existingGroupId ?? generatedGroupId;
    return {
      ...action,
      schedulerHints: mergeSchedulerHints(action.schedulerHints, { parallelGroupId }),
    };
  });
}

function mergeSchedulerHints(
  base: EffectSchedulerHints | undefined,
  extra: EffectSchedulerHints
): EffectSchedulerHints {
  return {
    ...(base ?? {}),
    ...extra,
  };
}
