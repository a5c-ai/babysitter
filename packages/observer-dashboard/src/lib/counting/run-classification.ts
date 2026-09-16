/**
 * SINGLE counting source — SPEC-vibekanban §15.4 (owner gate 2026-07-06b,
 * hidden model A). Wave 1 substrate: ONE pure classifier + ONE reconciled
 * counting function that EVERY surface (banner sentence, KPI tiles, filter
 * pills, board columns) derives from, so no two surfaces can diverge.
 *
 * WHY THIS EXISTS (live-disk audit 2026-07-06, §15.1): tiles/banner/pills read
 * the DIGEST pipeline (per-project `pendingBreakpoints` sums, no
 * `recordedAwaitingResume`, three different hidden scopes) while board columns
 * read the FULL-RUN pipeline (`assignColumn` over `parseRunDir` output). Same
 * disk, different numbers. This module collapses both onto ONE classifier
 * computed from the FULL run (so `recordedAwaitingResume` is available
 * everywhere) and ONE `computeReconciledCounts` whose output guarantees, by
 * construction, the invariant:
 *
 *     pill(S) === column(S) + underNeedsYou(S) + fromHidden(S) + hiddenCollapsed(S)
 *
 * Contract (LAW): observer-only · read-only. This is pure presentation/counting
 * over already-fetched runs; it never writes anything and adds NO dependency.
 */

import type { LightRun } from "@/lib/services/run-query-service";

/**
 * Effective liveness of a run. "live"/"orphaned"/"none" mirror
 * `DriverLiveness` (already activity-derived server-side in parser.ts via
 * `deriveLivenessFromActivity`). "scheduled" is the §15.1 seam for a sleeping
 * forever-run (unresolved `sleep` effect) — wave 2 populates it; wave 1 keeps
 * the field so the counting source and column model can plug it in without a
 * second model.
 */
export type RunLiveness = "live" | "orphaned" | "none" | "scheduled";

/**
 * The six disjoint board buckets — matches the RunFilterBar pill keys and the
 * `assignColumn` precedence partition (a run lives in exactly one). Kept here
 * (not in column-model) so column-model can consume the classifier without a
 * circular import; column-model re-exports the type for its frozen contract.
 */
export type BoardColumnKey =
  | "needsyou"
  | "scheduled"
  | "orphaned"
  | "waiting"
  | "stale"
  | "failed"
  | "completed";

/**
 * §15.1 (owner gate 2026-07-06b, model A): the board columns that STILL surface
 * runs from grid-hidden projects (with an EyeOff marker + a "(N from hidden)"
 * disclosure). Hidden approvals are never dropped (needsyou), hidden live runs
 * surface into Working (AC-75), and hidden sleeping runs surface as scheduled
 * (AC-87 microcopy). Every OTHER column stays collapsed for hidden projects.
 */
export const HIDDEN_SURFACED_COLUMNS: ReadonlySet<BoardColumnKey> = new Set<BoardColumnKey>([
  "needsyou",
  "waiting",
  "scheduled",
]);

/**
 * Per-run classification — §15.4. `flags` are OVERLAPPING predicates (a run can
 * be both `orphaned` and `stale`); `column` is the DISJOINT precedence
 * assignment (needsYou → orphaned → working → stale → failed → completed). The
 * pills count the overlapping flags; the board renders the disjoint column;
 * `computeReconciledCounts` bridges the two with disclosed deltas.
 */
export interface RunClassification {
  hidden: boolean;
  terminal: boolean;
  needsYou: boolean;
  orphaned: boolean;
  working: boolean;
  stale: boolean;
  live: boolean;
  /** §15.1 seam — true only once wave 2 feeds a "scheduled" liveness in. */
  scheduled: boolean;
  /**
   * SESSIONS-CHIP-SPEC AC1/AC2: this run is an idle session (bare/0-task) and,
   * with detection on (default), is kept OUT of every board column. `column`
   * still holds its natural bucket for a revealed view; consumers gate on this
   * flag to hide it by default.
   */
  idleSession: boolean;
  /** The single disjoint column this run renders in. */
  column: BoardColumnKey;
}

export interface ClassifyOptions {
  /** Registry-hidden project names (grid-hidden; §6.3). */
  hiddenProjects?: Set<string>;
  /**
   * §15.1 seam: override a run's effective liveness (e.g. map a sleeping
   * forever-run to "scheduled"). Defaults to the run's own `driver`. Pure and
   * injectable so wave 2 can plug in sleep detection without a second model.
   */
  livenessOf?: (run: LightRun) => RunLiveness;
  /**
   * SESSIONS-CHIP-SPEC (frozen 2026-07-09) AC1/AC2: detect "idle sessions"
   * (bare/0-task runs) and keep them OUT of every board column + status pill,
   * disclosing them only via `sessionCollapsed` + the top-level `sessions`
   * count. Default true. Setting it false restores the pre-feature behavior
   * (idle sessions flood the Working column) — used to prove the drop is
   * exactly the idle count (AC5).
   */
  detectIdleSessions?: boolean;
}

