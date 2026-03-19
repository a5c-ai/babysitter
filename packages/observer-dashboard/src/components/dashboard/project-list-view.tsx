"use client";
import {
  FolderOpen,
  Activity,
  Eye,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { ProjectHealthCard } from "./project-health-card";
import type { ProjectSummary, RunStatus } from "@/types";
import type { DashboardSortMode, DashboardStatusFilter } from "@/hooks/use-run-dashboard";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-foreground-muted/20" />
            <div className="h-4 w-32 rounded bg-foreground-muted/10" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-foreground-muted/10 mb-3" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-16 rounded-full bg-foreground-muted/10" />
            <div className="h-5 w-16 rounded-full bg-foreground-muted/10" />
            <div className="h-3 w-12 rounded bg-foreground-muted/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error banner
// ---------------------------------------------------------------------------

function ErrorBanner({ error }: { error: string }) {
  return (
    <div data-testid="error-banner" className="rounded-lg border border-error/20 bg-error-muted p-4 text-sm text-error">
      Failed to load projects: {error}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state (no projects matching filter)
// ---------------------------------------------------------------------------

function NoProjectsState() {
  return (
    <div data-testid="empty-state" className="text-center py-16">
      <FolderOpen className="h-10 w-10 text-foreground-muted/30 mx-auto mb-3" />
      <p className="text-sm text-foreground-muted mb-1">No projects found</p>
      <p className="text-xs text-foreground-muted/60">
        Configure watch sources in{" "}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))}
          className="text-primary hover:underline"
        >
          Settings
        </button>{" "}
        or edit <span className="font-mono">~/.a5c/observer.json</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Idle empty state (no active and no history runs)
// ---------------------------------------------------------------------------

function IdleEmptyState() {
  return (
    <div data-testid="idle-empty-state" className="text-center py-16">
      <Eye className="h-10 w-10 text-foreground-muted/30 mx-auto mb-3" />
      <p className="text-sm text-foreground-muted mb-1">All quiet — no active orchestration runs</p>
      <p className="text-xs text-foreground-muted/60">
        Runs will appear here when babysitter processes are started
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProjectListView (public)
// ---------------------------------------------------------------------------

export interface ProjectListViewProps {
  loading: boolean;
  error: string | null | undefined;
  filteredProjects: ProjectSummary[];
  activeProjects: ProjectSummary[];
  historyProjects: ProjectSummary[];
  statusFilter: DashboardStatusFilter;
  sortMode: DashboardSortMode;
  cardStatusFilter: RunStatus | "all";
  historyCollapsed: boolean;
  onHistoryCollapsedChange: (value: boolean | ((prev: boolean) => boolean)) => void;
  onHideProject?: (projectName: string) => void;
}

export function ProjectListView({
  loading,
  error,
  filteredProjects,
  activeProjects,
  historyProjects,
  statusFilter,
  sortMode,
  cardStatusFilter,
  historyCollapsed,
  onHistoryCollapsedChange,
  onHideProject,
}: ProjectListViewProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorBanner error={error} />;
  }

  if (filteredProjects.length === 0) {
    return <NoProjectsState />;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Idle empty state: no active and no history runs at all */}
      {activeProjects.length === 0 && historyProjects.length === 0 && (
        <IdleEmptyState />
      )}

      {/* Idle with history: no active/recent runs but has history */}
      {activeProjects.length === 0 && historyProjects.length > 0 && (statusFilter === "all" || statusFilter === "stale") && (
        <div data-testid="idle-with-history-banner" className="flex items-center gap-2 px-3 py-2 rounded-md bg-background-secondary/50 border border-border w-fit">
          <Activity className="h-3.5 w-3.5 text-foreground-muted/50" />
          <span className="text-xs text-foreground-muted">
            {sortMode === "activity" ? "No activity in the last 24 hours" : "No runs in progress"}
          </span>
        </div>
      )}

      {/* Active / Recent section */}
      {activeProjects.length > 0 && (statusFilter === "all" || statusFilter === "stale" || statusFilter === "waiting") && (
        <ErrorBoundary section="Active Runs">
          <section data-testid="active-runs-section">
            <div className="flex items-center gap-2 mb-3">
              {sortMode === "activity" ? (
                <Clock className="h-4 w-4 text-primary" />
              ) : (
                <Activity className="h-4 w-4 text-warning animate-pulse-dot" />
              )}
              <h2 className="text-sm font-semibold text-foreground">
                {sortMode === "activity" ? "Recent Activity" : "In Progress"}
              </h2>
              <span className={cn(
                "rounded-full px-2 py-px text-xs font-semibold tabular-nums",
                sortMode === "activity"
                  ? "bg-primary/10 border border-primary/20 text-primary"
                  : "bg-warning/10 border border-warning/20 text-warning"
              )}>
                {activeProjects.length}
              </span>
            </div>
            <div data-testid="project-grid-active" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {activeProjects.map((project) => (
                <ProjectHealthCard
                  key={project.projectName}
                  project={project}
                  statusFilter={cardStatusFilter}
                  sortMode={sortMode}
                  onHide={onHideProject}
                />
              ))}
            </div>
          </section>
        </ErrorBoundary>
      )}

      {/* When filter is "completed" or "failed", show filteredProjects directly without sectioning */}
      {(statusFilter === "completed" || statusFilter === "failed") && (
        <ErrorBoundary section="Filtered Results">
          <div data-testid="project-grid-filtered" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredProjects.map((project) => (
              <ProjectHealthCard
                key={project.projectName}
                project={project}
                statusFilter={cardStatusFilter}
                sortMode={sortMode}
              />
            ))}
          </div>
        </ErrorBoundary>
      )}

      {/* History / Earlier section */}
      {historyProjects.length > 0 && (statusFilter === "all" || statusFilter === "stale") && (
        <ErrorBoundary section="Recent History">
          <section data-testid="recent-history-section">
            <button
              onClick={() => onHistoryCollapsedChange((v) => !v)}
              className="flex items-center gap-2 mb-3 group w-fit"
            >
              <History className="h-4 w-4 text-foreground-muted/70" />
              <h2 className="text-sm font-semibold text-foreground-muted group-hover:text-foreground-secondary transition-colors">
                {sortMode === "activity" ? "Earlier" : "Recent History"}
              </h2>
              <span className="rounded-full bg-background-secondary border border-border px-2 py-px text-xs font-semibold text-foreground-muted tabular-nums">
                {historyProjects.length}
              </span>
              {historyCollapsed ? (
                <ChevronDown className="h-3.5 w-3.5 text-foreground-muted/60 group-hover:text-foreground-muted transition-colors" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 text-foreground-muted/60 group-hover:text-foreground-muted transition-colors" />
              )}
            </button>
            {!historyCollapsed && (
              <div className="opacity-70">
                <div data-testid="project-grid-history" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {historyProjects.map((project) => (
                    <ProjectHealthCard
                      key={project.projectName}
                      project={project}
                      statusFilter={cardStatusFilter}
                      sortMode={sortMode}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </ErrorBoundary>
      )}
    </div>
  );
}
