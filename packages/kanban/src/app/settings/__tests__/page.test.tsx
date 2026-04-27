import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, render, screen, setupUser, waitFor, within } from "@/test/test-utils";

import SettingsPage from "../page";

const loadTaskTagsMock = vi.fn();
const createTaskTagMock = vi.fn();
const updateTaskTagMock = vi.fn();
const deleteTaskTagMock = vi.fn();
const createDispatchContextLabelMock = vi.fn();
const updateDispatchContextLabelMock = vi.fn();
const deleteDispatchContextLabelMock = vi.fn();
const refreshMock = vi.fn();
const updateProjectCollaborationMock = vi.fn();
const updateRepositorySettingsMock = vi.fn();
const requestPermissionMock = vi.fn();

let snapshot = {
  projects: [
    {
      id: "kanban-app",
      team: {
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
        activityScope: "project-and-issues",
        workspaceProvisioning: "owners-maintainers",
      },
      repositories: [
        {
          id: "repo-github-a5c-ai-babysitter",
          fullName: "a5c-ai/babysitter",
          settings: {
            baseBranch: "main",
            ciProvider: "GitHub Actions",
            publishTarget: "npm",
            autoMerge: false,
            requiredApprovals: 1,
          },
        },
      ],
      integrations: [
        {
          provider: "github",
          label: "GitHub",
          status: "connected",
          accountLabel: "a5c-ai",
          guidance: "GitHub is ready for linked PR flows.",
          prerequisites: [{ key: "github-auth", label: "GitHub auth", satisfied: true }],
          actions: {
            canCreatePullRequest: true,
            canManagePullRequest: true,
            canApproveFromReview: true,
          },
        },
        {
          provider: "azure-repos",
          label: "Azure Repos",
          status: "partial-setup",
          accountLabel: "Boards Platform",
          guidance: "Complete Azure project binding before linked PR actions can be enabled.",
          missingScopes: ["code:write"],
          prerequisites: [
            { key: "azure-auth", label: "Azure auth", satisfied: true },
            {
              key: "azure-project",
              label: "Default project selected",
              satisfied: false,
              guidance: "Pick the project that owns the target repo.",
            },
          ],
          actions: {
            canCreatePullRequest: false,
            canManagePullRequest: false,
            canApproveFromReview: false,
            reason: "Azure Repos setup is incomplete.",
          },
        },
      ],
      permissions: [
        {
          action: "manage-project-settings",
          description: "Elevated roles only.",
          roles: ["owner", "maintainer"],
        },
      ],
      activity: [
        {
          id: "activity-1",
          actor: { displayName: "Tal Muskal" },
          createdAt: "2026-04-24T12:00:00.000Z",
          summary: "Updated shared team settings, roster, and permission policy.",
        },
      ],
    },
  ],
  dispatchContextLabels: [
    {
      id: "dispatch-context-label-1",
      key: "tests_first",
      label: "Tests First",
      description: "Keep verification ahead of implementation.",
      instruction: "Write or update deterministic verification before editing runtime code.",
    },
  ],
  issues: [
    {
      id: "issue-1",
      key: "KANBAN-GAP-004",
      repositoryLifecycle: {
        repositoryId: "repo-github-a5c-ai-babysitter",
      },
      dispatch: {
        contextLabels: [{ labelId: "dispatch-context-label-1" }],
        renderedContext:
          "Tests First: Write or update deterministic verification before editing runtime code.",
      },
    },
    {
      id: "issue-2",
      key: "KANBAN-GAP-099",
      dispatch: {
        contextLabels: [],
        renderedContext: "",
      },
    },
  ],
};

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href?: string;
    children?: unknown;
    [key: string]: unknown;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@a5c-ai/compendium", () => ({
  LogoWordmark: (props: Record<string, unknown>) => <div {...props}>Babysitter</div>,
}));

vi.mock("@/components/ui/button", async () => {
  const React = await import("react");

  return {
    Button: ({
      asChild,
      children,
      ...props
    }: {
      asChild?: boolean;
      children?: React.ReactNode;
      [key: string]: unknown;
    }) =>
      asChild && React.isValidElement(children)
        ? React.cloneElement(children, props)
        : <button {...props}>{children}</button>,
  };
});

