import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, setupUser, waitFor, within } from "@/test/test-utils";

import { BacklogOverview } from "../backlog-overview";

const moveIssueMock = vi.fn();
const linkRepositoryMock = vi.fn();
const updateRepositorySettingsMock = vi.fn();
const createPullRequestMock = vi.fn();
const updateProjectCollaborationMock = vi.fn();
const updateIssueCollaborationMock = vi.fn();
const refreshMock = vi.fn();
const createIssueMock = vi.fn();

let creatingIssueState = false;

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

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
    moveIssue: moveIssueMock,
    linkRepository: linkRepositoryMock,
    updateRepositorySettings: updateRepositorySettingsMock,
    createPullRequest: createPullRequestMock,
    createIssue: createIssueMock,
    updateProjectCollaboration: updateProjectCollaborationMock,
    updateIssueCollaboration: updateIssueCollaborationMock,
    movingIssueId: null,
    mutatingIssueId: null,
    creatingIssue: creatingIssueState,
    refresh: refreshMock,
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
  beforeEach(() => {
    localStorage.clear();
    creatingIssueState = false;
    moveIssueMock.mockReset();
    linkRepositoryMock.mockReset();
    updateRepositorySettingsMock.mockReset();
    createPullRequestMock.mockReset();
    updateProjectCollaborationMock.mockReset();
    updateIssueCollaborationMock.mockReset();
    createIssueMock.mockReset();
    refreshMock.mockReset();
  });

  it("renders collaboration settings, permission policy, and issue activity", () => {
    render(<BacklogOverview />);

    expect(screen.getByText("Shared collaboration state now lives beside the board model")).toBeInTheDocument();
    expect(screen.getByText("Permission matrix")).toBeInTheDocument();
    expect(screen.getByText("Issue activity")).toBeInTheDocument();
    expect(screen.getByText("Updated shared team settings, roster, and permission policy.")).toBeInTheDocument();
    expect(screen.getByText("Set 1 assignees and 2 collaborators for KANBAN-GAP-007.")).toBeInTheDocument();
  });

  it("opens create mode from the board header and resets the draft after close and reopen", async () => {
    const user = setupUser();
    render(<BacklogOverview />);

    await user.click(screen.getByTestId("board-header-create"));
    expect(screen.getByText("Draft is empty.")).toBeInTheDocument();

    const title = screen.getByLabelText("Issue title");
    await user.type(title, "Draft that should be cleared");

    expect(screen.getByTestId("create-issue-panel")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Draft autosaved locally.")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("create-issue-panel")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("board-header-create"));
    expect(screen.getByLabelText("Issue title")).toHaveValue("");
    expect(screen.getByText("Draft is empty.")).toBeInTheDocument();
  });

  it("opens create mode from a column header, seeds the target column, and blocks invalid submit", async () => {
    const user = setupUser();
    render(<BacklogOverview />);

    await user.click(screen.getByTestId("create-column-standard-review"));
    const panel = screen.getByTestId("create-issue-panel");

    expect(screen.getByLabelText("Target column")).toHaveValue("review");

    await user.click(within(panel).getByRole("button", { name: "Create issue" }));

    expect(screen.getByText("Title is required before the issue can be created.")).toBeInTheDocument();
    expect(createIssueMock).not.toHaveBeenCalled();
  });

  it("submits through the canonical create path and keeps the create panel beside list view", async () => {
    const user = setupUser();
    createIssueMock.mockResolvedValue({
      overview: {},
      issue: { id: "KANBAN-AUTO-101", key: "KANBAN-AUTO-101", title: "List-view create" },
    });

    render(<BacklogOverview />);

    await user.click(screen.getByRole("button", { name: "List view" }));
    await user.click(screen.getByTestId("board-header-create"));

    expect(screen.getByTestId("kanban-list")).toBeInTheDocument();
    const panel = screen.getByTestId("create-issue-panel");

    await user.type(screen.getByLabelText("Issue title"), "List-view create");
    await user.type(screen.getByLabelText("Issue summary"), "Keep panel beside alternate surface");
    await user.selectOptions(screen.getByLabelText("Target column"), "in-progress");
    await user.selectOptions(screen.getByLabelText("Priority"), "high");
    await user.click(within(panel).getByRole("button", { name: "Create issue" }));

    await waitFor(() => {
      expect(createIssueMock).toHaveBeenCalledWith({
        projectId: "kanban-app",
        title: "List-view create",
        summary: "Keep panel beside alternate surface",
        priority: "high",
        status: "in-progress",
        metadata: {
          createSource: "header",
          createWorkflowState: "in-progress",
          createMode: "board",
        },
      });
    });

    expect(screen.getByText("Created KANBAN-AUTO-101 from board header create mode.")).toBeInTheDocument();
  });

  it("surfaces partial-save failure state and preserves the draft for retry", async () => {
    const user = setupUser();
    createIssueMock.mockRejectedValue(new Error("Backend unavailable"));

    render(<BacklogOverview />);

    await user.click(screen.getByTestId("board-header-create"));
    await user.type(screen.getByLabelText("Issue title"), "Retry me");
    await user.type(screen.getByLabelText("Issue summary"), "Draft should remain after failure");
    await user.click(within(screen.getByTestId("create-issue-panel")).getByRole("button", { name: "Create issue" }));

    await waitFor(() => {
      expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    });

    expect(screen.getByText("Issue save failed. Draft preserved locally for retry.")).toBeInTheDocument();
    expect(screen.getByLabelText("Issue title")).toHaveValue("Retry me");
    expect(screen.getByLabelText("Issue summary")).toHaveValue("Draft should remain after failure");
  });

  it("shows the explicit loading state when issue creation is already in flight", async () => {
    const user = setupUser();
    creatingIssueState = true;

    render(<BacklogOverview />);

    await user.click(screen.getByTestId("board-header-create"));

    expect(screen.getByRole("button", { name: "Creating issue…" })).toBeDisabled();
  });
});
