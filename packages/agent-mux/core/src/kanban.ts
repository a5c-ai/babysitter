export type KanbanPriority = 'critical' | 'high' | 'medium' | 'low';

export type KanbanIssueStatus =
  | 'backlog'
  | 'ready'
  | 'in-progress'
  | 'blocked'
  | 'review'
  | 'done';

export type KanbanWorkflowState = 'todo' | 'in-progress' | 'review' | 'done';

export type KanbanSwimlaneId = 'expedite' | 'standard' | 'blocked';

export type KanbanDispatchReadiness =
  | 'needs-decomposition'
  | 'ready'
  | 'blocked'
  | 'dispatched'
  | 'completed';

export type KanbanDependencyType = 'blocks' | 'blocked-by' | 'related';

export type KanbanDecompositionStatus = 'todo' | 'ready' | 'done';

export type KanbanDecompositionKind =
  | 'research'
  | 'implementation'
  | 'validation'
  | 'coordination';

export type KanbanRepositoryProvider = 'github' | 'gitlab' | 'bitbucket' | 'local';

export type KanbanPullRequestStatus =
  | 'draft'
  | 'open'
  | 'in-review'
  | 'approved'
  | 'changes-requested'
  | 'merged';

export type KanbanReviewStatus = 'unlinked' | 'pending' | 'approved' | 'changes-requested';

export type KanbanMergeStatus = 'not-ready' | 'blocked' | 'ready' | 'merged';

export type KanbanCiGateStatus = 'pending' | 'passing' | 'failing' | 'skipped';

export type KanbanPublishStatus = 'not-ready' | 'pending' | 'ready' | 'published' | 'failed';

export type KanbanReviewTargetType = 'issue' | 'workspace';

export type KanbanReviewDecision = 'pending' | 'changes-requested' | 'approved';

export type KanbanReviewQueueState = 'queued' | 'in-review' | 'completed';

export type KanbanDiffLineKind = 'context' | 'add' | 'delete';

export type KanbanReviewCommentStatus = 'open' | 'resolved';

export type KanbanReviewCommentSide = 'base' | 'head';

export interface KanbanLabel {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly description?: string;
}

export interface KanbanAssignee {
  readonly id: string;
  readonly displayName: string;
  readonly email?: string;
  readonly avatarUrl?: string;
}

export interface KanbanAcceptanceCriterion {
  readonly id: string;
  readonly title: string;
  readonly satisfied: boolean;
  readonly notes?: string;
}

export interface KanbanIssueDependency {
  readonly issueId: string;
  readonly type: KanbanDependencyType;
}

export interface KanbanDecompositionItem {
  readonly id: string;
  readonly title: string;
  readonly status: KanbanDecompositionStatus;
  readonly kind: KanbanDecompositionKind;
  readonly issueId?: string;
}

export interface KanbanIssueDispatchState {
  readonly readiness: KanbanDispatchReadiness;
  readonly blockedReasons: readonly string[];
  readonly runIds: readonly string[];
  readonly sessionIds: readonly string[];
  readonly lastDispatchedAt?: string;
}

export interface KanbanIssueSource {
  readonly kind: 'seed' | 'file' | 'run-derived';
  readonly path?: string;
  readonly externalId?: string;
}

export interface KanbanPullRequestReviewLink {
  readonly id: string;
  readonly label: string;
  readonly reviewer?: string;
  readonly status: Exclude<KanbanReviewStatus, 'unlinked'>;
  readonly url?: string;
}

export interface KanbanCiGate {
  readonly id: string;
  readonly name: string;
  readonly provider?: string;
  readonly required: boolean;
  readonly status: KanbanCiGateStatus;
  readonly summary?: string;
  readonly url?: string;
}

export interface KanbanRepositorySettings {
  readonly baseBranch: string;
  readonly autoMerge: boolean;
  readonly requiredApprovals: number;
  readonly ciProvider?: string;
  readonly publishTarget?: string;
}

export interface KanbanRepositoryContext {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly fullName: string;
  readonly provider: KanbanRepositoryProvider;
  readonly url?: string;
  readonly defaultBranch: string;
  readonly linkedAt: string;
  readonly settings: KanbanRepositorySettings;
}

