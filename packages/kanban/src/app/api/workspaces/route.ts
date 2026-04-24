import { NextResponse } from "next/server";
import type { WorkspaceRuntimeSurface } from "@a5c-ai/agent-mux-core";

import { normalizeError } from "@/lib/error-handler";
import { ReviewService } from "@/lib/review-service";
import { WorkspaceLifecycleService, type WorkspaceSessionSnapshot } from "@/lib/workspace-lifecycle";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };
const service = new WorkspaceLifecycleService();
const reviewService = new ReviewService();

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

export async function GET() {
  try {
    const reviews = await reviewService.listReviews({ targetType: "workspace" });
    const payload = await service.listWorkspaces({
      reviewByWorkspacePath: new Map(
        reviews.artifacts.map((artifact) => [artifact.targetId, {
          decision: artifact.decision,
          queueState: artifact.queueState,
          commentCount: artifact.comments.length,
          openCommentCount: artifact.comments.filter((comment) => comment.status === "open").length,
          latestActivityAt: artifact.updatedAt,
        }]),
      ),
    });
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message, code: normalized.code }, { status: normalized.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessions = readSessions(body);
    const reviews = await reviewService.listReviews({ targetType: "workspace" });
    const reviewByWorkspacePath = new Map(
      reviews.artifacts.map((artifact) => [artifact.targetId, {
        decision: artifact.decision,
        queueState: artifact.queueState,
        commentCount: artifact.comments.length,
        openCommentCount: artifact.comments.filter((comment) => comment.status === "open").length,
        latestActivityAt: artifact.updatedAt,
      }]),
    );

    if (body.action === "archive" || body.action === "cleanup" || body.action === "recover") {
      const workspacePath = typeof body.workspacePath === "string" ? body.workspacePath : "";
      if (!workspacePath) {
        return NextResponse.json({ error: "workspacePath is required", code: "BAD_REQUEST" }, { status: 400 });
      }

      const result = await service.applyAction({
        action: body.action,
        workspacePath,
        sessions,
      });
      const payload = await service.listWorkspaces({ sessions, reviewByWorkspacePath });
      return NextResponse.json({ result, ...payload }, { headers: NO_CACHE_HEADERS });
    }

    const payload = await service.listWorkspaces({ sessions, reviewByWorkspacePath });
    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json({ error: normalized.message, code: normalized.code }, { status: normalized.status });
  }
}
