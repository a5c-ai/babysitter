"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSmartPolling } from "@/hooks/use-smart-polling";
import { EmptyState } from "@/components/shared/empty-state";
import { KanbanColumn, COLUMN_SPECS } from "@/components/kanban/kanban-column";
import {
  useBoardKeyboard,
  type BoardColumnRuns,
} from "@/components/kanban/use-board-keyboard";
import {
  GROUP_HOST,
  GROUP_ORDER,
  groupColumns,
  partitionRuns,
  stalledOverflowTooltip,
  workingOverflowTooltip,
  type BoardColumnKey,
  type BoardGroupKey,
  type BoardGroups,
} from "@/components/kanban/column-model";
import { computeReconciledCounts } from "@/lib/counting/run-classification";
import { SessionsChip } from "@/components/kanban/sessions-chip";
import type { RunsListResponse } from "@/lib/services/run-query-service";

/**
 * Kanban board view — SPEC-vibekanban §4 (data flow), §7 (empty/overflow),
 * §8 (keyboard navigation, live region), amended by UX-R2 §13.2b (owner gate
 * 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W: 4-column taxonomy + color map).
 *
 * ONE query, client partition: fetches /api/runs once (all-runs mode),
 * partitions client-side with partitionRuns (the UNCHANGED six-bucket
 * disjointness invariant), then groups the buckets into the four display
 * columns with groupColumns — a pure presentation layer. Live updates reuse
 * useSmartPolling with the same sseFilter as RunList (SSE-triggered refetch;
 * no new stream endpoints).
 *
 * Read-only presentation of run state (contract LAW): this component fetches
 * with GET only and never mutates anything.
 */

/** §4: single all-runs query — status="", sort=status, limit=500, offset=0. */
const BOARD_FETCH_LIMIT = 500;

/** §8: column-count announcements are debounced to avoid SSE chatter. */
const LIVE_REGION_DEBOUNCE_MS = 5_000;

/**
 * Columns that auto-hide when empty (§13.6 amended AC-12, extended by §15.1):
 * Stalled and Scheduled — Needs you / Working / Done are always visible. The
 * Scheduled column only appears when a sleeping forever-run exists, so it never
 * adds noise to the common case.
 */
const AUTO_HIDE_WHEN_EMPTY: ReadonlySet<BoardGroupKey> = new Set([
  "stalled",
  "scheduled",
]);

/** The visible columns for the grouped board: GROUP_ORDER minus auto-hidden. */
function visibleColumnKeys(groups: BoardGroups): BoardGroupKey[] {
  return GROUP_ORDER.filter(
    (key) => !(AUTO_HIDE_WHEN_EMPTY.has(key) && groups[key].length === 0)
  );
}

/**
 * §8 polite live region: announce column-count changes ("Needs you: 3 runs"),
 * debounced ≥5s so SSE chatter never floods AT. The breakpoint banner keeps
 * its existing assertive alert role — this is deliberately the board's ONLY
 * live region, and it is polite.
 */
function useColumnCountAnnouncement(groups: BoardGroups): string {
  const [announcement, setAnnouncement] = useState("");
  const lastCountsRef = useRef<Record<BoardGroupKey, number> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string>("");

  const counts = useMemo(() => {
    const next = {} as Record<BoardGroupKey, number>;
    for (const key of GROUP_ORDER) next[key] = groups[key].length;
    return next;
  }, [groups]);

  useEffect(() => {
    const last = lastCountsRef.current;
    if (last === null) {
      // First data: establish the baseline silently — the initial render is
      // not a "change" worth interrupting the screen reader for.
      lastCountsRef.current = counts;
      return;
    }
    const changed = GROUP_ORDER.filter((key) => counts[key] !== last[key]);
    lastCountsRef.current = counts;
    if (changed.length === 0) return;

    pendingRef.current = changed
      .map((key) => {
        const n = counts[key];
        return `${COLUMN_SPECS[key].label}: ${n} run${n === 1 ? "" : "s"}`;
      })
      .join(". ");

    // Debounce: at most one announcement per window; later changes within the
    // window collapse into the latest pending message.
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setAnnouncement(pendingRef.current);
    }, LIVE_REGION_DEBOUNCE_MS);
  }, [counts]);

  // Clear any pending timer on unmount.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return announcement;
}

