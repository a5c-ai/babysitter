"use client";

import Link from "next/link";
import { LogoWordmark } from "@a5c-ai/compendium";

import { useRunDashboard } from "@/hooks/use-run-dashboard";
import { useGatewayAuth } from "@/components/agent-mux/gateway-provider";
import { BreakpointBanner } from "@/components/dashboard/breakpoint-banner";
import { CatchUpBanner } from "@/components/dashboard/catch-up-banner";
import { ExecutiveSummaryBanner } from "@/components/dashboard/executive-summary-banner";
import { Button } from "@/components/ui/button";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { RunFilterBar } from "@/components/dashboard/run-filter-bar";
import { ProjectListView } from "@/components/dashboard/project-list-view";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { BabysitterOverlayPanel } from "@/components/dashboard/babysitter-overlay-panel";
import { PageHeroGrid, PageSection, PageShell } from "@/components/shared/page-shell";

export default function RunsDashboardPage() {
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
    <PageShell>
      <PageHeroGrid>
        <PageSection>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Execution overlays</p>
          <div className="mt-2">
            <LogoWordmark className="h-6 w-auto" />
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Runs stay visible without replacing the planning workspace
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
            The project board now owns the main journey. This route keeps Babysitter runs,
            approvals, search, and status triage available as an execution dashboard.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="primary">
              <Link href="/projects">Open projects</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sessions/new">Start session</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/workspaces">Open workspaces</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/inbox">Open inbox</Link>
            </Button>
          </div>
        </PageSection>

        <PageSection>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Gateway</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {isAuthenticated ? "agent-mux connected" : "agent-mux disconnected"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            {isAuthenticated
              ? "Live sessions and workspace attention are available now."
              : "Connect the gateway to enable session creation, chat continuation, and live workspace context from the same app."}
          </p>
          <div className="mt-5">
            <Button asChild variant="outline">
              <Link href={isAuthenticated ? "/sessions" : "/login"}>
                {isAuthenticated ? "Open sessions" : "Connect gateway"}
              </Link>
            </Button>
          </div>
        </PageSection>
      </PageHeroGrid>

      <BabysitterOverlayPanel />
      <GlobalSearch />

      {showBanners ? (
        <ErrorBoundary section="Executive Summary">
          <ExecutiveSummaryBanner
            metrics={summaryMetrics}
            onFilterChange={setStatusFilter}
            dismissed={bannerDismissed}
            onDismiss={() => setDismissedFingerprint(bannerFingerprint)}
          />
        </ErrorBoundary>
      ) : null}

      {showBanners ? (
        <ErrorBoundary section="KPI Metrics">
          <KpiGrid
            metrics={metrics}
            statusFilter={statusFilter}
            hasStaleRuns={hasStaleRuns}
            onToggleFilter={toggleMetricFilter}
          />
        </ErrorBoundary>
      ) : null}

      {catchUp.active ? (
        <CatchUpBanner
          catchUp={catchUp}
          summary={{
            failedRuns: summaryMetrics.failedRuns,
            completedRuns: summaryMetrics.completedRuns,
            pendingBreakpoints: summaryMetrics.pendingBreakpoints,
          }}
        />
      ) : null}

      {!loading && !error && allBreakpointRuns.length > 0 ? (
        <ErrorBoundary section="Breakpoint Banner">
          <div className="sticky top-0 z-40">
            <BreakpointBanner breakpointRuns={allBreakpointRuns} />
          </div>
        </ErrorBoundary>
      ) : null}

      <RunFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filterCounts={filterCounts}
        sortMode={sortMode}
        onSortModeToggle={() => setSortMode((prev) => (prev === "status" ? "activity" : "status"))}
        filteredProjectCount={filteredProjects.length}
      />

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
    </PageShell>
  );
}
