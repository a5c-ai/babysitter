import type { EffectAction } from "../runtime/types";
import { getEffectiveConcurrency } from "./grouping";

export interface EffectExecutionWave {
  actions: EffectAction[];
  concurrent: boolean;
  parallelGroupId?: string;
  maxConcurrency: number;
}

export interface SettledExecutionResult<TItem, TResult> {
  item: TItem;
  index: number;
  status: "fulfilled" | "rejected";
  value?: TResult;
  reason?: unknown;
}

export function hasConcurrentEffectsCapability(capabilities?: readonly string[]): boolean {
  return capabilities?.includes("concurrent-effects") ?? false;
}

export function buildEffectExecutionWaves(
  actions: EffectAction[],
  options?: { concurrentEffects?: boolean },
): EffectExecutionWave[] {
  if (!options?.concurrentEffects) {
    return actions.map((action) => ({
      actions: [action],
      concurrent: false,
      maxConcurrency: 1,
    }));
  }

  const waves: EffectExecutionWave[] = [];
  let index = 0;
  while (index < actions.length) {
    const action = actions[index]!;
    const groupId = action.schedulerHints?.parallelGroupId;
    if (!groupId || action.schedulerHints?.executionStrategy === "sequential") {
      waves.push({
        actions: [action],
        concurrent: false,
        maxConcurrency: 1,
      });
      index += 1;
      continue;
    }

    const groupActions: EffectAction[] = [];
    while (index < actions.length) {
      const candidate = actions[index]!;
      if (
        candidate.schedulerHints?.parallelGroupId !== groupId ||
        candidate.schedulerHints?.executionStrategy === "sequential"
      ) {
        break;
      }
      groupActions.push(candidate);
      index += 1;
    }

    const maxConcurrencyHints = groupActions
      .map((groupAction) => groupAction.schedulerHints?.maxConcurrency)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 1);

    waves.push({
      actions: groupActions,
      concurrent: groupActions.length > 1,
      parallelGroupId: groupId,
      maxConcurrency: getEffectiveConcurrency(groupActions, {
        maxConcurrency: maxConcurrencyHints.length > 0 ? Math.min(...maxConcurrencyHints) : undefined,
      }),
    });
  }

  return waves;
}

export async function mapWithConcurrency<TItem, TResult>(
  items: TItem[],
  limit: number,
  worker: (item: TItem, index: number) => Promise<TResult> | TResult,
): Promise<Array<SettledExecutionResult<TItem, TResult>>> {
  if (items.length === 0) {
    return [];
  }
  const normalizedLimit = Number.isFinite(limit) ? Math.floor(limit) : items.length;
  const concurrency = Math.max(1, Math.min(items.length, normalizedLimit));
  const results = new Array<SettledExecutionResult<TItem, TResult>>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      const item = items[index]!;
      try {
        results[index] = {
          item,
          index,
          status: "fulfilled",
          value: await worker(item, index),
        };
      } catch (reason) {
        results[index] = {
          item,
          index,
          status: "rejected",
          reason,
        };
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => runWorker()));
  return results;
}
