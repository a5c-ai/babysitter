import path from "node:path";

import {
  buildKanbanBoardSnapshot,
  buildKanbanBacklogSnapshot,
  createKanbanIssuePullRequest,
  evaluateKanbanIssueMove,
  linkKanbanIssueRepository,
  upsertKanbanProjectRepository,
  updateKanbanProjectRepositorySettings,
  summarizeKanbanReviewArtifact,
  type KanbanActivityEntry,
  type KanbanBacklogSnapshot,
  type KanbanBacklogOverview,
  type KanbanBacklogSummary,
  type KanbanCollaborator,
  type KanbanCollaboratorRole,
  type KanbanIssueCreateResult,
  type KanbanDispatchContextLabelDefinition,
  type KanbanIssue,
  type KanbanIntegrationConnection,
  type KanbanIntegrationProvider,
  type KanbanIntegrationStatus,
  type KanbanPermissionGrant,
  type KanbanPullRequestLinkState,
  type KanbanProject,
  type KanbanProjectSettings,
  type KanbanRepositoryContext,
  type KanbanRepositoryIntegrationState,
  type KanbanRepositoryProvider,
  type KanbanRepositorySettings,
  type KanbanReviewSnapshot,
  type KanbanTeamSettings,
  type KanbanWorkflowState,
  type KanbanIssueWorkspaceLinkInput,
  type LinkedRunSummary,
} from '@a5c-ai/agent-mux-comm/kanban';

import { AppError } from '../error-handler.js';
import { ReviewService } from '../review-service.js';
import { RunQueryService } from './run-query-service.js';
import {
  KANBAN_BACKLOG_FILE_PATH,
  defaultKanbanStorageDeps,
  readKanbanStorageFile,
  writeKanbanStorageFile,
  type KanbanStorageDeps,
  type StoredKanbanIssue,
  type StoredKanbanProject,
} from './kanban-storage.js';

const SOURCE_PATH = 'packages/agent-mux/webui/src/kanban/gaps-and-debt.md';
const PROJECT_ID = 'kanban-app';

function normalizeDispatchContextLabelKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function normalizeDispatchContextLabels(
  labels: readonly BacklogSeedDispatchContextLabel[],
): BacklogSeedDispatchContextLabel[] {
  return labels
    .map((label) => {
      const normalizedLabel = label.label.trim();
      const normalizedKey = normalizeDispatchContextLabelKey(label.key ?? normalizedLabel);

      return {
        ...label,
        label: normalizedLabel,
        key: normalizedKey || normalizeDispatchContextLabelKey(label.id),
        instruction: label.instruction.replace(/\r\n?/g, '\n').trim(),
        description: label.description?.trim() || undefined,
        order:
          typeof label.order === 'number' && Number.isFinite(label.order)
            ? Math.max(0, Math.floor(label.order))
            : 0,
      };
    })
    .sort(
      (left, right) =>
        left.order - right.order ||
        left.label.localeCompare(right.label) ||
        left.key.localeCompare(right.key) ||
        left.id.localeCompare(right.id),
    );
}

function normalizeDispatchContextLabelRefs(
  refs: readonly { readonly labelId?: string }[],
): KanbanIssue['dispatch']['contextLabels'] {
  return Array.from(
    new Set(
      refs
        .map((ref) => ref.labelId?.trim() || '')
        .filter(Boolean),
    ),
  ).map((labelId) => ({ labelId }));
}

export type BacklogOverviewSummary = KanbanBacklogSummary;

export type BacklogOverview = KanbanBacklogOverview;

export interface CreateBacklogIssueInput {
  readonly projectId?: string;
  readonly parentIssueId?: string;
  readonly title: string;
  readonly summary?: string;
  readonly description?: string;
  readonly status?: KanbanIssue['status'];
  readonly priority?: KanbanIssue['priority'];
  readonly labelIds?: readonly string[];
  readonly assigneeIds?: readonly string[];
  readonly dependencies?: readonly {
    readonly issueId: string;
    readonly type?: KanbanIssue['dependencies'][number]['type'];
  }[];
  readonly acceptanceCriteria?: readonly {
    readonly id?: string;
    readonly title: string;
    readonly satisfied?: boolean;
    readonly notes?: string;
  }[];
  readonly decomposition?: readonly Pick<KanbanIssue['decomposition'][number], 'title' | 'kind' | 'status'>[];
  readonly source?: KanbanIssue['source'];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type CreateBacklogIssueResult = KanbanIssueCreateResult;

export interface UpdateIssueDetailInput {
  readonly issueId: string;
  readonly expectedUpdatedAt?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly status?: KanbanIssue['status'];
  readonly priority?: KanbanIssue['priority'];
  readonly assigneeIds?: readonly string[];
  readonly labelIds?: readonly string[];
  readonly dependencies?: readonly {
    readonly issueId: string;
    readonly type?: KanbanIssue['dependencies'][number]['type'];
  }[];
  readonly acceptanceCriteria?: readonly {
    readonly id?: string;
    readonly title: string;
    readonly satisfied?: boolean;
    readonly notes?: string;
  }[];
}

export type LinkIssueWorkspaceInput = KanbanIssueWorkspaceLinkInput;

export interface LinkIssueSessionInput {
  readonly issueId: string;
  readonly sessionId?: string;
  readonly runId?: string;
}

type BacklogSeedProject = StoredKanbanProject;
type BacklogSeedIssue = StoredKanbanIssue;
type BacklogSeedDispatchContextLabel = KanbanDispatchContextLabelDefinition;

const debtLabel = {
  id: 'label-debt',
  name: 'debt',
  description: 'Work tracked to close parity or structural debt.',
};

const defaultDispatchContextLabels: readonly BacklogSeedDispatchContextLabel[] = [
  {
    id: 'dispatch-context-label-tests-first',
    key: 'tests_first',
    label: 'Tests First',
    instruction: 'Write or update deterministic verification before implementation changes.',
    description: 'Keep delivery anchored to reproducible checks instead of post-hoc inspection.',
    order: 0,
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
  },
  {
    id: 'dispatch-context-label-preserve-release-contract',
    key: 'preserve_release_contract',
    label: 'Preserve Release Contract',
    instruction:
      'Do not regress published package assets, files[] entries, verify:release, or CI/release/staging publish compatibility.',
    description: 'Use for work that touches package surfaces or published artifacts.',
    order: 1,
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
  },
  {
    id: 'dispatch-context-label-ui-copy-review',
    key: 'ui_copy_review',
    label: 'UI Copy Review',
    instruction: 'Keep labels, prompts, and reviewer-facing text inspectable before and after dispatch.',
    description: 'Use when dispatch context needs to stay visible in UI and audit surfaces.',
    order: 2,
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
  },
];

const defaultCollaborators: readonly KanbanCollaborator[] = [
  {
    id: 'tal',
    displayName: 'Tal Muskal',
    email: 'tal@a5c.ai',
    role: 'owner',
  },
  {
    id: 'nora',
    displayName: 'Nora PM',
    email: 'nora@a5c.ai',
    role: 'maintainer',
  },
  {
    id: 'marc',
    displayName: 'Marc Design',
    email: 'marc@a5c.ai',
    role: 'contributor',
  },
  {
    id: 'ivy',
    displayName: 'Ivy QA',
    email: 'ivy@a5c.ai',
    role: 'viewer',
  },
] as const;

const defaultPermissionMatrix: readonly KanbanPermissionGrant[] = [
  {
    action: 'manage-project-settings',
    roles: ['owner', 'maintainer'],
    description: 'Only elevated roles can change project-wide policy and visibility.',
  },
  {
    action: 'manage-team-members',
    roles: ['owner', 'maintainer'],
    description: 'Roster and role changes stay with owners and maintainers.',
  },
  {
    action: 'edit-board',
    roles: ['owner', 'maintainer', 'contributor'],
    description: 'Contributors can shape board flow without full admin access.',
  },
  {
    action: 'assign-issues',
    roles: ['owner', 'maintainer', 'contributor'],
    description: 'Assignee and collaborator changes are shared team operations.',
  },
  {
    action: 'review-work',
    roles: ['owner', 'maintainer', 'contributor', 'viewer'],
    description: 'All collaborators can see and participate in shared review context.',
  },
  {
    action: 'manage-workspaces',
    roles: ['owner', 'maintainer'],
    description: 'Workspace lifecycle remains restricted beyond possession of a gateway token.',
  },
];

const defaultTeamSettings: KanbanTeamSettings = {
  visibility: 'team',
  defaultRole: 'contributor',
  allowSelfAssign: true,
};

const defaultProjectSettings: KanbanProjectSettings = {
  reviewRequiredForDone: true,
  activityScope: 'all-board-entities',
  workspaceProvisioning: 'owners-maintainers',
};

function integrationProviderLabel(provider: KanbanIntegrationProvider): string {
  return provider === 'azure-repos' ? 'Azure Repos' : 'GitHub';
}

function buildIntegrationConnection(
  provider: KanbanIntegrationProvider,
  input: {
    readonly status: KanbanIntegrationStatus;
    readonly accountLabel?: string;
    readonly connectedAt?: string;
    readonly guidance: string;
    readonly failureMessage?: string;
    readonly missingScopes?: readonly string[];
    readonly prerequisites: readonly {
      readonly key: string;
      readonly label: string;
      readonly satisfied: boolean;
      readonly guidance?: string;
    }[];
    readonly actions?: Partial<KanbanIntegrationConnection['actions']>;
  },
): KanbanIntegrationConnection {
  const blocked =
    input.status === 'disconnected' ||
    input.status === 'expired-auth' ||
    input.status === 'missing-scopes' ||
    input.status === 'failing';

  return {
    provider,
    label: integrationProviderLabel(provider),
    status: input.status,
    accountLabel: input.accountLabel,
    connectedAt: input.connectedAt,
    failureMessage: input.failureMessage,
    missingScopes: input.missingScopes,
    prerequisites: input.prerequisites,
    guidance: input.guidance,
    actions: {
      canCreatePullRequest: input.actions?.canCreatePullRequest ?? !blocked,
      canManagePullRequest: input.actions?.canManagePullRequest ?? !blocked,
      canApproveFromReview: input.actions?.canApproveFromReview ?? !blocked,
      reason: input.actions?.reason,
    },
  };
}

function buildRepositoryIntegrationState(
  provider: KanbanIntegrationProvider,
  input: {
    readonly status: KanbanIntegrationStatus;
    readonly linkState: KanbanPullRequestLinkState;
    readonly guidance: string;
    readonly failureMessage?: string;
    readonly missingScopes?: readonly string[];
    readonly prerequisites: KanbanIntegrationConnection['prerequisites'];
    readonly actions?: Partial<KanbanRepositoryIntegrationState['actions']>;
  },
): KanbanRepositoryIntegrationState {
  const blocked =
    input.status === 'disconnected' ||
    input.status === 'expired-auth' ||
    input.status === 'missing-scopes' ||
    input.status === 'failing';

  return {
    provider,
    status: input.status,
    linkState: input.linkState,
    failureMessage: input.failureMessage,
    guidance: input.guidance,
    missingScopes: input.missingScopes,
    prerequisites: input.prerequisites,
    actions: {
      canCreatePullRequest: input.actions?.canCreatePullRequest ?? !blocked,
      canManagePullRequest: input.actions?.canManagePullRequest ?? !blocked,
      canApproveFromReview: input.actions?.canApproveFromReview ?? !blocked,
      reason: input.actions?.reason,
    },
  };
}

const systemActor = {
  kind: 'system' as const,
  id: 'kanban-seed',
  displayName: 'Kanban seed data',
};

const defaultGithubIntegration = buildIntegrationConnection('github', {
  status: 'connected',
  accountLabel: 'a5c-ai',
  connectedAt: '2026-04-24T00:00:00.000Z',
  guidance: 'GitHub is ready for repository linking, linked PR state, and in-review approval flows.',
  prerequisites: [
    {
      key: 'github-auth',
      label: 'Signed in with a repository-capable GitHub account',
      satisfied: true,
    },
    {
      key: 'github-scopes',
      label: 'Granted repo, pull request, and checks scopes',
      satisfied: true,
    },
    {
      key: 'github-default-org',
      label: 'Selected a default GitHub org/repository context',
      satisfied: true,
    },
  ],
});

const defaultAzureReposIntegration = buildIntegrationConnection('azure-repos', {
  status: 'partial-setup',
  accountLabel: 'a5c-ai / Boards Platform',
  guidance:
    'Azure Repos is visible in the kanban setup surface, but repository/project binding still needs to be completed before linked PR actions can be enabled.',
  prerequisites: [
    {
      key: 'azure-auth',
      label: 'Connected an Azure DevOps organization',
      satisfied: true,
    },
    {
      key: 'azure-project',
      label: 'Selected a default Azure DevOps project',
      satisfied: false,
      guidance: 'Choose the Azure DevOps project that owns the repo before linking work items.',
    },
    {
      key: 'azure-scopes',
      label: 'Granted code read/write and pull request scopes',
      satisfied: false,
      guidance: 'Grant Code (Read & Write) plus pull request scopes for linked PR creation.',
    },
  ],
  actions: {
    canCreatePullRequest: false,
    canManagePullRequest: false,
    canApproveFromReview: false,
    reason: 'Azure Repos setup is incomplete.',
  },
});

function buildRepositoryId(
  provider: KanbanRepositoryProvider,
  owner: string,
  name: string,
): string {
  return `repo-${provider}-${owner}-${name}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

function buildRepositoryUrl(
  provider: KanbanRepositoryProvider,
  owner: string,
  name: string,
): string | undefined {
  const fullName = `${owner}/${name}`;
  switch (provider) {
    case 'github':
      return `https://github.com/${fullName}`;
    case 'azure-repos':
      return `https://dev.azure.com/${owner}/_git/${name}`;
    case 'gitlab':
      return `https://gitlab.com/${fullName}`;
    case 'bitbucket':
      return `https://bitbucket.org/${fullName}`;
    default:
      return undefined;
  }
}

