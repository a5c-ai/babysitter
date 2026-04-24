"use client";

import { CheckCircle2, CornerDownRight, FileDiff, MessageSquareText, MessageSquareWarning, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

import type {
  KanbanDiffFile,
  KanbanDiffLine,
  KanbanReviewArtifact,
  KanbanReviewComment,
  KanbanReviewCommentAnchor,
  KanbanReviewFeedbackSource,
  KanbanReviewSnapshot,
} from "@a5c-ai/agent-mux-core/kanban";

function decisionLabel(decision: KanbanReviewArtifact["decision"]): string {
  switch (decision) {
    case "approved":
      return "Approved";
    case "changes-requested":
      return "Changes Requested";
    default:
      return "Pending Review";
  }
}

function decisionTone(decision: KanbanReviewArtifact["decision"]): string {
  switch (decision) {
    case "approved":
      return "border-success/20 bg-success/10 text-success";
    case "changes-requested":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-primary/20 bg-primary/10 text-primary";
  }
}

function queueTone(queueState: KanbanReviewArtifact["queueState"]): string {
  switch (queueState) {
    case "completed":
      return "border-success/20 bg-success/10 text-success";
    case "in-review":
      return "border-warning/20 bg-warning/10 text-warning";
    default:
      return "border-border text-foreground-muted";
  }
}

function lineNumbers(line: KanbanDiffLine): string {
  const left = typeof line.oldLineNumber === "number" ? String(line.oldLineNumber) : "";
  const right = typeof line.newLineNumber === "number" ? String(line.newLineNumber) : "";
  return `${left.padStart(4, " ")} ${right.padStart(4, " ")}`;
}

function lineTone(kind: KanbanDiffLine["kind"]): string {
  if (kind === "add") return "bg-success/10";
  if (kind === "delete") return "bg-error/10";
  return "bg-transparent";
}

function buildAnchor(file: KanbanDiffFile, hunkId: string, line: KanbanDiffLine): KanbanReviewCommentAnchor | null {
  if (typeof line.newLineNumber === "number") {
    return {
      fileId: file.id,
      filePath: file.path,
      hunkId,
      side: "head",
      line: line.newLineNumber,
    };
  }

  if (typeof line.oldLineNumber === "number") {
    return {
      fileId: file.id,
      filePath: file.path,
      hunkId,
      side: "base",
      line: line.oldLineNumber,
    };
  }

  return null;
}

function anchorKey(anchor: KanbanReviewCommentAnchor): string {
  return `${anchor.fileId}:${anchor.hunkId}:${anchor.side}:${anchor.line}`;
}

function commentsForAnchor(
  comments: readonly KanbanReviewComment[],
  anchor: KanbanReviewCommentAnchor | null,
): KanbanReviewComment[] {
  if (!anchor) {
    return [];
  }

  const key = anchorKey(anchor);
  return comments.filter((comment) => anchorKey(comment.anchor) === key);
}

export function ReviewPanel(props: {
  title: string;
  description: string;
  empty: string;
  loading: boolean;
  error?: string | null;
  artifacts: readonly KanbanReviewArtifact[];
  queue: KanbanReviewSnapshot["queue"];
  summary?: KanbanReviewSnapshot["summary"];
  pendingArtifactId?: string | null;
  onApprove: (artifactId: string) => void | Promise<void>;
  onRequestChanges: (artifactId: string) => void | Promise<void>;
  onAddComment: (input: {
    artifactId: string;
    body: string;
    anchor: KanbanReviewCommentAnchor;
    feedbackSource?: KanbanReviewFeedbackSource;
  }) => void | Promise<void>;
}) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(props.artifacts[0]?.id ?? null);
  const [draftAnchor, setDraftAnchor] = useState<KanbanReviewCommentAnchor | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [mapFeedback, setMapFeedback] = useState(true);

  useEffect(() => {
    if (props.artifacts.length === 0) {
      setSelectedArtifactId(null);
      return;
    }

    if (!selectedArtifactId || !props.artifacts.some((artifact) => artifact.id === selectedArtifactId)) {
      setSelectedArtifactId(props.artifacts[0]?.id ?? null);
    }
  }, [props.artifacts, selectedArtifactId]);

  const selectedArtifact = useMemo(
    () => props.artifacts.find((artifact) => artifact.id === selectedArtifactId) ?? null,
    [props.artifacts, selectedArtifactId],
  );

  useEffect(() => {
    if (!selectedArtifact || !draftAnchor) {
      return;
    }

    const stillExists = selectedArtifact.comments.some((comment) => anchorKey(comment.anchor) === anchorKey(draftAnchor));
    if (stillExists) {
      setDraftBody("");
    }
  }, [draftAnchor, selectedArtifact]);

  if (props.loading && props.artifacts.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg" data-testid="review-panel-loading">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-background-secondary" />
          <div className="h-8 w-72 rounded bg-background-secondary" />
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="h-64 rounded-2xl bg-background-secondary" />
            <div className="h-64 rounded-2xl bg-background-secondary" />
          </div>
        </div>
      </section>
    );
  }

  if (props.error) {
    return (
      <section className="rounded-3xl border border-error/30 bg-error/10 p-6 text-sm text-error shadow-lg">
        {props.error}
      </section>
    );
  }

  if (props.artifacts.length === 0 || !selectedArtifact) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Review Queue</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{props.title}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">{props.empty}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-lg" data-testid="review-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Review Queue</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{props.title}</h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">{props.description}</p>
        </div>

        {props.summary ? (
          <div className="grid min-w-[280px] gap-2 sm:grid-cols-2">
            <SummaryChip label="Queued" value={String(props.summary.pendingCount + props.summary.changesRequestedCount)} />
            <SummaryChip label="Approved" value={String(props.summary.approvedCount)} />
            <SummaryChip label="Open comments" value={String(props.summary.openCommentCount)} />
            <SummaryChip label="Artifacts" value={String(props.summary.total)} />
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {props.queue.map((item) => (
            <button
              key={item.artifactId}
              type="button"
              onClick={() => {
                setSelectedArtifactId(item.artifactId);
                setDraftAnchor(null);
                setDraftBody("");
              }}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-colors",
                selectedArtifactId === item.artifactId
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-background/70 hover:border-primary/20 hover:bg-background",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                  {item.targetType}
                </span>
                <span className={cn("rounded-full border px-2 py-0.5 text-xs", decisionTone(item.decision))}>
                  {decisionLabel(item.decision)}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">{item.targetLabel}</div>
              <div className="mt-1 text-sm text-foreground-muted">{item.title}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                <span className={cn("rounded-full border px-2 py-0.5", queueTone(item.queueState))}>{item.queueState}</span>
                <span>{item.openCommentCount} open comments</span>
              </div>
            </button>
          ))}
        </aside>

        <div className="space-y-5">
          <article className="rounded-2xl border border-border bg-background/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                    {selectedArtifact.targetLabel}
                  </span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-xs", decisionTone(selectedArtifact.decision))}>
                    {decisionLabel(selectedArtifact.decision)}
                  </span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-xs", queueTone(selectedArtifact.queueState))}>
                    {selectedArtifact.queueState}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{selectedArtifact.title}</h3>
                {selectedArtifact.summary ? (
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{selectedArtifact.summary}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-foreground-muted">
                  {selectedArtifact.branch ? <span>Branch: {selectedArtifact.branch}</span> : null}
                  <span>{selectedArtifact.diff.length} files changed</span>
                  <span>{selectedArtifact.comments.length} comments</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void props.onRequestChanges(selectedArtifact.id)}
                  disabled={props.pendingArtifactId === selectedArtifact.id}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Request changes
                </Button>
                <Button
                  variant="default"
                  onClick={() => void props.onApprove(selectedArtifact.id)}
                  disabled={props.pendingArtifactId === selectedArtifact.id}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          </article>

          <div className="space-y-4">
            {selectedArtifact.diff.map((file) => (
              <article key={file.id} className="overflow-hidden rounded-2xl border border-border bg-background/80">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileDiff className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{file.path}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-success">
                      +{file.additions}
                    </span>
                    <span className="rounded-full border border-error/20 bg-error/10 px-2 py-0.5 text-error">
                      -{file.deletions}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  {file.hunks.map((hunk) => (
                    <div key={hunk.id} className="rounded-2xl border border-border bg-card/80">
                      <div className="border-b border-border px-4 py-2 text-xs font-medium text-foreground-muted">
                        {hunk.header}
                      </div>
                      <div className="overflow-x-auto">
                        <div className="min-w-[640px] space-y-1 p-3 font-mono text-xs">
                          {hunk.lines.map((line, lineIndex) => {
                            const anchor = buildAnchor(file, hunk.id, line);
                            const comments = commentsForAnchor(selectedArtifact.comments, anchor);
                            const isDraft = anchor && draftAnchor && anchorKey(anchor) === anchorKey(draftAnchor);

                            return (
                              <div key={`${hunk.id}-${lineIndex}`}>
                                <div
                                  className={cn(
                                    "grid grid-cols-[96px_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-3 py-2",
                                    lineTone(line.kind),
                                  )}
                                >
                                  <div className="text-[11px] text-foreground-muted">{lineNumbers(line)}</div>
                                  <pre className="whitespace-pre-wrap break-words text-foreground">{line.content}</pre>
                                  {anchor ? (
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] text-foreground-muted hover:border-primary/30 hover:text-foreground"
                                      onClick={() => {
                                        setDraftAnchor(anchor);
                                        setDraftBody("");
                                      }}
                                    >
                                      <CornerDownRight className="h-3 w-3" />
                                      Comment
                                    </button>
                                  ) : <span />}
                                </div>

                                {comments.length > 0 ? (
                                  <div className="space-y-2 px-4 pb-3">
                                    {comments.map((comment) => (
                                      <div key={comment.id} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                                          <span className="font-medium text-foreground">{comment.author.name}</span>
                                          <span>{comment.author.kind}</span>
                                          {comment.feedbackSource ? (
                                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary">
                                              {comment.feedbackSource.label}
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-2 text-sm text-foreground">{comment.body}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}

                                {isDraft && anchor ? (
                                  <form
                                    className="mx-4 mb-3 rounded-2xl border border-primary/20 bg-primary/5 p-3"
                                    onSubmit={(event) => {
                                      event.preventDefault();
                                      const body = draftBody.trim();
                                      if (!body) {
                                        return;
                                      }

                                      void props.onAddComment({
                                        artifactId: selectedArtifact.id,
                                        body,
                                        anchor,
                                        feedbackSource: mapFeedback
                                          ? {
                                              kind: "agent-feedback",
                                              label: "Mapped from inline review follow-up",
                                              sessionId: selectedArtifact.targetType === "workspace" ? "workspace-review-follow-up" : "issue-review-follow-up",
                                            }
                                          : undefined,
                                      });
                                      setDraftBody("");
                                      setDraftAnchor(null);
                                    }}
                                  >
                                    <label className="text-xs font-medium text-foreground-muted">
                                      Inline review comment
                                      <textarea
                                        className="mt-2 min-h-[96px] w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                                        value={draftBody}
                                        onChange={(event) => setDraftBody(event.target.value)}
                                        placeholder="Explain the requested change or approval note."
                                      />
                                    </label>
                                    <label className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                                      <input
                                        type="checkbox"
                                        checked={mapFeedback}
                                        onChange={(event) => setMapFeedback(event.target.checked)}
                                      />
                                      Map this comment back to agent feedback metadata
                                    </label>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <Button type="submit" variant="default" size="sm">
                                        <MessageSquareText className="mr-2 h-4 w-4" />
                                        Save comment
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setDraftAnchor(null);
                                          setDraftBody("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </form>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {selectedArtifact.comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-foreground-muted">
              No review comments yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageSquareWarning className="h-4 w-4 text-primary" />
                Review activity
              </div>
              <div className="mt-3 space-y-2 text-sm text-foreground-muted">
                {selectedArtifact.comments.map((comment) => (
                  <div key={`${selectedArtifact.id}-${comment.id}`} className="rounded-xl border border-border bg-card px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{comment.author.name}</span>
                      <span>{comment.anchor.filePath}</span>
                      <span>
                        {comment.anchor.side}:{comment.anchor.line}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground">{comment.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SummaryChip(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">{props.label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{props.value}</p>
    </div>
  );
}
