import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { render, screen, setupUser, waitFor, within } from "@/test/test-utils";

import {
  getWorkspaceAttentionReasons,
  getWorkspaceOwnershipLabel,
  loadInventory,
  runWorkspaceAction,
  workspaceNeedsAttention,
  WorkspacesPageContent,
} from "../workspaces-page";

let workspaceReviewArtifacts: Array<Record<string, unknown>> = [];
const mockUseBacklog = vi.fn(() => ({ snapshot: null }));
const workspaceReviewActionMock = vi.fn();
const gatewayStore = createStore(() => ({
  agents: {
    items: [],
    byId: {},
  },
  hooks: {
    byRunId: {},
  },
}));

vi.mock("@a5c-ai/compendium", () => ({
  Button: ({
    children,
    ...props
  }: {
    children?: unknown;
    [key: string]: unknown;
  }) => (<button {...props}>{children}</button>),
  Accordion: ({
    items,
  }: {
    items: Array<{ title: string; body: unknown }>;
  }) => (
    <div data-testid="workspace-accordion">
      {items.map((item) => (
        <section key={item.title}>
          <div>{item.title}</div>
          <div>{item.body as any}</div>
        </section>
      ))}
    </div>
  ),
  CommandPalette: ({
    open,
    items,
    onClose,
  }: {
    open: boolean;
    items: Array<{ id: string; label: string; shortcut?: string; onSelect?: () => void }>;
    onClose?: () => void;
    placeholder?: string;
  }) =>
    open ? (
      <div data-testid="workspace-command-bar">
        {items.map((item) => (
          <button key={item.id} data-testid={`workspace-command-${item.id}`} onClick={item.onSelect}>
            {item.label}
          </button>
        ))}
      </div>
    ) : null,
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

vi.mock("@/hooks/use-reviews", () => ({
  useReviews: () => ({
    loading: false,
    error: undefined,
    artifacts: workspaceReviewArtifacts,
    queue: [],
    summary: {
      total: workspaceReviewArtifacts.length,
      issueCount: 0,
      workspaceCount: workspaceReviewArtifacts.length,
      pendingCount: 0,
      changesRequestedCount: 0,
      approvedCount: 0,
      openCommentCount: 0,
    },
    pendingArtifactId: null,
    actOnReview: workspaceReviewActionMock,
  }),
}));

vi.mock("@/hooks/use-backlog", () => ({
  useBacklog: () => mockUseBacklog(),
}));

vi.mock("@/lib/agent-mux-ui", () => ({
  useGateway: () => ({
    client: { request: vi.fn() },
    store: gatewayStore,
  }),
}));

vi.mock("@/components/sessions/session-observability-panel", () => ({
  SessionObservabilityPanel: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="session-observability-panel">observability {sessionId}</div>
  ),
}));

vi.mock("@/components/sessions/session-conversation-surface", () => ({
  SessionConversationSurface: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="session-conversation-surface">conversation {sessionId}</div>
  ),
}));

vi.mock("@/components/workspaces/workspace-runtime-panel", () => ({
  WorkspaceRuntimePanel: ({
    sessionId,
    executionContexts,
  }: {
    sessionId?: string;
    executionContexts?: Array<{
      issue?: { title?: string };
      dispatch?: { labels?: Array<{ label?: string }> };
    }>;
  }) => (
    <div data-testid="workspace-runtime-panel">
      <div>runtime {sessionId ?? "none"}</div>
      {executionContexts && executionContexts.length > 0 ? (
        <div>
          <div>Execution context</div>
          <div>Workspace-linked issue context</div>
          <div>Issue title</div>
          <div>{executionContexts[0]?.issue?.title}</div>
          {executionContexts[0]?.dispatch?.labels?.map((label) => (
            <div key={label.label}>{label.label}</div>
          ))}
        </div>
      ) : null}
    </div>
  ),
}));

vi.mock("@/components/sessions/session-conversation-surface", () => ({
  SessionConversationSurface: ({ sessionId }: { sessionId?: string }) => (
    <div data-testid="session-conversation-surface">conversation {sessionId ?? "none"}</div>
  ),
}));

describe("workspaces-page helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    workspaceReviewArtifacts = [];
    mockUseBacklog.mockReturnValue({ snapshot: null });
    window.localStorage.clear();
    workspaceReviewActionMock.mockResolvedValue(undefined);
  });

  it("falls back to session attachment copy before inventory ownership loads", () => {
    expect(
      getWorkspaceOwnershipLabel(true, [
        { sessionId: "session-1", agent: "codex", status: "active", cwd: "/repo/worktrees/task" },
      ]),
    ).toBe("1 live session attached to the current workspace inventory");
  });

  it("falls back to local inventory copy when the gateway is disconnected", () => {
    expect(getWorkspaceOwnershipLabel(false, [])).toBe(
      "Gateway disconnected: browsing saved workspaces and local worktrees only",
    );
  });

  it("flags only actionable workspace states for the inbox", () => {
    expect(
      workspaceNeedsAttention({
        path: "/repo/worktrees/review",
        name: "review",
        status: "idle",
        missing: false,
        archivedAt: null,
        cleanedAt: null,
        lastActivityAt: "2026-04-24T12:00:00.000Z",
        git: {
          root: "/repo/main",
          commonDir: "/repo/main/.git",
          trackingBranch: "origin/vk/review",
          branch: "vk/review",
          head: "abc123",
          ahead: 0,
          behind: 0,
          dirty: false,
          uncommittedCount: 0,
          isWorktree: true,
          isPrimary: false,
        },
        notes: {
          value: "",
          updatedAt: null,
        },
        links: {
          editorHref: "vscode://file/repo/worktrees/review",
        },
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
        review: {
          decision: "pending",
          queueState: "queued",
          commentCount: 1,
          openCommentCount: 1,
          latestActivityAt: "2026-04-24T12:00:00.000Z",
        },
      }),
    ).toBe(true);

    expect(
      getWorkspaceAttentionReasons({
        path: "/repo/worktrees/review",
        name: "review",
        status: "idle",
        missing: false,
        archivedAt: null,
        cleanedAt: null,
        lastActivityAt: "2026-04-24T12:00:00.000Z",
        git: {
          root: "/repo/main",
          commonDir: "/repo/main/.git",
          trackingBranch: "origin/vk/review",
          branch: "vk/review",
          head: "abc123",
          ahead: 0,
          behind: 0,
          dirty: false,
          uncommittedCount: 0,
          isWorktree: true,
          isPrimary: false,
        },
        notes: {
          value: "",
          updatedAt: null,
        },
        links: {
          editorHref: "vscode://file/repo/worktrees/review",
        },
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
        review: {
          decision: "pending",
          queueState: "queued",
          commentCount: 1,
          openCommentCount: 1,
          latestActivityAt: "2026-04-24T12:00:00.000Z",
        },
      }),
    ).toEqual(["Review pending", "1 open comment"]);

    expect(
      workspaceNeedsAttention({
        path: "/repo/worktrees/healthy",
        name: "healthy",
        status: "idle",
        missing: false,
        archivedAt: null,
        cleanedAt: null,
        lastActivityAt: "2026-04-24T12:00:00.000Z",
        git: {
          root: "/repo/main",
          commonDir: "/repo/main/.git",
          trackingBranch: "origin/vk/healthy",
          branch: "vk/healthy",
          head: "abc123",
          ahead: 0,
          behind: 0,
          dirty: false,
          uncommittedCount: 0,
          isWorktree: true,
          isPrimary: false,
        },
        notes: {
          value: "",
          updatedAt: null,
        },
        links: {
          editorHref: "vscode://file/repo/worktrees/healthy",
        },
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
      }),
    ).toBe(false);
  });

  it("loads workspace inventory through the workspace API", async () => {
    const payload = {
      summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
      workspaces: [],
    };
    const runtime = {
      updatedAt: 1,
      workspacePath: "/repo/worktrees/task",
      preview: {
        status: "ready",
        primaryUrl: "http://127.0.0.1:3000",
        urls: ["http://127.0.0.1:3000"],
        deviceProfiles: [],
      },
      terminal: {
        status: "idle",
        commands: [],
      },
      devServer: {
        status: "running",
        primaryUrl: "http://127.0.0.1:3000",
        urls: ["http://127.0.0.1:3000"],
        logs: [],
      },
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      loadInventory([
        { sessionId: "session-1", agent: "codex", status: "active", cwd: "/repo/worktrees/task", runtime },
      ]),
    ).resolves.toEqual(payload);

    expect(fetch).toHaveBeenCalledWith(
      "/api/workspaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sessions: [{ sessionId: "session-1", agent: "codex", status: "active", cwd: "/repo/worktrees/task", runtime }],
        }),
      }),
    );
  });

  it("requests a focused workspace inventory when opening a selected workspace without live sessions", async () => {
    const payload = {
      summary: { total: 1, active: 0, idle: 1, archived: 0, missing: 0 },
      workspaces: [],
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(loadInventory([], "/repo/worktrees/task")).resolves.toEqual(payload);

    expect(fetch).toHaveBeenCalledWith("/api/workspaces?workspace=%2Frepo%2Fworktrees%2Ftask");
  });

  it("renders only workspaces that need attention in inbox mode", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 3, active: 0, idle: 2, archived: 0, missing: 1 },
        workspaces: [
          {
            path: "/repo/worktrees/clean",
            name: "clean",
            status: "idle",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T12:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/clean",
              branch: "vk/clean",
              head: "abc123",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/clean" },
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
          },
          {
            path: "/repo/worktrees/review",
            name: "review",
            status: "idle",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T13:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/review",
              branch: "vk/review",
              head: "def456",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/review" },
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
            review: {
              decision: "pending",
              queueState: "queued",
              commentCount: 1,
              openCommentCount: 1,
              latestActivityAt: "2026-04-24T13:00:00.000Z",
            },
          },
          {
            path: "/repo/worktrees/recovery",
            name: "recovery",
            status: "missing",
            missing: true,
            archivedAt: null,
            cleanedAt: "2026-04-24T11:00:00.000Z",
            lastActivityAt: "2026-04-24T11:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/recovery",
              branch: "vk/recovery",
              head: "ghi789",
              ahead: 0,
              behind: 0,
              dirty: null,
              uncommittedCount: null,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: null },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            actions: {
              canArchive: false,
              canCleanup: false,
              canRecover: true,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { container } = render(<WorkspacesPageContent isAuthenticated sessions={[]} mode="attention" />);

    await waitFor(() => {
      expect(screen.getByText("review")).toBeInTheDocument();
    });

    expect(screen.getByText("review")).toBeInTheDocument();
    expect(screen.getByText("recovery")).toBeInTheDocument();
    expect(container.querySelector('[data-workspace-path="/repo/worktrees/clean"]')).toBeNull();
    expect(screen.getAllByText("Open shell")).toHaveLength(2);
    expect(screen.getByText("Review pending")).toBeInTheDocument();
    expect(screen.getByText("Recovery required")).toBeInTheDocument();
  });

  it("renders sidebar search, grouped layout, pinned rows, and mixed status badges", async () => {
    workspaceReviewArtifacts = [
      {
        id: "workspace-review-1",
        targetType: "workspace",
        targetId: "/repo/worktrees/alpha",
        targetLabel: "alpha",
        title: "Workspace review",
        decision: "pending",
        queueState: "queued",
        diff: [],
        comments: [],
        updatedAt: "2026-04-24T12:00:00.000Z",
        linkedPullRequest: {
          provider: "github",
          status: "in-review",
          linkState: "linked",
          title: "VK-PARITY-26 alpha",
          number: 26,
          integrationStatus: "connected",
          guidance: "PR linked.",
        },
      },
    ];

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 3, active: 1, idle: 1, archived: 1, missing: 0 },
        workspaces: [
          {
            path: "/repo/worktrees/alpha",
            name: "alpha",
            status: "active",
            pinnedAt: "2026-04-24T12:00:00.000Z",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T12:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/alpha",
              branch: "vk/alpha",
              head: "abc123",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/alpha" },
            sessions: {
              total: 1,
              active: 1,
              items: [
                {
                  sessionId: "session-alpha",
                  agent: "codex",
                  status: "active",
                  runtime: {
                    updatedAt: 1,
                    workspacePath: "/repo/worktrees/alpha",
                    preview: { status: "ready", urls: [], deviceProfiles: [] },
                    terminal: { status: "idle", commands: [] },
                    devServer: { status: "running", primaryUrl: "http://127.0.0.1:3000", urls: [], logs: [] },
                  },
                },
              ],
            },
            runs: { total: 1, active: 1, items: [] },
            actions: {
              canPin: false,
              canUnpin: true,
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
          {
            path: "/repo/worktrees/beta",
            name: "beta",
            status: "idle",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T11:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/beta",
              branch: "vk/beta",
              head: "def456",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/beta" },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            review: {
              decision: "pending",
              queueState: "queued",
              commentCount: 1,
              openCommentCount: 1,
              latestActivityAt: "2026-04-24T11:00:00.000Z",
            },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
          {
            path: "/repo/worktrees/gamma",
            name: "gamma",
            status: "archived",
            missing: false,
            archivedAt: "2026-04-24T10:00:00.000Z",
            cleanedAt: null,
            lastActivityAt: "2026-04-24T10:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/gamma",
              branch: "vk/gamma",
              head: "ghi789",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/gamma" },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: true,
              canRecover: true,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByTestId("workspace-sidebar-surface")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Workspace search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grouped" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("workspace-review-queue-details")).not.toHaveAttribute("open");
    expect(screen.getByText("Pinned workspaces (1)")).toBeInTheDocument();
    expect(screen.getAllByText("Pinned").length).toBeGreaterThan(0);
    expect(screen.getByText("Dev server running")).toBeInTheDocument();
    expect(screen.getByText("PR in review")).toBeInTheDocument();
    expect(screen.getAllByText("Needs attention").length).toBeGreaterThan(0);
  });

  it("omits the workspace review queue chrome when there is nothing waiting for review", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
        workspaces: [
          {
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
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByTestId("workspace-sidebar-surface")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("workspace-review-queue-details")).toBeNull();
  });

  it("keeps issue and chat actions visible while hiding maintenance behind progressive disclosure", async () => {
    const user = setupUser();

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
        workspaces: [
          {
            path: "/repo/worktrees/alpha",
            name: "alpha",
            status: "active",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T12:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/alpha",
              branch: "vk/alpha",
              head: "abc123",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            ownership: {
              source: "created-from-project",
              project: { projectId: "kanban-app", projectKey: "KANBAN", projectName: "Kanban" },
              issue: { issueId: "KANBAN-GAP-007", issueKey: "KANBAN-GAP-007", issueTitle: "Workspace parity" },
            },
            issues: [
              {
                issueId: "KANBAN-GAP-007",
                issueKey: "KANBAN-GAP-007",
                issueTitle: "Workspace parity",
                projectId: "kanban-app",
                projectKey: "KANBAN",
                projectName: "Kanban",
              },
            ],
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/alpha" },
            sessions: {
              total: 1,
              active: 1,
              items: [
                {
                  sessionId: "session-alpha",
                  agent: "codex",
                  status: "active",
                  title: "Workspace parity session",
                },
              ],
            },
            runs: { total: 1, active: 1, items: [] },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: true,
              canRecover: true,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Open issue" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show details" }));
    const maintenanceDetails = screen.getByText("Workspace maintenance").closest("details");
    expect(maintenanceDetails).not.toHaveAttribute("open");

    await user.click(screen.getByText("Workspace maintenance"));

    expect(maintenanceDetails).toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recover" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cleanup" })).toBeInTheDocument();
  });

  it("filters workspace sidebar content and reports hidden items", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 2, active: 1, idle: 1, archived: 0, missing: 0 },
        workspaces: [
          {
            path: "/repo/worktrees/alpha",
            name: "alpha",
            status: "active",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T12:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/alpha",
              branch: "vk/alpha",
              head: "abc123",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/alpha" },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
          {
            path: "/repo/worktrees/beta",
            name: "beta",
            status: "idle",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T11:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/beta",
              branch: "vk/beta",
              head: "def456",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/beta" },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const user = setupUser();
    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByTestId("workspace-sidebar-surface")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Workspace search"), "beta");

    expect(screen.getByText("1 hidden by search")).toBeInTheDocument();
    expect(screen.queryByText("alpha")).not.toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("restores persisted sidebar layout and search state without stale full-list content", async () => {
    window.localStorage.setItem("kanban:workspace-sidebar.layout-mode", JSON.stringify("flat"));
    window.localStorage.setItem("kanban:workspace-sidebar.search", JSON.stringify("beta"));

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 2, active: 1, idle: 1, archived: 0, missing: 0 },
        workspaces: [
          {
            path: "/repo/worktrees/alpha",
            name: "alpha",
            status: "active",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T12:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/alpha",
              branch: "vk/alpha",
              head: "abc123",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/alpha" },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
          {
            path: "/repo/worktrees/beta",
            name: "beta",
            status: "idle",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T11:00:00.000Z",
            git: {
              root: "/repo/main",
              commonDir: "/repo/main/.git",
              trackingBranch: "origin/vk/beta",
              branch: "vk/beta",
              head: "def456",
              ahead: 0,
              behind: 0,
              dirty: false,
              uncommittedCount: 0,
              isWorktree: true,
              isPrimary: false,
            },
            notes: { value: "", updatedAt: null },
            links: { editorHref: "vscode://file/repo/worktrees/beta" },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            actions: {
              canPin: true,
              canUnpin: false,
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: false,
              canRebaseOpenInEditor: false,
              canRebaseMarkResolved: false,
              canRebaseAbort: false,
            },
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Flat" })).toHaveAttribute("aria-pressed", "true");
    });

    expect(screen.getByLabelText("Workspace search")).toHaveValue("beta");
    expect(screen.queryByText("alpha")).not.toBeInTheDocument();
    expect(screen.getAllByText("Workspace list").length).toBeGreaterThan(0);
  });

  it("posts pin actions from the workspace sidebar and surfaces failures", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
          workspaces: [
            {
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
              sessions: { total: 0, active: 0, items: [] },
              runs: { total: 0, active: 0, items: [] },
              actions: {
                canPin: true,
                canUnpin: false,
                canArchive: true,
                canCleanup: false,
                canRecover: false,
                canRebaseStart: false,
                canRebaseAutoResolve: false,
                canRebaseOpenInEditor: false,
                canRebaseMarkResolved: false,
                canRebaseAbort: false,
              },
            },
          ],
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Pin failed." }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      );

    const user = setupUser();
    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pin" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Pin" }));

    await waitFor(() => {
      expect(screen.getAllByText("Pin failed.").length).toBeGreaterThan(0);
    });

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/workspaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "pin",
          workspacePath: "/repo/worktrees/task",
          sessions: [],
        }),
      }),
    );
  });

  it("posts lifecycle actions back to the workspace API", async () => {
    const payload = {
      summary: { total: 1, active: 0, idle: 0, archived: 1, missing: 0 },
      workspaces: [],
      result: { ok: true },
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(runWorkspaceAction("archive", "/repo/worktrees/task", [])).resolves.toEqual(payload);

    expect(fetch).toHaveBeenCalledWith(
      "/api/workspaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "archive",
          workspacePath: "/repo/worktrees/task",
          sessions: [],
        }),
      }),
    );
  });

  it("renders rebase conflict workflow actions and generated instructions", async () => {
    const user = setupUser();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("open", vi.fn());

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
        workspaces: [
          {
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
              ahead: 2,
              behind: 1,
              dirty: true,
              uncommittedCount: 3,
              isWorktree: true,
              isPrimary: false,
            },
            notes: {
              value: "",
              updatedAt: null,
            },
            links: {
              editorHref: "vscode://file/repo/worktrees/task",
            },
            sessions: { total: 1, active: 1, items: [] },
            runs: { total: 1, active: 1, items: [] },
            rebase: {
              status: "rebase-conflicts",
              attemptCount: 1,
              unresolvedFiles: ["packages/agent-mux/webui/src/lib/workspace-lifecycle.ts"],
              resolvedFiles: ["packages/agent-mux/webui/src/components/workspaces/workspaces-page.tsx"],
              followUpInstructions: [
                "Unresolved files: packages/agent-mux/webui/src/lib/workspace-lifecycle.ts.",
                "Open in editor for manual fixes, then use Mark resolved to return the workspace to review or merge readiness.",
              ],
              manualResolutionSuggested: true,
              readyFor: "merge",
              editorHref: "vscode://file/repo/worktrees/task",
            },
            actions: {
              canArchive: true,
              canCleanup: false,
              canRecover: false,
              canRebaseStart: false,
              canRebaseAutoResolve: true,
              canRebaseOpenInEditor: true,
              canRebaseMarkResolved: true,
              canRebaseAbort: true,
            },
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Show details" }));
    await waitFor(() => {
      expect(screen.getByText("Rebase workflow")).toBeInTheDocument();
    });

    const sidebar = screen.getByLabelText("Workspace details for task");
    expect(within(sidebar).getByText("Status")).toBeInTheDocument();
    expect(within(sidebar).getByText("Git")).toBeInTheDocument();
    expect(within(sidebar).getByText("Notes")).toBeInTheDocument();
    expect(within(sidebar).getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Resolve conflicts before returning to review or merge")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Auto-resolve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Open in editor" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Mark resolved" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Abort rebase" })).toBeEnabled();
    expect(screen.getByText(/Open in editor for manual fixes/)).toBeInTheDocument();
  });

  it("renders post-resolution readiness state from persisted rebase data", async () => {
    const user = setupUser();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 0, idle: 1, archived: 0, missing: 0 },
        workspaces: [
          {
            path: "/repo/worktrees/task",
            name: "task",
            status: "idle",
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
            notes: {
              value: "Ready for merge after validation.",
              updatedAt: "2026-04-24T13:00:00.000Z",
            },
            links: {
              editorHref: "vscode://file/repo/worktrees/task",
            },
            sessions: { total: 0, active: 0, items: [] },
            runs: { total: 0, active: 0, items: [] },
            rebase: {
              status: "ready-for-merge",
              attemptCount: 2,
              unresolvedFiles: [],
              resolvedFiles: ["packages/agent-mux/webui/src/lib/workspace-lifecycle.ts"],
              followUpInstructions: ["Rebase workflow completed. Continue the workspace through merge readiness."],
              manualResolutionSuggested: false,
              readyFor: "merge",
            },
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
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Show details" }));
    await waitFor(() => {
      expect(screen.getByText("Ready for merge")).toBeInTheDocument();
    });
    expect(screen.getByText(/Continue the workspace through merge readiness/)).toBeInTheDocument();
  });

  it("renders linked PR guidance for workspace review artifacts with degraded integration", async () => {
    const user = setupUser();
    workspaceReviewArtifacts = [
      {
        id: "workspace-review-1",
        targetType: "workspace",
        targetId: "/repo/worktrees/task",
        targetLabel: "task",
        title: "Workspace review",
        decision: "pending",
        queueState: "queued",
        diff: [],
        comments: [],
        updatedAt: "2026-04-24T12:00:00.000Z",
        integration: {
          provider: "github",
          status: "expired-auth",
          linkState: "partially-linked",
          guidance: "Reconnect GitHub before linked review actions can continue.",
          prerequisites: [],
          actions: {
            canCreatePullRequest: false,
            canManagePullRequest: false,
            canApproveFromReview: false,
            reason: "GitHub auth expired.",
          },
        },
        linkedPullRequest: {
          provider: "github",
          status: "in-review",
          linkState: "partially-linked",
          title: "VK-PARITY-43 linked workspace review",
          number: 612,
          integrationStatus: "expired-auth",
          guidance: "The PR is linked but cannot be synchronized until GitHub auth is refreshed.",
        },
      },
    ];

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
        workspaces: [
          {
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
            notes: {
              value: "",
              updatedAt: null,
            },
            links: {
              editorHref: "vscode://file/repo/worktrees/task",
            },
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
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Show details" }));
    await waitFor(() => {
      expect(screen.getAllByText("Pull request").length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/GitHub PR #612 is partially linked/)).toBeInTheDocument();
    expect(screen.getAllByText("expired auth").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Reconnect GitHub before linked review actions can continue/).length).toBeGreaterThanOrEqual(1);
  });

  it("submits PR creation from the workspace sidebar and shows mapped review comments", async () => {
    const user = setupUser();

    workspaceReviewArtifacts = [
      {
        id: "workspace-review-2",
        targetType: "workspace",
        targetId: "/repo/worktrees/task",
        targetLabel: "task",
        title: "Workspace review",
        decision: "pending",
        queueState: "in-review",
        diff: [],
        comments: [
          {
            id: "comment-1",
            author: { kind: "agent", name: "workspace-reviewer" },
            body: "Carry the CI and merge chips into the workspace sidebar.",
            createdAt: "2026-04-24T12:00:00.000Z",
            status: "open",
            anchor: {
              fileId: "file-1",
              filePath: "packages/agent-mux/webui/src/components/workspaces/workspace-details-sidebar.tsx",
              hunkId: "hunk-1",
              side: "head",
              line: 120,
            },
          },
        ],
        updatedAt: "2026-04-24T12:00:00.000Z",
        integration: {
          provider: "github",
          status: "connected",
          linkState: "unlinked",
          guidance: "Create a linked PR from the active workspace.",
          prerequisites: [],
          actions: {
            canCreatePullRequest: true,
            canManagePullRequest: true,
            canApproveFromReview: true,
          },
        },
      },
    ];

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
        workspaces: [
          {
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
            notes: {
              value: "",
              updatedAt: null,
            },
            links: {
              editorHref: "vscode://file/repo/worktrees/task",
            },
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
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Show details" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create PR" })).toBeInTheDocument();
    });

    expect(
      screen.getAllByText("Carry the CI and merge chips into the workspace sidebar.").length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Create PR" }));

    expect(workspaceReviewActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create-pull-request",
        artifactId: "workspace-review-2",
      }),
    );
  });

  it("renders missing metadata, disconnected runtime, and empty notes states", async () => {
    const user = setupUser();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 0, idle: 1, archived: 0, missing: 0 },
        workspaces: [
          {
            path: "/repo/worktrees/orphan",
            name: "orphan",
            status: "idle",
            missing: false,
            archivedAt: null,
            cleanedAt: null,
            lastActivityAt: "2026-04-24T12:00:00.000Z",
            git: {
              root: null,
              commonDir: null,
              trackingBranch: null,
              branch: null,
              head: null,
              ahead: null,
              behind: null,
              dirty: null,
              uncommittedCount: null,
              isWorktree: false,
              isPrimary: false,
            },
            notes: {
              value: "",
              updatedAt: null,
            },
            links: {
              editorHref: "vscode://file/repo/worktrees/orphan",
            },
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
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Show details" }));
    await waitFor(() => {
      expect(screen.getByText("Repository metadata unavailable")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Runtime disconnected")).toHaveLength(1);
    expect(screen.getByText("No workspace notes yet")).toBeInTheDocument();
  });

  it("renders linked execution context inside the workspace runtime panel", async () => {
    const user = setupUser();
    mockUseBacklog.mockReturnValue({
      snapshot: {
        generatedAt: "2026-04-24T00:00:00.000Z",
        dispatchContextLabels: [],
        projects: [{ id: "project-1", key: "KANBAN", name: "Kanban", issueIds: ["issue-1"] }],
        issues: [
          {
            id: "issue-1",
            projectId: "project-1",
            key: "KANBAN-1",
            title: "Issue title",
            dispatch: {
              readiness: "ready",
              blockedReasons: [],
              runIds: ["run-1"],
              sessionIds: ["session-1"],
              contextLabels: [{ labelId: "dispatch-context-label-1" }],
              contextLabelProjections: [
                {
                  labelId: "dispatch-context-label-1",
                  key: "tests_first",
                  label: "Tests First",
                  instruction: "Write tests first.",
                },
              ],
              renderedContext: "- [tests_first] Write tests first.",
              lastDispatchedAt: "2026-04-24T00:00:00.000Z",
            },
          },
        ],
      },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
        workspaces: [
          {
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
              branch: "vk/task",
              head: "abc123",
              dirty: false,
              isWorktree: true,
              isPrimary: false,
            },
            sessions: {
              total: 1,
              active: 1,
              items: [
                {
                  sessionId: "session-1",
                  agent: "codex",
                  status: "active",
                  cwd: "/repo/worktrees/task",
                  runtime: {
                    updatedAt: 1,
                    workspacePath: "/repo/worktrees/task",
                    preview: {
                      status: "ready",
                      primaryUrl: "http://127.0.0.1:3000",
                      urls: ["http://127.0.0.1:3000"],
                      deviceProfiles: [],
                    },
                    terminal: {
                      status: "idle",
                      commands: [],
                    },
                    devServer: {
                      status: "running",
                      primaryUrl: "http://127.0.0.1:3000",
                      urls: ["http://127.0.0.1:3000"],
                      logs: [],
                    },
                  },
                },
              ],
            },
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
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <WorkspacesPageContent
        isAuthenticated
        sessions={[{ sessionId: "session-1", agent: "codex", status: "active", cwd: "/repo/worktrees/task" }]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Show details" }));
    await waitFor(() => {
      expect(screen.getByText("Execution context")).toBeInTheDocument();
    });

    const runtimePanel = screen.getByTestId("workspace-runtime-panel");
    expect(within(runtimePanel).getByText("Workspace-linked issue context")).toBeInTheDocument();
    expect(within(runtimePanel).getAllByText("Issue title").length).toBeGreaterThan(0);
    expect(within(runtimePanel).getByText(/Tests First/)).toBeInTheDocument();
  });

  it("surfaces editor action failures inside quick actions", async () => {
    const user = setupUser();
    vi.stubGlobal("open", vi.fn(() => null));

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 0, idle: 1, archived: 0, missing: 0 },
        workspaces: [
          {
            path: "/repo/worktrees/task",
            name: "task",
            status: "idle",
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
            notes: {
              value: "",
              updatedAt: null,
            },
            links: {
              editorHref: "vscode://file/repo/worktrees/task",
            },
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
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<WorkspacesPageContent isAuthenticated sessions={[]} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Show details" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open in editor" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Open in editor" }));

    expect(await screen.findByText(/Editor action failed for \/repo\/worktrees\/task/)).toBeInTheDocument();
  });

  it("renders the workspace shell when a workspace route selection is present", async () => {
    const user = setupUser();
    window.innerWidth = 1440;
    window.dispatchEvent(new Event("resize"));

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({
        summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
        workspaces: [
          {
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
              ahead: 2,
              behind: 1,
              dirty: true,
              uncommittedCount: 3,
              isWorktree: true,
              isPrimary: false,
            },
            notes: {
              value: "Keep parity aligned with upstream shell.",
              updatedAt: "2026-04-24T12:10:00.000Z",
            },
            links: {
              editorHref: "vscode://file/repo/worktrees/task",
            },
            sessions: {
              total: 2,
              active: 1,
              items: [
                {
                  sessionId: "session-1",
                  agent: "codex",
                  status: "active",
                  cwd: "/repo/worktrees/task",
                  title: "Workspace parity session",
                  updatedAt: 1713960000000,
                  latestRunId: "run-2",
                },
                {
                  sessionId: "session-2",
                  agent: "claude",
                  status: "inactive",
                  cwd: "/repo/worktrees/task",
                  title: "Secondary session",
                  updatedAt: 1713950000000,
                  latestRunId: "run-3",
                },
              ],
            },
            runs: { total: 2, active: 1, items: [] },
            issues: [
              {
                issueId: "KANBAN-GAP-007",
                issueKey: "KANBAN-GAP-007",
                issueTitle: "Add team and collaboration primitives",
                projectId: "kanban-app",
                projectKey: "KANBAN",
                projectName: "Kanban App",
                linkedAt: "2026-04-24T12:00:00.000Z",
                source: "created-from-issue",
              },
            ],
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
          },
        ],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <WorkspacesPageContent
        isAuthenticated
        selectedWorkspacePath="/repo/worktrees/task"
        sessions={[
          {
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
                status: "ready",
                primaryUrl: "http://127.0.0.1:3000",
                urls: ["http://127.0.0.1:3000"],
                deviceProfiles: [],
              },
              terminal: {
                status: "idle",
                commands: [],
              },
              devServer: {
                status: "running",
                primaryUrl: "http://127.0.0.1:3000",
                urls: ["http://127.0.0.1:3000"],
                logs: [],
              },
            },
          },
          {
            sessionId: "session-2",
            agent: "claude",
            status: "inactive",
            cwd: "/repo/worktrees/task",
            title: "Secondary session",
            updatedAt: 1713950000000,
            latestRunId: "run-3",
          },
        ]}
        allRuns={[
          { runId: "run-2", sessionId: "session-1", status: "running", startedAt: 2 },
          { runId: "run-1", sessionId: "session-1", status: "completed", startedAt: 1 },
          { runId: "run-3", sessionId: "session-2", status: "completed", startedAt: 3 },
        ]}
        eventBuffers={{
          "run-1": { events: [{ type: "user_message", text: "Need workspace parity." }, { type: "message_stop", text: "Working on it." }] },
          "run-2": { events: [{ type: "cost", cost: { totalUsd: 0.12 } }] },
        }}
        onSendPrompt={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-shell")).toBeInTheDocument();
    });

    expect(screen.getByTestId("workspace-context-bar")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-desktop-panels")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-panel-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-panel-conversation")).toBeInTheDocument();
    expect(screen.queryByTestId("workspace-panel-context")).toBeNull();
    expect(screen.queryByTestId("workspace-panel-details")).toBeNull();
    expect(within(screen.getByTestId("workspace-session-select")).getByRole("combobox")).toHaveValue("session-1");
    expect(screen.getByTestId("workspace-issue-link-KANBAN-GAP-007")).toHaveAttribute(
      "href",
      "/projects/kanban-app/issues/KANBAN-GAP-007",
    );

    await user.click(screen.getByTestId("panel-toggle-context"));
    expect(screen.getByTestId("workspace-panel-context")).toBeInTheDocument();
    expect(screen.getByText("observability session-1")).toBeInTheDocument();

    await user.click(screen.getByTestId("panel-toggle-details"));
    expect(screen.getByTestId("workspace-panel-details")).toBeInTheDocument();
    expect(screen.getByText("runtime session-1")).toBeInTheDocument();
  });

  it("keeps the selected workspace shell visible while inventory refreshes in the background", async () => {
    let resolveRefresh: ((response: Response) => void) | null = null;
    const initialPayload = {
      summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
      workspaces: [
        {
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
            ahead: 2,
            behind: 1,
            dirty: true,
            uncommittedCount: 3,
            isWorktree: true,
            isPrimary: false,
          },
          notes: {
            value: "",
            updatedAt: null,
          },
          links: {
            editorHref: "vscode://file/repo/worktrees/task",
          },
          sessions: {
            total: 1,
            active: 1,
            items: [
              {
                sessionId: "session-1",
                agent: "codex",
                status: "active",
                cwd: "/repo/worktrees/task",
                title: "Workspace parity session",
                updatedAt: 1713960000000,
                latestRunId: "run-2",
              },
            ],
          },
          runs: { total: 1, active: 1, items: [] },
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
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(initialPayload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveRefresh = resolve;
          }),
      );

    const view = render(
      <WorkspacesPageContent
        isAuthenticated
        selectedWorkspacePath="/repo/worktrees/task"
        sessions={[
          {
            sessionId: "session-1",
            agent: "codex",
            status: "active",
            cwd: "/repo/worktrees/task",
            title: "Workspace parity session",
            updatedAt: 1713960000000,
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-shell")).toBeInTheDocument();
    });

    view.rerender(
      <WorkspacesPageContent
        isAuthenticated
        selectedWorkspacePath="/repo/worktrees/task"
        sessions={[
          {
            sessionId: "session-1",
            agent: "codex",
            status: "active",
            cwd: "/repo/worktrees/task",
            title: "Workspace parity session",
            updatedAt: 1713960005000,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("workspace-shell")).toBeInTheDocument();
    expect(screen.queryByText("Loading workspace shell…")).not.toBeInTheDocument();

    resolveRefresh?.(
      new Response(JSON.stringify(initialPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  it("uses a compact shell loading state when opening a focused workspace before inventory arrives", async () => {
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>(() => {
          // Keep the initial inventory request pending.
        }),
    );

    render(
      <WorkspacesPageContent
        isAuthenticated
        selectedWorkspacePath="/repo/worktrees/task"
        sessions={[]}
      />,
    );

    expect(await screen.findByTestId("workspace-loading-shell")).toBeInTheDocument();
    expect(screen.getByText("Loading the linked issue, session roster, and runtime so you can stay on this route instead of bouncing through a waiting screen.")).toBeInTheDocument();
    expect(screen.getByText("Workspace handoff")).toBeInTheDocument();
  });

  it("does not reload inventory when rerendered with an equivalent session snapshot", async () => {
    const payload = {
      summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
      workspaces: [
        {
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
          notes: {
            value: "",
            updatedAt: null,
          },
          links: {
            editorHref: "vscode://file/repo/worktrees/task",
          },
          sessions: {
            total: 1,
            active: 1,
            items: [
              {
                sessionId: "session-1",
                agent: "codex",
                status: "active",
                cwd: "/repo/worktrees/task",
                title: "Workspace parity session",
                updatedAt: 1713960000000,
              },
            ],
          },
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
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const view = render(
      <WorkspacesPageContent
        isAuthenticated
        selectedWorkspacePath="/repo/worktrees/task"
        sessions={[
          {
            sessionId: "session-1",
            agent: "codex",
            status: "active",
            cwd: "/repo/worktrees/task",
            title: "Workspace parity session",
            updatedAt: 1713960000000,
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-shell")).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    view.rerender(
      <WorkspacesPageContent
        isAuthenticated
        selectedWorkspacePath="/repo/worktrees/task"
        sessions={[
          {
            sessionId: "session-1",
            agent: "codex",
            status: "active",
            cwd: "/repo/worktrees/task",
            title: "Workspace parity session",
            updatedAt: 1713960000000,
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("workspace-shell")).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
