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
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T00:00:00.000Z",
          artifacts: [
            {
              id: "review-1",
              targetType: "issue",
              targetId: "KANBAN-GAP-004",
              targetLabel: "KANBAN-GAP-004",
              title: "Review diff workflow primitives",
              decision: "pending",
              queueState: "queued",
              updatedAt: "2026-04-24T00:00:00.000Z",
              diff: [],
              comments: [],
            },
          ],
          queue: [],
          summary: {
            total: 1,
            issueCount: 1,
            workspaceCount: 0,
            pendingCount: 1,
            changesRequestedCount: 0,
            approvedCount: 0,
            openCommentCount: 0,
          },
        }),
      } as never,
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
    expect(overview.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-004")?.review?.decision).toBe("pending");
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
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T12:00:00.000Z",
          artifacts: [],
          queue: [],
          summary: {
            total: 0,
            issueCount: 0,
            workspaceCount: 0,
            pendingCount: 0,
            changesRequestedCount: 0,
            approvedCount: 0,
            openCommentCount: 0,
          },
        }),
      } as never,
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

  it("creates canonical issues through the shared backlog model", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = new BacklogQueryService({
      backlogFilePath,
      now: () => "2026-04-24T12:00:00.000Z",
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T12:00:00.000Z",
          artifacts: [],
          queue: [],
          summary: {
            total: 0,
            issueCount: 0,
            workspaceCount: 0,
            pendingCount: 0,
            changesRequestedCount: 0,
            approvedCount: 0,
            openCommentCount: 0,
          },
        }),
      } as never,
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
    });

    const created = await service.createIssue({
      projectId: "kanban-app",
      title: "Materialize webhook triage follow-up",
      status: "ready",
      priority: "high",
      labelIds: ["label-debt"],
      acceptanceCriteria: ["Webhook payload is triaged"],
      decomposition: [
        {
          title: "Inspect the payload",
          kind: "research",
          status: "todo",
        },
      ],
      source: {
        kind: "run-derived",
        externalId: "evt-webhook-1",
        metadata: {
          automationRuleId: "automation-1",
          triggerEventId: "evt-webhook-1",
          routeProjectId: "kanban-app",
          routeBoardProjectId: "kanban-app",
        },
      },
      metadata: {
        template: "automation",
      },
    });

    expect(created.issue.key).toMatch(/^KANBAN-AUTO-\d{3}$/);
    expect(created.issue.projectId).toBe("kanban-app");
    expect(created.issue.status).toBe("ready");
    expect(created.issue.dispatch.readiness).toBe("needs-decomposition");
    expect(created.issue.labels.map((label) => label.id)).toEqual(["label-debt"]);
    expect(created.issue.source?.metadata).toMatchObject({
      automationRuleId: "automation-1",
      triggerEventId: "evt-webhook-1",
      routeProjectId: "kanban-app",
      routeBoardProjectId: "kanban-app",
    });

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      projects: Array<{ issueIds: string[] }>;
      issues: Array<{ key: string; metadata?: { template?: string } }>;
    };
    expect(
      persisted.projects[0]?.issueIds.some((issueId) => issueId.startsWith("KANBAN-AUTO-")),
    ).toBe(true);
    expect(
      persisted.issues.find((issue) => issue.key === created.issue.key)?.metadata?.template,
    ).toBe("automation");
  });

  it("links a repository and creates a pull request through persisted backlog data", async () => {
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

    await service.linkRepository({
      issueId: "KANBAN-GAP-001-A",
      owner: "a5c-ai",
      name: "babysitter",
      branchName: "feat/kanban-gap-001-a",
    });

    const overview = await service.createPullRequest({
      issueId: "KANBAN-GAP-001-A",
      title: "KANBAN-GAP-001-A: Define canonical project and issue entities",
      reviewers: "kanban-maintainers, codeowners",
    });

    const issue = overview.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-001-A");
    expect(issue?.repositoryLifecycle?.repositoryId).toBe("repo-github-a5c-ai-babysitter");
    expect(issue?.repositoryLifecycle?.pullRequest?.number).toBeGreaterThan(0);
    expect(issue?.repositoryLifecycle?.pullRequest?.reviewLinks).toHaveLength(2);
    expect(
      overview.snapshot.projects[0]?.repositories.find(
        (repository) => repository.id === "repo-github-a5c-ai-babysitter",
      )?.fullName,
    ).toBe("a5c-ai/babysitter");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      projects: Array<{ repositories?: Array<{ id: string }> }>;
      issues: Array<{
        id: string;
        repositoryLifecycle?: { pullRequest?: { title: string } };
      }>;
    };
    expect(persisted.projects[0]?.repositories?.[0]?.id).toBe("repo-github-a5c-ai-babysitter");
    expect(
      persisted.issues.find((candidate) => candidate.id === "KANBAN-GAP-001-A")?.repositoryLifecycle
        ?.pullRequest?.title,
    ).toBe("KANBAN-GAP-001-A: Define canonical project and issue entities");
  });

  it("updates repository settings for the linked repository", async () => {
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

    await service.linkRepository({
      issueId: "KANBAN-GAP-001-B",
      owner: "a5c-ai",
      name: "babysitter",
      branchName: "feat/kanban-gap-001-b",
    });

    const overview = await service.updateRepositorySettings({
      issueId: "KANBAN-GAP-001-B",
      settings: {
        baseBranch: "release/next",
        ciProvider: "Buildkite",
        publishTarget: "internal-registry",
        autoMerge: true,
        requiredApprovals: 3,
      },
    });

    const repository = overview.snapshot.projects[0]?.repositories.find(
      (candidate) => candidate.id === "repo-github-a5c-ai-babysitter",
    );
    expect(repository?.settings).toMatchObject({
      baseBranch: "release/next",
      ciProvider: "Buildkite",
      publishTarget: "internal-registry",
      autoMerge: true,
      requiredApprovals: 3,
    });
  });

  it("persists project collaboration policy, roster changes, and issue collaborators", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = new BacklogQueryService({
      backlogFilePath,
      now: () => "2026-04-24T14:00:00.000Z",
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T14:00:00.000Z",
          artifacts: [],
          queue: [],
          summary: {
            total: 0,
            issueCount: 0,
            workspaceCount: 0,
            pendingCount: 0,
            changesRequestedCount: 0,
            approvedCount: 0,
            openCommentCount: 0,
          },
        }),
      } as never,
    });

    await service.updateProjectCollaboration({
      projectId: "kanban-app",
      teamName: "Board Systems",
      visibility: "workspace-shared",
      defaultRole: "viewer",
      allowSelfAssign: false,
      reviewRequiredForDone: false,
      activityScope: "all-board-entities",
      workspaceProvisioning: "contributors-and-up",
      members: [
        { id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai", role: "owner" },
        { id: "qa", displayName: "QA Lead", email: "qa@a5c.ai", role: "maintainer" },
        { id: "ops", displayName: "Ops Partner", email: "ops@a5c.ai", role: "viewer" },
      ],
      permissions: [
        {
          action: "manage-project-settings",
          roles: ["owner"],
          description: "Only owners may change project settings.",
        },
      ],
    });

    const overview = await service.updateIssueCollaboration({
      issueId: "KANBAN-GAP-007",
      assigneeIds: ["tal", "qa"],
      collaboratorIds: ["tal", "qa", "ops"],
    });

    const project = overview.snapshot.projects[0];
    const issue = overview.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-007");

    expect(project?.team.name).toBe("Board Systems");
    expect(project?.team.settings.visibility).toBe("workspace-shared");
    expect(project?.settings.workspaceProvisioning).toBe("contributors-and-up");
    expect(project?.permissions[0]?.roles).toEqual(["owner"]);
    expect(project?.activity[0]?.action).toBe("updated-issue-collaboration");
    expect(issue?.assignees.map((assignee) => assignee.id)).toEqual(["tal", "qa"]);
    expect(issue?.collaborators.map((collaborator) => collaborator.id)).toEqual([
      "tal",
      "qa",
      "ops",
    ]);
    expect(issue?.activity[0]?.action).toBe("updated-issue-collaboration");
  });

  it("rejects moves that violate board policy", async () => {
    const service = new BacklogQueryService({
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T12:00:00.000Z",
          artifacts: [],
          queue: [],
          summary: {
            total: 0,
            issueCount: 0,
            workspaceCount: 0,
            pendingCount: 0,
            changesRequestedCount: 0,
            approvedCount: 0,
            openCommentCount: 0,
          },
        }),
      } as never,
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