function parseReviewerList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function parseRole(value: unknown): KanbanCollaboratorRole {
  switch (value) {
    case 'owner':
    case 'maintainer':
    case 'contributor':
    case 'viewer':
      return value;
    default:
      return 'contributor';
  }
}

function buildActivityEntry(
  id: string,
  entityType: KanbanActivityEntry['entityType'],
  entityId: string,
  action: string,
  summary: string,
  actor: KanbanActivityEntry['actor'],
  createdAt: string,
): KanbanActivityEntry {
  return {
    id,
    entityType,
    entityId,
    action,
    summary,
    actor,
    createdAt,
  };
}

function appendUniqueIssueId(issueIds: readonly string[], issueId: string): string[] {
  return issueIds.includes(issueId) ? [...issueIds] : [...issueIds, issueId];
}

function appendUniqueString(values: readonly string[] | undefined, value: string | undefined): string[] {
  const normalized = value?.trim() ?? '';
  const current = values ? [...values] : [];
  if (!normalized) {
    return current;
  }
  return current.includes(normalized) ? current : [...current, normalized];
}

function arrayEquals(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function issueDependencyEquals(
  left: readonly BacklogSeedIssue['dependencies'][number][],
  right: readonly BacklogSeedIssue['dependencies'][number][],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) =>
        value.issueId === right[index]?.issueId && value.type === right[index]?.type,
    )
  );
}

function acceptanceCriteriaEquals(
  left: readonly BacklogSeedIssue['acceptanceCriteria'][number][],
  right: readonly BacklogSeedIssue['acceptanceCriteria'][number][],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) =>
        value.id === right[index]?.id &&
        value.title === right[index]?.title &&
        value.satisfied === right[index]?.satisfied &&
        value.notes === right[index]?.notes,
    )
  );
}

function normalizeWorkspacePath(value: string): string {
  return path.resolve(value);
}

function wouldCreateParentChildCycle(
  issues: readonly BacklogSeedIssue[],
  parentIssueId: string,
  childIssueId: string,
): boolean {
  let currentIssueId: string | undefined = parentIssueId;

  while (currentIssueId) {
    if (currentIssueId === childIssueId) {
      return true;
    }

    currentIssueId = issues.find((candidate) => candidate.id === currentIssueId)?.parentIssueId;
  }

  return false;
}

function resolveCollaboratorsById(
  members: readonly KanbanCollaborator[],
  ids: readonly string[],
): KanbanCollaborator[] {
  const roster = new Map(members.map((member) => [member.id, member]));
  return ids
    .map((id) => roster.get(id))
    .filter((member): member is KanbanCollaborator => Boolean(member));
}

function normalizeStoredIssueDispatchContextLabelRefs(
  refs: readonly { readonly labelId?: string }[] | undefined,
  dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[],
): KanbanIssue['dispatch']['contextLabels'] {
  const knownLabelIds = new Set(dispatchContextLabels.map((label) => label.id));
  return normalizeDispatchContextLabelRefs(refs ?? []).filter((ref) =>
    knownLabelIds.has(ref.labelId),
  );
}

function sanitizeStoredIssue(
  issue: BacklogSeedIssue,
  dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[],
): BacklogSeedIssue {
  if (!issue.dispatch) {
    return issue;
  }

  return {
    ...issue,
    dispatch: {
      ...issue.dispatch,
      contextLabels: normalizeStoredIssueDispatchContextLabelRefs(
        issue.dispatch.contextLabels,
        dispatchContextLabels,
      ),
    },
  };
}

function resolveDispatchContextLabelRefs(
  dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[],
  dispatchContextLabelIds: readonly string[],
): KanbanIssue['dispatch']['contextLabels'] {
  const refs = normalizeDispatchContextLabelRefs(
    dispatchContextLabelIds.map((labelId) => ({ labelId })),
  );
  const definitionMap = new Map(dispatchContextLabels.map((label) => [label.id, label]));
  const missingLabelIds = refs
    .map((ref) => ref.labelId)
    .filter((labelId) => !definitionMap.has(labelId));

  if (missingLabelIds.length > 0) {
    throw new AppError(
      `Dispatch Context Label definitions not found: ${missingLabelIds.join(', ')}.`,
      'BAD_REQUEST',
      400,
    );
  }

  return refs;
}

function stripDerivedDispatchState(
  issue: BacklogSeedIssue,
  dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[],
): BacklogSeedIssue {
  if (!issue.dispatch) {
    return issue;
  }

  return {
    ...issue,
    dispatch: {
      readiness: issue.dispatch.readiness,
      blockedReasons: issue.dispatch.blockedReasons ?? [],
      runIds: issue.dispatch.runIds ?? [],
      sessionIds: issue.dispatch.sessionIds ?? [],
      contextLabels: normalizeStoredIssueDispatchContextLabelRefs(
        issue.dispatch.contextLabels,
        dispatchContextLabels,
      ),
      lastDispatchedAt: issue.dispatch.lastDispatchedAt,
    },
  };
}
function nextPullRequestNumber(issues: readonly BacklogSeedIssue[]): number {
  return (
    Math.max(
      0,
      ...issues.map((issue) => issue.repositoryLifecycle?.pullRequest?.number ?? 0),
    ) + 1
  );
}

