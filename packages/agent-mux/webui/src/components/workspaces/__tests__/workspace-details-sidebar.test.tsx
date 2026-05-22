import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

import { WorkspaceDetailsSidebar } from "../workspace-details-sidebar";

vi.mock("@a5c-ai/compendium", () => ({
  Button: ({
    children,
    ...props
  }: {
    children?: unknown;
    [key: string]: unknown;
  }) => <button {...props}>{children}</button>,
  Select: ({
    value,
    onChange,
    options,
    ...props
  }: {
    value?: string;
    onChange?: (value: string) => void;
    options?: Array<{ label: string; value: string }>;
    [key: string]: unknown;
  }) => (
    <select
      {...props}
      value={value}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    >
      {(options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  cx: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

function buildWorkspace(overrides: Partial<Parameters<typeof WorkspaceDetailsSidebar>[0]["workspace"]> = {}) {
  return {
    path: "/repo/worktrees/task",
    name: "task",
    status: "active",
    missing: false,
    archivedAt: null,
    cleanedAt: null,
    lastActivityAt: "2026-04-24T12:00:00.000Z",
    git: {
      root: "/repo/main",
      commonDir: "/repo/main/.git",
      trackingBranch: "origin/vk/task",
      branch: "vk/task",
      head: "abc123",
      ahead: 0,
      behind: 0,
      dirty: false,
      uncommittedCount: 0,
      isWorktree: true,
      isPrimary: false,
    },
    notes: { value: "", updatedAt: null },
    links: { editorHref: "vscode://file/repo/worktrees/task" },
    sessions: {
      total: 1,
      active: 1,
      items: [
        {
          sessionId: "session-1",
          title: "Workspace parity session",
          agent: "codex",
          status: "active",
          cwd: "/repo/worktrees/task",
          updatedAt: 1713960000000,
          latestRunId: "run-2",
        },
      ],
    },
    runs: {
      total: 2,
      active: 1,
      items: [
        { runId: "run-2", status: "running", startedAt: 1713961000000, updatedAt: 1713961001000 },
        { runId: "run-1", status: "completed", startedAt: 1713960000000, updatedAt: 1713960001000 },
      ],
    },
    issues: [],
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
    ...overrides,
  };
}

function buildRuntime(overrides: Partial<NonNullable<Parameters<typeof WorkspaceDetailsSidebar>[0]["runtime"]>> = {}) {
  return {
    updatedAt: 1713960000000,
    workspacePath: "/repo/worktrees/task",
    preview: {
      status: "ready" as const,
      primaryUrl: "http://127.0.0.1:3000",
      urls: ["http://127.0.0.1:3000"],
      deviceProfiles: [],
    },
    terminal: {
      status: "active" as const,
      commands: [],
    },
    devServer: {
      status: "running" as const,
      command: "pnpm dev --port 3000",
      primaryUrl: "http://127.0.0.1:3000",
      urls: ["http://127.0.0.1:3000"],
      logs: [],
    },
    ...overrides,
  };
}

describe("WorkspaceDetailsSidebar", () => {
  it("surfaces workspace-native session, runtime, and dispatch status beside notes and git details", () => {
    render(
      <WorkspaceDetailsSidebar
        workspace={buildWorkspace()}
        runtime={buildRuntime()}
        sessionId="session-1"
        sessionStatus="active"
        pendingAction={null}
        notesSaving={false}
        reviewPending={false}
        onAction={vi.fn()}
        onOpenInEditor={vi.fn()}
        onSaveNote={vi.fn()}
        onCreatePullRequest={vi.fn()}
        onLinkPullRequest={vi.fn()}
      />,
    );

    expect(screen.getByTestId("workspace-status-panel")).toBeInTheDocument();
    expect(screen.getByText("Workspace parity session")).toBeInTheDocument();
    expect(screen.getByText("Runtime updated")).toBeInTheDocument();
    expect(screen.getByText("Dev server")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-status-run-run-2")).toHaveAttribute("href", "/dispatches/run-2");
    expect(screen.getByText("Git")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("renders explicit disconnected and no-dispatch states when the workspace shell has no live runtime", () => {
    render(
      <WorkspaceDetailsSidebar
        workspace={buildWorkspace({
          sessions: { total: 0, active: 0, items: [] },
          runs: { total: 0, active: 0, items: [] },
        })}
        sessionId={undefined}
        sessionStatus={undefined}
        pendingAction={null}
        notesSaving={false}
        reviewPending={false}
        onAction={vi.fn()}
        onOpenInEditor={vi.fn()}
        onSaveNote={vi.fn()}
        onCreatePullRequest={vi.fn()}
        onLinkPullRequest={vi.fn()}
      />,
    );

    expect(screen.getByText("No active session selected")).toBeInTheDocument();
    expect(screen.getAllByText("Runtime disconnected")).toHaveLength(1);
    expect(screen.getByText("No workspace dispatches yet")).toBeInTheDocument();
  });
});
