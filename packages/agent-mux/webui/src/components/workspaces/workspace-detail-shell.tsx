"use client";

import { Link, useNavigate } from "react-router-dom-v6";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Attachment } from "@a5c-ai/agent-mux-core";
import { ChevronLeft, ExternalLink, GripVertical, LayoutDashboard, MessagesSquare, PanelLeft, PanelRight, Workflow } from "lucide-react";

import { SessionConversationSurface } from "@/components/sessions/session-conversation-surface";
import { SessionObservabilityPanel } from "@/components/sessions/session-observability-panel";
import { Button, CommandPalette, Select } from "@a5c-ai/compendium";
import type { CommandItem } from "@a5c-ai/compendium";
import { useKeyboard } from "@/hooks/use-keyboard";
import { usePersistedState } from "@/hooks/use-persisted-state";
import type { KanbanIntegrationProvider, KanbanReviewArtifact } from "@a5c-ai/agent-mux-core/kanban";
import {
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
  canSendMessages?: boolean;
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
  { key: "sidebar", label: "Workspace", shortcut: "Shift+W", icon: PanelLeft },
  { key: "conversation", label: "Chat", shortcut: "Shift+C", icon: MessagesSquare },
  { key: "context", label: "Trace", shortcut: "Shift+X", icon: Workflow },
  { key: "details", label: "Runtime", shortcut: "Shift+D", icon: PanelRight },
];

const DEFAULT_WORKSPACE_DETAIL_SIZES: WorkspacePanelSizes = {
  sidebar: 22,
  conversation: 58,
  context: 12,
  details: 8,
};

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
  panels: PanelDefinition[];
  visibility: WorkspacePanelVisibility;
  onOpenChange: (open: boolean) => void;
  onTogglePanel: (panel: WorkspacePanelKey) => void;
}) {
  const items = useMemo<CommandItem[]>(
    () =>
      props.panels.map((panel) => ({
        id: panel.key,
        label: panel.label,
        shortcut: panel.shortcut,
        group: "Panels",
        onSelect: () => {
          props.onTogglePanel(panel.key);
          props.onOpenChange(false);
        },
      })),
    [props],
  );

  return (
    <CommandPalette
      open={props.open}
      onClose={() => props.onOpenChange(false)}
      items={items}
      placeholder="Toggle workspace panels"
    />
  );
}