/**
 * SESSIONS-CHIP-SPEC AC1 — the idle-session (a.k.a. bare-run) predicate with
 * its alarm-safety guarantee. A run is an idle session IFF ALL hold:
 *   1. processId is "bare-run" OR empty/absent; AND
 *   2. it has 0 tasks; AND
 *   3. it has NO pending breakpoint AND NO recorded breakpoint.
 * Anything that could need the owner's attention (>0 tasks, a pending or
 * recorded breakpoint, or any needs-you signal) is EXCLUDED here so it can
 * never be hidden by this feature.
 */
export function isIdleSession(run: LightRun): boolean {
  const pid = run.processId ?? "";
  if (pid !== "" && pid !== "bare-run") return false;
  if ((run.totalTasks ?? 0) > 0) return false;
  // Alarm-safety: a recorded-but-unresumed or pending breakpoint — or the
  // waiting-at-a-breakpoint fallback — keeps the run out of the idle set.
  if (run.recordedAwaitingResume) return false;
  if ((run.pendingBreakpoints ?? 0) > 0) return false;
  if (run.waitingKind === "breakpoint") return false;
  return true;
}

// ---------------------------------------------------------------------------
// Raw overlapping predicates — VERBATIM from filterByStatus / column-model so
// pill semantics never regress. These are the ONLY definitions of each flag.
// ---------------------------------------------------------------------------

/** Non-terminal = still in progress (waiting/pending). */
export function isNonTerminal(run: LightRun): boolean {
  return run.status === "waiting" || run.status === "pending";
}

/**
 * "Needs you": NON-terminal AND an answerable breakpoint — pendingBreakpoints
 * > 0, OR an observer-recorded-but-unresumed breakpoint (§14.5 AC-59, whose
 * pendingBreakpoints has already dropped to 0 on disk), falling back to the
 * waiting-at-a-breakpoint heuristic only for older cached run shapes. This is
 * the FULL-RUN predicate the digest pill/banner lacked (§15.3 GAP-1).
 */
export function isNeedsYou(run: LightRun): boolean {
  if (!isNonTerminal(run)) return false;
  if (run.recordedAwaitingResume) return true;
  if (run.pendingBreakpoints !== undefined) return run.pendingBreakpoints > 0;
  return run.waitingKind === "breakpoint";
}

/**
 * "Orphaned": NON-terminal with no live driver — lock pid dead ("orphaned") OR
 * no lock at all ("none"). Both render as the orphaned chip (DC-3). Overlapping
 * with stale by design (§15.3 GAP-2): a stale non-terminal run with no lock is
 * both.
 */
export function isOrphanedBucket(
  run: LightRun,
  liveness: RunLiveness
): boolean {
  return isNonTerminal(run) && (liveness === "orphaned" || liveness === "none");
}

/** "Stale": the staleness detector flagged the run inactive. */
export function isStaleBucket(run: LightRun): boolean {
  return run.isStale === true;
}

/**
 * Classify one run into its overlapping flags AND its single disjoint column.
 * The disjoint precedence (needsYou → orphaned → working → stale → terminal) is
 * the SAME order as the flat-list rank() and runSortPriority. This is the ONE
 * producer of these flags (§15.6 AC-69).
 */
export function classifyRun(
  run: LightRun,
  options: ClassifyOptions = {}
): RunClassification {
  const liveness = options.livenessOf
    ? options.livenessOf(run)
    : ((run.driver ?? "none") as RunLiveness);

  const hidden = options.hiddenProjects?.has(run.projectName ?? "") === true;
  const terminal = run.status === "completed" || run.status === "failed";
  const needsYou = isNeedsYou(run);
  // §15.1 (AC-86): a scheduled (sleeping) run is its OWN idle-healthy state —
  // neither orphaned/dead nor working. It takes precedence over orphaned/stale/
  // working so a healthy forever-run is never misread (AC-84/85).
  const scheduled = !terminal && liveness === "scheduled" && !needsYou;
  const orphaned = !terminal && isOrphanedBucket(run, liveness) && !needsYou && !scheduled;
  const stale = isStaleBucket(run) && !needsYou && !orphaned && !scheduled;
  const working =
    !terminal &&
    run.isStale !== true &&
    liveness === "live" &&
    !needsYou &&
    !scheduled;
  const live = liveness === "live";
  // SESSIONS-CHIP-SPEC AC1/AC2: idle detection defaults on.
  const idleSession = options.detectIdleSessions !== false && isIdleSession(run);

  // Disjoint column: first match in precedence order. Total (never unassigned):
  // a non-terminal run always matches one of rows 1–5; terminal rows 6–7.
  let column: BoardColumnKey;
  if (needsYou) column = "needsyou";
  else if (scheduled) column = "scheduled";
  else if (isOrphanedBucket(run, liveness) && !terminal) column = "orphaned";
  else if (!terminal && run.isStale !== true) column = "waiting";
  else if (run.isStale === true) column = "stale";
  else if (run.status === "failed") column = "failed";
  else column = "completed";

  return {
    hidden,
    terminal,
    needsYou,
    orphaned,
    working,
    stale,
    live,
    scheduled,
    idleSession,
    column,
  };
}

