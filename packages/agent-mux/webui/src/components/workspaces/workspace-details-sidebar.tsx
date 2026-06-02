"use client";

import { Link, useNavigate } from "react-router-dom-v6";
import { useEffect, useMemo, useState } from "react";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-comm";
import type { KanbanIntegrationProvider, KanbanReviewArtifact } from "@a5c-ai/agent-mux-comm/kanban";
import { AlertCircle, ArrowUpDown, ExternalLink, FileText, GitBranch, Loader2, Wrench } from "lucide-react";

import { Button, Select, cx } from "@a5c-ai/compendium";
import type { WorkspaceInventoryItem } from "@/lib/workspace-lifecycle";

type WorkspaceSidebarAction =
  | "rebase-start"
  | "rebase-auto-resolve"
  | "rebase-open-in-editor"
  | "rebase-mark-resolved"
  | "rebase-abort";

export interface WorkspaceSidebarFeedback {
  tone: "success" | "error";
  message: string;
}

type WorkspaceRunSummary = WorkspaceInventoryItem["runs"]["items"][number];

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }
  return new Date(value).toLocaleString();
}

function formatRuntimeTimestamp(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) {
    return "Unavailable";
  }
  return new Date(value).toLocaleString();
}

function statusTone(status: "success" | "warning" | "error" | "neutral"): string {
  if (status === "success") {
    return "border-success/20 bg-success/10 text-success";
  }
  if (status === "warning") {
    return "border-warning/20 bg-warning/10 text-warning";
  }
  if (status === "error") {
    return "border-error/20 bg-error/10 text-error";
  }
  return "border-border text-foreground-muted";
}

function lifecycleTone(status: string): string {
  if (status === "approved" || status === "ready" || status === "passing" || status === "published" || status === "merged") {
    return "border-success/20 bg-success/10 text-success";
  }
  if (status === "pending" || status === "in-review") {
    return "border-warning/20 bg-warning/10 text-warning";
  }
  if (status === "changes-requested" || status === "blocked" || status === "failing" || status === "failed") {
    return "border-error/20 bg-error/10 text-error";
  }
  return "border-border text-foreground-muted";
}

function providerLabel(provider: KanbanIntegrationProvider): string {
  return provider === "azure-repos" ? "Azure Repos" : "GitHub";
}

function latestCommand(runtime: WorkspaceRuntimeSurface | undefined) {
  if (!runtime) {
    return null;
  }
  return [...runtime.terminal.commands].sort((left, right) => right.startedAt - left.startedAt)[0] ?? null;
}

function sortWorkspaceRuns(runs: readonly WorkspaceRunSummary[]): WorkspaceRunSummary[] {
  return [...runs].sort((left, right) => {
    const rank = (status: string) => {
      if (status === "running" || status === "pending" || status === "waiting") {
        return 0;
      }
      if (status === "failed") {
        return 1;
      }
      if (status === "completed") {
        return 2;
      }
      return 3;
    };
    const rankDiff = rank(left.status) - rank(right.status);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return left.runId.localeCompare(right.runId);
  });
}

function runtimeTone(status: string | undefined): "success" | "warning" | "error" | "neutral" {
  if (status === "active" || status === "running" || status === "ready" || status === "completed") {
    return "success";
  }
  if (status === "starting" || status === "pending" || status === "queued") {
    return "warning";
  }
  if (status === "inactive" || status === "failed" || status === "error" || status === "blocked") {
    return "error";
  }
  return "neutral";
}

