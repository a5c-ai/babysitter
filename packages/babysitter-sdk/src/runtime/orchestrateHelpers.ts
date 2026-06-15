/**
 * Helper functions for orchestrateIteration.
 * Extracted from orchestrateIteration.ts for max-lines compliance.
 */

import type { ReplayEngine } from "./replay/createReplayEngine";
import type {
  EffectAction,
  EffectSchedulerHints,
  IterationMetadata,
  IterationResult,
} from "./types";
import {
  EffectPendingError,
  EffectRequestedError,
  ParallelPendingError,
} from "./exceptions";

type WaitingIterationResult = Extract<IterationResult, { status: "waiting" }>;

/** @internal Exported for testing only. */
export function asWaitingResult(error: unknown): WaitingIterationResult | null {
  if (error instanceof ParallelPendingError) {
    return { status: "waiting", nextActions: error.batch.actions };
  }
  if (error instanceof EffectRequestedError || error instanceof EffectPendingError) {
    return { status: "waiting", nextActions: [error.action] };
  }

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if (
      (err.name === "ParallelPendingError" || err.name === "ParallelPendingError") &&
      err.batch && typeof err.batch === "object" &&
      Array.isArray((err.batch as Record<string, unknown>).actions)
    ) {
      return { status: "waiting", nextActions: (err.batch as { actions: EffectAction[] }).actions };
    }
    if (
      (err.name === "EffectRequestedError" || err.name === "EffectPendingError") &&
      err.action && typeof err.action === "object" &&
      typeof (err.action as Record<string, unknown>).effectId === "string"
    ) {
      return { status: "waiting", nextActions: [err.action as EffectAction] };
    }
  }

  return null;
}

export function resolveNow(now?: Date | (() => Date)): () => Date {
  if (!now) return () => new Date();
  if (typeof now === "function") return now as () => Date;
  const fixed = now;
  return () => fixed;
}

export function annotateWaitingActions(actions: EffectAction[]): EffectAction[] {
  const pendingCount = actions.length;
  return actions.map((action) => {
    const derivedSleep = deriveSleepHint(action);
    const nextHints = mergeSchedulerHints(action.schedulerHints, {
      pendingCount,
      sleepUntilEpochMs: derivedSleep,
    });
    if (
      nextHints === action.schedulerHints ||
      (nextHints === undefined && action.schedulerHints === undefined)
    ) {
      return action;
    }
    return { ...action, schedulerHints: nextHints };
  });
}

function deriveSleepHint(action: EffectAction): number | undefined {
  if (typeof action.schedulerHints?.sleepUntilEpochMs === "number") {
    return action.schedulerHints.sleepUntilEpochMs;
  }
  const direct = action.taskDef?.sleep?.targetEpochMs;
  if (typeof direct === "number") return direct;
  const metadataTarget = (action.taskDef?.metadata as { targetEpochMs?: number } | undefined)?.targetEpochMs;
  return typeof metadataTarget === "number" ? metadataTarget : undefined;
}

function mergeSchedulerHints(
  base: EffectSchedulerHints | undefined,
  extra: EffectSchedulerHints
): EffectSchedulerHints | undefined {
  const merged: EffectSchedulerHints = { ...(base ?? {}) };
  let changed = false;

  if (extra.pendingCount !== undefined && merged.pendingCount !== extra.pendingCount) {
    merged.pendingCount = extra.pendingCount; changed = true;
  }
  if (extra.sleepUntilEpochMs !== undefined && merged.sleepUntilEpochMs !== extra.sleepUntilEpochMs) {
    merged.sleepUntilEpochMs = extra.sleepUntilEpochMs; changed = true;
  }
  if (extra.parallelGroupId !== undefined && merged.parallelGroupId !== extra.parallelGroupId) {
    merged.parallelGroupId = extra.parallelGroupId; changed = true;
  }
  if (extra.maxConcurrency !== undefined && merged.maxConcurrency !== extra.maxConcurrency) {
    merged.maxConcurrency = extra.maxConcurrency; changed = true;
  }
  if (extra.executionStrategy !== undefined && merged.executionStrategy !== extra.executionStrategy) {
    merged.executionStrategy = extra.executionStrategy; changed = true;
  }

  if (!changed) return base;
  return merged;
}

export function createIterationMetadata(engine: ReplayEngine): IterationMetadata {
  return {
    stateVersion: engine.stateCache?.stateVersion,
    pendingEffectsByKind: engine.stateCache?.pendingEffectsByKind,
    journalHead: engine.stateCache?.journalHead ?? null,
    stateRebuilt: Boolean(engine.stateRebuild),
    stateRebuildReason: engine.stateRebuild?.reason ?? null,
  };
}
