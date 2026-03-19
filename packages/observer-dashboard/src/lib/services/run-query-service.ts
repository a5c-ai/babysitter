import { getConfig as defaultGetConfig } from "@/lib/config-loader";
import { discoverAllRunDirs as defaultDiscoverAllRunDirs } from "@/lib/source-discovery";
import {
  getProjectSummaries as defaultGetProjectSummaries,
  getRunCached as defaultGetRunCached,
  discoverAndCacheAll as defaultDiscoverAndCacheAll,
} from "@/lib/run-cache";
import type { Run, ProjectSummary } from "@/types";
import type { ObserverConfig, WatchSource } from "@/lib/config-loader";
import type { DiscoveredRun } from "@/lib/source-discovery";

// ---------------------------------------------------------------------------
// Query parameter types
// ---------------------------------------------------------------------------

export type SortMode = "status" | "activity";

export interface RunQueryParams {
  limit: number;
  offset: number;
  search: string;
  status: string;
  sort: SortMode;
}

export type ProjectsQueryParams = Record<string, never>;

export interface ProjectRunsQueryParams extends RunQueryParams {
  project: string;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/** A run with events stripped to reduce payload size. */
export interface LightRun extends Omit<Run, "events"> {
  events: never[];
  totalEvents: number;
}

export interface ProjectsResponse {
  projects: ProjectSummary[];
  recentCompletionWindowMs: number;
}

export interface RunsListResponse {
  runs: LightRun[];
  totalCount: number;
  project?: string;
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

/**
 * Returns a numeric sort priority for a run:
 *   0 = Active non-stale (waiting/pending where !isStale)
 *   1 = Stale runs (isStale === true)
 *   2 = Failed runs
 *   3 = Completed runs
 */
export function runSortPriority(run: Run): number {
  const isActive = run.status === "waiting" || run.status === "pending";
  if (isActive && !run.isStale) return 0;
  if (run.isStale) return 1;
  if (run.status === "failed") return 2;
  return 3;
}

/** Sort runs in-place based on the chosen sort mode.
 *
 * Uses runId as a final tiebreaker to guarantee deterministic ordering
 * even when multiple runs share the same priority and updatedAt timestamp.
 * This prevents list items from visually jumping positions during rapid
 * updates (the "morning chaos" scenario).
 */
export function sortRuns(runs: Run[], sort: SortMode): void {
  if (sort === "activity") {
    // Simple updatedAt DESC -- most recent activity first, no tier grouping.
    // runId tiebreaker ensures stable order for runs with identical timestamps.
    runs.sort((a, b) => {
      const cmp = (b.updatedAt || "").localeCompare(a.updatedAt || "");
      if (cmp !== 0) return cmp;
      return a.runId.localeCompare(b.runId);
    });
  } else {
    // Default: sort by priority tier, then by updatedAt DESC within tier,
    // with runId as a final tiebreaker for deterministic ordering.
    runs.sort((a, b) => {
      const pa = runSortPriority(a);
      const pb = runSortPriority(b);
      if (pa !== pb) return pa - pb;
      const cmp = (b.updatedAt || "").localeCompare(a.updatedAt || "");
      if (cmp !== 0) return cmp;
      return a.runId.localeCompare(b.runId);
    });
  }
}

/** Apply search filter -- returns a new array. */
export function filterBySearch(runs: Run[], search: string): Run[] {
  if (!search) return runs;
  const searchLower = search.toLowerCase();
  return runs.filter(
    (r) =>
      r.runId.toLowerCase().includes(searchLower) ||
      r.processId.toLowerCase().includes(searchLower) ||
      (r.projectName || "").toLowerCase().includes(searchLower) ||
      r.status.toLowerCase().includes(searchLower) ||
      r.tasks.some(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.label.toLowerCase().includes(searchLower) ||
          (t.error?.message || "").toLowerCase().includes(searchLower) ||
          (t.error?.name || "").toLowerCase().includes(searchLower)
      )
  );
}

/** Apply status filter -- returns a new array. */
export function filterByStatus(runs: Run[], status: string): Run[] {
  if (!status) return runs;
  return runs.filter((r) => {
    if (status === "waiting") return r.status === "waiting" || r.status === "pending";
    return r.status === status;
  });
}

/** Apply retention filter -- keeps active/stale runs regardless of age. */
export function filterByRetention(runs: Run[], retentionDays: number): Run[] {
  const retentionCutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  return runs.filter((r) => {
    const isActive = r.status === "waiting" || r.status === "pending" || r.isStale;
    if (isActive) return true;
    return new Date(r.updatedAt || "").getTime() >= retentionCutoff;
  });
}

/** Paginate an array: returns a new slice. */
export function paginate<T>(items: T[], offset: number, limit: number): T[] {
  if (limit > 0) {
    return items.slice(offset, offset + limit);
  }
  return items;
}

/** Strip events from runs to reduce payload. */
export function toLightRuns(runs: Run[]): LightRun[] {
  return runs.map(({ events, ...rest }) => ({
    ...rest,
    events: [] as never[],
    totalEvents: events.length,
  }));
}

// ---------------------------------------------------------------------------
// Dependency injection interface
// ---------------------------------------------------------------------------

export interface RunQueryDeps {
  getConfig: () => Promise<ObserverConfig>;
  discoverAllRunDirs: () => Promise<DiscoveredRun[]>;
  getProjectSummaries: () => ProjectSummary[];
  getRunCached: (runDir: string, source: WatchSource, projectName: string) => Promise<Run>;
  discoverAndCacheAll: () => Promise<void>;
}

const defaultDeps: RunQueryDeps = {
  getConfig: defaultGetConfig,
  discoverAllRunDirs: defaultDiscoverAllRunDirs,
  getProjectSummaries: defaultGetProjectSummaries,
  getRunCached: defaultGetRunCached,
  discoverAndCacheAll: defaultDiscoverAndCacheAll,
};

// ---------------------------------------------------------------------------
// RunQueryService
// ---------------------------------------------------------------------------

export class RunQueryService {
  private deps: RunQueryDeps;

