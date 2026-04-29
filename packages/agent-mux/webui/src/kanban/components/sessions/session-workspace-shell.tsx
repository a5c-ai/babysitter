"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Attachment } from "@a5c-ai/agent-mux-core";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import { ExternalLink, GripVertical, LayoutDashboard, MessagesSquare, PanelLeft, PanelRight, Search, TerminalSquare, Workflow, X } from "lucide-react";

import { SessionConversationSurface } from "@/components/sessions/session-conversation-surface";
import { SessionObservabilityPanel } from "@/components/sessions/session-observability-panel";
import { Button } from "@a5c-ai/compendium";
import { useKeyboard } from "@/hooks/use-keyboard";
import { usePersistedState } from "@/hooks/use-persisted-state";
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
import { WorkspaceRuntimePanel } from "@/components/workspaces/workspace-runtime-panel";
import {
  dialogCloseButtonClassName,
  dialogCommandPanelClassName,
  dialogOverlayClassName,
} from "@/components/shared/dialog-shell";

type EventBuffer = {
  events: Array<Record<string, unknown>>;
};

type SessionWorkspaceShellProps = {
  sessionId: string;
  sessionTitle: string;
  sessionAgent: string;
  sessionStatus: string;
  totalCostLabel: string;
  runs: Array<Record<string, unknown>>;
  eventBuffers: Record<string, EventBuffer | undefined>;
  workspacePath: string | null;
  runtime?: WorkspaceRuntimeSurface;
  sessionModel?: string | null;
  onSubmit: (input: {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
    attachments?: Attachment[];
    approvalMode?: "yolo" | "prompt" | "deny";
  }) => Promise<void>;
};

type PanelDefinition = {
  key: WorkspacePanelKey;
  label: string;
  shortcut: string;
  icon: typeof PanelLeft;
};

const PANEL_DEFINITIONS: PanelDefinition[] = [
  { key: "sidebar", label: "Workspace", shortcut: "Shift+W", icon: PanelLeft },
  { key: "conversation", label: "Conversation", shortcut: "Shift+C", icon: MessagesSquare },
  { key: "context", label: "Context", shortcut: "Shift+X", icon: Workflow },
  { key: "details", label: "Details", shortcut: "Shift+D", icon: PanelRight },
];

function formatRunStatus(run: Record<string, unknown>): string {
  return typeof run.status === "string" && run.status.length > 0 ? run.status : "unknown";
}

function formatRunAgent(run: Record<string, unknown>, fallback: string): string {
  return typeof run.agent === "string" && run.agent.length > 0 ? run.agent : fallback;
}

function workspaceHref(cwd: string): string {
  return `/workspaces?workspace=${encodeURIComponent(cwd)}`;
}

