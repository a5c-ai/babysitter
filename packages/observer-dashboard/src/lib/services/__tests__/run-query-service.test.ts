import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Run, ProjectSummary } from "@/types";
import type { ObserverConfig, WatchSource } from "@/lib/config-loader";
import type { DiscoveredRun } from "@/lib/source-discovery";
import type { CachedRunDigest } from "@/lib/run-cache";
import {
  RunQueryService,
  runSortPriority,
  sortRuns,
  filterBySearch,
  filterByStatus,
  filterByRetention,
  paginate,
  toLightRuns,
  type RunQueryDeps,
} from "../run-query-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultSource: WatchSource = { path: "/projects", depth: 2, label: "test" };

// Use dates within the 30-day retention window (relative to "now")
const RECENT_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
const RECENT_DATE_PLUS = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000).toISOString();

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    runId: "run-001",
    processId: "data-pipeline",
    status: "completed",
    createdAt: RECENT_DATE,
    updatedAt: RECENT_DATE_PLUS,
    tasks: [],
    events: [
      { seq: 1, id: "e1", ts: RECENT_DATE, type: "RUN_CREATED", payload: {} },
    ],
    totalTasks: 3,
    completedTasks: 3,
    failedTasks: 0,
    duration: 5000,
    ...overrides,
  };
}

/** A light cached digest — what listAllRuns now reads (getDigestCached). */
function makeDigest(overrides: Partial<CachedRunDigest> = {}): CachedRunDigest {
  return {
    runId: "run-001",
    processId: "data-pipeline",
    status: "completed",
    latestSeq: 2,
    taskCount: 3,
    completedTasks: 3,
    updatedAt: RECENT_DATE_PLUS,
    sourceLabel: "test",
    ...overrides,
  };
}

function makeDiscoveredRun(
  runDir: string,
  projectName: string,
  source: WatchSource = defaultSource
): DiscoveredRun {
  return { runDir, source, projectName, projectPath: `/projects/${projectName}` };
}

function makeConfig(overrides: Partial<ObserverConfig> = {}): ObserverConfig {
  return {
    sources: [defaultSource],
    port: 4800,
    pollInterval: 2000,
    theme: "dark",
    staleThresholdMs: 3600000,
    recentCompletionWindowMs: 14400000,
    retentionDays: 30,
    hiddenProjects: [],
    ...overrides,
  };
}

function makeSummary(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    projectName: "my-project",
    totalRuns: 5,
    activeRuns: 1,
    completedRuns: 3,
    failedRuns: 1,
    staleRuns: 0,
    totalTasks: 20,
    completedTasksAggregate: 18,
    latestUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    pendingBreakpoints: 0,
    orphanedRuns: 0,
    breakpointRuns: [],
    ...overrides,
  };
}