function nextAutomationIssueKey(
  project: Pick<BacklogSeedProject, 'key'>,
  issues: readonly BacklogSeedIssue[],
): string {
  const prefix = `${project.key}-AUTO-`;
  const nextNumber =
    Math.max(
      0,
      ...issues.map((issue) => {
        if (!issue.key.startsWith(prefix)) {
          return 0;
        }

        const suffix = Number.parseInt(issue.key.slice(prefix.length), 10);
        return Number.isFinite(suffix) ? suffix : 0;
      }),
    ) + 1;

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

function readProjectLabels(
  project: BacklogSeedProject,
  labelIds: readonly string[],
): BacklogSeedIssue['labels'] {
  return labelIds.map((labelId) => {
    const label = project.labels.find((candidate) => candidate.id === labelId);
    if (!label) {
      throw new AppError(`Label ${labelId} not found on project ${project.id}.`, 'BAD_REQUEST', 400);
    }
    return label;
  });
}

function readProjectAssignees(
  project: BacklogSeedProject,
  assigneeIds: readonly string[],
): BacklogSeedIssue['assignees'] {
  return assigneeIds.map((assigneeId) => {
    const assignee = project.assignees.find((candidate) => candidate.id === assigneeId);
    if (!assignee) {
      throw new AppError(
        `Assignee ${assigneeId} not found on project ${project.id}.`,
        'BAD_REQUEST',
        400,
      );
    }
    return assignee;
  });
}

function normalizeDependencyType(
  type: KanbanIssue['dependencies'][number]['type'] | undefined,
): KanbanIssue['dependencies'][number]['type'] {
  if (type === 'blocks' || type === 'related') {
    return type;
  }
  return 'blocked-by';
}

function normalizeIssueDependencies(
  payload: { issues: readonly BacklogSeedIssue[] },
  issue: Pick<BacklogSeedIssue, 'id' | 'key' | 'projectId'>,
  dependencies: readonly {
    readonly issueId: string;
    readonly type?: KanbanIssue['dependencies'][number]['type'];
  }[],
): BacklogSeedIssue['dependencies'] {
  const seen = new Set<string>();

  return dependencies.map((dependency) => {
    const issueId = dependency.issueId.trim();
    const type = normalizeDependencyType(dependency.type);

    if (!issueId) {
      throw new AppError('Dependency issueId is required.', 'BAD_REQUEST', 400);
    }
    if (issueId === issue.id) {
      throw new AppError(`Issue ${issue.key} cannot depend on itself.`, 'BAD_REQUEST', 400);
    }

    const target = payload.issues.find((candidate) => candidate.id === issueId);
    if (!target) {
      throw new AppError(`Dependency issue ${issueId} not found.`, 'BAD_REQUEST', 400);
    }
    if (target.projectId !== issue.projectId) {
      throw new AppError(
        `Dependency issue ${issueId} must belong to project ${issue.projectId}.`,
        'BAD_REQUEST',
        400,
      );
    }

    const dedupeKey = `${type}:${issueId}`;
    if (seen.has(dedupeKey)) {
      return null;
    }
    seen.add(dedupeKey);

    return {
      issueId,
      type,
    };
  }).filter((dependency): dependency is BacklogSeedIssue['dependencies'][number] => Boolean(dependency));
}

function normalizeAcceptanceCriteria(
  issue: Pick<BacklogSeedIssue, 'key' | 'acceptanceCriteria'>,
  acceptanceCriteria: readonly {
    readonly id?: string;
    readonly title: string;
    readonly satisfied?: boolean;
    readonly notes?: string;
  }[],
): BacklogSeedIssue['acceptanceCriteria'] {
  const unavailableIds = new Set(issue.acceptanceCriteria.map((criterion) => criterion.id));
  const assignedIds = new Set<string>();
  let nextSequence = 1;

  function nextCriterionId(): string {
    while (unavailableIds.has(`${issue.key}-ac-${nextSequence}`) || assignedIds.has(`${issue.key}-ac-${nextSequence}`)) {
      nextSequence += 1;
    }
    const id = `${issue.key}-ac-${nextSequence}`;
    assignedIds.add(id);
    nextSequence += 1;
    return id;
  }

  return acceptanceCriteria.map((criterion) => {
    const title = criterion.title.trim();
    if (!title) {
      throw new AppError('Acceptance criterion title is required.', 'BAD_REQUEST', 400);
    }

    const explicitId = criterion.id?.trim();
    if (explicitId) {
      if (assignedIds.has(explicitId)) {
        throw new AppError(`Duplicate acceptance criterion id ${explicitId}.`, 'BAD_REQUEST', 400);
      }
      assignedIds.add(explicitId);
    }

    return {
      id: explicitId || nextCriterionId(),
      title,
      satisfied: Boolean(criterion.satisfied),
      notes: criterion.notes?.trim() || undefined,
    };
  });
}

const defaultProjects: readonly BacklogSeedProject[] = [
  {
    id: PROJECT_ID,
    key: 'KANBAN',
    name: 'Kanban App',
    description:
      'Board-, issue-, and workspace-first orchestration surface for Babysitter and agent-mux.',
    issueIds: [
      'KANBAN-DEBT-003',
      'KANBAN-GAP-001',
      'KANBAN-GAP-001-A',
      'KANBAN-GAP-001-B',
      'KANBAN-GAP-001-C',
      'KANBAN-GAP-001-D',
      'KANBAN-GAP-002',
      'KANBAN-GAP-003',
      'KANBAN-GAP-004',
      'KANBAN-GAP-005',
      'KANBAN-GAP-006',
      'KANBAN-GAP-007',
    ],
    labels: [debtLabel],
    assignees: defaultCollaborators,
    team: {
      id: 'team-kanban',
      name: 'Kanban Core',
      members: defaultCollaborators,
      settings: defaultTeamSettings,
    },
    settings: defaultProjectSettings,
    permissions: defaultPermissionMatrix,
    activity: [
      buildActivityEntry(
        'activity-project-seed',
        'project',
        PROJECT_ID,
        'seeded-project-model',
        'Initialized a shared team, project settings surface, and permission policy for the kanban app.',
        systemActor,
        '2026-04-24T00:00:00.000Z',
      ),
    ],
    statuses: [],
    integrations: [defaultGithubIntegration, defaultAzureReposIntegration],
    repositories: [
      {
        id: buildRepositoryId('github', 'a5c-ai', 'babysitter'),
        owner: 'a5c-ai',
        name: 'babysitter',
        fullName: 'a5c-ai/babysitter',
        provider: 'github',
        url: 'https://github.com/a5c-ai/babysitter',
        defaultBranch: 'main',
        linkedAt: '2026-04-24T00:00:00.000Z',
        settings: {
          baseBranch: 'main',
          autoMerge: false,
          requiredApprovals: 2,
          ciProvider: 'GitHub Actions',
          publishTarget: 'npm',
        },
      },
    ],
    linkedRunProjectName: 'kanban',
  },
];

const defaultIssues: readonly BacklogSeedIssue[] = [
  {
    id: 'KANBAN-DEBT-003',
    key: 'KANBAN-DEBT-003',
    projectId: PROJECT_ID,
    title: 'Align the kanban package contract to a board-, issue-, and workspace-first product model',
    summary:
      'Define the target product model explicitly and track the remaining work as board-product capabilities instead of treating the package as observability-first.',
    description:
      'The browser product shell now lives in `packages/agent-mux/webui`, with shared runtime and API ownership in the surrounding agent-mux packages. The unresolved work is deeper product capability, not cosmetic renaming.',
    status: 'review',
    priority: 'high',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [
      {
        id: 'KANBAN-DEBT-003-ac-1',
        title: 'Document the target product model for packages/agent-mux/webui.',
        satisfied: true,
      },
      {
        id: 'KANBAN-DEBT-003-ac-2',
        title: 'Track board, issue, and workspace concepts as first-class work rather than observer-dashboard follow-ons.',
        satisfied: true,
      },
      {
        id: 'KANBAN-DEBT-003-ac-3',
        title: 'Frame remaining gaps as missing board-product capabilities instead of a naming mismatch.',
        satisfied: true,
      },
    ],
    decomposition: [
      {
        id: 'KANBAN-DEBT-003-decomp-1',
        title: 'Define the target product model and package contract.',
        kind: 'coordination',
        status: 'done',
        issueId: 'KANBAN-GAP-001',
      },
      {
        id: 'KANBAN-DEBT-003-decomp-2',
        title: 'Keep deepening first-class board semantics.',
        kind: 'implementation',
        status: 'ready',
        issueId: 'KANBAN-GAP-002',
      },
      {
        id: 'KANBAN-DEBT-003-decomp-3',
        title: 'Keep deepening first-class workspace execution flows.',
        kind: 'implementation',
        status: 'ready',
        issueId: 'KANBAN-GAP-003',
      },
    ],
    childIssueIds: ['KANBAN-GAP-001', 'KANBAN-GAP-002', 'KANBAN-GAP-003'],
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-DEBT-003' },
  },
  {
    id: 'KANBAN-GAP-001',
    key: 'KANBAN-GAP-001',
    projectId: PROJECT_ID,
    title: 'Add a first-class issue and project model to the kanban app',
    summary:
      'Deepen the shared project and issue model so the board uses a real system of record instead of seeded backlog data.',
    description:
      'The app now has first-class issue and project primitives, but the model still needs to mature from seeded local data into a true shared system of record with richer authoring for priorities, labels, assignees, dependencies, and acceptance criteria.',
    status: 'in-progress',
    priority: 'high',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [
      {
        id: 'KANBAN-GAP-001-ac-1',
        title: 'Define first-class project and issue entities.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-001-ac-2',
        title: 'Support backlog metadata including priority, labels, assignees, and dependencies.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-001-ac-3',
        title: 'Support issue decomposition before dispatch.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-001-ac-4',
        title: 'Prefer shared agent-mux or service-layer primitives instead of kanban-only models.',
        satisfied: false,
      },
    ],
    decomposition: [
      {
        id: 'KANBAN-GAP-001-decomp-1',
        title: 'Define canonical project and issue entities.',
        kind: 'implementation',
        status: 'ready',
        issueId: 'KANBAN-GAP-001-A',
      },
      {
        id: 'KANBAN-GAP-001-decomp-2',
        title: 'Add backlog metadata fields and validation.',
        kind: 'implementation',
        status: 'ready',
        issueId: 'KANBAN-GAP-001-B',
      },
      {
        id: 'KANBAN-GAP-001-decomp-3',
        title: 'Gate dispatch on decomposition readiness.',
        kind: 'validation',
        status: 'ready',
        issueId: 'KANBAN-GAP-001-C',
      },
      {
        id: 'KANBAN-GAP-001-decomp-4',
        title: 'Land the model in a shared seam that kanban can consume.',
        kind: 'coordination',
        status: 'ready',
        issueId: 'KANBAN-GAP-001-D',
      },
    ],
    childIssueIds: [
      'KANBAN-GAP-001-A',
      'KANBAN-GAP-001-B',
      'KANBAN-GAP-001-C',
      'KANBAN-GAP-001-D',
    ],
    parentIssueId: 'KANBAN-DEBT-003',
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-001' },
  },
  {
    id: 'KANBAN-GAP-001-A',
    key: 'KANBAN-GAP-001-A',
    projectId: PROJECT_ID,
    title: 'Define canonical project and issue entities',
    status: 'ready',
    priority: 'high',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [],
    decomposition: [],
    childIssueIds: [],
    parentIssueId: 'KANBAN-GAP-001',
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH },
  },
  {
    id: 'KANBAN-GAP-001-B',
    key: 'KANBAN-GAP-001-B',
    projectId: PROJECT_ID,
    title: 'Support priority, labels, assignees, and dependencies',
    status: 'ready',
    priority: 'high',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [],
    decomposition: [],
    childIssueIds: [],
    parentIssueId: 'KANBAN-GAP-001',
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH },
  },
  {
    id: 'KANBAN-GAP-001-C',
    key: 'KANBAN-GAP-001-C',
    projectId: PROJECT_ID,
    title: 'Support issue decomposition before dispatch',
    status: 'ready',
    priority: 'high',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [],
    decomposition: [],
    childIssueIds: [],
    parentIssueId: 'KANBAN-GAP-001',
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH },
  },
  {
    id: 'KANBAN-GAP-001-D',
    key: 'KANBAN-GAP-001-D',
    projectId: PROJECT_ID,
    title: 'Prefer a shared agent-mux service seam for the model',
    status: 'ready',
    priority: 'high',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [],
    decomposition: [],
    childIssueIds: [],
    parentIssueId: 'KANBAN-GAP-001',
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH },
  },
  {
    id: 'KANBAN-GAP-002',
    key: 'KANBAN-GAP-002',
    projectId: PROJECT_ID,
    title: 'Add actual kanban board mechanics',
    summary:
      'Introduce board columns, issue movement semantics, and policies instead of a pure observability dashboard.',
    description:
      'The dashboard should become a real issue board with shared kanban primitives, workflow state transitions, WIP limits, swimlanes, and policy hooks instead of a UI-only observability model.',
    status: 'backlog',
    priority: 'medium',
    labels: [debtLabel],
    assignees: [],
    dependencies: [{ issueId: 'KANBAN-GAP-001', type: 'blocked-by' }],
    acceptanceCriteria: [
      {
        id: 'KANBAN-GAP-002-ac-1',
        title: 'Expose shared board columns and card movement semantics.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-002-ac-2',
        title: 'Support todo, in-progress, review, and done workflow transitions.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-002-ac-3',
        title: 'Show WIP limits, swimlanes, and policy hooks on the board.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-002-ac-4',
        title: 'Anchor board state in shared primitives instead of a local UI model.',
        satisfied: false,
      },
    ],
    decomposition: [
      {
        id: 'KANBAN-GAP-002-decomp-1',
        title: 'Add shared board primitives in agent-mux core.',
        kind: 'implementation',
        status: 'ready',
      },
      {
        id: 'KANBAN-GAP-002-decomp-2',
        title: 'Persist workflow moves through the backlog service.',
        kind: 'implementation',
        status: 'ready',
      },
      {
        id: 'KANBAN-GAP-002-decomp-3',
        title: 'Render the dashboard as a real board with policy feedback.',
        kind: 'validation',
        status: 'ready',
      },
    ],
    childIssueIds: [],
    parentIssueId: 'KANBAN-DEBT-003',
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-002' },
  },
  {
    id: 'KANBAN-GAP-003',
    key: 'KANBAN-GAP-003',
    projectId: PROJECT_ID,
    title: 'Add workspace lifecycle controls',
    status: 'backlog',
    priority: 'medium',
    labels: [debtLabel],
    assignees: [],
    dependencies: [{ issueId: 'KANBAN-GAP-001', type: 'blocked-by' }],
    acceptanceCriteria: [],
    decomposition: [],
    childIssueIds: [],
    parentIssueId: 'KANBAN-DEBT-003',
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-003' },
  },
  {
    id: 'KANBAN-GAP-004',
    key: 'KANBAN-GAP-004',
    projectId: PROJECT_ID,
    title: 'Expose review and diff workflow primitives',
    summary:
      'Add shared review artifacts, inline comments, approval state, and diff viewing for issues and workspaces.',
    description:
      'The kanban surface needs Vibe Kanban style review loops: work item and workspace diffs, inline comments mapped back to agent feedback, a review queue, and approval state carried through shared APIs.',
    status: 'review',
    priority: 'medium',
    labels: [debtLabel],
    assignees: [],
    dependencies: [{ issueId: 'KANBAN-GAP-001', type: 'blocked-by' }],
    acceptanceCriteria: [
      {
        id: 'KANBAN-GAP-004-ac-1',
        title: 'Add diff viewing for work items and workspaces.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-004-ac-2',
        title: 'Support inline review comments mapped back to agent feedback.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-004-ac-3',
        title: 'Add review queue and approval state for issues and workspaces.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-004-ac-4',
        title: 'Expose review artifacts and actions through shared APIs, then compose the UX in packages/agent-mux/webui.',
        satisfied: false,
      },
    ],
    decomposition: [
      {
        id: 'KANBAN-GAP-004-decomp-1',
        title: 'Extend shared review and diff types in agent-mux core.',
        kind: 'implementation',
        status: 'ready',
      },
      {
        id: 'KANBAN-GAP-004-decomp-2',
        title: 'Persist review artifacts and approval actions in a shared kanban service.',
        kind: 'implementation',
        status: 'ready',
      },
      {
        id: 'KANBAN-GAP-004-decomp-3',
        title: 'Compose the review queue and diff viewer in dashboard and workspace surfaces.',
        kind: 'validation',
        status: 'ready',
      },
    ],
    childIssueIds: [],
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    dispatch: {
      readiness: 'ready',
      blockedReasons: [],
      runIds: ['run-kanban-gap-004'],
      sessionIds: ['session-kanban-gap-004'],
      contextLabels: [
        { labelId: 'dispatch-context-label-tests-first' },
        { labelId: 'dispatch-context-label-preserve-release-contract' },
      ],
      lastDispatchedAt: '2026-04-24T00:00:00.000Z',
    },
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-004' },
  },
  {
    id: 'KANBAN-GAP-005',
    key: 'KANBAN-GAP-005',
    projectId: PROJECT_ID,
    title: 'Expose preview, terminal, and dev-server surfaces',
    status: 'backlog',
    priority: 'medium',
    labels: [debtLabel],
    assignees: [],
    dependencies: [{ issueId: 'KANBAN-GAP-001', type: 'blocked-by' }],
    acceptanceCriteria: [],
    decomposition: [],
    childIssueIds: [],
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-005' },
  },
  {
    id: 'KANBAN-GAP-006',
    key: 'KANBAN-GAP-006',
    projectId: PROJECT_ID,
    title: 'Add repository and PR lifecycle support',
    summary:
      'Expose repository context, PR creation, review linkage, CI gates, and publish readiness directly on issue cards.',
    status: 'review',
    priority: 'medium',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [
      {
        id: 'KANBAN-GAP-006-ac-1',
        title: 'Link work items to a shared repository context.',
        satisfied: true,
      },
      {
        id: 'KANBAN-GAP-006-ac-2',
        title: 'Create PRs with review linkage from the board surface.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-006-ac-3',
        title: 'Show merge status, CI gates, and publish status per work item.',
        satisfied: false,
      },
    ],
    decomposition: [
      {
        id: 'KANBAN-GAP-006-decomp-1',
        title: 'Add shared repo and PR state below packages/agent-mux/webui.',
        kind: 'implementation',
        status: 'done',
      },
      {
        id: 'KANBAN-GAP-006-decomp-2',
        title: 'Render repository context and PR actions in the board UI.',
        kind: 'implementation',
        status: 'ready',
      },
      {
        id: 'KANBAN-GAP-006-decomp-3',
        title: 'Surface CI, merge, and publish gates on the work item.',
        kind: 'validation',
        status: 'ready',
      },
    ],
    childIssueIds: [],
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    repositoryLifecycle: {
      repositoryId: buildRepositoryId('github', 'a5c-ai', 'babysitter'),
      branchName: 'feat/kanban-gap-006-pr-lifecycle',
      reviewStatus: 'pending',
      mergeStatus: 'blocked',
      publishStatus: 'not-ready',
      integration: buildRepositoryIntegrationState('github', {
        status: 'missing-scopes',
        linkState: 'partially-linked',
        guidance:
          'The PR is linked, but GitHub write scopes are missing for sync and approval actions. Reconnect GitHub with pull request and checks scopes.',
        missingScopes: ['pull_requests:write', 'checks:read'],
        prerequisites: [
          {
            key: 'github-auth',
            label: 'GitHub connection is present',
            satisfied: true,
          },
          {
            key: 'github-pr-scope',
            label: 'Pull request write scope is granted',
            satisfied: false,
            guidance: 'Reconnect GitHub and grant pull request write scope.',
          },
          {
            key: 'github-checks-scope',
            label: 'Checks scope is granted for CI linkage',
            satisfied: false,
            guidance: 'Grant checks scope so linked status checks can stay current.',
          },
        ],
        actions: {
          canCreatePullRequest: false,
          canManagePullRequest: false,
          canApproveFromReview: false,
          reason: 'GitHub scopes are incomplete for linked PR actions.',
        },
      }),
      ciGates: [
        {
          id: 'ci-lint',
          name: 'Lint',
          provider: 'GitHub Actions',
          required: true,
          status: 'passing',
          summary: 'Static checks are green.',
        },
        {
          id: 'ci-kanban-tests',
          name: 'Kanban tests',
          provider: 'GitHub Actions',
          required: true,
          status: 'pending',
          summary: 'Targeted vitest run is still in flight.',
        },
      ],
      pullRequest: {
        id: 'pr-612',
        number: 612,
        title: 'Add repository lifecycle UX to the kanban surface',
        status: 'in-review',
        branchName: 'feat/kanban-gap-006-pr-lifecycle',
        baseBranch: 'main',
        mergeStatus: 'blocked',
        linkState: 'partially-linked',
        reviewLinks: [
          {
            id: 'review-design',
            label: 'Design review',
            reviewer: 'Product design',
            status: 'approved',
          },
          {
            id: 'review-codeowners',
            label: 'Codeowners',
            reviewer: 'Kanban maintainers',
            status: 'pending',
          },
        ],
        url: 'https://github.com/a5c-ai/babysitter/pull/612',
        createdAt: '2026-04-24T00:00:00.000Z',
        updatedAt: '2026-04-24T00:00:00.000Z',
      },
    },
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-006' },
  },
  {
    id: 'KANBAN-GAP-007',
    key: 'KANBAN-GAP-007',
    projectId: PROJECT_ID,
    title: 'Add team and collaboration primitives',
    status: 'backlog',
    priority: 'medium',
    labels: [debtLabel],
    assignees: [defaultCollaborators[0], defaultCollaborators[1]],
    collaborators: [defaultCollaborators[0], defaultCollaborators[1], defaultCollaborators[2]],
    dependencies: [{ issueId: 'KANBAN-GAP-001', type: 'blocked-by' }],
    acceptanceCriteria: [
      {
        id: 'KANBAN-GAP-007-ac-1',
        title: 'Expose team and project settings as first-class shared surfaces.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-007-ac-2',
        title: 'Support collaborators and assignees on issue cards.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-007-ac-3',
        title: 'Persist shared activity feeds scoped to project and issue entities.',
        satisfied: false,
      },
      {
        id: 'KANBAN-GAP-007-ac-4',
        title: 'Define permission policy beyond gateway-token possession.',
        satisfied: false,
      },
    ],
    decomposition: [],
    childIssueIds: [],
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    activity: [
      buildActivityEntry(
        'activity-gap-007-seed',
        'issue',
        'KANBAN-GAP-007',
        'seeded-collaboration-gap',
        'Tracked the missing collaboration primitives for team settings, assignees, activity, and permissions.',
        systemActor,
        '2026-04-24T00:00:00.000Z',
      ),
    ],
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-007' },
  },
];

