import { describe, expect, it, vi } from "vitest";

import { render, screen, setupUser } from "@/test/test-utils";

import { ReviewPanel } from "../review-panel";

const artifact = {
  id: "review-issue-kanban-gap-004",
  targetType: "issue" as const,
  targetId: "KANBAN-GAP-004",
  targetLabel: "KANBAN-GAP-004",
  title: "Review diff workflow primitives",
  summary: "Shared queue and diff surface.",
  branch: "vk/kanban-gap-004",
  decision: "pending" as const,
  queueState: "queued" as const,
  updatedAt: "2026-04-24T12:00:00.000Z",
  diff: [
    {
      id: "file-1",
      path: "packages/agent-mux/core/src/kanban.ts",
      additions: 3,
      deletions: 0,
      hunks: [
        {
          id: "hunk-1",
          header: "@@ review primitives @@",
          lines: [
            { kind: "context" as const, content: " export type KanbanIssue = {" },
            {
              kind: "add" as const,
              content: "+  readonly review?: KanbanReviewSummary;",
              newLineNumber: 42,
            },
          ],
        },
      ],
    },
  ],
  comments: [
    {
      id: "comment-1",
      author: { kind: "agent" as const, name: "codex-reviewer" },
      body: "Map this back to the shared review summary.",
      createdAt: "2026-04-24T12:01:00.000Z",
      status: "open" as const,
      anchor: {
        fileId: "file-1",
        filePath: "packages/agent-mux/core/src/kanban.ts",
        hunkId: "hunk-1",
        side: "head" as const,
        line: 42,
      },
      feedbackSource: {
        kind: "agent-feedback" as const,
        label: "Mapped from codex review feedback",
      },
    },
  ],
};

describe("ReviewPanel", () => {
  it("renders queue state, mapped feedback, and dispatches approval actions", async () => {
    const onApprove = vi.fn();
    const onRequestChanges = vi.fn();
    const onAddComment = vi.fn();
    const user = setupUser();

    render(
      <ReviewPanel
        title="Issue diff and feedback loop"
        description="Shared review surface."
        empty="No reviews."
        loading={false}
        artifacts={[artifact]}
        queue={[
          {
            artifactId: artifact.id,
            targetType: artifact.targetType,
            targetId: artifact.targetId,
            targetLabel: artifact.targetLabel,
            title: artifact.title,
            decision: artifact.decision,
            queueState: artifact.queueState,
            commentCount: 1,
            openCommentCount: 1,
            updatedAt: artifact.updatedAt,
          },
        ]}
        summary={{
          total: 1,
          issueCount: 1,
          workspaceCount: 0,
          pendingCount: 1,
          changesRequestedCount: 0,
          approvedCount: 0,
          openCommentCount: 1,
        }}
        onApprove={onApprove}
        onRequestChanges={onRequestChanges}
        onAddComment={onAddComment}
      />,
    );

    expect(screen.getByText("Mapped from codex review feedback")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /request changes/i }));
    expect(onRequestChanges).toHaveBeenCalledWith(artifact.id);

    await user.click(screen.getAllByRole("button", { name: /comment/i })[1]!);
    await user.type(screen.getByLabelText(/inline review comment/i), "Queue this follow-up for the dashboard badge.");
    await user.click(screen.getByRole("button", { name: /save comment/i }));

    expect(onAddComment).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactId: artifact.id,
        body: "Queue this follow-up for the dashboard badge.",
        feedbackSource: expect.objectContaining({
          kind: "agent-feedback",
        }),
      }),
    );
  });
});