function makeMockDeps(overrides: Partial<RunQueryDeps> = {}): RunQueryDeps {
  return {
    getConfig: vi.fn().mockResolvedValue(makeConfig()),
    discoverAllRunDirs: vi.fn().mockResolvedValue([]),
    getProjectSummaries: vi.fn().mockReturnValue([]),
    getRunCached: vi.fn().mockResolvedValue(makeRun()),
    getDigestCached: vi.fn().mockResolvedValue(makeDigest()),
    discoverAndCacheAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Utility function tests
// ---------------------------------------------------------------------------

describe("runSortPriority", () => {
  it("returns 0 for active non-stale waiting runs", () => {
    expect(runSortPriority(makeRun({ status: "waiting", isStale: false }))).toBe(0);
  });

  it("returns 0 for active non-stale pending runs", () => {
    expect(runSortPriority(makeRun({ status: "pending", isStale: false }))).toBe(0);
  });

  it("returns 1 for stale runs regardless of status", () => {
    expect(runSortPriority(makeRun({ status: "waiting", isStale: true }))).toBe(1);
    expect(runSortPriority(makeRun({ status: "completed", isStale: true }))).toBe(1);
  });

  it("returns 2 for failed runs", () => {
    expect(runSortPriority(makeRun({ status: "failed" }))).toBe(2);
  });

  it("returns 3 for completed runs", () => {
    expect(runSortPriority(makeRun({ status: "completed" }))).toBe(3);
  });
});

describe("sortRuns", () => {
  it("sorts by status priority then updatedAt DESC in 'status' mode", () => {
    const runs = [
      makeRun({ runId: "completed-old", status: "completed", updatedAt: "2024-01-01T00:00:00Z" }),
      makeRun({ runId: "active", status: "waiting", updatedAt: "2024-01-10T00:00:00Z" }),
      makeRun({ runId: "failed", status: "failed", updatedAt: "2024-01-05T00:00:00Z" }),
      makeRun({ runId: "completed-new", status: "completed", updatedAt: "2024-01-15T00:00:00Z" }),
    ];

    sortRuns(runs, "status");

    expect(runs.map((r) => r.runId)).toEqual([
      "active",           // priority 0
      "failed",           // priority 2
      "completed-new",    // priority 3, newer
      "completed-old",    // priority 3, older
    ]);
  });

  it("sorts by updatedAt DESC in 'activity' mode", () => {
    const runs = [
      makeRun({ runId: "old", updatedAt: "2024-01-01T00:00:00Z" }),
      makeRun({ runId: "newest", updatedAt: "2024-01-15T00:00:00Z" }),
      makeRun({ runId: "middle", updatedAt: "2024-01-10T00:00:00Z" }),
    ];

    sortRuns(runs, "activity");

    expect(runs.map((r) => r.runId)).toEqual(["newest", "middle", "old"]);
  });

  it("uses runId as tiebreaker in 'status' mode for stable ordering", () => {
    // All runs have same status and same updatedAt — only runId differs
    const runs = [
      makeRun({ runId: "run-charlie", status: "completed", updatedAt: "2024-01-15T00:00:00Z" }),
      makeRun({ runId: "run-alpha", status: "completed", updatedAt: "2024-01-15T00:00:00Z" }),
      makeRun({ runId: "run-bravo", status: "completed", updatedAt: "2024-01-15T00:00:00Z" }),
    ];

    sortRuns(runs, "status");

    // Should be deterministic: runId ascending as tiebreaker
    expect(runs.map((r) => r.runId)).toEqual([
      "run-alpha",
      "run-bravo",
      "run-charlie",
    ]);
  });

  it("uses runId as tiebreaker in 'activity' mode for stable ordering", () => {
    // All runs have same updatedAt — only runId differs
    const runs = [
      makeRun({ runId: "run-zebra", updatedAt: "2024-01-15T00:00:00Z" }),
      makeRun({ runId: "run-alpha", updatedAt: "2024-01-15T00:00:00Z" }),
      makeRun({ runId: "run-mango", updatedAt: "2024-01-15T00:00:00Z" }),
    ];

    sortRuns(runs, "activity");

    // Should be deterministic: runId ascending as tiebreaker
    expect(runs.map((r) => r.runId)).toEqual([
      "run-alpha",
      "run-mango",
      "run-zebra",
    ]);
  });

  it("produces the same order regardless of initial array order", () => {
    const makeRunSet = () => [
      makeRun({ runId: "run-3", status: "completed", updatedAt: "2024-01-10T00:00:00Z" }),
      makeRun({ runId: "run-1", status: "completed", updatedAt: "2024-01-10T00:00:00Z" }),
      makeRun({ runId: "run-2", status: "completed", updatedAt: "2024-01-10T00:00:00Z" }),
    ];

    const set1 = makeRunSet();
    const set2 = makeRunSet().reverse();

    sortRuns(set1, "status");
    sortRuns(set2, "status");

    expect(set1.map((r) => r.runId)).toEqual(set2.map((r) => r.runId));
  });
});

describe("filterBySearch", () => {
  it("returns all runs when search is empty", () => {
    const runs = [makeRun({ runId: "a" }), makeRun({ runId: "b" })];
    expect(filterBySearch(runs, "")).toEqual(runs);
  });

  it("filters by runId (case-insensitive)", () => {
    const runs = [makeRun({ runId: "ABC-123" }), makeRun({ runId: "DEF-456" })];
    const result = filterBySearch(runs, "abc");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("ABC-123");
  });

  it("filters by processId", () => {
    const runs = [
      makeRun({ processId: "data-pipeline" }),
      makeRun({ processId: "web-server" }),
    ];
    const result = filterBySearch(runs, "pipeline");
    expect(result).toHaveLength(1);
    expect(result[0].processId).toBe("data-pipeline");
  });

  it("filters by projectName", () => {
    const runs = [
      makeRun({ projectName: "my-app" }),
      makeRun({ projectName: "other-app" }),
    ];
    const result = filterBySearch(runs, "my-app");
    expect(result).toHaveLength(1);
    expect(result[0].projectName).toBe("my-app");
  });

  it("filters by status", () => {
    const runs = [
      makeRun({ status: "completed" }),
      makeRun({ status: "failed" }),
    ];
    const result = filterBySearch(runs, "failed");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("failed");
  });

  // Search-regression mitigation (perf slimming): the list payload no longer
  // carries tasks[], so per-task title/error search is dropped. The digest
  // fields the list DOES carry stay searchable — including the breakpoint
  // question and the derived failure text.
  it("filters by breakpoint question (digest field)", () => {
    const runs = [
      makeRun({ runId: "r1", breakpointQuestion: "Approve production deploy?" }),
      makeRun({ runId: "r2" }),
    ];
    const result = filterBySearch(runs, "production deploy");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("r1");
  });

  it("filters by failure message / failed step (digest fields)", () => {
    const runs = [
      makeRun({ runId: "r1", failureMessage: "Connection timed out" }),
      makeRun({ runId: "r2", failedStep: "deploy-service" }),
      makeRun({ runId: "r3" }),
    ];
    expect(filterBySearch(runs, "timed out").map((r) => r.runId)).toEqual(["r1"]);
    expect(filterBySearch(runs, "deploy-service").map((r) => r.runId)).toEqual(["r2"]);
  });
});

describe("filterByStatus", () => {
  it("returns all runs when status is empty", () => {
    const runs = [makeRun({ status: "completed" }), makeRun({ status: "failed" })];
    expect(filterByStatus(runs, "")).toEqual(runs);
  });

  it("filters by exact status", () => {
    const runs = [
      makeRun({ runId: "a", status: "completed" }),
      makeRun({ runId: "b", status: "failed" }),
      makeRun({ runId: "c", status: "completed" }),
    ];
    const result = filterByStatus(runs, "failed");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("b");
  });

  it("treats 'waiting' status as including 'pending'", () => {
    const runs = [
      makeRun({ runId: "a", status: "waiting" }),
      makeRun({ runId: "b", status: "pending" }),
      makeRun({ runId: "c", status: "completed" }),
    ];
    const result = filterByStatus(runs, "waiting");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.runId)).toEqual(["a", "b"]);
  });

  it("filters 'needsyou' by pendingBreakpoints count (matches the badge)", () => {
    const runs = [
      makeRun({ runId: "answerable", status: "waiting", waitingKind: "breakpoint", pendingBreakpoints: 1 }),
      // Parked at a breakpoint but already answered (count 0) — must NOT match.
      makeRun({ runId: "answered", status: "waiting", waitingKind: "breakpoint", pendingBreakpoints: 0 }),
      makeRun({ runId: "task", status: "waiting", waitingKind: "task", pendingBreakpoints: 0 }),
      makeRun({ runId: "done", status: "completed", pendingBreakpoints: 0 }),
    ];
    const result = filterByStatus(runs, "needsyou");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("answerable");
  });

  it("filters 'needsyou' via waitingKind fallback when pendingBreakpoints is undefined", () => {
    // Older cached run shapes predate pendingBreakpoints.
    const runs = [
      makeRun({ runId: "bp", status: "waiting", waitingKind: "breakpoint" }),
      makeRun({ runId: "task", status: "waiting", waitingKind: "task" }),
      makeRun({ runId: "done", status: "completed" }),
    ];
    const result = filterByStatus(runs, "needsyou");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("bp");
  });

  it("filters 'orphaned' to non-terminal runs with no live driver (driver 'orphaned' OR 'none')", () => {
    // DC-3: the canonical orphaned predicate is (driver 'orphaned' || 'none') &&
    // non-terminal. Both driver states render as the "orphaned" chip in the UI,
    // so a driverless ('none') waiting run must read as orphaned here too — this
    // deliberately replaces the earlier definition that excluded 'none'.
    const runs = [
      makeRun({ runId: "orphan", status: "waiting", driver: "orphaned" }),
      makeRun({ runId: "live", status: "waiting", driver: "live" }),
      makeRun({ runId: "none", status: "waiting", driver: "none" }),
      // Terminal run with a dead driver must NOT read as orphaned.
      makeRun({ runId: "done-orphan", status: "completed", driver: "orphaned" }),
      // Terminal run with no lock ('none') must NOT read as orphaned either.
      makeRun({ runId: "done-none", status: "completed", driver: "none" }),
    ];
    const result = filterByStatus(runs, "orphaned");
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.runId).sort()).toEqual(["none", "orphan"]);
  });

  it("DC-4: excludes terminal runs with residual pendingBreakpoints from 'needsyou'", () => {
    // The non-terminal guard prevents a completed/failed run that still reports
    // pendingBreakpoints > 0 (stale residual) from leaking into the needs-you list.
    const runs = [
      makeRun({ runId: "waiting-bp", status: "waiting", pendingBreakpoints: 1 }),
      makeRun({ runId: "done-bp", status: "completed", pendingBreakpoints: 1 }),
      makeRun({ runId: "failed-bp", status: "failed", pendingBreakpoints: 2 }),
    ];
    const result = filterByStatus(runs, "needsyou");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("waiting-bp");
  });

  it("waiting-badge-vs-list-mismatch: 'waiting' filter excludes stale runs", () => {
    // The Waiting badge counts non-stale active runs (metrics.activeRuns); stale
    // runs live under the 'stale' filter. The list must agree, so stale runs are
    // excluded here even though they are waiting/pending.
    const runs = [
      makeRun({ runId: "active", status: "waiting", isStale: false }),
      makeRun({ runId: "pending", status: "pending" }),
      makeRun({ runId: "stale", status: "waiting", isStale: true }),
    ];
    const waiting = filterByStatus(runs, "waiting");
    expect(waiting.map((r) => r.runId).sort()).toEqual(["active", "pending"]);
    // The stale run is still reachable under the 'stale' filter (no run is lost).
    const stale = filterByStatus(runs, "stale");
    expect(stale.map((r) => r.runId)).toEqual(["stale"]);
  });

  it("filters 'stale' to runs flagged as stale", () => {
    const runs = [
      makeRun({ runId: "stale", isStale: true }),
      makeRun({ runId: "fresh", isStale: false }),
      makeRun({ runId: "unset" }),
    ];
    const result = filterByStatus(runs, "stale");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("stale");
  });
});

