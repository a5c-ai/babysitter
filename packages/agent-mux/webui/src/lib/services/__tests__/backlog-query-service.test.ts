import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { BacklogQueryService } from "../backlog-query-service";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

function createBacklogService(options: {
  backlogFilePath?: string;
  now?: () => string;
} = {}) {
  return new BacklogQueryService({
    backlogFilePath: options.backlogFilePath,
    now: options.now ?? (() => "2026-04-24T12:00:00.000Z"),
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
}

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
    expect(overview.snapshot.dispatchContextLabels.map((label) => label.key)).toEqual([
      "tests_first",
      "preserve_release_contract",
      "ui_copy_review",
    ]);
    expect(overview.snapshot.projects[0]?.integrations.map((integration) => integration.provider)).toEqual([
      "github",
      "azure-repos",
    ]);
    expect(overview.snapshot.projects[0]?.linkedRunSummary?.activeRuns).toBe(2);
    expect(overview.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-004")?.review?.decision).toBe("pending");
    expect(overview.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-006")?.repositoryLifecycle?.integration).toMatchObject({
      status: "missing-scopes",
      linkState: "partially-linked",
    });
    expect(overview.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-004")?.dispatch.contextLabels).toEqual([
      { labelId: "dispatch-context-label-tests-first" },
      { labelId: "dispatch-context-label-preserve-release-contract" },
    ]);
    expect(
      overview.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-004")?.dispatch.renderedContext,
    ).toContain("preserve_release_contract");
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

    await service.updateProjectCollaboration({
      projectId: "kanban-app",
      members: [
        { id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai", role: "owner" },
        { id: "qa", displayName: "QA Lead", email: "qa@a5c.ai", role: "maintainer" },
      ],
    });

    const created = await service.createIssue({
      projectId: "kanban-app",
      title: "Materialize webhook triage follow-up",
      description: "Persist the shared issue authoring model instead of relying on seeded only data.",
      status: "ready",
      priority: "high",
      labelIds: ["label-debt"],
      assigneeIds: ["qa"],
      dependencies: [{ issueId: "KANBAN-GAP-001", type: "blocked-by" }],
      acceptanceCriteria: [
        {
          title: "Webhook payload is triaged",
          notes: "Cover both signature validation and malformed payloads.",
        },
      ],
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
    expect(created.issue.description).toContain("shared issue authoring model");
    expect(created.issue.dispatch.readiness).toBe("blocked");
    expect(created.issue.labels.map((label) => label.id)).toEqual(["label-debt"]);
    expect(created.issue.assignees.map((assignee) => assignee.id)).toEqual(["qa"]);
    expect(created.issue.dependencies).toEqual([{ issueId: "KANBAN-GAP-001", type: "blocked-by" }]);
    expect(created.issue.acceptanceCriteria).toEqual([
      {
        id: expect.stringMatching(/^KANBAN-AUTO-\d{3}-ac-1$/),
        title: "Webhook payload is triaged",
        satisfied: false,
        notes: "Cover both signature validation and malformed payloads.",
      },
    ]);
    expect(created.issue.source?.metadata).toMatchObject({
      automationRuleId: "automation-1",
      triggerEventId: "evt-webhook-1",
      routeProjectId: "kanban-app",
      routeBoardProjectId: "kanban-app",
    });

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      projects: Array<{ issueIds: string[] }>;
      issues: Array<{
        key: string;
        description?: string;
        assignees?: Array<{ id: string }>;
        dependencies?: Array<{ issueId: string; type: string }>;
        metadata?: { template?: string };
      }>;
    };
    expect(
      persisted.projects[0]?.issueIds.some((issueId) => issueId.startsWith("KANBAN-AUTO-")),
    ).toBe(true);
    expect(persisted.issues.find((issue) => issue.key === created.issue.key)).toMatchObject({
      description: "Persist the shared issue authoring model instead of relying on seeded only data.",
      assignees: [{ id: "qa" }],
      dependencies: [{ issueId: "KANBAN-GAP-001", type: "blocked-by" }],
      metadata: { template: "automation" },
    });
  });

  it("creates a sub-issue and keeps the parent relationship in sync", async () => {
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

    const parent = await service.createIssue({
      projectId: "kanban-app",
      title: "Parent relationship shell",
      status: "ready",
      priority: "medium",
    });

    const completedChild = await service.createIssue({
      parentIssueId: parent.issue.id,
      title: "Ship the first child",
      status: "done",
      priority: "medium",
    });

    expect(completedChild.issue.parentIssueId).toBe(parent.issue.id);
    expect(
      completedChild.overview.snapshot.issues.find((issue) => issue.id === parent.issue.id)?.dispatch.readiness,
    ).toBe("ready");

    const created = await service.createIssue({
      parentIssueId: parent.issue.id,
      title: "Author parent-child relationship panel states",
      summary: "Relationship UX parity slice",
      status: "ready",
      priority: "high",
    });

    expect(created.issue.parentIssueId).toBe(parent.issue.id);
    expect(
      created.overview.snapshot.issues.find((issue) => issue.id === parent.issue.id)?.childIssueIds,
    ).toContain(created.issue.id);
    expect(
      created.overview.snapshot.issues.find((issue) => issue.id === parent.issue.id)?.dispatch.readiness,
    ).toBe("needs-decomposition");
  });

  it("links an existing child issue and rejects hierarchy cycles", async () => {
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

    const linked = await service.linkChildIssue({
      parentIssueId: "KANBAN-GAP-007",
      childIssueId: "KANBAN-GAP-004",
    });

    expect(
      linked.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-004")?.parentIssueId,
    ).toBe("KANBAN-GAP-007");
    expect(
      linked.snapshot.issues.find((issue) => issue.id === "KANBAN-GAP-007")?.childIssueIds,
    ).toContain("KANBAN-GAP-004");

    await expect(
      service.linkChildIssue({
        parentIssueId: "KANBAN-GAP-001-A",
        childIssueId: "KANBAN-GAP-001",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
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

  it("supports Azure Repos repository linking and preserves provider-specific integration state", async () => {
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

    const overview = await service.linkRepository({
      issueId: "KANBAN-GAP-001-A",
      owner: "a5c-ai",
      name: "azure-kanban",
      branchName: "feat/azure-kanban",
      provider: "azure-repos",
    });

    const issue = overview.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-001-A");
    expect(issue?.repositoryLifecycle?.integration).toMatchObject({
      provider: "azure-repos",
      status: "partial-setup",
      actions: {
        canCreatePullRequest: false,
      },
    });
  });

  it("rejects PR creation when integration prerequisites disable the action", async () => {
    const service = new BacklogQueryService({
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
    });

    await expect(
      service.createPullRequest({
        issueId: "KANBAN-GAP-006",
        title: "Should be blocked",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
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

  it("persists expanded issue detail updates for core fields, dependencies, and acceptance criteria", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = new BacklogQueryService({
      backlogFilePath,
      now: () => "2026-04-24T14:30:00.000Z",
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T14:30:00.000Z",
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
      members: [
        { id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai", role: "owner" },
        { id: "qa", displayName: "QA Lead", email: "qa@a5c.ai", role: "maintainer" },
      ],
    });

    const baseline = await service.getOverview();
    const issue = baseline.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-007");
    expect(issue).toBeTruthy();

    const overview = await service.updateIssueDetail({
      issueId: "KANBAN-GAP-007",
      expectedUpdatedAt: issue?.updatedAt,
      title: "Land first-class issue authoring",
      summary: "Shared create and detail flows should edit the same persisted issue model.",
      description: "# Authoring parity\n- [ ] Autosave description",
      status: "blocked",
      priority: "high",
      assigneeIds: ["qa"],
      labelIds: ["label-debt"],
      dependencies: [{ issueId: "KANBAN-GAP-001", type: "blocked-by" }],
      acceptanceCriteria: [
        { id: "KANBAN-GAP-007-ac-1", title: "Expose first-class issue surfaces.", satisfied: true },
        {
          title: "Support shared mutation-backed edits for issue metadata.",
          satisfied: false,
          notes: "Pending dedicated issue page form wiring.",
        },
      ],
    });

    const updated = overview.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-007");
    expect(updated?.title).toBe("Land first-class issue authoring");
    expect(updated?.summary).toBe("Shared create and detail flows should edit the same persisted issue model.");
    expect(updated?.description).toBe("# Authoring parity\n- [ ] Autosave description");
    expect(updated?.status).toBe("blocked");
    expect(updated?.priority).toBe("high");
    expect(updated?.assignees.map((assignee) => assignee.id)).toEqual(["qa"]);
    expect(updated?.labels.map((label) => label.id)).toEqual(["label-debt"]);
    expect(updated?.dependencies).toEqual([{ issueId: "KANBAN-GAP-001", type: "blocked-by" }]);
    expect(updated?.acceptanceCriteria).toMatchObject([
      { id: "KANBAN-GAP-007-ac-1", title: "Expose first-class issue surfaces.", satisfied: true },
      {
        title: "Support shared mutation-backed edits for issue metadata.",
        satisfied: false,
        notes: "Pending dedicated issue page form wiring.",
      },
    ]);
    expect(updated?.activity[0]?.action).toBe("updated-issue-detail");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{
        id: string;
        title: string;
        summary?: string;
        description?: string;
        status: string;
        priority: string;
        assignees: Array<{ id: string }>;
        labels: Array<{ id: string }>;
        dependencies: Array<{ issueId: string; type: string }>;
        acceptanceCriteria: Array<{ id: string; title: string; satisfied: boolean; notes?: string }>;
      }>;
    };
    expect(
      persisted.issues.find((candidate) => candidate.id === "KANBAN-GAP-007"),
    ).toMatchObject({
      title: "Land first-class issue authoring",
      summary: "Shared create and detail flows should edit the same persisted issue model.",
      description: "# Authoring parity\n- [ ] Autosave description",
      status: "blocked",
      priority: "high",
      assignees: [{ id: "qa" }],
      labels: [{ id: "label-debt" }],
      dependencies: [{ issueId: "KANBAN-GAP-001", type: "blocked-by" }],
      acceptanceCriteria: [
        { id: "KANBAN-GAP-007-ac-1", title: "Expose first-class issue surfaces.", satisfied: true },
        {
          title: "Support shared mutation-backed edits for issue metadata.",
          satisfied: false,
          notes: "Pending dedicated issue page form wiring.",
        },
      ],
    });
  });

  it("rejects stale issue detail saves when the caller is behind the latest snapshot", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = new BacklogQueryService({
      backlogFilePath,
      now: () => "2026-04-24T15:00:00.000Z",
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T15:00:00.000Z",
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

    const baseline = await service.getOverview();
    const issue = baseline.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-007");
    expect(issue).toBeTruthy();

    await service.updateIssueDetail({
      issueId: "KANBAN-GAP-007",
      expectedUpdatedAt: issue?.updatedAt,
      description: "Fresh server change",
    });

    await expect(
      service.updateIssueDetail({
        issueId: "KANBAN-GAP-007",
        expectedUpdatedAt: issue?.updatedAt,
        description: "Client is stale",
      }),
    ).rejects.toMatchObject({ code: "STALE_WRITE", status: 409 });
  });

  it("persists issue dispatch context label attachments through the backlog file", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    const service = new BacklogQueryService({
      backlogFilePath,
      now: () => "2026-04-24T15:00:00.000Z",
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T15:00:00.000Z",
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

    const overview = await service.updateIssueDispatchContextLabels({
      issueId: "KANBAN-GAP-007",
      dispatchContextLabelIds: [
        "dispatch-context-label-ui-copy-review",
        "dispatch-context-label-tests-first",
        "dispatch-context-label-ui-copy-review",
      ],
    });

    const issue = overview.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-007");
    expect(issue?.dispatch.contextLabels).toEqual([
      { labelId: "dispatch-context-label-ui-copy-review" },
      { labelId: "dispatch-context-label-tests-first" },
    ]);
    expect(issue?.dispatch.contextLabelProjections.map((projection) => projection.key)).toEqual([
      "tests_first",
      "ui_copy_review",
    ]);
    expect(issue?.dispatch.renderedContext).toContain("[tests_first]");
    expect(issue?.dispatch.renderedContext).toContain("[ui_copy_review]");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{
        id: string;
        dispatch?: {
          contextLabels?: Array<{ labelId: string }>;
          renderedContext?: string;
          contextLabelProjections?: unknown[];
        };
      }>;
    };
    expect(persisted.issues.find((candidate) => candidate.id === "KANBAN-GAP-007")?.dispatch).toEqual(
      expect.objectContaining({
        contextLabels: [
          { labelId: "dispatch-context-label-ui-copy-review" },
          { labelId: "dispatch-context-label-tests-first" },
        ],
      }),
    );
    expect(
      persisted.issues.find((candidate) => candidate.id === "KANBAN-GAP-007")?.dispatch,
    ).not.toHaveProperty("renderedContext");
    expect(
      persisted.issues.find((candidate) => candidate.id === "KANBAN-GAP-007")?.dispatch,
    ).not.toHaveProperty("contextLabelProjections");
    expect(
      persisted.issues.find((candidate) => candidate.id === "KANBAN-GAP-007")?.dispatch,
    ).not.toHaveProperty("executionContext");
  });

  it("rejects unknown issue dispatch context label attachments and tolerates stale stored refs", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");

    await fs.writeFile(
      backlogFilePath,
      JSON.stringify(
        {
          projects: [
            {
              id: "kanban-app",
              key: "KANBAN",
              name: "Kanban App",
              issueIds: ["issue-1"],
              labels: [],
              assignees: [],
              statuses: [],
              repositories: [],
            },
          ],
          dispatchContextLabels: [
            {
              id: "dispatch-context-label-tests-first",
              key: "tests_first",
              label: "Tests First",
              instruction: "Write tests first.",
              order: 0,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
          ],
          issues: [
            {
              id: "issue-1",
              key: "KANBAN-AUTO-001",
              projectId: "kanban-app",
              title: "Backfill stale dispatch state",
              status: "ready",
              priority: "medium",
              labels: [],
              assignees: [],
              dependencies: [],
              acceptanceCriteria: [],
              decomposition: [],
              childIssueIds: [],
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
              dispatch: {
                readiness: "ready",
                blockedReasons: [],
                runIds: [],
                sessionIds: [],
                contextLabels: [
                  { labelId: "dispatch-context-label-tests-first" },
                  { labelId: "dispatch-context-label-missing" },
                ],
                renderedContext: "stale",
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    const service = new BacklogQueryService({
      backlogFilePath,
      now: () => "2026-04-24T15:00:00.000Z",
      runQueryService: {
        listProjects: vi.fn().mockResolvedValue({
          recentCompletionWindowMs: 14400000,
          projects: [],
        }),
      } as never,
      reviewService: {
        listReviews: vi.fn().mockResolvedValue({
          generatedAt: "2026-04-24T15:00:00.000Z",
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

    const overview = await service.getOverview();
    expect(overview.snapshot.issues[0]?.dispatch.contextLabels).toEqual([
      { labelId: "dispatch-context-label-tests-first" },
    ]);
    expect(overview.snapshot.issues[0]?.dispatch.renderedContext).toBe(
      "- [tests_first] Write tests first.",
    );

    await expect(
      service.updateIssueDispatchContextLabels({
        issueId: "issue-1",
        dispatchContextLabelIds: ["dispatch-context-label-missing"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
  });

  it("persists issue workspace links and allows multiple workspace attachments on one issue", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    const service = createBacklogService({ backlogFilePath });

    await service.linkIssueWorkspace({
      issueId: "KANBAN-GAP-007",
      workspacePath: "/repo/worktrees/kanban-gap-007",
      workspaceName: "KANBAN-GAP-007",
      branchName: "vk/kanban-gap-007",
      source: "created-from-issue",
    });

    const overview = await service.linkIssueWorkspace({
      issueId: "KANBAN-GAP-007",
      workspacePath: "/repo/worktrees/shared",
      workspaceName: "shared",
      branchName: "vk/shared",
      source: "linked-existing-workspace",
    });

    const issue = overview.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-007");
    expect(issue?.workspaceLinks).toHaveLength(2);
    expect(issue?.workspaceLinks.map((link) => link.workspacePath)).toEqual([
      "/repo/worktrees/kanban-gap-007",
      "/repo/worktrees/shared",
    ]);

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{
        id: string;
        workspaceLinks?: Array<{ workspacePath: string; source: string }>;
      }>;
    };
    expect(
      persisted.issues.find((candidate) => candidate.id === "KANBAN-GAP-007")?.workspaceLinks,
    ).toEqual([
      expect.objectContaining({
        workspacePath: "/repo/worktrees/kanban-gap-007",
        source: "created-from-issue",
      }),
      expect.objectContaining({
        workspacePath: "/repo/worktrees/shared",
        source: "linked-existing-workspace",
      }),
    ]);

    const refreshed = await service.getOverview();
    expect(
      refreshed.snapshot.issues.find((candidate) => candidate.id === "KANBAN-GAP-007")?.workspaceLinks
        ?.map((link) => link.workspacePath),
    ).toEqual(["/repo/worktrees/kanban-gap-007", "/repo/worktrees/shared"]);
  });

  it("rejects duplicate workspace linking on the same issue", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    const service = createBacklogService({ backlogFilePath });

    await service.linkIssueWorkspace({
      issueId: "KANBAN-GAP-007",
      workspacePath: "/repo/worktrees/shared",
      workspaceName: "shared",
      source: "linked-existing-workspace",
    });

    await expect(
      service.linkIssueWorkspace({
        issueId: "KANBAN-GAP-007",
        workspacePath: "/repo/worktrees/shared",
        workspaceName: "shared",
        source: "linked-existing-workspace",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 409 });
  });

  it("rejects linking one workspace to multiple issues", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-backlog-"));
    tempDirs.push(tempDir);
    const backlogFilePath = path.join(tempDir, "kanban-backlog.json");
    const service = createBacklogService({ backlogFilePath });

    await service.linkIssueWorkspace({
      issueId: "KANBAN-GAP-007",
      workspacePath: "/repo/worktrees/shared",
      workspaceName: "shared",
      source: "linked-existing-workspace",
    });

    await expect(
      service.linkIssueWorkspace({
        issueId: "KANBAN-GAP-004",
        workspacePath: "/repo/worktrees/shared",
        workspaceName: "shared",
        source: "linked-existing-workspace",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 409 });
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
