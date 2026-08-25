"use client";
import { useCallback, useMemo } from "react";
import { useRunDashboard, type DashboardStatusFilter } from "@/hooks/use-run-dashboard";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { CatchUpBanner } from "@/components/dashboard/catch-up-banner";
import { ExecutiveSummaryBanner } from "@/components/dashboard/executive-summary-banner";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { RunFilterBar } from "@/components/dashboard/run-filter-bar";
import { ProjectListView } from "@/components/dashboard/project-list-view";
import { RunList } from "@/components/dashboard/run-list";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { BoardColumnKey, BoardGroupKey } from "@/components/kanban/column-model";
import { ViewToggle, type DashboardView } from "@/components/kanban/view-toggle";

/** Status-pill values that map onto board columns (§6.2). Pills keep the six
 * buckets; the board maps each bucket to its HOST display column (§13.2b —
 * owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W). */
const BOARD_COLUMN_KEYS: ReadonlySet<string> = new Set([
  "needsyou",
  "orphaned",
  "waiting",
  "stale",
  "failed",
  "completed",
]);

/**
 * §7 fetch-window tails, per display column (§13.2b): the flat list filters by
 * the six BUCKETS, so grouped columns open on their dominant bucket — Stalled
 * → orphaned, Done → completed (the pills alongside refine to stale/failed).
 */
const TAIL_LIST_FILTER: Record<BoardGroupKey, DashboardStatusFilter> = {
  needsyou: "needsyou",
  waiting: "waiting",
  // §15.1: no dedicated "scheduled" list filter/pill — open the full list.
  scheduled: "all",
  stalled: "orphaned",
  done: "completed",
};

export default function DashboardPage() {
  const {
    projects,
    loading,
    error,
    metrics,
    summaryMetrics,
    bannerFingerprint,
    bannerDismissed,
    filterCounts,
    reconciledCounts,
    filteredProjects,
    activeProjects,
    historyProjects,
    hiddenProjectCount,
    statusFilter,
    sortMode,
    historyCollapsed,
    cardStatusFilter,
    hasStaleRuns,
    catchUp,
    setStatusFilter,
    setSortMode,
    setHistoryCollapsed,
    setDismissedFingerprint,
    toggleMetricFilter,
    handleHideProject,
  } = useRunDashboard();

  // Board/list view (SPEC-vibekanban §6.1): persisted per browser, board default.
  const [view, setView] = usePersistedState<DashboardView>(
    "observer:dashboard-view",
    "board"
  );

  // §6.3 grid parity: registry-hidden project names — the board excludes their
  // runs from every column except the Needs-you alarm surface.
  const hiddenProjectNames = useMemo(
    () => new Set(projects.filter((p) => p.hidden).map((p) => p.projectName)),
    [projects]
  );

  // §6.2: in board view a status pill does not swap to a flat list — it
  // FOCUSES the matching column. Clicking the already-active pill (or "All")
  // clears the focus. List mode keeps today's filter behavior untouched.
  const focusColumnKey: BoardColumnKey | null =
    view === "board" && BOARD_COLUMN_KEYS.has(statusFilter)
      ? (statusFilter as BoardColumnKey)
      : null;
  const handleStatusFilterChange = useCallback(
    (value: DashboardStatusFilter) => {
      if (view === "board" && value !== "all" && value === statusFilter) {
        setStatusFilter("all");
        return;
      }
      setStatusFilter(value);
    },
    [view, statusFilter, setStatusFilter]
  );

  // §7 fetch-window tails: "View all in list →" switches to list view with a
  // status filter matching that display column (dominant bucket for grouped
  // columns — §13.2b).
  const handleViewAllInList = useCallback(
    (key: BoardGroupKey) => {
      setStatusFilter(TAIL_LIST_FILTER[key]);
      setView("list");
    },
    [setStatusFilter, setView]
  );

  const showBanners = !loading && !error && projects.length > 0;

  return (
    <div className="bg-gradient-brand flex-1">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Global Search */}
        <GlobalSearch />

        {/* Executive Summary Banner */}
        {showBanners && (
          <ErrorBoundary section="Executive Summary">
            <ExecutiveSummaryBanner
              metrics={summaryMetrics}
              onFilterChange={setStatusFilter}
              dismissed={bannerDismissed}
              onDismiss={() => setDismissedFingerprint(bannerFingerprint)}
            />
          </ErrorBoundary>
        )}

        {/* KPI Metrics Row */}
        {showBanners && (
          <ErrorBoundary section="KPI Metrics">
            <KpiGrid
              metrics={metrics}
              statusFilter={statusFilter}
              hasStaleRuns={hasStaleRuns}
              onToggleFilter={toggleMetricFilter}
            />
          </ErrorBoundary>
        )}

        {/* Catch-up mode banner — shown when burst of SSE updates detected */}
        {catchUp.active && (
          <CatchUpBanner
            catchUp={catchUp}
            summary={{
              failedRuns: summaryMetrics.failedRuns,
              completedRuns: summaryMetrics.completedRuns,
              pendingBreakpoints: summaryMetrics.pendingBreakpoints,
            }}
          />
        )}

        {/* owner 2026-07-07: deduped needs-you surface — the redundant top
            inform-only list (BreakpointBanner) was removed. Pending approvals,
            including from hidden projects, remain surfaced by the counts banner
            above (ExecutiveSummaryBanner: "N approvals need your attention" →
            needs-you filter) and by the kanban Needs-you column, which is now
            the single place to record an answer. */}

        {/* Filter pills + sort toggle */}
        <RunFilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          filterCounts={filterCounts}
          reconciledCounts={reconciledCounts}
          sortMode={sortMode}
          onSortModeToggle={() => setSortMode((prev) => prev === "status" ? "activity" : "status")}
          filteredProjectCount={filteredProjects.length}
          hiddenProjectCount={hiddenProjectCount}
          viewToggle={<ViewToggle view={view} onViewChange={setView} />}
          boardView={view === "board"}
        />

        {/* Content: board view (default), or the unchanged list view —
            project grid for "all", flat filtered run list otherwise */}
        {view === "board" ? (
          <ErrorBoundary section="Run Board">
            <KanbanBoard
              hiddenProjects={hiddenProjectNames}
              suppressSseRefetch={catchUp.active}
              focusColumnKey={focusColumnKey}
              onViewAllInList={handleViewAllInList}
            />
          </ErrorBoundary>
        ) : statusFilter === "all" ? (
          <ProjectListView
            loading={loading}
            error={error}
            filteredProjects={filteredProjects}
            activeProjects={activeProjects}
            historyProjects={historyProjects}
            statusFilter={statusFilter}
            sortMode={sortMode}
            cardStatusFilter={cardStatusFilter}
            historyCollapsed={historyCollapsed}
            onHistoryCollapsedChange={setHistoryCollapsed}
            onHideProject={handleHideProject}
          />
        ) : (
          <ErrorBoundary section="Run List">
            <RunList status={statusFilter} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