export interface KanbanBoardProps {
  /** Registry-hidden project names (§6.3): excluded from every column except Needs-you. */
  hiddenProjects?: Set<string>;
  /** When true, suppress SSE-triggered refetches (catch-up mode, §4). */
  suppressSseRefetch?: boolean;
  /**
   * §6.2 pill → column focus: pills keep the six buckets; the focused bucket's
   * HOST column (§13.2b: orphaned/stale → Stalled, failed/completed → Done)
   * gets a highlight ring and is scrolled into view; the others dim.
   * null/undefined = no focus ("All").
   */
  focusColumnKey?: BoardColumnKey | null;
  /**
   * §7 fetch-window tails: invoked by a column's "View all in list →" row to
   * switch to list view with a status filter matching that column pre-applied.
   */
  onViewAllInList?: (key: BoardGroupKey) => void;
}

export function KanbanBoard({
  hiddenProjects,
  suppressSseRefetch,
  focusColumnKey = null,
  onViewAllInList,
}: KanbanBoardProps) {
  const params = new URLSearchParams({
    status: "",
    sort: "status",
    limit: String(BOARD_FETCH_LIMIT),
    offset: "0",
    search: "",
  });
  const url = `/api/runs?${params.toString()}`;

  // Same sseFilter as RunList: refetch on run updates and new runs (§4).
  const sseFilter = (event: { type: string }) =>
    event.type === "update" || event.type === "new-run";
  const { data, loading, error } = useSmartPolling<RunsListResponse>(url, {
    sseFilter,
    suppressSseRefetch,
  });

  const runs = useMemo(() => data?.runs ?? [], [data]);

  // SESSIONS-CHIP-SPEC AC3/AC4: the idle-session (bare/0-task) count comes from
  // the SINGLE counting source (§15.4), and a reveal toggle un-hides them.
  const sessionsCount = useMemo(
    () => computeReconciledCounts(runs, { hiddenProjects }).sessions,
    [runs, hiddenProjects]
  );
  const [sessionsRevealed, setSessionsRevealed] = useState(false);

  const partition = useMemo(
    // AC2: idle sessions are excluded from every column by default; when the
    // chip toggle reveals them, they re-enter their natural columns.
    () =>
      partitionRuns(runs, hiddenProjects, {
        detectIdleSessions: !sessionsRevealed,
      }),
    [runs, hiddenProjects, sessionsRevealed]
  );
  // §13.2b display grouping over the unchanged six-bucket partition.
  const groups = useMemo(() => groupColumns(partition), [partition]);
  const visibleKeys = useMemo(() => visibleColumnKeys(groups), [groups]);

  // §6.2 pill → column focus, remapped to the bucket's host column (§13.6
  // amended AC-23: failed/completed pills focus Done; orphaned/stale, Stalled).
  const focusGroupKey: BoardGroupKey | null = focusColumnKey
    ? GROUP_HOST[focusColumnKey]
    : null;

  // §8 roving tabindex: the keyboard hook navigates the VISIBLE columns in
  // rendered order (auto-hidden columns are skipped, matching the DOM).
  const keyboardColumns = useMemo<BoardColumnRuns[]>(
    () =>
      visibleKeys.map((key) => ({
        key,
        runIds: groups[key].map((run) => run.runId),
      })),
    [visibleKeys, groups]
  );
  const keyboard = useBoardKeyboard(keyboardColumns);

  // §8 polite live region (debounced column-count announcements).
  const announcement = useColumnCountAnnouncement(groups);

  if (loading && !data) {
    return (
      // Loading: per-column skeleton cards (pattern from RunList).
      // a11y-loading-not-announced: expose the fetching state to AT.
      // Deliberately NOT the kanban-board testid: the frozen e2e contract
      // treats a visible board as fully-rendered columns, never skeletons.
      <div
        className="flex gap-3"
        data-testid="kanban-board-loading"
        aria-busy="true"
      >
        <span role="status" className="sr-only">
          Loading runs
        </span>
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="flex flex-col gap-2 min-w-[280px] w-[280px]">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="h-20 rounded-md border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      // Error: reuse the run-list-error treatment full-width (§7 — board hidden).
      <div
        data-testid="kanban-board-error"
        className="rounded-lg border border-error/20 bg-error-muted p-4 text-sm text-error"
      >
        Failed to load runs: {error}
      </div>
    );
  }

  if (runs.length === 0) {
    // Empty board (§7): the shared EmptyState full-width, same as list view.
    return (
      <div data-testid="empty-state">
        <EmptyState />
      </div>
    );
  }

  // §3.4 count honesty, re-targeted per §13.6 amended AC-10: stalled-bucket
  // runs absorbed by Needs-you precedence are disclosed on the Stalled host
  // when it is visible, else on the always-visible Needs-you column itself.
  const stalledTooltip = stalledOverflowTooltip(partition);
  const stalledTooltipHost: BoardGroupKey | null = stalledTooltip
    ? ((["stalled", "needsyou"] as BoardGroupKey[]).find((key) =>
        visibleKeys.includes(key)
      ) ?? null)
    : null;

  // §13.5/AC-47 count honesty for Working: breakpoint runs the waiting pill
  // counts render under Needs-you — the Working header discloses where the
  // difference went (same mechanism as the Stalled absorbed-into tooltip).
  const workingTooltip = workingOverflowTooltip(partition);

  // SESSIONS-CHIP-SPEC AC5 / §15.4 (owner decision 2026-07-09): the Working
  // header count is the plain DISJOINT rendered-card count (waiting-lane cards)
  // in ALL cases — the same rule every other column uses. A needs-you run stays
  // solely in the Needs-you column (needsYou precedence) and never also counts
  // into Working. Excluding idle sessions from the waiting lane makes the
  // Working count drop by exactly the idle count naturally, with no special
  // gated branch. Read-only presentation only.

  // §7 fetch-window: the API window is capped at 500 — when more runs exist,
  // say so instead of silently truncating (count-honesty, F1 lesson).
  const totalCount = data?.totalCount ?? runs.length;
  const fetchWindowTruncated = totalCount > BOARD_FETCH_LIMIT;

  return (
    <div>
      {/* §8: ONE polite live region at board level for column-count changes
          (debounced ≥5s). Never assertive — the breakpoint banner owns alarm. */}
      <div
        data-testid="kanban-live-region"
        aria-live="polite"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* SESSIONS-CHIP-SPEC AC3/AC4: the single muted idle-session chip + reveal
          toggle. Rendered only when idle sessions exist (no chip, no noise). */}
      {sessionsCount > 0 && (
        <div className="mb-2 flex items-center">
          <SessionsChip
            count={sessionsCount}
            revealed={sessionsRevealed}
            onToggle={() => setSessionsRevealed((prev) => !prev)}
          />
        </div>
      )}

      {/* §7 fetch-window notice: board-level, under the filter bar. */}
      {fetchWindowTruncated && (
        <p
          data-testid="kanban-fetch-window-notice"
          className="mb-2 rounded-md border border-border bg-background-secondary px-3 py-1.5 text-xs text-foreground-muted"
        >
          Showing the {BOARD_FETCH_LIMIT} most relevant runs. Open List view
          for everything
        </p>
      )}

      {/* §7 horizontal overflow: the board scrolls inside its own container on
          narrow viewports — never the page body. §8: region + accessible name. */}
      <div
        data-testid="kanban-board"
        role="region"
        aria-label="Run board"
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {/* §13.6 amended AC-12 auto-hide: the Stalled column leaves the DOM
            when empty; Needs you / Working / Done always render. */}
        {visibleKeys.map((key) => (
          <KanbanColumn
            key={key}
            columnKey={key}
            runs={groups[key]}
            countTooltip={
              key === "waiting"
                ? workingTooltip
                : key === stalledTooltipHost
                  ? stalledTooltip
                  : undefined
            }
            focused={focusGroupKey === key}
            dimmed={focusGroupKey !== null && focusGroupKey !== key}
            keyboard={keyboard}
            onViewAllInList={
              // §7: with a truncated fetch window every column may be missing
              // runs — each gets the "View all in list →" tail.
              fetchWindowTruncated && onViewAllInList
                ? () => onViewAllInList(key)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
