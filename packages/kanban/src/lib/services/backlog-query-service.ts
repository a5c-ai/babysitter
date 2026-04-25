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
  type KanbanCollaborator,
  type KanbanCollaboratorRole,
  type KanbanBoardSnapshot,
  type KanbanBacklogSnapshot,
  type KanbanIssue,
  type KanbanPermissionGrant,
  type KanbanProject,
  type KanbanProjectSettings,
  type KanbanRepositoryContext,
  type KanbanRepositoryProvider,
  type KanbanRepositorySettings,
  type KanbanReviewSnapshot,
  type KanbanTeamSettings,
  type KanbanWorkflowState,
  type LinkedRunSummary,
} from '@a5c-ai/agent-mux-core/kanban';

import { AppError } from '../error-handler';
import { ReviewService } from '../review-service';
import { RunQueryService } from './run-query-service';
import {
  KANBAN_BACKLOG_FILE_PATH,
  defaultKanbanStorageDeps,
  readKanbanStorageFile,
  writeKanbanStorageFile,
  type KanbanStorageDeps,
  type StoredKanbanIssue,
  type StoredKanbanProject,
} from './kanban-storage';

const SOURCE_PATH = 'packages/kanban/gaps-and-debt.md';
const PROJECT_ID = 'kanban-app';

export interface BacklogOverviewSummary {
  projectCount: number;
  issueCount: number;
  readyCount: number;
  blockedCount: number;
  dispatchedCount: number;
  completedCount: number;
  needsDecompositionCount: number;
  inProgressCount: number;
}

export interface BacklogOverview {
  snapshot: KanbanBacklogSnapshot;
  board: KanbanBoardSnapshot;
  summary: BacklogOverviewSummary;
}

export interface CreateBacklogIssueInput {
  readonly projectId: string;
  readonly title: string;
  readonly summary?: string;
  readonly description?: string;
  readonly status?: KanbanIssue['status'];
  readonly priority?: KanbanIssue['priority'];
  readonly labelIds?: readonly string[];
  readonly assigneeIds?: readonly string[];
  readonly acceptanceCriteria?: readonly string[];
  readonly decomposition?: readonly Pick<KanbanIssue['decomposition'][number], 'title' | 'kind' | 'status'>[];
  readonly source?: KanbanIssue['source'];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CreateBacklogIssueResult {
  readonly overview: BacklogOverview;
  readonly issue: KanbanIssue;
}

type BacklogSeedProject = StoredKanbanProject;
type BacklogSeedIssue = StoredKanbanIssue;

const debtLabel = {
  id: 'label-debt',
  name: 'debt',
  description: 'Work tracked to close parity or structural debt.',
};

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

const systemActor = {
  kind: 'system' as const,
  id: 'kanban-seed',
  displayName: 'Kanban seed data',
};

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

function resolveCollaboratorsById(
  members: readonly KanbanCollaborator[],
  ids: readonly string[],
): KanbanCollaborator[] {
  const roster = new Map(members.map((member) => [member.id, member]));
  return ids
    .map((id) => roster.get(id))
    .filter((member): member is KanbanCollaborator => Boolean(member));
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
      'The package name should match the real product contract. `packages/kanban` is the shell for board planning, issue orchestration, and workspace execution, with Babysitter observability layered on top. The unresolved work is deeper product capability, not cosmetic renaming.',
    status: 'review',
    priority: 'high',
    labels: [debtLabel],
    assignees: [],
    dependencies: [],
    acceptanceCriteria: [
      {
        id: 'KANBAN-DEBT-003-ac-1',
        title: 'Document the target product model for packages/kanban.',
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
        title: 'Expose review artifacts and actions through shared APIs, then compose the UX in packages/kanban.',
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
        title: 'Add shared repo and PR state below packages/kanban.',
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
  readonly runSummaries: readonly LinkedRunSummary[];
  readonly reviewSnapshot: KanbanReviewSnapshot;
}): BacklogOverview {
  const snapshot = buildKanbanBacklogSnapshot({
    generatedAt: input.generatedAt,
    projects: input.projects,
    issues: input.issues,
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
  }> {
    const backlogFile = await readKanbanStorageFile(this.deps);
    return {
      projects: backlogFile?.projects?.length ? backlogFile.projects : defaultProjects,
      issues: backlogFile?.issues?.length ? backlogFile.issues : defaultIssues,
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
  }): Promise<BacklogOverview> {
    return buildHydratedOverview({
      projects: payload.projects,
      issues: payload.issues,
      runSummaries: await this.listRunSummaries(),
      reviewSnapshot: await this.deps.reviewService.listReviews({ targetType: 'issue' }),
      generatedAt: this.deps.now(),
    });
  }

  private async persistPayload(payload: {
    projects: readonly BacklogSeedProject[];
    issues: readonly BacklogSeedIssue[];
  }): Promise<BacklogOverview> {
    const existingPayload = (await readKanbanStorageFile(this.deps)) ?? {};
    await writeKanbanStorageFile(this.deps, {
      ...existingPayload,
      projects: payload.projects,
      issues: payload.issues,
    });
    return this.buildOverviewFromPayload(payload);
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
    const { projects, issues } = await this.readSeedPayload();
    return this.buildOverviewFromPayload({ projects, issues });
  }

  async createIssue(input: CreateBacklogIssueInput): Promise<CreateBacklogIssueResult> {
    const payload = await this.readSeedPayload();
    const project = this.findProject(payload, input.projectId);

    if (!input.title.trim()) {
      throw new AppError('title is required.', 'BAD_REQUEST', 400);
    }

    const key = nextAutomationIssueKey(project, payload.issues);
    const createdAt = this.deps.now();
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
      dependencies: [],
      acceptanceCriteria: (input.acceptanceCriteria ?? []).map((title, index) => ({
        id: `${key}-ac-${index + 1}`,
        title,
        satisfied: false,
      })),
      decomposition: (input.decomposition ?? []).map((item, index) => ({
        id: `${key}-decomp-${index + 1}`,
        title: item.title,
        kind: item.kind,
        status: item.status,
      })),
      childIssueIds: [],
      createdAt,
      updatedAt: createdAt,
      source: input.source,
      metadata: input.metadata,
    };

    const nextProjects = payload.projects.map((candidate) =>
      candidate.id === project.id
        ? {
            ...candidate,
            issueIds: [...candidate.issueIds, issue.id],
          }
        : candidate,
    );
    const nextIssues = [...payload.issues, issue];
    const overview = await this.persistPayload({
      projects: nextProjects,
      issues: nextIssues,
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
            }),
            updatedAt: this.deps.now(),
          }
        : candidate,
    );

    return this.persistPayload({
      projects: nextProjects,
      issues: nextIssues,
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
    if (!input.title.trim()) {
      throw new AppError('title is required.', 'BAD_REQUEST', 400);
    }

    const number = nextPullRequestNumber(payload.issues);
    const reviewers = parseReviewerList(input.reviewers ?? '');
    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === issue.id
        ? {
            ...createKanbanIssuePullRequest(candidate, {
              title: input.title,
              number,
              now: this.deps.now(),
              branchName: candidate.repositoryLifecycle?.branchName ?? `feature/${candidate.key.toLowerCase()}`,
              baseBranch: repository.settings.baseBranch,
              url: `${repository.url}/pull/${number}`,
              reviewLinks: reviewers.map((reviewer) => ({
                label: reviewer,
                reviewer,
                status: 'pending' as const,
              })),
            }),
            updatedAt: this.deps.now(),
          }
        : candidate,
    );

    return this.persistPayload({
      projects: payload.projects,
      issues: nextIssues,
    });
  }
}