vi.mock("lucide-react", () => ({
  Activity: () => <svg aria-hidden="true" />,
  AlertTriangle: () => <svg aria-hidden="true" />,
  Boxes: () => <svg aria-hidden="true" />,
  Cpu: () => <svg aria-hidden="true" />,
  Network: () => <svg aria-hidden="true" />,
  ServerCog: () => <svg aria-hidden="true" />,
  ShieldCheck: () => <svg aria-hidden="true" />,
  Users: () => <svg aria-hidden="true" />,
}));

vi.mock("@/components/agent-mux/gateway-provider", () => ({
  useGatewayAuth: () => ({
    auth: null,
    logout: vi.fn(),
    isAuthenticated: false,
  }),
}));

vi.mock("@/hooks/use-backlog", () => ({
  useBacklog: () => ({
    snapshot,
    refresh: refreshMock,
    loading: false,
    error: null,
    updateProjectCollaboration: updateProjectCollaborationMock,
    updateRepositorySettings: updateRepositorySettingsMock,
  }),
  loadTaskTags: (...args: unknown[]) => loadTaskTagsMock(...args),
  createTaskTag: (...args: unknown[]) => createTaskTagMock(...args),
  updateTaskTag: (...args: unknown[]) => updateTaskTagMock(...args),
  deleteTaskTag: (...args: unknown[]) => deleteTaskTagMock(...args),
  createDispatchContextLabel: (...args: unknown[]) => createDispatchContextLabelMock(...args),
  updateDispatchContextLabel: (...args: unknown[]) => updateDispatchContextLabelMock(...args),
  deleteDispatchContextLabel: (...args: unknown[]) => deleteDispatchContextLabelMock(...args),
}));

vi.mock("@/lib/agent-mux-ui", () => ({
  useConnection: () => ({
    status: "disconnected",
    error: null,
  }),
  useGateway: () => ({
    store: {
      getState: () => ({
        agents: { items: [] },
        sessions: { byId: {} },
        runs: { byId: {} },
      }),
      subscribe: () => () => undefined,
    },
  }),
}));

vi.mock("@/components/notifications/notification-provider", () => ({
  useNotificationContext: () => ({
    notifications: [],
    permission: "default",
    requestPermission: requestPermissionMock,
  }),
}));

