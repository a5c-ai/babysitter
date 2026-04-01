import { EffectAction } from "../types";
import { EffectPendingError, EffectRequestedError, ParallelPendingError } from "../exceptions";
import { buildParallelBatch } from "../../tasks/batching";

export async function runParallelAll<T>(thunks: Array<() => T | Promise<T>>): Promise<T[]> {
  for (let i = 0; i < thunks.length; i++) {
    if (typeof thunks[i] !== "function") {
      const isThenable =
        thunks[i] && typeof (thunks[i] as unknown as { then?: unknown }).then === "function";
      const hint = isThenable
        ? " It looks like a Promise was passed. Wrap each entry: [() => ctx.task(...)] instead of [ctx.task(...)]"
        : " Wrap each entry as a function: [() => ctx.task(...)] instead of [ctx.task(...)]";
      throw new TypeError(
        `parallel.all() expects an array of functions (thunks), but element at index ${i} is ${typeof thunks[i]}.${hint}`
      );
    }
  }

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
    throw new ParallelPendingError(buildParallelBatch(pending));
  }

  return results;
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
    return error.batch.actions;
  }
  if (error instanceof EffectPendingError || error instanceof EffectRequestedError) {
    return [error.action];
  }
  return [];
}
