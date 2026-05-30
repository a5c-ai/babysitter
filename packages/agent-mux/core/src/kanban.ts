import type { WorkspaceRebaseSurface, WorkspaceRuntimeSurface } from './session-types.js';

export type KanbanPriority = 'critical' | 'high' | 'medium' | 'low';
export type KanbanCollaboratorRole = 'owner' | 'maintainer' | 'contributor' | 'viewer';
export type KanbanEntityVisibility = 'private' | 'team' | 'workspace-shared';
export type KanbanActivityEntityType = 'project' | 'issue' | 'board' | 'workspace';
export type KanbanActivityActorKind = 'human' | 'agent' | 'system';
export type KanbanPermissionAction =
  | 'manage-project-settings'
  | 'manage-team-members'
  | 'edit-board'
  | 'assign-issues'
  | 'review-work'
  | 'manage-workspaces';

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

export type KanbanIntegrationProvider = 'github' | 'azure-repos';

export type KanbanIntegrationStatus =
  | 'connected'
  | 'disconnected'
  | 'partial-setup'
  | 'expired-auth'
  | 'missing-scopes'
  | 'failing';

export type KanbanPullRequestLinkState = 'unlinked' | 'linked' | 'partially-linked';

export type KanbanRepositoryProvider = KanbanIntegrationProvider | 'gitlab' | 'bitbucket' | 'local';

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
export type KanbanDiffPresentation = 'unified' | 'split';

export type KanbanReviewCommentStatus = 'open' | 'resolved';

export type KanbanReviewCommentSide = 'base' | 'head';
export type KanbanReviewExecutionTargetKind = 'workspace' | 'session' | 'run';

export type KanbanTaskTagScopeKind = 'global' | 'project' | 'workspace';

