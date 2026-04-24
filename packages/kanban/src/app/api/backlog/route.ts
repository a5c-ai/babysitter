import { NextResponse } from 'next/server';

import type {
  KanbanCollaboratorRole,
  KanbanEntityVisibility,
  KanbanPermissionGrant,
  KanbanProjectSettings,
  KanbanWorkflowState,
} from '@a5c-ai/agent-mux-core/kanban';

import { AppError, normalizeError } from '@/lib/error-handler';
import { ensureInitialized } from '@/lib/server-init';
import { BacklogQueryService } from '@/lib/services/backlog-query-service';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-cache, no-store' };

const service = new BacklogQueryService();

function isWorkflowState(value: unknown): value is KanbanWorkflowState {
  return value === 'todo' || value === 'in-progress' || value === 'review' || value === 'done';
}

function isCollaboratorRole(value: unknown): value is KanbanCollaboratorRole {
  return value === 'owner' || value === 'maintainer' || value === 'contributor' || value === 'viewer';
}

function isVisibility(value: unknown): value is KanbanEntityVisibility {
  return value === 'private' || value === 'team' || value === 'workspace-shared';
}

function isActivityScope(value: unknown): value is KanbanProjectSettings['activityScope'] {
  return value === 'project-and-issues' || value === 'all-board-entities';
}

function isWorkspaceProvisioning(
  value: unknown,
): value is KanbanProjectSettings['workspaceProvisioning'] {
  return value === 'owners-maintainers' || value === 'contributors-and-up';
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
      case 'update-project-collaboration':
        if (typeof body.projectId !== 'string') {
          throw new AppError('projectId is required.', 'BAD_REQUEST', 400);
        }
        overview = await service.updateProjectCollaboration({
          projectId: body.projectId,
          teamName: typeof body.teamName === 'string' ? body.teamName : undefined,
          visibility: isVisibility(body.visibility) ? body.visibility : undefined,
          defaultRole: isCollaboratorRole(body.defaultRole) ? body.defaultRole : undefined,
          allowSelfAssign:
            typeof body.allowSelfAssign === 'boolean' ? body.allowSelfAssign : undefined,
          reviewRequiredForDone:
            typeof body.reviewRequiredForDone === 'boolean'
              ? body.reviewRequiredForDone
              : undefined,
          activityScope: isActivityScope(body.activityScope) ? body.activityScope : undefined,
          workspaceProvisioning: isWorkspaceProvisioning(body.workspaceProvisioning)
            ? body.workspaceProvisioning
            : undefined,
          members: Array.isArray(body.members)
            ? body.members
                .map((member) => {
                  if (!member || typeof member !== 'object') return null;
                  const entry = member as Record<string, unknown>;
                  if (typeof entry.id !== 'string' || typeof entry.displayName !== 'string') {
                    return null;
                  }
                  return {
                    id: entry.id,
                    displayName: entry.displayName,
                    email: typeof entry.email === 'string' ? entry.email : undefined,
                    role: isCollaboratorRole(entry.role) ? entry.role : undefined,
                  };
                })
                .filter(Boolean) as {
                id: string;
                displayName: string;
                email?: string;
                role?: KanbanCollaboratorRole;
              }[]
            : undefined,
          permissions: Array.isArray(body.permissions)
            ? (body.permissions.filter(
                (grant): grant is KanbanPermissionGrant =>
                  Boolean(
                    grant &&
                      typeof grant === 'object' &&
                      typeof (grant as Record<string, unknown>).action === 'string' &&
                      Array.isArray((grant as Record<string, unknown>).roles),
                  ),
              ) as KanbanPermissionGrant[])
            : undefined,
        });
        break;
      case 'update-issue-collaboration':
        if (typeof body.issueId !== 'string') {
          throw new AppError('issueId is required.', 'BAD_REQUEST', 400);
        }
        overview = await service.updateIssueCollaboration({
          issueId: body.issueId,
          assigneeIds:
            Array.isArray(body.assigneeIds) && body.assigneeIds.every((id) => typeof id === 'string')
              ? (body.assigneeIds as string[])
              : [],
          collaboratorIds:
            Array.isArray(body.collaboratorIds) &&
            body.collaboratorIds.every((id) => typeof id === 'string')
              ? (body.collaboratorIds as string[])
              : [],
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