export interface KanbanPullRequest {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly status: KanbanPullRequestStatus;
  readonly branchName: string;
  readonly baseBranch: string;
  readonly mergeStatus: KanbanMergeStatus;
  readonly reviewLinks: readonly KanbanPullRequestReviewLink[];
  readonly url?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KanbanIssueRepositoryLifecycle {
  readonly repositoryId: string;
  readonly branchName: string;
  readonly reviewStatus: KanbanReviewStatus;
  readonly mergeStatus: KanbanMergeStatus;
  readonly publishStatus: KanbanPublishStatus;
  readonly ciGates: readonly KanbanCiGate[];
  readonly pullRequest?: KanbanPullRequest;
  readonly publishUrl?: string;
  readonly lastPublishedAt?: string;
}

export interface KanbanReviewFeedbackSource {
  readonly kind: 'agent-feedback';
  readonly label: string;
  readonly sessionId?: string;
  readonly runId?: string;
  readonly effectId?: string;
  readonly messageId?: string;
}

export interface KanbanDiffLine {
  readonly kind: KanbanDiffLineKind;
  readonly content: string;
  readonly oldLineNumber?: number;
  readonly newLineNumber?: number;
}

export interface KanbanDiffHunk {
  readonly id: string;
  readonly header: string;
  readonly lines: readonly KanbanDiffLine[];
}

export interface KanbanDiffFile {
  readonly id: string;
  readonly path: string;
  readonly additions: number;
  readonly deletions: number;
  readonly hunks: readonly KanbanDiffHunk[];
}

export interface KanbanReviewCommentAnchor {
  readonly fileId: string;
  readonly filePath: string;
  readonly hunkId: string;
  readonly side: KanbanReviewCommentSide;
  readonly line: number;
}

export interface KanbanReviewComment {
  readonly id: string;
  readonly author: {
    readonly kind: 'agent' | 'human';
    readonly name: string;
  };
  readonly body: string;
  readonly createdAt: string;
  readonly status: KanbanReviewCommentStatus;
  readonly anchor: KanbanReviewCommentAnchor;
  readonly feedbackSource?: KanbanReviewFeedbackSource;
}

export interface KanbanReviewSummary {
  readonly decision: KanbanReviewDecision;
  readonly queueState: KanbanReviewQueueState;
  readonly commentCount: number;
  readonly openCommentCount: number;
  readonly latestActivityAt: string;
}

export interface KanbanReviewArtifact {
  readonly id: string;
  readonly targetType: KanbanReviewTargetType;
  readonly targetId: string;
  readonly targetLabel: string;
  readonly title: string;
  readonly summary?: string;
  readonly branch?: string;
  readonly decision: KanbanReviewDecision;
  readonly queueState: KanbanReviewQueueState;
  readonly diff: readonly KanbanDiffFile[];
  readonly comments: readonly KanbanReviewComment[];
  readonly updatedAt: string;
}

export interface KanbanReviewQueueItem {
  readonly artifactId: string;
  readonly targetType: KanbanReviewTargetType;
  readonly targetId: string;
  readonly targetLabel: string;
  readonly title: string;
  readonly decision: KanbanReviewDecision;
  readonly queueState: KanbanReviewQueueState;
  readonly commentCount: number;
  readonly openCommentCount: number;
  readonly updatedAt: string;
}

export interface KanbanReviewSnapshot {
  readonly generatedAt: string;
  readonly artifacts: readonly KanbanReviewArtifact[];
  readonly queue: readonly KanbanReviewQueueItem[];
  readonly summary: {
    readonly total: number;
    readonly issueCount: number;
    readonly workspaceCount: number;
    readonly pendingCount: number;
    readonly changesRequestedCount: number;
  readonly approvedCount: number;
  readonly openCommentCount: number;
  };
}

export interface KanbanIssue {
  readonly id: string;
  readonly projectId: string;
  readonly key: string;
  readonly title: string;
  readonly summary?: string;
  readonly description?: string;
  readonly status: KanbanIssueStatus;
  readonly priority: KanbanPriority;
  readonly labels: readonly KanbanLabel[];
  readonly assignees: readonly KanbanAssignee[];
  readonly dependencies: readonly KanbanIssueDependency[];
  readonly acceptanceCriteria: readonly KanbanAcceptanceCriterion[];
  readonly decomposition: readonly KanbanDecompositionItem[];
  readonly childIssueIds: readonly string[];
  readonly parentIssueId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dispatch: KanbanIssueDispatchState;
  readonly repositoryLifecycle?: KanbanIssueRepositoryLifecycle;
  readonly source?: KanbanIssueSource;
  readonly review?: KanbanReviewSummary;
}

export interface KanbanStatusDefinition {
  readonly id: string;
  readonly name: string;
  readonly kind: 'backlog' | 'active' | 'done';
  readonly wipLimit?: number;
}

export interface KanbanProjectMetrics {
  readonly totalIssues: number;
  readonly readyIssues: number;
  readonly blockedIssues: number;
  readonly dispatchedIssues: number;
  readonly completedIssues: number;
  readonly needsDecompositionIssues: number;
  readonly inProgressIssues: number;
}

export interface LinkedRunSummary {
  readonly projectName: string;
  readonly totalRuns: number;
  readonly activeRuns: number;
  readonly completedRuns: number;
  readonly failedRuns: number;
  readonly staleRuns?: number;
  readonly latestUpdate: string;
}

export interface KanbanProject {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly issueIds: readonly string[];
  readonly labels: readonly KanbanLabel[];
  readonly assignees: readonly KanbanAssignee[];
  readonly statuses: readonly KanbanStatusDefinition[];
  readonly repositories: readonly KanbanRepositoryContext[];
  readonly linkedRunProjectName?: string;
  readonly linkedRunSummary?: LinkedRunSummary;
  readonly metrics: KanbanProjectMetrics;
}

export interface KanbanBacklogSnapshot {
  readonly generatedAt: string;
  readonly projects: readonly KanbanProject[];
  readonly issues: readonly KanbanIssue[];
}

export interface KanbanBoardPolicyHook {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly scope: 'board' | 'column' | 'card';
  readonly blocking: boolean;
  readonly columnIds?: readonly KanbanWorkflowState[];
}

export interface KanbanBoardPolicySignal {
  readonly hookId: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly blocking: boolean;
}

export interface KanbanBoardMoveTarget {
  readonly state: KanbanWorkflowState;
  readonly allowed: boolean;
  readonly signals: readonly KanbanBoardPolicySignal[];
}

export interface KanbanBoardCard {
  readonly issueId: string;
  readonly issueKey: string;
  readonly projectId: string;
  readonly title: string;
  readonly summary?: string;
  readonly workflowState: KanbanWorkflowState;
  readonly swimlaneId: KanbanSwimlaneId;
  readonly priority: KanbanPriority;
  readonly readiness: KanbanDispatchReadiness;
  readonly blocked: boolean;
  readonly blockedReasons: readonly string[];
  readonly labelNames: readonly string[];
  readonly assigneeNames: readonly string[];
  readonly dependencyCount: number;
  readonly childCount: number;
  readonly acceptanceProgress: {
    readonly satisfied: number;
    readonly total: number;
  };
  readonly repository?: KanbanRepositoryContext;
  readonly repositoryLifecycle?: KanbanIssueRepositoryLifecycle;
  readonly moveTargets: readonly KanbanBoardMoveTarget[];
  readonly policySignals: readonly KanbanBoardPolicySignal[];
  readonly review?: KanbanReviewSummary;
}

export interface KanbanBoardColumn {
  readonly id: KanbanWorkflowState;
  readonly name: string;
  readonly issueIds: readonly string[];
  readonly issueCount: number;
  readonly wipLimit?: number;
  readonly isOverLimit: boolean;
}

export interface KanbanBoardSwimlane {
  readonly id: KanbanSwimlaneId;
  readonly name: string;
  readonly issueIds: readonly string[];
}

export interface KanbanProjectBoard {
  readonly projectId: string;
  readonly projectKey: string;
  readonly projectName: string;
  readonly generatedAt: string;
  readonly columns: readonly KanbanBoardColumn[];
  readonly swimlanes: readonly KanbanBoardSwimlane[];
  readonly cards: readonly KanbanBoardCard[];
  readonly policyHooks: readonly KanbanBoardPolicyHook[];
}

export interface KanbanBoardSnapshot {
  readonly generatedAt: string;
  readonly projects: readonly KanbanProjectBoard[];
}

export interface KanbanIssueMoveEvaluation {
  readonly issueId: string;
  readonly fromState: KanbanWorkflowState;
  readonly toState: KanbanWorkflowState;
  readonly allowed: boolean;
  readonly nextStatus?: KanbanIssueStatus;
  readonly signals: readonly KanbanBoardPolicySignal[];
}

const DEFAULT_PROJECT_STATUSES: readonly KanbanStatusDefinition[] = [
  { id: 'backlog', name: 'Backlog', kind: 'backlog' },
  { id: 'ready', name: 'Ready', kind: 'backlog' },
  { id: 'in-progress', name: 'In Progress', kind: 'active', wipLimit: 3 },
  { id: 'review', name: 'Review', kind: 'active', wipLimit: 3 },
  { id: 'done', name: 'Done', kind: 'done' },
];

const WORKFLOW_STATE_ORDER: readonly KanbanWorkflowState[] = [
  'todo',
  'in-progress',
  'review',
  'done',
];

const DEFAULT_SWIMLANES: readonly Omit<KanbanBoardSwimlane, 'issueIds'>[] = [
  { id: 'expedite', name: 'Expedite' },
  { id: 'standard', name: 'Standard' },
  { id: 'blocked', name: 'Blocked' },
];

const DEFAULT_BOARD_POLICY_HOOKS: readonly KanbanBoardPolicyHook[] = [
  {
    id: 'dispatch-ready',
    name: 'Dispatch readiness gate',
    description: 'Only ready issues can move from todo into active work.',
    scope: 'card',
    blocking: true,
    columnIds: ['in-progress'],
  },
  {
    id: 'wip-limit',
    name: 'WIP limit',
    description: 'Active workflow columns enforce configured work-in-progress limits.',
    scope: 'column',
    blocking: true,
    columnIds: ['in-progress', 'review'],
  },
  {
    id: 'blocked-flow',
    name: 'Blocked flow gate',
    description: 'Blocked issues cannot advance into review or done.',
    scope: 'card',
    blocking: true,
    columnIds: ['review', 'done'],
  },
  {
    id: 'acceptance-complete',
    name: 'Acceptance completion gate',
    description: 'Issues can only move to done after every acceptance criterion is satisfied.',
    scope: 'card',
    blocking: true,
    columnIds: ['done'],
  },
  {
    id: 'repo-ci',
    name: 'CI gate visibility',
    description: 'Repository-scoped CI results should be visible on each work item.',
    scope: 'card',
    blocking: false,
  },
  {
    id: 'merge-status',
    name: 'Merge readiness',
    description: 'PR review and merge readiness should be visible from the board.',
    scope: 'card',
    blocking: false,
  },
  {
    id: 'publish-status',
    name: 'Publish lifecycle',
    description: 'Merged work should expose publish readiness and release state.',
    scope: 'card',
    blocking: false,
  },
];

function uniqueById<T extends { readonly id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const normalized: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    normalized.push(item);
  }
  return normalized;
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeRepositorySettings(
  settings: Partial<KanbanRepositorySettings> | undefined,
  defaultBranch: string,
): KanbanRepositorySettings {
  return {
    baseBranch: settings?.baseBranch?.trim() || defaultBranch,
    autoMerge: settings?.autoMerge ?? false,
    requiredApprovals:
      typeof settings?.requiredApprovals === 'number' && settings.requiredApprovals >= 0
        ? Math.floor(settings.requiredApprovals)
        : 1,
    ciProvider: settings?.ciProvider?.trim() || undefined,
    publishTarget: settings?.publishTarget?.trim() || undefined,
  };
}

function normalizeRepositoryContext(repository: KanbanRepositoryContext): KanbanRepositoryContext {
  const owner = repository.owner.trim();
  const name = repository.name.trim();
  const fullName = repository.fullName?.trim() || `${owner}/${name}`;
  const defaultBranch = repository.defaultBranch?.trim() || 'main';
  return {
    ...repository,
    owner,
    name,
    fullName,
    defaultBranch,
    url: repository.url?.trim() || undefined,
    settings: normalizeRepositorySettings(repository.settings, defaultBranch),
  };
}

function resolveReviewStatus(
  pullRequest?: Pick<KanbanPullRequest, 'status' | 'reviewLinks'>,
): KanbanReviewStatus {
  if (!pullRequest) {
    return 'unlinked';
  }

  if (pullRequest.reviewLinks.some((review) => review.status === 'changes-requested')) {
    return 'changes-requested';
  }
  if (pullRequest.reviewLinks.length > 0 && pullRequest.reviewLinks.every((review) => review.status === 'approved')) {
    return 'approved';
  }
  if (pullRequest.reviewLinks.length > 0 || pullRequest.status === 'in-review') {
    return 'pending';
  }
  if (pullRequest.status === 'approved') {
    return 'approved';
  }
  if (pullRequest.status === 'changes-requested') {
    return 'changes-requested';
  }
  return 'pending';
}

function resolveMergeStatus(
  lifecycle: Pick<KanbanIssueRepositoryLifecycle, 'ciGates' | 'pullRequest' | 'reviewStatus'>,
): KanbanMergeStatus {
  if (!lifecycle.pullRequest) {
    return 'not-ready';
  }
  if (lifecycle.pullRequest.status === 'merged') {
    return 'merged';
  }

  const blockingGate = lifecycle.ciGates.some(
    (gate) => gate.required && gate.status !== 'passing' && gate.status !== 'skipped',
  );
  if (blockingGate) {
    return 'blocked';
  }

  return lifecycle.reviewStatus === 'approved' ? 'ready' : 'blocked';
}

function resolvePublishStatus(
  lifecycle: Pick<KanbanIssueRepositoryLifecycle, 'mergeStatus' | 'publishStatus' | 'lastPublishedAt'>,
): KanbanPublishStatus {
  if (lifecycle.publishStatus === 'published' || lifecycle.lastPublishedAt) {
    return 'published';
  }
  if (lifecycle.publishStatus === 'failed') {
    return 'failed';
  }
  if (lifecycle.publishStatus === 'pending') {
    return 'pending';
  }
  if (lifecycle.mergeStatus === 'merged') {
    return 'ready';
  }
  return 'not-ready';
}

function normalizeIssueRepositoryLifecycle(
  lifecycle: KanbanIssueRepositoryLifecycle | undefined,
  repositoryMap: ReadonlyMap<string, KanbanRepositoryContext>,
): KanbanIssueRepositoryLifecycle | undefined {
  if (!lifecycle) {
    return undefined;
  }

  const repository = repositoryMap.get(lifecycle.repositoryId);
  const branchName = lifecycle.branchName?.trim() || repository?.defaultBranch || 'main';
  const ciGates = uniqueById(
    lifecycle.ciGates.map((gate) => ({
      ...gate,
      name: gate.name.trim(),
      provider: gate.provider?.trim() || repository?.settings.ciProvider,
      summary: gate.summary?.trim() || undefined,
      url: gate.url?.trim() || undefined,
    })),
  );

  const pullRequest = lifecycle.pullRequest
    ? {
        ...lifecycle.pullRequest,
        title: lifecycle.pullRequest.title.trim(),
        branchName: lifecycle.pullRequest.branchName?.trim() || branchName,
        baseBranch:
          lifecycle.pullRequest.baseBranch?.trim() ||
          repository?.settings.baseBranch ||
          repository?.defaultBranch ||
          'main',
        reviewLinks: uniqueById(
          lifecycle.pullRequest.reviewLinks.map((reviewLink) => ({
            ...reviewLink,
            label: reviewLink.label.trim(),
            reviewer: reviewLink.reviewer?.trim() || undefined,
            url: reviewLink.url?.trim() || undefined,
          })),
        ),
        url: lifecycle.pullRequest.url?.trim() || undefined,
      }
    : undefined;

  const reviewStatus = resolveReviewStatus(pullRequest);
  const mergeStatus = resolveMergeStatus({
    ciGates,
    pullRequest,
    reviewStatus,
  });
  const publishStatus = resolvePublishStatus({
    mergeStatus,
    publishStatus: lifecycle.publishStatus,
    lastPublishedAt: lifecycle.lastPublishedAt,
  });

  return {
    ...lifecycle,
    branchName,
    ciGates,
    pullRequest: pullRequest
      ? {
          ...pullRequest,
          mergeStatus,
          status:
            mergeStatus === 'merged'
              ? 'merged'
              : reviewStatus === 'approved'
                ? 'approved'
                : reviewStatus === 'changes-requested'
                  ? 'changes-requested'
                  : pullRequest.status,
        }
      : undefined,
    reviewStatus,
    mergeStatus,
    publishStatus,
    publishUrl: lifecycle.publishUrl?.trim() || undefined,
    lastPublishedAt: lifecycle.lastPublishedAt,
  };
}

function getColumnName(state: KanbanWorkflowState): string {
  switch (state) {
    case 'todo':
      return 'Todo';
    case 'in-progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
  }
}

function getColumnWipLimit(
  project: KanbanProject,
  state: KanbanWorkflowState,
): number | undefined {
  if (state === 'todo' || state === 'done') {
    return undefined;
  }

  return project.statuses.find((status) => status.id === state)?.wipLimit;
}

function getAllowedMoveStates(currentState: KanbanWorkflowState): readonly KanbanWorkflowState[] {
  switch (currentState) {
    case 'todo':
      return ['in-progress'];
    case 'in-progress':
      return ['todo', 'review'];
    case 'review':
      return ['in-progress', 'done'];
    case 'done':
      return ['review'];
  }
}

function acceptanceProgress(issue: KanbanIssue): { satisfied: number; total: number } {
  return {
    satisfied: issue.acceptanceCriteria.filter((criterion) => criterion.satisfied).length,
    total: issue.acceptanceCriteria.length,
  };
}

function isBlockedIssue(issue: KanbanIssue): boolean {
  return issue.status === 'blocked' || issue.dispatch.readiness === 'blocked';
}

function createPolicySignal(
  hookId: KanbanBoardPolicySignal['hookId'],
  message: string,
  blocking = true,
): KanbanBoardPolicySignal {
  return {
    hookId,
    message,
    blocking,
    severity: blocking ? 'error' : 'warning',
  };
}

export function summarizeKanbanReviewArtifact(
  artifact: Pick<KanbanReviewArtifact, 'decision' | 'queueState' | 'comments' | 'updatedAt'>,
): KanbanReviewSummary {
  return {
    decision: artifact.decision,
    queueState: artifact.queueState,
    commentCount: artifact.comments.length,
    openCommentCount: artifact.comments.filter((comment) => comment.status === 'open').length,
    latestActivityAt: artifact.updatedAt,
  };
}

function resolveReadiness(
  issue: Omit<KanbanIssue, 'dispatch'> & { readonly dispatch?: Partial<KanbanIssueDispatchState> },
  issuesById: ReadonlyMap<string, KanbanIssue>,
): KanbanDispatchReadiness {
  if (issue.status === 'done') return 'completed';
  if ((issue.dispatch?.runIds?.length ?? 0) > 0 || (issue.dispatch?.sessionIds?.length ?? 0) > 0) {
    return 'dispatched';
  }
  if (issue.status === 'blocked') return 'blocked';

  const unresolvedDependencies = issue.dependencies.some((dependency) => {
    if (dependency.type !== 'blocked-by') return false;
    return issuesById.get(dependency.issueId)?.status !== 'done';
  });
  if (unresolvedDependencies) return 'blocked';

  const unresolvedChildren = issue.childIssueIds.some((childIssueId) => {
    return issuesById.get(childIssueId)?.status !== 'done';
  });
  if (unresolvedChildren) return 'needs-decomposition';

  const incompleteDecomposition = issue.decomposition.some(
    (item) => item.status !== 'done' && !item.issueId,
  );
  if (incompleteDecomposition) return 'needs-decomposition';

  return 'ready';
}

function resolveBlockedReasons(
  issue: Omit<KanbanIssue, 'dispatch'> & { readonly dispatch?: Partial<KanbanIssueDispatchState> },
  issuesById: ReadonlyMap<string, KanbanIssue>,
): string[] {
  const reasons = new Set<string>(issue.dispatch?.blockedReasons ?? []);

  for (const dependency of issue.dependencies) {
    if (dependency.type !== 'blocked-by') continue;
    const dependencyIssue = issuesById.get(dependency.issueId);
    if (!dependencyIssue || dependencyIssue.status !== 'done') {
      reasons.add(`waiting on ${dependency.issueId}`);
    }
  }

  if (issue.childIssueIds.some((childIssueId) => issuesById.get(childIssueId)?.status !== 'done')) {
    reasons.add('child issues still open');
  }

  if (issue.decomposition.some((item) => item.status !== 'done' && !item.issueId)) {
    reasons.add('decomposition incomplete');
  }

  return Array.from(reasons);
}

export function normalizeKanbanIssue(
  issue: Omit<KanbanIssue, 'dispatch'> & { readonly dispatch?: Partial<KanbanIssueDispatchState> },
  issuesById: ReadonlyMap<string, KanbanIssue>,
  repositoryMap: ReadonlyMap<string, KanbanRepositoryContext> = new Map(),
): KanbanIssue {
  const labels = uniqueById(issue.labels);
  const assignees = uniqueById(issue.assignees);
  const acceptanceCriteria = uniqueById(issue.acceptanceCriteria);
  const decomposition = uniqueById(issue.decomposition);
  const childIssueIds = Array.from(new Set(issue.childIssueIds));
  const readiness = resolveReadiness({ ...issue, childIssueIds, decomposition }, issuesById);
  const blockedReasons = resolveBlockedReasons({ ...issue, childIssueIds, decomposition }, issuesById);

  return {
    ...issue,
    labels,
    assignees,
    acceptanceCriteria,
    decomposition,
    childIssueIds,
    dispatch: {
      readiness,
      blockedReasons,
      runIds: Array.from(new Set(issue.dispatch?.runIds ?? [])),
      sessionIds: Array.from(new Set(issue.dispatch?.sessionIds ?? [])),
      lastDispatchedAt: issue.dispatch?.lastDispatchedAt,
    },
    repositoryLifecycle: normalizeIssueRepositoryLifecycle(issue.repositoryLifecycle, repositoryMap),
  };
}

export function resolveKanbanWorkflowState(issue: Pick<KanbanIssue, 'status'>): KanbanWorkflowState {
  switch (issue.status) {
    case 'in-progress':
    case 'blocked':
      return 'in-progress';
    case 'review':
      return 'review';
    case 'done':
      return 'done';
    case 'backlog':
    case 'ready':
    default:
      return 'todo';
  }
}

export function resolveKanbanSwimlane(
  issue: Pick<KanbanIssue, 'priority' | 'status' | 'dispatch'>,
): KanbanSwimlaneId {
  if (issue.status === 'blocked' || issue.dispatch.readiness === 'blocked') {
    return 'blocked';
  }

  if (issue.priority === 'critical' || issue.priority === 'high') {
    return 'expedite';
  }

  return 'standard';
}

export function resolveKanbanStatusForWorkflowState(
  issue: Pick<KanbanIssue, 'status' | 'dispatch'>,
  state: KanbanWorkflowState,
): KanbanIssueStatus {
  switch (state) {
    case 'todo':
      return issue.status === 'backlog' || issue.dispatch.readiness === 'needs-decomposition'
        ? 'backlog'
        : 'ready';
    case 'in-progress':
      return 'in-progress';
    case 'review':
      return 'review';
    case 'done':
      return 'done';
  }
}

export function evaluateKanbanIssueMove(input: {
  readonly project: KanbanProject;
  readonly issues: readonly KanbanIssue[];
  readonly issueId: string;
  readonly toState: KanbanWorkflowState;
}): KanbanIssueMoveEvaluation {
  const issue = input.issues.find((candidate) => candidate.id === input.issueId);
  if (!issue) {
    return {
      issueId: input.issueId,
      fromState: 'todo',
      toState: input.toState,
      allowed: false,
      signals: [createPolicySignal('dispatch-ready', `Issue ${input.issueId} does not exist.`)],
    };
  }

  const fromState = resolveKanbanWorkflowState(issue);
  const allowedStates = getAllowedMoveStates(fromState);
  const signals: KanbanBoardPolicySignal[] = [];

  if (!allowedStates.includes(input.toState)) {
    signals.push(
      createPolicySignal(
        'dispatch-ready',
        `Cannot move ${issue.key} from ${fromState} to ${input.toState}.`,
      ),
    );
  }

  if (input.toState === 'in-progress') {
    if (issue.dispatch.readiness !== 'ready' && issue.dispatch.readiness !== 'dispatched') {
      signals.push(
        createPolicySignal(
          'dispatch-ready',
          `${issue.key} is ${issue.dispatch.readiness} and cannot start active work yet.`,
        ),
      );
    }
  }

  if ((input.toState === 'review' || input.toState === 'done') && isBlockedIssue(issue)) {
    signals.push(
      createPolicySignal(
        'blocked-flow',
        `${issue.key} is blocked and cannot advance until the blocking reasons clear.`,
      ),
    );
  }

  if (input.toState === 'done') {
    const progress = acceptanceProgress(issue);
    if (progress.total > 0 && progress.satisfied < progress.total) {
      signals.push(
        createPolicySignal(
          'acceptance-complete',
          `${issue.key} has ${progress.total - progress.satisfied} acceptance checks remaining.`,
        ),
      );
    }
  }

  const wipLimit = getColumnWipLimit(input.project, input.toState);
  if (typeof wipLimit === 'number') {
    const targetCount = input.issues.filter(
      (candidate) =>
        candidate.projectId === input.project.id &&
        candidate.id !== issue.id &&
        resolveKanbanWorkflowState(candidate) === input.toState,
    ).length;
    if (targetCount + 1 > wipLimit) {
      signals.push(
        createPolicySignal(
          'wip-limit',
          `${getColumnName(input.toState)} would exceed its WIP limit of ${wipLimit}.`,
        ),
      );
    }
  }

  return {
    issueId: issue.id,
    fromState,
    toState: input.toState,
    allowed: signals.every((signal) => !signal.blocking),
    nextStatus: signals.every((signal) => !signal.blocking)
      ? resolveKanbanStatusForWorkflowState(issue, input.toState)
      : undefined,
    signals,
  };
}

export function computeKanbanProjectMetrics(issues: readonly KanbanIssue[]): KanbanProjectMetrics {
  let readyIssues = 0;
  let blockedIssues = 0;
  let dispatchedIssues = 0;
  let completedIssues = 0;
  let needsDecompositionIssues = 0;
  let inProgressIssues = 0;

  for (const issue of issues) {
    if (issue.status === 'in-progress' || issue.status === 'review') {
      inProgressIssues += 1;
    }
    switch (issue.dispatch.readiness) {
      case 'ready':
        readyIssues += 1;
        break;
      case 'blocked':
        blockedIssues += 1;
        break;
      case 'dispatched':
        dispatchedIssues += 1;
        break;
      case 'completed':
        completedIssues += 1;
        break;
      case 'needs-decomposition':
        needsDecompositionIssues += 1;
        break;
    }
  }

  return {
    totalIssues: issues.length,
    readyIssues,
    blockedIssues,
    dispatchedIssues,
    completedIssues,
    needsDecompositionIssues,
    inProgressIssues,
  };
}

export function buildKanbanBacklogSnapshot(input: {
  readonly generatedAt?: string;
  readonly projects: readonly (Omit<KanbanProject, 'metrics'> & {
    readonly repositories?: readonly KanbanRepositoryContext[];
  })[];
  readonly issues: readonly (Omit<KanbanIssue, 'dispatch'> & {
    readonly dispatch?: Partial<KanbanIssueDispatchState>;
  })[];
}): KanbanBacklogSnapshot {
  const issueSeedMap = new Map<string, KanbanIssue>();
  for (const issue of input.issues) {
    issueSeedMap.set(issue.id, {
      ...issue,
      dispatch: {
        readiness: 'ready',
        blockedReasons: [],
        runIds: [],
        sessionIds: [],
      },
    });
  }

  const projects = input.projects.map((project) => ({
    ...project,
    labels: uniqueById(project.labels),
    assignees: uniqueById(project.assignees),
    statuses: project.statuses.length > 0 ? project.statuses : DEFAULT_PROJECT_STATUSES,
    repositories: uniqueById((project.repositories ?? []).map(normalizeRepositoryContext)),
  }));
  const repositoryMapByProject = new Map(
    projects.map((project) => [project.id, new Map(project.repositories.map((repository) => [repository.id, repository]))]),
  );

  const normalizedIssues = input.issues.map((issue) =>
    normalizeKanbanIssue(issue, issueSeedMap, repositoryMapByProject.get(issue.projectId)),
  );
  const normalizedIssueMap = new Map(normalizedIssues.map((issue) => [issue.id, issue]));

  const projectsWithMetrics = projects.map((project) => {
    const statuses = project.statuses.length > 0 ? project.statuses : DEFAULT_PROJECT_STATUSES;
    const issueIds = Array.from(
      new Set([
        ...project.issueIds,
        ...normalizedIssues
          .filter((issue) => issue.projectId === project.id)
          .map((issue) => issue.id),
      ]),
    );
    const projectIssues = issueIds
      .map((issueId) => normalizedIssueMap.get(issueId))
      .filter((issue): issue is KanbanIssue => Boolean(issue));

    return {
      ...project,
      statuses,
      issueIds,
      metrics: computeKanbanProjectMetrics(projectIssues),
    };
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    projects: projectsWithMetrics,
    issues: normalizedIssues,
  };
}

export function buildKanbanProjectBoard(input: {
  readonly generatedAt?: string;
  readonly project: KanbanProject;
  readonly issues: readonly KanbanIssue[];
}): KanbanProjectBoard {
  const projectIssues = input.issues.filter((issue) => issue.projectId === input.project.id);
  const repositoryMap = new Map(
    input.project.repositories.map((repository) => [repository.id, repository]),
  );
  const cards: KanbanBoardCard[] = projectIssues.map((issue) => {
    const workflowState = resolveKanbanWorkflowState(issue);
    const swimlaneId = resolveKanbanSwimlane(issue);
    const signals: KanbanBoardPolicySignal[] = [];
    const progress = acceptanceProgress(issue);
    const repository = issue.repositoryLifecycle
      ? repositoryMap.get(issue.repositoryLifecycle.repositoryId)
      : undefined;

    if (isBlockedIssue(issue)) {
      for (const reason of issue.dispatch.blockedReasons) {
        signals.push(createPolicySignal('blocked-flow', reason, false));
      }
    }

    if (issue.dispatch.readiness === 'needs-decomposition') {
      signals.push(
        createPolicySignal(
          'dispatch-ready',
          `${issue.key} still needs decomposition before it can be dispatched.`,
          false,
        ),
      );
    }

    const currentLimit = getColumnWipLimit(input.project, workflowState);
    if (typeof currentLimit === 'number') {
      const currentCount = projectIssues.filter(
        (candidate) => resolveKanbanWorkflowState(candidate) === workflowState,
      ).length;
      if (currentCount > currentLimit) {
        signals.push(
          createPolicySignal(
            'wip-limit',
            `${getColumnName(workflowState)} is over its WIP limit (${currentCount}/${currentLimit}).`,
            false,
          ),
        );
      }
    }

    if (issue.repositoryLifecycle?.ciGates.some((gate) => gate.required && gate.status === 'failing')) {
      signals.push(createPolicySignal('repo-ci', `${issue.key} has failing required CI gates.`, false));
    }
    if (issue.repositoryLifecycle?.pullRequest && issue.repositoryLifecycle.mergeStatus === 'ready') {
      signals.push(
        createPolicySignal(
          'merge-status',
          `${issue.key} is approved and ready to merge.`,
          false,
        ),
      );
    }
    if (issue.repositoryLifecycle?.publishStatus === 'published') {
      signals.push(
        createPolicySignal(
          'publish-status',
          `${issue.key} has already been published.`,
          false,
        ),
      );
    }

    return {
      issueId: issue.id,
      issueKey: issue.key,
      projectId: issue.projectId,
      title: issue.title,
      summary: issue.summary,
      workflowState,
      swimlaneId,
      priority: issue.priority,
      readiness: issue.dispatch.readiness,
      blocked: isBlockedIssue(issue),
      blockedReasons: issue.dispatch.blockedReasons,
      labelNames: uniqueStrings(issue.labels.map((label) => label.name)),
      assigneeNames: uniqueStrings(issue.assignees.map((assignee) => assignee.displayName)),
      dependencyCount: issue.dependencies.length,
      childCount: issue.childIssueIds.length,
      acceptanceProgress: progress,
      repository,
      repositoryLifecycle: issue.repositoryLifecycle,
      moveTargets: getAllowedMoveStates(workflowState).map((state) => {
        const evaluation = evaluateKanbanIssueMove({
          project: input.project,
          issues: projectIssues,
          issueId: issue.id,
          toState: state,
        });
        return {
          state,
          allowed: evaluation.allowed,
          signals: evaluation.signals,
        };
      }),
      policySignals: signals,
      review: issue.review,
    };
  });

  const columns = WORKFLOW_STATE_ORDER.map((state) => {
    const issueIds = cards
      .filter((card) => card.workflowState === state)
      .map((card) => card.issueId);
    const wipLimit = getColumnWipLimit(input.project, state);
    return {
      id: state,
      name: getColumnName(state),
      issueIds,
      issueCount: issueIds.length,
      wipLimit,
      isOverLimit: typeof wipLimit === 'number' ? issueIds.length > wipLimit : false,
    };
  });

  const swimlanes = DEFAULT_SWIMLANES.map((swimlane) => ({
    ...swimlane,
    issueIds: cards
      .filter((card) => card.swimlaneId === swimlane.id)
      .map((card) => card.issueId),
  }));

  return {
    projectId: input.project.id,
    projectKey: input.project.key,
    projectName: input.project.name,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    columns,
    swimlanes,
    cards,
    policyHooks: DEFAULT_BOARD_POLICY_HOOKS,
  };
}

export function buildKanbanBoardSnapshot(snapshot: KanbanBacklogSnapshot): KanbanBoardSnapshot {
  return {
    generatedAt: snapshot.generatedAt,
    projects: snapshot.projects.map((project) =>
      buildKanbanProjectBoard({
        generatedAt: snapshot.generatedAt,
        project,
        issues: snapshot.issues,
      }),
    ),
  };
}

export function upsertKanbanProjectRepository<
  TProject extends { readonly repositories?: readonly KanbanRepositoryContext[] },
>(project: TProject, repository: KanbanRepositoryContext): TProject {
  const repositories = uniqueById([
    ...(project.repositories ?? []).filter((candidate) => candidate.id !== repository.id),
    normalizeRepositoryContext(repository),
  ]);
  return {
    ...project,
    repositories,
  };
}

export function updateKanbanProjectRepositorySettings<
  TProject extends { readonly repositories?: readonly KanbanRepositoryContext[] },
>(
  project: TProject,
  input: {
    readonly repositoryId: string;
    readonly settings: Partial<KanbanRepositorySettings>;
  },
): TProject {
  return {
    ...project,
    repositories: (project.repositories ?? []).map((repository) =>
      repository.id === input.repositoryId
        ? {
            ...repository,
            settings: normalizeRepositorySettings(
              {
                ...repository.settings,
                ...input.settings,
              },
              repository.defaultBranch,
            ),
          }
        : repository,
    ),
  };
}

export function linkKanbanIssueRepository<
  TIssue extends { readonly repositoryLifecycle?: KanbanIssueRepositoryLifecycle },
>(
  issue: TIssue,
  input: {
    readonly repositoryId: string;
    readonly branchName: string;
  },
): TIssue {
  return {
    ...issue,
    repositoryLifecycle: {
      repositoryId: input.repositoryId,
      branchName: input.branchName.trim(),
      reviewStatus: issue.repositoryLifecycle?.reviewStatus ?? 'unlinked',
      mergeStatus: issue.repositoryLifecycle?.mergeStatus ?? 'not-ready',
      publishStatus: issue.repositoryLifecycle?.publishStatus ?? 'not-ready',
      ciGates: issue.repositoryLifecycle?.ciGates ?? [],
      pullRequest: issue.repositoryLifecycle?.pullRequest,
      publishUrl: issue.repositoryLifecycle?.publishUrl,
      lastPublishedAt: issue.repositoryLifecycle?.lastPublishedAt,
    },
  };
}

export function createKanbanIssuePullRequest<
  TIssue extends { readonly repositoryLifecycle?: KanbanIssueRepositoryLifecycle },
>(
  issue: TIssue,
  input: {
    readonly title: string;
    readonly number: number;
    readonly now: string;
    readonly baseBranch: string;
    readonly branchName: string;
    readonly reviewLinks?: readonly Omit<KanbanPullRequestReviewLink, 'id'>[];
    readonly url?: string;
  },
): TIssue {
  if (!issue.repositoryLifecycle) {
    return issue;
  }

  const reviewLinks = (input.reviewLinks ?? []).map((reviewLink, index) => ({
    ...reviewLink,
    id: `${issue.repositoryLifecycle!.repositoryId}-review-${index + 1}`,
  }));

  return {
    ...issue,
    repositoryLifecycle: {
      ...issue.repositoryLifecycle,
      branchName: input.branchName.trim(),
      reviewStatus: reviewLinks.length > 0 ? 'pending' : 'unlinked',
      mergeStatus: 'blocked',
      ciGates:
        issue.repositoryLifecycle.ciGates.length > 0
          ? issue.repositoryLifecycle.ciGates
          : [
              {
                id: `${issue.repositoryLifecycle.repositoryId}-ci-build`,
                name: 'Build',
                required: true,
                status: 'pending',
              },
              {
                id: `${issue.repositoryLifecycle.repositoryId}-ci-tests`,
                name: 'Tests',
                required: true,
                status: 'pending',
              },
            ],
      pullRequest: {
        id: `${issue.repositoryLifecycle.repositoryId}-pr-${input.number}`,
        number: input.number,
        title: input.title.trim(),
        status: reviewLinks.length > 0 ? 'in-review' : 'open',
        branchName: input.branchName.trim(),
        baseBranch: input.baseBranch.trim(),
        mergeStatus: 'blocked',
        reviewLinks,
        url: input.url?.trim() || undefined,
        createdAt: input.now,
        updatedAt: input.now,
      },
    },
  };
}
