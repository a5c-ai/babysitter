import type { Run, ProjectSummary } from "@/types";
import type { KanbanConfig, WatchSource } from "@/lib/config-loader";
import type { DiscoveredRun } from "@/lib/source-discovery";
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
/**
 * Returns a numeric sort priority for a run:
 *   0 = Active non-stale (waiting/pending where !isStale)
 *   1 = Stale runs (isStale === true)
 *   2 = Failed runs
 *   3 = Completed runs
 */
export declare function runSortPriority(run: Run): number;
/** Sort runs in-place based on the chosen sort mode.
 *
 * Uses runId as a final tiebreaker to guarantee deterministic ordering
 * even when multiple runs share the same priority and updatedAt timestamp.
 * This prevents list items from visually jumping positions during rapid
 * updates (the "morning chaos" scenario).
 */
export declare function sortRuns(runs: Run[], sort: SortMode): void;
/** Apply search filter -- returns a new array. */
export declare function filterBySearch(runs: Run[], search: string): Run[];
/** Apply status filter -- returns a new array. */
export declare function filterByStatus(runs: Run[], status: string): Run[];
/** Apply retention filter -- keeps active/stale runs regardless of age. */
export declare function filterByRetention(runs: Run[], retentionDays: number): Run[];
/** Paginate an array: returns a new slice. */
export declare function paginate<T>(items: T[], offset: number, limit: number): T[];
/** Strip events from runs to reduce payload. */
export declare function toLightRuns(runs: Run[]): LightRun[];
export interface RunQueryDeps {
    getConfig: () => Promise<KanbanConfig>;
    discoverAllRunDirs: () => Promise<DiscoveredRun[]>;
    getProjectSummaries: () => ProjectSummary[];
    getRunCached: (runDir: string, source: WatchSource, projectName: string) => Promise<Run>;
    discoverAndCacheAll: () => Promise<void>;
}
export declare class RunQueryService {
    private deps;
    constructor(deps?: Partial<RunQueryDeps>);
    /**
     * Mode: "projects" -- return lightweight project summaries.
     * Always re-discovers to ensure all projects appear (debounced internally).
     */
    listProjects(_params?: ProjectsQueryParams): Promise<ProjectsResponse>;
    /**
     * Mode: "project" -- return paginated runs for a specific project.
     */
    listProjectRuns(params: ProjectRunsQueryParams): Promise<RunsListResponse>;
    /**
     * Default mode -- return all runs with totalCount.
     */
    listAllRuns(params: RunQueryParams): Promise<RunsListResponse>;
}