  constructor(deps?: Partial<RunQueryDeps>) {
    this.deps = { ...defaultDeps, ...deps };
  }

  /**
   * Mode: "projects" -- return lightweight project summaries.
   * Always re-discovers to ensure all projects appear (debounced internally).
   */
  async listProjects(_params?: ProjectsQueryParams): Promise<ProjectsResponse> {
    await this.deps.discoverAndCacheAll();
    const config = await this.deps.getConfig();
    const projects = this.deps.getProjectSummaries();

    // Filter out hidden projects
    const hiddenSet = new Set(config.hiddenProjects);
    const visibleProjects = projects.filter((p) => !hiddenSet.has(p.projectName));

    // Apply retention filter: exclude projects whose latest update is older than retentionDays
    const retentionCutoff = Date.now() - config.retentionDays * 24 * 60 * 60 * 1000;
    const retainedProjects = visibleProjects.filter(
      (p) =>
        // Always keep projects with active or stale runs regardless of age
        p.activeRuns > 0 ||
        p.staleRuns > 0 ||
        new Date(p.latestUpdate).getTime() >= retentionCutoff
    );

    // Sort projects: active runs first, then by latest update, with
    // projectName tiebreaker for deterministic ordering during rapid updates.
    retainedProjects.sort((a, b) => {
      if (a.activeRuns > 0 && b.activeRuns === 0) return -1;
      if (a.activeRuns === 0 && b.activeRuns > 0) return 1;
      const cmp = b.latestUpdate.localeCompare(a.latestUpdate);
      if (cmp !== 0) return cmp;
      return a.projectName.localeCompare(b.projectName);
    });

    return {
      projects: retainedProjects,
      recentCompletionWindowMs: config.recentCompletionWindowMs,
    };
  }

  /**
   * Mode: "project" -- return paginated runs for a specific project.
   */
  async listProjectRuns(params: ProjectRunsQueryParams): Promise<RunsListResponse> {
    const { project, sort, status, search, limit, offset } = params;
    const config = await this.deps.getConfig();
    const allRuns = await this.deps.discoverAllRunDirs();

    // Use cached runs for better performance
    const runs = await Promise.all(
      allRuns
        .filter((r) => r.projectName === project)
        .map(async ({ runDir, source, projectName }) => {
          return await this.deps.getRunCached(runDir, source, projectName);
        })
    );

    // Apply retention, sort, status filter, search, paginate
    let filtered = filterByRetention(runs, config.retentionDays);
    sortRuns(filtered, sort);
    filtered = filterByStatus(filtered, status);
    filtered = filterBySearch(filtered, search);

    const totalCount = filtered.length;
    const page = paginate(filtered, offset, limit);

    return {
      runs: toLightRuns(page),
      totalCount,
      project,
    };
  }

  /**
   * Default mode -- return all runs with totalCount.
   */
  async listAllRuns(params: RunQueryParams): Promise<RunsListResponse> {
    const { sort, search, limit, offset } = params;
    const allRuns = await this.deps.discoverAllRunDirs();

    const runs = await Promise.all(
      allRuns.map(async ({ runDir, source, projectName }) => {
        return await this.deps.getRunCached(runDir, source, projectName);
      })
    );

    // Sort, search, paginate (no retention filter on "all runs" -- matches original)
    sortRuns(runs, sort);
    let filtered = filterBySearch(runs, search);

    const totalCount = filtered.length;
    filtered = paginate(filtered, offset, limit);

    return {
      runs: toLightRuns(filtered),
      totalCount,
    };
  }
}
