/**
 * Kanban board column model — SPEC-vibekanban §3 (pure logic, Wave 1).
 *
 * Columns derive 1:1 from the bucket predicates already implemented in
 * `filterByStatus` (src/lib/services/run-query-service.ts) and mirrored by the
 * RunFilterBar pills. This module introduces NO new predicate logic — only a
 * PRECEDENCE that turns the overlapping filter buckets into a disjoint
 * partition (a card lives in exactly one column).
 *
 * Contract (LAW): observer-only · read-only. This is a pure presentation
 * mapping over runs the observer already fetched; it never writes anything.
 */

import type { LightRun } from "@/lib/services/run-query-service";
import {
  classifyRun,
  isIdleSession,
  isOrphanedBucket as isOrphanedBucketRaw,
  HIDDEN_SURFACED_COLUMNS,
  type BoardColumnKey,
  type RunLiveness,
} from "@/lib/counting/run-classification";

/**
 * Column keys re-exported from the SINGLE counting source (§15.4) — this
 * module no longer owns the classification, it consumes it. The type stays
 * exported here for the frozen board contract (kanban-column-model.test.ts).
 */
export type { BoardColumnKey };

/** Effective liveness of a LightRun for the raw orphaned predicate. */
function livenessOf(run: LightRun): RunLiveness {
  return (run.driver ?? "none") as RunLiveness;
}

/** Local wrapper: orphaned-bucket predicate over a LightRun's own driver. */
function isOrphanedBucket(run: LightRun): boolean {
  return isOrphanedBucketRaw(run, livenessOf(run));
}

/**
 * Column visual order = SPEC §3.2 table order = the flat-list rank() order in
 * run-list.tsx (needs-you → orphaned → waiting → stale), extended with the two
 * terminal columns.
 */
export const COLUMN_ORDER: BoardColumnKey[] = [
  "needsyou",
  "scheduled",
  "orphaned",
  "waiting",
  "stale",
  "failed",
  "completed",
];

/**
 * A run as it appears on the board: hidden-project breakpoint runs retained in
 * Needs-you carry `hiddenProject: true` so the card can show the EyeOff marker
 * (SPEC §6.3 / QA F4 — needs-you is never silently swallowed).
 */
export type BoardRun = LightRun & { hiddenProject?: boolean };

export type BoardPartition = Record<BoardColumnKey, BoardRun[]>;

/**
 * Assign a run to exactly one column — now a thin delegate to the SINGLE
 * counting source (§15.4 AC-69): `classifyRun` is the ONE producer of the
 * disjoint precedence partition (needsYou → orphaned → working → stale →
 * failed → completed). Kept as a named export for the frozen board contract.
 */
export function assignColumn(run: LightRun): BoardColumnKey {
  return classifyRun(run).column;
}

/**
 * Within-column sort: updatedAt DESC with runId as the final tiebreaker — the
 * exact "activity" comparator from sortRuns (run-query-service.ts). Duplicated
 * here (not imported) because this module is bundled CLIENT-side: importing a
 * value from run-query-service drags its fs/config-loader server imports into
 * the client bundle and breaks the Next.js build. Type-only imports are fine.
 */
function sortByActivity(runs: LightRun[]): void {
  runs.sort((a, b) => {
    const cmp = (b.updatedAt || "").localeCompare(a.updatedAt || "");
    if (cmp !== 0) return cmp;
    return a.runId.localeCompare(b.runId);
  });
}

/** Build an empty partition with every column present (stable shape). */
function emptyPartition(): BoardPartition {
  return {
    needsyou: [],
    scheduled: [],
    orphaned: [],
    waiting: [],
    stale: [],
    failed: [],
    completed: [],
  };
}

/**
 * Partition runs into disjoint columns (SPEC §3.3) and sort within each column
 * by updatedAt DESC with runId as final tiebreaker — the same determinism rule
 * as sortRuns "activity" mode (no visual jumping during the "morning chaos"
 * scenario), which is reused directly.
 *
 * hiddenProjects (SPEC §6.3 / §15.1 model A): runs from registry-hidden
 * projects are excluded from most columns, but the board STILL surfaces the
 * ones that must alarm/inform — Needs-you approvals, live Working runs (AC-75),
 * and Scheduled sleeping runs (AC-87) — flagged `hiddenProject: true` so the
 * card shows the EyeOff marker. Everything else (orphaned/stale/done) stays
 * collapsed. The surfaced set is HIDDEN_SURFACED_COLUMNS (the single source).
 */
export function partitionRuns(
  runs: LightRun[],
  hiddenProjects?: Set<string>,
  options?: { detectIdleSessions?: boolean }
): BoardPartition {
  const partition = emptyPartition();
  // SESSIONS-CHIP-SPEC AC2: idle sessions (bare/0-task) are kept OUT of every
  // column by default. Detection defaults on; the board passes false to build
  // the "revealed" partition where idle sessions land in their natural column.
  const detectIdle = options?.detectIdleSessions !== false;

  for (const run of runs) {
    if (detectIdle && isIdleSession(run)) continue;
    const column = assignColumn(run);
    const hidden = hiddenProjects?.has(run.projectName ?? "") === true;
    if (hidden) {
      // Model A: surface only the columns the board keeps for hidden projects
      // (needsyou/waiting/scheduled); collapse the rest. A surfaced card is
      // flagged so it renders the EyeOff "hidden project" marker.
      if (!HIDDEN_SURFACED_COLUMNS.has(column)) continue;
      partition[column].push({ ...run, hiddenProject: true });
      continue;
    }
    partition[column].push(run);
  }

  // Within-column order: updatedAt DESC, runId tiebreaker (sortRuns "activity").
  for (const key of COLUMN_ORDER) {
    sortByActivity(partition[key]);
  }

  return partition;
}