vi.mock("@/components/shared/theme-provider", () => ({
  useTheme: () => ({
    theme: "dark",
  }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    loadTaskTagsMock.mockReset();
    createTaskTagMock.mockReset();
    updateTaskTagMock.mockReset();
    deleteTaskTagMock.mockReset();
    createDispatchContextLabelMock.mockReset();
    updateDispatchContextLabelMock.mockReset();
    deleteDispatchContextLabelMock.mockReset();
    refreshMock.mockReset();
    updateProjectCollaborationMock.mockReset();
    updateRepositorySettingsMock.mockReset();
    requestPermissionMock.mockReset();

    snapshot = {
      projects: [
        {
          id: "kanban-app",
          team: {
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
            activityScope: "project-and-issues",
            workspaceProvisioning: "owners-maintainers",
          },
          repositories: [
            {
              id: "repo-github-a5c-ai-babysitter",
              fullName: "a5c-ai/babysitter",
              settings: {
                baseBranch: "main",
                ciProvider: "GitHub Actions",
                publishTarget: "npm",
                autoMerge: false,
                requiredApprovals: 1,
              },
            },
          ],
          integrations: [
            {
              provider: "github",
              label: "GitHub",
              status: "connected",
              accountLabel: "a5c-ai",
              guidance: "GitHub is ready for linked PR flows.",
              prerequisites: [{ key: "github-auth", label: "GitHub auth", satisfied: true }],
              actions: {
                canCreatePullRequest: true,
                canManagePullRequest: true,
                canApproveFromReview: true,
              },
            },
            {
              provider: "azure-repos",
              label: "Azure Repos",
              status: "partial-setup",
              accountLabel: "Boards Platform",
              guidance: "Complete Azure project binding before linked PR actions can be enabled.",
              missingScopes: ["code:write"],
              prerequisites: [
                { key: "azure-auth", label: "Azure auth", satisfied: true },
                {
                  key: "azure-project",
                  label: "Default project selected",
                  satisfied: false,
                  guidance: "Pick the project that owns the target repo.",
                },
              ],
              actions: {
                canCreatePullRequest: false,
                canManagePullRequest: false,
                canApproveFromReview: false,
                reason: "Azure Repos setup is incomplete.",
              },
            },
          ],
          permissions: [
            {
              action: "manage-project-settings",
              description: "Elevated roles only.",
              roles: ["owner", "maintainer"],
            },
          ],
          activity: [
            {
              id: "activity-1",
              actor: { displayName: "Tal Muskal" },
              createdAt: "2026-04-24T12:00:00.000Z",
              summary: "Updated shared team settings, roster, and permission policy.",
            },
          ],
        },
      ],
      dispatchContextLabels: [
        {
          id: "dispatch-context-label-1",
          key: "tests_first",
          label: "Tests First",
          description: "Keep verification ahead of implementation.",
          instruction: "Write or update deterministic verification before editing runtime code.",
        },
      ],
      issues: [
        {
          id: "issue-1",
          key: "KANBAN-GAP-004",
          repositoryLifecycle: {
            repositoryId: "repo-github-a5c-ai-babysitter",
          },
          dispatch: {
            contextLabels: [{ labelId: "dispatch-context-label-1" }],
            renderedContext:
              "Tests First: Write or update deterministic verification before editing runtime code.",
          },
        },
        {
          id: "issue-2",
          key: "KANBAN-GAP-099",
          dispatch: {
            contextLabels: [],
            renderedContext: "",
          },
        },
      ],
    };

    loadTaskTagsMock.mockResolvedValue([
      {
        id: "task-tag-1",
        key: "bug_report",
        label: "Bug Report",
        description: "Capture reproduction steps and impact.",
        content: "Describe the bug, expected behavior, and steps to reproduce.",
        order: 0,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
      {
        id: "task-tag-2",
        key: "deployment_validation",
        label: "Deployment Validation",
        description: "Release checklist.",
        content: "Run smoke tests and validate rollback readiness.",
        order: 1,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
    ]);
    createDispatchContextLabelMock.mockResolvedValue({ dispatchContextLabels: [] });
    updateDispatchContextLabelMock.mockResolvedValue({ dispatchContextLabels: [] });
    deleteDispatchContextLabelMock.mockResolvedValue({ dispatchContextLabels: [] });
    refreshMock.mockResolvedValue(undefined);
    updateProjectCollaborationMock.mockResolvedValue(undefined);
    updateRepositorySettingsMock.mockResolvedValue(undefined);
  });

  it("renders the expanded section nav and general settings by default", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    expect(screen.getByTestId("settings-nav-general")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-repositories-projects")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-organization")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-remote-project")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-agent-configuration")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-mcp-servers")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-editor-integration")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-git")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-notifications")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-task-tags")).toBeInTheDocument();
    expect(screen.getByTestId("settings-nav-keyboard-shortcuts")).toBeInTheDocument();

    const generalSection = screen.getByTestId("general-settings");
    expect(within(generalSection).getByText("General settings")).toBeInTheDocument();
    expect(within(generalSection).getByText("~/.a5c/kanban.json")).toBeInTheDocument();
    expect(within(generalSection).getByText("~/.a5c/kanban-settings-sections.json")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-organization"));

    const organizationSection = screen.getByTestId("organization-settings");
    expect(within(organizationSection).getByText("Organization settings")).toBeInTheDocument();
    expect(within(organizationSection).getByText("Kanban Core (2 members)")).toBeInTheDocument();
    expect(within(organizationSection).getByText("owners-maintainers")).toBeInTheDocument();
    expect(within(organizationSection).getByText("manage-project-settings")).toBeInTheDocument();
  });

  it("renders remote-project guidance and blocked action states", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-remote-project"));

    const remoteSection = screen.getByTestId("remote-project-settings");
    expect(within(remoteSection).getByText("Remote-project settings")).toBeInTheDocument();
    expect(within(remoteSection).getByText("GitHub")).toBeInTheDocument();
    expect(within(remoteSection).getByText("Azure Repos")).toBeInTheDocument();
    expect(within(remoteSection).getByText("partial setup")).toBeInTheDocument();
    expect(within(remoteSection).getByText("Missing scopes: code:write")).toBeInTheDocument();
    expect(within(remoteSection).getByText(/Blocked actions: create linked PRs/)).toBeInTheDocument();
    expect(within(remoteSection).getByText("Pick the project that owns the target repo.")).toBeInTheDocument();
    expect(screen.getByTestId("missing-host-context")).toBeInTheDocument();
  });

  it("renders dedicated editor, git, notifications, and keyboard shortcut sections", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-editor-integration"));
    expect(screen.getByTestId("editor-integration-settings")).toBeInTheDocument();
    expect(screen.getByText("Ctrl/Cmd + K")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open workspaces" })).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-git"));
    expect(screen.getByTestId("git-settings")).toBeInTheDocument();
    expect(screen.getByText("Auto-merge enabled")).toBeInTheDocument();
    expect(screen.getByText("a5c-ai/babysitter")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-notifications"));
    expect(screen.getByTestId("notification-settings")).toBeInTheDocument();
    expect(screen.getByText("Browser notification permission pending")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enable browser notifications" }),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-keyboard-shortcuts"));
    expect(screen.getByTestId("keyboard-shortcut-settings")).toBeInTheDocument();
    expect(screen.getByText("Keyboard shortcut settings")).toBeInTheDocument();
    expect(screen.getByText("Show this help")).toBeInTheDocument();
    expect(screen.getByText("Toggle workspace sidebar")).toBeInTheDocument();
  });

  it("loads and renders reusable Task Tags in deterministic order", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-task-tags"));
    const taskTagSection = screen.getByTestId("task-tag-settings");
    await waitFor(() => expect(loadTaskTagsMock).toHaveBeenCalledTimes(1));

    expect(within(taskTagSection).getByText("Task Tags")).toBeInTheDocument();
    expect(within(taskTagSection).getByText("2")).toBeInTheDocument();
    const taskTagCards = within(taskTagSection).getAllByTestId(/task-tag-item-/);
    expect(taskTagCards).toHaveLength(2);
    expect(within(taskTagCards[0]!).getByText("Bug Report")).toBeInTheDocument();
    expect(within(taskTagCards[1]!).getByText("Deployment Validation")).toBeInTheDocument();
  });

  it("validates and creates a new Task Tag from Settings", async () => {
    const user = setupUser();
    createTaskTagMock.mockResolvedValue({
      taskTags: [
        {
          id: "task-tag-1",
          key: "bug_report",
          label: "Bug Report",
          description: "Capture reproduction steps and impact.",
          content: "Describe the bug, expected behavior, and steps to reproduce.",
          order: 0,
          createdAt: "2026-04-24T12:00:00.000Z",
          updatedAt: "2026-04-24T12:00:00.000Z",
        },
        {
          id: "task-tag-3",
          key: "release_notes",
          label: "Release Notes",
          description: "Prepare the release summary.",
          content: "Summarize changes, risk, rollout plan, and rollback plan.",
          order: 1,
          createdAt: "2026-04-24T12:00:00.000Z",
          updatedAt: "2026-04-24T12:00:00.000Z",
        },
      ],
    });

    render(<SettingsPage />);
    await user.click(screen.getByTestId("settings-nav-task-tags"));
    await waitFor(() => expect(loadTaskTagsMock).toHaveBeenCalledTimes(1));

    await user.clear(screen.getByLabelText("Task Tag key"));
    await user.type(screen.getByLabelText("Task Tag key"), "Release Notes");
    await user.click(screen.getByRole("button", { name: "Create Task Tag" }));

    expect(
      await screen.findByText("Key must use lowercase snake_case."),
    ).toBeInTheDocument();
    expect(createTaskTagMock).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Task Tag key"));
    await user.type(screen.getByLabelText("Task Tag key"), "bug_report");
    await user.click(screen.getByRole("button", { name: "Create Task Tag" }));

    expect(await screen.findByText("Key bug_report already exists.")).toBeInTheDocument();
    expect(createTaskTagMock).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Task Tag key"));
    await user.type(screen.getByLabelText("Task Tag key"), "release_notes");
    await user.type(screen.getByLabelText("Task Tag label"), "Release Notes");
    await user.type(
      screen.getByLabelText("Task Tag description"),
      "Prepare the release summary.",
    );
    await user.type(
      screen.getByLabelText("Task Tag content"),
      "Summarize changes, risk, rollout plan, and rollback plan.",
    );
    await user.click(screen.getByRole("button", { name: "Create Task Tag" }));

    await waitFor(() =>
      expect(createTaskTagMock).toHaveBeenCalledWith({
        key: "release_notes",
        label: "Release Notes",
        description: "Prepare the release summary.",
        content: "Summarize changes, risk, rollout plan, and rollback plan.",
        order: 2,
      }),
    );
    expect(await screen.findByText("Created @release_notes.")).toBeInTheDocument();
    expect(screen.getByText("Release Notes")).toBeInTheDocument();
  });

  it("supports editing, reordering, and deleting Task Tags", async () => {
    const user = setupUser();
    updateTaskTagMock
      .mockResolvedValueOnce({
        taskTags: [
          {
            id: "task-tag-1",
            key: "bug_report",
            label: "Bug Report",
            description: "Capture reproduction steps and impact.",
            content: "Describe the bug, expected behavior, and steps to reproduce.",
            order: 0,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
          {
            id: "task-tag-2",
            key: "deployment_validation",
            label: "Ship Validation",
            description: "Release checklist.",
            content: "Run smoke tests and validate rollback readiness.",
            order: 1,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        taskTags: [
          {
            id: "task-tag-2",
            key: "deployment_validation",
            label: "Ship Validation",
            description: "Release checklist.",
            content: "Run smoke tests and validate rollback readiness.",
            order: 0,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
          {
            id: "task-tag-1",
            key: "bug_report",
            label: "Bug Report",
            description: "Capture reproduction steps and impact.",
            content: "Describe the bug, expected behavior, and steps to reproduce.",
            order: 1,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        taskTags: [
          {
            id: "task-tag-2",
            key: "deployment_validation",
            label: "Ship Validation",
            description: "Release checklist.",
            content: "Run smoke tests and validate rollback readiness.",
            order: 0,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
          {
            id: "task-tag-1",
            key: "bug_report",
            label: "Bug Report",
            description: "Capture reproduction steps and impact.",
            content: "Describe the bug, expected behavior, and steps to reproduce.",
            order: 1,
            createdAt: "2026-04-24T12:00:00.000Z",
            updatedAt: "2026-04-24T12:00:00.000Z",
          },
        ],
      });
    deleteTaskTagMock.mockResolvedValue({
      taskTags: [
        {
          id: "task-tag-2",
          key: "deployment_validation",
          label: "Ship Validation",
          description: "Release checklist.",
          content: "Run smoke tests and validate rollback readiness.",
          order: 0,
          createdAt: "2026-04-24T12:00:00.000Z",
          updatedAt: "2026-04-24T12:00:00.000Z",
        },
      ],
    });

    render(<SettingsPage />);
    await user.click(screen.getByTestId("settings-nav-task-tags"));
    await waitFor(() => expect(loadTaskTagsMock).toHaveBeenCalledTimes(1));

    await user.click(screen.getAllByRole("button", { name: "Edit" })[1]!);
    const labelInput = screen.getByLabelText("Task Tag label");
    await user.clear(labelInput);
    await user.type(labelInput, "Ship Validation");
    await user.click(screen.getByRole("button", { name: "Save Task Tag" }));

    await waitFor(() =>
      expect(updateTaskTagMock).toHaveBeenNthCalledWith(
        1,
        "task-tag-2",
        expect.objectContaining({ label: "Ship Validation" }),
      ),
    );
    expect(await screen.findByText("Updated @deployment_validation.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Move Ship Validation up" }));
    await waitFor(() =>
      expect(updateTaskTagMock).toHaveBeenNthCalledWith(2, "task-tag-2", { order: 0 }),
    );
    await waitFor(() =>
      expect(updateTaskTagMock).toHaveBeenNthCalledWith(3, "task-tag-1", { order: 1 }),
    );
    expect(await screen.findByText("Updated Task Tag order.")).toBeInTheDocument();

    await user.click(
      within(screen.getByTestId("task-tag-item-task-tag-1")).getByRole("button", {
        name: "Delete",
      }),
    );
    await waitFor(() => expect(deleteTaskTagMock).toHaveBeenCalledWith("task-tag-1"));
    expect(await screen.findByText("Deleted @bug_report.")).toBeInTheDocument();
  });

  it("renders dispatch context label definitions and attached issue projections", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-repositories-projects"));
    const dispatchSection = screen.getByTestId("dispatch-context-label-settings");
    expect(within(dispatchSection).getByText("Dispatch Context Labels")).toBeInTheDocument();
    expect(within(dispatchSection).getByText("Tests First")).toBeInTheDocument();
    expect(within(dispatchSection).getByText("tests_first")).toBeInTheDocument();
    expect(within(dispatchSection).getByText("1 issue")).toBeInTheDocument();
    expect(
      within(dispatchSection).getByText(
        "Write or update deterministic verification before editing runtime code.",
      ),
    ).toBeInTheDocument();
    expect(within(dispatchSection).getByText("KANBAN-GAP-004")).toBeInTheDocument();
  });

  it("creates a reusable dispatch context label definition", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-repositories-projects"));

    await user.type(screen.getByLabelText("Dispatch Context Label key"), "ui_copy_review");
    await user.type(screen.getByLabelText("Dispatch Context Label name"), "UI Copy Review");
    await user.type(
      screen.getByLabelText("Dispatch Context Label description"),
      "Prompt a copy pass before shipping text changes.",
    );
    await user.type(
      screen.getByLabelText("Dispatch Context Label instruction"),
      "Review user-facing strings before finalizing the change.",
    );
    await user.click(screen.getByRole("button", { name: "Create Dispatch Context Label" }));

    expect(createDispatchContextLabelMock).toHaveBeenCalledWith({
      key: "ui_copy_review",
      label: "UI Copy Review",
      description: "Prompt a copy pass before shipping text changes.",
      instruction: "Review user-facing strings before finalizing the change.",
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.getByText("Created Dispatch Context Label definition.")).toBeInTheDocument();
  });

  it("edits an existing reusable dispatch context label definition", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-repositories-projects"));

    await user.click(screen.getByRole("button", { name: "Edit definition" }));
    await user.clear(screen.getByLabelText("Dispatch Context Label name tests_first"));
    await user.type(
      screen.getByLabelText("Dispatch Context Label name tests_first"),
      "Tests Before Code",
    );
    await user.click(screen.getByRole("button", { name: "Save definition" }));

    expect(updateDispatchContextLabelMock).toHaveBeenCalledWith(
      "dispatch-context-label-1",
      {
        key: "tests_first",
        label: "Tests Before Code",
        description: "Keep verification ahead of implementation.",
        instruction: "Write or update deterministic verification before editing runtime code.",
      },
    );
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.getByText("Updated Dispatch Context Label definition.")).toBeInTheDocument();
  });

  it("deletes a reusable dispatch context label definition", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-repositories-projects"));

    await user.click(screen.getByRole("button", { name: "Delete definition" }));

    expect(deleteDispatchContextLabelMock).toHaveBeenCalledWith(
      "dispatch-context-label-1",
    );
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.getByText("Deleted Dispatch Context Label definition.")).toBeInTheDocument();
  });

  it("blocks section switching when repositories/projects drafts are dirty", async () => {
    const user = setupUser();
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-repositories-projects"));
    const baseBranchInput = screen.getByLabelText("Base branch");
    await user.clear(baseBranchInput);
    await user.type(baseBranchInput, "release/next");
    await user.click(screen.getByTestId("settings-nav-organization"));

    expect(screen.getByTestId("settings-dirty-switch-guard")).toBeInTheDocument();
    expect(screen.getByTestId("repositories-projects-settings")).toBeInTheDocument();

    await user.click(
      within(screen.getByTestId("settings-dirty-switch-guard")).getByRole("button", {
        name: "Discard changes",
      }),
    );
    expect(screen.getByTestId("organization-settings")).toBeInTheDocument();
  });

  it("renders explicit missing project and organization context states", async () => {
    const user = setupUser();
    snapshot.projects = [];
    render(<SettingsPage />);

    await user.click(screen.getByTestId("settings-nav-repositories-projects"));
    expect(screen.getByText("Project context is missing")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-organization"));
    expect(screen.getByText("Organization context is missing")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-nav-remote-project"));
    expect(screen.getByText("Project context is missing")).toBeInTheDocument();
  });

  it("shows section-specific loading for agent configuration", async () => {
    const user = setupUser();
    let resolveAgentFetch: ((value: Response) => void) | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/settings/agent-configuration")) {
        return new Promise<Response>((resolve) => {
          resolveAgentFetch = resolve;
        });
      }
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    });

    render(<SettingsPage />);
    await user.click(screen.getByTestId("settings-nav-agent-configuration"));

    expect(screen.getByText("Loading agent configuration…")).toBeInTheDocument();
    await act(async () => {
      resolveAgentFetch?.(
        new Response(JSON.stringify({ agents: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });

  it("preserves the agent draft when configuration validation fails", async () => {
    const user = setupUser();
    let resolveAgentGet: ((value: Response) => void) | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/settings/agent-configuration") && (!init || init.method === "GET")) {
        return new Promise<Response>((resolve) => {
          resolveAgentGet = resolve;
        });
      }
      if (url.includes("/api/settings/agent-configuration") && init?.method === "POST") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Model "bad-model" not found for agent "codex"' }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    });

    render(<SettingsPage />);
    await user.click(screen.getByTestId("settings-nav-agent-configuration"));
    expect(screen.getByText("Loading agent configuration…")).toBeInTheDocument();
    await waitFor(() => expect(resolveAgentGet).not.toBeNull(), { timeout: 5000 });
    await act(async () => {
      resolveAgentGet?.(
        new Response(
          JSON.stringify({
            agents: [
              {
                agent: "codex",
                displayName: "Codex",
                configuredModel: "",
                configuredProvider: "",
                approvalMode: "prompt",
                maxTokens: "",
                availableModels: [{ modelId: "gpt-5.4", provider: "openai", isDefault: true }],
                defaultModel: "gpt-5.4",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });
    await waitFor(() => expect(screen.getByLabelText("Model")).toBeInTheDocument(), {
      timeout: 5000,
    });

    const modelInput = screen.getByLabelText("Model");
    await user.clear(modelInput);
    await user.type(modelInput, "bad-model");
    await user.click(screen.getByRole("button", { name: "Save agent configuration" }));

    expect(await screen.findByText('Model "bad-model" not found for agent "codex"')).toBeInTheDocument();
    expect(screen.getByDisplayValue("bad-model")).toBeInTheDocument();
  });

  it("preserves the MCP draft when validation fails", async () => {
    const user = setupUser();
    let resolveMcpGet: ((value: Response) => void) | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/settings/mcp-servers") && (!init || init.method === "GET")) {
        return new Promise<Response>((resolve) => {
          resolveMcpGet = resolve;
        });
      }
      if (url.includes("/api/settings/mcp-servers") && init?.method === "POST") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'mcpServers[0].command is required for stdio transport' }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    });

    render(<SettingsPage />);
    await user.click(screen.getByTestId("settings-nav-mcp-servers"));
    expect(screen.getByText("Loading MCP server settings…")).toBeInTheDocument();
    await waitFor(() => expect(resolveMcpGet).not.toBeNull(), { timeout: 5000 });
    await act(async () => {
      resolveMcpGet?.(
        new Response(
          JSON.stringify({
            agents: [{ agent: "codex", displayName: "Codex", servers: [] }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });
    await waitFor(() => expect(screen.getByText("MCP definitions for codex")).toBeInTheDocument(), {
      timeout: 5000,
    });

    await user.click(screen.getByRole("button", { name: "Add server" }));
    await user.type(screen.getByLabelText("Name"), "local_tools");
    await user.click(screen.getByRole("button", { name: "Save MCP servers" }));

    expect(
      await screen.findByText("mcpServers[0].command is required for stdio transport"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("local_tools")).toBeInTheDocument();
  });
});
