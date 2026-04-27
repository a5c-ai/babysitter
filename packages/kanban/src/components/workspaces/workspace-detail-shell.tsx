"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Attachment } from "@a5c-ai/agent-mux-core";
import { ChevronLeft, ExternalLink, GripVertical, LayoutDashboard, MessagesSquare, PanelLeft, PanelRight, Search, TerminalSquare, Workflow, X } from "lucide-react";

import { SessionConversationSurface } from "@/components/sessions/session-conversation-surface";
import { SessionObservabilityPanel } from "@/components/sessions/session-observability-panel";
import { Button } from "@/components/ui/button";
import { useKeyboard } from "@/hooks/use-keyboard";
import { usePersistedState } from "@/hooks/use-persisted-state";
import type { KanbanIntegrationProvider, KanbanReviewArtifact } from "@a5c-ai/agent-mux-core/kanban";
import {
  DEFAULT_WORKSPACE_PANEL_SIZES,
  DESKTOP_LAYOUT_BREAKPOINT,
  ensureVisiblePanels,
  getVisiblePanels,
  normalizeWorkspacePanelSizes,
  resizeWorkspacePanels,
  toggleWorkspacePanel,
  type WorkspacePanelKey,
  type WorkspacePanelSizes,
  type WorkspacePanelVisibility,
} from "@/lib/workspace-layout-state";
import type { WorkspaceInventoryItem, WorkspaceSessionSnapshot } from "@/lib/workspace-lifecycle";
import { WorkspaceRuntimePanel } from "@/components/workspaces/workspace-runtime-panel";
import { WorkspaceDetailsSidebar, type WorkspaceSidebarFeedback } from "@/components/workspaces/workspace-details-sidebar";

type EventBuffer = {
  events: Array<Record<string, unknown>>;
};

type WorkspaceSidebarAction =
  | "rebase-start"
  | "rebase-auto-resolve"
  | "rebase-open-in-editor"
  | "rebase-mark-resolved"
  | "rebase-abort";

type WorkspaceDetailShellProps = {
  workspace: WorkspaceInventoryItem;
  sessions: WorkspaceSessionSnapshot[];
  activeSession: WorkspaceSessionSnapshot | null;
  runs: Array<Record<string, unknown>>;
  eventBuffers: Record<string, EventBuffer | undefined>;
  totalCostLabel: string;
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  pendingAction: string | null;
  notesSaving: boolean;
  reviewArtifact?: KanbanReviewArtifact | null;
  reviewPending: boolean;
  feedback?: WorkspaceSidebarFeedback | null;
  onSubmit: (input: {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
    attachments?: Attachment[];
    approvalMode?: "yolo" | "prompt" | "deny";
  }) => Promise<void>;
  onAction: (action: WorkspaceSidebarAction, workspace: WorkspaceInventoryItem) => void;
  onOpenInEditor: (workspace: WorkspaceInventoryItem, href: string | null) => void;
  onSaveNote: (workspace: WorkspaceInventoryItem, note: string) => void;
  onCreatePullRequest: (
    workspace: WorkspaceInventoryItem,
    input: {
      provider: KanbanIntegrationProvider;
      title: string;
      reviewers?: string;
      branchName?: string;
      baseBranch?: string;
    },
  ) => void;
  onLinkPullRequest: (
    workspace: WorkspaceInventoryItem,
    input: {
      provider: KanbanIntegrationProvider;
      number: number;
      title: string;
      branchName?: string;
      baseBranch?: string;
    },
  ) => void;
};

type PanelDefinition = {
  key: WorkspacePanelKey;
  label: string;
  shortcut: string;
  icon: typeof PanelLeft;
};

const PANEL_DEFINITIONS: PanelDefinition[] = [
  { key: "sidebar", label: "Sidebar", shortcut: "Shift+W", icon: PanelLeft },
  { key: "conversation", label: "Session", shortcut: "Shift+C", icon: MessagesSquare },
  { key: "context", label: "Context", shortcut: "Shift+X", icon: Workflow },
  { key: "details", label: "Runtime", shortcut: "Shift+D", icon: PanelRight },
];