export function WorkspaceDetailsSidebar(props: {
  workspace: WorkspaceInventoryItem;
  runtime?: WorkspaceRuntimeSurface;
  reviewArtifact?: KanbanReviewArtifact | null;
  sessionId?: string;
  sessionStatus?: string;
  pendingAction: string | null;
  notesSaving: boolean;
  reviewPending: boolean;
  feedback?: WorkspaceSidebarFeedback | null;
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
}) {
  const navigate = useNavigate();
  const noteValue = props.workspace.notes?.value ?? "";
  const noteUpdatedAt = props.workspace.notes?.updatedAt ?? null;
  const [draftNote, setDraftNote] = useState(noteValue);
  const lastCommand = useMemo(() => latestCommand(props.runtime), [props.runtime]);
  const linkedPullRequest = props.reviewArtifact?.linkedPullRequest;
  const integration = props.reviewArtifact?.integration;
  const previewUrl = props.runtime?.preview.primaryUrl ?? props.runtime?.devServer.primaryUrl ?? null;
  const repoName = props.workspace.git.root?.split("/").filter(Boolean).at(-1) ?? "Unavailable";
  const gitMetadataMissing = !props.workspace.git.root || !props.workspace.git.branch;
  const changeCount = props.workspace.git.uncommittedCount;
  const editorHref = props.workspace.links?.editorHref ?? null;
  const selectedSession =
    props.workspace.sessions.items.find((session) => session.sessionId === props.sessionId)
    ?? (props.sessionId == null ? props.workspace.sessions.items[0] ?? null : null);
  const recentRuns = useMemo(
    () => sortWorkspaceRuns(props.workspace.runs.items ?? []).slice(0, 3),
    [props.workspace.runs.items],
  );
  const latestRun = recentRuns[0] ?? null;
  const syncSummary =
    props.workspace.git.ahead == null || props.workspace.git.behind == null
      ? "No upstream tracking"
      : `${props.workspace.git.ahead} ahead / ${props.workspace.git.behind} behind`;
  const [provider, setProvider] = useState<KanbanIntegrationProvider>(
    integration?.provider ?? linkedPullRequest?.provider ?? "github",
  );
  const [branchName, setBranchName] = useState(
    linkedPullRequest?.branchName ?? props.workspace.git.branch ?? props.workspace.name,
  );
  const [baseBranch, setBaseBranch] = useState(
    linkedPullRequest?.baseBranch ?? props.workspace.git.trackingBranch?.split("/").at(-1) ?? "main",
  );
  const [pullRequestTitle, setPullRequestTitle] = useState(
    linkedPullRequest?.title ?? `${props.workspace.name}: ${props.workspace.git.branch ?? "workspace"} review`,
  );
  const [reviewers, setReviewers] = useState("kanban-maintainers");
  const [linkedNumber, setLinkedNumber] = useState(
    linkedPullRequest?.number ? String(linkedPullRequest.number) : "",
  );
  const [linkedTitle, setLinkedTitle] = useState(linkedPullRequest?.title ?? "");
  const recentComments = useMemo(
    () => [...(props.reviewArtifact?.comments ?? [])].slice(-2).reverse(),
    [props.reviewArtifact?.comments],
  );
  const showTerminalSection = Boolean(props.runtime || lastCommand);
  const pullRequestSectionDefaultOpen = Boolean(props.reviewArtifact || linkedPullRequest || integration || recentComments.length > 0);

  useEffect(() => {
    setDraftNote(noteValue);
  }, [noteValue, props.workspace.path]);

  useEffect(() => {
    setProvider(integration?.provider ?? linkedPullRequest?.provider ?? "github");
    setBranchName(linkedPullRequest?.branchName ?? props.workspace.git.branch ?? props.workspace.name);
    setBaseBranch(linkedPullRequest?.baseBranch ?? props.workspace.git.trackingBranch?.split("/").at(-1) ?? "main");
    setPullRequestTitle(linkedPullRequest?.title ?? `${props.workspace.name}: ${props.workspace.git.branch ?? "workspace"} review`);
    setLinkedNumber(linkedPullRequest?.number ? String(linkedPullRequest.number) : "");
    setLinkedTitle(linkedPullRequest?.title ?? "");
  }, [
    integration?.provider,
    linkedPullRequest?.baseBranch,
    linkedPullRequest?.branchName,
    linkedPullRequest?.number,
    linkedPullRequest?.provider,
    linkedPullRequest?.title,
    props.workspace.git.branch,
    props.workspace.git.trackingBranch,
    props.workspace.name,
  ]);

  const actionKey = (action: WorkspaceSidebarAction) => `${action}:${props.workspace.path}`;
  const quickActionBusy = props.pendingAction != null || props.reviewPending;

  return (
    <aside className="rounded-[28px] border border-border bg-card p-4 shadow-lg" aria-label={`Workspace details for ${props.workspace.name}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">Workspace</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Context and handoff</h2>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground-muted">
          {props.workspace.status}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <SidebarSection title="Status" icon={AlertCircle}>
          <div className="space-y-3" data-testid="workspace-status-panel">
            {selectedSession ? (
              <div className="rounded-2xl border border-border bg-card/80 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={cx("rounded-full border px-2 py-0.5", statusTone(runtimeTone(props.sessionStatus ?? selectedSession.status)))}>
                    {props.sessionStatus ?? selectedSession.status}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-foreground-muted">
                    {selectedSession.agent}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {selectedSession.title ?? selectedSession.sessionId}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Session {selectedSession.sessionId}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/sessions/${selectedSession.sessionId}`)}
                  >
                    Open session
                  </Button>
                </div>
              </div>
            ) : (
              <SectionState
                tone="neutral"
                title="No active session selected"
                body="Select a session to align this sidebar with the chat and runtime panels."
              />
            )}

            {props.runtime ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <ValueRow label="Runtime updated" value={formatRuntimeTimestamp(props.runtime.updatedAt)} />
                <ValueRow label="Terminal" value={`${props.runtime.terminal.status} · ${props.runtime.terminal.commands.length} command${props.runtime.terminal.commands.length === 1 ? "" : "s"}`} />
                <ValueRow label="Dev server" value={props.runtime.devServer.status} />
                <ValueRow label="Preview" value={previewUrl ? "Available" : "Unavailable"} />
              </div>
            ) : (
              <SectionState
                tone="error"
                title="Runtime disconnected"
                body="Runtime, terminal, and preview status will appear here when the selected session publishes again."
              />
            )}

            {latestRun ? (
              <div className="rounded-2xl border border-border bg-card/80 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-border px-2 py-0.5 text-foreground-muted">
                    Recent dispatches
                  </span>
                  <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(latestRun.status))}>
                    {latestRun.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  {recentRuns.map((run) => (
                    <Link
                      key={`${props.workspace.path}:${run.runId}`}
                      to={`/dispatches/${encodeURIComponent(run.runId)}`}
                      data-testid={`workspace-status-run-${run.runId}`}
                      className="rounded-xl border border-border bg-background/70 px-3 py-2 transition-colors hover:border-primary/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-primary">{run.runId}</span>
                        <span className={cx("rounded-full border px-2 py-0.5 text-[11px]", lifecycleTone(run.status))}>
                          {run.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <SectionState
                tone="neutral"
                title="No workspace dispatches yet"
                body="Dispatch status will appear here once this workspace starts publishing executions."
              />
            )}
          </div>
        </SidebarSection>

        <SidebarSection title="Git" icon={GitBranch}>
          {gitMetadataMissing ? (
            <SectionState
              tone="error"
              title="Repository metadata unavailable"
              body="The workspace path exists, but git root or branch metadata could not be resolved."
            />
          ) : (
            <div className="grid gap-3">
              <ValueRow label="Repository" value={repoName} mono={false} />
              <ValueRow label="Branch" value={props.workspace.git.branch ?? "Unavailable"} mono />
              <ValueRow label="Tracking" value={props.workspace.git.trackingBranch ?? "Unavailable"} mono />
              <ValueRow label="Sync" value={syncSummary} />
              <ValueRow
                label="Uncommitted"
                value={
                  changeCount == null
                    ? "Unavailable"
                    : changeCount === 0
                      ? "0 changes"
                      : `${changeCount} change${changeCount === 1 ? "" : "s"}`
                }
              />
            </div>
          )}
        </SidebarSection>

        {showTerminalSection ? (
          <CollapsibleSidebarSection
            title="Terminal"
            summary={lastCommand ? "Most recent command and captured output" : "Runtime shell output is available"}
            defaultOpen={Boolean(lastCommand)}
          >
            {!props.runtime ? (
                <SectionState
                  tone="error"
                  title="Runtime disconnected"
                  body="No active runtime is currently publishing shell state for this workspace."
                />
            ) : !lastCommand ? (
              <div className="space-y-3">
                <SectionState
                  tone="neutral"
                  title="No terminal activity yet"
                  body="The selected session has not published a captured command yet."
                />
                <pre className="overflow-x-auto rounded-2xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground-muted">
                  {`cd ${props.workspace.path}\ngit status --short`}
                </pre>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cx(
                      "rounded-full border px-2 py-0.5 text-[11px] uppercase",
                      statusTone(lastCommand.status === "completed" ? "success" : lastCommand.status === "failed" ? "error" : "warning"),
                    )}
                  >
                    {lastCommand.status}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground-muted">
                    {lastCommand.source}
                  </span>
                  {lastCommand.toolName ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground-muted">
                      {lastCommand.toolName}
                    </span>
                  ) : null}
                </div>
                <pre className="overflow-x-auto rounded-2xl border border-border bg-slate-950 px-3 py-2 text-xs text-slate-100">
                  {lastCommand.command}
                </pre>
                <p className="text-xs text-foreground-muted">
                  Captured {formatRuntimeTimestamp(lastCommand.startedAt)}
                  {lastCommand.exitCode != null ? ` · exit ${lastCommand.exitCode}` : ""}
                </p>
                {lastCommand.logs.length > 0 ? (
                  <div className="rounded-2xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground-muted">
                    {lastCommand.logs.slice(-2).map((line: { timestamp: number; stream: string; text: string }, index: number) => (
                      <p key={`${line.timestamp}:${index}`} className="break-words">
                        <span className="font-mono">{line.stream}</span>: {line.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <SectionState tone="neutral" title="No command output yet" body="The runtime captured the command but has not attached log lines." />
                )}
              </div>
            )}
          </CollapsibleSidebarSection>
        ) : null}

        <SidebarSection title="Notes" icon={FileText}>
          <div className="space-y-3">
            {noteValue.trim().length === 0 ? (
              <SectionState
                tone="neutral"
                title="No workspace notes yet"
                body="Capture next steps, blockers, or handoff notes for this workspace."
              />
            ) : (
              <p className="text-xs text-foreground-muted">Last updated {formatTimestamp(noteUpdatedAt)}</p>
            )}
            <textarea
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              className="min-h-28 w-full rounded-2xl border border-border bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-primary/50"
              placeholder="Add workspace notes, follow-up context, or handoff details."
              aria-label={`Notes for ${props.workspace.name}`}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="ghost" disabled={props.notesSaving} onClick={() => props.onSaveNote(props.workspace, draftNote)}>
                {props.notesSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save note
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={props.notesSaving || draftNote.length === 0} onClick={() => props.onSaveNote(props.workspace, "")}>
                Clear
              </Button>
            </div>
          </div>
        </SidebarSection>

        <CollapsibleSidebarSection
          title="Pull request"
          summary={linkedPullRequest ? "Linked review state and status" : "Create or attach a pull request only when needed"}
          defaultOpen={pullRequestSectionDefaultOpen}
        >
          <div className="space-y-3">
            {linkedPullRequest ? (
              <div className="rounded-2xl border border-border bg-card/80 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-border px-2 py-0.5 text-foreground-muted">
                    {providerLabel(linkedPullRequest.provider)} PR {linkedPullRequest.number ? `#${linkedPullRequest.number}` : ""}
                  </span>
                  <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(linkedPullRequest.status))}>
                    {linkedPullRequest.status}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-foreground-muted">
                    {linkedPullRequest.linkState === "partially-linked" ? "partially linked" : linkedPullRequest.linkState}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-semibold">{linkedPullRequest.title}</h4>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {linkedPullRequest.reviewStatus ? (
                    <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(linkedPullRequest.reviewStatus))}>
                      Review {linkedPullRequest.reviewStatus}
                    </span>
                  ) : null}
                  {linkedPullRequest.mergeStatus ? (
                    <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(linkedPullRequest.mergeStatus))}>
                      Merge {linkedPullRequest.mergeStatus}
                    </span>
                  ) : null}
                  {linkedPullRequest.publishStatus ? (
                    <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(linkedPullRequest.publishStatus))}>
                      Publish {linkedPullRequest.publishStatus}
                    </span>
                  ) : null}
                </div>
                {linkedPullRequest.ciGates?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {linkedPullRequest.ciGates.map((gate) => (
                      <span key={`${props.workspace.path}-${gate.id}`} className={cx("rounded-full border px-2 py-0.5", lifecycleTone(gate.status))}>
                        {gate.name}: {gate.status}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-foreground-muted">
                  {integration?.guidance ?? linkedPullRequest.guidance ?? "No linked PR guidance available."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {linkedPullRequest.url ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(linkedPullRequest.url, "_blank", "noopener,noreferrer")}
                    >
                      Open PR
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <SectionState
                tone="neutral"
                title="No linked PR yet"
                body="Create a PR from this workspace or attach an existing one to keep review and merge status visible."
              />
            )}

            {integration ? (
              <div className="rounded-2xl border border-border bg-background/70 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-border px-2 py-0.5 text-foreground-muted">
                    {providerLabel(integration.provider)}
                  </span>
                  <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(integration.status))}>
                    {integration.status.replace(/-/g, " ")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-foreground-muted">{integration.guidance}</p>
                {integration.actions.reason ? (
                  <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
                    {integration.actions.reason}
                  </div>
                ) : null}
                {integration.missingScopes?.length ? (
                  <div className="mt-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
                    Missing scopes: {integration.missingScopes.join(", ")}
                  </div>
                ) : null}
              </div>
            ) : null}

            {!linkedPullRequest ? (
              <>
                <form
                  className="grid gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    props.onCreatePullRequest(props.workspace, {
                      provider,
                      title: pullRequestTitle,
                      reviewers,
                      branchName,
                      baseBranch,
                    });
                  }}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Provider
                      <div className="mt-2">
                        <Select
                        value={provider}
                        onChange={(value) => setProvider(value === "azure-repos" ? "azure-repos" : "github")}
                        options={[
                          { label: "GitHub", value: "github" },
                          { label: "Azure Repos", value: "azure-repos" },
                        ]}
                      />
                      </div>
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Branch
                      <input
                        value={branchName}
                        onChange={(event) => setBranchName(event.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Base branch
                      <input
                        value={baseBranch}
                        onChange={(event) => setBaseBranch(event.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      Reviewers
                      <input
                        value={reviewers}
                        onChange={(event) => setReviewers(event.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                    PR title
                    <input
                      value={pullRequestTitle}
                      onChange={(event) => setPullRequestTitle(event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                    />
                  </label>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={quickActionBusy || (integration ? !integration.actions.canCreatePullRequest : false)}
                  >
                    Create PR
                  </Button>
                </form>

                <form
                  className="grid gap-3 rounded-2xl border border-border bg-background/70 px-3 py-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    props.onLinkPullRequest(props.workspace, {
                      provider,
                      number: Number(linkedNumber),
                      title: linkedTitle,
                      branchName,
                      baseBranch,
                    });
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Link existing PR
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      PR number
                      <input
                        type="number"
                        min={1}
                        value={linkedNumber}
                        onChange={(event) => setLinkedNumber(event.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      PR title
                      <input
                        value={linkedTitle}
                        onChange={(event) => setLinkedTitle(event.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    disabled={quickActionBusy || (integration ? !integration.actions.canManagePullRequest : false)}
                  >
                    Link PR
                  </Button>
                </form>
              </>
            ) : null}

            <div className="rounded-2xl border border-border bg-background/70 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">Review feedback</p>
              {recentComments.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {recentComments.map((comment) => (
                    <div key={`${props.workspace.path}-${comment.id}`} className="rounded-xl border border-border bg-card/80 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                        <span>{comment.author.name}</span>
                        <span>{comment.anchor.filePath}</span>
                        <span>{comment.anchor.side}:{comment.anchor.line}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{comment.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-foreground-muted">
                  No review comments have been mapped back to this workspace yet.
                </p>
              )}
            </div>
          </div>
        </CollapsibleSidebarSection>

        <SidebarSection title="Actions" icon={Wrench}>
          <div className="space-y-3">
            {props.workspace.rebase ? (
              <div className="rounded-2xl border border-border bg-card/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">Rebase workflow</p>
                <h4 className="mt-1 text-sm font-semibold">
                  {props.workspace.rebase.status === "rebase-needed"
                    ? "Rebase required before this workspace can move forward"
                    : props.workspace.rebase.status === "rebase-conflicts"
                      ? "Resolve conflicts before returning to review or merge"
                      : `Ready for ${props.workspace.rebase.readyFor}`}
                </h4>
                <p className="mt-1 text-xs text-foreground-muted">
                  Attempt {props.workspace.rebase.attemptCount} · target `{props.workspace.rebase.targetBranch ?? "main"}`
                </p>
                {props.workspace.rebase.followUpInstructions.length > 0 ? (
                  <div className="mt-3 grid gap-2 text-xs text-foreground-muted">
                    {props.workspace.rebase.followUpInstructions.map((instruction: string) => (
                      <div key={instruction} className="rounded-xl border border-border bg-background/70 px-3 py-2">
                        {instruction}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() =>
                  props.workspace.actions.canRebaseOpenInEditor
                    ? props.onAction("rebase-open-in-editor", props.workspace)
                    : props.onOpenInEditor(props.workspace, editorHref)
                }
                disabled={quickActionBusy || !editorHref}
              >
                Open in editor
              </Button>
              {props.sessionId ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => navigate(`/sessions/${props.sessionId}`)}>
                  View session
                </Button>
              ) : null}
              {previewUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
                >
                  Open preview
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" size="sm" variant="ghost" disabled>
                  Open preview
                </Button>
              )}
            </div>

            {props.workspace.rebase ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {props.workspace.actions.canRebaseStart ? (
                  <ActionButton
                    disabled={props.pendingAction === actionKey("rebase-start")}
                    onClick={() => props.onAction("rebase-start", props.workspace)}
                  >
                    Retry rebase
                  </ActionButton>
                ) : null}
                {props.workspace.actions.canRebaseAutoResolve ? (
                  <ActionButton
                    disabled={props.pendingAction === actionKey("rebase-auto-resolve")}
                    onClick={() => props.onAction("rebase-auto-resolve", props.workspace)}
                  >
                    Auto-resolve
                  </ActionButton>
                ) : null}
                {props.workspace.actions.canRebaseMarkResolved ? (
                  <ActionButton
                    disabled={props.pendingAction === actionKey("rebase-mark-resolved")}
                    onClick={() => props.onAction("rebase-mark-resolved", props.workspace)}
                  >
                    Mark resolved
                  </ActionButton>
                ) : null}
                {props.workspace.actions.canRebaseAbort ? (
                  <ActionButton
                    disabled={props.pendingAction === actionKey("rebase-abort")}
                    onClick={() => props.onAction("rebase-abort", props.workspace)}
                  >
                    Abort rebase
                  </ActionButton>
                ) : null}
              </div>
            ) : null}

            {props.feedback ? (
              <SectionState tone={props.feedback.tone} title={props.feedback.tone === "error" ? "Action failed" : "Action updated"} body={props.feedback.message} />
            ) : (
              <p className="text-xs text-foreground-muted">
                Keep editor, preview, and rebase helpers close, without taking over the main workspace summary.
              </p>
            )}
          </div>
        </SidebarSection>
      </div>
    </aside>
  );
}

function SidebarSection(props: { title: string; icon: typeof GitBranch; children: unknown }) {
  const Icon = props.icon;
  return (
    <section className="rounded-2xl border border-border bg-background/60 p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
        <Icon className="h-4 w-4" />
        <span>{props.title}</span>
      </div>
      {props.children as any}
    </section>
  );
}

function CollapsibleSidebarSection(props: {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: unknown;
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);

  useEffect(() => {
    setOpen(props.defaultOpen ?? false);
  }, [props.defaultOpen, props.title]);

  return (
    <section className="rounded-2xl border border-border bg-background/60 p-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">{props.title}</div>
          <div className="mt-1 text-xs text-foreground-muted">{props.summary}</div>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground-muted">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? <div className="mt-3">{props.children as any}</div> : null}
    </section>
  );
}

function ValueRow(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">{props.label}</p>
      <p className={cx("mt-1 text-sm font-medium", props.mono ? "break-all font-mono text-xs" : "")}>{props.value}</p>
    </div>
  );
}

function SectionState(props: { tone: "success" | "error" | "neutral"; title: string; body: string }) {
  return (
    <div className={cx("rounded-2xl border px-3 py-2", statusTone(props.tone === "success" ? "success" : props.tone === "error" ? "error" : "neutral"))}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {props.tone === "error" ? <AlertCircle className="h-4 w-4" /> : props.tone === "success" ? <ArrowUpDown className="h-4 w-4" /> : null}
        <span>{props.title}</span>
      </div>
      <p className="mt-1 text-xs">{props.body}</p>
    </div>
  );
}

function ActionButton(props: { disabled?: boolean; onClick: () => void; children: unknown }) {
  return (
    <Button type="button" size="sm" variant="ghost" disabled={props.disabled} onClick={props.onClick} className="justify-start">
      {props.children as any}
    </Button>
  );
}
