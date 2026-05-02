import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, setupUser, waitFor, within } from "@/test/test-utils";

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
const createIssueWorkspaceMock = vi.fn();
const linkIssueWorkspaceMock = vi.fn();
const refreshMock = vi.fn();
const push = vi.fn();

let creatingIssueState = false;
let searchParams = new URLSearchParams();
let issueReviewArtifacts: Array<Record<string, unknown>> = [];
const setSearchParams = vi.fn();

vi.mock("react-router-dom-v6", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom-v6")>("react-router-dom-v6");
  return {
    ...actual,
    useNavigate: () => push,
    useSearchParams: () => [searchParams, setSearchParams],
  };
});

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
    createIssueWorkspace: createIssueWorkspaceMock,
    linkIssueWorkspace: linkIssueWorkspaceMock,
    creatingIssue: creatingIssueState,
    mutationError: null,
    refresh: refreshMock,
  };
}

function buildWorkspaceInventoryPayload() {
  return {
    summary: { total: 2, active: 1, idle: 1, archived: 0, missing: 0 },
    workspaces: [
      {
        path: "/repo/worktrees/gap-007",
        name: "KANBAN-GAP-007",
        status: "active",
        missing: false,
        archivedAt: null,
        cleanedAt: null,
        lastActivityAt: "2026-04-24T14:00:00.000Z",
        git: {
          root: "/repo/main",
          commonDir: "/repo/main/.git",
          trackingBranch: "origin/vk/kanban-gap-007",
          branch: "vk/kanban-gap-007",
          head: "abc123",
          ahead: 0,
          behind: 0,
          dirty: false,
          uncommittedCount: 0,
          isWorktree: true,
          isPrimary: false,
        },
        notes: { value: "", updatedAt: null },
        links: { editorHref: "vscode://file/repo/worktrees/gap-007" },
        sessions: { total: 0, active: 0, items: [] },
        runs: { total: 0, active: 0, items: [] },
        actions: {
          canArchive: true,
          canCleanup: false,
          canRecover: false,
          canRebaseStart: false,
          canRebaseAutoResolve: false,
          canRebaseOpenInEditor: false,
          canRebaseMarkResolved: false,
          canRebaseAbort: false,
        },
        issues: [
          {
            issueId: "KANBAN-GAP-007",
            issueKey: "KANBAN-GAP-007",
            issueTitle: "Add team and collaboration primitives",
            projectId: "kanban-app",
            projectKey: "KANBAN",
            projectName: "Kanban App",
            linkedAt: "2026-04-24T14:00:00.000Z",
            source: "created-from-issue",
          },
        ],
      },
      {
        path: "/repo/worktrees/shared",
        name: "shared",
        status: "idle",
        missing: false,
        archivedAt: null,
        cleanedAt: null,
        lastActivityAt: "2026-04-24T14:00:00.000Z",
        git: {
          root: "/repo/main",
          commonDir: "/repo/main/.git",
          trackingBranch: "origin/vk/shared",
          branch: "vk/shared",
          head: "def456",
          ahead: 0,
          behind: 0,
          dirty: false,
          uncommittedCount: 0,
          isWorktree: true,
          isPrimary: false,
        },
        notes: { value: "", updatedAt: null },
        links: { editorHref: "vscode://file/repo/worktrees/shared" },
        sessions: { total: 0, active: 0, items: [] },
        runs: { total: 0, active: 0, items: [] },
        actions: {
          canArchive: true,
          canCleanup: false,
          canRecover: false,
          canRebaseStart: false,
          canRebaseAutoResolve: false,
          canRebaseOpenInEditor: false,
          canRebaseMarkResolved: false,
          canRebaseAbort: false,
        },
        issues: [],
      },
    ],
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
    artifacts: issueReviewArtifacts,
    queue: [],
    summary: { pendingCount: 0, changesRequestedCount: 0 },
    pendingArtifactId: null,
    actOnReview: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("BacklogOverview", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(buildWorkspaceInventoryPayload()), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    creatingIssueState = false;
    searchParams = new URLSearchParams();
    issueReviewArtifacts = [];
    push.mockReset();
    moveIssueMock.mockReset();
    linkRepositoryMock.mockReset();
    updateRepositorySettingsMock.mockReset();
    createPullRequestMock.mockReset();
    createIssueMock.mockReset();
    createSubIssueMock.mockReset();
    linkChildIssueMock.mockReset();
    createIssueWorkspaceMock.mockReset();
    linkIssueWorkspaceMock.mockReset();
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

    fireEvent.change(screen.getByLabelText("Issue title"), { target: { value: "Draft that should be cleared" } });

    expect(screen.getByTestId("create-issue-panel")).toBeInTheDocument();
    expect(await screen.findByText("Draft autosaved locally.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("create-issue-panel")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("board-header-create"));
    expect(screen.getByLabelText("Issue title")).toHaveValue("");
    expect(screen.getByText("Draft is empty.")).toBeInTheDocument();
  }, 10000);

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

    fireEvent.change(screen.getByLabelText("Issue title"), { target: { value: "List-view create" } });
    fireEvent.change(screen.getByLabelText("Issue summary"), { target: { value: "Keep panel beside alternate surface" } });
    fireEvent.change(screen.getByLabelText("Issue description"), {
      target: { value: "Persist authoring details through the shared mutation path." },
    });
    await user.selectOptions(screen.getByLabelText("Target column"), "in-progress");
    await user.selectOptions(screen.getByLabelText("Issue status"), "blocked");
    await user.selectOptions(screen.getByLabelText("Priority"), "high");
    await user.click(screen.getByRole("checkbox", { name: "QA Lead" }));
    await user.click(screen.getByRole("checkbox", { name: "parity" }));
    await user.click(screen.getByRole("button", { name: "Add criterion" }));
    fireEvent.change(screen.getByLabelText("Acceptance criterion 1 title"), {
      target: { value: "Shared authoring flow saves the full issue profile." },
    });
    fireEvent.change(screen.getByLabelText("Acceptance criterion 1 notes"), {
      target: { value: "Verify create and edit routes stay aligned." },
    });
    await user.click(within(panel).getByRole("button", { name: "Create issue" }));

    await waitFor(() => {
      expect(createIssueMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "kanban-app",
          title: "List-view create",
          summary: "Keep panel beside alternate surface",
          description: "Persist authoring details through the shared mutation path.",
          priority: "high",
          status: "blocked",
          assigneeIds: ["qa"],
          labelIds: ["label-parity"],
          acceptanceCriteria: [
            {
              id: undefined,
              title: "Shared authoring flow saves the full issue profile.",
              satisfied: false,
              notes: "Verify create and edit routes stay aligned.",
            },
          ],
          metadata: {
            createSource: "header",
            createWorkflowState: "in-progress",
            createMode: "board",
          },
        }),
      );
    });

    expect(screen.getByText("Created KANBAN-AUTO-101 from board header create mode.")).toBeInTheDocument();
  }, 15000);

  it("surfaces partial-save failure state and preserves the draft for retry", async () => {
    const user = setupUser();
    createIssueMock.mockRejectedValue(new Error("Backend unavailable"));

    render(<BacklogOverview />);

    await user.click(screen.getByTestId("board-header-create"));
    fireEvent.change(screen.getByLabelText("Issue title"), { target: { value: "Retry me" } });
    fireEvent.change(screen.getByLabelText("Issue summary"), {
      target: { value: "Draft should remain after failure" },
    });
    await user.click(within(screen.getByTestId("create-issue-panel")).getByRole("button", { name: "Create issue" }));

    await waitFor(() => {
      expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    });

    expect(
      await screen.findByText("Issue save failed. Draft preserved locally for retry.", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
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

  it("renders the dedicated issue route mode for a focused issue", () => {
    render(<BacklogOverview routeMode="issue" initialIssueId="KANBAN-GAP-007" />);

    expect(screen.getByTestId("issue-detail-route")).toBeInTheDocument();
    expect(screen.getByText(/Dedicated issue routes now sit beside the board/)).toBeInTheDocument();
  });

  it("renders the dedicated create route mode and redirects to the created issue", async () => {
    const user = setupUser();
    createIssueMock.mockResolvedValue({
      issue: {
        id: "KANBAN-AUTO-201",
        projectId: "kanban-app",
        key: "KANBAN-AUTO-201",
        title: "Create route issue",
      },
      overview: backlogState,
    });

    render(<BacklogOverview routeMode="create" initialProjectId="kanban-app" />);

    expect(screen.getByTestId("issue-create-route")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Issue title"), "Create route issue");
    await user.click(screen.getByRole("button", { name: "Create issue" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/projects/kanban-app/issues/KANBAN-AUTO-201");
    });
  });

  it("renders parent and child relationship controls for the focused issue", () => {
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    render(<BacklogOverview />);

    const dispatchPanel = screen.getByTestId("issue-dispatch-context-panel");
    expect(screen.getByTestId("issue-detail-panel")).toBeInTheDocument();
    expect(screen.getByTestId("issue-description-editor")).toHaveValue(
      "# Current state\n- [ ] Capture parity behavior",
    );
    expect(screen.getAllByText("parity").length).toBeGreaterThan(0);
    expect(screen.getByTestId("issue-relationship-panel")).toBeInTheDocument();
    expect(dispatchPanel).toBeInTheDocument();
    expect(within(dispatchPanel).getByText("Dispatch Context Labels")).toBeInTheDocument();
    expect(within(dispatchPanel).getAllByText("tests_first").length).toBeGreaterThan(0);
    expect(screen.getByTestId("child-nav-KANBAN-GAP-008")).toBeInTheDocument();
    expect(screen.getByTestId("create-sub-issue-form")).toBeInTheDocument();
    expect(screen.getByTestId("link-child-issue-form")).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: /KANBAN-GAP-009/i }).length).toBeGreaterThan(0);
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

  it("renders multiple linked workspaces and navigates to a linked workspace shell", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    backlogState = {
      ...buildBacklogState(),
      snapshot: {
        ...buildBacklogState().snapshot,
        issues: buildBacklogState().snapshot.issues.map((issue) =>
          issue.id === "KANBAN-GAP-007"
            ? {
                ...issue,
                workspaceLinks: [
                  {
                    workspacePath: "/repo/worktrees/gap-007",
                    workspaceName: "KANBAN-GAP-007",
                    branchName: "vk/kanban-gap-007",
                    linkedAt: "2026-04-24T14:00:00.000Z",
                    source: "created-from-issue",
                  },
                  {
                    workspacePath: "/repo/worktrees/shared",
                    workspaceName: "shared",
                    branchName: "vk/shared",
                    linkedAt: "2026-04-24T15:00:00.000Z",
                    source: "linked-existing-workspace",
                  },
                ],
              }
            : issue,
        ),
      },
    };

    render(<BacklogOverview />);

    const linkedWorkspaces = await screen.findByTestId("linked-workspaces-list");
    expect(linkedWorkspaces).toBeInTheDocument();
    expect(within(linkedWorkspaces).getByText("KANBAN-GAP-007")).toBeInTheDocument();
    expect(within(linkedWorkspaces).getByText("shared")).toBeInTheDocument();

    await user.click(screen.getByTestId("open-workspace-/repo/worktrees/gap-007"));
    expect(push).toHaveBeenCalledWith("/workspaces?workspace=%2Frepo%2Fworktrees%2Fgap-007");
  });

  it("opens the issue-scoped workspace create route from the issue panel", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    render(<BacklogOverview />);

    const workspacePanel = await screen.findByTestId("issue-workspace-panel");
    await user.click(within(workspacePanel).getByRole("button", { name: "Create workspace" }));
    expect(push).toHaveBeenCalledWith("/projects/kanban-app/issues/KANBAN-GAP-007/workspace/new");
  });

  it("opens issue workspace linking controls directly from the board card", async () => {
    const user = setupUser();

    render(<BacklogOverview projectId="kanban-app" forcedPresentation="board" />);

    await user.click(await screen.findByTestId("link-existing-KANBAN-GAP-007"));

    expect(push).toHaveBeenCalledWith("/?issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
  });

  it("opens the primary linked workspace directly from the board card", async () => {
    const user = setupUser();
    backlogState = {
      ...buildBacklogState(),
      snapshot: {
        ...buildBacklogState().snapshot,
        issues: buildBacklogState().snapshot.issues.map((issue) =>
          issue.id === "KANBAN-GAP-007"
            ? {
                ...issue,
                workspaceLinks: [
                  {
                    workspacePath: "/repo/worktrees/gap-007",
                    workspaceName: "KANBAN-GAP-007",
                    branchName: "vk/kanban-gap-007",
                    linkedAt: "2026-04-24T14:00:00.000Z",
                    source: "created-from-issue",
                  },
                ],
              }
            : issue,
        ),
      },
    };

    render(<BacklogOverview projectId="kanban-app" forcedPresentation="board" />);

    await user.click(await screen.findByTestId("open-linked-workspace-KANBAN-GAP-007"));

    expect(push).toHaveBeenCalledWith("/workspaces?workspace=%2Frepo%2Fworktrees%2Fgap-007");
  });

  it("links an existing workspace from the issue panel", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    linkIssueWorkspaceMock.mockResolvedValue(undefined);

    render(<BacklogOverview />);

    await user.selectOptions(await screen.findByLabelText("Existing workspace"), "/repo/worktrees/shared");
    await user.click(screen.getByRole("button", { name: "Link workspace" }));

    expect(linkIssueWorkspaceMock).toHaveBeenCalledWith({
      issueId: "KANBAN-GAP-007",
      workspacePath: "/repo/worktrees/shared",
    });
  });

  it("shows a stale linked workspace recovery state", async () => {
    const user = setupUser();
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 0, active: 0, idle: 0, archived: 0, missing: 0 },
        workspaces: [],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    backlogState = {
      ...buildBacklogState(),
      snapshot: {
        ...buildBacklogState().snapshot,
        issues: buildBacklogState().snapshot.issues.map((issue) =>
          issue.id === "KANBAN-GAP-007"
            ? {
                ...issue,
                workspaceLinks: [
                  {
                    workspacePath: "/repo/worktrees/missing",
                    workspaceName: "missing",
                    linkedAt: "2026-04-24T15:00:00.000Z",
                    source: "linked-existing-workspace",
                  },
                ],
              }
            : issue,
        ),
      },
    };

    render(<BacklogOverview />);

    expect(await screen.findByText("stale link")).toBeInTheDocument();
    await user.click(screen.getByTestId("recover-workspace-/repo/worktrees/missing"));
    expect(push).toHaveBeenCalledWith("/workspaces");
  });

  it("shows workspace inventory loading and error states inside the issue panel", async () => {
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<BacklogOverview />);
    expect(await screen.findByTestId("issue-workspace-loading")).toBeInTheDocument();

    resolveFetch?.(
      new Response(JSON.stringify({ error: "Workspace API unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );

    expect(await screen.findByTestId("issue-workspace-error")).toHaveTextContent(
      "Workspace API unavailable",
    );
  });

  it("keeps the issue detail panel beside list view when an issue is opened from list context", () => {
    localStorage.setItem("kanban:backlog-presentation", JSON.stringify("list"));
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");

    render(<BacklogOverview />);

    expect(screen.getByTestId("kanban-list")).toBeInTheDocument();
    expect(screen.getByTestId("issue-detail-panel")).toBeInTheDocument();
  });

  it("does not hit a hook-order crash when board data loads after the initial loading state", () => {
    backlogState = {
      ...buildBacklogState(),
      snapshot: null,
      board: null,
      summary: null,
      loading: true,
      error: null,
    };

    const view = render(<BacklogOverview projectId="kanban-app" forcedPresentation="board" />);
    expect(screen.getByTestId("backlog-overview-loading")).toBeInTheDocument();

    backlogState = buildBacklogState();
    view.rerender(<BacklogOverview projectId="kanban-app" forcedPresentation="board" />);

    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();
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

  it("surfaces linked review output on the focused issue detail panel", () => {
    searchParams = new URLSearchParams("issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007");
    issueReviewArtifacts = [
      {
        id: "issue-review-1",
        targetType: "issue",
        targetId: "KANBAN-GAP-007",
        targetLabel: "KANBAN-GAP-007",
        title: "Issue review",
        decision: "changes-requested",
        queueState: "in-review",
        updatedAt: "2026-04-24T14:00:00.000Z",
        linkedPullRequest: {
          provider: "github",
          status: "in-review",
          linkState: "linked",
          title: "Add team and collaboration primitives",
          number: 712,
          reviewStatus: "changes-requested",
          mergeStatus: "blocked",
          publishStatus: "not-ready",
          ciGates: [{ id: "ci-tests", name: "Tests", required: true, status: "pending" }],
          integrationStatus: "connected",
        },
        diff: [],
        comments: [
          {
            id: "comment-1",
            author: { kind: "agent", name: "reviewer" },
            body: "Map this review output directly onto the active issue.",
            createdAt: "2026-04-24T14:00:00.000Z",
            status: "open",
            anchor: {
              fileId: "file-1",
              filePath: "packages/agent-mux/webui/src/components/dashboard/backlog-overview.tsx",
              hunkId: "hunk-1",
              side: "head",
              line: 1500,
            },
          },
        ],
      },
    ];

    render(<BacklogOverview />);

    expect(screen.getByText("Review and PR context")).toBeInTheDocument();
    expect(screen.getByText("PR review changes-requested")).toBeInTheDocument();
    expect(screen.getByText("Tests: Pending")).toBeInTheDocument();
    expect(screen.getByText("Map this review output directly onto the active issue.")).toBeInTheDocument();
  });

  it("uses project-scoped routes for presentation toggles and focused issue navigation", async () => {
    const user = setupUser();

    render(
      <BacklogOverview
        projectId="kanban-app"
        routeBasePath="/projects/kanban-app"
        forcedPresentation="board"
      />,
    );

    await user.click(screen.getByRole("button", { name: "List view" }));
    expect(push).toHaveBeenCalledWith("/projects/kanban-app/list");

    push.mockReset();
    await user.click(screen.getByTestId("board-header-create-workspace"));
    expect(push).toHaveBeenCalledWith("/projects/kanban-app/workspaces/new");

    push.mockReset();
    await user.click(screen.getByTestId("open-issue-KANBAN-GAP-007"));
    expect(push).toHaveBeenCalledWith(
      "/projects/kanban-app/board?issueId=KANBAN-GAP-007&issueKey=KANBAN-GAP-007",
    );
  });

  it("keeps supporting context collapsed so the board remains the primary surface", () => {
    render(
      <BacklogOverview
        projectId="kanban-app"
        routeBasePath="/projects/kanban-app"
        forcedPresentation="board"
      />,
    );

    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();

    const supportingSummary = screen.getByText("Supporting context");
    const supportingDetails = supportingSummary.closest("details");

    expect(supportingDetails).toBeInTheDocument();
    expect(supportingDetails).not.toHaveAttribute("open");
  });

  it("keeps board metrics tucked inside the advanced controls block", () => {
    render(
      <BacklogOverview
        projectId="kanban-app"
        routeBasePath="/projects/kanban-app"
        forcedPresentation="board"
      />,
    );

    const summary = screen.getByText("Board controls");
    const details = summary.closest("details");

    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute("open");
    expect(screen.queryByText("Open filters, triage, and bulk actions only when you need them")).toBeInTheDocument();
  });

  it("keeps the review queue collapsed until it is explicitly opened", () => {
    render(<BacklogOverview />);

    const details = screen.getByTestId("board-review-details");

    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute("open");
  });

  it("keeps advanced board controls collapsed by default", () => {
    render(<BacklogOverview />);

    const controlsSummary = screen.getByText("Board controls");
    const controlsDetails = controlsSummary.closest("details");

    expect(controlsDetails).toBeInTheDocument();
    expect(controlsDetails).not.toHaveAttribute("open");
    expect(screen.getByLabelText("Workflow filter")).not.toBeVisible();
    expect(screen.getByLabelText("Readiness filter")).not.toBeVisible();
  });

  it("filters cards by assignee and applies bulk move to the visible selection", async () => {
    const user = setupUser();
    render(<BacklogOverview />);

    await user.click(screen.getByText("Board controls"));
    expect(screen.getByLabelText("Workflow filter")).toBeVisible();
    await user.selectOptions(screen.getByLabelText("Assignee filter"), "tal");

    expect(screen.getByTestId("kanban-card-KANBAN-GAP-007")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-card-KANBAN-GAP-008")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Select visible issues"));
    await user.click(screen.getByRole("button", { name: "Move selected" }));

    expect(moveIssueMock).toHaveBeenCalledWith("KANBAN-GAP-007", "in-progress");
    expect(screen.getByText(/Moved 1 issue to In Progress\./)).toBeInTheDocument();
  });

  it("keeps selection and move controls available in list view parity mode", async () => {
    const user = setupUser();

    render(
      <BacklogOverview
        projectId="kanban-app"
        routeBasePath="/projects/kanban-app"
        forcedPresentation="list"
      />,
    );

    expect(screen.getByTestId("kanban-list")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Select KANBAN-GAP-007"));
    expect(screen.getAllByText("1 selected").length).toBeGreaterThan(0);

    await user.click(screen.getByTestId("move-list-KANBAN-GAP-007-in-progress"));
    expect(moveIssueMock).toHaveBeenCalledWith("KANBAN-GAP-007", "in-progress");
  });
});
