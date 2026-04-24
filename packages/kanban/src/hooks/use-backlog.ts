"use client";

import { useState } from "react";

import { resilientFetch } from "@/lib/fetcher";

import type {
  KanbanBacklogSnapshot,
  KanbanBoardSnapshot,
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

export function useBacklog(interval = 15000) {
  const [movingIssueId, setMovingIssueId] = useState<string | null>(null);
  const { data, loading, error, refresh } = useSmartPolling<BacklogOverviewResponse>(
    "/api/backlog",
    {
      interval,
      sseFilter: (event) => event.type === "update" || event.type === "new-run",
    },
  );

  async function moveIssue(issueId: string, toState: KanbanWorkflowState): Promise<void> {
    setMovingIssueId(issueId);
    try {
      const result = await resilientFetch<BacklogOverviewResponse>("/api/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move-issue", issueId, toState }),
      });

      if (!result.ok) {
        throw new Error(result.error.message);
      }

      await refresh();
    } finally {
      setMovingIssueId(null);
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
    movingIssueId,
  };
}
