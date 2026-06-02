"use client";

import { Link } from "react-router-dom-v6";
import { useMemo, useState } from "react";
import { Tabs, type TabItem } from "@a5c-ai/compendium";
import { buildSessionFlowModel, type SessionFlowModel } from "@a5c-ai/agent-mux-ui/session-flow";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-comm";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Hand, TerminalSquare } from "lucide-react";

import { buildRunArtifactShortcuts } from "@/lib/babysitter-overlays";

interface EventBuffer {
  events: Array<Record<string, unknown>>;
}

type ActionLink = {
  key: string;
  label: string;
  href: string;
  external?: boolean;
};

type RunActionContext = {
  runId: string;
  runHref: string;
  workspaceHref?: string;
  runtimeHref?: string;
  breakpointHref?: string;
  failedTaskHref?: string;
  fileHref: (path: string) => string | null;
};

function formatFlowTime(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return "unknown";
  }
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function readRuntime(value: unknown): WorkspaceRuntimeSurface | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as WorkspaceRuntimeSurface;
}

function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || value.startsWith("\\\\") || /^[a-zA-Z]:[\\/]/.test(value);
}

function joinWorkspacePath(workspacePath: string, filePath: string): string {
  const separator = workspacePath.includes("\\") ? "\\" : "/";
  const base = workspacePath.replace(/[\\/]+$/, "");
  const relative = filePath.replace(/^[./\\\/]+/, "");
  return `${base}${separator}${relative}`;
}

function resolveAbsoluteFilePath(workspacePath: string | null, filePath: string): string | null {
  if (!filePath.trim()) {
    return null;
  }
  if (isAbsolutePath(filePath)) {
    return filePath;
  }
  if (!workspacePath) {
    return null;
  }
  return joinWorkspacePath(workspacePath, filePath);
}

function buildEditorHref(path: string): string {
  return `vscode://file${path}`;
}

function pickRuntimeHref(runtime: WorkspaceRuntimeSurface | null): string | null {
  if (typeof runtime?.preview?.primaryUrl === "string" && runtime.preview.primaryUrl.length > 0) {
    return runtime.preview.primaryUrl;
  }
  if (typeof runtime?.devServer?.primaryUrl === "string" && runtime.devServer.primaryUrl.length > 0) {
    return runtime.devServer.primaryUrl;
  }
  return null;
}

function actionLinkClassName(action: ActionLink): string {
  return [
    "inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs",
    action.external ? "text-foreground-muted hover:text-foreground" : "text-primary",
  ].join(" ");
}

function ActionLinks(props: { actions: ActionLink[] }): JSX.Element | null {
  if (props.actions.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {props.actions.map((action) =>
        action.external ? (
          <a
            key={action.key}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            className={actionLinkClassName(action)}
          >
            {action.label}
          </a>
        ) : (
          <Link key={action.key} to={action.href} className={actionLinkClassName(action)}>
            {action.label}
          </Link>
        ),
      )}
    </div>
  );
}

