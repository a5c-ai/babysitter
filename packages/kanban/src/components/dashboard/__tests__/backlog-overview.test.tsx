import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, setupUser, waitFor, within } from "@/test/test-utils";

import { BacklogOverview } from "../backlog-overview";

const moveIssueMock = vi.fn();
const linkRepositoryMock = vi.fn();
const updateRepositorySettingsMock = vi.fn();
const createPullRequestMock = vi.fn();
const updateProjectCollaborationMock = vi.fn();
const updateIssueCollaborationMock = vi.fn();
const updateIssueDetailMock = vi.fn();
const updateIssueDispatchContextLabelsMock = vi.fn();
const createIssueMock = vi.fn();
const createSubIssueMock = vi.fn();
const linkChildIssueMock = vi.fn();
const refreshMock = vi.fn();
const push = vi.fn();

let creatingIssueState = false;
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/review/review-panel", () => ({
  ReviewPanel: () => null,
}));

vi.mock("@/hooks/use-task-tags", () => ({
  useTaskTags: () => ({
    taskTags: [
      {
        id: "task-tag-bug-report",
        key: "bug_report",
        label: "Bug Report",
        content: "Describe the bug in detail.",
        order: 0,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
      {
        id: "task-tag-deployment-validation",
        key: "deployment_validation",
        label: "Deployment Validation",
        content: "Validate staging deploy, smoke tests, and rollback path.",
        order: 1,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
    ],
    loading: false,
    error: null,
  }),
}));

function buildBacklogState() {
  return {
    snapshot: {
      generatedAt: "2026-04-24T14:00:00.000Z",
      projects: [
        {
          id: "kanban-app",
          key: "KANBAN",
          name: "Kanban App",
          issueIds: ["KANBAN-GAP-007", "KANBAN-GAP-008", "KANBAN-GAP-009"],
          labels: [
            { id: "label-ui", name: "ui" },
            { id: "label-parity", name: "parity" },
          ],
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
            totalIssues: 3,
            readyIssues: 2,
            blockedIssues: 0,
            dispatchedIssues: 0,
            completedIssues: 0,
            needsDecompositionIssues: 1,
            inProgressIssues: 1,
          },
        },
      ],
      dispatchContextLabels: [
        {
          id: "dispatch-context-label-1",
          key: "tests_first",
          label: "Tests First",
          description: "Keep verification ahead of implementation.",
          instruction: "Write or update deterministic verification before editing runtime code.",
          order: 0,
          createdAt: "2026-04-24T14:00:00.000Z",
          updatedAt: "2026-04-24T14:00:00.000Z",
        },
        {
          id: "dispatch-context-label-2",
          key: "ui_copy_review",
          label: "UI Copy Review",
          description: "Ask for a copy pass before final text ships.",
          instruction: "Review user-facing strings before finalizing the change.",
          order: 1,
          createdAt: "2026-04-24T14:00:00.000Z",
          updatedAt: "2026-04-24T14:00:00.000Z",
        },
      ],
      issues: [
        {
          id: "KANBAN-GAP-007",
          key: "KANBAN-GAP-007",
          projectId: "kanban-app",
          title: "Add team and collaboration primitives",
          summary: "Collaboration gap",
          description: "# Current state\n- [ ] Capture parity behavior",
          status: "backlog",
          priority: "medium",
          labels: [{ id: "label-parity", name: "parity" }],
          assignees: [{ id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai" }],
          collaborators: [
            { id: "tal", displayName: "Tal Muskal", email: "tal@a5c.ai", role: "owner" },
            { id: "qa", displayName: "QA Lead", email: "qa@a5c.ai", role: "maintainer" },
          ],
          dependencies: [],
          acceptanceCriteria: [],
          decomposition: [],
          childIssueIds: ["KANBAN-GAP-008"],
          createdAt: "2026-04-24T14:00:00.000Z",
          updatedAt: "2026-04-24T14:00:00.000Z",
          dispatch: {
            readiness: "needs-decomposition",
            blockedReasons: ["child issues still open"],
            runIds: [],
            sessionIds: [],
            contextLabels: [{ labelId: "dispatch-context-label-1" }],
            contextLabelProjections: [
              {
                id: "dispatch-context-label-1",
                key: "tests_first",
                label: "Tests First",
                description: "Keep verification ahead of implementation.",
                instruction: "Write or update deterministic verification before editing runtime code.",
              },
            ],
            renderedContext: "- [tests_first] Write or update deterministic verification before editing runtime code.",
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
        {
          id: "KANBAN-GAP-008",
          key: "KANBAN-GAP-008",
          projectId: "kanban-app",
          title: "Add parent-child issue panel",
          summary: "Relationship panel",
          status: "in-progress",
          priority: "high",
          labels: [],
          assignees: [],
          collaborators: [],
          dependencies: [],
          acceptanceCriteria: [],
          decomposition: [],
          childIssueIds: [],
          parentIssueId: "KANBAN-GAP-007",
          createdAt: "2026-04-24T14:00:00.000Z",
          updatedAt: "2026-04-24T14:00:00.000Z",
          dispatch: {
            readiness: "ready",
            blockedReasons: [],
            runIds: [],
            sessionIds: [],
            contextLabels: [],
            contextLabelProjections: [],
            renderedContext: "",
          },
          activity: [],
        },
        {
          id: "KANBAN-GAP-009",
          key: "KANBAN-GAP-009",
          projectId: "kanban-app",
          title: "Link existing issue into hierarchy",
          summary: "Available child issue",
          status: "ready",
          priority: "medium",
          labels: [],
          assignees: [],
          collaborators: [],
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
            contextLabels: [],
            contextLabelProjections: [],
            renderedContext: "",
          },
          activity: [],
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
            {
              id: "todo",
              name: "Todo",
              issueIds: ["KANBAN-GAP-007", "KANBAN-GAP-009"],
              issueCount: 2,
              isOverLimit: false,
            },
            {
              id: "in-progress",
              name: "In Progress",
              issueIds: ["KANBAN-GAP-008"],
              issueCount: 1,
              wipLimit: 3,
              isOverLimit: false,
            },
            { id: "review", name: "Review", issueIds: [], issueCount: 0, wipLimit: 3, isOverLimit: false },
            { id: "done", name: "Done", issueIds: [], issueCount: 0, isOverLimit: false },
          ],
          swimlanes: [
            { id: "expedite", name: "Expedite", issueIds: [] },
            {
              id: "standard",
              name: "Standard",
              issueIds: ["KANBAN-GAP-007", "KANBAN-GAP-008", "KANBAN-GAP-009"],
            },
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
              readiness: "needs-decomposition",
              blocked: false,
              blockedReasons: [],
              labelNames: [],
              assigneeNames: ["Tal Muskal"],
              collaboratorNames: ["Tal Muskal", "QA Lead"],
              dependencyCount: 0,
              childCount: 1,
              activityCount: 1,
              latestActivityAt: "2026-04-24T14:00:00.000Z",
              acceptanceProgress: { satisfied: 0, total: 0 },
              moveTargets: [{ state: "in-progress", allowed: true, signals: [] }],
              policySignals: [],
            },
            {
              issueId: "KANBAN-GAP-008",
              issueKey: "KANBAN-GAP-008",
              projectId: "kanban-app",
              title: "Add parent-child issue panel",
              summary: "Relationship panel",
              workflowState: "in-progress",
              swimlaneId: "standard",
              priority: "high",
              readiness: "ready",
              blocked: false,
              blockedReasons: [],
              labelNames: [],
              assigneeNames: [],
              collaboratorNames: [],
              dependencyCount: 0,
              childCount: 0,
              activityCount: 0,
              acceptanceProgress: { satisfied: 0, total: 0 },
              moveTargets: [{ state: "review", allowed: true, signals: [] }],
              policySignals: [],
            },
            {
              issueId: "KANBAN-GAP-009",
              issueKey: "KANBAN-GAP-009",
              projectId: "kanban-app",
              title: "Link existing issue into hierarchy",
              summary: "Available child issue",
              workflowState: "todo",
              swimlaneId: "standard",
              priority: "medium",
              readiness: "ready",
              blocked: false,
              blockedReasons: [],
              labelNames: [],
              assigneeNames: [],
              collaboratorNames: [],
              dependencyCount: 0,
              childCount: 0,
              activityCount: 0,
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
      issueCount: 3,
      readyCount: 2,
      blockedCount: 0,
      dispatchedCount: 0,
      completedCount: 0,
      needsDecompositionCount: 1,
      inProgressCount: 1,
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
    updateIssueDetail: updateIssueDetailMock,
    updateIssueDispatchContextLabels: updateIssueDispatchContextLabelsMock,
    createSubIssue: createSubIssueMock,
    linkChildIssue: linkChildIssueMock,
    movingIssueId: null,
    mutatingIssueId: null,
    creatingIssue: creatingIssueState,
    mutationError: null,
    refresh: refreshMock,
  };
}

let backlogState = buildBacklogState();

vi.mock("@/hooks/use-backlog", () => ({
  useBacklog: () => backlogState,
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
    searchParams = new URLSearchParams();
    push.mockReset();
    moveIssueMock.mockReset();
    linkRepositoryMock.mockReset();
    updateRepositorySettingsMock.mockReset();
    createPullRequestMock.mockReset();
    createIssueMock.mockReset();
    createSubIssueMock.mockReset();
    linkChildIssueMock.mockReset();
    updateProjectCollaborationMock.mockReset();
    updateIssueCollaborationMock.mockReset();
    updateIssueDetailMock.mockReset();
    updateIssueDispatchContextLabelsMock.mockReset();
    refreshMock.mockReset();
    backlogState = buildBacklogState();
  });

  it("renders collaboration settings, permission policy, and issue activity", () => {
    render(<BacklogOverview />);

    expect(screen.getByText("Shared collaboration state now lives beside the board model")).toBeInTheDocument();
    expect(screen.getByText("Permission matrix")).toBeInTheDocument();
    expect(screen.getAllByText("Issue activity").length).toBeGreaterThan(0);
    expect(screen.getByText("Updated shared team settings, roster, and permission policy.")).toBeInTheDocument();
    expect(screen.getByText("Set 1 assignees and 2 collaborators for KANBAN-GAP-007.")).toBeInTheDocument();
  });

  it("opens create mode from the board header and resets the draft after close and reopen", async () => {
    const user = setupUser();
    render(<BacklogOverview />);

    await user.click(screen.getByTestId("board-header-create"));
    expect(screen.getByText("Draft is empty.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Issue title"), "Draft that should be cleared");

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

  it("inserts Task Tag snippets into the board issue summary field", async () => {
    const user = setupUser();
    render(<BacklogOverview />);

    await user.click(screen.getByTestId("board-header-create"));
    await user.type(screen.getByLabelText("Issue summary"), "@bug");
    await user.click(screen.getByText("Bug Report"));

    expect(screen.getByLabelText("Issue summary")).toHaveValue("Describe the bug in detail.");
  });

  it("shows the explicit loading state when issue creation is already in flight", async () => {
    const user = setupUser();
    creatingIssueState = true;
    backlogState = buildBacklogState();

    render(<BacklogOverview />);

    await user.click(screen.getByTestId("board-header-create"));

    expect(screen.getByRole("button", { name: "Creating issue…" })).toBeDisabled();
  });

  it("opens the focused issue panel from the board card", async () => {
    const user = setupUser();
    render(<BacklogOverview />);

    await user.click(screen.getByTestId("open-issue-KANBAN-GAP-007"));

    expect(push).toHaveBeenCalledWith("/?issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
  });

  it("renders parent and child relationship controls for the focused issue", () => {
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    render(<BacklogOverview />);

    const dispatchPanel = screen.getByTestId("issue-dispatch-context-panel");
    expect(screen.getByTestId("issue-detail-panel")).toBeInTheDocument();
    expect(screen.getByTestId("issue-description-editor")).toHaveValue(
      "# Current state\n- [ ] Capture parity behavior",
    );
    expect(screen.getByText("parity")).toBeInTheDocument();
    expect(screen.getByTestId("issue-relationship-panel")).toBeInTheDocument();
    expect(dispatchPanel).toBeInTheDocument();
    expect(within(dispatchPanel).getByText("Dispatch Context Labels")).toBeInTheDocument();
    expect(within(dispatchPanel).getAllByText("tests_first").length).toBeGreaterThan(0);
    expect(screen.getByTestId("child-nav-KANBAN-GAP-008")).toBeInTheDocument();
    expect(screen.getByTestId("create-sub-issue-form")).toBeInTheDocument();
    expect(screen.getByTestId("link-child-issue-form")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /KANBAN-GAP-009/i })).toBeInTheDocument();
  });

  it("saves dispatch context label attachments from the focused issue panel", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    render(<BacklogOverview />);

    await user.click(screen.getByRole("checkbox", { name: /ui copy review/i }));
    await user.click(screen.getByRole("button", { name: "Save dispatch context" }));

    expect(updateIssueDispatchContextLabelsMock).toHaveBeenCalledWith({
      issueId: "KANBAN-GAP-007",
      dispatchContextLabelIds: [
        "dispatch-context-label-1",
        "dispatch-context-label-2",
      ],
    });
  });

  it("keeps the issue detail panel beside list view when an issue is opened from list context", () => {
    localStorage.setItem("kanban:backlog-presentation", JSON.stringify("list"));
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    render(<BacklogOverview />);

    expect(screen.getByTestId("kanban-list")).toBeInTheDocument();
    expect(screen.getByTestId("issue-detail-panel")).toBeInTheDocument();
  });

  it("preserves unsaved description edits across close and reopen", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    const view = render(<BacklogOverview />);
    await user.type(screen.getByTestId("issue-description-editor"), "\nDraft survives");

    searchParams = new URLSearchParams();
    view.rerender(<BacklogOverview />);
    expect(screen.queryByTestId("issue-detail-panel")).not.toBeInTheDocument();

    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    view.rerender(<BacklogOverview />);

    expect(screen.getByTestId("issue-description-editor")).toHaveValue(
      "# Current state\n- [ ] Capture parity behavior\nDraft survives",
    );
  });

  it("surfaces stale-data recovery when the focused issue reloads underneath a local draft", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    const view = render(<BacklogOverview />);
    await user.type(screen.getByTestId("issue-description-editor"), "\nPending local edit");

    backlogState = {
      ...backlogState,
      snapshot: {
        ...backlogState.snapshot,
        issues: backlogState.snapshot.issues.map((issue) =>
          issue.id === "KANBAN-GAP-007"
            ? {
                ...issue,
                description: "# Server version\n- [ ] Remote update",
                updatedAt: "2026-04-24T15:00:00.000Z",
              }
            : issue,
        ),
      },
    };
    view.rerender(<BacklogOverview />);

    expect(
      screen.getByText(
        "Server state changed while unsaved edits were still open. Reset to the latest version or keep your local draft and retry after refreshing.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("issue-description-editor")).toHaveValue(
      "# Current state\n- [ ] Capture parity behavior\nPending local edit",
    );
  });

  it("keeps description drafts recoverable after autosave failure", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    updateIssueDetailMock.mockRejectedValue(new Error("Network write failed"));

    render(<BacklogOverview />);
    await user.type(screen.getByTestId("issue-description-editor"), "\nRetry this write");

    await waitFor(() => {
      expect(updateIssueDetailMock).toHaveBeenCalled();
    });

    expect(screen.getByText("Network write failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry save" })).toBeInTheDocument();
    expect(screen.getByTestId("issue-description-editor")).toHaveValue(
      "# Current state\n- [ ] Capture parity behavior\nRetry this write",
    );
  });

  it("renders empty assignee and tag states for issues and projects without assignments", () => {
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-008&issueKey=KANBAN-GAP-008");
    backlogState = {
      ...buildBacklogState(),
      snapshot: {
        ...buildBacklogState().snapshot,
        projects: buildBacklogState().snapshot.projects.map((project) =>
          project.id === "kanban-app" ? { ...project, labels: [] } : project,
        ),
      },
    };

    render(<BacklogOverview />);

    expect(screen.getByTestId("issue-assignee-empty")).toBeInTheDocument();
    expect(screen.getByTestId("issue-tags-empty")).toBeInTheDocument();
  });

  it("inserts Task Tag snippets into the sub-issue summary field", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    render(<BacklogOverview />);

    await user.type(screen.getByLabelText("Sub-issue summary"), "@deploy");
    await user.click(screen.getByText("Deployment Validation"));

    expect(screen.getByLabelText("Sub-issue summary")).toHaveValue(
      "Validate staging deploy, smoke tests, and rollback path.",
    );
  });
  it("navigates back to the parent issue from the child issue panel", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-008&issueKey=KANBAN-GAP-008");

    render(<BacklogOverview />);
    await user.click(screen.getByTestId("back-to-parent-KANBAN-GAP-007"));

    expect(push).toHaveBeenCalledWith("/?issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
  });

  it("shows loading and error states inside relationship sections", () => {
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    backlogState = {
      ...buildBacklogState(),
      loading: true,
      mutationError: {
        issueId: "KANBAN-GAP-007",
        message: "Linking this child would create a parent-child cycle.",
      },
    };

    const { rerender } = render(<BacklogOverview />);
    expect(screen.getByTestId("parent-relationship-loading")).toBeInTheDocument();
    expect(screen.getByTestId("child-relationship-loading")).toBeInTheDocument();

    backlogState = {
      ...backlogState,
      loading: false,
    };
    rerender(<BacklogOverview />);

    expect(screen.getByTestId("parent-relationship-error")).toHaveTextContent(
      "Linking this child would create a parent-child cycle.",
    );
    expect(screen.getByTestId("child-relationship-error")).toHaveTextContent(
      "Linking this child would create a parent-child cycle.",
    );
  });

  it("renders degraded integration guidance and disables PR creation when setup is incomplete", () => {
    backlogState = buildBacklogState();
    backlogState.snapshot.projects[0]!.repositories = [
      {
        id: "repo-azure-a5c-ai-kanban",
        owner: "a5c-ai",
        name: "kanban",
        fullName: "a5c-ai/kanban",
        provider: "azure-repos",
        defaultBranch: "main",
        linkedAt: "2026-04-24T14:00:00.000Z",
        settings: {
          baseBranch: "main",
          autoMerge: false,
          requiredApprovals: 2,
          ciProvider: "Azure Pipelines",
          publishTarget: "npm",
        },
      },
    ];
    backlogState.board.projects[0]!.cards[0] = {
      ...backlogState.board.projects[0]!.cards[0]!,
      repository: backlogState.snapshot.projects[0]!.repositories[0],
      repositoryLifecycle: {
        repositoryId: "repo-azure-a5c-ai-kanban",
        branchName: "vk/task",
        reviewStatus: "unlinked",
        mergeStatus: "not-ready",
        publishStatus: "not-ready",
        ciGates: [],
        integration: {
          provider: "azure-repos",
          status: "partial-setup",
          linkState: "unlinked",
          guidance: "Select an Azure DevOps project and grant code write scopes before creating linked PRs.",
          missingScopes: ["code:write"],
          prerequisites: [],
          actions: {
            canCreatePullRequest: false,
            canManagePullRequest: false,
            canApproveFromReview: false,
            reason: "Azure Repos setup is incomplete.",
          },
        },
      },
    };

    render(<BacklogOverview />);

    expect(screen.getByText("Azure Repos partial setup")).toBeInTheDocument();
    expect(screen.getByText("Missing scopes: code:write")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create PR" })).toBeDisabled();
    expect(screen.getByText(/Linked PR creation is disabled until Azure Repos setup issues are resolved/)).toBeInTheDocument();
  });
});
