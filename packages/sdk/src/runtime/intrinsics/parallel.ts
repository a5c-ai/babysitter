import { EffectAction } from "../types";
import { EffectPendingError, EffectRequestedError, ParallelPendingError } from "../exceptions";
import { buildParallelBatch } from "../../tasks/batching";

export interface ParallelAllOptions {
  maxConcurrency?: number;
  executionStrategy?: 'sequential' | 'concurrent' | 'adaptive';
}

export async function runParallelAll<T>(
  thunks: Array<() => T | Promise<T>>,
  options?: ParallelAllOptions
): Promise<T[]> {
  // Detect and recover from promise-instead-of-thunk misuse.  When callers
  // write [ctx.task(...)] instead of [() => ctx.task(...)], the promises are
  // already executing and will reject with EffectRequestedError as orphaned
  // unhandled rejections (crashing Node).  Convert them to thunks wrapping the
  // existing promises so the batch-collection loop can still gather all pending
  // effect actions without orphan rejections.
  let recovered = false;
  for (let i = 0; i < thunks.length; i++) {
    if (typeof thunks[i] !== "function") {
      const isThenable =
        thunks[i] && typeof (thunks[i] as unknown as { then?: unknown }).then === "function";
      if (isThenable) {
        if (!recovered) {
          thunks = [...thunks]; // shallow copy to avoid mutating caller's array
          recovered = true;
        }
        const promise = thunks[i] as unknown as Promise<T>;
        thunks[i] = (() => promise) as unknown as () => T | Promise<T>;
      } else {
        throw new TypeError(
          `parallel.all() expects an array of functions (thunks), but element at index ${i} is ${typeof thunks[i]}. Wrap each entry as a function: [() => ctx.task(...)] instead of [ctx.task(...)]`
        );
      }
    }
  }

  const results: T[] = [];
  const pending: EffectAction[] = [];
  const maxConcurrency = options?.maxConcurrency;

  if (maxConcurrency !== undefined && maxConcurrency >= 1) {
    // Run thunks with bounded concurrency using a semaphore pattern
    await runWithConcurrencyLimit(thunks, maxConcurrency, results, pending);
  } else {
    // Original behavior: run all thunks sequentially (collecting pending effects)
    for (const thunk of thunks) {
      try {
        const value = await thunk();
        results.push(value);
      } catch (error) {
        const actions = collectPendingActions(error);
        if (actions.length) {
          pending.push(...actions);
          continue;
        }
        throw error;
      }
    }
  }

  if (pending.length) {
    throw new ParallelPendingError(buildParallelBatch(pending, options));
  }

  return results;
}

async function runWithConcurrencyLimit<T>(
  thunks: Array<() => T | Promise<T>>,
  maxConcurrency: number,
  results: T[],
  pending: EffectAction[]
): Promise<void> {
  // Pre-fill results array with undefined slots to maintain order
  const slots: Array<{ value?: T; settled: boolean }> = thunks.map(() => ({ settled: false }));
  let firstNonPendingError: unknown = undefined;
  let hasNonPendingError = false;

  let nextIndex = 0;
  const activePromises = new Set<Promise<void>>();

  const launchNext = (): Promise<void> | undefined => {
    if (nextIndex >= thunks.length || hasNonPendingError) return undefined;
    const idx = nextIndex++;
    const p = (async () => {
      try {
        const value = await thunks[idx]();
        slots[idx] = { value, settled: true };
      } catch (error) {
        const actions = collectPendingActions(error);
        if (actions.length) {
          pending.push(...actions);
          slots[idx] = { settled: true };
        } else {
          if (!hasNonPendingError) {
            firstNonPendingError = error;
            hasNonPendingError = true;
          }
          slots[idx] = { settled: true };
        }
      }
    })();

    const tracked = p.then(() => {
      activePromises.delete(tracked);
    });
    activePromises.add(tracked);
    return tracked;
  };

  // Launch initial batch up to maxConcurrency
  for (let i = 0; i < maxConcurrency && i < thunks.length; i++) {
    void launchNext();
  }

  // As each completes, launch the next
  while (activePromises.size > 0) {
    await Promise.race(activePromises);
    // Launch more if available
    while (activePromises.size < maxConcurrency && nextIndex < thunks.length && !hasNonPendingError) {
      void launchNext();
    }
  }

  if (hasNonPendingError) {
    throw firstNonPendingError;
  }

  // Collect ordered results (only for non-pending slots)
  for (const slot of slots) {
    if (slot.settled && slot.value !== undefined) {
      results.push(slot.value);
    }
  }
}

export async function runParallelMap<TItem, TOut>(
  items: TItem[],
  fn: (item: TItem) => TOut | Promise<TOut>
): Promise<TOut[]> {
  const thunks = items.map((item) => () => fn(item));
  return runParallelAll(thunks);
}

export function dedupeEffectActions(actions: EffectAction[]): EffectAction[] {
  return buildParallelBatch(actions).actions;
}

function collectPendingActions(error: unknown): EffectAction[] {
  if (error instanceof ParallelPendingError) {
    // Strip auto-assigned parallelGroupId from inner batch actions so the
    // outer buildParallelBatch can assign a unified group to all collected actions.
    return error.batch.actions.map(stripAutoParallelGroupId);
  }
  if (error instanceof EffectPendingError || error instanceof EffectRequestedError) {
    return [error.action];
  }
  return [];
}

/**
 * Removes parallelGroupId from schedulerHints that was auto-assigned by an
 * inner buildParallelBatch call. This allows the outer batch to re-group all
 * actions under a single parallelGroupId.
 *
 * We detect "auto-assigned" by checking if the parallelGroupId looks like a
 * hex hash (the format produced by assignParallelGroupHints). User-provided
 * parallelGroupIds typically have descriptive names.
 *
 * However, to be safe and simple, we always strip when collecting from inner
 * ParallelPendingError since inner grouping is superseded by outer grouping.
 */
function stripAutoParallelGroupId(action: EffectAction): EffectAction {
  if (!action.schedulerHints?.parallelGroupId) {
    return action;
  }
  const { parallelGroupId: _stripped, ...restHints } = action.schedulerHints;
  const hasRemainingHints = Object.keys(restHints).length > 0;
  return {
    ...action,
    schedulerHints: hasRemainingHints ? restHints : undefined,
  };
}