describe("filterByRetention", () => {
  it("keeps active/stale runs regardless of age", () => {
    const runs = [
      makeRun({ runId: "active", status: "waiting", updatedAt: "2020-01-01T00:00:00Z" }),
      makeRun({ runId: "stale", status: "completed", isStale: true, updatedAt: "2020-01-01T00:00:00Z" }),
      makeRun({ runId: "pending", status: "pending", updatedAt: "2020-01-01T00:00:00Z" }),
    ];
    const result = filterByRetention(runs, 30);
    expect(result).toHaveLength(3);
  });

  it("excludes old completed runs beyond retention period", () => {
    const now = Date.now();
    const oldDate = new Date(now - 31 * 24 * 60 * 60 * 1000).toISOString(); // 31 days ago
    const recentDate = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago

    const runs = [
      makeRun({ runId: "old", status: "completed", updatedAt: oldDate }),
      makeRun({ runId: "recent", status: "completed", updatedAt: recentDate }),
    ];
    const result = filterByRetention(runs, 30);
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("recent");
  });
});

describe("paginate", () => {
  it("returns all items when limit is 0", () => {
    const items = [1, 2, 3, 4, 5];
    expect(paginate(items, 0, 0)).toEqual([1, 2, 3, 4, 5]);
  });

  it("applies offset and limit correctly", () => {
    const items = [1, 2, 3, 4, 5];
    expect(paginate(items, 1, 2)).toEqual([2, 3]);
  });

  it("handles offset beyond array length", () => {
    const items = [1, 2, 3];
    expect(paginate(items, 10, 5)).toEqual([]);
  });

  it("handles limit larger than remaining items", () => {
    const items = [1, 2, 3];
    expect(paginate(items, 1, 100)).toEqual([2, 3]);
  });
});