// ---------------------------------------------------------------------------
// Reconciled counting (§15.4) — the ONE producer of every surface's numbers.
// ---------------------------------------------------------------------------

/** The pill/tile statuses every surface can display. */
export type PillStatus =
  | "all"
  | "waiting"
  | "needsyou"
  | "orphaned"
  | "stale"
  | "completed"
  | "failed";

/** §15.4: every count declares its scope; never implicit (AC-76). */
export type CountScope = "visible" | "all";

/**
 * Reconciled breakdown of ONE pill's count. The displayed pill/tile/banner
 * number is `pill`; the board renders `column` (+ `fromHidden` surfaced in the
 * host column for needs-you). The invariant holds BY CONSTRUCTION — the four
 * addends partition the pill's in-scope matching set:
 *
 *     pill === column + underNeedsYou + fromHidden + hiddenCollapsed
 */
export interface ReconciledCount {
  /** The number the pill/tile/banner displays. */
  pill: number;
  /** Visible runs rendered in this status's OWN host column (not absorbed). */
  column: number;
  /** Visible runs absorbed UP into the Needs-you column by precedence (AC-72). */
  underNeedsYou: number;
  /** Hidden-project runs SURFACED on the board (needs-you today; AC-71). */
  fromHidden: number;
  /** Hidden-project runs NOT surfaced (wave-2 candidates; 0 for visible-scope). */
  hiddenCollapsed: number;
  /**
   * SESSIONS-CHIP-SPEC AC5: idle-session (bare/0-task) runs disclosed on this
   * pill rather than silently dropped. Non-zero only on the grand-total (`all`)
   * pill, whose total keeps the idle sessions the status columns shed; every
   * status pill sheds them (0 here) so the flood leaves the columns. This is
   * the sanctioned extension of the §15.4 invariant:
   *   pill === column + underNeedsYou + fromHidden + hiddenCollapsed + sessionCollapsed
   */
  sessionCollapsed: number;
  /** The scope this count was taken over (AC-76). */
  scope: CountScope;
}

/**
 * The reconciled counts for every pill PLUS the top-level `sessions` chip count
 * (SESSIONS-CHIP-SPEC AC3): the exact idle-session count, equal to the `all`
 * pill's `sessionCollapsed` addend.
 */
export type ReconciledCounts = Record<PillStatus, ReconciledCount> & {
  /** SESSIONS-CHIP-SPEC AC3: the muted "⚡ N sessions" chip number. */
  sessions: number;
};

interface PillSpec {
  predicate: (run: LightRun, liveness: RunLiveness) => boolean;
  scope: CountScope;
  /** The disjoint column a matching run "belongs" to when it is NOT absorbed. */
  hostColumn: BoardColumnKey | null;
}

/**
 * Pill definitions — predicate + scope + host column. Scopes are §15.4-exact:
 * needs-you counts over ALL projects (hidden approvals must still alarm),
 * every other pill over VISIBLE projects only. `all` has no host column (it is
 * the grand total).
 */
const PILL_SPECS: Record<PillStatus, PillSpec> = {
  all: { predicate: () => true, scope: "visible", hostColumn: null },
  waiting: {
    // §15.1: a scheduled (sleeping) run is non-terminal + non-stale but is NOT
    // "working" (AC-86) — exclude it from the Working pill so it never inflates
    // in-progress counts.
    predicate: (r, l) => isNonTerminal(r) && r.isStale !== true && l !== "scheduled",
    scope: "visible",
    hostColumn: "waiting",
  },
  needsyou: {
    predicate: (r) => isNeedsYou(r),
    scope: "all",
    hostColumn: "needsyou",
  },
  orphaned: {
    predicate: (r, l) => isOrphanedBucket(r, l),
    scope: "visible",
    hostColumn: "orphaned",
  },
  stale: {
    predicate: (r) => isStaleBucket(r),
    scope: "visible",
    hostColumn: "stale",
  },
  completed: {
    predicate: (r) => r.status === "completed",
    scope: "visible",
    hostColumn: "completed",
  },
  failed: {
    predicate: (r) => r.status === "failed",
    scope: "visible",
    hostColumn: "failed",
  },
};

