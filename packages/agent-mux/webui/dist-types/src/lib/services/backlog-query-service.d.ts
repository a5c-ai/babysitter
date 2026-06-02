import { type KanbanBacklogOverview, type KanbanBacklogSummary, type KanbanCollaboratorRole, type KanbanIssueCreateResult, type KanbanIssue, type KanbanPermissionGrant, type KanbanProjectSettings, type KanbanRepositoryProvider, type KanbanRepositorySettings, type KanbanTeamSettings, type KanbanWorkflowState, type KanbanIssueWorkspaceLinkInput } from '@a5c-ai/agent-mux-comm/kanban';
import { ReviewService } from '../review-service';
import { RunQueryService } from './run-query-service';
import { type KanbanStorageDeps } from './kanban-storage';
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
interface BacklogQueryServiceDeps extends KanbanStorageDeps {
    runQueryService: Pick<RunQueryService, 'listProjects'>;
    reviewService: Pick<ReviewService, 'listReviews'>;
    now: () => string;
}
export declare class BacklogQueryService {
    private readonly deps;
    constructor(overrides?: Partial<BacklogQueryServiceDeps>);
    private readSeedPayload;
    private listRunSummaries;
    private buildOverviewFromPayload;
    private persistPayload;
    private findIssue;
    private findProject;
    getOverview(): Promise<BacklogOverview>;
    createIssue(input: CreateBacklogIssueInput): Promise<CreateBacklogIssueResult>;
    moveIssue(input: {
        readonly issueId: string;
        readonly toState: KanbanWorkflowState;
    }): Promise<BacklogOverview>;
    linkRepository(input: {
        readonly issueId: string;
        readonly owner: string;
        readonly name: string;
        readonly branchName: string;
        readonly defaultBranch?: string;
        readonly provider?: KanbanRepositoryProvider;
    }): Promise<BacklogOverview>;
    updateRepositorySettings(input: {
        readonly issueId: string;
        readonly settings: Partial<KanbanRepositorySettings>;
    }): Promise<BacklogOverview>;
    updateProjectCollaboration(input: {
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
    }): Promise<BacklogOverview>;
    updateIssueCollaboration(input: {
        readonly issueId: string;
        readonly assigneeIds: readonly string[];
        readonly collaboratorIds: readonly string[];
    }): Promise<BacklogOverview>;
    updateIssueDispatchContextLabels(input: {
        readonly issueId: string;
        readonly dispatchContextLabelIds: readonly string[];
    }): Promise<BacklogOverview>;
    updateIssueDetail(input: UpdateIssueDetailInput): Promise<BacklogOverview>;
    linkIssueWorkspace(input: LinkIssueWorkspaceInput): Promise<BacklogOverview>;
    linkChildIssue(input: {
        readonly parentIssueId: string;
        readonly childIssueId: string;
    }): Promise<BacklogOverview>;
    createPullRequest(input: {
        readonly issueId: string;
        readonly title: string;
        readonly reviewers?: string;
    }): Promise<BacklogOverview>;
}
export {};
