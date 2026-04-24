import { NextResponse } from 'next/server';

import type { KanbanWorkflowState } from '../../../../../agent-mux/core/src/kanban.js';

import { AppError, normalizeError } from '@/lib/error-handler';
import { ensureInitialized } from '@/lib/server-init';
import { BacklogQueryService } from '@/lib/services/backlog-query-service';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-cache, no-store' };

const service = new BacklogQueryService();

function isWorkflowState(value: unknown): value is KanbanWorkflowState {
  return value === 'todo' || value === 'in-progress' || value === 'review' || value === 'done';
}

export async function GET() {
  try {
    await ensureInitialized();
    const overview = await service.getOverview();
    return NextResponse.json(overview, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureInitialized();
    const body = (await request.json()) as Record<string, unknown>;

    let overview;
    switch (body.action) {
      case 'move-issue':
        if (typeof body.issueId !== 'string' || !isWorkflowState(body.toState)) {
          throw new AppError('issueId and toState are required.', 'BAD_REQUEST', 400);
        }
        overview = await service.moveIssue({
          issueId: body.issueId,
          toState: body.toState,
        });
        break;
      case 'link-repository':
        if (
          typeof body.issueId !== 'string' ||
          typeof body.owner !== 'string' ||
          typeof body.name !== 'string' ||
          typeof body.branchName !== 'string'
        ) {
          throw new AppError(
            'issueId, owner, name, and branchName are required.',
            'BAD_REQUEST',
            400,
          );
        }
        overview = await service.linkRepository({
          issueId: body.issueId,
          owner: body.owner,
          name: body.name,
          branchName: body.branchName,
          defaultBranch: typeof body.defaultBranch === 'string' ? body.defaultBranch : undefined,
          provider:
            body.provider === 'gitlab' ||
            body.provider === 'bitbucket' ||
            body.provider === 'local'
              ? body.provider
              : 'github',
        });
        break;
      case 'update-repository-settings':
        if (typeof body.issueId !== 'string') {
          throw new AppError('issueId is required.', 'BAD_REQUEST', 400);
        }
        overview = await service.updateRepositorySettings({
          issueId: body.issueId,
          settings: {
            baseBranch: typeof body.baseBranch === 'string' ? body.baseBranch : undefined,
            ciProvider: typeof body.ciProvider === 'string' ? body.ciProvider : undefined,
            publishTarget: typeof body.publishTarget === 'string' ? body.publishTarget : undefined,
            autoMerge: typeof body.autoMerge === 'boolean' ? body.autoMerge : undefined,
            requiredApprovals:
              typeof body.requiredApprovals === 'number' ? body.requiredApprovals : undefined,
          },
        });
        break;
      case 'create-pull-request':
        if (typeof body.issueId !== 'string' || typeof body.title !== 'string') {
          throw new AppError('issueId and title are required.', 'BAD_REQUEST', 400);
        }
        overview = await service.createPullRequest({
          issueId: body.issueId,
          title: body.title,
          reviewers: typeof body.reviewers === 'string' ? body.reviewers : undefined,
        });
        break;
      default:
        throw new AppError('Unsupported backlog action.', 'BAD_REQUEST', 400);
    }

    return NextResponse.json(overview, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    const normalized = normalizeError(error);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status },
    );
  }
}