function nextActivePanel(
  visibility: WorkspacePanelVisibility,
  current: WorkspacePanelKey,
): WorkspacePanelKey {
  const visiblePanels = getVisiblePanels(visibility);
  return visiblePanels.includes(current) ? current : visiblePanels[0];
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
        <Dialog.Overlay className={dialogOverlayClassName} />
        <Dialog.Content
          data-testid="workspace-command-bar"
          className={dialogCommandPanelClassName}
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
              className={dialogCloseButtonClassName}
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

export function SessionWorkspaceShell(props: SessionWorkspaceShellProps) {
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
    { key: "C", shift: true, action: () => togglePanel("conversation"), description: "Toggle conversation panel" },
    { key: "X", shift: true, action: () => togglePanel("context"), description: "Toggle context panel" },
    { key: "D", shift: true, action: () => togglePanel("details"), description: "Toggle details sidebar" },
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

  const renderPanel = (panel: WorkspacePanelKey) => {
    if (panel === "sidebar") {
      return (
        <WorkspacePanelFrame
          panelKey="sidebar"
          title="Workspace"
          subtitle="Ownership, runs, and entry points"
        >
          <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-foreground-muted">Session</div>
              <div className="mt-2 text-sm font-medium text-foreground">{props.sessionTitle}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                <span className="rounded-full border border-border px-2 py-1">{props.sessionStatus}</span>
                <span className="rounded-full border border-border px-2 py-1">{props.sessionAgent}</span>
                <span className="rounded-full border border-border px-2 py-1">{props.totalCostLabel}</span>
              </div>
            </div>

            {props.workspacePath ? (
              <div className="rounded-2xl border border-border bg-background/65 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-foreground-muted">Workspace path</div>
                <div className="mt-2 break-all font-mono text-xs text-foreground-secondary">
                  {props.workspacePath}
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="ghost">
                    <Link href={workspaceHref(props.workspacePath)}>
                      Open workspace lifecycle
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium text-foreground">Runs in this session</div>
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
                    <div className="mt-2 text-sm text-foreground-muted">
                      {formatRunAgent(run, props.sessionAgent)}
                    </div>
                  </article>
                ))}
                {props.runs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-foreground-muted">
                    No runs recorded for this session yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </WorkspacePanelFrame>
      );
    }

    if (panel === "conversation") {
      return (
        <WorkspacePanelFrame
          panelKey="conversation"
          title="Conversation"
          subtitle="Transcript plus the next turn"
        >
          <SessionConversationSurface
            sessionId={props.sessionId}
            sessionLabel={props.sessionTitle}
            sessionAgent={props.sessionAgent}
            sessionStatus={props.sessionStatus}
            sessionModel={props.sessionModel}
            runs={props.runs}
            eventBuffers={props.eventBuffers}
            workspacePath={props.workspacePath}
            runtime={props.runtime}
            emptyStateTitle="No transcript events yet"
            emptyStateBody="The session shell will start populating transcript, flow, timeline, and file attention views as soon as the gateway publishes run activity."
            placeholder="Continue the session..."
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
          subtitle="Flow, files, and execution reconstruction"
        >
          <SessionObservabilityPanel
            sessionId={props.sessionId}
            runs={props.runs}
            eventBuffers={props.eventBuffers}
            workspacePath={props.workspacePath}
            runtime={props.runtime}
          />
        </WorkspacePanelFrame>
      );
    }

    return (
      <WorkspacePanelFrame
        panelKey="details"
        title="Details"
        subtitle="Runtime and active workspace surfaces"
      >
        {props.runtime ? (
          <WorkspaceRuntimePanel
            runtime={props.runtime}
            sessionId={props.sessionId}
            sessionStatus={props.sessionStatus}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        ) : (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium text-foreground">Runtime details unavailable</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground-muted">
                This session has not published a workspace runtime surface yet. Once preview, shell,
                or dev-server metadata is available it will appear here.
              </p>
            </div>
            {props.workspacePath ? (
              <a
                href={workspaceHref(props.workspacePath)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/65 px-4 py-3 text-sm text-primary transition-colors hover:border-primary/30"
              >
                <ExternalLink className="h-4 w-4" />
                Open workspace lifecycle
              </a>
            ) : null}
          </div>
        )}
      </WorkspacePanelFrame>
    );
  };

  return (
    <div data-testid="workspace-shell" className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <Link href="/sessions" className="text-primary">Sessions</Link>
              <span>/</span>
              <span className="font-mono text-xs text-foreground-secondary">{props.sessionId}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{props.sessionTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              The session route now acts as the workspace shell: sidebar, conversation, context, and
              details stay independently addressable while sharing the same session and runtime state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PANEL_DEFINITIONS.map((panel) => {
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="workspace-command-bar-trigger"
              onClick={() => setCommandBarOpen(true)}
            >
              <Search className="h-4 w-4" />
              Command bar
            </Button>
          </div>
        </div>

        <div data-testid="workspace-navbar" className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs text-foreground-muted [scrollbar-width:none]">
          {PANEL_DEFINITIONS.map((panel) => (
            <span key={panel.key} className="shrink-0 rounded-full border border-border px-3 py-1.5">
              {panel.label}: {panel.shortcut}
            </span>
          ))}
          <span className="shrink-0 rounded-full border border-border px-3 py-1.5">Command bar: Ctrl/Cmd+K</span>
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
                variant={activeConstrainedPanel === panel ? "default" : "ghost"}
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
                <div className="min-h-0">{renderPanel(panel)}</div>
                {nextPanel ? (
                  <WorkspaceResizeHandle
                    testId={`workspace-resize-${panel}-${nextPanel}`}
                    onMouseDown={beginResize(panel, nextPanel)}
                  />
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