interface BacklogQueryServiceDeps extends KanbanStorageDeps {
  runQueryService: Pick<RunQueryService, 'listProjects'>;
  reviewService: Pick<ReviewService, 'listReviews'>;
  now: () => string;
}

const defaultDeps: BacklogQueryServiceDeps = {
  ...defaultKanbanStorageDeps,
  runQueryService: new RunQueryService(),
  reviewService: new ReviewService(),
  backlogFilePath: KANBAN_BACKLOG_FILE_PATH,
  now: () => new Date().toISOString(),
};

function buildSummary(snapshot: KanbanBacklogSnapshot): BacklogOverviewSummary {
  return snapshot.projects.reduce<BacklogOverviewSummary>(
    (summary, project) => ({
      projectCount: summary.projectCount + 1,
      issueCount: summary.issueCount + project.metrics.totalIssues,
      readyCount: summary.readyCount + project.metrics.readyIssues,
      blockedCount: summary.blockedCount + project.metrics.blockedIssues,
      dispatchedCount: summary.dispatchedCount + project.metrics.dispatchedIssues,
      completedCount: summary.completedCount + project.metrics.completedIssues,
      needsDecompositionCount:
        summary.needsDecompositionCount + project.metrics.needsDecompositionIssues,
      inProgressCount: summary.inProgressCount + project.metrics.inProgressIssues,
    }),
    {
      projectCount: 0,
      issueCount: 0,
      readyCount: 0,
      blockedCount: 0,
      dispatchedCount: 0,
      completedCount: 0,
      needsDecompositionCount: 0,
      inProgressCount: 0,
    },
  );
}