// ---------------------------------------------------------------------------
// UX-R2 §13.2 option (b) — display-level 4-column grouping (owner gate
// 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W: 4-column taxonomy + color map).
// The six-bucket partition above is UNCHANGED (AC-1..AC-10 stand verbatim);
// groupColumns() is a pure display layer over it.
// ---------------------------------------------------------------------------

/**
 * The display columns the board renders (§13.2b order, extended by §15.1 with
 * a first-class Scheduled column for sleeping forever-runs). Scheduled sits
 * between Working and Stalled: it is idle-HEALTHY (not dead), so it must never
 * pool with Stalled (AC-84/86).
 */
export type BoardGroupKey = "needsyou" | "waiting" | "scheduled" | "stalled" | "done";

/** Display order: Needs you → Working → Scheduled → Stalled → Done. */
export const GROUP_ORDER: BoardGroupKey[] = [
  "needsyou",
  "waiting",
  "scheduled",
  "stalled",
  "done",
];

/**
 * Bucket → host display column (§13.2b + §15.1): orphaned+stale host under
 * Stalled, failed+completed under Done, scheduled is its own column. Used by
 * the pill→column focus mapping — the filter pills keep the six status buckets.
 */
export const GROUP_HOST: Record<BoardColumnKey, BoardGroupKey> = {
  needsyou: "needsyou",
  scheduled: "scheduled",
  orphaned: "stalled",
  waiting: "waiting",
  stale: "stalled",
  failed: "done",
  completed: "done",
};

export type BoardGroups = Record<BoardGroupKey, BoardRun[]>;

/**
 * Group the six-bucket partition into the four display columns (AC-35).
 * Totals are preserved (Σ grouped sizes === Σ partition sizes) and the
 * within-group order is the concatenation in §3.2 precedence order — orphaned
 * cards before stale cards inside Stalled, failed before completed inside
 * Done — with each segment keeping its own updatedAt DESC order.
 */
export function groupColumns(partition: BoardPartition): BoardGroups {
  return {
    needsyou: partition.needsyou,
    waiting: partition.waiting,
    // §15.1: Scheduled is its own display column — never merged into Stalled.
    scheduled: partition.scheduled,
    stalled: [...partition.orphaned, ...partition.stale],
    done: [...partition.failed, ...partition.completed],
  };
}

/**
 * Count honesty for the Stalled column header (SPEC §3.4, F1 lesson — AC-10
 * text amended per §13.6): pills count OVERLAPPING buckets while columns
 * count a DISJOINT partition, so orphaned/stale breakpoint runs render under
 * Needs-you and the orphaned/stale pill counts may exceed the Stalled column
 * count. Union math: a Needs-you run that is both orphaned AND stale counts
 * once. Absorption BETWEEN the orphaned and stale buckets stays inside the
 * Stalled host and is no longer a column-level discrepancy.
 *
 * Returns null when no needs-you run also matches a stalled-bucket predicate
 * (i.e. pill counts === column count).
 */
export function stalledOverflowTooltip(
  partition: Record<BoardColumnKey, LightRun[]>
): string | null {
  const wouldBeStalled = (run: LightRun) =>
    isOrphanedBucket(run) || run.isStale === true;
  const captured = partition.needsyou.filter(wouldBeStalled).length;
  if (captured === 0) return null;
  const noun = captured === 1 ? "run is" : "runs are";
  return `+${captured} more stalled ${noun} shown under Needs you`;
}

/**
 * Count honesty for the Working column header — UX-R2 §13.5/AC-47, the same
 * absorbed-into mechanism as stalledOverflowTooltip: the "waiting" pill counts
 * every non-stale in-progress run (breakpoint runs included), while the board
 * partition sends breakpoint runs to Needs-you first. A needs-you run counts
 * here only when Working is where it would otherwise land (assignColumn minus
 * row 1: not orphaned, not stale) — orphaned/stale needs-you runs are already
 * disclosed by the Stalled tooltip, so no run is disclosed twice.
 *
 * Returns null when the waiting pill count equals the Working column count.
 */
export function workingOverflowTooltip(
  partition: Record<BoardColumnKey, LightRun[]>
): string | null {
  const wouldBeWorking = (run: LightRun) =>
    !isOrphanedBucket(run) && run.isStale !== true;
  const captured = partition.needsyou.filter(wouldBeWorking).length;
  if (captured === 0) return null;
  const noun = captured === 1 ? "run is" : "runs are";
  return `+${captured} more working ${noun} shown under Needs you`;
}
