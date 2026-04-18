import type { HandlerRef, HookPlanEntry } from '../types/plan';
import type { UnifiedHookEvent } from '../types/event';

/**
 * Options for resolving a hook execution plan.
 */
export interface PlanResolverOptions {
  /** The canonical phase to resolve handlers for. */
  phase: string;
  /** Explicit handler refs passed via CLI --handler args. */
  handlers?: HandlerRef[];
}

/**
 * Resolve a dot-notation path on an object.
 *
 * E.g. `getNestedValue({ a: { b: 1 } }, 'a.b')` returns `1`.
 * Returns `undefined` when any segment is missing.
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = obj;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Evaluate a `when` condition against a normalized event.
 *
 * `when` is a flat key-value map.  Each key is resolved against the
 * event via dot-notation (e.g. `execution.adapter` -> `event.execution.adapter`).
 * ALL conditions must match for the handler to run.
 *
 * Returns `true` when the handler should be executed.
 */
export function evaluateWhen(
  when: Record<string, unknown> | undefined,
  event: UnifiedHookEvent,
): boolean {
  if (when == null || Object.keys(when).length === 0) {
    return true;
  }

  for (const [key, expected] of Object.entries(when)) {
    const actual = getNestedValue(event, key);
    if (actual !== expected) {
      return false;
    }
  }

  return true;
}

/**
 * Sort plan entries by: priority ascending, then pluginId ascending,
 * then id ascending for deterministic ordering.
 */
export function sortPlanEntries(entries: HookPlanEntry[]): HookPlanEntry[] {
  return [...entries].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const sa = a.pluginId.localeCompare(b.pluginId);
    if (sa !== 0) return sa;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Sort handler refs by: priority ascending, then source ascending,
 * then handler ascending.  (Legacy convenience for external callers.)
 */
export function sortHandlers(handlers: HandlerRef[]): HandlerRef[] {
  return [...handlers].sort((a, b) => {
    const pa = a.priority ?? 1000;
    const pb = b.priority ?? 1000;
    if (pa !== pb) return pa - pb;
    const sa = a.source.localeCompare(b.source);
    if (sa !== 0) return sa;
    return a.handler.localeCompare(b.handler);
  });
}

/**
 * Resolve a hook execution plan for the given phase.
 *
 * Merges handlers from explicit --handler args.
 * Produces one HookPlanEntry per handler, sorted by priority.
 */
export function resolveHookPlan(options: PlanResolverOptions): HookPlanEntry[] {
  const { phase, handlers = [] } = options;

  const entries: HookPlanEntry[] = [];
  let counter = 0;

  // Explicit handler refs
  for (const h of handlers) {
    entries.push({
      id: `explicit-${counter++}`,
      pluginId: h.source,
      phase,
      priority: h.priority ?? 1000,
      handler: h,
    });
  }

  if (entries.length === 0) {
    return [];
  }

  return sortPlanEntries(entries);
}
