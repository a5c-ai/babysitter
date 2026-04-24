import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  summarizeKanbanReviewArtifact,
  type KanbanReviewArtifact,
  type KanbanReviewComment,
  type KanbanReviewCommentAnchor,
  type KanbanReviewFeedbackSource,
  type KanbanReviewSnapshot,
} from "@a5c-ai/agent-mux-core/kanban";

const REVIEW_FILE_PATH =
  process.env.KANBAN_REVIEW_FILE ?? path.join(os.homedir(), ".a5c", "kanban-review-artifacts.json");

interface ReviewStoreFile {
  artifacts?: readonly KanbanReviewArtifact[];
}

export interface ReviewServiceDeps {
  readFile: typeof fs.readFile;
  writeFile: typeof fs.writeFile;
  mkdir: typeof fs.mkdir;
  reviewFilePath: string;
  now: () => string;
  cwd: () => string;
}

export type ReviewActionInput =
  | {
      action: "approve";
      artifactId: string;
    }
  | {
      action: "request-changes";
      artifactId: string;
    }
  | {
      action: "add-comment";
      artifactId: string;
      body: string;
      anchor: KanbanReviewCommentAnchor;
      authorName?: string;
      feedbackSource?: KanbanReviewFeedbackSource;
    };

const defaultDeps: ReviewServiceDeps = {
  readFile: fs.readFile,
  writeFile: fs.writeFile,
  mkdir: fs.mkdir,
  reviewFilePath: REVIEW_FILE_PATH,
  now: () => new Date().toISOString(),
  cwd: () => process.cwd(),
};

function buildDefaultArtifacts(workspacePath: string): KanbanReviewArtifact[] {
  return [
    {
      id: "review-issue-kanban-gap-004",
      targetType: "issue",
      targetId: "KANBAN-GAP-004",
      targetLabel: "KANBAN-GAP-004",
      title: "Review diff workflow primitives",
      summary:
        "Shared review artifacts now cover issue diffs, workspace diffs, inline comments, and approval state.",
      branch: "vk/kanban-gap-004",
      decision: "pending",
      queueState: "queued",
      updatedAt: "2026-04-24T12:00:00.000Z",
      diff: [
        {
          id: "issue-diff-core",
          path: "packages/agent-mux/core/src/kanban.ts",
          additions: 18,
          deletions: 0,
          hunks: [
            {
              id: "issue-diff-core-h1",
              header: "@@ review primitives @@",
              lines: [
                { kind: "context", content: " export type KanbanDecompositionKind =" },
                { kind: "add", content: "+export type KanbanReviewDecision = 'pending' | 'changes-requested' | 'approved';", newLineNumber: 24 },
                { kind: "add", content: "+export interface KanbanReviewArtifact {", newLineNumber: 25 },
                { kind: "add", content: "+  readonly diff: readonly KanbanDiffFile[];", newLineNumber: 26 },
                { kind: "add", content: "+  readonly comments: readonly KanbanReviewComment[];", newLineNumber: 27 },
                { kind: "add", content: "+}", newLineNumber: 28 },
              ],
            },
          ],
        },
        {
          id: "issue-diff-api",
          path: "packages/kanban/src/app/api/reviews/route.ts",
          additions: 22,
          deletions: 0,
          hunks: [
            {
              id: "issue-diff-api-h1",
              header: "@@ api route @@",
              lines: [
                { kind: "add", content: "+export async function GET() {", newLineNumber: 1 },
                { kind: "add", content: "+  return NextResponse.json(await service.listReviews());", newLineNumber: 2 },
                { kind: "add", content: "+}", newLineNumber: 3 },
                { kind: "add", content: "+export async function POST(request: Request) {", newLineNumber: 4 },
                { kind: "add", content: "+  return NextResponse.json(await service.applyAction(await request.json()));", newLineNumber: 5 },
                { kind: "add", content: "+}", newLineNumber: 6 },
              ],
            },
          ],
        },
      ],
      comments: [
        {
          id: "review-issue-comment-1",
          author: { kind: "agent", name: "codex-reviewer" },
          body: "Keep the review model shared so issue and workspace UIs do not drift again.",
          createdAt: "2026-04-24T12:02:00.000Z",
          status: "open",
          anchor: {
            fileId: "issue-diff-core",
            filePath: "packages/agent-mux/core/src/kanban.ts",
            hunkId: "issue-diff-core-h1",
            side: "head",
            line: 25,
          },
          feedbackSource: {
            kind: "agent-feedback",
            label: "Mapped from codex review feedback",
            sessionId: "session-review-issue",
            runId: "run-review-issue",
            effectId: "eff-review-issue",
            messageId: "msg-review-issue-1",
          },
        },
      ],
    },
    {
      id: "review-workspace-kanban-gap-004",
      targetType: "workspace",
      targetId: workspacePath,
      targetLabel: path.basename(workspacePath),
      title: "Workspace review handoff",
      summary:
        "Workspace-level review keeps the worktree diff, review queue state, and approval handoff visible in one place.",
      branch: path.basename(workspacePath),
      decision: "changes-requested",
      queueState: "in-review",
      updatedAt: "2026-04-24T12:05:00.000Z",
      diff: [
        {
          id: "workspace-diff-page",
          path: "packages/kanban/src/components/workspaces/workspaces-page.tsx",
          additions: 16,
          deletions: 2,
          hunks: [
            {
              id: "workspace-diff-page-h1",
              header: "@@ workspace review summary @@",
              lines: [
                { kind: "context", content: " function WorkspaceColumn(props: {" },
                { kind: "delete", content: "-  title: string;", oldLineNumber: 210 },
                { kind: "add", content: "+  title: string;", newLineNumber: 210 },
                { kind: "add", content: "+  reviewState?: string;", newLineNumber: 211 },
                { kind: "add", content: "+  reviewOpenComments?: number;", newLineNumber: 212 },
                { kind: "add", content: "+  reviewUpdatedAt?: string;", newLineNumber: 213 },
              ],
            },
          ],
        },
      ],
      comments: [
        {
          id: "review-workspace-comment-1",
          author: { kind: "agent", name: "workspace-reviewer" },
          body: "The workspace cards should surface approval state before someone clicks into the full diff.",
          createdAt: "2026-04-24T12:06:00.000Z",
          status: "open",
          anchor: {
            fileId: "workspace-diff-page",
            filePath: "packages/kanban/src/components/workspaces/workspaces-page.tsx",
            hunkId: "workspace-diff-page-h1",
            side: "head",
            line: 211,
          },
          feedbackSource: {
            kind: "agent-feedback",
            label: "Mapped from workspace reviewer feedback",
            sessionId: "session-review-workspace",
            runId: "run-review-workspace",
            effectId: "eff-review-workspace",
            messageId: "msg-review-workspace-1",
          },
        },
      ],
    },
  ];
}

