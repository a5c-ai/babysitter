"use client";

import { useState } from "react";

import { resilientFetch } from "@/lib/fetcher";

import type {
  KanbanBacklogSnapshot,
  KanbanBoardSnapshot,
  KanbanCollaboratorRole,
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

export interface CreateBacklogIssueResponse {
  overview: BacklogOverviewResponse;
  issue: {
    id: string;
    key: string;
    title: string;
  };
}

export function useBacklog(interval = 15000) {
  const [movingIssueId, setMovingIssueId] = useState<string | null>(null);
  const [mutatingIssueId, setMutatingIssueId] = useState<string | null>(null);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const { data, loading, error, refresh } = useSmartPolling<BacklogOverviewResponse>(
    "/api/backlog",
    {
      interval,
      sseFilter: (event) => event.type === "update" || event.type === "new-run",
    },
  );

  async function mutateBacklog<T>(body: Record<string, unknown>, issueId: string): Promise<T> {
    setMutatingIssueId(issueId);
    try {
      const result = await resilientFetch<T>("/api/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!result.ok) {
        throw new Error(result.error.message);
      }

      await refresh();
      return result.data;
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

  async function createIssue(input: {
    projectId: string;
    title: string;
    summary?: string;
    status?: "backlog" | "ready" | "in-progress" | "review" | "done";
    priority?: "critical" | "high" | "medium" | "low";
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
    movingIssueId,
    mutatingIssueId,
    creatingIssue,
  };
}