/**
 * Compute the reconciled count for every pill from ONE classifier pass over the
 * full-run list. For each pill the in-scope matching runs are partitioned into
 * four disjoint bins so `pill === column + underNeedsYou + fromHidden +
 * hiddenCollapsed` is guaranteed, never asserted after the fact (§15.6 AC-70,
 * AC-73, AC-76).
 */
export function computeReconciledCounts(
  runs: LightRun[],
  options: ClassifyOptions = {}
): ReconciledCounts {
  // Classify every run ONCE — the single producer for all downstream tallies.
  const classified = runs.map((run) => ({
    run,
    c: classifyRun(run, options),
  }));

  const result = {} as ReconciledCounts;

  for (const status of Object.keys(PILL_SPECS) as PillStatus[]) {
    const spec = PILL_SPECS[status];
    const liveness = (run: LightRun): RunLiveness =>
      options.livenessOf
        ? options.livenessOf(run)
        : ((run.driver ?? "none") as RunLiveness);

    let column = 0;
    let underNeedsYou = 0;
    let fromHidden = 0;
    let hiddenCollapsed = 0;
    let sessionCollapsed = 0;

    for (const { run, c } of classified) {
      if (!spec.predicate(run, liveness(run))) continue;

      if (c.idleSession) {
        // SESSIONS-CHIP-SPEC AC2/AC5: idle sessions never flood a status pill
        // or board column. They are disclosed ONLY in the grand-total (`all`)
        // pill, so `all` keeps them in its total while every status pill sheds
        // them (their addends stay 0).
        //   - VISIBLE idle sessions → `sessionCollapsed` (the chip's top-level
        //     `sessions` count mirrors exactly this set — AC3).
        //   - HIDDEN idle sessions → `hiddenCollapsed`, so a bare/0-task run in
        //     a registry-hidden project is still DISCLOSED in the `all` total
        //     ("disclosed, never silently dropped"), without polluting the
        //     visible-scope chip/`sessionCollapsed`. The §15.4 invariant holds
        //     either way (both are pill addends).
        if (status === "all") {
          if (c.hidden) hiddenCollapsed += 1;
          else sessionCollapsed += 1;
        }
        continue;
      }

      if (c.hidden) {
        // §15.1 model A (AC-71/75/87): a hidden-project run is SURFACED on the
        // board — counting into this pill's "(N from hidden)" delta — iff this
        // pill's host column is one the board keeps for hidden projects AND the
        // run actually lands there (needsyou approvals, working live, scheduled
        // sleeping). Otherwise it stays collapsed: disclosed for all-scope
        // pills, silently excluded for visible-scope pills (AC-76).
        const surfaced =
          spec.hostColumn !== null &&
          HIDDEN_SURFACED_COLUMNS.has(spec.hostColumn) &&
          c.column === spec.hostColumn;
        if (surfaced) fromHidden += 1;
        else if (spec.scope === "all") hiddenCollapsed += 1;
        // visible-scope, non-surfaced hidden run → excluded entirely.
      } else if (status !== "needsyou" && c.column === "needsyou") {
        // Visible run absorbed UP into Needs-you by precedence (AC-72).
        underNeedsYou += 1;
      } else {
        column += 1;
      }
    }

    const pill = column + underNeedsYou + fromHidden + hiddenCollapsed + sessionCollapsed;
    result[status] = {
      pill,
      column,
      underNeedsYou,
      fromHidden,
      hiddenCollapsed,
      sessionCollapsed,
      scope: spec.scope,
    };
  }

  // SESSIONS-CHIP-SPEC AC3: the chip number = the disclosed idle-session set
  // (visible scope), identical to the `all` pill's sessionCollapsed addend.
  result.sessions = classified.filter(
    ({ c }) => c.idleSession && !c.hidden
  ).length;

  return result;
}

/**
 * KPI-tile / banner metrics derived from the SAME reconciled source (so the
 * tiles cannot diverge from the pills). Each tile shows the pill total for its
 * status; the banner reuses the same numbers.
 */
export interface ReconciledMetrics {
  totalRuns: number;
  activeRuns: number;
  staleRuns: number;
  completedRuns: number;
  failedRuns: number;
  pendingBreakpoints: number;
  /** SESSIONS-CHIP-SPEC AC3: idle-session (bare/0-task) count — the chip N. */
  idleSessions: number;
}

export function metricsFromReconciled(
  counts: ReconciledCounts
): ReconciledMetrics {
  return {
    totalRuns: counts.all.pill,
    activeRuns: counts.waiting.pill,
    staleRuns: counts.stale.pill,
    completedRuns: counts.completed.pill,
    failedRuns: counts.failed.pill,
    pendingBreakpoints: counts.needsyou.pill,
    idleSessions: counts.sessions,
  };
}
