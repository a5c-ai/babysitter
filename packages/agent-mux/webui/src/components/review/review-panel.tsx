"use client";

import { Link } from "react-router-dom-v6";
import { CheckCircle2, CornerDownRight, FileDiff, MessageSquareText, MessageSquareWarning, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@a5c-ai/compendium";
import { cx } from "@a5c-ai/compendium";

import type {
  KanbanDiffFile,
  KanbanDiffLine,
  KanbanDiffPresentation,
  KanbanLinkedPullRequestSummary,
  KanbanRepositoryIntegrationState,
  KanbanReviewArtifact,
  KanbanReviewComment,
  KanbanReviewCommentAnchor,
  KanbanReviewDecision,
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

function integrationTone(status: KanbanRepositoryIntegrationState["status"]): string {
  switch (status) {
    case "connected":
      return "border-success/20 bg-success/10 text-success";
    case "partial-setup":
    case "missing-scopes":
      return "border-warning/20 bg-warning/10 text-warning";
    case "expired-auth":
    case "failing":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-border text-foreground-muted";
  }
}

function providerLabel(provider: KanbanLinkedPullRequestSummary["provider"]): string {
  return provider === "azure-repos" ? "Azure Repos" : "GitHub";
}

function lifecycleTone(status: string): string {
  switch (status) {
    case "approved":
    case "ready":
    case "passing":
    case "published":
    case "merged":
      return "border-success/20 bg-success/10 text-success";
    case "pending":
    case "in-review":
      return "border-warning/20 bg-warning/10 text-warning";
    case "changes-requested":
    case "blocked":
    case "failing":
    case "failed":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-border text-foreground-muted";
  }
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

function lineId(anchor: KanbanReviewCommentAnchor): string {
  return `review-line-${anchor.fileId}-${anchor.hunkId}-${anchor.side}-${anchor.line}`;
}

function lineNumbers(line: KanbanDiffLine): string {
  const left = typeof line.oldLineNumber === "number" ? String(line.oldLineNumber) : "";
  const right = typeof line.newLineNumber === "number" ? String(line.newLineNumber) : "";
  return `${left.padStart(4, " ")} ${right.padStart(4, " ")}`;
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

function commentCountForFile(artifact: KanbanReviewArtifact, fileId: string): number {
  return artifact.comments.filter((comment) => comment.anchor.fileId === fileId && comment.status === "open").length;
}

function buildFeedbackContext(artifact: KanbanReviewArtifact): Array<{ id: string; label: string; href: string }> {
  const context = new Map<string, { id: string; label: string; href: string }>();

  if (artifact.targetType === "issue") {
    context.set(`issue:${artifact.targetId}`, {
      id: `issue:${artifact.targetId}`,
      label: "Issue",
      href: `/issues/${encodeURIComponent(artifact.targetId)}`,
    });
  }

  if (artifact.targetType === "workspace") {
    context.set(`workspace:${artifact.targetId}`, {
      id: `workspace:${artifact.targetId}`,
      label: "Workspace",
      href: `/workspaces?workspace=${encodeURIComponent(artifact.targetId)}`,
    });
  }

  for (const target of artifact.executionTargets ?? []) {
    context.set(`execution:${target.id}`, {
      id: `execution:${target.id}`,
      label: target.label,
      href: target.href,
    });
  }

  for (const comment of artifact.comments) {
    const source = comment.feedbackSource;
    if (!source || source.kind !== "agent-feedback") {
      continue;
    }
    if (source.runId) {
      context.set(`run:${source.runId}:${source.effectId ?? ""}`, {
        id: `run:${source.runId}:${source.effectId ?? ""}`,
        label: source.effectId ? "Run task" : "Run",
        href: source.effectId
          ? `/dispatches/${source.runId}?effectId=${encodeURIComponent(source.effectId)}`
          : `/dispatches/${source.runId}`,
      });
    }
    if (source.sessionId) {
      context.set(`session:${source.sessionId}`, {
        id: `session:${source.sessionId}`,
        label: "Session",
        href: `/sessions/${source.sessionId}`,
      });
    }
  }

  return Array.from(context.values());
}

function supportsSplitPresentation(file: KanbanDiffFile): boolean {
  return file.hunks.some((hunk) =>
    hunk.lines.some((line) => typeof line.oldLineNumber === "number" || typeof line.newLineNumber === "number"),
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

function ReviewSubmissionBar(props: {
  artifact: KanbanReviewArtifact;
  pending: boolean;
  onApprove: (artifactId: string) => void | Promise<void>;
  onRequestChanges: (artifactId: string) => void | Promise<void>;
  onSubmitReview?: (input: {
    artifactId: string;
    decision: KanbanReviewDecision;
    summary?: string;
    executionTargetId?: string;
  }) => void | Promise<void>;
}) {
  const [summary, setSummary] = useState(props.artifact.latestSubmission?.summary ?? "");
  const [executionTargetId, setExecutionTargetId] = useState(props.artifact.latestSubmission?.executionTargetId ?? "");

  useEffect(() => {
    setSummary(props.artifact.latestSubmission?.summary ?? "");
    setExecutionTargetId(props.artifact.latestSubmission?.executionTargetId ?? "");
  }, [props.artifact.id, props.artifact.latestSubmission?.executionTargetId, props.artifact.latestSubmission?.summary]);

  const canSubmitRichReview = typeof props.onSubmitReview === "function";

  async function submit(decision: KanbanReviewDecision) {
    if (canSubmitRichReview) {
      await props.onSubmitReview?.({
        artifactId: props.artifact.id,
        decision,
        summary: summary.trim() || undefined,
        executionTargetId: executionTargetId || undefined,
      });
      return;
    }

    if (decision === "approved") {
      await props.onApprove(props.artifact.id);
      return;
    }
    await props.onRequestChanges(props.artifact.id);
  }

  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <FileDiff className="h-4 w-4 text-primary" />
        Review submission
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">
        Submit a decision from the review surface and optionally route the follow-up back into a workspace, session, or run context.
      </p>

      <label className="mt-3 block text-xs font-medium text-foreground-muted">
        Review summary
        <textarea
          className="mt-2 min-h-[112px] w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          placeholder="Summarize what changed, what still needs work, or what follow-up the execution owner should take."
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </label>

      {(props.artifact.executionTargets?.length ?? 0) > 0 ? (
        <label className="mt-3 block text-xs font-medium text-foreground-muted">
          Route follow-up to
          <select
            className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            value={executionTargetId}
            onChange={(event) => setExecutionTargetId(event.target.value)}
          >
            <option value="">No direct handoff target</option>
            {props.artifact.executionTargets?.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={() => void submit("changes-requested")} disabled={props.pending}>
          <XCircle className="mr-2 h-4 w-4" />
          Request changes
        </Button>
        <Button type="button" variant="default" onClick={() => void submit("approved")} disabled={props.pending}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Approve review
        </Button>
      </div>

      {props.artifact.latestSubmission ? (
        <div className="mt-3 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground-muted">
          <span className={cx("rounded-full border px-2 py-0.5 text-xs", decisionTone(props.artifact.latestSubmission.decision))}>
            {decisionLabel(props.artifact.latestSubmission.decision)}
          </span>
          <span className="ml-2">Last submitted {new Date(props.artifact.latestSubmission.submittedAt).toLocaleString()}</span>
          {props.artifact.latestSubmission.executionTargetLabel ? (
            <p className="mt-2">Follow-up routed to {props.artifact.latestSubmission.executionTargetLabel}.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function UnifiedDiff(props: {
  artifact: KanbanReviewArtifact;
  file: KanbanDiffFile;
  draftAnchor: KanbanReviewCommentAnchor | null;
  draftBody: string;
  mapFeedback: boolean;
  focusedAnchorKey: string | null;
  onChangeDraftBody: (value: string) => void;
  onChangeMapFeedback: (value: boolean) => void;
  onFocusAnchor: (anchor: KanbanReviewCommentAnchor | null) => void;
  onAddComment: (input: {
    artifactId: string;
    body: string;
    anchor: KanbanReviewCommentAnchor;
    feedbackSource?: KanbanReviewFeedbackSource;
  }) => void | Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {props.file.hunks.map((hunk) => (
        <div key={hunk.id} className="rounded-2xl border border-border bg-card/80">
          <div className="border-b border-border px-4 py-2 text-xs font-medium text-foreground-muted">{hunk.header}</div>
          <div className="overflow-x-auto">
            <div className="min-w-[640px] space-y-1 p-3 font-mono text-xs">
              {hunk.lines.map((line, lineIndex) => {
                const anchor = buildAnchor(props.file, hunk.id, line);
                const comments = commentsForAnchor(props.artifact.comments, anchor);
                const isDraft = anchor && props.draftAnchor && anchorKey(anchor) === anchorKey(props.draftAnchor);
                const isFocused = anchor && props.focusedAnchorKey === anchorKey(anchor);

                return (
                  <div key={`${hunk.id}-${lineIndex}`}>
                    <div
                      id={anchor ? lineId(anchor) : undefined}
                      className={cx(
                        "grid grid-cols-[96px_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-3 py-2",
                        lineTone(line.kind),
                        isFocused ? "ring-1 ring-primary/40" : undefined,
                      )}
                    >
                      <div className="text-[11px] text-foreground-muted">{lineNumbers(line)}</div>
                      <pre className="whitespace-pre-wrap break-words text-foreground">{line.content}</pre>
                      {anchor ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] text-foreground-muted hover:border-primary/30 hover:text-foreground"
                          onClick={() => {
                            props.onFocusAnchor(anchor);
                            props.onChangeDraftBody("");
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
                          const body = props.draftBody.trim();
                          if (!body) {
                            return;
                          }

                          void props.onAddComment({
                            artifactId: props.artifact.id,
                            body,
                            anchor,
                            feedbackSource: props.mapFeedback
                              ? {
                                  kind: "agent-feedback",
                                  label: "Mapped from inline review follow-up",
                                  sessionId:
                                    props.artifact.targetType === "workspace"
                                      ? "workspace-review-follow-up"
                                      : "issue-review-follow-up",
                                }
                              : undefined,
                          });
                          props.onChangeDraftBody("");
                          props.onFocusAnchor(null);
                        }}
                      >
                        <label className="text-xs font-medium text-foreground-muted">
                          Inline review comment
                          <textarea
                            className="mt-2 min-h-[96px] w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                            value={props.draftBody}
                            onChange={(event) => props.onChangeDraftBody(event.target.value)}
                            placeholder="Explain the requested change or approval note."
                          />
                        </label>
                        <label className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                          <input
                            type="checkbox"
                            checked={props.mapFeedback}
                            onChange={(event) => props.onChangeMapFeedback(event.target.checked)}
                          />
                          Map this comment back to agent feedback metadata
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="submit" variant="default" size="sm">
                            <MessageSquareText className="mr-2 h-4 w-4" />
                            Save comment
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => props.onFocusAnchor(null)}>
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
  );
}

function SplitDiff(props: {
  artifact: KanbanReviewArtifact;
  file: KanbanDiffFile;
  draftAnchor: KanbanReviewCommentAnchor | null;
  draftBody: string;
  mapFeedback: boolean;
  focusedAnchorKey: string | null;
  onChangeDraftBody: (value: string) => void;
  onChangeMapFeedback: (value: boolean) => void;
  onFocusAnchor: (anchor: KanbanReviewCommentAnchor | null) => void;
  onAddComment: (input: {
    artifactId: string;
    body: string;
    anchor: KanbanReviewCommentAnchor;
    feedbackSource?: KanbanReviewFeedbackSource;
  }) => void | Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {props.file.hunks.map((hunk) => (
        <div key={hunk.id} className="rounded-2xl border border-border bg-card/80">
          <div className="border-b border-border px-4 py-2 text-xs font-medium text-foreground-muted">{hunk.header}</div>
          <div className="overflow-x-auto">
            <div className="min-w-[960px] p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                <div className="rounded-lg border border-border px-3 py-2">Base</div>
                <div className="rounded-lg border border-border px-3 py-2">Head</div>
                <div />
              </div>
              <div className="mt-2 space-y-1 font-mono text-xs">
                {hunk.lines.map((line, index) => {
                  const anchor = buildAnchor(props.file, hunk.id, line);
                  const isFocused = anchor && props.focusedAnchorKey === anchorKey(anchor);
                  const comments = commentsForAnchor(props.artifact.comments, anchor);
                  const isDraft = anchor && props.draftAnchor && anchorKey(anchor) === anchorKey(props.draftAnchor);
                  return (
                    <div key={`${hunk.id}-${index}`}>
                      <div
                        id={anchor ? lineId(anchor) : undefined}
                        className={cx(
                          "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-2 py-2",
                          lineTone(line.kind),
                          isFocused ? "ring-1 ring-primary/40" : undefined,
                        )}
                      >
                        <div className="rounded-lg border border-border/60 px-3 py-2">
                          <div className="text-[11px] text-foreground-muted">
                            {typeof line.oldLineNumber === "number" ? line.oldLineNumber : ""}
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-foreground">
                            {line.kind === "add" ? "" : line.content}
                          </pre>
                        </div>
                        <div className="rounded-lg border border-border/60 px-3 py-2">
                          <div className="text-[11px] text-foreground-muted">
                            {typeof line.newLineNumber === "number" ? line.newLineNumber : ""}
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-foreground">
                            {line.kind === "delete" ? "" : line.content}
                          </pre>
                        </div>
                        {anchor ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] text-foreground-muted hover:border-primary/30 hover:text-foreground"
                            onClick={() => props.onFocusAnchor(anchor)}
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
                                <span>{comment.anchor.side}:{comment.anchor.line}</span>
                              </div>
                              <p className="mt-2 text-foreground">{comment.body}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {isDraft && anchor ? (
                        <form
                          className="mx-4 mb-3 rounded-2xl border border-primary/20 bg-primary/5 p-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const body = props.draftBody.trim();
                            if (!body) {
                              return;
                            }

                            void props.onAddComment({
                              artifactId: props.artifact.id,
                              body,
                              anchor,
                              feedbackSource: props.mapFeedback
                                ? {
                                    kind: "agent-feedback",
                                    label: "Mapped from inline review follow-up",
                                    sessionId:
                                      props.artifact.targetType === "workspace"
                                        ? "workspace-review-follow-up"
                                        : "issue-review-follow-up",
                                  }
                                : undefined,
                            });
                            props.onChangeDraftBody("");
                            props.onFocusAnchor(null);
                          }}
                        >
                          <label className="text-xs font-medium text-foreground-muted">
                            Inline review comment
                            <textarea
                              className="mt-2 min-h-[96px] w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                              value={props.draftBody}
                              onChange={(event) => props.onChangeDraftBody(event.target.value)}
                              placeholder="Explain the requested change or approval note."
                            />
                          </label>
                          <label className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                            <input
                              type="checkbox"
                              checked={props.mapFeedback}
                              onChange={(event) => props.onChangeMapFeedback(event.target.checked)}
                            />
                            Map this comment back to agent feedback metadata
                          </label>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button type="submit" variant="default" size="sm">
                              <MessageSquareText className="mr-2 h-4 w-4" />
                              Save comment
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => props.onFocusAnchor(null)}>
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
        </div>
      ))}
    </div>
  );
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
  onSubmitReview?: (input: {
    artifactId: string;
    decision: KanbanReviewDecision;
    summary?: string;
    executionTargetId?: string;
  }) => void | Promise<void>;
  onAddComment: (input: {
    artifactId: string;
    body: string;
    anchor: KanbanReviewCommentAnchor;
    feedbackSource?: KanbanReviewFeedbackSource;
  }) => void | Promise<void>;
}) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(props.artifacts[0]?.id ?? null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [draftAnchor, setDraftAnchor] = useState<KanbanReviewCommentAnchor | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [mapFeedback, setMapFeedback] = useState(true);
  const [focusedAnchorKey, setFocusedAnchorKey] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<KanbanDiffPresentation>("unified");

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
  const feedbackContext = useMemo(
    () => (selectedArtifact ? buildFeedbackContext(selectedArtifact) : []),
    [selectedArtifact],
  );

  useEffect(() => {
    if (!selectedArtifact) {
      setSelectedFileId(null);
      return;
    }
    if (!selectedFileId || !selectedArtifact.diff.some((file) => file.id === selectedFileId)) {
      setSelectedFileId(selectedArtifact.diff[0]?.id ?? null);
    }
    setPresentation(selectedArtifact.preferredPresentation ?? "unified");
  }, [selectedArtifact, selectedFileId]);

  const selectedFile = useMemo(
    () => selectedArtifact?.diff.find((file) => file.id === selectedFileId) ?? selectedArtifact?.diff[0] ?? null,
    [selectedArtifact, selectedFileId],
  );
  const selectedFileSupportsSplit = selectedFile ? supportsSplitPresentation(selectedFile) : false;
  const selectedComments = useMemo(
    () => (selectedArtifact ? selectedArtifact.comments.filter((comment) => comment.status === "open") : []),
    [selectedArtifact],
  );
  const fileComments = useMemo(
    () =>
      selectedFile && selectedArtifact
        ? selectedArtifact.comments.filter((comment) => comment.anchor.fileId === selectedFile.id)
        : [],
    [selectedArtifact, selectedFile],
  );

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
                setFocusedAnchorKey(null);
              }}
              className={cx(
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
                <span className={cx("rounded-full border px-2 py-0.5 text-xs", decisionTone(item.decision))}>
                  {decisionLabel(item.decision)}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">{item.targetLabel}</div>
              <div className="mt-1 text-sm text-foreground-muted">{item.title}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                <span className={cx("rounded-full border px-2 py-0.5", queueTone(item.queueState))}>{item.queueState}</span>
                <span>{item.openCommentCount} open comments</span>
              </div>
            </button>
          ))}
        </aside>

        <div className="space-y-5">
          <article className="rounded-2xl border border-border bg-background/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
                    {selectedArtifact.targetLabel}
                  </span>
                  <span className={cx("rounded-full border px-2 py-0.5 text-xs", decisionTone(selectedArtifact.decision))}>
                    {decisionLabel(selectedArtifact.decision)}
                  </span>
                  <span className={cx("rounded-full border px-2 py-0.5 text-xs", queueTone(selectedArtifact.queueState))}>
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
                {feedbackContext.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {feedbackContext.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-foreground-muted hover:border-primary/30 hover:text-primary"
                      >
                        {item.label}
                        <CornerDownRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {(selectedArtifact.linkedPullRequest || selectedArtifact.integration) ? (
              <div className="mt-4 rounded-2xl border border-border bg-card/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedArtifact.linkedPullRequest ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                      {providerLabel(selectedArtifact.linkedPullRequest.provider)} PR{" "}
                      {selectedArtifact.linkedPullRequest.number ? `#${selectedArtifact.linkedPullRequest.number}` : ""}
                    </span>
                  ) : null}
                  {selectedArtifact.linkedPullRequest ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                      {selectedArtifact.linkedPullRequest.linkState === "partially-linked" ? "partially linked" : selectedArtifact.linkedPullRequest.linkState}
                    </span>
                  ) : null}
                  {selectedArtifact.integration ? (
                    <span className={cx("rounded-full border px-2 py-0.5 text-xs", integrationTone(selectedArtifact.integration.status))}>
                      {selectedArtifact.integration.status.replace(/-/g, " ")}
                    </span>
                  ) : null}
                </div>
                {selectedArtifact.linkedPullRequest?.title ? (
                  <p className="mt-2 text-sm text-foreground">{selectedArtifact.linkedPullRequest.title}</p>
                ) : null}
                {selectedArtifact.linkedPullRequest ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {selectedArtifact.linkedPullRequest.reviewStatus ? (
                      <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(selectedArtifact.linkedPullRequest.reviewStatus))}>
                        Review {selectedArtifact.linkedPullRequest.reviewStatus}
                      </span>
                    ) : null}
                    {selectedArtifact.linkedPullRequest.mergeStatus ? (
                      <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(selectedArtifact.linkedPullRequest.mergeStatus))}>
                        Merge {selectedArtifact.linkedPullRequest.mergeStatus}
                      </span>
                    ) : null}
                    {selectedArtifact.linkedPullRequest.publishStatus ? (
                      <span className={cx("rounded-full border px-2 py-0.5", lifecycleTone(selectedArtifact.linkedPullRequest.publishStatus))}>
                        Publish {selectedArtifact.linkedPullRequest.publishStatus}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {selectedArtifact.integration?.guidance ?? selectedArtifact.linkedPullRequest?.guidance ?? "No linked PR guidance available."}
                </p>
                {selectedArtifact.linkedPullRequest?.ciGates?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {selectedArtifact.linkedPullRequest.ciGates.map((gate) => (
                      <span key={`${selectedArtifact.id}-${gate.id}`} className={cx("rounded-full border px-2 py-0.5", lifecycleTone(gate.status))}>
                        {gate.name}: {gate.status}
                      </span>
                    ))}
                  </div>
                ) : null}
                {selectedArtifact.integration?.actions.reason ? (
                  <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
                    {selectedArtifact.integration.actions.reason}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>

          <ReviewSubmissionBar
            artifact={selectedArtifact}
            pending={props.pendingArtifactId === selectedArtifact.id}
            onApprove={props.onApprove}
            onRequestChanges={props.onRequestChanges}
            onSubmitReview={props.onSubmitReview}
          />

          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileDiff className="h-4 w-4 text-primary" />
                File navigator
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={presentation === "unified" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPresentation("unified")}
                >
                  Unified
                </Button>
                <Button
                  type="button"
                  variant={presentation === "split" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPresentation("split")}
                  disabled={!selectedFileSupportsSplit}
                >
                  Side by side
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {selectedArtifact.diff.map((file) => {
                  const openCommentCount = commentCountForFile(selectedArtifact, file.id);
                  return (
                    <button
                      key={file.id}
                      type="button"
                      data-testid={`review-file-${file.id}`}
                      onClick={() => {
                        setSelectedFileId(file.id);
                        setFocusedAnchorKey(null);
                        setDraftAnchor(null);
                      }}
                      className={cx(
                        "w-full rounded-2xl border p-3 text-left transition-colors",
                        selectedFile?.id === file.id
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card hover:border-primary/20 hover:bg-background",
                      )}
                    >
                      <div className="text-sm font-medium text-foreground">{file.path}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-foreground-muted">
                        <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-success">+{file.additions}</span>
                        <span className="rounded-full border border-error/20 bg-error/10 px-2 py-0.5 text-error">-{file.deletions}</span>
                        <span>{openCommentCount} open comments</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-4">
              {selectedFile ? (
                <article className="overflow-hidden rounded-2xl border border-border bg-background/80">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileDiff className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{selectedFile.path}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-success">+{selectedFile.additions}</span>
                      <span className="rounded-full border border-error/20 bg-error/10 px-2 py-0.5 text-error">-{selectedFile.deletions}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-foreground-muted">
                        {presentation === "split" ? "Side by side" : "Unified"}
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-border px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                      <MessageSquareWarning className="h-4 w-4 text-primary" />
                      <span>{fileComments.length} comments on this file</span>
                    </div>
                    {fileComments.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {fileComments.map((comment) => (
                          <button
                            key={comment.id}
                            type="button"
                            className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted hover:border-primary/30 hover:text-primary"
                            onClick={() => {
                              setFocusedAnchorKey(anchorKey(comment.anchor));
                              setSelectedFileId(comment.anchor.fileId);
                              setDraftAnchor(comment.anchor);
                            }}
                          >
                            {comment.anchor.side}:{comment.anchor.line} · {comment.author.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4">
                    {presentation === "split" && selectedFileSupportsSplit ? (
                      <SplitDiff
                        artifact={selectedArtifact}
                        file={selectedFile}
                        draftAnchor={draftAnchor}
                        draftBody={draftBody}
                        mapFeedback={mapFeedback}
                        focusedAnchorKey={focusedAnchorKey}
                        onChangeDraftBody={setDraftBody}
                        onChangeMapFeedback={setMapFeedback}
                        onFocusAnchor={(anchor) => {
                          setDraftAnchor(anchor);
                          setFocusedAnchorKey(anchor ? anchorKey(anchor) : null);
                        }}
                        onAddComment={props.onAddComment}
                      />
                    ) : (
                      <UnifiedDiff
                        artifact={selectedArtifact}
                        file={selectedFile}
                        draftAnchor={draftAnchor}
                        draftBody={draftBody}
                        mapFeedback={mapFeedback}
                        focusedAnchorKey={focusedAnchorKey}
                        onChangeDraftBody={setDraftBody}
                        onChangeMapFeedback={setMapFeedback}
                        onFocusAnchor={(anchor) => {
                          setDraftAnchor(anchor);
                          setFocusedAnchorKey(anchor ? anchorKey(anchor) : null);
                        }}
                        onAddComment={props.onAddComment}
                      />
                    )}
                  </div>
                </article>
              ) : null}

              {(selectedArtifact.executionTargets?.length ?? 0) > 0 ? (
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileDiff className="h-4 w-4 text-primary" />
                    Feedback loop handoff
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {selectedArtifact.executionTargets?.map((target) => (
                      <Link
                        key={target.id}
                        to={target.href}
                        className="rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-background"
                      >
                        <div className="text-sm font-medium text-foreground">{target.actionLabel ?? target.label}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-foreground-muted">{target.kind}</div>
                        {target.description ? (
                          <p className="mt-2 text-sm leading-6 text-foreground-muted">{target.description}</p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {selectedComments.length === 0 ? (
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
                      <span>{comment.anchor.side}:{comment.anchor.line}</span>
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