export function SessionObservabilityPanel(props: {
  sessionId: string;
  runs: Array<Record<string, unknown>>;
  eventBuffers: Record<string, EventBuffer | undefined>;
  workspacePath?: string | null;
  runtime?: WorkspaceRuntimeSurface | null;
  flowModelOverride?: SessionFlowModel;
}) {
  const [viewMode, setViewMode] = useState<"flow" | "files">("flow");
  const flowModel = useMemo(
    () => props.flowModelOverride ?? buildSessionFlowModel(props.runs, props.eventBuffers),
    [props.eventBuffers, props.flowModelOverride, props.runs],
  );
  const shortcuts = buildRunArtifactShortcuts(props.runs);
  const fallbackRuntimeHref = pickRuntimeHref(props.runtime ?? null);
  const runActionContexts = useMemo(() => {
    const shortcutByRunId = new Map(shortcuts.map((shortcut) => [shortcut.runId, shortcut] as const));
    const entries = props.runs.map((run) => {
      const runId = String(run.runId ?? "");
      const shortcut = shortcutByRunId.get(runId);
      const runWorkspacePath =
        typeof run.cwd === "string" && run.cwd.length > 0
          ? run.cwd
          : props.workspacePath ?? null;
      const runRuntime = readRuntime(run.runtime) ?? props.runtime ?? null;
      const runRuntimeHref = pickRuntimeHref(runRuntime) ?? fallbackRuntimeHref;
      const fileHref = (filePath: string): string | null => {
        const absoluteFilePath = resolveAbsoluteFilePath(runWorkspacePath, filePath);
        return absoluteFilePath ? buildEditorHref(absoluteFilePath) : null;
      };
      return [
        runId,
        {
          runId,
          runHref: `/dispatches/${encodeURIComponent(runId)}`,
          workspaceHref: runWorkspacePath ? buildEditorHref(runWorkspacePath) : undefined,
          runtimeHref: runRuntimeHref ?? undefined,
          breakpointHref: shortcut?.breakpointEffectId ? `/dispatches/${encodeURIComponent(runId)}?effectId=${encodeURIComponent(shortcut.breakpointEffectId)}` : undefined,
          failedTaskHref: shortcut?.errorEffectId ? `/dispatches/${encodeURIComponent(runId)}?effectId=${encodeURIComponent(shortcut.errorEffectId)}` : undefined,
          fileHref,
        } satisfies RunActionContext,
      ] as const;
    });
    return new Map(entries);
  }, [fallbackRuntimeHref, props.runs, props.runtime, props.workspacePath, shortcuts]);

  const buildEntryActions = (runId: string, filePaths: string[], options?: { includeFailures?: boolean }): ActionLink[] => {
    const context = runActionContexts.get(runId);
    if (!context) {
      return [];
    }
    const actions: ActionLink[] = [
      { key: `${runId}:run`, label: "Open dispatch", href: context.runHref },
    ];
    if (options?.includeFailures && context.breakpointHref) {
      actions.push({ key: `${runId}:breakpoint`, label: "Review breakpoint", href: context.breakpointHref });
    }
    if (options?.includeFailures && context.failedTaskHref) {
      actions.push({ key: `${runId}:failed`, label: "Open failed task", href: context.failedTaskHref });
    }
    const resolvedFile = filePaths
      .map((path) => ({ path, href: context.fileHref(path) }))
      .find((entry) => entry.href != null);
    if (resolvedFile?.href) {
      actions.push({
        key: `${runId}:file:${resolvedFile.path}`,
        label: "Open file",
        href: resolvedFile.href,
        external: true,
      });
    }
    if (context.workspaceHref) {
      actions.push({
        key: `${runId}:workspace`,
        label: "Open workspace",
        href: context.workspaceHref,
        external: true,
      });
    }
    if (context.runtimeHref) {
      actions.push({
        key: `${runId}:runtime`,
        label: "Open runtime",
        href: context.runtimeHref,
        external: true,
      });
    }
    return actions;
  };

  const tabItems: TabItem[] = [
    {
      value: "flow",
      label: "Trace",
      badge: flowModel.lanes.length,
      body: (
        <div className="grid gap-4">
          {flowModel.lanes.map((lane) => (
            <article key={lane.runId} className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{lane.agent}</div>
                  <div className="text-xs text-foreground-muted">
                    {lane.startedAt > 0 ? `${formatFlowTime(lane.startedAt)} · ` : ""}
                    dispatch {lane.runId}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
                  <span className="rounded-full border border-border px-2 py-0.5">{lane.status}</span>
                  <span className="rounded-full border border-border px-2 py-0.5">{lane.segmentCount} phases</span>
                  <span className="rounded-full border border-border px-2 py-0.5">{lane.toolCount} tools</span>
                </div>
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {lane.segments.map((segment) => (
                  <article
                    key={segment.id}
                    className="min-w-44 rounded-2xl border border-border bg-card p-4"
                    style={{ flexGrow: segment.weight }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{segment.title}</span>
                      {segment.secondaryLabel ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground-muted">
                          {segment.secondaryLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground-secondary">{segment.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                      <span>{segment.kind}</span>
                      <span>{segment.status}</span>
                      {segment.filePaths.length > 0 ? <span>{segment.filePaths.length} files</span> : null}
                    </div>
                    <ActionLinks actions={buildEntryActions(lane.runId, segment.filePaths, { includeFailures: true })} />
                  </article>
                ))}
              </div>
            </article>
          ))}
          {flowModel.lanes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-foreground-muted">
              No structured execution flow is available for this session yet.
            </div>
          ) : null}
        </div>
      ),
    },
    {
      value: "files",
      label: "Files",
      badge: flowModel.files.length,
      body: (
        <div className="grid gap-3">
          {flowModel.files.map((file) => (
            <article key={file.path} className="rounded-2xl border border-border bg-background/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm text-foreground">{file.path}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                  {file.touches} touches
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                <span>{file.reads} reads</span>
                <span>{file.writes} writes</span>
                <span>{file.runIds.length} dispatches</span>
                {file.tools.length > 0 ? <span>{file.tools.length} tools</span> : null}
              </div>
              <ActionLinks actions={buildEntryActions(file.runIds[0] ?? "", [file.path], { includeFailures: true })} />
            </article>
          ))}
          {flowModel.files.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-foreground-muted">
              File attention will appear here once the session touches the workspace.
            </div>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Realtime execution</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Dispatch trace reconstructed on the gateway stack</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Trace lanes and file attention are projected from the same live event buffers so session review stays aligned with current dispatch activity.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
          Session {props.sessionId}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground-muted">
        <span className="rounded-full border border-border px-3 py-1">{flowModel.summary.totalRuns} dispatches</span>
        <span className="rounded-full border border-border px-3 py-1">{flowModel.summary.totalSegments} segments</span>
        <span className="rounded-full border border-border px-3 py-1">{flowModel.summary.totalTools} tools</span>
        <span className="rounded-full border border-border px-3 py-1">{flowModel.summary.fileCount} files</span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div>
          <Tabs value={viewMode} onChange={(value) => setViewMode(value as typeof viewMode)} items={tabItems} />
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <TerminalSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Artifact shortcuts</h3>
            </div>
            <div className="mt-4 space-y-3">
              {shortcuts.map((item) => (
                <div key={item.runId} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/dispatches/${item.runId}`} className="font-mono text-sm text-primary">
                      {item.runId}
                    </Link>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-foreground">{item.processId}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                    <span>{item.logTaskCount} log tasks</span>
                    <span>{item.resultTaskCount} result payloads</span>
                    {item.failedTaskCount > 0 ? <span>{item.failedTaskCount} failed tasks</span> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {item.breakpointEffectId ? (
                      <Link
                        to={`/dispatches/${item.runId}?effectId=${encodeURIComponent(item.breakpointEffectId)}`}
                        className="inline-flex items-center gap-1 text-primary"
                      >
                        <Hand className="h-3 w-3" />
                        Review breakpoint
                      </Link>
                    ) : null}
                    {item.errorEffectId ? (
                      <Link
                        to={`/dispatches/${item.runId}?effectId=${encodeURIComponent(item.errorEffectId)}`}
                        className="inline-flex items-center gap-1 text-primary"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Open failed task
                      </Link>
                    ) : null}
                    <Link to={`/dispatches/${item.runId}`} className="inline-flex items-center gap-1 text-primary">
                      <ArrowUpRight className="h-3 w-3" />
                      Open dispatch
                    </Link>
                  </div>
                </div>
              ))}
              {shortcuts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-foreground-muted">
                  Dispatch artifacts will appear here once the session emits execution data.
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
            <div className="inline-flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Kanban now shows the same reconstructed realtime execution story as agent-mux instead of a reduced overlay summary.
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
