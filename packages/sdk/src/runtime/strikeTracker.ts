import type { ForwardFixStrikeBudget, StrikeTracker } from "./types";

/**
 * Extended tracker interface used internally to dedupe strikes by effectId.
 * Public `StrikeTracker` (types.ts) omits this since callers should never
 * touch the dedupe set directly.
 */
export interface InternalStrikeTracker extends StrikeTracker {
  /** Records a strike keyed by an effectId. Returns true when newly recorded, false if already-recorded. */
  recordEffectFailure(bugClass: string, effectId: string): boolean;
  /** Returns true when a strike has already been recorded for this effectId. */
  hasRecordedEffect(effectId: string): boolean;
}

export const DEFAULT_STRIKE_BUDGET_PER_BUG_CLASS = 2;
export const DEFAULT_STRIKE_BUDGET_PIVOT_PHASE = "instrumentation";

/**
 * Normalizes a partial budget config: fills in defaults and clamps `perBugClass`
 * to a positive integer. Returns a fully-populated budget that is safe to use
 * by the tracker.
 */
export function normalizeStrikeBudget(
  budget: Partial<ForwardFixStrikeBudget> | undefined | null
): ForwardFixStrikeBudget {
  const perBugClassRaw = budget?.perBugClass;
  const perBugClass =
    typeof perBugClassRaw === "number" && Number.isFinite(perBugClassRaw) && perBugClassRaw > 0
      ? Math.floor(perBugClassRaw)
      : DEFAULT_STRIKE_BUDGET_PER_BUG_CLASS;
  const pivotPhase =
    typeof budget?.pivotPhase === "string" && budget.pivotPhase.length > 0
      ? budget.pivotPhase
      : DEFAULT_STRIKE_BUDGET_PIVOT_PHASE;
  const result: ForwardFixStrikeBudget = { perBugClass, pivotPhase };
  if (typeof budget?.instrumentationTemplate === "string" && budget.instrumentationTemplate.length > 0) {
    result.instrumentationTemplate = budget.instrumentationTemplate;
  }
  return result;
}

/**
 * Creates an in-memory strike tracker. The tracker is intentionally local to a
 * single replay-engine instance; persistence happens implicitly through journal
 * replay (failed effects with a `bugClass` are replayed and re-counted on every
 * replay-engine init).
 */
export function createStrikeTracker(budget: ForwardFixStrikeBudget): InternalStrikeTracker {
  const counts: Record<string, number> = {};
  const recordedEffectIds = new Set<string>();

  return {
    budget,
    get counts() {
      return counts;
    },
    recordFailure(bugClass: string): number {
      if (!bugClass || typeof bugClass !== "string") {
        return 0;
      }
      const next = (counts[bugClass] ?? 0) + 1;
      counts[bugClass] = next;
      return next;
    },
    recordEffectFailure(bugClass: string, effectId: string): boolean {
      if (!bugClass || !effectId) {
        return false;
      }
      if (recordedEffectIds.has(effectId)) {
        return false;
      }
      recordedEffectIds.add(effectId);
      const next = (counts[bugClass] ?? 0) + 1;
      counts[bugClass] = next;
      return true;
    },
    hasRecordedEffect(effectId: string): boolean {
      return recordedEffectIds.has(effectId);
    },
    reset(bugClass: string): void {
      if (!bugClass || typeof bugClass !== "string") {
        return;
      }
      delete counts[bugClass];
    },
    isExhausted(bugClass: string): boolean {
      if (!bugClass || typeof bugClass !== "string") {
        return false;
      }
      return (counts[bugClass] ?? 0) >= budget.perBugClass;
    },
    get(bugClass: string): number {
      if (!bugClass || typeof bugClass !== "string") {
        return 0;
      }
      return counts[bugClass] ?? 0;
    },
  };
}
