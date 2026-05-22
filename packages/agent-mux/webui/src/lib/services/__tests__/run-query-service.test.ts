import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Run, ProjectSummary } from "@/types";
import type { ObserverConfig, WatchSource } from "@/lib/config-loader";
import type { DiscoveredRun } from "@/lib/source-discovery";
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

  it("filters by task title", () => {
    const runs = [
      makeRun({
        runId: "r1",
        tasks: [
          {
            effectId: "e1", kind: "node", title: "Deploy service",
            label: "deploy", status: "resolved", invocationKey: "k1",
            stepId: "s1", taskId: "t1", requestedAt: "2024-01-15T10:00:00Z",
          },
        ],
      }),
      makeRun({ runId: "r2", tasks: [] }),
    ];
    const result = filterBySearch(runs, "Deploy");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("r1");
  });

  it("filters by task error message", () => {
    const runs = [
      makeRun({
        runId: "r1",
        tasks: [
          {
            effectId: "e1", kind: "node", title: "step1",
            label: "step1", status: "error", invocationKey: "k1",
            stepId: "s1", taskId: "t1", requestedAt: "2024-01-15T10:00:00Z",
            error: { name: "TimeoutError", message: "Connection timed out" },
          },
        ],
      }),
      makeRun({ runId: "r2", tasks: [] }),
    ];
    const result = filterBySearch(runs, "timed out");
    expect(result).toHaveLength(1);
    expect(result[0].runId).toBe("r1");
  });

  it("filters by task error name", () => {
    const runs = [
      makeRun({
        runId: "r1",
        tasks: [
          {
            effectId: "e1", kind: "node", title: "step1",
            label: "step1", status: "error", invocationKey: "k1",
            stepId: "s1", taskId: "t1", requestedAt: "2024-01-15T10:00:00Z",
            error: { name: "TimeoutError", message: "Connection timed out" },
          },
        ],
      }),
    ];
    const result = filterBySearch(runs, "timeouterror");
    expect(result).toHaveLength(1);
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
  it("strips events and adds totalEvents count", () => {
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
    expect(light[0].events).toEqual([]);
    expect(light[0].totalEvents).toBe(2);
  });

  it("preserves all other run fields", () => {
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

    it("filters out hidden projects", async () => {
      (deps.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeConfig({ hiddenProjects: ["secret"] })
      );
      (deps.getProjectSummaries as ReturnType<typeof vi.fn>).mockReturnValue([
        makeSummary({ projectName: "visible" }),
        makeSummary({ projectName: "secret" }),
      ]);

      const result = await service.listProjects();

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].projectName).toBe("visible");
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

      expect(result.runs[0].events).toEqual([]);
      expect(result.runs[0].totalEvents).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // listAllRuns
  // -----------------------------------------------------------------------
  describe("listAllRuns", () => {
    it("returns all runs from all projects", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj-a"),
        makeDiscoveredRun("/runs/r2", "proj-b"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeRun({ runId: "r1", projectName: "proj-a" });
          return makeRun({ runId: "r2", projectName: "proj-b" });
        }
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "", status: "", sort: "status",
      });

      expect(result.runs).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.project).toBeUndefined();
    });

    it("applies search filter", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj-a"),
        makeDiscoveredRun("/runs/r2", "proj-b"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeRun({ runId: "deploy-001" });
          return makeRun({ runId: "test-002" });
        }
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "test", status: "", sort: "status",
      });

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0].runId).toBe("test-002");
    });

    it("applies sort in activity mode", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
        makeDiscoveredRun("/runs/r2", "proj"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1")
            return makeRun({ runId: "old", updatedAt: "2024-01-01T00:00:00Z" });
          return makeRun({ runId: "new", updatedAt: "2024-01-15T00:00:00Z" });
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

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockImplementation(
        async (runDir: string) => {
          if (runDir === "/runs/r1") return makeRun({ runId: "r1", updatedAt: "2024-01-01T00:00:00Z" });
          if (runDir === "/runs/r2") return makeRun({ runId: "r2", updatedAt: "2024-01-10T00:00:00Z" });
          return makeRun({ runId: "r3", updatedAt: "2024-01-15T00:00:00Z" });
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

    it("strips events from runs in response", async () => {
      (deps.discoverAllRunDirs as ReturnType<typeof vi.fn>).mockResolvedValue([
        makeDiscoveredRun("/runs/r1", "proj"),
      ]);

      (deps.getRunCached as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeRun({
          runId: "r1",
          events: [
            { seq: 1, id: "e1", ts: "2024-01-15T10:00:00Z", type: "RUN_CREATED", payload: {} },
          ],
        })
      );

      const result = await service.listAllRuns({
        limit: 0, offset: 0, search: "", status: "", sort: "status",
      });

      expect(result.runs[0].events).toEqual([]);
      expect(result.runs[0].totalEvents).toBe(1);
    });
  });
});
