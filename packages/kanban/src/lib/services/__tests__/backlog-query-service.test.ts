import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { BacklogQueryService } from "../backlog-query-service";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("BacklogQueryService", () => {
  it("returns a seeded backlog summary and links matching run summaries", async () => {
    const service = new BacklogQueryService({
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [
            {
              projectName: "kanban",
              totalRuns: 4,
              activeRuns: 2,
              completedRuns: 1,
              failedRuns: 1,
              staleRuns: 0,
              totalTasks: 12,
              completedTasksAggregate: 8,
              latestUpdate: "2026-04-24T00:00:00.000Z",
              pendingBreakpoints: 0,
              breakpointRuns: [],
            },
          ],
        }),
      } as never,
    });

    const overview = await service.getOverview();

    expect(overview.summary.projectCount).toBe(1);
    expect(overview.summary.issueCount).toBeGreaterThanOrEqual(7);
    expect(overview.summary.needsDecompositionCount).toBeGreaterThanOrEqual(1);
    expect(overview.snapshot.projects[0]?.linkedRunSummary?.activeRuns).toBe(2);
    expect(overview.board.projects[0]?.columns.find((column) => column.id === "todo")?.issueCount).toBeGreaterThan(0);
    expect(overview.snapshot.issues.find((issue) => issue.key === "KANBAN-DEBT-003")).toMatchObject({
      childIssueIds: ["KANBAN-GAP-001", "KANBAN-GAP-002", "KANBAN-GAP-003"],
    });
    expect(
      overview.snapshot.issues.find((issue) => issue.key === "KANBAN-GAP-001")?.childIssueIds,
    ).toHaveLength(4);
  });

  it("persists workflow moves through the backlog file", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = new BacklogQueryService({
      backlogFilePath,
      now: () => "2026-04-24T12:00:00.000Z",
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
    });

    const overview = await service.moveIssue({
      issueId: "KANBAN-GAP-001-A",
      toState: "in-progress",
    });

    expect(
      overview.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-001-A")?.status,
    ).toBe("in-progress");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ id: string; status: string }>;
    };
    expect(persisted.issues.find((issue) => issue.id === "KANBAN-GAP-001-A")?.status).toBe(
      "in-progress",
    );
  });

  it("rejects moves that violate board policy", async () => {
    const service = new BacklogQueryService({
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
    });

    await expect(
      service.moveIssue({
        issueId: "KANBAN-GAP-002",
        toState: "in-progress",
      }),
    ).rejects.toMatchObject({ code: "KANBAN_POLICY_VIOLATION", status: 409 });
  });
});
