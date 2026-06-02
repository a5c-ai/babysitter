import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

import {
  createClient,
  validateProfileData,
  type AgentName,
  type McpServerConfig,
  type WorkspaceRuntimeSurface,
} from '@a5c-ai/agent-mux-comm';
import type {
  KanbanReviewArtifact,
  KanbanReviewComment,
  KanbanReviewSummary,
} from '@a5c-ai/agent-mux-comm';
import type { AutomationRuleLifecycleState } from '@a5c-ai/agent-mux-comm';
import type { Hono } from 'hono';
import { randomUUID } from 'node:crypto';

import { getRunCached, getAllCachedDigests, discoverAndCacheAll } from './lib/run-cache.js';
import { AppError, normalizeError } from './lib/error-handler.js';
import { findRunDir } from './lib/path-resolver.js';
import { parseJournalDir, parseTaskDetail } from './lib/parser.js';
import { ReviewService, type ReviewActionInput } from './lib/review-service.js';
import { ensureInitialized, serverEvents, type BatchedRunChangedEvent } from './lib/server-init.js';
import {
  AutomationRuleService,
  isAutomationRuleState,
  isAutomationTriggerType,
  type AutomationRuleAction,
  type AutomationRuleQuery,
  type AutomationTriggerType,
} from './lib/services/automation-rule-service.js';
import { AutomationWebhookService } from './lib/services/automation-webhook-service.js';
import { BacklogQueryService } from './lib/services/backlog-query-service.js';
import { DispatchContextLabelService } from './lib/services/dispatch-context-label-service.js';
import { RunQueryService, type SortMode } from './lib/services/run-query-service.js';
import { TaskTagService } from './lib/services/task-tag-service.js';
import {
  loadSettingsSectionStorage,
  writeSettingsSectionStorage,
} from './lib/settings-section-storage.js';
import { WorkspaceLifecycleService, type WorkspaceSessionSnapshot } from './lib/workspace-lifecycle.js';

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-cache, no-store' };

const backlogService = new BacklogQueryService();
const taskTagService = new TaskTagService();
const dispatchContextLabelService = new DispatchContextLabelService();
const reviewService = new ReviewService();
const automationRuleService = new AutomationRuleService();
const automationWebhookService = new AutomationWebhookService();
const workspaceService = new WorkspaceLifecycleService();
const runQueryService = new RunQueryService();
const nextId = () => randomUUID();

function jsonWithHeaders(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: {
      ...NO_CACHE_HEADERS,
      ...(headers ?? {}),
    },
  });
}

function jsonError(error: unknown): Response {
  const normalized = normalizeError(error);
  return Response.json(
    { error: normalized.message, code: normalized.code },
    { status: normalized.status },
  );
}

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isWorkflowState(value: unknown): value is Parameters<BacklogQueryService['moveIssue']>[0]['toState'] {
  return value === 'todo' || value === 'in-progress' || value === 'review' || value === 'done';
}

function isCollaboratorRole(value: unknown): value is Parameters<BacklogQueryService['updateProjectCollaboration']>[0]['defaultRole'] {
  return value === 'owner' || value === 'maintainer' || value === 'contributor' || value === 'viewer';
}

function isVisibility(value: unknown): value is Parameters<BacklogQueryService['updateProjectCollaboration']>[0]['visibility'] {
  return value === 'private' || value === 'team' || value === 'workspace-shared';
}

function isActivityScope(value: unknown): value is Parameters<BacklogQueryService['updateProjectCollaboration']>[0]['activityScope'] {
  return value === 'project-and-issues' || value === 'all-board-entities';
}

function isWorkspaceProvisioning(
  value: unknown,
): value is Parameters<BacklogQueryService['updateProjectCollaboration']>[0]['workspaceProvisioning'] {
  return value === 'owners-maintainers' || value === 'contributors-and-up';
}

function readQueryValues(searchParams: URLSearchParams, name: string): string[] {
  return Array.from(
    new Set(
      searchParams
        .getAll(name)
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function parseAutomationQuery(url: URL): AutomationRuleQuery {
  const { searchParams } = url;

  const states = readQueryValues(searchParams, 'state');
  for (const state of states) {
    if (!isAutomationRuleState(state)) {
      throw new AppError(`Invalid state query value: ${state}`, 'BAD_REQUEST', 400);
    }
  }

  const triggerTypes = readQueryValues(searchParams, 'triggerType');
  for (const triggerType of triggerTypes) {
    if (!isAutomationTriggerType(triggerType)) {
      throw new AppError(`Invalid triggerType query value: ${triggerType}`, 'BAD_REQUEST', 400);
    }
  }

  return {
    state: states as AutomationRuleLifecycleState[],
    triggerType: triggerTypes as AutomationTriggerType[],
    projectId: searchParams.get('projectId')?.trim() || undefined,
    boardProjectId: searchParams.get('boardProjectId')?.trim() || undefined,
    search: searchParams.get('search')?.trim() || undefined,
    includeArchived: searchParams.get('includeArchived') === 'true',
  };
}

function readRuntime(value: unknown): WorkspaceRuntimeSurface | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return value as WorkspaceRuntimeSurface;
}

function readSessions(body: unknown): WorkspaceSessionSnapshot[] {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { sessions?: unknown[] }).sessions)) {
    return [];
  }

  return (body as { sessions: unknown[] }).sessions.flatMap((value) => {
    if (!value || typeof value !== 'object') {
      return [];
    }

    const session = value as Record<string, unknown>;
    if (typeof session.sessionId !== 'string' || typeof session.agent !== 'string' || typeof session.status !== 'string') {
      return [];
    }

    return [
      {
        sessionId: session.sessionId,
        agent: session.agent,
        status: session.status === 'active' ? 'active' : 'inactive',
        cwd: typeof session.cwd === 'string' ? session.cwd : undefined,
        title: typeof session.title === 'string' ? session.title : undefined,
        updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : undefined,
        activeRunId: typeof session.activeRunId === 'string' ? session.activeRunId : null,
        latestRunId: typeof session.latestRunId === 'string' ? session.latestRunId : null,
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
        openCommentCount: artifact.comments.filter((comment: KanbanReviewComment) => comment.status === 'open').length,
        latestActivityAt: artifact.updatedAt,
      },
    ]),
  );
}