function sortArtifacts(artifacts: readonly KanbanReviewArtifact[]): KanbanReviewArtifact[] {
  const decisionRank = (decision: KanbanReviewArtifact["decision"]): number => {
    if (decision === "changes-requested") return 0;
    if (decision === "pending") return 1;
    return 2;
  };

  return [...artifacts].sort((left, right) => {
    const queueStateOrder = (value: KanbanReviewArtifact["queueState"]): number => {
      if (value === "queued") return 0;
      if (value === "in-review") return 1;
      return 2;
    };

    const stateDiff = queueStateOrder(left.queueState) - queueStateOrder(right.queueState);
    if (stateDiff !== 0) {
      return stateDiff;
    }

    const decisionDiff = decisionRank(left.decision) - decisionRank(right.decision);
    if (decisionDiff !== 0) {
      return decisionDiff;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

async function readStore(deps: ReviewServiceDeps): Promise<ReviewStoreFile | null> {
  try {
    const raw = await deps.readFile(deps.reviewFilePath, "utf8");
    return JSON.parse(raw) as ReviewStoreFile;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeStore(deps: ReviewServiceDeps, artifacts: readonly KanbanReviewArtifact[]): Promise<void> {
  await deps.mkdir(path.dirname(deps.reviewFilePath), { recursive: true });
  await deps.writeFile(deps.reviewFilePath, `${JSON.stringify({ artifacts }, null, 2)}\n`, "utf8");
}

function buildSnapshot(
  artifacts: readonly KanbanReviewArtifact[],
  generatedAt: string,
  filter: {
    targetType?: KanbanReviewArtifact["targetType"];
    targetId?: string;
  } = {},
): KanbanReviewSnapshot {
  const filteredArtifacts = sortArtifacts(
    artifacts.filter((artifact) => {
      if (filter.targetType && artifact.targetType !== filter.targetType) {
        return false;
      }
      if (filter.targetId && artifact.targetId !== filter.targetId) {
        return false;
      }
      return true;
    }),
  );

  const queue = filteredArtifacts.map((artifact) => {
    const summary = summarizeKanbanReviewArtifact(artifact);
    return {
      artifactId: artifact.id,
      targetType: artifact.targetType,
      targetId: artifact.targetId,
      targetLabel: artifact.targetLabel,
      title: artifact.title,
      decision: artifact.decision,
      queueState: artifact.queueState,
      commentCount: summary.commentCount,
      openCommentCount: summary.openCommentCount,
      updatedAt: artifact.updatedAt,
    };
  });

  return {
    generatedAt,
    artifacts: filteredArtifacts,
    queue,
    summary: {
      total: filteredArtifacts.length,
      issueCount: filteredArtifacts.filter((artifact) => artifact.targetType === "issue").length,
      workspaceCount: filteredArtifacts.filter((artifact) => artifact.targetType === "workspace").length,
      pendingCount: filteredArtifacts.filter((artifact) => artifact.decision === "pending").length,
      changesRequestedCount: filteredArtifacts.filter((artifact) => artifact.decision === "changes-requested").length,
      approvedCount: filteredArtifacts.filter((artifact) => artifact.decision === "approved").length,
      openCommentCount: filteredArtifacts.reduce(
        (count, artifact) => count + artifact.comments.filter((comment) => comment.status === "open").length,
        0,
      ),
    },
  };
}

function createComment(input: {
  body: string;
  anchor: KanbanReviewCommentAnchor;
  createdAt: string;
  authorName?: string;
  feedbackSource?: KanbanReviewFeedbackSource;
}): KanbanReviewComment {
  return {
    id: `review-comment-${Math.random().toString(36).slice(2, 10)}`,
    author: {
      kind: "human",
      name: input.authorName?.trim() || "Reviewer",
    },
    body: input.body,
    createdAt: input.createdAt,
    status: "open",
    anchor: input.anchor,
    feedbackSource: input.feedbackSource,
  };
}

export class ReviewService {
  private readonly deps: ReviewServiceDeps;

  constructor(overrides: Partial<ReviewServiceDeps> = {}) {
    this.deps = { ...defaultDeps, ...overrides };
  }

  private async readArtifacts(): Promise<KanbanReviewArtifact[]> {
    const store = await readStore(this.deps);
    if (store?.artifacts?.length) {
      return store.artifacts.map((artifact) => ({
        ...artifact,
        comments: [...artifact.comments],
        diff: [...artifact.diff],
      }));
    }

    return buildDefaultArtifacts(this.deps.cwd());
  }

  async listReviews(filter: {
    targetType?: KanbanReviewArtifact["targetType"];
    targetId?: string;
  } = {}): Promise<KanbanReviewSnapshot> {
    const artifacts = await this.readArtifacts();
    return buildSnapshot(artifacts, this.deps.now(), filter);
  }

  async applyAction(input: ReviewActionInput): Promise<KanbanReviewSnapshot> {
    const artifacts = await this.readArtifacts();
    const index = artifacts.findIndex((artifact) => artifact.id === input.artifactId);
    if (index < 0) {
      throw new Error(`Review artifact not found: ${input.artifactId}`);
    }

    const now = this.deps.now();
    const artifact = artifacts[index]!;

    let updatedArtifact: KanbanReviewArtifact;
    if (input.action === "approve") {
      updatedArtifact = {
        ...artifact,
        decision: "approved",
        queueState: "completed",
        updatedAt: now,
      };
    } else if (input.action === "request-changes") {
      updatedArtifact = {
        ...artifact,
        decision: "changes-requested",
        queueState: "in-review",
        updatedAt: now,
      };
    } else {
      const body = input.body.trim();
      if (!body) {
        throw new Error("Comment body is required.");
      }

      updatedArtifact = {
        ...artifact,
        decision: artifact.decision === "approved" ? "pending" : artifact.decision,
        queueState: artifact.queueState === "completed" ? "in-review" : artifact.queueState,
        updatedAt: now,
        comments: [
          ...artifact.comments,
          createComment({
            body,
            anchor: input.anchor,
            createdAt: now,
            authorName: input.authorName,
            feedbackSource: input.feedbackSource,
          }),
        ],
      };
    }

    const nextArtifacts = artifacts.map((candidate, candidateIndex) =>
      candidateIndex === index ? updatedArtifact : candidate,
    );
    await writeStore(this.deps, nextArtifacts);
    return buildSnapshot(nextArtifacts, now);
  }
}
