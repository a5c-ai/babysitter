import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildKanbanBoardSnapshot,
  buildKanbanBacklogSnapshot,
  evaluateKanbanIssueMove,
  type KanbanBoardSnapshot,
  type KanbanBacklogSnapshot,
  type KanbanIssue,
  type KanbanProject,
  type KanbanWorkflowState,
  type LinkedRunSummary,
} from '@a5c-ai/agent-mux-core/kanban';

import { AppError } from '../error-handler';
import { RunQueryService } from './run-query-service';

const BACKLOG_FILE_PATH =
  process.env.KANBAN_BACKLOG_FILE ?? path.join(os.homedir(), '.a5c', 'kanban-backlog.json');

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

type BacklogSeedProject = Omit<KanbanProject, 'metrics'>;
type BacklogSeedIssue = Omit<KanbanIssue, 'dispatch'> & {
  readonly dispatch?: Partial<KanbanIssue['dispatch']>;
};

const debtLabel = {
  id: 'label-debt',
  name: 'debt',
  description: 'Work tracked to close parity or structural debt.',
};

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
    assignees: [],
    statuses: [],
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
    assignees: [],
    dependencies: [{ issueId: 'KANBAN-GAP-001', type: 'blocked-by' }],
    acceptanceCriteria: [],
    decomposition: [],
    childIssueIds: [],
    createdAt: '2026-04-24T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
    source: { kind: 'seed', path: SOURCE_PATH, externalId: 'KANBAN-GAP-007' },
  },
];

interface BacklogFilePayload {
  projects?: readonly BacklogSeedProject[];
  issues?: readonly BacklogSeedIssue[];
}

interface BacklogQueryServiceDeps {
  runQueryService: Pick<RunQueryService, 'listProjects'>;
  readFile: typeof fs.readFile;
  writeFile: typeof fs.writeFile;
  backlogFilePath: string;
  now: () => string;
}

const defaultDeps: BacklogQueryServiceDeps = {
  runQueryService: new RunQueryService(),
  readFile: fs.readFile,
  writeFile: fs.writeFile,
  backlogFilePath: BACKLOG_FILE_PATH,
  now: () => new Date().toISOString(),
};

async function readBacklogFile(deps: BacklogQueryServiceDeps): Promise<BacklogFilePayload | null> {
  try {
    const raw = await deps.readFile(deps.backlogFilePath, 'utf8');
    return JSON.parse(raw) as BacklogFilePayload;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeBacklogFile(
  deps: BacklogQueryServiceDeps,
  payload: BacklogFilePayload,
): Promise<void> {
  await deps.writeFile(deps.backlogFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

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

function buildHydratedOverview(input: {
  readonly generatedAt?: string;
  readonly projects: readonly BacklogSeedProject[];
  readonly issues: readonly BacklogSeedIssue[];
  readonly runSummaries: readonly LinkedRunSummary[];
}): BacklogOverview {
  const snapshot = buildKanbanBacklogSnapshot({
    generatedAt: input.generatedAt,
    projects: input.projects,
    issues: input.issues,
  });
  const hydratedSnapshot = attachRunSummaries(snapshot, input.runSummaries);
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
    const backlogFile = await readBacklogFile(this.deps);
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

  async getOverview(): Promise<BacklogOverview> {
    const { projects, issues } = await this.readSeedPayload();
    return buildHydratedOverview({
      projects,
      issues,
      runSummaries: await this.listRunSummaries(),
      generatedAt: this.deps.now(),
    });
  }

  async moveIssue(input: {
    readonly issueId: string;
    readonly toState: KanbanWorkflowState;
  }): Promise<BacklogOverview> {
    const payload = await this.readSeedPayload();
    const overview = buildHydratedOverview({
      projects: payload.projects,
      issues: payload.issues,
      runSummaries: await this.listRunSummaries(),
      generatedAt: this.deps.now(),
    });

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

    const nextIssues = payload.issues.map((candidate) =>
      candidate.id === input.issueId
        ? {
            ...candidate,
            status: evaluation.nextStatus,
            updatedAt: this.deps.now(),
          }
        : candidate,
    );

    await writeBacklogFile(this.deps, {
      projects: payload.projects,
      issues: nextIssues,
    });

    return buildHydratedOverview({
      projects: payload.projects,
      issues: nextIssues,
      runSummaries: await this.listRunSummaries(),
      generatedAt: this.deps.now(),
    });
  }
}
