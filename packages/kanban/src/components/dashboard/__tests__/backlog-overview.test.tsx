import { render, screen } from "@/test/test-utils";
import { vi } from "vitest";

import { BacklogOverview } from "../backlog-overview";

vi.mock("@/hooks/use-backlog", () => ({
  useBacklog: () => ({
    snapshot: {
      generatedAt: "2026-04-24T14:00:00.000Z",
      projects: [
        {
          id: "kanban-app",
          key: "KANBAN",
          name: "Kanban App",
          issueIds: ["KANBAN-GAP-007"],
          labels: [],
          assignees: [],
          team: {
            id: "team-kanban",
            name: "Kanban Core",
            members: [
              { id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai", role: "owner" },
              { id: "qa", displayName: "QA Lead", email: "qa@a5c.ai", role: "maintainer" },
            ],
            settings: {
              visibility: "team",
              defaultRole: "contributor",
              allowSelfAssign: true,
            },
          },
          settings: {
            reviewRequiredForDone: true,
            activityScope: "all-board-entities",
            workspaceProvisioning: "owners-maintainers",
          },
          permissions: [
            {
              action: "manage-project-settings",
              roles: ["owner", "maintainer"],
              description: "Elevated roles only.",
            },
          ],
          activity: [
            {
              id: "activity-1",
              entityType: "project",
              entityId: "kanban-app",
              action: "updated-project-collaboration",
              summary: "Updated shared team settings, roster, and permission policy.",
              actor: { kind: "human", id: "tal", displayName: "Tal Muskal", role: "owner" },
              createdAt: "2026-04-24T14:00:00.000Z",
            },
          ],
          statuses: [],
          repositories: [],
          metrics: {
            totalIssues: 1,
            readyIssues: 1,
            blockedIssues: 0,
            dispatchedIssues: 0,
            completedIssues: 0,
            needsDecompositionIssues: 0,
            inProgressIssues: 0,
          },
        },
      ],
      issues: [
        {
          id: "KANBAN-GAP-007",
          key: "KANBAN-GAP-007",
          projectId: "kanban-app",
          title: "Add team and collaboration primitives",
          summary: "Collaboration gap",
          status: "backlog",
          priority: "medium",
          labels: [],
          assignees: [{ id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai" }],
          collaborators: [
            { id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai", role: "owner" },
            { id: "qa", displayName: "QA Lead", email: "qa@a5c.ai", role: "maintainer" },
          ],
          dependencies: [],
          acceptanceCriteria: [],
          decomposition: [],
          childIssueIds: [],
          createdAt: "2026-04-24T14:00:00.000Z",
          updatedAt: "2026-04-24T14:00:00.000Z",
          dispatch: {
            readiness: "ready",
            blockedReasons: [],
            runIds: [],
            sessionIds: [],
          },
          activity: [
            {
              id: "issue-activity-1",
              entityType: "issue",
              entityId: "KANBAN-GAP-007",
              action: "updated-issue-collaboration",
              summary: "Set 1 assignees and 2 collaborators for KANBAN-GAP-007.",
              actor: { kind: "human", id: "tal", displayName: "Tal Muskal", role: "owner" },
              createdAt: "2026-04-24T14:00:00.000Z",
            },
          ],
        },
      ],
    },
    board: {
      generatedAt: "2026-04-24T14:00:00.000Z",
      projects: [
        {
          projectId: "kanban-app",
          projectKey: "KANBAN",
          projectName: "Kanban App",
          generatedAt: "2026-04-24T14:00:00.000Z",
          columns: [
            { id: "todo", name: "Todo", issueIds: ["KANBAN-GAP-007"], issueCount: 1, isOverLimit: false },
            { id: "in-progress", name: "In Progress", issueIds: [], issueCount: 0, wipLimit: 3, isOverLimit: false },
            { id: "review", name: "Review", issueIds: [], issueCount: 0, wipLimit: 3, isOverLimit: false },
            { id: "done", name: "Done", issueIds: [], issueCount: 0, isOverLimit: false },
          ],
          swimlanes: [
            { id: "expedite", name: "Expedite", issueIds: [] },
            { id: "standard", name: "Standard", issueIds: ["KANBAN-GAP-007"] },
            { id: "blocked", name: "Blocked", issueIds: [] },
          ],
          cards: [
            {
              issueId: "KANBAN-GAP-007",
              issueKey: "KANBAN-GAP-007",
              projectId: "kanban-app",
              title: "Add team and collaboration primitives",
              summary: "Collaboration gap",
              workflowState: "todo",
              swimlaneId: "standard",
              priority: "medium",
              readiness: "ready",
              blocked: false,
              blockedReasons: [],
              labelNames: [],
              assigneeNames: ["Tal Muskal"],
              collaboratorNames: ["Tal Muskal", "QA Lead"],
              dependencyCount: 0,
              childCount: 0,
              activityCount: 1,
              latestActivityAt: "2026-04-24T14:00:00.000Z",
              acceptanceProgress: { satisfied: 0, total: 0 },
              moveTargets: [{ state: "in-progress", allowed: true, signals: [] }],
              policySignals: [],
            },
          ],
          policyHooks: [],
        },
      ],
    },
    summary: {
      projectCount: 1,
      issueCount: 1,
      readyCount: 1,
      blockedCount: 0,
      dispatchedCount: 0,
      completedCount: 0,
      needsDecompositionCount: 0,
      inProgressCount: 0,
    },
    loading: false,
    error: undefined,
    moveIssue: vi.fn(),
    linkRepository: vi.fn(),
    updateRepositorySettings: vi.fn(),
    createPullRequest: vi.fn(),
    updateProjectCollaboration: vi.fn(),
    updateIssueCollaboration: vi.fn(),
    movingIssueId: null,
    mutatingIssueId: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-reviews", () => ({
  useReviews: () => ({
    loading: false,
    error: undefined,
    artifacts: [],
    queue: [],
    summary: { pendingCount: 0, changesRequestedCount: 0 },
    pendingArtifactId: null,
    actOnReview: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("BacklogOverview", () => {
  it("renders collaboration settings, permission policy, and issue activity", () => {
    render(<BacklogOverview />);

    expect(screen.getByText("Shared collaboration state now lives beside the board model")).toBeInTheDocument();
    expect(screen.getByText("Permission matrix")).toBeInTheDocument();
    expect(screen.getByText("Issue activity")).toBeInTheDocument();
    expect(screen.getByText("Updated shared team settings, roster, and permission policy.")).toBeInTheDocument();
    expect(screen.getByText("Set 1 assignees and 2 collaborators for KANBAN-GAP-007.")).toBeInTheDocument();
  });
});
