import { randomUUID } from "crypto";
import type { EffectAction, EffectSchedulerHints } from "../types";
import { EffectPendingError, EffectRequestedError, ParallelPendingError } from "../exceptions";
import { buildParallelBatch } from "../../tasks/batching";

export interface ParallelGroupOptions {
  groupLabel: string;
  persistent?: boolean;
  preferredHarness?: string | string[];
}

/**
 * Runs thunks as a named parallel group with a shared effectGroupId.
 * Supports preferred harness assignment (single string or round-robin array).
 */
export async function runParallelGroup<T>(
  thunks: Array<() => T | Promise<T>>,
  options: ParallelGroupOptions
): Promise<T[]> {
  if (thunks.length === 0) {
    return [];
  }

  const effectGroupId = randomUUID();
  const results: T[] = [];
  const pending: EffectAction[] = [];

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

  if (pending.length) {
    // Annotate all pending actions with the shared effectGroupId and optional harness hints
    const annotated = pending.map((action, index) => {
      const extraHints: EffectSchedulerHints = { effectGroupId };

      if (options.persistent) {
        extraHints.groupRole = index === 0 ? "coordinator" : "worker";
      }

      if (options.preferredHarness !== undefined) {
        if (typeof options.preferredHarness === "string") {
          extraHints.preferredHarness = options.preferredHarness;
        } else if (Array.isArray(options.preferredHarness) && options.preferredHarness.length > 0) {
          extraHints.preferredHarness = options.preferredHarness[index % options.preferredHarness.length];
        }
      }

      return {
        ...action,
        schedulerHints: {
          ...(action.schedulerHints ?? {}),
          ...extraHints,
        },
      };
    });

    throw new ParallelPendingError(buildParallelBatch(annotated));
  }

  return results;
}

/**
 * Fan-out pattern: maps each item through a function, collecting results or
 * pending effects as a group with a shared effectGroupId.
 */
export async function runParallelFanOut<TItem, TOut>(
  items: TItem[],
  fn: (item: TItem) => TOut | Promise<TOut>,
  _options: ParallelGroupOptions
): Promise<TOut[]> {
  if (items.length === 0) {
    return [];
  }

  const effectGroupId = randomUUID();
  const results: TOut[] = [];
  const pending: EffectAction[] = [];

  for (const item of items) {
    try {
      const value = await fn(item);
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

  if (pending.length) {
    const annotated = pending.map((action) => ({
      ...action,
      schedulerHints: {
        ...(action.schedulerHints ?? {}),
        effectGroupId,
      },
    }));

    throw new ParallelPendingError(buildParallelBatch(annotated));
  }

  return results;
}

function collectPendingActions(error: unknown): EffectAction[] {
  if (error instanceof ParallelPendingError) {
    return error.batch.actions;
  }
  if (error instanceof EffectPendingError || error instanceof EffectRequestedError) {
    return [error.action];
  }
  return [];
}
