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
    if (!matchesExpected(actual, expected)) {
      return false;
    }
  }

  return true;
}

function matchesExpected(actual: unknown, expected: unknown): boolean {
  if (typeof expected !== 'string') {
    return actual === expected;
  }

  const negated = expected.startsWith('!');
  const matcher = negated ? expected.slice(1) : expected;
  const matched = matchesStringExpected(actual, matcher);
  return negated ? !matched : matched;
}

function matchesStringExpected(actual: unknown, expected: string): boolean {
  if (actual == null) {
    return false;
  }

  const actualString = typeof actual === 'string' ? actual : JSON.stringify(actual);
  if (actualString == null) {
    return false;
  }
  const regex = parseRegexMatcher(expected);
  if (regex) {
    return regex.test(actualString);
  }

  if (expected.includes('|')) {
    return expected.split('|').some((part) => actualString === part);
  }

  return actual === expected;
}

function parseRegexMatcher(expected: string): RegExp | null {
  if (!expected.startsWith('/') || expected.length < 2) {
    return null;
  }

  const lastSlash = expected.lastIndexOf('/');
  if (lastSlash <= 0) {
    return null;
  }

  const source = expected.slice(1, lastSlash);
  const flags = expected.slice(lastSlash + 1);
  try {
    return new RegExp(source, flags);
  } catch {
    return null;
  }
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

function handlerSortSource(handler: HandlerRef): string {
  switch (handler.type) {
    case 'http':
      return `http:${handler.url}`;
    case 'mcp_tool':
      return `mcp_tool:${handler.server}:${handler.tool}`;
    case 'prompt':
      return `prompt:${handler.prompt}`;
    case 'agent':
      return `agent:${handler.agent ?? ''}:${handler.prompt}`;
    case 'command':
    case 'shell':
    case undefined:
      return `command:${handler.source}`;
    default:
      return String((handler as { type?: unknown }).type ?? 'unknown');
  }
}

function handlerSortName(handler: HandlerRef): string {
  if (handler.type === 'command' || handler.type === 'shell' || handler.type == null) {
    return handler.handler ?? 'handler';
  }
  return handler.type;
}

function handlerPluginId(handler: HandlerRef): string {
  return handlerSortSource(handler);
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
    const sa = handlerSortSource(a).localeCompare(handlerSortSource(b));
    if (sa !== 0) return sa;
    return handlerSortName(a).localeCompare(handlerSortName(b));
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
      pluginId: handlerPluginId(h),
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
