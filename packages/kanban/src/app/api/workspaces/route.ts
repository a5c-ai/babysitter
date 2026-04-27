import { NextResponse } from "next/server";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";
import type { KanbanReviewArtifact, KanbanReviewComment, KanbanReviewSummary } from "@a5c-ai/agent-mux-core";

import { normalizeError } from "@/lib/error-handler";
import { ReviewService } from "@/lib/review-service";
import { BacklogQueryService } from "@/lib/services/backlog-query-service";
import type { WorkspaceLifecycleService, WorkspaceSessionSnapshot } from "@/lib/workspace-lifecycle";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };
const reviewService = new ReviewService();
const backlogService = new BacklogQueryService();

async function createWorkspaceService(): Promise<WorkspaceLifecycleService> {
  const { WorkspaceLifecycleService } = await import("@/lib/workspace-lifecycle");
  return new WorkspaceLifecycleService();
}

function readRuntime(value: unknown): WorkspaceRuntimeSurface | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return value as WorkspaceRuntimeSurface;
}

function readSessions(body: unknown): WorkspaceSessionSnapshot[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { sessions?: unknown[] }).sessions)) {
    return [];
  }

  return (body as { sessions: unknown[] }).sessions.flatMap((value) => {
    if (!value || typeof value !== "object") {
      return [];
    }

    const session = value as Record<string, unknown>;
    if (typeof session.sessionId !== "string" || typeof session.agent !== "string" || typeof session.status !== "string") {
      return [];
    }

    return [
      {
        sessionId: session.sessionId,
        agent: session.agent,
        status: session.status === "active" ? "active" : "inactive",
        cwd: typeof session.cwd === "string" ? session.cwd : undefined,
        title: typeof session.title === "string" ? session.title : undefined,
        updatedAt: typeof session.updatedAt === "number" ? session.updatedAt : undefined,
        activeRunId: typeof session.activeRunId === "string" ? session.activeRunId : null,
        latestRunId: typeof session.latestRunId === "string" ? session.latestRunId : null,
        runtime: readRuntime(session.runtime),
      },
    ];
  });
}

function buildReviewByWorkspacePath(
  artifacts: readonly KanbanReviewArtifact[],
): ReadonlyMap<string, KanbanReviewSummary> {
  return new Map<string, KanbanReviewSummary>(
    artifacts.map((artifact: KanbanReviewArtifact) => [
      artifact.targetId,
      {
        decision: artifact.decision,
        queueState: artifact.queueState,
        commentCount: artifact.comments.length,
        openCommentCount: artifact.comments.filter((comment: KanbanReviewComment) => comment.status === "open").length,
        latestActivityAt: artifact.updatedAt,
      },
    ]),
  );
}

async function buildLinkedIssuesByWorkspacePath() {
  const overview = await backlogService.getOverview();
  const projectById = new Map(overview.snapshot.projects.map((project) => [project.id, project] as const));
  const map = new Map<string, Array<{
    issueId: string;
    issueKey: string;
    issueTitle: string;
    projectId: string;
    projectKey: string;
    projectName: string;
    linkedAt: string;
    source: "created-from-issue" | "linked-existing-workspace";
  }>>();

  for (const issue of overview.snapshot.issues) {
    const project = projectById.get(issue.projectId);
    for (const workspaceLink of issue.workspaceLinks ?? []) {
      const current = map.get(workspaceLink.workspacePath) ?? [];
      current.push({
        issueId: issue.id,
        issueKey: issue.key,
        issueTitle: issue.title,
        projectId: issue.projectId,
        projectKey: project?.key ?? issue.projectId,
        projectName: project?.name ?? issue.projectId,
        linkedAt: workspaceLink.linkedAt,
        source: workspaceLink.source,
      });
      map.set(workspaceLink.workspacePath, current);
    }
  }

  return map;
}

export async function GET() {
  try {
    const service = await createWorkspaceService();
    const reviews = await reviewService.listReviews({ targetType: "workspace" });
    const linkedIssuesByWorkspacePath = await buildLinkedIssuesByWorkspacePath();
    const payload = await service.listWorkspaces({
      reviewByWorkspacePath: buildReviewByWorkspacePath(reviews.artifacts),
      linkedIssuesByWorkspacePath,
    });
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message, code: normalized.code }, { status: normalized.status });
  }
}

