import { describe, expect, it, vi } from "vitest";
import { render, screen, setupUser, waitFor } from "@/test/test-utils";

import { WorkspaceDetailShell } from "../workspace-detail-shell";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href?: string; children?: unknown; [key: string]: unknown }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children }: { children?: unknown }) => <>{children}</>,
  Trigger: ({ children }: { children?: unknown }) => <>{children}</>,
  Portal: ({ children }: { children?: unknown }) => <>{children}</>,
  Overlay: ({ children, ...props }: { children?: unknown; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  Content: ({ children, ...props }: { children?: unknown; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children?: unknown;
    asChild?: boolean;
    [key: string]: unknown;
  }) => (asChild ? <>{children}</> : <button {...props}>{children}</button>),
}));

vi.mock("@/components/sessions/session-conversation-surface", () => ({
  SessionConversationSurface: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="session-conversation-surface">conversation {sessionId}</div>
  ),
}));

vi.mock("@/components/sessions/session-observability-panel", () => ({
  SessionObservabilityPanel: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="session-observability-panel">observability {sessionId}</div>
  ),
}));

vi.mock("@/components/workspaces/workspace-runtime-panel", () => ({
  WorkspaceRuntimePanel: ({ sessionId }: { sessionId?: string }) => (
    <div data-testid="workspace-runtime-panel">runtime {sessionId ?? "none"}</div>
  ),
}));

vi.mock("@/components/workspaces/workspace-details-sidebar", () => ({
  WorkspaceDetailsSidebar: () => <div data-testid="workspace-details-sidebar">sidebar details</div>,
}));

function buildWorkspace() {
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
      items: [],
    },
    runs: {
      total: 1,
      active: 1,
      items: [],
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
  };
}

function buildSession() {
  return {
    sessionId: "session-1",
    agent: "codex",
    status: "active",
    cwd: "/repo/worktrees/task",
    title: "Workspace parity session",
    updatedAt: 1713960000000,
    latestRunId: "run-2",
    runtime: {
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
        primaryUrl: "http://127.0.0.1:3000",
        urls: ["http://127.0.0.1:3000"],
        logs: [],
      },
    },
  };
}

describe("WorkspaceDetailShell", () => {
  it("keeps the selected session stable while toggling the runtime panel from shell controls", async () => {
    const user = setupUser();
    window.innerWidth = 1440;
    window.dispatchEvent(new Event("resize"));

    render(
      <WorkspaceDetailShell
        workspace={buildWorkspace()}
        sessions={[buildSession()]}
        activeSession={buildSession()}
        runs={[{ runId: "run-2", status: "running" }]}
        eventBuffers={{}}
        totalCostLabel="$0.12"
        selectedSessionId="session-1"
        onSelectSession={vi.fn()}
        pendingAction={null}
        notesSaving={false}
        reviewPending={false}
        onSubmit={vi.fn()}
        onAction={vi.fn()}
        onOpenInEditor={vi.fn()}
        onSaveNote={vi.fn()}
        onCreatePullRequest={vi.fn()}
        onLinkPullRequest={vi.fn()}
      />,
    );

    expect(screen.getByTestId("workspace-panel-details")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-session-select")).toHaveValue("session-1");

    await user.click(screen.getByTestId("panel-toggle-details"));
    expect(screen.queryByTestId("workspace-panel-details")).toBeNull();
    expect(screen.getByTestId("workspace-session-select")).toHaveValue("session-1");

    await user.click(screen.getByTestId("workspace-command-bar-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("workspace-command-details")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("workspace-command-details"));
    expect(screen.getByTestId("workspace-panel-details")).toBeInTheDocument();
    expect(screen.getByText("runtime session-1")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-session-select")).toHaveValue("session-1");
  });
});
