import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  summarizeKanbanReviewArtifact,
  type KanbanCiGate,
  type KanbanDiffPresentation,
  type KanbanIntegrationProvider,
  type KanbanMergeStatus,
  type KanbanPublishStatus,
  type KanbanPullRequestStatus,
  type KanbanReviewArtifact,
  type KanbanReviewComment,
  type KanbanReviewCommentAnchor,
  type KanbanReviewExecutionTarget,
  type KanbanReviewFeedbackSource,
  type KanbanReviewDecision,
  type KanbanReviewStatus,
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
      action: "submit-review";
      artifactId: string;
      decision: KanbanReviewDecision;
      summary?: string;
      executionTargetId?: string;
    }
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
    }
  | {
      action: "create-pull-request";
      artifactId: string;
      provider?: KanbanIntegrationProvider;
      title: string;
      reviewers?: string;
      branchName?: string;
      baseBranch?: string;
      url?: string;
    }
  | {
      action: "link-pull-request";
      artifactId: string;
      provider?: KanbanIntegrationProvider;
      number: number;
      title: string;
      status?: KanbanPullRequestStatus;
      reviewStatus?: KanbanReviewStatus;
      mergeStatus?: KanbanMergeStatus;
      publishStatus?: KanbanPublishStatus;
      ciGates?: readonly KanbanCiGate[];
      branchName?: string;
      baseBranch?: string;
      url?: string;
    };

const defaultDeps: ReviewServiceDeps = {
  readFile: fs.readFile,
  writeFile: fs.writeFile,
  mkdir: fs.mkdir,
  reviewFilePath: REVIEW_FILE_PATH,
  now: () => new Date().toISOString(),
  cwd: () => process.cwd(),
};

function parseReviewerList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function nextPullRequestNumber(artifacts: readonly KanbanReviewArtifact[]): number {
  return (
    Math.max(0, ...artifacts.map((artifact) => artifact.linkedPullRequest?.number ?? 0)) + 1
  );
}

