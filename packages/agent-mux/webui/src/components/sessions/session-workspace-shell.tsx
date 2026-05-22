"use client";

import { Link, useNavigate } from "react-router-dom-v6";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Attachment } from "@a5c-ai/agent-mux-core";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import type { SessionCost, SessionFlowModel } from "@a5c-ai/agent-mux-ui/session-flow";
import { ExternalLink, GripVertical, LayoutDashboard, MessagesSquare, PanelLeft, PanelRight, Search, TerminalSquare, Workflow } from "lucide-react";

import { SessionConversationSurface } from "@/components/sessions/session-conversation-surface";
import { SessionObservabilityPanel } from "@/components/sessions/session-observability-panel";
import { Button, CommandPalette } from "@a5c-ai/compendium";
import type { CommandItem } from "@a5c-ai/compendium";
import { useKeyboard } from "@/hooks/use-keyboard";
import { usePersistedState } from "@/hooks/use-persisted-state";
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
import { WorkspaceRuntimePanel } from "@/components/workspaces/workspace-runtime-panel";

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
  shellStorageKeyPrefix?: string;
  desktopPanelSizes?: WorkspacePanelSizes;
  flowModelOverride?: SessionFlowModel;
  sessionCostOverride?: SessionCost | null;
  conversationDisabled?: boolean;
  conversationPlaceholder?: string;
  conversationSubmitLabel?: string;
  conversationEmptyStateTitle?: string;
  conversationEmptyStateBody?: string;
  conversationSupplement?: React.ReactNode;
  heroEyebrow?: string;
  heroBody?: string;
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
  { key: "conversation", label: "Chat", shortcut: "Shift+C", icon: MessagesSquare },
  { key: "context", label: "Trace", shortcut: "Shift+X", icon: Workflow },
  { key: "details", label: "Runtime", shortcut: "Shift+D", icon: PanelRight },
];

const DEFAULT_SESSION_SHELL_SIZES: WorkspacePanelSizes = {
  sidebar: 16,
  conversation: 62,
  context: 12,
  details: 10,
};

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
  const items = useMemo<CommandItem[]>(
    () =>
      PANEL_DEFINITIONS.map((panel) => ({
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

export function SessionWorkspaceShell(props: SessionWorkspaceShellProps) {
  const navigate = useNavigate();
  const storagePrefix = props.shellStorageKeyPrefix ?? `session-workspace-layout-v4.${props.sessionId}`;
  const [sidebarOpen, setSidebarOpen] = usePersistedState(`${storagePrefix}.sidebar-open`, true);
  const [conversationOpen, setConversationOpen] = usePersistedState(`${storagePrefix}.conversation-open`, true);
  const [contextOpen, setContextOpen] = usePersistedState(`${storagePrefix}.context-open`, false);
  const [detailsOpen, setDetailsOpen] = usePersistedState(`${storagePrefix}.details-open`, false);
  const [desktopSizes, setDesktopSizes] = usePersistedState<WorkspacePanelSizes>(
    `${storagePrefix}.desktop-sizes`,
    props.desktopPanelSizes ?? DEFAULT_SESSION_SHELL_SIZES,
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
          subtitle="Session context and quick links"
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
                  <Button size="sm" variant="ghost" onClick={() => navigate(workspaceHref(props.workspacePath!))}>
                    Open workspace
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium text-foreground">Dispatches in this session</div>
              </div>
              <div className="mt-4 grid gap-3">
                {props.runs.map((run) => (
                  <article key={String(run.runId)} className="rounded-2xl border border-border bg-card/80 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/dispatches/${String(run.runId)}`} className="font-mono text-sm text-primary">
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
                    No dispatches recorded for this session yet.
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
          title="Chat"
          subtitle="Transcript and the next turn"
          bodyClassName="min-h-0 flex-1 overflow-hidden p-4"
        >
          {props.conversationSupplement ? (
            <div className="mb-4">{props.conversationSupplement}</div>
          ) : null}
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
            disabled={props.conversationDisabled}
            emptyStateTitle={props.conversationEmptyStateTitle ?? "No transcript events yet"}
            emptyStateBody={
              props.conversationEmptyStateBody ??
              "The transcript will appear here as soon as the gateway or native session history has something to show."
            }
            placeholder={props.conversationPlaceholder ?? "Continue the session..."}
            submitLabel={props.conversationSubmitLabel}
            flowModelOverride={props.flowModelOverride}
            sessionCostOverride={props.sessionCostOverride}
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
          subtitle="Dispatch flow, files, and breakpoint context"
        >
          <SessionObservabilityPanel
            sessionId={props.sessionId}
            runs={props.runs}
            eventBuffers={props.eventBuffers}
            workspacePath={props.workspacePath}
            runtime={props.runtime}
            flowModelOverride={props.flowModelOverride}
          />
        </WorkspacePanelFrame>
      );
    }

    return (
      <WorkspacePanelFrame
        panelKey="details"
        title="Runtime"
        subtitle="Preview, shell, and live workspace output"
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
                Preview, terminal, and dev-server details will appear here once this session starts publishing them.
              </p>
            </div>
            {props.workspacePath ? (
              <a
                href={workspaceHref(props.workspacePath)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/65 px-4 py-3 text-sm text-primary transition-colors hover:border-primary/30"
              >
                <ExternalLink className="h-4 w-4" />
                Open workspace
              </a>
            ) : null}
          </div>
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
              <Link to="/sessions" className="text-primary">Sessions</Link>
              <span>/</span>
              <span className="font-mono text-xs text-foreground-secondary">{props.sessionId}</span>
            </div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              {props.heroEyebrow ?? "Session workspace"}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight" style={{ fontSize: "1.5rem", lineHeight: 1.1 }}>
              {props.sessionTitle}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-muted">
              {props.heroBody ??
                "Keep the chat primary while dispatch trace, runtime hook history, and runtime stay close enough to open only when needed."}
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
          </div>
        </div>

        <details className="mt-3 rounded-2xl border border-border bg-background/65">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground">
            <span>Shortcuts and layout</span>
            <span className="text-xs text-foreground-muted">Reveal keyboard hints and the command bar only when needed</span>
          </summary>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-4 text-xs text-foreground-muted">
            {PANEL_DEFINITIONS.map((panel) => (
              <span key={panel.key} className="rounded-full border border-border px-3 py-1.5">
                {panel.label}: {panel.shortcut}
              </span>
            ))}
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
        </details>
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