function attachRunSummaries(
  snapshot: KanbanBacklogSnapshot,
  runSummaries: readonly LinkedRunSummary[],
): KanbanBacklogSnapshot {
  const runSummaryByName = new Map(runSummaries.map((summary) => [summary.projectName, summary]));
  return {
    ...snapshot,
    projects: snapshot.projects.map((project) => ({
      ...project,
      linkedRunSummary: project.linkedRunProjectName
        ? runSummaryByName.get(project.linkedRunProjectName)
        : undefined,
    })),
  };
}

function attachReviewSummaries(
  snapshot: KanbanBacklogSnapshot,
  reviewSnapshot: KanbanReviewSnapshot,
): KanbanBacklogSnapshot {
  const reviewSummaryByIssueId = new Map(
    reviewSnapshot.artifacts
      .filter((artifact) => artifact.targetType === 'issue')
      .map((artifact) => [artifact.targetId, summarizeKanbanReviewArtifact(artifact)]),
  );

  return {
    ...snapshot,
    issues: snapshot.issues.map((issue) => ({
      ...issue,
      review: reviewSummaryByIssueId.get(issue.id),
    })),
  };
}

function buildHydratedOverview(input: {
  readonly generatedAt?: string;
  readonly projects: readonly BacklogSeedProject[];
  readonly issues: readonly BacklogSeedIssue[];
  readonly dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[];
  readonly runSummaries: readonly LinkedRunSummary[];
  readonly reviewSnapshot: KanbanReviewSnapshot;
}): BacklogOverview {
  const snapshot = buildKanbanBacklogSnapshot({
    generatedAt: input.generatedAt,
    projects: input.projects,
    issues: input.issues,
    dispatchContextLabels: input.dispatchContextLabels,
  });
  const hydratedSnapshot = attachReviewSummaries(
    attachRunSummaries(snapshot, input.runSummaries),
    input.reviewSnapshot,
  );
  return {
    snapshot: hydratedSnapshot,
    board: buildKanbanBoardSnapshot(hydratedSnapshot),
    summary: buildSummary(hydratedSnapshot),
  };
}

export class BacklogQueryService {
  private readonly deps: BacklogQueryServiceDeps;

  constructor(overrides: Partial<BacklogQueryServiceDeps> = {}) {
    this.deps = { ...defaultDeps, ...overrides };
  }

  private async readSeedPayload(): Promise<{
    projects: readonly BacklogSeedProject[];
    issues: readonly BacklogSeedIssue[];
    dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[];
  }> {
    const backlogFile = await readKanbanStorageFile(this.deps);
    const dispatchContextLabels =
      backlogFile?.dispatchContextLabels?.length
        ? normalizeDispatchContextLabels(backlogFile.dispatchContextLabels)
        : defaultDispatchContextLabels;

    return {
      projects: backlogFile?.projects?.length ? backlogFile.projects : defaultProjects,
      issues: (backlogFile?.issues?.length ? backlogFile.issues : defaultIssues).map((issue) =>
        sanitizeStoredIssue(issue, dispatchContextLabels),
      ),
      dispatchContextLabels,
    };
  }

  private async listRunSummaries(): Promise<LinkedRunSummary[]> {
    const runProjects = await this.deps.runQueryService.listProjects();
    return runProjects.projects.map((project) => ({
      projectName: project.projectName,
      totalRuns: project.totalRuns,
      activeRuns: project.activeRuns,
      completedRuns: project.completedRuns,
      failedRuns: project.failedRuns,
      staleRuns: project.staleRuns,
      latestUpdate: project.latestUpdate,
    }));
  }

  private async buildOverviewFromPayload(payload: {
    projects: readonly BacklogSeedProject[];
    issues: readonly BacklogSeedIssue[];
    dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[];
  }): Promise<BacklogOverview> {
    return buildHydratedOverview({
      projects: payload.projects,
      issues: payload.issues,
      dispatchContextLabels: payload.dispatchContextLabels,
      runSummaries: await this.listRunSummaries(),
      reviewSnapshot: await this.deps.reviewService.listReviews({ targetType: 'issue' }),
      generatedAt: this.deps.now(),
    });
  }

  private async persistPayload(payload: {
    projects: readonly BacklogSeedProject[];
    issues: readonly BacklogSeedIssue[];
    dispatchContextLabels: readonly BacklogSeedDispatchContextLabel[];
  }): Promise<BacklogOverview> {
    const existingPayload = (await readKanbanStorageFile(this.deps)) ?? {};
    const normalizedDispatchContextLabels = normalizeDispatchContextLabels(
      payload.dispatchContextLabels,
    );
    await writeKanbanStorageFile(this.deps, {
      ...existingPayload,
      projects: payload.projects,
      issues: payload.issues.map((issue) =>
        stripDerivedDispatchState(issue, normalizedDispatchContextLabels),
      ),
      dispatchContextLabels: normalizedDispatchContextLabels,
    });
    return this.buildOverviewFromPayload({
      ...payload,
      issues: payload.issues.map((issue) =>
        stripDerivedDispatchState(issue, normalizedDispatchContextLabels),
      ),
      dispatchContextLabels: normalizedDispatchContextLabels,
    });
  }

  private findIssue(payload: {
    issues: readonly BacklogSeedIssue[];
  }, issueId: string): BacklogSeedIssue {
    const issue = payload.issues.find((candidate) => candidate.id === issueId);
    if (!issue) {
      throw new AppError(`Issue ${issueId} not found.`, 'NOT_FOUND', 404);
    }
    return issue;
  }

  private findProject(payload: {
    projects: readonly BacklogSeedProject[];
  }, projectId: string): BacklogSeedProject {
    const project = payload.projects.find((candidate) => candidate.id === projectId);
    if (!project) {
      throw new AppError(`Project ${projectId} not found.`, 'NOT_FOUND', 404);
    }
    return project;
  }

  async getOverview(): Promise<BacklogOverview> {
    const { projects, issues, dispatchContextLabels } = await this.readSeedPayload();
    return this.buildOverviewFromPayload({ projects, issues, dispatchContextLabels });
  }

