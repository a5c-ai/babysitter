"use client";

import { Link } from "react-router-dom-v6";
import { AlertTriangle, ArrowUpRight, Clock3, Hand, LifeBuoy, RefreshCcw, Route, ShieldCheck } from "lucide-react";

import { useBacklog } from "@/hooks/use-backlog";
import { useReviews } from "@/hooks/use-reviews";
import { useSmartPolling } from "@/hooks/use-smart-polling";
import { buildBoardExecutionOverlays, buildRunHealthRecords, type BabysitterOverlayStage } from "@/lib/babysitter-overlays";
import type { Run } from "@/types";

interface RunsResponse {
  runs: Run[];
  totalCount: number;
}

const stageOrder: BabysitterOverlayStage[] = ["recovery", "review", "executing", "dispatch", "done"];

function stageTitle(stage: BabysitterOverlayStage): string {
  switch (stage) {
    case "recovery":
      return "Recovery";
    case "review":
      return "Approval";
    case "executing":
      return "Execution";
    case "dispatch":
      return "Dispatch";
    case "done":
      return "Done";
  }
}

function stageTone(stage: BabysitterOverlayStage): string {
  switch (stage) {
    case "recovery":
      return "border-error/25 bg-error-muted";
    case "review":
      return "border-warning/25 bg-warning-muted";
    case "executing":
      return "border-primary/25 bg-primary/10";
    case "dispatch":
      return "border-border bg-background/80";
    case "done":
      return "border-success/25 bg-success-muted";
  }
}

function severityTone(severity: "healthy" | "attention" | "critical"): string {
  switch (severity) {
    case "critical":
      return "border-error/25 bg-error-muted text-error";
    case "attention":
      return "border-warning/25 bg-warning-muted text-warning";
    default:
      return "border-success/25 bg-success-muted text-success";
  }
}

export function BabysitterOverlayPanel() {
  const { snapshot, board, loading: backlogLoading, error: backlogError } = useBacklog();
  const reviews = useReviews({}, 15000);
  const { data, loading: runsLoading, error: runsError } = useSmartPolling<RunsResponse>("/api/runs?limit=200&sort=activity", {
    interval: 5000,
    sseFilter: () => true,
  });

  const runs = data?.runs ?? [];
  const overlays = buildBoardExecutionOverlays({
    snapshot,
    board,
    runs,
    reviewArtifacts: reviews.artifacts,
  });
  const health = buildRunHealthRecords(runs).slice(0, 6);

  if ((backlogLoading && runsLoading) || (!snapshot && !board && !data && !backlogError && !runsError)) {
    return (
      <section className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 rounded bg-background-secondary" />
          <div className="h-8 w-96 rounded bg-background-secondary" />
          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <div className="h-80 rounded-2xl bg-background-secondary" />
            <div className="h-80 rounded-2xl bg-background-secondary" />
          </div>
        </div>
      </section>
    );
  }

  if (backlogError || runsError) {
    return (
      <section className="mb-6 rounded-3xl border border-error/25 bg-error-muted p-6 text-sm text-error shadow-lg">
        Failed to build the Babysitter execution overlay.
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-lg" data-testid="babysitter-overlay-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Babysitter-native overlay</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Board stages now carry run health, approval state, and recovery context</h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            The board remains the planning surface, but Babysitter run state now maps directly into execution lanes with retry signals, stuck-task detection, breakpoint review entry points, and direct navigation into session and run artifacts.
          </p>
        </div>
        <div className="min-w-[260px] rounded-2xl border border-border bg-background p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-foreground-muted">Overlay coverage</div>
          <div className="mt-3 grid gap-2 text-sm text-foreground-muted">
            <div>{overlays.length} board cards with linked Babysitter context</div>
            <div>{health.filter((item) => item.severity !== "healthy").length} runs need operator attention</div>
            <div>{reviews.summary?.openCommentCount ?? 0} review comments still open</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stageOrder.map((stage) => {
            const items = overlays.filter((overlay) => overlay.stage === stage).slice(0, 4);
            return (
              <article key={stage} className={`rounded-2xl border p-4 ${stageTone(stage)}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{stageTitle(stage)}</div>
                    <div className="text-xs text-foreground-muted">{items.length} issue overlays</div>
                  </div>
                  <Route className="h-4 w-4 text-foreground-muted" />
                </div>
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.issueId} className="rounded-2xl border border-current/10 bg-card/75 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-current/15 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em]">
                          {item.issueKey}
                        </span>
                        {item.pendingBreakpoints > 0 ? (
                          <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[11px] text-warning">
                            {item.pendingBreakpoints} approval
                          </span>
                        ) : null}
                        {item.retryCount > 0 ? (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground-muted">
                            {item.retryCount} retries
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-foreground">{item.issueTitle}</div>
                      <div className="mt-2 text-xs text-foreground-muted">
                        {item.stageLabel}
                        {item.stuck ? " · stuck-task signal" : ""}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {item.primaryRunId ? (
                          <Link to={`/dispatches/${item.primaryRunId}`} className="inline-flex items-center gap-1 text-primary">
                            Run
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ) : null}
                        {item.primarySessionId ? (
                          <Link to={`/sessions/${item.primarySessionId}`} className="inline-flex items-center gap-1 text-primary">
                            Session
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ) : null}
                        <Link to="/projects" className="inline-flex items-center gap-1 text-primary">
                          Board
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                      No issues in this overlay lane.
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="space-y-4">
          <article className="rounded-2xl border border-border bg-background/80 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Run health and recovery</h3>
            </div>
            <div className="mt-4 space-y-3">
              {health.map((item) => (
                <div key={item.runId} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/dispatches/${item.runId}`} className="font-mono text-sm text-primary">
                      {item.runId}
                    </Link>
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${severityTone(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-foreground">{item.processId}</div>
                  <div className="mt-1 text-xs text-foreground-muted">{item.summary}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Link to={item.recoveryHref} className="inline-flex items-center gap-1 text-primary">
                      {item.stuck || item.status === "failed" ? <LifeBuoy className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                      Recovery
                    </Link>
                    {item.reviewHref ? (
                      <Link to={item.reviewHref} className="inline-flex items-center gap-1 text-primary">
                        <Hand className="h-3 w-3" />
                        Breakpoint
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
              {health.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                  No linked runs yet.
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-background/80 p-4">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Operator shortcuts</h3>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-foreground-muted">
              <Link to="/inbox" className="rounded-2xl border border-border bg-card px-4 py-3 text-left hover:border-primary/30 hover:text-foreground">
                Inbox surfaces workspaces that need recovery, rebase, or review action.
              </Link>
              <Link to="/sessions" className="rounded-2xl border border-border bg-card px-4 py-3 text-left hover:border-primary/30 hover:text-foreground">
                Session detail merges transcript activity with run milestones and artifacts.
              </Link>
              <Link to="/workspaces" className="rounded-2xl border border-border bg-card px-4 py-3 text-left hover:border-primary/30 hover:text-foreground">
                Workspace recovery stays the control plane for failed or cleaned execution contexts.
              </Link>
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="inline-flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Retries are surfaced by linked-run history, so repeated attempts stay visible on the board instead of disappearing into raw run lists.
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