describe("toLightRuns", () => {
  it("drops the events key and exposes totalEvents count", () => {
    const runs = [
      makeRun({
        runId: "r1",
        events: [
          { seq: 1, id: "e1", ts: "2024-01-15T10:00:00Z", type: "RUN_CREATED", payload: {} },
          { seq: 2, id: "e2", ts: "2024-01-15T10:00:01Z", type: "RUN_COMPLETED", payload: {} },
        ],
      }),
    ];

    const light = toLightRuns(runs);

    expect(light).toHaveLength(1);
    expect(light[0].runId).toBe("r1");
    // The heavy events[] array is not carried; only its count.
    expect(light[0]).not.toHaveProperty("events");
    expect(light[0].totalEvents).toBe(2);
  });

  it("preserves all other run fields (grid RunCard needs tasks/duration/session)", () => {
    const run = makeRun({ runId: "r1", processId: "proc", status: "failed" });
    const [light] = toLightRuns([run]);

    expect(light.runId).toBe("r1");
    expect(light.processId).toBe("proc");
    expect(light.status).toBe("failed");
    expect(light.totalTasks).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// RunQueryService (uses dependency injection for reliable testing)
// ---------------------------------------------------------------------------

describe("RunQueryService", () => {
  let deps: RunQueryDeps;
  let service: RunQueryService;

  beforeEach(() => {
    deps = makeMockDeps();
    service = new RunQueryService(deps);
  });

  // -----------------------------------------------------------------------
  // listProjects
  // -----------------------------------------------------------------------
  describe("listProjects", () => {
    it("returns project summaries after discovering all runs", async () => {
      (deps.getProjectSummaries as ReturnType<typeof vi.fn>).mockReturnValue([
        makeSummary({ projectName: "alpha", latestUpdate: "2024-01-15T12:00:00Z" }),
        makeSummary({ projectName: "beta", latestUpdate: "2024-01-15T11:00:00Z" }),
      ]);

      const result = await service.listProjects();

      expect(deps.discoverAndCacheAll).toHaveBeenCalled();
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].projectName).toBe("alpha");
      expect(result.projects[1].projectName).toBe("beta");
      expect(result.recentCompletionWindowMs).toBe(14400000);
    });

    it("annotates hidden projects with hidden:true instead of dropping them (QA F4)", async () => {
      (deps.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConfig({ hiddenProjects: ["secret"] })
      );
      (deps.getProjectSummaries as ReturnType<typeof vi.fn>).mockReturnValue([
        makeSummary({ projectName: "visible", pendingBreakpoints: 0 }),
        makeSummary({ projectName: "secret", pendingBreakpoints: 1 }),
      ]);

      const result = await service.listProjects();

      // Both projects are returned: hiding is a grid concern; the alarm
      // surface (needs-you banner/counts) must still see "secret"'s breakpoint.
      expect(result.projects).toHaveLength(2);
      const visible = result.projects.find((p) => p.projectName === "visible");
      const hidden = result.projects.find((p) => p.projectName === "secret");
      expect(visible?.hidden).toBeUndefined();
      expect(hidden?.hidden).toBe(true);
      expect(hidden?.pendingBreakpoints).toBe(1);
    });

    it("applies retention filter on projects", async () => {
      (deps.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConfig({ retentionDays: 7 })
      );

      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

      (deps.getProjectSummaries as ReturnType<typeof vi.fn>).mockReturnValue([
        makeSummary({ projectName: "old", latestUpdate: oldDate, activeRuns: 0, staleRuns: 0 }),
        makeSummary({ projectName: "recent", latestUpdate: recentDate, activeRuns: 0, staleRuns: 0 }),
      ]);

      const result = await service.listProjects();

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].projectName).toBe("recent");
    });

    it("keeps old projects that still have active runs", async () => {
      (deps.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConfig({ retentionDays: 7 })
      );

      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      (deps.getProjectSummaries as ReturnType<typeof vi.fn>).mockReturnValue([
        makeSummary({ projectName: "old-active", latestUpdate: oldDate, activeRuns: 1, staleRuns: 0 }),
      ]);

      const result = await service.listProjects();
      expect(result.projects).toHaveLength(1);
    });

    it("keeps old projects that have stale runs", async () => {
      (deps.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConfig({ retentionDays: 7 })
      );

      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      (deps.getProjectSummaries as ReturnType<typeof vi.fn>).mockReturnValue([
        makeSummary({ projectName: "stale-proj", latestUpdate: oldDate, activeRuns: 0, staleRuns: 2 }),
      ]);

      const result = await service.listProjects();
      expect(result.projects).toHaveLength(1);
    });

    it("sorts projects: active first, then by latest update", async () => {
      const d3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const d5 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const d10 = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      (deps.getProjectSummaries as ReturnType<typeof vi.fn>).mockReturnValue([
        makeSummary({ projectName: "no-active-newer", activeRuns: 0, latestUpdate: d3 }),
        makeSummary({ projectName: "active", activeRuns: 2, latestUpdate: d10 }),
        makeSummary({ projectName: "no-active-older", activeRuns: 0, latestUpdate: d5 }),
      ]);

      const result = await service.listProjects();

      expect(result.projects.map((p) => p.projectName)).toEqual([
        "active",
        "no-active-newer",
        "no-active-older",
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // listProjectRuns
  // -----------------------------------------------------------------------
  describe("listProjectRuns", () => {
    it("returns runs filtered by project name", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj-a"),
        makeDiscoveredRun("/runs/r2", "proj-b"),
        makeDiscoveredRun("/runs/r3", "proj-a"),
      ]);

      const d1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const d2 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const runA1 = makeRun({ runId: "r1", updatedAt: d1 });
      const runA2 = makeRun({ runId: "r3", updatedAt: d2 });

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return runA1;
          return runA2;
        }
      );

      // Debug: verify the deps are wired to the service
      const directResult = await deps.discoverAllRunDirs();
      console.log("DEBUG direct call:", directResult.length, "items");
      console.log("DEBUG deps === service deps?", deps.discoverAllRunDirs === (service as any).deps.discoverAllRunDirs);
      const cached = await deps.getRunCached("/runs/r1", defaultSource, "proj-a");
      console.log("DEBUG getRunCached direct:", cached?.runId);

      const result = await service.listProjectRuns({
        project: "proj-a",
        limit: 0, offset: 0, search: "", status: "", sort: "status",
      });

      console.log("DEBUG result runs:", result.runs.length, "totalCount:", result.totalCount);

      expect(result.runs).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.project).toBe("proj-a");
    });

    it("applies retention filter", async () => {
      (deps.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConfig({ retentionDays: 7 })
      );

      const now = Date.now();
      const oldDate = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
      const recentDate = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();

      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/old", "proj"),
        makeDiscoveredRun("/runs/recent", "proj"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/old") return makeRun({ runId: "old", status: "completed", updatedAt: oldDate });
          return makeRun({ runId: "recent", status: "completed", updatedAt: recentDate });
        }
      );

      const result = await service.listProjectRuns({
        project: "proj",
        limit: 0, offset: 0, search: "", status: "", sort: "status",
      });

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].runId).toBe("recent");
    });

    it("applies status filter", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
        makeDiscoveredRun("/runs/r2", "proj"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeRun({ runId: "r1", status: "completed" });
          return makeRun({ runId: "r2", status: "failed" });
        }
      );

      const result = await service.listProjectRuns({
        project: "proj",
        limit: 0, offset: 0, search: "", status: "failed", sort: "status",
      });

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].runId).toBe("r2");
    });

    it("applies search filter", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
        makeDiscoveredRun("/runs/r2", "proj"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeRun({ runId: "deploy-001", processId: "deployer" });
          return makeRun({ runId: "test-002", processId: "tester" });
        }
      );

      const result = await service.listProjectRuns({
        project: "proj",
        limit: 0, offset: 0, search: "deploy", status: "", sort: "status",
      });

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].runId).toBe("deploy-001");
    });

    it("applies pagination", async () => {
      const d1 = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const d2 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const d3 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
        makeDiscoveredRun("/runs/r2", "proj"),
        makeDiscoveredRun("/runs/r3", "proj"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeRun({ runId: "r1", updatedAt: d1 });
          if (runDir === "/runs/r2") return makeRun({ runId: "r2", updatedAt: d2 });
          return makeRun({ runId: "r3", updatedAt: d3 });
        }
      );

      const result = await service.listProjectRuns({
        project: "proj",
        limit: 1, offset: 1, search: "", status: "", sort: "activity",
      });

      // Sorted by activity: r3, r2, r1 => offset 1 + limit 1 => [r2]
      expect(result.totalCount).toBe(3);
      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].runId).toBe("r2");
    });

    it("strips events from runs in response", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeRun({
          runId: "r1",
          events: [
            { seq: 1, id: "e1", ts: RECENT_DATE, type: "RUN_CREATED", payload: {} },
            { seq: 2, id: "e2", ts: RECENT_DATE_PLUS, type: "RUN_COMPLETED", payload: {} },
          ],
        })
      );

      const result = await service.listProjectRuns({
        project: "proj",
        limit: 0, offset: 0, search: "", status: "", sort: "status",
      });

      expect(result.runs[0]).not.toHaveProperty("events");
      expect(result.runs[0].totalEvents).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // listAllRuns
  // -----------------------------------------------------------------------
  describe("listAllRuns", () => {
    it("returns all runs from all projects (served from digests)", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj-a"),
        makeDiscoveredRun("/runs/r2", "proj-b"),
      ]);

      (deps.getDigestCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeDigest({ runId: "r1", projectName: "proj-a" });
          return makeDigest({ runId: "r2", projectName: "proj-b" });
        }
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "", status: "", sort: "status",
      });

      expect(result.runs).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.project).toBeUndefined();
      // The full-run reader must NOT be used on the default list path.
      expect(deps.getRunCached).not.toHaveBeenCalled();
    });

    it("applies search filter", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj-a"),
        makeDiscoveredRun("/runs/r2", "proj-b"),
      ]);

      (deps.getDigestCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeDigest({ runId: "deploy-001" });
          return makeDigest({ runId: "test-002" });
        }
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "test", status: "", sort: "status",
      });

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].runId).toBe("test-002");
    });

    it("applies status filter (regression: listAllRuns must honor status)", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj-a"),
        makeDiscoveredRun("/runs/r2", "proj-b"),
      ]);

      (deps.getDigestCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeDigest({ runId: "r1", status: "completed" });
          return makeDigest({ runId: "r2", status: "failed" });
        }
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "", status: "failed", sort: "status",
      });

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].runId).toBe("r2");
    });

    it("applies sort in activity mode", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
        makeDiscoveredRun("/runs/r2", "proj"),
      ]);

      (deps.getDigestCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1")
            return makeDigest({ runId: "old", updatedAt: "2024-01-01T00:00:00Z" });
          return makeDigest({ runId: "new", updatedAt: "2024-01-15T00:00:00Z" });
        }
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "", status: "", sort: "activity",
      });

      expect(result.runs[0].runId).toBe("new");
      expect(result.runs[1].runId).toBe("old");
    });

    it("applies pagination", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
        makeDiscoveredRun("/runs/r2", "proj"),
        makeDiscoveredRun("/runs/r3", "proj"),
      ]);

      (deps.getDigestCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeDigest({ runId: "r1", updatedAt: "2024-01-01T00:00:00Z" });
          if (runDir === "/runs/r2") return makeDigest({ runId: "r2", updatedAt: "2024-01-10T00:00:00Z" });
          return makeDigest({ runId: "r3", updatedAt: "2024-01-15T00:00:00Z" });
        }
      );

      const result = await service.listAllRuns({
        limit: 2, offset: 0, search: "", status: "", sort: "activity",
      });

      expect(result.totalCount).toBe(3);
      expect(result.runs).toHaveLength(2);
      expect(result.runs[0].runId).toBe("r3");
      expect(result.runs[1].runId).toBe("r2");
    });

    it("returns digest cards with card-name aliases and no tasks/events keys", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
      ]);

      (deps.getDigestCached as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeDigest({ runId: "r1", latestSeq: 7, taskCount: 4, completedTasks: 2 })
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "", status: "", sort: "status",
      });

      const [card] = result.runs;
      expect(card).not.toHaveProperty("events");
      expect(card).not.toHaveProperty("tasks");
      // Server-side aliases keep kanban-card.tsx / run-list.tsx unchanged.
      expect(card.totalEvents).toBe(7); // <- latestSeq
      expect(card.totalTasks).toBe(4); // <- taskCount
      expect(card.completedTasks).toBe(2);
    });

    // -------------------------------------------------------------------------
    // GUARDRAIL (perf): the default /api/runs list must stay slim. If anyone
    // re-wires it back to full runs (tasks[]/events[]) this fails loudly on
    // BOTH the no-heavy-keys assertion and the byte budget.
    // -------------------------------------------------------------------------
    it("payload guardrail: 500-run response has no tasks/events keys and stays < 3MB", async () => {
      const RUN_COUNT = 500;
      // A fat, realistic-ish question/failure string per run — even so, digests
      // are tiny. Full runs (with per-task prompt/stack) would blow the budget.
      const fatText = "x".repeat(1500);

      const discovered = Array.from({ length: RUN_COUNT }, (_, i) =>
        makeDiscoveredRun(`/runs/run-${i}`, `proj-${i % 20}`)
      );
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue(discovered);
      (deps.getDigestCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          const i = Number(runDir.split("-").pop());
          return makeDigest({
            runId: `01RUN${String(i).padStart(19, "0")}`,
            status: i % 3 === 0 ? "waiting" : "completed",
            taskCount: 40,
            completedTasks: 20,
            latestSeq: 120,
            breakpointQuestion: fatText,
            failureMessage: fatText,
          });
        }
      );

      const result = await service.listAllRuns({
        limit: RUN_COUNT, offset: 0, search: "", status: "", sort: "status",
      });

      expect(result.runs).toHaveLength(RUN_COUNT);
      // (a) NO heavy keys on any returned run.
      for (const run of result.runs) {
        expect(run).not.toHaveProperty("tasks");
        expect(run).not.toHaveProperty("events");
      }
      // (b) hard byte budget.
      const bytes = Buffer.byteLength(JSON.stringify(result));
      expect(bytes).toBeLessThan(3 * 1024 * 1024);
    });
  });
});