function WorkspacePanelFrame(props: {
  title: string;
  subtitle?: string;
  panelKey: WorkspacePanelKey;
  children: React.ReactNode;
  bodyClassName?: string;
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
      <div className={props.bodyClassName ?? "min-h-0 flex-1 overflow-auto p-4"}>{props.children}</div>
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
  const navigate = useNavigate();
  const storagePrefix = `workspace-detail-layout-v4.${props.workspace.path}`;
  const [sidebarOpen, setSidebarOpen] = usePersistedState(`${storagePrefix}.sidebar-open`, true);
  const [conversationOpen, setConversationOpen] = usePersistedState(`${storagePrefix}.conversation-open`, true);
  const [contextOpen, setContextOpen] = usePersistedState(`${storagePrefix}.context-open`, false);
  const [detailsOpen, setDetailsOpen] = usePersistedState(`${storagePrefix}.details-open`, false);
  const [desktopSizes, setDesktopSizes] = usePersistedState<WorkspacePanelSizes>(
    `${storagePrefix}.desktop-sizes`,
    DEFAULT_WORKSPACE_DETAIL_SIZES,
  );
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [activeConstrainedPanel, setActiveConstrainedPanel] = useState<WorkspacePanelKey>("conversation");
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? DESKTOP_LAYOUT_BREAKPOINT : window.innerWidth,
  );
  const [minimalLayoutAppliedForWorkspace, setMinimalLayoutAppliedForWorkspace] = useState<string | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const linkedIssue = props.workspace.issues?.[0] ?? null;
  const newSessionHref = `/sessions/new?workspacePath=${encodeURIComponent(props.workspace.path)}${
    linkedIssue ? `&issueId=${encodeURIComponent(linkedIssue.issueId)}&issueKey=${encodeURIComponent(linkedIssue.issueKey)}` : ""
  }`;
  const hasSessions = props.sessions.length > 0;
  const availablePanels = hasSessions
    ? PANEL_DEFINITIONS
    : PANEL_DEFINITIONS.filter((panel) => panel.key === "sidebar");

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
    if (!hasSessions && panel !== "sidebar") {
      return;
    }
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
  const canSendMessages = props.canSendMessages ?? true;
  const forceMinimalWorkspaceDefaults = !props.activeSession && props.sessions.length === 0;

  useEffect(() => {
    if (!forceMinimalWorkspaceDefaults) {
      setMinimalLayoutAppliedForWorkspace(null);
      return;
    }
    if (minimalLayoutAppliedForWorkspace === props.workspace.path) {
      return;
    }

    setConversationOpen(false);
    setContextOpen(false);
    setDetailsOpen(false);
    setMinimalLayoutAppliedForWorkspace(props.workspace.path);
  }, [
    forceMinimalWorkspaceDefaults,
    minimalLayoutAppliedForWorkspace,
    props.workspace.path,
    setContextOpen,
    setConversationOpen,
    setDetailsOpen,
  ]);

  useEffect(() => {
    if (!props.activeSession) {
      return;
    }
    setSidebarOpen(true);
    setConversationOpen(true);
    setActiveConstrainedPanel("conversation");
  }, [props.activeSession, props.workspace.path, setConversationOpen, setSidebarOpen]);

  const renderPanel = (panel: WorkspacePanelKey) => {
    if (panel === "sidebar") {
      return (
        <WorkspacePanelFrame
          panelKey="sidebar"
          title="Workspace"
          subtitle={hasSessions ? "Issue link, session roster, and quick actions" : "Issue link, workspace status, and next steps"}
        >
          <div className="grid gap-4">
            {hasSessions ? (
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
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background/65 p-4">
                <div className="text-sm font-medium text-foreground">No linked session yet</div>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  This workspace still keeps its issue and repo context here. Link or start a session from the board when you want the chat and runtime to appear beside it.
                </p>
                <div className="mt-4">
                  <Button type="button" size="sm" onClick={() => navigate(newSessionHref)}>
                    Start workspace session
                  </Button>
                </div>
              </div>
            )}

            <WorkspaceDetailsSidebar
              workspace={props.workspace}
              runtime={runtime}
              reviewArtifact={props.reviewArtifact}
              sessionId={props.activeSession?.sessionId}
              sessionStatus={props.activeSession?.status}
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
      if (!canSendMessages) {
        return (
          <WorkspacePanelFrame
            panelKey="conversation"
            title="Session chat"
            subtitle="Selected session transcript, runtime notes, and next-turn input"
          >
            <EmptyWorkspaceState
              title="Connect the gateway to open live chat"
              body="This workspace can still be browsed locally, but session transcript and new messages require a connected gateway."
            />
          </WorkspacePanelFrame>
        );
      }

      return (
        <WorkspacePanelFrame
          panelKey="conversation"
          title="Session chat"
          subtitle="Transcript first, controls second"
          bodyClassName="min-h-0 flex-1 overflow-hidden p-4"
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
            disabled={!props.activeSession || !canSendMessages}
            emptyStateTitle="No transcript events"
            emptyStateBody={
              !props.activeSession
                ? "Select a session from this workspace to inspect transcript activity and continue the conversation."
                : !canSendMessages
                  ? "Connect the gateway to continue this session from the workspace view."
                  : "The selected session has not published transcript, tool, or file attention events yet."
            }
            openSessionHref={props.activeSession ? `/sessions/${props.activeSession.sessionId}` : undefined}
            placeholder={
              !props.activeSession
                ? "Select a session to continue the conversation."
                : !canSendMessages
                  ? "Connect the gateway to send a new message."
                  : "Continue the selected session..."
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
          title="Trace"
          subtitle="Dispatch trace, files, and execution history"
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
              body="Choose a session to unlock trace and file activity beside the chat."
            />
          )}
        </WorkspacePanelFrame>
      );
    }

    return (
      <WorkspacePanelFrame
        panelKey="details"
        title="Runtime"
        subtitle="Preview, shell, and workspace output"
      >
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
            body="The selected session is not currently publishing preview, terminal, or dev-server output."
          />
        )}
      </WorkspacePanelFrame>
    );
  };

  return (
    <div
      data-testid="workspace-shell"
      className="flex h-full min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden px-3 py-4 sm:px-5 sm:py-6 xl:px-6"
    >
      <section className="shrink-0 rounded-3xl border border-border bg-card p-4 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <Link to="/workspaces" className="inline-flex items-center gap-1 text-primary">
                <ChevronLeft className="h-4 w-4" />
                Workspaces
              </Link>
              <span>/</span>
              <span className="font-mono text-xs text-foreground-secondary">{props.workspace.path}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight" style={{ fontSize: "1.5rem", lineHeight: 1.1 }}>
              {props.workspace.name}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-muted">
              {linkedIssue
                ? `${linkedIssue.issueKey} stays pinned here while the linked session chat and runtime stay beside it.`
                : "Keep the workspace, chat, and runtime together so you can continue work without losing context."}
            </p>
            {linkedIssue ? (
              <div className="mt-3">
                <Link
                  to={workspaceIssueHref(props.workspace, linkedIssue.issueId)}
                  className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm text-primary"
                  data-testid={`workspace-primary-issue-link-${linkedIssue.issueKey}`}
                >
                  {linkedIssue.issueKey}
                  <span className="ml-1 text-foreground-muted">· {linkedIssue.issueTitle}</span>
                </Link>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => props.onOpenInEditor(props.workspace, props.workspace.links.editorHref)}
            >
              <ExternalLink className="h-4 w-4" />
              Open in editor
            </Button>
            {props.activeSession ? (
              <Button type="button" variant="ghost" onClick={() => navigate(`/sessions/${props.activeSession!.sessionId}`)}>
                View session
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => navigate(newSessionHref)}>
              New session
            </Button>
            {availablePanels.map((panel) => {
              const Icon = panel.icon;
              return (
                <Button
                  key={panel.key}
                  type="button"
                  variant={visibility[panel.key] ? "default" : "ghost"}
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
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-sm">
              <span className="text-foreground-muted">Status</span>
              <span className="ml-2 font-medium text-foreground">{props.workspace.status}</span>
            </div>
            <div className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-sm">
              <span className="text-foreground-muted">Branch</span>
              <span className="ml-2 font-mono text-foreground">{props.workspace.git.branch ?? "Unavailable"}</span>
            </div>
            <div className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-sm">
              <span className="text-foreground-muted">Sessions</span>
              <span className="ml-2 font-medium text-foreground">{props.workspace.sessions.active}/{props.workspace.sessions.total}</span>
            </div>
            <div className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-sm">
              <span className="text-foreground-muted">Dispatches</span>
              <span className="ml-2 font-medium text-foreground">{props.workspace.runs.active}/{props.workspace.runs.total}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/65 p-4" data-testid="workspace-context-bar">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                  {hasSessions ? "Session" : "Workspace focus"}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {hasSessions ? activeSessionLabel : "Issue and repo stay visible here until a session attaches"}
                </p>
                {props.activeSession ? (
                  <p className="mt-1 text-xs text-foreground-muted">
                    Updated {formatSessionUpdatedAt(props.activeSession.updatedAt)}
                  </p>
                ) : !hasSessions ? (
                  <p className="mt-1 text-xs text-foreground-muted">
                    Open the linked issue or board when you want to create a session against this workspace.
                  </p>
                ) : null}
                {props.workspace.ownership ? (
                  <div className="mt-3 text-xs text-foreground-muted" data-testid="workspace-ownership-summary">
                    <span className="font-semibold text-foreground">Linked to:</span>{" "}
                    {props.workspace.ownership.project ? props.workspace.ownership.project.projectKey : "Unassigned"}
                    {props.workspace.ownership.issue ? ` / ${props.workspace.ownership.issue.issueKey}` : ""}
                    {props.workspace.ownership.host ? ` · ${props.workspace.ownership.host.label}` : ""}
                  </div>
                ) : null}
              </div>
              {hasSessions ? (
                <label className="w-full xl:max-w-sm" data-testid="workspace-session-select">
                  <span className="sr-only">Select workspace session</span>
                  <Select
                    value={props.selectedSessionId ?? ""}
                    onChange={props.onSelectSession}
                    options={props.sessions.map((session) => ({
                      label: `${session.title ?? session.sessionId} · ${session.status} · ${session.agent}`,
                      value: session.sessionId,
                    }))}
                  />
                </label>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-foreground-muted">
                  No sessions attached
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(props.workspace.issues ?? []).length > 0 ? (
                (props.workspace.issues ?? []).map((issue) => (
                  <Link
                    key={`${props.workspace.path}-${issue.issueId}`}
                    to={workspaceIssueHref(props.workspace, issue.issueId)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-primary"
                    data-testid={`workspace-issue-link-${issue.issueKey}`}
                    title={issue.issueTitle}
                  >
                    {issue.issueKey}
                    <span className="ml-1 text-foreground-muted">· {issue.issueTitle}</span>
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
      </section>

      {isConstrained ? (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-lg">
            <div className="flex flex-wrap gap-2" data-testid="workspace-mobile-panel-selector">
            {visiblePanels.map((panel) => (
              <Button
                key={panel}
                type="button"
                data-testid={`workspace-mobile-panel-${panel}`}
                variant={activeConstrainedPanel === panel ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveConstrainedPanel(panel)}
              >
                {PANEL_DEFINITIONS.find((item) => item.key === panel)?.label ?? panel}
              </Button>
            ))}
          </div>
          <div className="mt-4 min-h-0 flex-1">{renderPanel(activeConstrainedPanel)}</div>
        </section>
      ) : (
        <div
          ref={shellRef}
          data-testid="workspace-desktop-panels"
          className="grid min-h-0 flex-1 items-stretch overflow-hidden"
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
        panels={availablePanels}
        visibility={visibility}
        onOpenChange={setCommandBarOpen}
        onTogglePanel={togglePanel}
      />
    </div>
  );
}