export interface KanbanDispatchContextLabelDefinition {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly instruction: string;
  readonly description?: string;
  readonly order: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KanbanDispatchContextLabelRef {
  readonly labelId: string;
}

export interface KanbanDispatchContextLabelProjection {
  readonly labelId: string;
  readonly key: string;
  readonly label: string;
  readonly instruction: string;
}

export interface KanbanExecutionContextEnvelope {
  readonly kind: 'dispatch-context-labels';
  readonly project: {
    readonly id: string;
    readonly key?: string;
    readonly name?: string;
  };
  readonly issue: {
    readonly id: string;
    readonly key: string;
    readonly title: string;
  };
  readonly dispatch: {
    readonly runIds: readonly string[];
    readonly sessionIds: readonly string[];
    readonly labelIds: readonly string[];
    readonly labels: readonly KanbanDispatchContextLabelProjection[];
    readonly renderedContext?: string;
    readonly lastDispatchedAt?: string;
  };
  readonly block: string;
}

export interface KanbanDispatchContextExecutionEnvelope {
  readonly source: 'dispatch-context-labels';
  readonly appliedLabels: readonly KanbanDispatchContextLabelProjection[];
  readonly renderedBlock: string;
  readonly metadata: {
    readonly labelIds: readonly string[];
    readonly labelKeys: readonly string[];
    readonly labelCount: number;
  };
}

export interface KanbanLabel {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly description?: string;
}

export interface KanbanTaskTagScope {
  readonly kind: KanbanTaskTagScopeKind;
  readonly refId?: string;
}

export interface KanbanTaskTag {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly content: string;
  readonly description?: string;
  readonly order: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly scope?: KanbanTaskTagScope;
}

export interface KanbanAssignee {
  readonly id: string;
  readonly displayName: string;
  readonly email?: string;
  readonly avatarUrl?: string;
}

export interface KanbanCollaborator extends KanbanAssignee {
  readonly role: KanbanCollaboratorRole;
}

export interface KanbanPermissionGrant {
  readonly action: KanbanPermissionAction;
  readonly roles: readonly KanbanCollaboratorRole[];
  readonly description?: string;
}

export interface KanbanTeamSettings {
  readonly visibility: KanbanEntityVisibility;
  readonly defaultRole: KanbanCollaboratorRole;
  readonly allowSelfAssign: boolean;
}

export interface KanbanProjectSettings {
  readonly reviewRequiredForDone: boolean;
  readonly activityScope: 'project-and-issues' | 'all-board-entities';
  readonly workspaceProvisioning: 'owners-maintainers' | 'contributors-and-up';
}

export interface KanbanActivityActor {
  readonly kind: KanbanActivityActorKind;
  readonly id: string;
  readonly displayName: string;
  readonly role?: KanbanCollaboratorRole;
}

export interface KanbanActivityEntry {
  readonly id: string;
  readonly entityType: KanbanActivityEntityType;
  readonly entityId: string;
  readonly action: string;
  readonly summary: string;
  readonly actor: KanbanActivityActor;
  readonly createdAt: string;
}

export interface KanbanTeam {
  readonly id: string;
  readonly name: string;
  readonly members: readonly KanbanCollaborator[];
  readonly settings: KanbanTeamSettings;
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
  readonly contextLabels: readonly KanbanDispatchContextLabelRef[];
  readonly contextLabelProjections: readonly KanbanDispatchContextLabelProjection[];
  readonly executionContext?: KanbanDispatchContextExecutionEnvelope;
  readonly renderedContext?: string;
  readonly lastDispatchedAt?: string;
}

export interface KanbanIssueSource {
  readonly kind: 'seed' | 'file' | 'run-derived';
  readonly path?: string;
  readonly externalId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface KanbanIssueWorkspaceLink {
  readonly workspacePath: string;
  readonly workspaceName: string;
  readonly branchName?: string;
  readonly linkedAt: string;
  readonly source: 'created-from-issue' | 'linked-existing-workspace';
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

export interface KanbanIntegrationPrerequisite {
  readonly key: string;
  readonly label: string;
  readonly satisfied: boolean;
  readonly guidance?: string;
}

export interface KanbanIntegrationActionState {
  readonly canCreatePullRequest: boolean;
  readonly canManagePullRequest: boolean;
  readonly canApproveFromReview: boolean;
  readonly reason?: string;
}

export interface KanbanIntegrationConnection {
  readonly provider: KanbanIntegrationProvider;
  readonly label: string;
  readonly status: KanbanIntegrationStatus;
  readonly accountLabel?: string;
  readonly connectedAt?: string;
  readonly failureMessage?: string;
  readonly missingScopes?: readonly string[];
  readonly prerequisites: readonly KanbanIntegrationPrerequisite[];
  readonly guidance: string;
  readonly actions: KanbanIntegrationActionState;
}

export interface KanbanRepositoryIntegrationState {
  readonly provider: KanbanIntegrationProvider;
  readonly status: KanbanIntegrationStatus;
  readonly linkState: KanbanPullRequestLinkState;
  readonly failureMessage?: string;
  readonly guidance: string;
  readonly missingScopes?: readonly string[];
  readonly prerequisites: readonly KanbanIntegrationPrerequisite[];
  readonly actions: KanbanIntegrationActionState;
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
  readonly linkState?: KanbanPullRequestLinkState;
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
  readonly integration?: KanbanRepositoryIntegrationState;
  readonly publishUrl?: string;
  readonly lastPublishedAt?: string;
}

export interface KanbanLinkedPullRequestSummary {
  readonly provider: KanbanIntegrationProvider;
  readonly status: KanbanPullRequestStatus;
  readonly linkState: KanbanPullRequestLinkState;
  readonly title: string;
  readonly number?: number;
  readonly url?: string;
  readonly branchName?: string;
  readonly baseBranch?: string;
  readonly reviewStatus?: KanbanReviewStatus;
  readonly mergeStatus?: KanbanMergeStatus;
  readonly publishStatus?: KanbanPublishStatus;
  readonly ciGates?: readonly KanbanCiGate[];
  readonly integrationStatus: KanbanIntegrationStatus;
  readonly guidance?: string;
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

export interface KanbanReviewExecutionTarget {
  readonly id: string;
  readonly kind: KanbanReviewExecutionTargetKind;
  readonly label: string;
  readonly href: string;
  readonly description?: string;
  readonly actionLabel?: string;
}

export interface KanbanReviewSubmission {
  readonly decision: KanbanReviewDecision;
  readonly summary?: string;
  readonly submittedAt: string;
  readonly executionTargetId?: string;
  readonly executionTargetLabel?: string;
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
  readonly preferredPresentation?: KanbanDiffPresentation;
  readonly executionTargets?: readonly KanbanReviewExecutionTarget[];
  readonly latestSubmission?: KanbanReviewSubmission;
  readonly integration?: KanbanRepositoryIntegrationState;
  readonly linkedPullRequest?: KanbanLinkedPullRequestSummary;
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
  readonly collaborators: readonly KanbanCollaborator[];
  readonly dependencies: readonly KanbanIssueDependency[];
  readonly acceptanceCriteria: readonly KanbanAcceptanceCriterion[];
  readonly decomposition: readonly KanbanDecompositionItem[];
  readonly childIssueIds: readonly string[];
  readonly parentIssueId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dispatch: KanbanIssueDispatchState;
  readonly repositoryLifecycle?: KanbanIssueRepositoryLifecycle;
  readonly workspaceLinks?: readonly KanbanIssueWorkspaceLink[];
  readonly activity: readonly KanbanActivityEntry[];
  readonly source?: KanbanIssueSource;
  readonly metadata?: Readonly<Record<string, unknown>>;
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
  readonly team: KanbanTeam;
  readonly settings: KanbanProjectSettings;
  readonly permissions: readonly KanbanPermissionGrant[];
  readonly activity: readonly KanbanActivityEntry[];
  readonly statuses: readonly KanbanStatusDefinition[];
  readonly repositories: readonly KanbanRepositoryContext[];
  readonly integrations: readonly KanbanIntegrationConnection[];
  readonly linkedRunProjectName?: string;
  readonly linkedRunSummary?: LinkedRunSummary;
  readonly metrics: KanbanProjectMetrics;
}

export interface KanbanBacklogSnapshot {
  readonly generatedAt: string;
  readonly projects: readonly KanbanProject[];
  readonly issues: readonly KanbanIssue[];
  readonly dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
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
  readonly collaboratorNames: readonly string[];
  readonly dependencyCount: number;
  readonly childCount: number;
  readonly activityCount: number;
  readonly latestActivityAt?: string;
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

export interface KanbanBacklogSummary {
  readonly projectCount: number;
  readonly issueCount: number;
  readonly readyCount: number;
  readonly blockedCount: number;
  readonly dispatchedCount: number;
  readonly completedCount: number;
  readonly needsDecompositionCount: number;
  readonly inProgressCount: number;
}

export interface KanbanBacklogOverview {
  readonly snapshot: KanbanBacklogSnapshot;
  readonly board: KanbanBoardSnapshot;
  readonly summary: KanbanBacklogSummary;
}

export interface KanbanIssueCreateInput {
  readonly projectId?: string;
  readonly parentIssueId?: string;
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

export interface KanbanIssueCreateResult {
  readonly overview: KanbanBacklogOverview;
  readonly issue: KanbanIssue;
}

export interface KanbanIssueMoveInput {
  readonly issueId: string;
  readonly toState: KanbanWorkflowState;
}

export interface KanbanIssueUpdateInput {
  readonly issueId: string;
  readonly expectedUpdatedAt?: string;
  readonly description?: string;
  readonly priority?: KanbanIssue['priority'];
  readonly assigneeIds?: readonly string[];
  readonly labelIds?: readonly string[];
}

export interface KanbanIssueWorkspaceRef {
  readonly path: string;
  readonly name: string;
  readonly branchName: string;
}

export interface KanbanIssueWorkspaceCreateResult {
  readonly workspace: KanbanIssueWorkspaceRef;
  readonly overview: KanbanBacklogOverview;
}

export interface KanbanIssueWorkspaceLinkInput {
  readonly issueId: string;
  readonly workspacePath: string;
  readonly workspaceName?: string;
  readonly branchName?: string;
  readonly source: 'created-from-issue' | 'linked-existing-workspace';
}

export type KanbanWorkspaceStatus = 'active' | 'idle' | 'archived' | 'missing';

export type KanbanWorkspaceAction =
  | 'pin'
  | 'unpin'
  | 'archive'
  | 'cleanup'
  | 'recover'
  | 'notes-save'
  | 'rebase-start'
  | 'rebase-auto-resolve'
  | 'rebase-open-in-editor'
  | 'rebase-mark-resolved'
  | 'rebase-abort';

export interface KanbanWorkspaceSessionSummary {
  readonly sessionId: string;
  readonly agent: string;
  readonly status: 'active' | 'inactive';
  readonly cwd?: string;
  readonly title?: string;
  readonly updatedAt?: number;
  readonly activeRunId?: string | null;
  readonly latestRunId?: string | null;
  readonly runtime?: WorkspaceRuntimeSurface;
}

export interface KanbanWorkspaceIssueSummary {
  readonly issueId: string;
  readonly issueKey: string;
  readonly issueTitle: string;
  readonly projectId: string;
  readonly projectKey: string;
  readonly projectName: string;
  readonly linkedAt: string;
  readonly source: 'created-from-issue' | 'linked-existing-workspace';
}

export interface KanbanWorkspaceOwnershipProjectSummary {
  readonly projectId: string;
  readonly projectKey: string;
  readonly projectName: string;
}

export interface KanbanWorkspaceOwnershipIssueSummary {
  readonly issueId: string;
  readonly issueKey: string;
  readonly issueTitle: string;
}

export interface KanbanWorkspaceOwnershipHostSummary {
  readonly provider: KanbanIntegrationProvider;
  readonly label: string;
  readonly accountLabel?: string;
}

export interface KanbanWorkspaceOwnershipSummary {
  readonly source:
    | 'created-from-issue'
    | 'linked-existing-workspace'
    | 'created-from-project'
    | 'created-from-host';
  readonly project?: KanbanWorkspaceOwnershipProjectSummary;
  readonly issue?: KanbanWorkspaceOwnershipIssueSummary;
  readonly host?: KanbanWorkspaceOwnershipHostSummary;
}

export interface KanbanWorkspaceRunSummary {
  readonly runId: string;
  readonly status: string;
  readonly projectName?: string;
}

export interface KanbanWorkspaceGitSummary {
  readonly root: string | null;
  readonly commonDir: string | null;
  readonly trackingBranch: string | null;
  readonly branch: string | null;
  readonly head: string | null;
  readonly ahead: number | null;
  readonly behind: number | null;
  readonly dirty: boolean | null;
  readonly uncommittedCount: number | null;
  readonly isWorktree: boolean;
  readonly isPrimary: boolean;
}

export interface KanbanWorkspaceNotesSummary {
  readonly value: string;
  readonly updatedAt: string | null;
}

export interface KanbanWorkspaceLinks {
  readonly editorHref: string | null;
}

export interface KanbanWorkspaceSessionCollection {
  readonly total: number;
  readonly active: number;
  readonly items: readonly KanbanWorkspaceSessionSummary[];
}

export interface KanbanWorkspaceRunCollection {
  readonly total: number;
  readonly active: number;
  readonly items: readonly KanbanWorkspaceRunSummary[];
}

export interface KanbanWorkspaceActionAvailability {
  readonly canPin?: boolean;
  readonly canUnpin?: boolean;
  readonly canArchive: boolean;
  readonly canCleanup: boolean;
  readonly canRecover: boolean;
  readonly canRebaseStart: boolean;
  readonly canRebaseAutoResolve: boolean;
  readonly canRebaseOpenInEditor: boolean;
  readonly canRebaseMarkResolved: boolean;
  readonly canRebaseAbort: boolean;
}

export interface KanbanWorkspaceSummary {
  readonly path: string;
  readonly name: string;
  readonly status: KanbanWorkspaceStatus;
  readonly pinnedAt?: string | null;
  readonly missing: boolean;
  readonly archivedAt: string | null;
  readonly cleanedAt: string | null;
  readonly lastActivityAt: string | null;
  readonly git: KanbanWorkspaceGitSummary;
  readonly notes: KanbanWorkspaceNotesSummary;
  readonly links: KanbanWorkspaceLinks;
  readonly sessions: KanbanWorkspaceSessionCollection;
  readonly runs: KanbanWorkspaceRunCollection;
  readonly rebase?: WorkspaceRebaseSurface;
  readonly actions: KanbanWorkspaceActionAvailability;
  readonly review?: KanbanReviewSummary;
  readonly issues?: readonly KanbanWorkspaceIssueSummary[];
  readonly ownership?: KanbanWorkspaceOwnershipSummary;
}

export interface KanbanWorkspaceInventory {
  readonly workspaces: readonly KanbanWorkspaceSummary[];
  readonly summary: {
    readonly total: number;
    readonly active: number;
    readonly idle: number;
    readonly archived: number;
    readonly missing: number;
  };
}

export interface KanbanWorkspaceActionResult {
  readonly ok: boolean;
  readonly workspacePath: string;
  readonly action: KanbanWorkspaceAction;
  readonly message: string;
}

export interface KanbanWorkspaceActionResponse {
  readonly result: KanbanWorkspaceActionResult;
  readonly inventory: KanbanWorkspaceInventory;
}

export interface KanbanWorkspaceInventoryQuery {
  readonly sessions?: readonly KanbanWorkspaceSessionSummary[];
}

export interface KanbanWorkspaceActionInput {
  readonly action: KanbanWorkspaceAction;
  readonly workspacePath: string;
  readonly note?: string;
  readonly sessions?: readonly KanbanWorkspaceSessionSummary[];
}

const DEFAULT_PROJECT_STATUSES: readonly KanbanStatusDefinition[] = [
  { id: 'backlog', name: 'Backlog', kind: 'backlog' },
  { id: 'ready', name: 'Ready', kind: 'backlog' },
  { id: 'in-progress', name: 'In Progress', kind: 'active', wipLimit: 3 },
  { id: 'review', name: 'Review', kind: 'active', wipLimit: 3 },
  { id: 'done', name: 'Done', kind: 'done' },
];

const DEFAULT_TEAM_SETTINGS: KanbanTeamSettings = {
  visibility: 'team',
  defaultRole: 'contributor',
  allowSelfAssign: true,
};

const DEFAULT_PROJECT_SETTINGS: KanbanProjectSettings = {
  reviewRequiredForDone: true,
  activityScope: 'project-and-issues',
  workspaceProvisioning: 'owners-maintainers',
};

const DEFAULT_PERMISSION_GRANTS: readonly KanbanPermissionGrant[] = [
  {
    action: 'manage-project-settings',
    roles: ['owner', 'maintainer'],
    description: 'Only owners and maintainers can change shared project settings.',
  },
  {
    action: 'manage-team-members',
    roles: ['owner', 'maintainer'],
    description: 'Team roster and role changes require elevated project roles.',
  },
  {
    action: 'edit-board',
    roles: ['owner', 'maintainer', 'contributor'],
    description: 'Contributors can move cards and edit the shared board.',
  },
  {
    action: 'assign-issues',
    roles: ['owner', 'maintainer', 'contributor'],
    description: 'Contributors can collaborate and self-assign when team settings allow it.',
  },
  {
    action: 'review-work',
    roles: ['owner', 'maintainer', 'contributor', 'viewer'],
    description: 'Every collaborator can participate in review and activity visibility.',
  },
  {
    action: 'manage-workspaces',
    roles: ['owner', 'maintainer'],
    description: 'Workspace lifecycle actions remain restricted to trusted roles.',
  },
];

const WORKFLOW_STATE_ORDER: readonly KanbanWorkflowState[] = [
  'todo',
  'in-progress',
  'review',
  'done',
];

const WORKFLOW_STATE_COLUMNS = {
  todo: {
    name: 'Todo',
    enforcesWipLimit: false,
    allowedMoveStates: ['in-progress'],
    defaultStatus: 'ready',
  },
  'in-progress': {
    name: 'In Progress',
    enforcesWipLimit: true,
    allowedMoveStates: ['todo', 'review'],
    defaultStatus: 'in-progress',
  },
  review: {
    name: 'Review',
    enforcesWipLimit: true,
    allowedMoveStates: ['in-progress', 'done'],
    defaultStatus: 'review',
  },
  done: {
    name: 'Done',
    enforcesWipLimit: false,
    allowedMoveStates: ['review'],
    defaultStatus: 'done',
  },
} satisfies Record<
  KanbanWorkflowState,
  {
    readonly name: string;
    readonly enforcesWipLimit: boolean;
    readonly allowedMoveStates: readonly KanbanWorkflowState[];
    readonly defaultStatus: KanbanIssueStatus;
  }
>;

const ISSUE_STATUS_WORKFLOW_STATES = {
  backlog: 'todo',
  ready: 'todo',
  'in-progress': 'in-progress',
  blocked: 'in-progress',
  review: 'review',
  done: 'done',
} satisfies Record<KanbanIssueStatus, KanbanWorkflowState>;

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

export function normalizeKanbanTaskTagKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function normalizeKanbanDispatchContextLabelKey(value: string): string {
  return normalizeKanbanTaskTagKey(value);
}

function compareKanbanDispatchContextLabels(
  left: KanbanDispatchContextLabelDefinition,
  right: KanbanDispatchContextLabelDefinition,
): number {
  return (
    left.order - right.order ||
    left.label.localeCompare(right.label) ||
    left.key.localeCompare(right.key) ||
    left.id.localeCompare(right.id)
  );
}

export function normalizeKanbanDispatchContextLabel(
  label: Omit<KanbanDispatchContextLabelDefinition, 'key' | 'instruction' | 'order'> & {
    readonly key?: string;
    readonly instruction: string;
    readonly order?: number;
  },
): KanbanDispatchContextLabelDefinition {
  const normalizedLabel = label.label.trim();
  const normalizedKey = normalizeKanbanDispatchContextLabelKey(label.key ?? normalizedLabel);
  return {
    ...label,
    label: normalizedLabel,
    key: normalizedKey || normalizeKanbanDispatchContextLabelKey(label.id),
    instruction: label.instruction.replace(/\r\n?/g, '\n').trim(),
    description: label.description?.trim() || undefined,
    order:
      typeof label.order === 'number' && Number.isFinite(label.order)
        ? Math.max(0, Math.floor(label.order))
        : 0,
  };
}

export function normalizeKanbanDispatchContextLabels(
  labels: readonly (Omit<KanbanDispatchContextLabelDefinition, 'key' | 'instruction' | 'order'> & {
    readonly key?: string;
    readonly instruction: string;
    readonly order?: number;
  })[],
): KanbanDispatchContextLabelDefinition[] {
  return labels
    .map((label) => normalizeKanbanDispatchContextLabel(label))
    .sort(compareKanbanDispatchContextLabels);
}

export function normalizeKanbanDispatchContextLabelRefs(
  refs: readonly (KanbanDispatchContextLabelRef | { readonly labelId?: string })[],
): KanbanDispatchContextLabelRef[] {
  return Array.from(
    new Set(
      refs
        .map((ref) => ref.labelId?.trim() || '')
        .filter(Boolean),
    ),
  ).map((labelId) => ({ labelId }));
}

export function projectDispatchContextLabels(
  definitions: readonly KanbanDispatchContextLabelDefinition[],
  refs: readonly KanbanDispatchContextLabelRef[],
): KanbanDispatchContextLabelProjection[] {
  const definitionMap = new Map(definitions.map((definition) => [definition.id, definition]));
  return normalizeKanbanDispatchContextLabelRefs(refs)
    .map((ref) => definitionMap.get(ref.labelId))
    .filter((definition): definition is KanbanDispatchContextLabelDefinition => Boolean(definition))
    .sort(compareKanbanDispatchContextLabels)
    .map((definition) => ({
      labelId: definition.id,
      key: definition.key,
      label: definition.label,
      instruction: definition.instruction,
    }));
}

export function renderDispatchContextLabels(
  definitions: readonly KanbanDispatchContextLabelDefinition[],
  refs: readonly KanbanDispatchContextLabelRef[],
): string {
  return projectDispatchContextLabels(definitions, refs)
    .map((projection) => `- [${projection.key}] ${projection.instruction}`)
    .join('\n');
}

export function renderKanbanExecutionContextBlock(input: {
  readonly projectId: string;
  readonly projectKey?: string;
  readonly projectName?: string;
  readonly issueId: string;
  readonly issueKey: string;
  readonly issueTitle: string;
  readonly runIds?: readonly string[];
  readonly sessionIds?: readonly string[];
  readonly labelIds?: readonly string[];
  readonly labels?: readonly KanbanDispatchContextLabelProjection[];
  readonly renderedContext?: string;
  readonly lastDispatchedAt?: string;
}): string {
  const labelIds = Array.from(new Set(input.labelIds ?? []));
  const labels = input.labels ?? [];
  const projectSummary = input.projectKey?.trim()
    ? input.projectName?.trim()
      ? `${input.projectKey} (${input.projectName})`
      : input.projectKey
    : input.projectName?.trim() || input.projectId;
  const labelSummary = labels.length > 0
    ? labels.map((label) => `- ${label.key} (${label.labelId}): ${label.label}`).join('\n')
    : labelIds.length > 0
      ? labelIds.map((labelId) => `- ${labelId}`).join('\n')
      : '- none';
  const renderedContext = input.renderedContext?.trim() || '- none';
  const runSummary = (input.runIds ?? []).length > 0 ? (input.runIds ?? []).join(', ') : 'none';
  const sessionSummary = (input.sessionIds ?? []).length > 0 ? (input.sessionIds ?? []).join(', ') : 'none';

  return [
    'Execution Context',
    `Project: ${projectSummary}`,
    `Issue: ${input.issueKey} (${input.issueId})`,
    `Title: ${input.issueTitle}`,
    `Applied Dispatch Context Labels (${labelIds.length}):`,
    labelSummary,
    `Run IDs: ${runSummary}`,
    `Session IDs: ${sessionSummary}`,
    `Last Dispatched At: ${input.lastDispatchedAt ?? 'none'}`,
    'Rendered Dispatch Context:',
    renderedContext,
  ].join('\n');
}

export function buildKanbanExecutionContextEnvelope(input: {
  readonly issue: Pick<KanbanIssue, 'id' | 'key' | 'title' | 'projectId' | 'dispatch'>;
  readonly project?: Pick<KanbanProject, 'id' | 'key' | 'name'>;
}): KanbanExecutionContextEnvelope | undefined {
  const labelIds = normalizeKanbanDispatchContextLabelRefs(input.issue.dispatch.contextLabels).map((ref) => ref.labelId);
  const labels = input.issue.dispatch.contextLabelProjections ?? [];
  const renderedContext = input.issue.dispatch.renderedContext?.trim() || undefined;

  if (labelIds.length === 0 && labels.length === 0 && !renderedContext) {
    return undefined;
  }

  return {
    kind: 'dispatch-context-labels',
    project: {
      id: input.project?.id ?? input.issue.projectId,
      key: input.project?.key,
      name: input.project?.name,
    },
    issue: {
      id: input.issue.id,
      key: input.issue.key,
      title: input.issue.title,
    },
    dispatch: {
      runIds: Array.from(new Set(input.issue.dispatch.runIds ?? [])),
      sessionIds: Array.from(new Set(input.issue.dispatch.sessionIds ?? [])),
      labelIds,
      labels,
      renderedContext,
      lastDispatchedAt: input.issue.dispatch.lastDispatchedAt,
    },
    block: renderKanbanExecutionContextBlock({
      projectId: input.project?.id ?? input.issue.projectId,
      projectKey: input.project?.key,
      projectName: input.project?.name,
      issueId: input.issue.id,
      issueKey: input.issue.key,
      issueTitle: input.issue.title,
      runIds: input.issue.dispatch.runIds,
      sessionIds: input.issue.dispatch.sessionIds,
      labelIds,
      labels,
      renderedContext,
      lastDispatchedAt: input.issue.dispatch.lastDispatchedAt,
    }),
  };
}

export function buildDispatchContextExecutionEnvelope(
  definitions: readonly KanbanDispatchContextLabelDefinition[],
  refs: readonly KanbanDispatchContextLabelRef[],
): KanbanDispatchContextExecutionEnvelope | undefined {
  const appliedLabels = projectDispatchContextLabels(definitions, refs);
  if (appliedLabels.length === 0) {
    return undefined;
  }

  return {
    source: 'dispatch-context-labels',
    appliedLabels,
    renderedBlock: renderDispatchContextLabels(definitions, refs),
    metadata: {
      labelIds: appliedLabels.map((projection) => projection.labelId),
      labelKeys: appliedLabels.map((projection) => projection.key),
      labelCount: appliedLabels.length,
    },
  };
}

function findKanbanExecutionContextEnvelopes(
  snapshot: Pick<KanbanBacklogSnapshot, 'projects' | 'issues'>,
  matcher: (issue: KanbanIssue) => boolean,
): KanbanExecutionContextEnvelope[] {
  const projectsById = new Map(snapshot.projects.map((project) => [project.id, project]));
  return snapshot.issues
    .filter(matcher)
    .map((issue) => buildKanbanExecutionContextEnvelope({ issue, project: projectsById.get(issue.projectId) }))
    .filter((envelope): envelope is KanbanExecutionContextEnvelope => Boolean(envelope))
    .sort((left, right) => left.issue.key.localeCompare(right.issue.key) || left.issue.id.localeCompare(right.issue.id));
}

export function findKanbanExecutionContextEnvelopesForRun(
  snapshot: Pick<KanbanBacklogSnapshot, 'projects' | 'issues'>,
  runId: string,
): KanbanExecutionContextEnvelope[] {
  const normalizedRunId = runId.trim();
  if (!normalizedRunId) {
    return [];
  }

  return findKanbanExecutionContextEnvelopes(
    snapshot,
    (issue) => issue.dispatch.runIds.includes(normalizedRunId),
  );
}

export function findKanbanExecutionContextEnvelopesForSession(
  snapshot: Pick<KanbanBacklogSnapshot, 'projects' | 'issues'>,
  sessionId: string,
): KanbanExecutionContextEnvelope[] {
  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    return [];
  }

  return findKanbanExecutionContextEnvelopes(
    snapshot,
    (issue) => issue.dispatch.sessionIds.includes(normalizedSessionId),
  );
}
function normalizeKanbanTaskTagScope(
  scope: Partial<KanbanTaskTagScope> | undefined,
): KanbanTaskTagScope | undefined {
  if (!scope) return undefined;

  const kind: KanbanTaskTagScopeKind =
    scope.kind === 'project' || scope.kind === 'workspace' ? scope.kind : 'global';
  const refId = scope.refId?.trim() || undefined;

  return refId ? { kind, refId } : { kind };
}

function normalizeKanbanTaskTagContent(content: string): string {
  return content.replace(/\r\n?/g, '\n').trim();
}

function compareKanbanTaskTags(left: KanbanTaskTag, right: KanbanTaskTag): number {
  return (
    left.order - right.order ||
    left.label.localeCompare(right.label) ||
    left.key.localeCompare(right.key) ||
    left.id.localeCompare(right.id)
  );
}

export function normalizeKanbanTaskTag(
  taskTag: Omit<KanbanTaskTag, 'key' | 'content' | 'order' | 'scope'> & {
    readonly key?: string;
    readonly content: string;
    readonly order?: number;
    readonly scope?: Partial<KanbanTaskTagScope>;
  },
): KanbanTaskTag {
  const label = taskTag.label.trim();
  const normalizedKey = normalizeKanbanTaskTagKey(taskTag.key ?? label);
  return {
    ...taskTag,
    label,
    key: normalizedKey || normalizeKanbanTaskTagKey(taskTag.id),
    content: normalizeKanbanTaskTagContent(taskTag.content),
    description: taskTag.description?.trim() || undefined,
    order:
      typeof taskTag.order === 'number' && Number.isFinite(taskTag.order) ? Math.max(0, Math.floor(taskTag.order)) : 0,
    scope: normalizeKanbanTaskTagScope(taskTag.scope),
  };
}

export function normalizeKanbanTaskTags(
  taskTags: readonly (Omit<KanbanTaskTag, 'key' | 'content' | 'order' | 'scope'> & {
    readonly key?: string;
    readonly content: string;
    readonly order?: number;
    readonly scope?: Partial<KanbanTaskTagScope>;
  })[],
): KanbanTaskTag[] {
  return taskTags.map((taskTag) => normalizeKanbanTaskTag(taskTag)).sort(compareKanbanTaskTags);
}

function normalizeCollaboratorRole(role: KanbanCollaboratorRole | undefined): KanbanCollaboratorRole {
  switch (role) {
    case 'owner':
    case 'maintainer':
    case 'contributor':
    case 'viewer':
      return role;
    default:
      return 'contributor';
  }
}

function normalizeCollaborator(collaborator: KanbanCollaborator): KanbanCollaborator {
  return {
    ...collaborator,
    displayName: collaborator.displayName.trim(),
    email: collaborator.email?.trim() || undefined,
    avatarUrl: collaborator.avatarUrl?.trim() || undefined,
    role: normalizeCollaboratorRole(collaborator.role),
  };
}

function normalizeTeamSettings(settings: Partial<KanbanTeamSettings> | undefined): KanbanTeamSettings {
  return {
    visibility:
      settings?.visibility === 'private' || settings?.visibility === 'workspace-shared'
        ? settings.visibility
        : DEFAULT_TEAM_SETTINGS.visibility,
    defaultRole: normalizeCollaboratorRole(settings?.defaultRole ?? DEFAULT_TEAM_SETTINGS.defaultRole),
    allowSelfAssign: settings?.allowSelfAssign ?? DEFAULT_TEAM_SETTINGS.allowSelfAssign,
  };
}

function normalizeProjectSettings(
  settings: Partial<KanbanProjectSettings> | undefined,
): KanbanProjectSettings {
  return {
    reviewRequiredForDone: settings?.reviewRequiredForDone ?? DEFAULT_PROJECT_SETTINGS.reviewRequiredForDone,
    activityScope:
      settings?.activityScope === 'all-board-entities'
        ? 'all-board-entities'
        : DEFAULT_PROJECT_SETTINGS.activityScope,
    workspaceProvisioning:
      settings?.workspaceProvisioning === 'contributors-and-up'
        ? 'contributors-and-up'
        : DEFAULT_PROJECT_SETTINGS.workspaceProvisioning,
  };
}

function normalizePermissionGrants(
  permissions: readonly KanbanPermissionGrant[] | undefined,
): KanbanPermissionGrant[] {
  const seen = new Set<KanbanPermissionAction>();
  const normalized: KanbanPermissionGrant[] = [];
  for (const permission of permissions?.length ? permissions : DEFAULT_PERMISSION_GRANTS) {
    if (seen.has(permission.action)) {
      continue;
    }
    seen.add(permission.action);
    normalized.push({
      action: permission.action,
      roles: uniqueStrings(permission.roles.map((role) => normalizeCollaboratorRole(role))) as KanbanCollaboratorRole[],
      description: permission.description?.trim() || undefined,
    });
  }
  return normalized;
}

function normalizeActivityEntry(entry: KanbanActivityEntry): KanbanActivityEntry {
  return {
    ...entry,
    action: entry.action.trim(),
    summary: entry.summary.trim(),
    actor: {
      ...entry.actor,
      displayName: entry.actor.displayName.trim(),
      role: entry.actor.role ? normalizeCollaboratorRole(entry.actor.role) : undefined,
    },
  };
}

function normalizeTeam(team: Partial<KanbanTeam> | undefined, project: Pick<KanbanProject, 'id' | 'name'>): KanbanTeam {
  return {
    id: team?.id?.trim() || `team-${project.id}`,
    name: team?.name?.trim() || `${project.name} Team`,
    members: uniqueById((team?.members ?? []).map(normalizeCollaborator)),
    settings: normalizeTeamSettings(team?.settings),
  };
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

function normalizeIntegrationPrerequisites(
  prerequisites: readonly KanbanIntegrationPrerequisite[] | undefined,
): KanbanIntegrationPrerequisite[] {
  const seen = new Set<string>();
  const normalized: KanbanIntegrationPrerequisite[] = [];
  for (const prerequisite of prerequisites ?? []) {
    const key = prerequisite.key.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push({
      ...prerequisite,
      key,
      label: prerequisite.label.trim(),
      guidance: prerequisite.guidance?.trim() || undefined,
    });
  }
  return normalized;
}

function normalizeIntegrationActionState(
  actions: KanbanIntegrationActionState | undefined,
  status: KanbanIntegrationStatus,
): KanbanIntegrationActionState {
  const blockedByStatus =
    status === 'disconnected' ||
    status === 'expired-auth' ||
    status === 'missing-scopes' ||
    status === 'failing';
  const canCreatePullRequest = actions?.canCreatePullRequest ?? !blockedByStatus;
  const canManagePullRequest = actions?.canManagePullRequest ?? !blockedByStatus;
  const canApproveFromReview = actions?.canApproveFromReview ?? !blockedByStatus;

  return {
    canCreatePullRequest,
    canManagePullRequest,
    canApproveFromReview,
    reason: actions?.reason?.trim() || undefined,
  };
}

function normalizeIntegrationConnection(
  connection: KanbanIntegrationConnection,
): KanbanIntegrationConnection {
  return {
    ...connection,
    label: connection.label.trim(),
    accountLabel: connection.accountLabel?.trim() || undefined,
    connectedAt: connection.connectedAt,
    failureMessage: connection.failureMessage?.trim() || undefined,
    missingScopes: uniqueStrings((connection.missingScopes ?? []).map((scope) => scope.trim()).filter(Boolean)),
    prerequisites: normalizeIntegrationPrerequisites(connection.prerequisites),
    guidance: connection.guidance.trim(),
    actions: normalizeIntegrationActionState(connection.actions, connection.status),
  };
}

function normalizeRepositoryIntegrationState(
  integration: KanbanRepositoryIntegrationState | undefined,
  provider: KanbanRepositoryProvider | undefined,
  pullRequest: KanbanPullRequest | undefined,
): KanbanRepositoryIntegrationState | undefined {
  if (!integration || (integration.provider !== 'github' && integration.provider !== 'azure-repos')) {
    return undefined;
  }

  const normalizedLinkState =
    integration.linkState ??
    (pullRequest ? pullRequest.linkState ?? 'linked' : 'unlinked');

  return {
    ...integration,
    provider: integration.provider,
    status: integration.status,
    linkState: normalizedLinkState,
    failureMessage: integration.failureMessage?.trim() || undefined,
    guidance: integration.guidance.trim(),
    missingScopes: uniqueStrings((integration.missingScopes ?? []).map((scope) => scope.trim()).filter(Boolean)),
    prerequisites: normalizeIntegrationPrerequisites(integration.prerequisites),
    actions: normalizeIntegrationActionState(
      integration.actions,
      integration.status,
    ),
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
        linkState: lifecycle.pullRequest.linkState ?? 'linked',
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
    integration: normalizeRepositoryIntegrationState(
      lifecycle.integration,
      repository?.provider,
      pullRequest,
    ),
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
  return WORKFLOW_STATE_COLUMNS[state].name;
}

function getColumnWipLimit(
  project: KanbanProject,
  state: KanbanWorkflowState,
): number | undefined {
  if (!WORKFLOW_STATE_COLUMNS[state].enforcesWipLimit) {
    return undefined;
  }

  return project.statuses.find((status) => status.id === state)?.wipLimit;
}

function getAllowedMoveStates(currentState: KanbanWorkflowState): readonly KanbanWorkflowState[] {
  return WORKFLOW_STATE_COLUMNS[currentState].allowedMoveStates;
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
  issue: Omit<KanbanIssue, 'dispatch' | 'collaborators' | 'activity'> & {
    readonly collaborators?: readonly KanbanCollaborator[];
    readonly activity?: readonly KanbanActivityEntry[];
    readonly dispatch?: Partial<KanbanIssueDispatchState>;
  },
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
  issue: Omit<KanbanIssue, 'dispatch' | 'collaborators' | 'activity'> & {
    readonly collaborators?: readonly KanbanCollaborator[];
    readonly activity?: readonly KanbanActivityEntry[];
    readonly dispatch?: Partial<KanbanIssueDispatchState>;
  },
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
  issue: Omit<KanbanIssue, 'dispatch' | 'collaborators' | 'activity'> & {
    readonly collaborators?: readonly KanbanCollaborator[];
    readonly activity?: readonly KanbanActivityEntry[];
    readonly dispatch?: Partial<KanbanIssueDispatchState>;
  },
  issuesById: ReadonlyMap<string, KanbanIssue>,
  repositoryMap: ReadonlyMap<string, KanbanRepositoryContext> = new Map(),
  dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[] = [],
): KanbanIssue {
  const labels = uniqueById(issue.labels);
  const assignees = uniqueById(issue.assignees);
  const collaborators = uniqueById((issue.collaborators ?? []).map(normalizeCollaborator));
  const acceptanceCriteria = uniqueById(issue.acceptanceCriteria);
  const decomposition = uniqueById(issue.decomposition);
  const childIssueIds = Array.from(new Set(issue.childIssueIds));
  const readiness = resolveReadiness({ ...issue, childIssueIds, decomposition }, issuesById);
  const blockedReasons = resolveBlockedReasons({ ...issue, childIssueIds, decomposition }, issuesById);
  const contextLabels = normalizeKanbanDispatchContextLabelRefs(issue.dispatch?.contextLabels ?? []);
  const contextLabelProjections = projectDispatchContextLabels(dispatchContextLabels, contextLabels);
  const executionContext = buildDispatchContextExecutionEnvelope(dispatchContextLabels, contextLabels);
  const renderedContext = executionContext?.renderedBlock;
  const workspaceLinks = Array.from(
    new Map(
      (issue.workspaceLinks ?? [])
        .filter((link) => typeof link.workspacePath === 'string' && link.workspacePath.trim().length > 0)
        .map((link) => [
          link.workspacePath.trim(),
          {
            workspacePath: link.workspacePath.trim(),
            workspaceName: link.workspaceName.trim() || link.workspacePath.trim(),
            branchName: link.branchName?.trim() || undefined,
            linkedAt: link.linkedAt,
            source: link.source,
          } satisfies KanbanIssueWorkspaceLink,
        ] as const),
    ).values(),
  );

  return {
    ...issue,
    labels,
    assignees,
    collaborators,
    acceptanceCriteria,
    decomposition,
    childIssueIds,
    activity: uniqueById((issue.activity ?? []).map(normalizeActivityEntry)),
    dispatch: {
      readiness,
      blockedReasons,
      runIds: Array.from(new Set(issue.dispatch?.runIds ?? [])),
      sessionIds: Array.from(new Set(issue.dispatch?.sessionIds ?? [])),
      contextLabels,
      contextLabelProjections,
      executionContext,
      renderedContext,
      lastDispatchedAt: issue.dispatch?.lastDispatchedAt,
    },
    repositoryLifecycle: normalizeIssueRepositoryLifecycle(issue.repositoryLifecycle, repositoryMap),
    workspaceLinks,
  };
}

export function resolveKanbanWorkflowState(issue: Pick<KanbanIssue, 'status'>): KanbanWorkflowState {
  return ISSUE_STATUS_WORKFLOW_STATES[issue.status];
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
  if (state === 'todo') {
    return issue.status === 'backlog' || issue.dispatch.readiness === 'needs-decomposition'
      ? 'backlog'
      : 'ready';
  }

  return WORKFLOW_STATE_COLUMNS[state].defaultStatus;
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
  readonly projects: readonly (Omit<KanbanProject, 'metrics' | 'team' | 'settings' | 'permissions' | 'activity' | 'integrations'> & {
    readonly team?: Partial<KanbanTeam>;
    readonly settings?: Partial<KanbanProjectSettings>;
    readonly permissions?: readonly KanbanPermissionGrant[];
    readonly activity?: readonly KanbanActivityEntry[];
    readonly repositories?: readonly KanbanRepositoryContext[];
    readonly integrations?: readonly KanbanIntegrationConnection[];
  })[];
  readonly issues: readonly (Omit<KanbanIssue, 'dispatch' | 'collaborators' | 'activity'> & {
    readonly collaborators?: readonly KanbanCollaborator[];
    readonly activity?: readonly KanbanActivityEntry[];
    readonly dispatch?: Partial<KanbanIssueDispatchState>;
  })[];
  readonly dispatchContextLabels?: readonly (Omit<KanbanDispatchContextLabelDefinition, 'key' | 'instruction' | 'order'> & {
    readonly key?: string;
    readonly instruction: string;
    readonly order?: number;
  })[];
}): KanbanBacklogSnapshot {
  const normalizedDispatchContextLabels = normalizeKanbanDispatchContextLabels(
    input.dispatchContextLabels ?? [],
  );
  const issueSeedMap = new Map<string, KanbanIssue>();
  for (const issue of input.issues) {
    issueSeedMap.set(issue.id, {
      ...issue,
      collaborators: issue.collaborators ?? [],
      activity: issue.activity ?? [],
      dispatch: {
        readiness: 'ready',
        blockedReasons: [],
        runIds: [],
        sessionIds: [],
        contextLabels: [],
        contextLabelProjections: [],
      },
    });
  }

  const projects = input.projects.map((project) => ({
    ...project,
    labels: uniqueById(project.labels),
    assignees: uniqueById(project.assignees),
    team: normalizeTeam(project.team, project),
    settings: normalizeProjectSettings(project.settings),
    permissions: normalizePermissionGrants(project.permissions),
    activity: uniqueById((project.activity ?? []).map(normalizeActivityEntry)),
    statuses: project.statuses.length > 0 ? project.statuses : DEFAULT_PROJECT_STATUSES,
    repositories: uniqueById((project.repositories ?? []).map(normalizeRepositoryContext)),
    integrations: Array.from(
      new Map(
        (project.integrations ?? [])
          .map(normalizeIntegrationConnection)
          .map((connection) => [connection.provider, connection] as const),
      ).values(),
    ),
  }));
  const repositoryMapByProject = new Map(
    projects.map((project) => [project.id, new Map(project.repositories.map((repository) => [repository.id, repository]))]),
  );

  const normalizedIssues = input.issues.map((issue) =>
    normalizeKanbanIssue(
      issue,
      issueSeedMap,
      repositoryMapByProject.get(issue.projectId),
      normalizedDispatchContextLabels,
    ),
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
    dispatchContextLabels: normalizedDispatchContextLabels,
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
      collaboratorNames: uniqueStrings(issue.collaborators.map((collaborator) => collaborator.displayName)),
      dependencyCount: issue.dependencies.length,
      childCount: issue.childIssueIds.length,
      activityCount: issue.activity.length,
      latestActivityAt: issue.activity[0]?.createdAt,
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
    readonly integration?: KanbanRepositoryIntegrationState;
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
      integration: input.integration ?? issue.repositoryLifecycle?.integration,
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
    readonly linkState?: KanbanPullRequestLinkState;
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
        linkState: input.linkState ?? 'linked',
        createdAt: input.now,
        updatedAt: input.now,
      },
    },
  };
}
