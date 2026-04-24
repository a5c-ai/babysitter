"use client";

import type {
  KanbanBoardCard,
  KanbanProjectBoard,
  KanbanWorkflowState,
} from "@a5c-ai/agent-mux-core/kanban";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Layers,
  ShieldAlert,
  TimerReset,
  Workflow,
} from "lucide-react";

import { useBacklog } from "@/hooks/use-backlog";

const workflowOrder: readonly KanbanWorkflowState[] = ["todo", "in-progress", "review", "done"];

function issueTone(card: KanbanBoardCard): string {
  if (card.blocked) {
    return "border-error/30 bg-error-muted/70 text-error";
  }
  if (card.workflowState === "done") {
    return "border-success/25 bg-success-muted text-success";
  }
  if (card.workflowState === "review") {
    return "border-primary/25 bg-primary/10 text-primary";
  }
  if (card.workflowState === "in-progress") {
    return "border-warning/25 bg-warning-muted text-warning";
  }
  return "border-border bg-background text-foreground-secondary";
}

function columnTone(state: KanbanWorkflowState, overLimit: boolean): string {
  if (overLimit) {
    return "border-error/30 bg-error-muted/60";
  }

  switch (state) {
    case "todo":
      return "border-border bg-background/80";
    case "in-progress":
      return "border-warning/25 bg-warning-muted/50";
    case "review":
      return "border-primary/20 bg-primary/5";
    case "done":
      return "border-success/20 bg-success-muted/60";
  }
}

function stateLabel(state: KanbanWorkflowState): string {
  switch (state) {
    case "todo":
      return "Todo";
    case "in-progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
  }
}

function findCardsForCell(
  board: KanbanProjectBoard,
  swimlaneId: string,
  state: KanbanWorkflowState,
): KanbanBoardCard[] {
  return board.cards.filter(
    (card) => card.swimlaneId === swimlaneId && card.workflowState === state,
  );
}