export async function POST(request: Request) {
  try {
    const service = await createWorkspaceService();
    const body = (await request.json()) as Record<string, unknown>;
    const sessions = readSessions(body);
    const reviews = await reviewService.listReviews({ targetType: "workspace" });
    const reviewByWorkspacePath = buildReviewByWorkspacePath(reviews.artifacts);
    const linkedIssuesByWorkspacePath = await buildLinkedIssuesByWorkspacePath();

    if (
      body.action === "provision" ||
      body.action === "archive" ||
      body.action === "cleanup" ||
      body.action === "recover" ||
      body.action === "notes-save" ||
      body.action === "rebase-start" ||
      body.action === "rebase-auto-resolve" ||
      body.action === "rebase-open-in-editor" ||
      body.action === "rebase-mark-resolved" ||
      body.action === "rebase-abort"
    ) {
      if (body.action === "provision") {
        const current = await backlogService.getOverview();
        const projectById = new Map(current.snapshot.projects.map((project) => [project.id, project] as const));
        const scope =
          body.scope === "issue" || body.scope === "project" || body.scope === "host"
            ? body.scope
            : null;
        const workspaceName = typeof body.workspaceName === "string" ? body.workspaceName.trim() : "";
        if (!scope || !workspaceName) {
          return NextResponse.json(
            { error: "scope and workspaceName are required", code: "BAD_REQUEST" },
            { status: 400 },
          );
        }

        const projectId = typeof body.projectId === "string" ? body.projectId : "";
        const project = projectById.get(projectId);
        if (!project) {
          return NextResponse.json(
            { error: `Project ${projectId} not found`, code: "NOT_FOUND" },
            { status: 404 },
          );
        }

        const selectedIntegration =
          typeof body.hostProvider === "string"
            ? project.integrations.find((integration) => integration.provider === body.hostProvider)
            : undefined;

        let provisioned;
        if (scope === "issue") {
          const issueId = typeof body.issueId === "string" ? body.issueId : "";
          const issue = current.snapshot.issues.find((candidate) => candidate.id === issueId);
          if (!issue || issue.projectId !== project.id) {
            return NextResponse.json(
              { error: `Issue ${issueId} not found in project ${project.id}`, code: "NOT_FOUND" },
              { status: 404 },
            );
          }
          provisioned = await service.provisionWorkspaceForIssue({
            issueKey: workspaceName,
            issueTitle: issue.title,
            ownership: {
              source: "created-from-issue",
              project: {
                projectId: project.id,
                projectKey: project.key,
                projectName: project.name,
              },
              issue: {
                issueId: issue.id,
                issueKey: issue.key,
                issueTitle: issue.title,
              },
              host: selectedIntegration
                ? {
                    provider: selectedIntegration.provider,
                    label: selectedIntegration.label,
                    accountLabel: selectedIntegration.accountLabel,
                  }
                : undefined,
            },
          });
          await backlogService.linkIssueWorkspace({
            issueId: issue.id,
            workspacePath: provisioned.workspacePath,
            workspaceName: provisioned.workspaceName,
            branchName: provisioned.branchName,
            source: "created-from-issue",
          });
        } else {
          provisioned = await service.provisionWorkspace({
            workspaceName,
            ownership: {
              source: scope === "host" ? "created-from-host" : "created-from-project",
              project: {
                projectId: project.id,
                projectKey: project.key,
                projectName: project.name,
              },
              host: selectedIntegration
                ? {
                    provider: selectedIntegration.provider,
                    label: selectedIntegration.label,
                    accountLabel: selectedIntegration.accountLabel,
                  }
                : undefined,
            },
          });
        }

        const payload = await service.listWorkspaces({
          sessions,
          reviewByWorkspacePath,
          linkedIssuesByWorkspacePath: await buildLinkedIssuesByWorkspacePath(),
        });
        return NextResponse.json(
          { workspace: provisioned, ...payload },
          { headers: NO_CACHE_HEADERS },
        );
      }

      const workspacePath = typeof body.workspacePath === "string" ? body.workspacePath : "";
      if (!workspacePath) {
        return NextResponse.json({ error: "workspacePath is required", code: "BAD_REQUEST" }, { status: 400 });
      }

      const result = await service.applyAction({
        action: body.action,
        workspacePath,
        note: typeof body.note === "string" ? body.note : undefined,
        sessions,
      });
      const payload = await service.listWorkspaces({ sessions, reviewByWorkspacePath, linkedIssuesByWorkspacePath });
      return NextResponse.json({ result, ...payload }, { headers: NO_CACHE_HEADERS });
    }

    const payload = await service.listWorkspaces({ sessions, reviewByWorkspacePath, linkedIssuesByWorkspacePath });
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message, code: normalized.code }, { status: normalized.status });
  }
}
