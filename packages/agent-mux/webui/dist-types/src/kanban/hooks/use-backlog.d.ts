import type { KanbanBacklogSnapshot, KanbanBoardSnapshot, KanbanCollaboratorRole, KanbanDispatchContextLabelDefinition, KanbanPermissionGrant, KanbanProjectSettings, KanbanTaskTag, KanbanWorkflowState } from "@a5c-ai/agent-mux-core/kanban";
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
export interface BacklogOverviewResponse {
    snapshot: KanbanBacklogSnapshot;
    board: KanbanBoardSnapshot;
    summary: BacklogOverviewSummary;
}
export interface TaskTagListResponse {
    taskTags: readonly KanbanTaskTag[];
}
export interface TaskTagInput {
    key: string;
    label: string;
    content: string;
    description?: string;
    order?: number;
}
export interface TaskTagUpdateInput {
    key?: string;
    label?: string;
    content?: string;
    description?: string;
    order?: number;
}
export interface DispatchContextLabelListResponse {
    dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
}
export interface DispatchContextLabelInput {
    key: string;
    label: string;
    instruction: string;
    description?: string;
    order?: number;
}
export interface DispatchContextLabelUpdateInput {
    key?: string;
    label?: string;
    instruction?: string;
    description?: string;
    order?: number;
}
export interface UpdateIssueDispatchContextLabelsInput {
    issueId: string;
    dispatchContextLabelIds: string[];
}
export interface LinkIssueWorkspaceInput {
    issueId: string;
    workspacePath: string;
}
export declare function loadTaskTags(): Promise<readonly KanbanTaskTag[]>;
export declare function createTaskTag(input: TaskTagInput): Promise<TaskTagListResponse>;
export declare function updateTaskTag(taskTagId: string, input: TaskTagUpdateInput): Promise<TaskTagListResponse>;
export declare function deleteTaskTag(taskTagId: string): Promise<TaskTagListResponse>;
export declare function loadDispatchContextLabels(): Promise<readonly KanbanDispatchContextLabelDefinition[]>;
export declare function createDispatchContextLabel(input: DispatchContextLabelInput): Promise<DispatchContextLabelListResponse>;
export declare function updateDispatchContextLabel(dispatchContextLabelId: string, input: DispatchContextLabelUpdateInput): Promise<DispatchContextLabelListResponse>;
export declare function deleteDispatchContextLabel(dispatchContextLabelId: string): Promise<DispatchContextLabelListResponse>;
export declare function postIssueDispatchContextLabels(input: UpdateIssueDispatchContextLabelsInput): Promise<BacklogOverviewResponse>;
export interface CreateBacklogIssueResponse {
    overview: BacklogOverviewResponse;
    issue: {
        id: string;
        projectId: string;
        key: string;
        title: string;
    };
}
export interface UpdateIssueDetailInput {
    issueId: string;
    expectedUpdatedAt?: string;
    title?: string;
    summary?: string;
    description?: string;
    status?: "backlog" | "ready" | "in-progress" | "blocked" | "review" | "done";
    priority?: "critical" | "high" | "medium" | "low";
    assigneeIds?: string[];
    labelIds?: string[];
    dependencies?: Array<{
        issueId: string;
        type?: "blocks" | "blocked-by" | "related";
    }>;
    acceptanceCriteria?: Array<{
        id?: string;
        title: string;
        satisfied?: boolean;
        notes?: string;
    }>;
}
export declare function useBacklog(interval?: number): {
    snapshot: KanbanBacklogSnapshot | undefined;
    board: KanbanBoardSnapshot | undefined;
    summary: BacklogOverviewSummary | undefined;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    moveIssue: (issueId: string, toState: KanbanWorkflowState) => Promise<void>;
    linkRepository: (input: {
        issueId: string;
        owner: string;
        name: string;
        branchName: string;
        defaultBranch?: string;
        provider?: "github" | "azure-repos" | "gitlab" | "bitbucket" | "local";
    }) => Promise<void>;
    updateRepositorySettings: (input: {
        issueId: string;
        baseBranch: string;
        ciProvider?: string;
        publishTarget?: string;
        autoMerge: boolean;
        requiredApprovals: number;
    }) => Promise<void>;
    createPullRequest: (input: {
        issueId: string;
        title: string;
        reviewers?: string;
    }) => Promise<void>;
    createIssue: (input: {
        projectId: string;
        title: string;
        summary?: string;
        description?: string;
        status?: "backlog" | "ready" | "in-progress" | "blocked" | "review" | "done";
        priority?: "critical" | "high" | "medium" | "low";
        labelIds?: string[];
        assigneeIds?: string[];
        dependencies?: Array<{
            issueId: string;
            type?: "blocks" | "blocked-by" | "related";
        }>;
        acceptanceCriteria?: Array<{
            id?: string;
            title: string;
            satisfied?: boolean;
            notes?: string;
        }>;
        metadata?: Record<string, unknown>;
    }) => Promise<CreateBacklogIssueResponse>;
    updateProjectCollaboration: (input: {
        projectId: string;
        teamName: string;
        visibility: "private" | "team" | "workspace-shared";
        defaultRole: KanbanCollaboratorRole;
        allowSelfAssign: boolean;
        reviewRequiredForDone: boolean;
        activityScope: KanbanProjectSettings["activityScope"];
        workspaceProvisioning: KanbanProjectSettings["workspaceProvisioning"];
        members: Array<{
            id: string;
            displayName: string;
            email?: string;
            role: KanbanCollaboratorRole;
        }>;
        permissions: KanbanPermissionGrant[];
    }) => Promise<void>;
    updateIssueCollaboration: (input: {
        issueId: string;
        assigneeIds: string[];
        collaboratorIds: string[];
    }) => Promise<void>;
    updateIssueDispatchContextLabels: (input: UpdateIssueDispatchContextLabelsInput) => Promise<void>;
    createSubIssue: (input: {
        parentIssueId: string;
        title: string;
        summary?: string;
        priority?: "critical" | "high" | "medium" | "low";
        status?: "backlog" | "ready" | "in-progress" | "blocked" | "review" | "done";
    }) => Promise<void>;
    linkChildIssue: (input: {
        parentIssueId: string;
        childIssueId: string;
    }) => Promise<void>;
    updateIssueDetail: (input: UpdateIssueDetailInput) => Promise<BacklogOverviewResponse>;
    createIssueWorkspace: (issueId: string) => Promise<void>;
    linkIssueWorkspace: (input: LinkIssueWorkspaceInput) => Promise<void>;
    movingIssueId: string | null;
    mutatingIssueId: string | null;
    creatingIssue: boolean;
    mutationError: {
        issueId: string;
        message: string;
    } | null;
};