export function BacklogOverview() {
  const { snapshot, board, summary, loading, error, moveIssue, movingIssueId } = useBacklog();

  if (loading && !snapshot) {
    return (
      <section
        className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-lg"
        data-testid="backlog-overview-loading"
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-36 rounded bg-background-secondary" />
          <div className="h-8 w-80 rounded bg-background-secondary" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-2xl bg-background-secondary" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !snapshot || !summary || !board) {
    return (
      <section
        className="mb-6 rounded-3xl border border-error/25 bg-error-muted p-6 text-sm text-error shadow-lg"
        data-testid="backlog-overview-error"
      >
        Failed to load issue backlog model.
      </section>
    );
  }

  const primaryProject = snapshot.projects[0];
  const primaryBoard = board.projects.find((candidate) => candidate.projectId === primaryProject?.id);
  const targetModelIssue = snapshot.issues.find((issue) => issue.key === "KANBAN-DEBT-003");

  if (!primaryProject || !primaryBoard) {
    return null;
  }

  return (
    <section
      className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-lg"
      data-testid="backlog-overview"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
            Kanban Board
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Real board mechanics now sit on shared workflow primitives
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            The dashboard no longer stops at a backlog summary. Columns, swimlanes, WIP limits, and
            move validation are computed from shared `agent-mux` board state, and card transitions
            persist through the backlog service instead of living in a local-only client model.
          </p>
        </div>

        <div className="min-w-[260px] rounded-2xl border border-border bg-background p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
            Primary Project
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">{primaryProject.name}</div>
          <div className="mt-3 text-sm text-foreground-muted">
            {primaryProject.metrics.totalIssues} issues tracked
          </div>
          {primaryProject.linkedRunSummary ? (
            <div className="mt-2 text-sm text-foreground-muted">
              {primaryProject.linkedRunSummary.activeRuns} live runs linked
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Layers className="h-4 w-4" />
            Scope
          </div>
          <div className="mt-3 text-2xl font-semibold text-foreground">{summary.issueCount}</div>
          <div className="text-sm text-foreground-muted">{summary.projectCount} project models</div>
        </div>
        <div className="rounded-2xl border border-warning/25 bg-warning-muted p-4">
          <div className="flex items-center gap-2 text-sm text-warning">
            <Workflow className="h-4 w-4" />
            Active WIP
          </div>
          <div className="mt-3 text-2xl font-semibold text-warning">{summary.inProgressCount}</div>
          <div className="text-sm text-warning/80">
            {summary.needsDecompositionCount} waiting on decomposition
          </div>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
          <div className="flex items-center gap-2 text-sm text-primary">
            <TimerReset className="h-4 w-4" />
            Review Queue
          </div>
          <div className="mt-3 text-2xl font-semibold text-primary">
            {primaryBoard.columns.find((column) => column.id === "review")?.issueCount ?? 0}
          </div>
          <div className="text-sm text-primary/80">policy-gated handoff column</div>
        </div>
        <div className="rounded-2xl border border-error/25 bg-error-muted p-4">
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            Blocked
          </div>
          <div className="mt-3 text-2xl font-semibold text-error">{summary.blockedCount}</div>
          <div className="text-sm text-error/80">{summary.completedCount} completed</div>
        </div>
      </div>

      {targetModelIssue ? (
        <div className="mt-5 rounded-2xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {targetModelIssue.key}
            </span>
            <span className="text-sm font-semibold text-foreground">{targetModelIssue.title}</span>
            <span className="text-sm text-foreground-muted">{targetModelIssue.status}</span>
          </div>
          {targetModelIssue.summary ? (
            <p className="mt-3 text-sm leading-6 text-foreground-muted">{targetModelIssue.summary}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {targetModelIssue.acceptanceCriteria.map((criterion) => (
              <span
                key={criterion.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground-secondary"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {criterion.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {primaryBoard.policyHooks.map((hook) => (
          <span
            key={hook.id}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            {hook.name}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-5" data-testid="kanban-board">
        {primaryBoard.swimlanes
          .filter((swimlane) => swimlane.issueIds.length > 0)
          .map((swimlane) => (
            <section
              key={swimlane.id}
              className="rounded-3xl border border-border bg-background/70 p-4"
              data-testid={`kanban-swimlane-${swimlane.id}`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                    Swimlane
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{swimlane.name}</h3>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
                  {swimlane.issueIds.length} cards
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-4">
                {workflowOrder.map((state) => {
                  const column = primaryBoard.columns.find((candidate) => candidate.id === state);
                  const cards = findCardsForCell(primaryBoard, swimlane.id, state);

                  if (!column) {
                    return null;
                  }

                  return (
                    <div
                      key={`${swimlane.id}-${state}`}
                      className={`rounded-2xl border p-4 ${columnTone(state, column.isOverLimit)}`}
                      data-testid={`kanban-column-${swimlane.id}-${state}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {stateLabel(state)}
                          </div>
                          <div className="mt-1 text-xs text-foreground-muted">
                            {cards.length} cards in this lane
                          </div>
                        </div>
                        <div className="text-right text-xs text-foreground-muted">
                          <div>{column.issueCount} total</div>
                          {typeof column.wipLimit === "number" ? (
                            <div className={column.isOverLimit ? "text-error" : undefined}>
                              WIP {column.issueCount}/{column.wipLimit}
                            </div>
                          ) : (
                            <div>No WIP cap</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {cards.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                            No cards
                          </div>
                        ) : null}

                        {cards.map((card) => (
                          <article
                            key={card.issueId}
                            className={`rounded-2xl border p-4 ${issueTone(card)}`}
                            data-testid={`kanban-card-${card.issueKey}`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                                {card.issueKey}
                              </span>
                              <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
                                {card.priority}
                              </span>
                              <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
                                {card.readiness}
                              </span>
                            </div>

                            <div className="mt-2 text-base font-semibold">{card.title}</div>
                            {card.summary ? (
                              <p className="mt-2 text-sm leading-6 opacity-90">{card.summary}</p>
                            ) : null}

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-80">
                              <span className="inline-flex items-center gap-1">
                                <GitBranch className="h-3.5 w-3.5" />
                                {card.dependencyCount} dependencies
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Workflow className="h-3.5 w-3.5" />
                                {card.childCount} child issues
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {card.acceptanceProgress.satisfied}/{card.acceptanceProgress.total} accepted
                              </span>
                            </div>

                            {card.policySignals.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {card.policySignals.map((signal, index) => (
                                  <div
                                    key={`${card.issueId}-${signal.hookId}-${index}`}
                                    className="rounded-xl border border-current/15 bg-card/70 px-3 py-2 text-xs"
                                  >
                                    {signal.message}
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {card.moveTargets.map((target) => (
                                <button
                                  key={`${card.issueId}-${target.state}`}
                                  disabled={!target.allowed || movingIssueId === card.issueId}
                                  onClick={() => void moveIssue(card.issueId, target.state)}
                                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-hover bg-transparent px-3 text-xs font-medium italic tracking-[0.04em] text-foreground transition-all duration-200 hover:bg-card hover:border-primary/30 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50 font-serif"
                                  data-testid={`move-${card.issueKey}-${target.state}`}
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                  {stateLabel(target.state)}
                                </button>
                              ))}
                            </div>

                            {card.moveTargets.some((target) => target.signals.length > 0) ? (
                              <div className="mt-3 space-y-2">
                                {card.moveTargets.flatMap((target) =>
                                  target.signals.map((signal, index) => (
                                    <div
                                      key={`${card.issueId}-${target.state}-${signal.hookId}-${index}`}
                                      className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground-muted"
                                    >
                                      {stateLabel(target.state)}: {signal.message}
                                    </div>
                                  )),
                                )}
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
      </div>
    </section>
  );
}
