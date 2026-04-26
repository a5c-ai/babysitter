"use client";
import Link from "next/link";
import { LogoWordmark } from "@a5c-ai/compendium";
import { useRunDashboard } from "@/hooks/use-run-dashboard";
import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";
import { BreakpointBanner } from "@/components/dashboard/breakpoint-banner";
import { BacklogOverview } from "@/components/dashboard/backlog-overview";
import { BabysitterOverlayPanel } from "@/components/dashboard/babysitter-overlay-panel";
import { CatchUpBanner } from "@/components/dashboard/catch-up-banner";
import { ExecutiveSummaryBanner } from "@/components/dashboard/executive-summary-banner";
import { Button } from "@/components/ui/button";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { RunFilterBar } from "@/components/dashboard/run-filter-bar";
import { ProjectListView } from "@/components/dashboard/project-list-view";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { GlobalSearch } from "@/components/dashboard/global-search";

export default function DashboardPage() {
  const { isAuthenticated } = useGatewayAuth();
  const {
    projects,
    loading,
    error,
    metrics,
    allBreakpointRuns,
    summaryMetrics,
    bannerFingerprint,
    bannerDismissed,
    filterCounts,
    filteredProjects,
    activeProjects,
    historyProjects,
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

  const showBanners = !loading && !error && projects.length > 0;

  return (
    <div className="bg-gradient-brand flex-1">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
        <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <article className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Unified surface</p>
            <div className="mt-2">
              <LogoWordmark className="h-6 w-auto" />
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Board-first orchestration with issue and workspace ownership
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
              `packages/kanban` is the shell for planning work on a board, dispatching it through
              first-class issues, and executing it inside explicit workspaces. Babysitter runs,
              sessions, and approvals remain visible as execution overlays rather than replacing the
              core kanban model.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="primary">
                <Link href="/sessions/new">Start session</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/workspaces">Open workspaces</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/automations">Manage automations</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sessions">Browse sessions</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/inbox">Open inbox</Link>
              </Button>
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-card p-6 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Gateway</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {isAuthenticated ? "agent-mux connected" : "agent-mux disconnected"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">
              {isAuthenticated
                ? "Live sessions and workspace attention are available now."
                : "Connect a gateway token to enable session creation, chat continuation, and live workspace context from the same app."}
            </p>
            <div className="mt-5">
              <Button asChild variant="outline">
                <Link href={isAuthenticated ? "/sessions" : "/login"}>
                  {isAuthenticated ? "Open sessions" : "Connect gateway"}
                </Link>
              </Button>
            </div>
          </article>
        </section>

        {/* <BacklogOverview /> */}
        <BabysitterOverlayPanel />

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

        {/* Global Breakpoint Banner — pinned with sticky positioning */}
        {!loading && !error && allBreakpointRuns.length > 0 && (
          <ErrorBoundary section="Breakpoint Banner">
            <div className="sticky top-0 z-40">
              <BreakpointBanner breakpointRuns={allBreakpointRuns} />
            </div>
          </ErrorBoundary>
        )}

        {/* Filter pills + sort toggle */}
        <RunFilterBar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          filterCounts={filterCounts}
          sortMode={sortMode}
          onSortModeToggle={() => setSortMode((prev) => prev === "status" ? "activity" : "status")}
          filteredProjectCount={filteredProjects.length}
        />

        {/* Project cards content */}
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
      </div>
    </div>
  );
}