async function buildLinkedIssuesByWorkspacePath() {
  const overview = await backlogService.getOverview();
  const projectById = new Map(overview.snapshot.projects.map((project) => [project.id, project] as const));
  const map = new Map<
    string,
    Array<{
      issueId: string;
      issueKey: string;
      issueTitle: string;
      projectId: string;
      projectKey: string;
      projectName: string;
      linkedAt: string;
      source: 'created-from-issue' | 'linked-existing-workspace';
    }>
  >();

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

function extractRunId(runDir: string): string {
  return path.basename(runDir);
}

async function loadPreviewFile(runDir: string, filePath: string): Promise<string | null> {
  const candidates = new Set<string>();
  if (path.isAbsolute(filePath)) {
    candidates.add(filePath);
  } else {
    candidates.add(path.join(runDir, filePath));
    try {
      const runJson = JSON.parse(await fs.readFile(path.join(runDir, 'run.json'), 'utf8')) as {
        cwd?: unknown;
      };
      if (typeof runJson.cwd === 'string' && runJson.cwd.length > 0) {
        candidates.add(path.join(runJson.cwd, filePath));
      }
    } catch {
      // Ignore missing/invalid run.json when previewing files.
    }
  }

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, 'utf8');
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

async function getNextJournalSeq(journalDir: string): Promise<number> {
  try {
    const files = await fs.readdir(journalDir);
    let max = 0;
    for (const file of files) {
      const seq = Number(file.split('.')[0]);
      if (Number.isFinite(seq) && seq > max) {
        max = seq;
      }
    }
    return max + 1;
  } catch {
    return 1;
  }
}

async function appendEffectResolvedJournalEntry(runDir: string, effectId: string, now: string): Promise<void> {
  const journalDir = path.join(runDir, 'journal');
  await fs.mkdir(journalDir, { recursive: true });

  const seq = await getNextJournalSeq(journalDir);
  const ulid = nextId();
  const filename = `${seq.toString().padStart(6, '0')}.${ulid}.json`;
  const eventPayload = {
    type: 'EFFECT_RESOLVED',
    recordedAt: now,
    data: {
      effectId,
      status: 'ok',
      resultRef: `tasks/${effectId}/result.json`,
      startedAt: now,
      finishedAt: now,
    },
  };

  const eventContents = JSON.stringify(eventPayload, null, 2) + '\n';
  const checksum = crypto.createHash('sha256').update(eventContents).digest('hex');
  const payload = JSON.stringify({ ...eventPayload, checksum }, null, 2) + '\n';
  await fs.writeFile(path.join(journalDir, filename), payload, 'utf8');
}

async function approveBreakpointEffect(runId: string, effectId: string, answer: string) {
  if (!runId || !effectId || !answer.trim()) {
    throw new AppError('Run ID, effect ID, and answer are required', 'BAD_REQUEST', 400);
  }
  if (!isValidId(runId) || !isValidId(effectId)) {
    throw new AppError('Invalid run ID or effect ID', 'BAD_REQUEST', 400);
  }

  const found = await findRunDir(runId);
  if (!found) {
    throw new AppError(`Run not found: ${runId}`, 'NOT_FOUND', 404);
  }

  const taskDir = path.join(found.runDir, 'tasks', effectId);
  try {
    await fs.access(taskDir);
  } catch {
    throw new AppError(`Task directory not found: ${effectId}`, 'NOT_FOUND', 404);
  }

  const now = new Date().toISOString();
  const resultPayload = {
    status: 'ok',
    value: {
      answer: answer.trim(),
      approvedAt: now,
      approvedBy: 'agent-mux-webui',
    },
    startedAt: now,
    finishedAt: now,
  };

  await fs.writeFile(path.join(taskDir, 'result.json'), JSON.stringify(resultPayload, null, 2), 'utf8');
  await appendEffectResolvedJournalEntry(found.runDir, effectId, now);
}

async function buildAgentConfigurationResponse() {
  const client = createClient();
  const storage = await loadSettingsSectionStorage();
  return {
    agents: client.adapters.list().map((adapter) => {
      const stored = storage.agentConfiguration[adapter.agent] ?? {};
      const defaultModel = client.models.defaultModel(adapter.agent as AgentName)?.modelId ?? '';
      return {
        agent: adapter.agent,
        displayName: adapter.displayName,
        configuredModel: stored.model ?? '',
        configuredProvider: stored.provider ?? '',
        approvalMode: stored.approvalMode ?? 'prompt',
        maxTokens: stored.maxTokens == null ? '' : String(stored.maxTokens),
        availableModels: client.models.catalog(adapter.agent as AgentName).map((model) => ({
          modelId: model.modelId,
          provider: model.provider,
          isDefault: model.isDefault,
          deprecated: model.deprecated,
          successorModelId: model.successorModelId,
        })),
        defaultModel,
      };
    }),
  };
}

type McpServerDraft = {
  name: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  command: string;
  url: string;
  argsText: string;
  envText: string;
};

function toMcpDraft(server: McpServerConfig): McpServerDraft {
  return {
    name: server.name,
    transport: server.transport,
    command: server.command ?? '',
    url: server.url ?? '',
    argsText: (server.args ?? []).join('\n'),
    envText: Object.entries(server.env ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join('\n'),
  };
}

function parseEnv(envText: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of envText.split('\n').map((entry) => entry.trim()).filter(Boolean)) {
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      throw new Error(`Invalid env line "${line}". Use KEY=value.`);
    }
    env[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
  }
  return env;
}

function toMcpConfig(draft: McpServerDraft): McpServerConfig {
  return {
    name: draft.name.trim(),
    transport: draft.transport,
    ...(draft.transport === 'stdio' ? { command: draft.command.trim() } : {}),
    ...(draft.transport !== 'stdio' ? { url: draft.url.trim() } : {}),
    ...(draft.argsText.trim()
      ? {
          args: draft.argsText
            .split('\n')
            .map((entry) => entry.trim())
            .filter(Boolean),
        }
      : {}),
    ...(draft.envText.trim() ? { env: parseEnv(draft.envText) } : {}),
  };
}

async function buildMcpServerResponse() {
  const client = createClient();
  const storage = await loadSettingsSectionStorage();
  return {
    agents: client.adapters.list().map((adapter) => ({
      agent: adapter.agent,
      displayName: adapter.displayName,
      servers: (storage.mcpServers[adapter.agent] ?? []).map(toMcpDraft),
    })),
  };
}

function readLifecycleAction(value: unknown): Exclude<AutomationRuleAction, 'delete'> {
  if (value === 'enable' || value === 'pause' || value === 'resume' || value === 'disable') {
    return value;
  }
  throw new AppError('action must be enable, pause, resume, or disable.', 'BAD_REQUEST', 400);
}

export function registerKanbanRoutes(app: Hono): void {
  app.get('/api/backlog', async () => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(await backlogService.getOverview());
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/backlog', async (context) => {
    try {
      await ensureInitialized();
      const body = await context.req.json<Record<string, unknown>>();

      let overview;
      switch (body.action) {
        case 'move-issue':
          if (typeof body.issueId !== 'string' || !isWorkflowState(body.toState)) {
            throw new AppError('issueId and toState are required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.moveIssue({ issueId: body.issueId, toState: body.toState });
          break;
        case 'link-repository':
          if (
            typeof body.issueId !== 'string' ||
            typeof body.owner !== 'string' ||
            typeof body.name !== 'string' ||
            typeof body.branchName !== 'string'
          ) {
            throw new AppError('issueId, owner, name, and branchName are required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.linkRepository({
            issueId: body.issueId,
            owner: body.owner,
            name: body.name,
            branchName: body.branchName,
            defaultBranch: typeof body.defaultBranch === 'string' ? body.defaultBranch : undefined,
            provider:
              body.provider === 'azure-repos' ||
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
          overview = await backlogService.updateRepositorySettings({
            issueId: body.issueId,
            settings: {
              baseBranch: typeof body.baseBranch === 'string' ? body.baseBranch : undefined,
              ciProvider: typeof body.ciProvider === 'string' ? body.ciProvider : undefined,
              publishTarget: typeof body.publishTarget === 'string' ? body.publishTarget : undefined,
              autoMerge: typeof body.autoMerge === 'boolean' ? body.autoMerge : undefined,
              requiredApprovals: typeof body.requiredApprovals === 'number' ? body.requiredApprovals : undefined,
            },
          });
          break;
        case 'create-pull-request':
          if (typeof body.issueId !== 'string' || typeof body.title !== 'string') {
            throw new AppError('issueId and title are required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.createPullRequest({
            issueId: body.issueId,
            title: body.title,
            reviewers: typeof body.reviewers === 'string' ? body.reviewers : undefined,
          });
          break;
        case 'create-issue': {
          if (typeof body.projectId !== 'string' || typeof body.title !== 'string') {
            throw new AppError('projectId and title are required.', 'BAD_REQUEST', 400);
          }
          const created = await backlogService.createIssue({
            projectId: body.projectId,
            title: body.title,
            summary: typeof body.summary === 'string' ? body.summary : undefined,
            description: typeof body.description === 'string' ? body.description : undefined,
            status:
              body.status === 'backlog' ||
              body.status === 'ready' ||
              body.status === 'in-progress' ||
              body.status === 'blocked' ||
              body.status === 'review' ||
              body.status === 'done'
                ? body.status
                : undefined,
            priority:
              body.priority === 'critical' ||
              body.priority === 'high' ||
              body.priority === 'medium' ||
              body.priority === 'low'
                ? body.priority
                : undefined,
            labelIds:
              Array.isArray(body.labelIds) && body.labelIds.every((id) => typeof id === 'string')
                ? (body.labelIds as string[])
                : undefined,
            assigneeIds:
              Array.isArray(body.assigneeIds) && body.assigneeIds.every((id) => typeof id === 'string')
                ? (body.assigneeIds as string[])
                : undefined,
            dependencies:
              Array.isArray(body.dependencies)
                ? body.dependencies
                    .map((dependency) => {
                      if (!dependency || typeof dependency !== 'object') return null;
                      const entry = dependency as Record<string, unknown>;
                      if (typeof entry.issueId !== 'string') return null;
                      return {
                        issueId: entry.issueId,
                        type:
                          entry.type === 'blocks' || entry.type === 'related' || entry.type === 'blocked-by'
                            ? entry.type
                            : undefined,
                      };
                    })
                    .filter(Boolean) as { issueId: string; type?: 'blocks' | 'blocked-by' | 'related' }[]
                : undefined,
            acceptanceCriteria:
              Array.isArray(body.acceptanceCriteria)
                ? body.acceptanceCriteria
                    .map((criterion) => {
                      if (!criterion || typeof criterion !== 'object') return null;
                      const entry = criterion as Record<string, unknown>;
                      if (typeof entry.title !== 'string') return null;
                      return {
                        id: typeof entry.id === 'string' ? entry.id : undefined,
                        title: entry.title,
                        satisfied: typeof entry.satisfied === 'boolean' ? entry.satisfied : undefined,
                        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
                      };
                    })
                    .filter(Boolean) as {
                    id?: string;
                    title: string;
                    satisfied?: boolean;
                    notes?: string;
                  }[]
                : undefined,
            metadata:
              body.metadata && typeof body.metadata === 'object'
                ? (body.metadata as Record<string, unknown>)
                : undefined,
          });
          return jsonWithHeaders(created);
        }
        case 'update-project-collaboration':
          if (typeof body.projectId !== 'string') {
            throw new AppError('projectId is required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.updateProjectCollaboration({
            projectId: body.projectId,
            teamName: typeof body.teamName === 'string' ? body.teamName : undefined,
            visibility: isVisibility(body.visibility) ? body.visibility : undefined,
            defaultRole: isCollaboratorRole(body.defaultRole) ? body.defaultRole : undefined,
            allowSelfAssign: typeof body.allowSelfAssign === 'boolean' ? body.allowSelfAssign : undefined,
            reviewRequiredForDone:
              typeof body.reviewRequiredForDone === 'boolean' ? body.reviewRequiredForDone : undefined,
            activityScope: isActivityScope(body.activityScope) ? body.activityScope : undefined,
            workspaceProvisioning: isWorkspaceProvisioning(body.workspaceProvisioning)
              ? body.workspaceProvisioning
              : undefined,
            members: Array.isArray(body.members)
              ? body.members
                  .map((member) => {
                    if (!member || typeof member !== 'object') return null;
                    const entry = member as Record<string, unknown>;
                    if (typeof entry.id !== 'string' || typeof entry.displayName !== 'string') return null;
                    return {
                      id: entry.id,
                      displayName: entry.displayName,
                      email: typeof entry.email === 'string' ? entry.email : undefined,
                      avatarUrl: typeof entry.avatarUrl === 'string' ? entry.avatarUrl : undefined,
                      role: isCollaboratorRole(entry.role) ? entry.role : undefined,
                    };
                  })
                  .filter(Boolean) as Parameters<BacklogQueryService['updateProjectCollaboration']>[0]['members']
              : undefined,
            permissions: Array.isArray(body.permissions)
              ? body.permissions
                  .map((permission) => {
                    if (!permission || typeof permission !== 'object') return null;
                    const entry = permission as Record<string, unknown>;
                    if (typeof entry.action !== 'string' || !Array.isArray(entry.roles)) return null;
                    return {
                      action: entry.action,
                      roles: entry.roles.filter((role): role is 'owner' | 'maintainer' | 'contributor' | 'viewer' =>
                        isCollaboratorRole(role),
                      ),
                      description: typeof entry.description === 'string' ? entry.description : undefined,
                    };
                  })
                  .filter(Boolean) as Parameters<BacklogQueryService['updateProjectCollaboration']>[0]['permissions']
              : undefined,
          });
          break;
        case 'update-issue-detail':
          if (typeof body.issueId !== 'string') {
            throw new AppError('issueId is required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.updateIssueDetail({
            issueId: body.issueId,
            expectedUpdatedAt: typeof body.expectedUpdatedAt === 'string' ? body.expectedUpdatedAt : undefined,
            title: typeof body.title === 'string' ? body.title : undefined,
            summary: typeof body.summary === 'string' ? body.summary : undefined,
            description: typeof body.description === 'string' ? body.description : undefined,
            status:
              body.status === 'backlog' ||
              body.status === 'ready' ||
              body.status === 'in-progress' ||
              body.status === 'blocked' ||
              body.status === 'review' ||
              body.status === 'done'
                ? body.status
                : undefined,
            priority:
              body.priority === 'critical' ||
              body.priority === 'high' ||
              body.priority === 'medium' ||
              body.priority === 'low'
                ? body.priority
                : undefined,
            assigneeIds:
              Array.isArray(body.assigneeIds) && body.assigneeIds.every((id) => typeof id === 'string')
                ? (body.assigneeIds as string[])
                : undefined,
            labelIds:
              Array.isArray(body.labelIds) && body.labelIds.every((id) => typeof id === 'string')
                ? (body.labelIds as string[])
                : undefined,
            dependencies:
              Array.isArray(body.dependencies)
                ? body.dependencies
                    .map((dependency) => {
                      if (!dependency || typeof dependency !== 'object') return null;
                      const entry = dependency as Record<string, unknown>;
                      if (typeof entry.issueId !== 'string') return null;
                      return {
                        issueId: entry.issueId,
                        type:
                          entry.type === 'blocks' || entry.type === 'related' || entry.type === 'blocked-by'
                            ? entry.type
                            : undefined,
                      };
                    })
                    .filter(Boolean) as { issueId: string; type?: 'blocks' | 'blocked-by' | 'related' }[]
                : undefined,
            acceptanceCriteria:
              Array.isArray(body.acceptanceCriteria)
                ? body.acceptanceCriteria
                    .map((criterion) => {
                      if (!criterion || typeof criterion !== 'object') return null;
                      const entry = criterion as Record<string, unknown>;
                      if (typeof entry.title !== 'string') return null;
                      return {
                        id: typeof entry.id === 'string' ? entry.id : undefined,
                        title: entry.title,
                        satisfied: typeof entry.satisfied === 'boolean' ? entry.satisfied : undefined,
                        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
                      };
                    })
                    .filter(Boolean) as {
                    id?: string;
                    title: string;
                    satisfied?: boolean;
                    notes?: string;
                  }[]
                : undefined,
          });
          break;
        case 'update-issue-dispatch-context-labels':
          if (
            typeof body.issueId !== 'string' ||
            !Array.isArray(body.dispatchContextLabelIds) ||
            !body.dispatchContextLabelIds.every((labelId) => typeof labelId === 'string')
          ) {
            throw new AppError('issueId and dispatchContextLabelIds are required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.updateIssueDispatchContextLabels({
            issueId: body.issueId,
            dispatchContextLabelIds: body.dispatchContextLabelIds as string[],
          });
          break;
        case 'create-sub-issue': {
          if (typeof body.parentIssueId !== 'string' || typeof body.title !== 'string') {
            throw new AppError('parentIssueId and title are required.', 'BAD_REQUEST', 400);
          }
          overview = (
            await backlogService.createIssue({
              parentIssueId: body.parentIssueId,
              title: body.title,
              summary: typeof body.summary === 'string' ? body.summary : undefined,
              priority:
                body.priority === 'critical' ||
                body.priority === 'high' ||
                body.priority === 'medium' ||
                body.priority === 'low'
                  ? body.priority
                  : undefined,
              status:
                body.status === 'backlog' ||
                body.status === 'ready' ||
                body.status === 'in-progress' ||
                body.status === 'blocked' ||
                body.status === 'review' ||
                body.status === 'done'
                  ? body.status
                  : undefined,
            })
          ).overview;
          break;
        }
        case 'link-child-issue':
          if (typeof body.parentIssueId !== 'string' || typeof body.childIssueId !== 'string') {
            throw new AppError('parentIssueId and childIssueId are required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.linkChildIssue({
            parentIssueId: body.parentIssueId,
            childIssueId: body.childIssueId,
          });
          break;
        case 'create-issue-workspace': {
          if (typeof body.issueId !== 'string') {
            throw new AppError('issueId is required.', 'BAD_REQUEST', 400);
          }
          const current = await backlogService.getOverview();
          const issue = current.snapshot.issues.find((candidate) => candidate.id === body.issueId);
          if (!issue) {
            throw new AppError(`Issue ${body.issueId} not found.`, 'NOT_FOUND', 404);
          }
          const provisioned = await workspaceService.provisionWorkspaceForIssue({
            issueKey: issue.key,
            issueTitle: issue.title,
          });
          overview = await backlogService.linkIssueWorkspace({
            issueId: issue.id,
            workspacePath: provisioned.workspacePath,
            workspaceName: provisioned.workspaceName,
            branchName: provisioned.branchName,
            source: 'created-from-issue',
          });
          break;
        }
        case 'link-issue-workspace': {
          if (typeof body.issueId !== 'string' || typeof body.workspacePath !== 'string') {
            throw new AppError('issueId and workspacePath are required.', 'BAD_REQUEST', 400);
          }
          const inventory = await workspaceService.listWorkspaces();
          const workspace = inventory.workspaces.find((candidate) => candidate.path === body.workspacePath);
          if (!workspace) {
            throw new AppError(`Workspace ${body.workspacePath} not found.`, 'NOT_FOUND', 404);
          }
          if (workspace.missing) {
            throw new AppError(
              `Workspace ${body.workspacePath} is missing. Recover it before linking.`,
              'BAD_REQUEST',
              409,
            );
          }
          overview = await backlogService.linkIssueWorkspace({
            issueId: body.issueId,
            workspacePath: body.workspacePath,
            workspaceName: workspace.name,
            branchName: workspace.git.branch ?? undefined,
            source: 'linked-existing-workspace',
          });
          break;
        }
        case 'link-issue-session': {
          if (typeof body.issueId !== 'string') {
            throw new AppError('issueId is required.', 'BAD_REQUEST', 400);
          }
          overview = await backlogService.linkIssueSession({
            issueId: body.issueId,
            sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
            runId: typeof body.runId === 'string' ? body.runId : undefined,
          });
          break;
        }
        default:
          throw new AppError('Unsupported backlog action.', 'BAD_REQUEST', 400);
      }

      return jsonWithHeaders(overview);
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/task-tags', async () => {
    try {
      await ensureInitialized();
      return jsonWithHeaders({ taskTags: await taskTagService.listTaskTags() });
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/task-tags', async (context) => {
    try {
      await ensureInitialized();
      const body = await context.req.json<Record<string, unknown>>();
      return jsonWithHeaders(
        await taskTagService.createTaskTag({
          key: body.key as string,
          label: body.label as string,
          content: body.content as string,
          description: body.description as string | undefined,
          order: body.order as number | undefined,
        }),
        201,
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.patch('/api/task-tags/:taskTagId', async (context) => {
    try {
      await ensureInitialized();
      const body = await context.req.json<Record<string, unknown>>();
      return jsonWithHeaders(
        await taskTagService.updateTaskTag(context.req.param('taskTagId'), {
          key: typeof body.key === 'string' ? body.key : undefined,
          label: typeof body.label === 'string' ? body.label : undefined,
          content: typeof body.content === 'string' ? body.content : undefined,
          description: typeof body.description === 'string' ? body.description : undefined,
          order: typeof body.order === 'number' ? body.order : undefined,
        }),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.delete('/api/task-tags/:taskTagId', async (context) => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(await taskTagService.deleteTaskTag(context.req.param('taskTagId')));
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/dispatch-context-labels', async () => {
    try {
      await ensureInitialized();
      return jsonWithHeaders({
        dispatchContextLabels: await dispatchContextLabelService.listDispatchContextLabels(),
      });
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/dispatch-context-labels', async (context) => {
    try {
      await ensureInitialized();
      const body = await context.req.json<Record<string, unknown>>();
      return jsonWithHeaders(
        await dispatchContextLabelService.createDispatchContextLabel({
          key: body.key as string,
          label: body.label as string,
          instruction: body.instruction as string,
          description: body.description as string | undefined,
          order: body.order as number | undefined,
        }),
        201,
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.patch('/api/dispatch-context-labels/:dispatchContextLabelId', async (context) => {
    try {
      await ensureInitialized();
      const body = await context.req.json<Record<string, unknown>>();
      return jsonWithHeaders(
        await dispatchContextLabelService.updateDispatchContextLabel(context.req.param('dispatchContextLabelId'), {
          key: typeof body.key === 'string' ? body.key : undefined,
          label: typeof body.label === 'string' ? body.label : undefined,
          instruction: typeof body.instruction === 'string' ? body.instruction : undefined,
          description: typeof body.description === 'string' ? body.description : undefined,
          order: typeof body.order === 'number' ? body.order : undefined,
        }),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.delete('/api/dispatch-context-labels/:dispatchContextLabelId', async (context) => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(
        await dispatchContextLabelService.deleteDispatchContextLabel(context.req.param('dispatchContextLabelId')),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/reviews', async (context) => {
    try {
      const url = new URL(context.req.url);
      const targetType = url.searchParams.get('targetType');
      const targetId = url.searchParams.get('targetId');
      return jsonWithHeaders(
        await reviewService.listReviews({
          targetType: targetType === 'issue' || targetType === 'workspace' ? targetType : undefined,
          targetId: targetId?.trim() || undefined,
        }),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/reviews', async (context) => {
    try {
      const body = await context.req.json<ReviewActionInput>();
      return jsonWithHeaders(await reviewService.applyAction(body));
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/automations', async (context) => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(await automationRuleService.listRules(parseAutomationQuery(new URL(context.req.url))));
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/automations', async (context) => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(await automationRuleService.createRule(await context.req.json<Record<string, unknown>>()), 201);
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/automations/:ruleId', async (context) => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(await automationRuleService.getRule(context.req.param('ruleId')));
    } catch (error) {
      return jsonError(error);
    }
  });

  app.patch('/api/automations/:ruleId', async (context) => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(
        await automationRuleService.updateRule(context.req.param('ruleId'), await context.req.json<Record<string, unknown>>()),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.delete('/api/automations/:ruleId', async (context) => {
    try {
      await ensureInitialized();
      return jsonWithHeaders(await automationRuleService.deleteRule(context.req.param('ruleId')));
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/automations/:ruleId/lifecycle', async (context) => {
    try {
      await ensureInitialized();
      const body = await context.req.json<Record<string, unknown>>();
      return jsonWithHeaders(
        await automationRuleService.transitionRule(
          context.req.param('ruleId'),
          readLifecycleAction(body.action),
          typeof body.updatedBy === 'string' ? body.updatedBy : undefined,
        ),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/automations/webhooks/:ruleId', async (context) => {
    try {
      await ensureInitialized();
      const payload = await automationWebhookService.deliver({
        ruleId: context.req.param('ruleId'),
        requestPath: new URL(context.req.url).pathname,
        requestMethod: context.req.method,
        headers: context.req.raw.headers,
        rawBody: await context.req.text(),
      });

      const status =
        payload.outcome === 'created'
          ? 201
          : payload.code === 'AUTOMATION_WEBHOOK_UNAUTHORIZED'
            ? 401
            : payload.code === 'AUTOMATION_RULE_NOT_ACTIVE'
              ? 409
              : payload.outcome === 'rejected'
                ? 400
                : 200;

      return jsonWithHeaders(payload, status);
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/settings/agent-configuration', async () => {
    try {
      return jsonWithHeaders(await buildAgentConfigurationResponse());
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/settings/agent-configuration', async (context) => {
    try {
      const body = await context.req.json<Record<string, unknown>>();
      const client = createClient();
      if (typeof body.agent !== 'string' || !body.agent.trim()) {
        return Response.json({ error: 'agent is required' }, { status: 400 });
      }

      const approvalMode =
        body.approvalMode === 'yolo' || body.approvalMode === 'deny' ? body.approvalMode : 'prompt';
      const model = typeof body.model === 'string' ? body.model.trim() : '';
      const provider = typeof body.provider === 'string' ? body.provider.trim() : '';
      const maxTokensRaw = typeof body.maxTokens === 'string' ? body.maxTokens.trim() : '';

      try {
        validateProfileData({
          approvalMode,
          ...(maxTokensRaw ? { maxTokens: Number.parseInt(maxTokensRaw, 10) } : {}),
        });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Invalid configuration.' },
          { status: 400 },
        );
      }

      if (model) {
        const result = client.models.validate(body.agent as AgentName, model);
        if (!result.valid) {
          return Response.json(
            {
              error:
                result.suggestions && result.suggestions.length > 0
                  ? `${result.message}. Suggestions: ${result.suggestions.join(', ')}`
                  : result.message,
            },
            { status: 400 },
          );
        }
      }

      const storage = await loadSettingsSectionStorage();
      storage.agentConfiguration[body.agent] = {
        model: model || undefined,
        provider: provider || undefined,
        approvalMode,
        ...(maxTokensRaw ? { maxTokens: Number.parseInt(maxTokensRaw, 10) } : {}),
      };
      await writeSettingsSectionStorage(storage);

      return jsonWithHeaders(await buildAgentConfigurationResponse());
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/settings/mcp-servers', async () => {
    try {
      return jsonWithHeaders(await buildMcpServerResponse());
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/settings/mcp-servers', async (context) => {
    try {
      const client = createClient();
      const body = await context.req.json<Record<string, unknown>>();
      if (typeof body.agent !== 'string' || !body.agent.trim()) {
        return Response.json({ error: 'agent is required' }, { status: 400 });
      }
      if (!Array.isArray(body.servers)) {
        return Response.json({ error: 'servers must be an array' }, { status: 400 });
      }

      let servers: McpServerConfig[];
      try {
        servers = body.servers.map((server) => {
          const draft = server as McpServerDraft;
          return toMcpConfig({
            name: typeof draft.name === 'string' ? draft.name : '',
            transport:
              draft.transport === 'sse' || draft.transport === 'streamable-http'
                ? draft.transport
                : 'stdio',
            command: typeof draft.command === 'string' ? draft.command : '',
            url: typeof draft.url === 'string' ? draft.url : '',
            argsText: typeof draft.argsText === 'string' ? draft.argsText : '',
            envText: typeof draft.envText === 'string' ? draft.envText : '',
          });
        });
        validateProfileData({ mcpServers: servers });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Invalid MCP server configuration.' },
          { status: 400 },
        );
      }

      const storage = await loadSettingsSectionStorage();
      storage.mcpServers[body.agent] = servers;
      await writeSettingsSectionStorage(storage);
      return jsonWithHeaders(await buildMcpServerResponse());
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/workspaces', async (context) => {
    try {
      const reviews = await reviewService.listReviews({ targetType: 'workspace' });
      const focusWorkspacePath = context.req.query('workspace')?.trim() || undefined;
      return jsonWithHeaders(
        await workspaceService.listWorkspaces({
          focusWorkspacePath,
          reviewByWorkspacePath: buildReviewByWorkspacePath(reviews.artifacts),
          linkedIssuesByWorkspacePath: await buildLinkedIssuesByWorkspacePath(),
        }),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/workspaces', async (context) => {
    try {
      const body = await context.req.json<Record<string, unknown>>();
      const sessions = readSessions(body);
      const focusWorkspacePath =
        typeof body.focusWorkspacePath === 'string' && body.focusWorkspacePath.trim().length > 0
          ? body.focusWorkspacePath.trim()
          : undefined;
      const reviews = await reviewService.listReviews({ targetType: 'workspace' });
      const reviewByWorkspacePath = buildReviewByWorkspacePath(reviews.artifacts);
      const linkedIssuesByWorkspacePath = await buildLinkedIssuesByWorkspacePath();

      if (
        body.action === 'provision' ||
        body.action === 'pin' ||
        body.action === 'unpin' ||
        body.action === 'archive' ||
        body.action === 'cleanup' ||
        body.action === 'recover' ||
        body.action === 'notes-save' ||
        body.action === 'rebase-start' ||
        body.action === 'rebase-auto-resolve' ||
        body.action === 'rebase-open-in-editor' ||
        body.action === 'rebase-mark-resolved' ||
        body.action === 'rebase-abort'
      ) {
        if (body.action === 'provision') {
          const current = await backlogService.getOverview();
          const projectById = new Map(current.snapshot.projects.map((project) => [project.id, project] as const));
          const scope =
            body.scope === 'issue' || body.scope === 'project' || body.scope === 'host'
              ? body.scope
              : null;
          const workspaceName = typeof body.workspaceName === 'string' ? body.workspaceName.trim() : '';
          if (!scope || !workspaceName) {
            return Response.json(
              { error: 'scope and workspaceName are required', code: 'BAD_REQUEST' },
              { status: 400 },
            );
          }

          const projectId = typeof body.projectId === 'string' ? body.projectId : '';
          const project = projectById.get(projectId);
          if (!project) {
            return Response.json(
              { error: `Project ${projectId} not found`, code: 'NOT_FOUND' },
              { status: 404 },
            );
          }

          const selectedIntegration =
            typeof body.hostProvider === 'string'
              ? project.integrations.find((integration) => integration.provider === body.hostProvider)
              : undefined;

          let provisioned;
          if (scope === 'issue') {
            const issueId = typeof body.issueId === 'string' ? body.issueId : '';
            const issue = current.snapshot.issues.find((candidate) => candidate.id === issueId);
            if (!issue || issue.projectId !== project.id) {
              return Response.json(
                { error: `Issue ${issueId} not found in project ${project.id}`, code: 'NOT_FOUND' },
                { status: 404 },
              );
            }
            provisioned = await workspaceService.provisionWorkspaceForIssue({
              issueKey: workspaceName,
              issueTitle: issue.title,
              ownership: {
                source: 'created-from-issue',
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
              source: 'created-from-issue',
            });
          } else {
            provisioned = await workspaceService.provisionWorkspace({
              workspaceName,
              ownership: {
                source: scope === 'host' ? 'created-from-host' : 'created-from-project',
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

          return jsonWithHeaders({
            workspace: provisioned,
            ...(await workspaceService.listWorkspaces({
              focusWorkspacePath,
              sessions,
              reviewByWorkspacePath,
              linkedIssuesByWorkspacePath: await buildLinkedIssuesByWorkspacePath(),
            })),
          });
        }

        const workspacePath = typeof body.workspacePath === 'string' ? body.workspacePath : '';
        if (!workspacePath) {
          return Response.json({ error: 'workspacePath is required', code: 'BAD_REQUEST' }, { status: 400 });
        }

        const result = await workspaceService.applyAction({
          action: body.action,
          workspacePath,
          note: typeof body.note === 'string' ? body.note : undefined,
        });
        return jsonWithHeaders({
          result,
          ...(await workspaceService.listWorkspaces({
            focusWorkspacePath,
            sessions,
            reviewByWorkspacePath,
            linkedIssuesByWorkspacePath,
          })),
        });
      }

      return jsonWithHeaders(
        await workspaceService.listWorkspaces({
          focusWorkspacePath,
          sessions,
          reviewByWorkspacePath,
          linkedIssuesByWorkspacePath,
        }),
      );
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/digest', async () => {
    try {
      try {
        await ensureInitialized();
      } catch {
        return Response.json(
          { error: 'Server initialization failed. Check kanban configuration and watch sources.', code: 'INIT_FAILED' },
          { status: 500 },
        );
      }
      await discoverAndCacheAll();
      const runs = getAllCachedDigests();
      runs.sort((a, b) => {
        const cmp = (b.updatedAt || '').localeCompare(a.updatedAt || '');
        if (cmp !== 0) return cmp;
        return a.runId.localeCompare(b.runId);
      });
      return jsonWithHeaders({ runs });
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/runs', async (context) => {
    try {
      await ensureInitialized();
      const url = new URL(context.req.url);
      const mode = url.searchParams.get('mode');
      const project = url.searchParams.get('project');
      const limit = parseInt(url.searchParams.get('limit') || '0', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || '';
      const sort = (url.searchParams.get('sort') || 'status') as SortMode;

      if (mode === 'projects') {
        return jsonWithHeaders(await runQueryService.listProjects());
      }
      if (project) {
        return jsonWithHeaders(await runQueryService.listProjectRuns({ project, limit, offset, search, status, sort }));
      }
      return jsonWithHeaders(await runQueryService.listAllRuns({ limit, offset, search, status, sort }));
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/runs/:runId', async (context) => {
    try {
      await ensureInitialized();
      const runId = context.req.param('runId');
      if (!isValidId(runId)) {
        return Response.json({ error: 'Invalid run ID' }, { status: 400 });
      }

      const found = await findRunDir(runId);
      if (!found) {
        return Response.json({ error: 'Run not found' }, { status: 404 });
      }

      const run = await getRunCached(found.runDir, found.source, found.projectName);
      const maxEvents = parseInt(new URL(context.req.url).searchParams.get('maxEvents') || '50', 10);
      const totalEvents = run.events.length;
      const limitedRun = totalEvents > maxEvents
        ? { ...run, events: run.events.slice(-maxEvents), totalEvents }
        : { ...run, totalEvents };

      return jsonWithHeaders({ run: limitedRun }, 200, { 'Cache-Control': 'no-cache' });
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/runs/:runId/events', async (context) => {
    try {
      const runId = context.req.param('runId');
      if (!isValidId(runId)) {
        return Response.json({ error: 'Invalid run ID' }, { status: 400 });
      }
      const found = await findRunDir(runId);
      if (!found) {
        return Response.json({ error: 'Run not found' }, { status: 404 });
      }
      const journalPath = path.join(found.runDir, 'journal');
      const url = new URL(context.req.url);
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      if (Number.isNaN(limit) || Number.isNaN(offset) || limit < 0 || offset < 0) {
        return Response.json({ error: 'Invalid pagination parameters', code: 'INVALID_INPUT' }, { status: 400 });
      }
      const allEvents = await parseJournalDir(journalPath);
      return jsonWithHeaders({
        events: allEvents.slice(offset, offset + limit),
        total: allEvents.length,
      });
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/runs/:runId/tasks/:effectId', async (context) => {
    try {
      const runId = context.req.param('runId');
      const effectId = context.req.param('effectId');
      if (!isValidId(runId) || !isValidId(effectId)) {
        return Response.json({ error: 'Invalid ID' }, { status: 400 });
      }
      const found = await findRunDir(runId);
      if (!found) {
        return Response.json({ error: 'Run not found' }, { status: 404 });
      }

      const filePath = new URL(context.req.url).searchParams.get('file');
      if (filePath) {
        const content = await loadPreviewFile(found.runDir, filePath);
        if (content == null) {
          return Response.json({ error: 'File not found' }, { status: 404 });
        }
        return jsonWithHeaders({ content });
      }

      const task = await parseTaskDetail(found.runDir, effectId);
      if (!task) {
        return Response.json({ error: 'Task not found' }, { status: 404 });
      }
      return jsonWithHeaders({ task });
    } catch (error) {
      return jsonError(error);
    }
  });

  app.post('/api/runs/:runId/tasks/:effectId/approve', async (context) => {
    try {
      const runId = context.req.param('runId');
      const effectId = context.req.param('effectId');
      const body = await context.req.json().catch((e) => { process.stderr.write(`[gateway] response parse failed: ${e instanceof Error ? e.message : String(e)}\n`); return {}; });
      const answer = typeof (body as { answer?: unknown }).answer === 'string'
        ? (body as { answer: string }).answer
        : '';

      await approveBreakpointEffect(runId, effectId, answer);
      return jsonWithHeaders({ success: true });
    } catch (error) {
      return jsonError(error);
    }
  });

  app.get('/api/stream', async () => {
    try {
      await ensureInitialized();

      let cleanup: (() => void) | null = null;
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`),
          );

          const runChangedListener = (event: BatchedRunChangedEvent) => {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'update',
                  runIds: event.runIds,
                  runId: event.runIds[0],
                  timestamp: new Date().toISOString(),
                })}\n\n`,
              ),
            );
          };

          const newRunListener = (event: { runDir: string }) => {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'new-run',
                  runId: extractRunId(event.runDir),
                  runDir: event.runDir,
                  timestamp: new Date().toISOString(),
                })}\n\n`,
              ),
            );
          };

          const errorListener = (event: { error?: Error; runDir: string }) => {
            console.warn('Watcher error (suppressed from SSE):', event.error?.message ?? 'unknown', event.runDir);
          };

          serverEvents.on('run-changed', runChangedListener);
          serverEvents.on('new-run', newRunListener);
          serverEvents.on('watcher-error', errorListener);

          const pingInterval = setInterval(() => {
            controller.enqueue(encoder.encode(': ping\n\n'));
          }, 15_000);

          cleanup = () => {
            clearInterval(pingInterval);
            serverEvents.off('run-changed', runChangedListener);
            serverEvents.off('new-run', newRunListener);
            serverEvents.off('watcher-error', errorListener);
          };
        },
        cancel() {
          cleanup?.();
          cleanup = null;
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-store',
          Connection: 'keep-alive',
        },
      });
    } catch {
      return Response.json({ error: 'Failed to initialize stream' }, { status: 500 });
    }
  });
}
