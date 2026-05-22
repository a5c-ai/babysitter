"use client";

import { useState } from "react";

import { resilientFetch } from "@/lib/fetcher";

import type {
  KanbanBacklogSnapshot,
  KanbanBoardSnapshot,
  KanbanCollaboratorRole,
  KanbanDispatchContextLabelDefinition,
  KanbanPermissionGrant,
  KanbanProjectSettings,
  KanbanTaskTag,
  KanbanWorkflowState,
} from "@a5c-ai/agent-mux-core/kanban";

import { useSmartPolling } from "./use-smart-polling";

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

export async function loadTaskTags(): Promise<readonly KanbanTaskTag[]> {
  const result = await resilientFetch<TaskTagListResponse>("/api/task-tags");
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data.taskTags;
}

export async function createTaskTag(input: TaskTagInput): Promise<TaskTagListResponse> {
  const result = await resilientFetch<TaskTagListResponse>("/api/task-tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function updateTaskTag(
  taskTagId: string,
  input: TaskTagUpdateInput,
): Promise<TaskTagListResponse> {
  const result = await resilientFetch<TaskTagListResponse>(`/api/task-tags/${taskTagId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function deleteTaskTag(taskTagId: string): Promise<TaskTagListResponse> {
  const result = await resilientFetch<TaskTagListResponse>(`/api/task-tags/${taskTagId}`, {
    method: "DELETE",
  });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function loadDispatchContextLabels(): Promise<
  readonly KanbanDispatchContextLabelDefinition[]
> {
  const result = await resilientFetch<DispatchContextLabelListResponse>("/api/dispatch-context-labels");
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data.dispatchContextLabels;
}

export async function createDispatchContextLabel(
  input: DispatchContextLabelInput,
): Promise<DispatchContextLabelListResponse> {
  const result = await resilientFetch<DispatchContextLabelListResponse>("/api/dispatch-context-labels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function updateDispatchContextLabel(
  dispatchContextLabelId: string,
  input: DispatchContextLabelUpdateInput,
): Promise<DispatchContextLabelListResponse> {
  const result = await resilientFetch<DispatchContextLabelListResponse>(
    `/api/dispatch-context-labels/${dispatchContextLabelId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function deleteDispatchContextLabel(
  dispatchContextLabelId: string,
): Promise<DispatchContextLabelListResponse> {
  const result = await resilientFetch<DispatchContextLabelListResponse>(
    `/api/dispatch-context-labels/${dispatchContextLabelId}`,
    {
      method: "DELETE",
    },
  );
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function postIssueDispatchContextLabels(
  input: UpdateIssueDispatchContextLabelsInput,
): Promise<BacklogOverviewResponse> {
  const result = await resilientFetch<BacklogOverviewResponse>("/api/backlog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update-issue-dispatch-context-labels",
      ...input,
    }),
  });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

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
export function useBacklog(interval = 15000) {
  const [movingIssueId, setMovingIssueId] = useState<string | null>(null);
  const [mutatingIssueId, setMutatingIssueId] = useState<string | null>(null);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [mutationError, setMutationError] = useState<{
    issueId: string;
    message: string;
  } | null>(null);
  const { data, loading, error, refresh } = useSmartPolling<BacklogOverviewResponse>(
    "/api/backlog",
    {
      interval,
      sseFilter: (event) => event.type === "update" || event.type === "new-run",
    },
  );

  async function mutateBacklog<T>(body: Record<string, unknown>, issueId: string): Promise<T> {
    setMutatingIssueId(issueId);
    setMutationError(null);
    try {
      const result = await resilientFetch<T>("/api/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!result.ok) {
        const nextError = {
          issueId,
          message: result.error.message,
        };
        setMutationError(nextError);
        throw new Error(nextError.message);
      }

      await refresh();
      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        setMutationError({
          issueId,
          message: error.message,
        });
      }
      throw error;
    } finally {
      setMutatingIssueId(null);
    }
  }

  async function moveIssue(issueId: string, toState: KanbanWorkflowState): Promise<void> {
    setMovingIssueId(issueId);
    try {
      await mutateBacklog<BacklogOverviewResponse>({ action: "move-issue", issueId, toState }, issueId);
    } finally {
      setMovingIssueId(null);
    }
  }

  async function linkRepository(input: {
    issueId: string;
    owner: string;
    name: string;
    branchName: string;
    defaultBranch?: string;
    provider?: "github" | "azure-repos" | "gitlab" | "bitbucket" | "local";
  }): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>({ action: "link-repository", ...input }, input.issueId);
  }

  async function updateRepositorySettings(input: {
    issueId: string;
    baseBranch: string;
    ciProvider?: string;
    publishTarget?: string;
    autoMerge: boolean;
    requiredApprovals: number;
  }): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>({ action: "update-repository-settings", ...input }, input.issueId);
  }

  async function createPullRequest(input: {
    issueId: string;
    title: string;
    reviewers?: string;
  }): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>({ action: "create-pull-request", ...input }, input.issueId);
  }

  async function updateProjectCollaboration(input: {
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
  }): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>({ action: "update-project-collaboration", ...input }, input.projectId);
  }

  async function updateIssueCollaboration(input: {
    issueId: string;
    assigneeIds: string[];
    collaboratorIds: string[];
  }): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>({ action: "update-issue-collaboration", ...input }, input.issueId);
  }

  async function updateIssueDispatchContextLabels(
    input: UpdateIssueDispatchContextLabelsInput,
  ): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>(
      { action: "update-issue-dispatch-context-labels", ...input },
      input.issueId,
    );
  }

  async function createIssue(input: {
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
  }): Promise<CreateBacklogIssueResponse> {
    setCreatingIssue(true);
    try {
      return await mutateBacklog<CreateBacklogIssueResponse>(
        { action: "create-issue", ...input },
        input.projectId,
      );
    } finally {
      setCreatingIssue(false);
    }
  }

  async function createSubIssue(input: {
    parentIssueId: string;
    title: string;
    summary?: string;
    priority?: "critical" | "high" | "medium" | "low";
    status?: "backlog" | "ready" | "in-progress" | "blocked" | "review" | "done";
  }): Promise<void> {
    await mutateBacklog({ action: "create-sub-issue", ...input }, input.parentIssueId);
  }

  async function linkChildIssue(input: {
    parentIssueId: string;
    childIssueId: string;
  }): Promise<void> {
    await mutateBacklog({ action: "link-child-issue", ...input }, input.parentIssueId);
  }

  async function updateIssueDetail(
    input: UpdateIssueDetailInput,
  ): Promise<BacklogOverviewResponse> {
    return mutateBacklog<BacklogOverviewResponse>(
      { action: "update-issue-detail", ...input },
      input.issueId,
    );
  }

  async function createIssueWorkspace(issueId: string): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>(
      { action: "create-issue-workspace", issueId },
      issueId,
    );
  }

  async function linkIssueWorkspace(input: LinkIssueWorkspaceInput): Promise<void> {
    await mutateBacklog<BacklogOverviewResponse>(
      { action: "link-issue-workspace", ...input },
      input.issueId,
    );
  }

  return {
    snapshot: data?.snapshot,
    board: data?.board,
    summary: data?.summary,
    loading,
    error,
    refresh,
    moveIssue,
    linkRepository,
    updateRepositorySettings,
    createPullRequest,
    createIssue,
    updateProjectCollaboration,
    updateIssueCollaboration,
    updateIssueDispatchContextLabels,
    createSubIssue,
    linkChildIssue,
    updateIssueDetail,
    createIssueWorkspace,
    linkIssueWorkspace,
    movingIssueId,
    mutatingIssueId,
    creatingIssue,
    mutationError,
  };
}