function workspaceHref(cwd: string): string {
  return `/workspaces?workspace=${encodeURIComponent(cwd)}`;
}

function workspaceIssueHref(workspace: WorkspaceInventoryItem, issueId: string): string {
  const projectId =
    workspace.ownership?.project?.projectId ??
    workspace.issues?.find((issue) => issue.issueId === issueId)?.projectId;
  return projectId
    ? `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}`
    : `/issues/${encodeURIComponent(issueId)}`;
}

function nextActivePanel(
  visibility: WorkspacePanelVisibility,
  current: WorkspacePanelKey,
): WorkspacePanelKey {
  const visiblePanels = getVisiblePanels(visibility);
  return visiblePanels.includes(current) ? current : visiblePanels[0];
}

function formatRunStatus(run: Record<string, unknown>): string {
  return typeof run.status === "string" && run.status.length > 0 ? run.status : "unknown";
}

function formatSessionUpdatedAt(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) {
    return "No live session heartbeat";
  }
  return new Date(value).toLocaleString();
}

function statusTone(status: string): string {
  if (status === "active") {
    return "border-success/20 bg-success/10 text-success";
  }
  return "border-border text-foreground-muted";
}

function WorkspaceCommandBar(props: {
  open: boolean;
  visibility: WorkspacePanelVisibility;
  onOpenChange: (open: boolean) => void;
  onTogglePanel: (panel: WorkspacePanelKey) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!props.open) {
      setQuery("");
    }
  }, [props.open]);

  const commands = useMemo(
    () =>
      PANEL_DEFINITIONS.map((panel) => ({
        ...panel,
        description: props.visibility[panel.key] ? "Hide panel" : "Show panel",
      })).filter((panel) => {
        const haystack = `${panel.label} ${panel.description}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      }),
    [props.visibility, query],
  );

  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          data-testid="workspace-command-bar"
          className="fixed left-1/2 top-20 z-50 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-border bg-card p-4 shadow-2xl"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3">
            <Search className="h-4 w-4 text-foreground-muted" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Toggle workspace panels"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
            />
            <button
              type="button"
              onClick={() => props.onOpenChange(false)}
              className="rounded-full p-2 text-foreground-muted transition-colors hover:text-foreground"
              aria-label="Close command bar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            {commands.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.key}
                  type="button"
                  data-testid={`workspace-command-${command.key}`}
                  onClick={() => {
                    props.onTogglePanel(command.key);
                    props.onOpenChange(false);
                  }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-background"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">{command.label}</span>
                      <span className="block text-xs text-foreground-muted">{command.description}</span>
                    </span>
                  </span>
                  <span className="rounded-full border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                    {command.shortcut}
                  </span>
                </button>
              );
            })}
            {commands.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-foreground-muted">
                No panel commands match this query.
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WorkspacePanelFrame(props: {
  title: string;
  subtitle?: string;
  panelKey: WorkspacePanelKey;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={`workspace-panel-${props.panelKey}`}
      className="flex h-full min-h-0 flex-col rounded-3xl border border-border bg-card shadow-lg"
    >
      <div className="border-b border-border px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">{props.title}</div>
        {props.subtitle ? (
          <div className="mt-1 text-sm text-foreground-muted">{props.subtitle}</div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">{props.children}</div>
    </section>
  );
}

function WorkspaceResizeHandle(props: {
  testId: string;
  onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-testid={props.testId}
      aria-label="Resize panels"
      onMouseDown={props.onMouseDown}
      className="group flex h-full w-full cursor-col-resize items-center justify-center rounded-full bg-transparent text-foreground-muted transition-colors hover:bg-primary/8 hover:text-primary"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}

function EmptyWorkspaceState(props: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm">
      <div className="font-medium text-foreground">{props.title}</div>
      <p className="mt-2 leading-6 text-foreground-muted">{props.body}</p>
    </div>
  );
}

export function WorkspaceDetailShell(props: WorkspaceDetailShellProps) {
  const [sidebarOpen, setSidebarOpen] = usePersistedState("workspace-layout.sidebar-open", true);
  const [conversationOpen, setConversationOpen] = usePersistedState("workspace-layout.conversation-open", true);
  const [contextOpen, setContextOpen] = usePersistedState("workspace-layout.context-open", true);
  const [detailsOpen, setDetailsOpen] = usePersistedState("workspace-layout.details-open", true);
  const [desktopSizes, setDesktopSizes] = usePersistedState<WorkspacePanelSizes>(
    "workspace-layout.desktop-sizes",
    DEFAULT_WORKSPACE_PANEL_SIZES,
  );
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [activeConstrainedPanel, setActiveConstrainedPanel] = useState<WorkspacePanelKey>("conversation");
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? DESKTOP_LAYOUT_BREAKPOINT : window.innerWidth,
  );
  const shellRef = useRef<HTMLDivElement>(null);

  const visibility = useMemo<WorkspacePanelVisibility>(
    () =>
      ensureVisiblePanels({
        sidebar: sidebarOpen,
        conversation: conversationOpen,
        context: contextOpen,
        details: detailsOpen,
      }),
    [contextOpen, conversationOpen, detailsOpen, sidebarOpen],
  );
  const visiblePanels = useMemo(() => getVisiblePanels(visibility), [visibility]);
  const normalizedSizes = useMemo(
    () => normalizeWorkspacePanelSizes(desktopSizes, visibility),
    [desktopSizes, visibility],
  );
  const isConstrained = viewportWidth < DESKTOP_LAYOUT_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setActiveConstrainedPanel((current) => nextActivePanel(visibility, current));
  }, [visibility]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.tagName === "SELECT" ||
          target?.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        setCommandBarOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const applyVisibility = (next: WorkspacePanelVisibility) => {
    const safeNext = ensureVisiblePanels(next);
    setSidebarOpen(safeNext.sidebar);
    setConversationOpen(safeNext.conversation);
    setContextOpen(safeNext.context);
    setDetailsOpen(safeNext.details);
    setActiveConstrainedPanel((current) => nextActivePanel(safeNext, current));
  };

  const togglePanel = (panel: WorkspacePanelKey) => {
    applyVisibility(toggleWorkspacePanel(visibility, panel));
  };

  const beginResize = (leftPanel: WorkspacePanelKey, rightPanel: WorkspacePanelKey) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isConstrained || !shellRef.current) {
        return;
      }

      event.preventDefault();
      const shellWidth = shellRef.current.getBoundingClientRect().width || 1;
      const startX = event.clientX;
      const startSizes = desktopSizes;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaPercentage = ((moveEvent.clientX - startX) / shellWidth) * 100;
        setDesktopSizes(
          resizeWorkspacePanels({
            sizes: startSizes,
            visibility,
            leftPanel,
            rightPanel,
            deltaPercentage,
          }),
        );
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

  useKeyboard([
    { key: "W", shift: true, action: () => togglePanel("sidebar"), description: "Toggle workspace sidebar" },
    { key: "C", shift: true, action: () => togglePanel("conversation"), description: "Toggle session panel" },
    { key: "X", shift: true, action: () => togglePanel("context"), description: "Toggle context panel" },
    { key: "D", shift: true, action: () => togglePanel("details"), description: "Toggle runtime panel" },
  ]);

  const desktopColumns = useMemo(() => {
    const columns: string[] = [];
    visiblePanels.forEach((panel, index) => {
      columns.push(`minmax(0, ${normalizedSizes[panel]}fr)`);
      if (index < visiblePanels.length - 1) {
        columns.push("0.85rem");
      }
    });
    return columns.join(" ");
  }, [normalizedSizes, visiblePanels]);

  const activeSessionLabel = props.activeSession?.title ?? props.activeSession?.sessionId ?? "No session selected";
  const runtime = props.activeSession?.runtime;

  const renderPanel = (panel: WorkspacePanelKey) => {
    if (panel === "sidebar") {
      return (
        <WorkspacePanelFrame
          panelKey="sidebar"
          title="Sidebar"
          subtitle="Lifecycle controls, session roster, and operator notes"
        >
          <div className="grid gap-4">
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium text-foreground">Workspace sessions</div>
              </div>
              <div className="mt-4 grid gap-3">
                {props.sessions.map((session) => (
                  <button
                    key={session.sessionId}
                    type="button"
                    onClick={() => props.onSelectSession(session.sessionId)}
                    className={`rounded-2xl border bg-card/80 p-3 text-left transition-colors hover:border-primary/30 ${
                      session.sessionId === props.selectedSessionId ? "border-primary/40" : "border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {session.title ?? session.sessionId}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${statusTone(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-foreground-muted">
                      <span>{session.agent}</span>
                      {session.latestRunId ? <span>{session.latestRunId}</span> : null}
                    </div>
                  </button>
                ))}
                {props.sessions.length === 0 ? (
                  <EmptyWorkspaceState
                    title="No attached sessions"
                    body="This workspace is present in the lifecycle inventory, but no gateway session is currently publishing into it."
                  />
                ) : null}
              </div>
            </div>

            <WorkspaceDetailsSidebar
              workspace={props.workspace}
              runtime={runtime}
              reviewArtifact={props.reviewArtifact}
              sessionId={props.activeSession?.sessionId}
              pendingAction={props.pendingAction}
              notesSaving={props.notesSaving}
              reviewPending={props.reviewPending}
              feedback={props.feedback}
              onAction={props.onAction}
              onOpenInEditor={props.onOpenInEditor}
              onSaveNote={props.onSaveNote}
              onCreatePullRequest={props.onCreatePullRequest}
              onLinkPullRequest={props.onLinkPullRequest}
            />
          </div>
        </WorkspacePanelFrame>
      );
    }

    if (panel === "conversation") {
      return (
        <WorkspacePanelFrame
          panelKey="conversation"
          title="Session"
          subtitle="Selected session transcript and next-turn input"
        >
          <SessionConversationSurface
            sessionId={props.activeSession?.sessionId ?? "no-session"}
            sessionLabel={activeSessionLabel}
            sessionAgent={props.activeSession?.agent ?? "unknown"}
            sessionStatus={props.activeSession?.status ?? "inactive"}
            sessionModel={null}
            runs={props.runs}
            eventBuffers={props.eventBuffers}
            workspacePath={props.workspace.path}
            runtime={runtime}
            disabled={!props.activeSession}
            emptyStateTitle="No transcript events"
            emptyStateBody={
              props.activeSession
                ? "The selected session has not published transcript, tool, or file attention events yet."
                : "Select a session from this workspace to inspect transcript activity and continue the conversation."
            }
            openSessionHref={props.activeSession ? `/sessions/${props.activeSession.sessionId}` : undefined}
            placeholder={
              props.activeSession
                ? "Continue the selected session..."
                : "Select a session to continue the conversation."
            }
            onSubmit={props.onSubmit}
          />
        </WorkspacePanelFrame>
      );
    }

    if (panel === "context") {
      return (
        <WorkspacePanelFrame
          panelKey="context"
          title="Context"
          subtitle="Execution reconstruction for the selected session"
        >
          {props.activeSession ? (
            <SessionObservabilityPanel
              sessionId={props.activeSession.sessionId}
              runs={props.runs}
              eventBuffers={props.eventBuffers}
              workspacePath={props.workspace.path}
              runtime={runtime}
            />
          ) : (
            <EmptyWorkspaceState
              title="No session context"
              body="Choose a session from the context bar or sidebar to unlock flow, timeline, transcript, and file attention views."
            />
          )}
        </WorkspacePanelFrame>
      );
    }

    return (
      <WorkspacePanelFrame
        panelKey="details"
        title="Runtime"
        subtitle="Preview, shell, run history, and workspace-linked activity"
      >
        <div className="grid gap-4">
          {runtime ? (
            <WorkspaceRuntimePanel
              runtime={runtime}
              rebase={props.workspace.rebase}
              sessionId={props.activeSession?.sessionId}
              sessionStatus={props.activeSession?.status ?? "inactive"}
              className="border-0 bg-transparent p-0 shadow-none"
            />
          ) : (
            <EmptyWorkspaceState
              title="Runtime details unavailable"
              body="No selected session in this workspace is currently publishing preview, terminal, or dev-server surfaces."
            />
          )}

          <div className="rounded-2xl border border-border bg-background/65 p-4">
            <div className="flex items-center gap-2">
              <TerminalSquare className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Workspace runs</div>
            </div>
            <div className="mt-4 grid gap-3">
              {props.runs.map((run) => (
                <article key={String(run.runId)} className="rounded-2xl border border-border bg-card/80 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/runs/${String(run.runId)}`} className="font-mono text-sm text-primary">
                      {String(run.runId)}
                    </Link>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                      {formatRunStatus(run)}
                    </span>
                  </div>
                </article>
              ))}
              {props.runs.length === 0 ? (
                <EmptyWorkspaceState
                  title="No runs recorded"
                  body="Runs will appear here once the selected session starts or resumes work inside this workspace."
                />
              ) : null}
            </div>
          </div>
        </div>
      </WorkspacePanelFrame>
    );
  };

  return (
    <div data-testid="workspace-shell" className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <Link href="/workspaces" className="inline-flex items-center gap-1 text-primary">
                <ChevronLeft className="h-4 w-4" />
                Workspaces
              </Link>
              <span>/</span>
              <span className="font-mono text-xs text-foreground-secondary">{props.workspace.path}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{props.workspace.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              This route keeps the workspace itself at the center: session switching, lifecycle controls,
              context reconstruction, and runtime surfaces stay in a single resizable shell.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onOpenInEditor(props.workspace, props.workspace.links.editorHref)}
            >
              <ExternalLink className="h-4 w-4" />
              Open in editor
            </Button>
            {props.activeSession ? (
              <Button asChild type="button" variant="outline">
                <Link href={`/sessions/${props.activeSession.sessionId}`}>View session</Link>
              </Button>
            ) : null}
            {PANEL_DEFINITIONS.map((panel) => {
              const Icon = panel.icon;
              return (
                <Button
                  key={panel.key}
                  type="button"
                  variant={visibility[panel.key] ? "default" : "outline"}
                  size="sm"
                  data-testid={`panel-toggle-${panel.key}`}
                  aria-pressed={visibility[panel.key]}
                  onClick={() => togglePanel(panel.key)}
                >
                  <Icon className="h-4 w-4" />
                  {panel.label}
                </Button>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="workspace-command-bar-trigger"
              onClick={() => setCommandBarOpen(true)}
            >
              <Search className="h-4 w-4" />
              Command bar
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Status</p>
              <p className="mt-2 text-base font-semibold text-foreground">{props.workspace.status}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Branch</p>
              <p className="mt-2 break-all font-mono text-sm text-foreground">{props.workspace.git.branch ?? "Unavailable"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Sessions</p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {props.workspace.sessions.active}/{props.workspace.sessions.total}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Runs</p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {props.workspace.runs.active}/{props.workspace.runs.total}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/65 p-4" data-testid="workspace-context-bar">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Active session</p>
                <p className="mt-1 text-sm font-medium text-foreground">{activeSessionLabel}</p>
                {props.activeSession ? (
                  <p className="mt-1 text-xs text-foreground-muted">
                    Updated {formatSessionUpdatedAt(props.activeSession.updatedAt)}
                  </p>
                ) : null}
                {props.workspace.ownership ? (
                  <div className="mt-3 text-xs text-foreground-muted" data-testid="workspace-ownership-summary">
                    <span className="font-semibold text-foreground">Owner:</span>{" "}
                    {props.workspace.ownership.project ? props.workspace.ownership.project.projectKey : "Unassigned"}
                    {props.workspace.ownership.issue ? ` / ${props.workspace.ownership.issue.issueKey}` : ""}
                    {props.workspace.ownership.host ? ` · ${props.workspace.ownership.host.label}` : ""}
                  </div>
                ) : null}
              </div>
              <label className="w-full xl:max-w-sm">
                <span className="sr-only">Select workspace session</span>
                <select
                  data-testid="workspace-session-select"
                  value={props.selectedSessionId ?? ""}
                  onChange={(event) => props.onSelectSession(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                >
                  {props.sessions.length === 0 ? (
                    <option value="">No sessions available</option>
                  ) : null}
                  {props.sessions.map((session) => (
                    <option key={session.sessionId} value={session.sessionId}>
                      {(session.title ?? session.sessionId)} · {session.status} · {session.agent}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(props.workspace.issues ?? []).length > 0 ? (
                (props.workspace.issues ?? []).map((issue) => (
                  <Link
                    key={`${props.workspace.path}-${issue.issueId}`}
                    href={workspaceIssueHref(props.workspace, issue.issueId)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-primary"
                    data-testid={`workspace-issue-link-${issue.issueKey}`}
                  >
                    {issue.issueKey}
                  </Link>
                ))
              ) : (
                <span className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted">
                  No linked issues
                </span>
              )}
            </div>
          </div>
        </div>

        <div data-testid="workspace-navbar" className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs text-foreground-muted [scrollbar-width:none]">
          {PANEL_DEFINITIONS.map((panel) => (
            <span key={panel.key} className="shrink-0 rounded-full border border-border px-3 py-1.5">
              {panel.label}: {panel.shortcut}
            </span>
          ))}
          <span className="shrink-0 rounded-full border border-border px-3 py-1.5">Command bar: Ctrl/Cmd+K</span>
          {props.workspace.git.root ? (
            <Link href={workspaceHref(props.workspace.path)} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-primary">
              Canonical workspace link
            </Link>
          ) : null}
        </div>
      </section>

      {isConstrained ? (
        <section className="rounded-3xl border border-border bg-card p-4 shadow-lg">
          <div className="flex flex-wrap gap-2" data-testid="workspace-mobile-panel-selector">
            {visiblePanels.map((panel) => (
              <Button
                key={panel}
                type="button"
                data-testid={`workspace-mobile-panel-${panel}`}
                variant={activeConstrainedPanel === panel ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveConstrainedPanel(panel)}
              >
                {PANEL_DEFINITIONS.find((item) => item.key === panel)?.label ?? panel}
              </Button>
            ))}
          </div>
          <div className="mt-4 min-h-[65vh]">{renderPanel(activeConstrainedPanel)}</div>
        </section>
      ) : (
        <div
          ref={shellRef}
          data-testid="workspace-desktop-panels"
          className="grid min-h-[72vh] flex-1 items-stretch"
          style={{ gridTemplateColumns: desktopColumns }}
        >
          {visiblePanels.map((panel, index) => {
            const nextPanel = visiblePanels[index + 1];
            return (
              <div key={panel} className="contents">
                {renderPanel(panel)}
                {nextPanel ? (
                  <div className="flex items-stretch justify-center py-2">
                    <WorkspaceResizeHandle
                      testId={`workspace-resize-${panel}-${nextPanel}`}
                      onMouseDown={beginResize(panel, nextPanel)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <WorkspaceCommandBar
        open={commandBarOpen}
        visibility={visibility}
        onOpenChange={setCommandBarOpen}
        onTogglePanel={togglePanel}
      />
    </div>
  );
}