  async createIssue(input: CreateBacklogIssueInput): Promise<CreateBacklogIssueResult> {
    const payload = await this.readSeedPayload();
    const parentIssue = input.parentIssueId
      ? this.findIssue(payload, input.parentIssueId)
      : undefined;
    const projectId = input.projectId ?? parentIssue?.projectId;
    if (!projectId) {
      throw new AppError('projectId is required.', 'BAD_REQUEST', 400);
    }
    const project = this.findProject(payload, projectId);

    if (!input.title.trim()) {
      throw new AppError('title is required.', 'BAD_REQUEST', 400);
    }
    if (parentIssue && parentIssue.projectId !== project.id) {
      throw new AppError('Sub-issues must stay in the same project as the parent.', 'BAD_REQUEST', 400);
    }

    const key = nextAutomationIssueKey({ key: project.key }, payload.issues);
    const createdAt = this.deps.now();
    const dependencies = normalizeIssueDependencies(
      payload,
      {
        id: key,
        key,
        projectId: project.id,
      },
      input.dependencies ?? [],
    );
    const issue: BacklogSeedIssue = {
      id: key,
      key,
      projectId: project.id,
      title: input.title.trim(),
      summary: input.summary?.trim() || undefined,
      description: input.description?.trim() || undefined,
      status: input.status ?? 'backlog',
      priority: input.priority ?? 'medium',
      labels: readProjectLabels(project, input.labelIds ?? []),
      assignees: readProjectAssignees(project, input.assigneeIds ?? []),
      dependencies,
      acceptanceCriteria: normalizeAcceptanceCriteria(
        { key, acceptanceCriteria: [] },
        input.acceptanceCriteria ?? [],
      ),
      decomposition: (input.decomposition ?? []).map((item, index) => ({
        id: `${key}-decomp-${index + 1}`,
        title: item.title,
        kind: item.kind,
        status: item.status,
      })),
      childIssueIds: [],
      parentIssueId: parentIssue?.id,
      createdAt,
      updatedAt: createdAt,
      dispatch: {
        readiness: 'ready',
        blockedReasons: [],
        runIds: [],
        sessionIds: [],
        contextLabels: [],
      },
      source: input.source,
      metadata: input.metadata,
      activity: parentIssue
        ? [
            buildActivityEntry(
              `activity-created-sub-issue-${createdAt}`,
              'issue',
              key,
              'created-sub-issue',
              `Created sub-issue ${key} under ${parentIssue.key}.`,
              {
                kind: 'human',
                id: 'tal',
                displayName: 'Tal Muskal',
                role: 'owner',
              },
              createdAt,
            ),
          ]
        : [],
    };

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === project.id
        ? {
            ...candidate,
            issueIds: appendUniqueIssueId(candidate.issueIds, issue.id),
          }
        : candidate,
    );
    const nextIssues = [
      ...payload.issues.map((candidate) =>
        candidate.id === parentIssue?.id
          ? {
              ...candidate,
              childIssueIds: appendUniqueIssueId(candidate.childIssueIds, issue.id),
              updatedAt: createdAt,
              activity: [
                buildActivityEntry(
                  `activity-linked-child-${createdAt}`,
                  'issue',
                  candidate.id,
                  'linked-child-issue',
                  `Linked child issue ${issue.key}.`,
                  {
                    kind: 'human',
                    id: 'tal',
                    displayName: 'Tal Muskal',
                    role: 'owner',
                  },
                  createdAt,
                ),
                ...(candidate.activity ?? []),
              ],
            }
          : candidate,
      ),
      issue,
    ];
    const overview = await this.persistPayload({
      projects: nextProjects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
    const createdIssue = overview.snapshot.issues.find((candidate) => candidate.id === issue.id);
    if (!createdIssue) {
      throw new AppError(`Created issue ${issue.id} could not be reloaded.`, 'INTERNAL_ERROR', 500);
    }

    return {
      overview,
      issue: createdIssue,
    };
  }

  async moveIssue(input: {
    readonly issueId: string;
    readonly toState: KanbanWorkflowState;
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const overview = await this.buildOverviewFromPayload(payload);

    const issue = overview.snapshot.issues.find((candidate) => candidate.id === input.issueId);
    if (!issue) {
      throw new AppError(`Issue ${input.issueId} not found.`, 'NOT_FOUND', 404);
    }

    const project = overview.snapshot.projects.find((candidate) => candidate.id === issue.projectId);
    if (!project) {
      throw new AppError(`Project ${issue.projectId} not found.`, 'NOT_FOUND', 404);
    }

    const evaluation = evaluateKanbanIssueMove({
      project,
      issues: overview.snapshot.issues.filter((candidate) => candidate.projectId === project.id),
      issueId: issue.id,
      toState: input.toState,
    });

    if (!evaluation.allowed || !evaluation.nextStatus) {
      throw new AppError(
        evaluation.signals.map((signal) => signal.message).join(' '),
        'KANBAN_POLICY_VIOLATION',
        409,
      );
    }
    const nextStatus = evaluation.nextStatus;

    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === input.issueId
        ? {
            ...candidate,
            status: nextStatus,
            updatedAt: this.deps.now(),
          }
        : candidate,
    );

    return this.persistPayload({
      projects: payload.projects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async linkRepository(input: {
    readonly issueId: string;
    readonly owner: string;
    readonly name: string;
    readonly branchName: string;
    readonly defaultBranch?: string;
    readonly provider?: KanbanRepositoryProvider;
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const project = this.findProject(payload, issue.projectId);
    const provider = input.provider ?? 'github';
    const owner = input.owner.trim();
    const name = input.name.trim();

    if (!owner || !name || !input.branchName.trim()) {
      throw new AppError('owner, name, and branchName are required.', 'BAD_REQUEST', 400);
    }

    const integrationConnection =
      provider === 'github' || provider === 'azure-repos'
        ? project.integrations.find((candidate) => candidate.provider === provider)
        : undefined;
    const repositoryId = buildRepositoryId(provider, owner, name);
    const existingRepository = project.repositories.find((candidate) => candidate.id === repositoryId);
    const repository: KanbanRepositoryContext =
      existingRepository ?? {
        id: repositoryId,
        owner,
        name,
        fullName: `${owner}/${name}`,
        provider,
        url: buildRepositoryUrl(provider, owner, name),
        defaultBranch: input.defaultBranch?.trim() || 'main',
        linkedAt: this.deps.now(),
        settings: {
          baseBranch: input.defaultBranch?.trim() || 'main',
          autoMerge: false,
          requiredApprovals: 1,
          ciProvider: provider === 'github' ? 'GitHub Actions' : undefined,
          publishTarget: 'npm',
        },
      };

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === project.id ? upsertKanbanProjectRepository(candidate, repository) : candidate,
    );
    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === issue.id
        ? {
            ...linkKanbanIssueRepository(candidate, {
              repositoryId,
              branchName: input.branchName,
              integration:
                provider === 'github' || provider === 'azure-repos'
                  ? buildRepositoryIntegrationState(provider, {
                      status: integrationConnection?.status ?? 'disconnected',
                      linkState: 'unlinked',
                      guidance:
                        integrationConnection?.guidance ??
                        `${integrationProviderLabel(provider)} must be connected before linked PR actions are available.`,
                      failureMessage: integrationConnection?.failureMessage,
                      missingScopes: integrationConnection?.missingScopes,
                      prerequisites: integrationConnection?.prerequisites ?? [],
                      actions: integrationConnection?.actions,
                    })
                  : undefined,
            }),
            updatedAt: this.deps.now(),
          }
        : candidate,
    );

    return this.persistPayload({
      projects: nextProjects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async updateRepositorySettings(input: {
    readonly issueId: string;
    readonly settings: Partial<KanbanRepositorySettings>;
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const repositoryId = issue.repositoryLifecycle?.repositoryId;
    if (!repositoryId) {
      throw new AppError(`Issue ${input.issueId} is not linked to a repository.`, 'BAD_REQUEST', 400);
    }

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === issue.projectId
        ? updateKanbanProjectRepositorySettings(candidate, {
            repositoryId,
            settings: input.settings,
          })
        : candidate,
    );

    return this.persistPayload({
      projects: nextProjects,
      issues: payload.issues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async updateProjectCollaboration(input: {
    readonly projectId: string;
    readonly teamName?: string;
    readonly visibility?: KanbanTeamSettings['visibility'];
    readonly defaultRole?: KanbanCollaboratorRole;
    readonly allowSelfAssign?: boolean;
    readonly reviewRequiredForDone?: boolean;
    readonly activityScope?: KanbanProjectSettings['activityScope'];
    readonly workspaceProvisioning?: KanbanProjectSettings['workspaceProvisioning'];
    readonly members?: readonly {
      readonly id: string;
      readonly displayName: string;
      readonly email?: string;
      readonly role?: KanbanCollaboratorRole;
    }[];
    readonly permissions?: readonly KanbanPermissionGrant[];
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const project = this.findProject(payload, input.projectId);
    const updatedAt = this.deps.now();
    const nextMembers =
      input.members?.map((member) => ({
        id: member.id.trim(),
        displayName: member.displayName.trim(),
        email: member.email?.trim() || undefined,
        role: parseRole(member.role),
      })) ?? project.team?.members ?? defaultCollaborators;

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === input.projectId
        ? {
            ...candidate,
            assignees: nextMembers,
            team: {
              id: candidate.team?.id ?? `team-${candidate.id}`,
              name: input.teamName?.trim() || candidate.team?.name || `${candidate.name} Team`,
              members: nextMembers,
              settings: {
                visibility: input.visibility ?? candidate.team?.settings?.visibility ?? defaultTeamSettings.visibility,
                defaultRole: parseRole(input.defaultRole ?? candidate.team?.settings?.defaultRole),
                allowSelfAssign:
                  input.allowSelfAssign ??
                  candidate.team?.settings?.allowSelfAssign ??
                  defaultTeamSettings.allowSelfAssign,
              },
            },
            settings: {
              reviewRequiredForDone:
                input.reviewRequiredForDone ??
                candidate.settings?.reviewRequiredForDone ??
                defaultProjectSettings.reviewRequiredForDone,
              activityScope:
                input.activityScope ??
                candidate.settings?.activityScope ??
                defaultProjectSettings.activityScope,
              workspaceProvisioning:
                input.workspaceProvisioning ??
                candidate.settings?.workspaceProvisioning ??
                defaultProjectSettings.workspaceProvisioning,
            },
            permissions: input.permissions?.length ? input.permissions : candidate.permissions ?? defaultPermissionMatrix,
            activity: [
              buildActivityEntry(
                `activity-project-collab-${updatedAt}`,
                'project',
                candidate.id,
                'updated-project-collaboration',
                'Updated shared team settings, roster, and permission policy.',
                {
                  kind: 'human',
                  id: 'tal',
                  displayName: 'Tal Muskal',
                  role: 'owner',
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    return this.persistPayload({
      projects: nextProjects,
      issues: payload.issues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async updateIssueCollaboration(input: {
    readonly issueId: string;
    readonly assigneeIds: readonly string[];
    readonly collaboratorIds: readonly string[];
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const project = this.findProject(payload, issue.projectId);
    const members = project.team?.members ?? defaultCollaborators;
    const assignees = resolveCollaboratorsById(members, input.assigneeIds);
    const collaborators = resolveCollaboratorsById(members, input.collaboratorIds);
    const updatedAt = this.deps.now();

    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === input.issueId
        ? {
            ...candidate,
            assignees,
            collaborators,
            updatedAt,
            activity: [
              buildActivityEntry(
                `activity-issue-collab-${updatedAt}`,
                'issue',
                candidate.id,
                'updated-issue-collaboration',
                `Set ${assignees.length} assignees and ${collaborators.length} collaborators for ${candidate.key}.`,
                {
                  kind: 'human',
                  id: 'tal',
                  displayName: 'Tal Muskal',
                  role: 'owner',
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === project.id
        ? {
            ...candidate,
            activity: [
              buildActivityEntry(
                `activity-project-issue-collab-${updatedAt}`,
                'project',
                candidate.id,
                'updated-issue-collaboration',
                `Updated issue collaboration on ${issue.key}.`,
                {
                  kind: 'human',
                  id: 'tal',
                  displayName: 'Tal Muskal',
                  role: 'owner',
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    return this.persistPayload({
      projects: nextProjects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async updateIssueDispatchContextLabels(input: {
    readonly issueId: string;
    readonly dispatchContextLabelIds: readonly string[];
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const contextLabels = resolveDispatchContextLabelRefs(
      payload.dispatchContextLabels,
      input.dispatchContextLabelIds,
    );
    const updatedAt = this.deps.now();

    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === issue.id
        ? {
            ...candidate,
            dispatch: {
              ...candidate.dispatch,
              contextLabels,
            },
            updatedAt,
            activity: [
              buildActivityEntry(
                `activity-issue-dispatch-context-${updatedAt}`,
                'issue',
                candidate.id,
                'updated-issue-dispatch-context-labels',
                `Set ${contextLabels.length} dispatch context label attachment${contextLabels.length === 1 ? '' : 's'} on ${candidate.key}.`,
                {
                  kind: 'human',
                  id: 'tal',
                  displayName: 'Tal Muskal',
                  role: 'owner',
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    return this.persistPayload({
      projects: payload.projects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async updateIssueDetail(input: UpdateIssueDetailInput): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const project = this.findProject(payload, issue.projectId);
    const currentOverview = await this.buildOverviewFromPayload(payload);
    const currentProject = currentOverview.snapshot.projects.find(
      (candidate) => candidate.id === issue.projectId,
    );
    if (!currentProject) {
      throw new AppError(`Project ${issue.projectId} not found.`, 'NOT_FOUND', 404);
    }

    if (input.expectedUpdatedAt && issue.updatedAt !== input.expectedUpdatedAt) {
      throw new AppError(
        `Issue ${issue.key} changed since this draft was loaded. Reload the latest issue state before saving again.`,
        'STALE_WRITE',
        409,
      );
    }

    const nextTitle =
      input.title !== undefined ? input.title.trim() : issue.title;
    if (!nextTitle) {
      throw new AppError('Issue title is required.', 'BAD_REQUEST', 400);
    }
    const nextSummary =
      input.summary !== undefined ? input.summary.trim() || undefined : issue.summary;
    const nextDescription =
      input.description !== undefined ? input.description.trim() || undefined : issue.description;
    const nextStatus = input.status ?? issue.status;
    const nextPriority = input.priority ?? issue.priority;
    const nextLabels =
      input.labelIds !== undefined ? readProjectLabels(project, input.labelIds) : issue.labels;
    const nextAssignees =
      input.assigneeIds !== undefined ? readProjectAssignees(project, input.assigneeIds) : issue.assignees;
    const nextDependencies =
      input.dependencies !== undefined
        ? normalizeIssueDependencies(payload, {
            id: issue.id,
            key: issue.key,
            projectId: issue.projectId,
          }, input.dependencies)
        : issue.dependencies;
    const nextAcceptanceCriteria =
      input.acceptanceCriteria !== undefined
        ? normalizeAcceptanceCriteria(
            {
              key: issue.key,
              acceptanceCriteria: issue.acceptanceCriteria,
            },
            input.acceptanceCriteria,
          )
        : issue.acceptanceCriteria;

    if (
      nextStatus !== issue.status &&
      (nextStatus === 'in-progress' || nextStatus === 'review' || nextStatus === 'done')
    ) {
      const evaluation = evaluateKanbanIssueMove({
        project: currentProject,
        issues: currentOverview.snapshot.issues,
        issueId: issue.id,
        toState: nextStatus === 'in-progress' ? 'in-progress' : nextStatus === 'review' ? 'review' : 'done',
      });
      if (!evaluation.allowed) {
        throw new AppError(
          evaluation.signals.map((signal) => signal.message).join(' '),
          'KANBAN_POLICY_VIOLATION',
          409,
        );
      }
    }

    const candidateSnapshot = buildKanbanBacklogSnapshot({
      projects: payload.projects,
      issues: payload.issues.map((candidate) =>
        candidate.id === issue.id
          ? {
              ...candidate,
              title: nextTitle,
              summary: nextSummary,
              description: nextDescription,
              status: nextStatus,
              priority: nextPriority,
              labels: nextLabels,
              assignees: nextAssignees,
              dependencies: nextDependencies,
              acceptanceCriteria: nextAcceptanceCriteria,
            }
          : candidate,
      ),
      dispatchContextLabels: payload.dispatchContextLabels,
      generatedAt: this.deps.now(),
    });
    const candidateIssue = candidateSnapshot.issues.find((candidate) => candidate.id === issue.id);
    if (!candidateIssue) {
      throw new AppError(`Issue ${issue.key} could not be evaluated.`, 'INTERNAL_ERROR', 500);
    }
    if (
      nextStatus === 'in-progress' &&
      candidateIssue.dispatch.readiness !== 'ready' &&
      candidateIssue.dispatch.readiness !== 'dispatched'
    ) {
      throw new AppError(
        `${issue.key} is ${candidateIssue.dispatch.readiness} and cannot start active work yet.`,
        'KANBAN_POLICY_VIOLATION',
        409,
      );
    }
    if (
      (nextStatus === 'review' || nextStatus === 'done') &&
      (candidateIssue.status === 'blocked' || candidateIssue.dispatch.readiness === 'blocked')
    ) {
      throw new AppError(
        `${issue.key} is blocked and cannot advance until the blocking reasons clear.`,
        'KANBAN_POLICY_VIOLATION',
        409,
      );
    }
    if (
      nextStatus === 'done' &&
      candidateIssue.acceptanceCriteria.some((criterion) => !criterion.satisfied)
    ) {
      throw new AppError(
        `${issue.key} has acceptance checks remaining and cannot move to done yet.`,
        'KANBAN_POLICY_VIOLATION',
        409,
      );
    }

    const changedFields: string[] = [];
    if (issue.title !== nextTitle) {
      changedFields.push('title');
    }
    if ((issue.summary ?? '') !== (nextSummary ?? '')) {
      changedFields.push('summary');
    }
    if ((issue.description ?? '') !== (nextDescription ?? '')) {
      changedFields.push('description');
    }
    if (issue.status !== nextStatus) {
      changedFields.push('status');
    }
    if (issue.priority !== nextPriority) {
      changedFields.push('priority');
    }
    if (!arrayEquals(issue.labels.map((label) => label.id), nextLabels.map((label) => label.id))) {
      changedFields.push('tags');
    }
    if (
      !arrayEquals(
        issue.assignees.map((assignee) => assignee.id),
        nextAssignees.map((assignee) => assignee.id),
      )
    ) {
      changedFields.push('assignees');
    }
    if (!issueDependencyEquals(issue.dependencies, nextDependencies)) {
      changedFields.push('dependencies');
    }
    if (!acceptanceCriteriaEquals(issue.acceptanceCriteria, nextAcceptanceCriteria)) {
      changedFields.push('acceptance criteria');
    }

    if (changedFields.length === 0) {
      return this.buildOverviewFromPayload(payload);
    }

    const updatedAt = this.deps.now();
    const summary =
      changedFields.length === 1
        ? `Updated ${changedFields[0]} for ${issue.key}.`
        : `Updated ${changedFields.slice(0, -1).join(', ')} and ${changedFields.at(-1)} for ${issue.key}.`;

    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === input.issueId
        ? {
            ...candidate,
            title: nextTitle,
            summary: nextSummary,
            description: nextDescription,
            status: nextStatus,
            priority: nextPriority,
            labels: nextLabels,
            assignees: nextAssignees,
            dependencies: nextDependencies,
            acceptanceCriteria: nextAcceptanceCriteria,
            updatedAt,
            activity: [
              buildActivityEntry(
                `activity-issue-detail-${updatedAt}`,
                'issue',
                candidate.id,
                'updated-issue-detail',
                summary,
                {
                  kind: 'human',
                  id: 'tal',
                  displayName: 'Tal Muskal',
                  role: 'owner',
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === project.id
        ? {
            ...candidate,
            activity: [
              buildActivityEntry(
                `activity-project-issue-detail-${updatedAt}`,
                'project',
                candidate.id,
                'updated-issue-detail',
                `Updated issue detail fields on ${issue.key}.`,
                {
                  kind: 'human',
                  id: 'tal',
                  displayName: 'Tal Muskal',
                  role: 'owner',
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    return this.persistPayload({
      projects: nextProjects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async linkIssueWorkspace(input: LinkIssueWorkspaceInput): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const normalizedWorkspacePath = normalizeWorkspacePath(input.workspacePath);
    const workspaceName = input.workspaceName?.trim() || path.basename(normalizedWorkspacePath);
    const branchName = input.branchName?.trim() || undefined;

    if (!normalizedWorkspacePath) {
      throw new AppError("workspacePath is required.", "BAD_REQUEST", 400);
    }

    if ((issue.workspaceLinks ?? []).some((link) => normalizeWorkspacePath(link.workspacePath) === normalizedWorkspacePath)) {
      throw new AppError(
        `${issue.key} is already linked to ${normalizedWorkspacePath}.`,
        "BAD_REQUEST",
        409,
      );
    }

    const linkedIssue = payload.issues.find(
      (candidate) =>
        candidate.id !== issue.id &&
        (candidate.workspaceLinks ?? []).some(
          (link) => normalizeWorkspacePath(link.workspacePath) === normalizedWorkspacePath,
        ),
    );
    if (linkedIssue) {
      throw new AppError(
        `${normalizedWorkspacePath} is already linked to ${linkedIssue.key}.`,
        "BAD_REQUEST",
        409,
      );
    }

    const updatedAt = this.deps.now();
    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === issue.id
        ? {
            ...candidate,
            workspaceLinks: [
              ...(candidate.workspaceLinks ?? []),
              {
                workspacePath: normalizedWorkspacePath,
                workspaceName,
                branchName,
                linkedAt: updatedAt,
                source: input.source,
              },
            ],
            updatedAt,
            activity: [
              buildActivityEntry(
                `activity-issue-workspace-link-${updatedAt}`,
                "issue",
                candidate.id,
                "linked-workspace",
                `${input.source === "created-from-issue" ? "Created" : "Linked"} workspace ${workspaceName} on ${candidate.key}.`,
                {
                  kind: "human",
                  id: "tal",
                  displayName: "Tal Muskal",
                  role: "owner",
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === issue.projectId
        ? {
            ...candidate,
            activity: [
              buildActivityEntry(
                `activity-project-workspace-link-${updatedAt}`,
                "project",
                candidate.id,
                "linked-workspace",
                `${input.source === "created-from-issue" ? "Created" : "Linked"} workspace ${workspaceName} from ${issue.key}.`,
                {
                  kind: "human",
                  id: "tal",
                  displayName: "Tal Muskal",
                  role: "owner",
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    return this.persistPayload({
      projects: nextProjects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async linkIssueSession(input: LinkIssueSessionInput): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const normalizedSessionId = input.sessionId?.trim() ?? '';
    const normalizedRunId = input.runId?.trim() ?? '';

    if (!normalizedSessionId && !normalizedRunId) {
      throw new AppError('sessionId or runId is required.', 'BAD_REQUEST', 400);
    }

    if (normalizedSessionId) {
      const linkedIssue = payload.issues.find(
        (candidate) =>
          candidate.id !== issue.id &&
          (candidate.dispatch?.sessionIds ?? []).includes(normalizedSessionId),
      );
      if (linkedIssue) {
        throw new AppError(
          `${normalizedSessionId} is already linked to ${linkedIssue.key}.`,
          'BAD_REQUEST',
          409,
        );
      }
    }

    const updatedAt = this.deps.now();
    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === issue.id
        ? {
            ...candidate,
            dispatch: {
              ...candidate.dispatch,
              runIds: appendUniqueString(candidate.dispatch?.runIds, normalizedRunId),
              sessionIds: appendUniqueString(candidate.dispatch?.sessionIds, normalizedSessionId),
              lastDispatchedAt: updatedAt,
            },
            updatedAt,
            activity: [
              buildActivityEntry(
                `activity-issue-session-link-${updatedAt}`,
                'issue',
                candidate.id,
                'dispatch-linked',
                `Linked ${normalizedSessionId ? `session ${normalizedSessionId}` : `dispatch ${normalizedRunId}`} to ${candidate.key}.`,
                {
                  kind: 'human',
                  id: 'tal',
                  displayName: 'Tal Muskal',
                  role: 'owner',
                },
                updatedAt,
              ),
              ...(candidate.activity ?? []),
            ],
          }
        : candidate,
    );

    return this.persistPayload({
      projects: payload.projects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async linkChildIssue(input: {
    readonly parentIssueId: string;
    readonly childIssueId: string;
  }): Promise<BacklogOverview> {
    if (input.parentIssueId === input.childIssueId) {
      throw new AppError('An issue cannot be its own child.', 'BAD_REQUEST', 400);
    }

    const payload = await this.readSeedPayload();
    const parentIssue = this.findIssue(payload, input.parentIssueId);
    const childIssue = this.findIssue(payload, input.childIssueId);

    if (parentIssue.projectId !== childIssue.projectId) {
      throw new AppError('Parent and child issues must belong to the same project.', 'BAD_REQUEST', 400);
    }
    if (parentIssue.childIssueIds.includes(childIssue.id)) {
      return this.buildOverviewFromPayload(payload);
    }
    if (childIssue.parentIssueId && childIssue.parentIssueId !== parentIssue.id) {
      throw new AppError(
        `Issue ${childIssue.key} is already linked to parent ${childIssue.parentIssueId}.`,
        'BAD_REQUEST',
        400,
      );
    }
    if (wouldCreateParentChildCycle(payload.issues, parentIssue.id, childIssue.id)) {
      throw new AppError('Linking this child would create a parent-child cycle.', 'BAD_REQUEST', 400);
    }

    const updatedAt = this.deps.now();
    const nextIssues = payload.issues.map((candidate) => {
      if (candidate.id === parentIssue.id) {
        return {
          ...candidate,
          childIssueIds: appendUniqueIssueId(candidate.childIssueIds, childIssue.id),
          updatedAt,
          activity: [
            buildActivityEntry(
              `activity-linked-child-${updatedAt}`,
              'issue',
              candidate.id,
              'linked-child-issue',
              `Linked child issue ${childIssue.key}.`,
              {
                kind: 'human',
                id: 'tal',
                displayName: 'Tal Muskal',
                role: 'owner',
              },
              updatedAt,
            ),
            ...(candidate.activity ?? []),
          ],
        };
      }

      if (candidate.id === childIssue.id) {
        return {
          ...candidate,
          parentIssueId: parentIssue.id,
          updatedAt,
          activity: [
            buildActivityEntry(
              `activity-linked-parent-${updatedAt}`,
              'issue',
              candidate.id,
              'linked-parent-issue',
              `Linked parent issue ${parentIssue.key}.`,
              {
                kind: 'human',
                id: 'tal',
                displayName: 'Tal Muskal',
                role: 'owner',
              },
              updatedAt,
            ),
            ...(candidate.activity ?? []),
          ],
        };
      }

      return candidate;
    });

    return this.persistPayload({
      projects: payload.projects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }

  async createPullRequest(input: {
    readonly issueId: string;
    readonly title: string;
    readonly reviewers?: string;
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const issue = this.findIssue(payload, input.issueId);
    const project = this.findProject(payload, issue.projectId);
    const repositoryId = issue.repositoryLifecycle?.repositoryId;
    if (!repositoryId || !issue.repositoryLifecycle) {
      throw new AppError(
        `Issue ${input.issueId} must be linked to a repository before creating a PR.`,
        'BAD_REQUEST',
        400,
      );
    }

    const repository = project.repositories.find((candidate) => candidate.id === repositoryId);
    if (!repository) {
      throw new AppError(`Repository ${repositoryId} not found on project ${project.id}.`, 'NOT_FOUND', 404);
    }
    const integration = issue.repositoryLifecycle.integration;
    if (integration && !integration.actions.canCreatePullRequest) {
      throw new AppError(
        integration.actions.reason ?? integration.guidance,
        'BAD_REQUEST',
        400,
      );
    }
    if (!input.title.trim()) {
      throw new AppError('title is required.', 'BAD_REQUEST', 400);
    }

    const number = nextPullRequestNumber(payload.issues);
    const reviewers = parseReviewerList(input.reviewers ?? '');
    const nextIssues = payload.issues.map((candidate) => {
      if (candidate.id !== issue.id) {
        return candidate;
      }

      const nextIssue = createKanbanIssuePullRequest(candidate, {
        title: input.title,
        number,
        now: this.deps.now(),
        branchName: candidate.repositoryLifecycle?.branchName ?? `feature/${candidate.key.toLowerCase()}`,
        baseBranch: repository.settings.baseBranch,
        url: `${repository.url}/pull/${number}`,
        linkState:
          candidate.repositoryLifecycle?.integration?.status === 'connected'
            ? 'linked'
            : 'partially-linked',
        reviewLinks: reviewers.map((reviewer) => ({
          label: reviewer,
          reviewer,
          status: 'pending' as const,
        })),
      });

      return {
        ...nextIssue,
        repositoryLifecycle: nextIssue.repositoryLifecycle
          ? {
              ...nextIssue.repositoryLifecycle,
              integration: nextIssue.repositoryLifecycle.integration
                ? {
                    ...nextIssue.repositoryLifecycle.integration,
                    linkState:
                      nextIssue.repositoryLifecycle.integration.status === 'connected'
                        ? ('linked' as const)
                        : ('partially-linked' as const),
                  }
                : nextIssue.repositoryLifecycle.integration,
            }
          : nextIssue.repositoryLifecycle,
        updatedAt: this.deps.now(),
      };
    });

    return this.persistPayload({
      projects: payload.projects,
      issues: nextIssues,
      dispatchContextLabels: payload.dispatchContextLabels,
    });
  }
}