function defaultBranchName(artifact: KanbanReviewArtifact): string {
  return artifact.branch?.trim() || `review/${artifact.targetLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function cloneCiGates(gates: readonly KanbanCiGate[] | undefined): KanbanCiGate[] {
  return (gates ?? []).map((gate) => ({ ...gate }));
}

function cloneExecutionTargets(targets: readonly KanbanReviewExecutionTarget[] | undefined): KanbanReviewExecutionTarget[] {
  return (targets ?? []).map((target) => ({ ...target }));
}

function defaultCiGates(provider: string, status: KanbanCiGate["status"]): KanbanCiGate[] {
  return [
    {
      id: `ci-${provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-build`,
      name: "Build",
      provider,
      required: true,
      status,
      summary: status === "passing" ? "Build completed successfully." : "Build is waiting for the next run.",
    },
    {
      id: `ci-${provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-tests`,
      name: "Tests",
      provider,
      required: true,
      status,
      summary: status === "passing" ? "Tests completed successfully." : "Tests are waiting for the next run.",
    },
  ];
}

function linkStateForArtifact(artifact: KanbanReviewArtifact): "linked" | "partially-linked" {
  return artifact.integration?.status === "connected" ? "linked" : "partially-linked";
}

function integrationStatusForArtifact(artifact: KanbanReviewArtifact) {
  return artifact.integration?.status ?? artifact.linkedPullRequest?.integrationStatus ?? "connected";
}

function defaultPresentationForArtifact(targetType: KanbanReviewArtifact["targetType"]): KanbanDiffPresentation {
  return targetType === "workspace" ? "split" : "unified";
}

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
      preferredPresentation: defaultPresentationForArtifact("issue"),
      updatedAt: "2026-04-24T12:00:00.000Z",
      executionTargets: [
        {
          id: "issue-run-follow-up",
          kind: "run",
          label: "Open linked run task",
          href: "/runs/run-review-issue?effectId=eff-review-issue",
          description: "Inspect the originating run task and continue the implementation loop from the review context.",
          actionLabel: "Open dispatch task",
        },
        {
          id: "issue-session-follow-up",
          kind: "session",
          label: "Resume linked session",
          href: "/sessions/session-review-issue",
          description: "Return to the session that produced this review artifact and post the follow-up there.",
          actionLabel: "Open session",
        },
      ],
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
          path: "packages/agent-mux/gateway/src/kanban/routes.ts",
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
      preferredPresentation: defaultPresentationForArtifact("workspace"),
      updatedAt: "2026-04-24T12:05:00.000Z",
      executionTargets: [
        {
          id: "workspace-open",
          kind: "workspace",
          label: "Open workspace",
          href: `/workspaces?workspace=${encodeURIComponent(workspacePath)}`,
          description: "Jump back into the workspace detail view with preview, runtime, and editor affordances.",
          actionLabel: "Open workspace",
        },
        {
          id: "workspace-session-follow-up",
          kind: "session",
          label: "Continue linked session",
          href: "/sessions/session-review-workspace",
          description: "Resume the session that owns this worktree and apply the requested changes from review.",
          actionLabel: "Open session",
        },
        {
          id: "workspace-run-follow-up",
          kind: "run",
          label: "Inspect linked run",
          href: "/runs/run-review-workspace?effectId=eff-review-workspace",
          description: "Open the run/effect that produced the current review handoff for direct follow-through.",
          actionLabel: "Open dispatch",
        },
      ],
      integration: {
        provider: "github",
        status: "connected",
        linkState: "linked",
        guidance: "Linked PR state stays synchronized with the shared review artifact for this workspace.",
        prerequisites: [],
        actions: {
          canCreatePullRequest: true,
          canManagePullRequest: true,
          canApproveFromReview: true,
        },
      },
      linkedPullRequest: {
        provider: "github",
        status: "changes-requested",
        linkState: "linked",
        title: "Workspace review handoff",
        number: 604,
        branchName: path.basename(workspacePath),
        baseBranch: "main",
        reviewStatus: "changes-requested",
        mergeStatus: "blocked",
        publishStatus: "not-ready",
        ciGates: defaultCiGates("GitHub Actions", "pending"),
        integrationStatus: "connected",
        guidance: "Resolve the open review note, re-run CI, and then continue through merge readiness.",
      },
      diff: [
        {
          id: "workspace-diff-page",
          path: "packages/agent-mux/webui/src/components/workspaces/workspaces-page.tsx",
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
            filePath: "packages/agent-mux/webui/src/components/workspaces/workspaces-page.tsx",
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
        executionTargets: cloneExecutionTargets(artifact.executionTargets),
        latestSubmission: artifact.latestSubmission ? { ...artifact.latestSubmission } : undefined,
        linkedPullRequest: artifact.linkedPullRequest
          ? {
              ...artifact.linkedPullRequest,
              ciGates: cloneCiGates(artifact.linkedPullRequest.ciGates),
            }
          : undefined,
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
    if (input.action === "submit-review") {
      const target = artifact.executionTargets?.find((candidate) => candidate.id === input.executionTargetId);
      const summary = input.summary?.trim();
      updatedArtifact = {
        ...artifact,
        decision: input.decision,
        queueState: input.decision === "approved" ? "completed" : "in-review",
        updatedAt: now,
        latestSubmission: {
          decision: input.decision,
          summary: summary || undefined,
          submittedAt: now,
          executionTargetId: target?.id,
          executionTargetLabel: target?.label,
        },
      };
    } else if (input.action === "approve") {
      updatedArtifact = {
        ...artifact,
        decision: "approved",
        queueState: "completed",
        updatedAt: now,
        latestSubmission: {
          decision: "approved",
          submittedAt: now,
        },
      };
    } else if (input.action === "request-changes") {
      updatedArtifact = {
        ...artifact,
        decision: "changes-requested",
        queueState: "in-review",
        updatedAt: now,
        latestSubmission: {
          decision: "changes-requested",
          submittedAt: now,
        },
      };
    } else if (input.action === "add-comment") {
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
    } else {
      const provider = input.provider ?? artifact.integration?.provider ?? artifact.linkedPullRequest?.provider ?? "github";
      const integrationStatus = integrationStatusForArtifact(artifact);
      const linkState = linkStateForArtifact(artifact);
      const baseBranch = input.baseBranch?.trim() || artifact.linkedPullRequest?.baseBranch || "main";
      const branchName =
        input.branchName?.trim() || artifact.linkedPullRequest?.branchName || artifact.branch || defaultBranchName(artifact);

      if (input.action === "create-pull-request") {
        if (artifact.integration && !artifact.integration.actions.canCreatePullRequest) {
          throw new Error(artifact.integration.actions.reason ?? artifact.integration.guidance);
        }

        const title = input.title.trim();
        if (!title) {
          throw new Error("PR title is required.");
        }

        const reviewers = parseReviewerList(input.reviewers ?? "");
        updatedArtifact = {
          ...artifact,
          decision: artifact.decision === "approved" ? "pending" : artifact.decision,
          queueState: reviewers.length > 0 ? "in-review" : artifact.queueState === "completed" ? "queued" : artifact.queueState,
          updatedAt: now,
          linkedPullRequest: {
            provider,
            status: reviewers.length > 0 ? "in-review" : "open",
            linkState,
            title,
            number: nextPullRequestNumber(artifacts),
            url: input.url?.trim() || artifact.linkedPullRequest?.url,
            branchName,
            baseBranch,
            reviewStatus: reviewers.length > 0 ? "pending" : "unlinked",
            mergeStatus: "blocked",
            publishStatus: "not-ready",
            ciGates: defaultCiGates(provider === "azure-repos" ? "Azure Pipelines" : "GitHub Actions", "pending"),
            integrationStatus,
            guidance:
              artifact.integration?.guidance ??
              "Linked PR created. Keep review comments and CI state synchronized from the shared review surface.",
          },
        };
      } else {
        if (artifact.integration && !artifact.integration.actions.canManagePullRequest) {
          throw new Error(artifact.integration.actions.reason ?? artifact.integration.guidance);
        }

        const title = input.title.trim();
        if (!title) {
          throw new Error("Linked PR title is required.");
        }
        if (!Number.isFinite(input.number) || input.number <= 0) {
          throw new Error("Linked PR number must be a positive integer.");
        }

        const status = input.status ?? "in-review";
        const reviewStatus =
          input.reviewStatus ??
          (status === "approved"
            ? "approved"
            : status === "changes-requested"
              ? "changes-requested"
              : status === "open" || status === "draft"
                ? "unlinked"
                : "pending");
        const mergeStatus = input.mergeStatus ?? (status === "merged" ? "merged" : "blocked");
        const publishStatus = input.publishStatus ?? (status === "merged" ? "ready" : "not-ready");

        updatedArtifact = {
          ...artifact,
          decision:
            reviewStatus === "approved"
              ? "approved"
              : reviewStatus === "changes-requested"
                ? "changes-requested"
                : "pending",
          queueState: reviewStatus === "approved" || status === "merged" ? "completed" : "in-review",
          updatedAt: now,
          linkedPullRequest: {
            provider,
            status,
            linkState,
            title,
            number: Math.floor(input.number),
            url: input.url?.trim() || artifact.linkedPullRequest?.url,
            branchName,
            baseBranch,
            reviewStatus,
            mergeStatus,
            publishStatus,
            ciGates:
              input.ciGates && input.ciGates.length > 0
                ? cloneCiGates(input.ciGates)
                : artifact.linkedPullRequest?.ciGates && artifact.linkedPullRequest.ciGates.length > 0
                  ? cloneCiGates(artifact.linkedPullRequest.ciGates)
                  : defaultCiGates(provider === "azure-repos" ? "Azure Pipelines" : "GitHub Actions", "passing"),
            integrationStatus,
            guidance:
              artifact.integration?.guidance ??
              "Linked PR imported into the shared review surface. Review notes now map back to the active work item.",
          },
        };
      }
    }

    const nextArtifacts = artifacts.map((candidate, candidateIndex) =>
      candidateIndex === index ? updatedArtifact : candidate,
    );
    await writeStore(this.deps, nextArtifacts);
    return buildSnapshot(nextArtifacts, now);
  }
}
