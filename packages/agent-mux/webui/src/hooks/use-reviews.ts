"use client";

import { useMemo, useState } from "react";

import { resilientFetch } from "@/lib/fetcher";

import type {
  KanbanCiGate,
  KanbanIntegrationProvider,
  KanbanMergeStatus,
  KanbanPublishStatus,
  KanbanPullRequestStatus,
  KanbanReviewArtifact,
  KanbanReviewCommentAnchor,
  KanbanReviewDecision,
  KanbanReviewFeedbackSource,
  KanbanReviewStatus,
  KanbanReviewSnapshot,
  KanbanReviewTargetType,
} from "@a5c-ai/agent-mux-comm/kanban";

import { useSmartPolling } from "./use-smart-polling";

export interface ReviewQuery {
  targetType?: KanbanReviewTargetType;
  targetId?: string;
}

export async function loadReviews(query: ReviewQuery = {}): Promise<KanbanReviewSnapshot> {
  const params = new URLSearchParams();
  if (query.targetType) {
    params.set("targetType", query.targetType);
  }
  if (query.targetId) {
    params.set("targetId", query.targetId);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const result = await resilientFetch<KanbanReviewSnapshot>(`/api/reviews${suffix}`);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function submitReviewAction(input:
  | {
      action: "submit-review";
      artifactId: string;
      decision: KanbanReviewDecision;
      summary?: string;
      executionTargetId?: string;
    }
  | { action: "approve"; artifactId: string }
  | { action: "request-changes"; artifactId: string }
  | {
      action: "add-comment";
      artifactId: string;
      body: string;
      anchor: KanbanReviewCommentAnchor;
      authorName?: string;
      feedbackSource?: KanbanReviewFeedbackSource;
    }
  | {
      action: "create-pull-request";
      artifactId: string;
      provider?: KanbanIntegrationProvider;
      title: string;
      reviewers?: string;
      branchName?: string;
      baseBranch?: string;
      url?: string;
    }
  | {
      action: "link-pull-request";
      artifactId: string;
      provider?: KanbanIntegrationProvider;
      number: number;
      title: string;
      status?: KanbanPullRequestStatus;
      reviewStatus?: KanbanReviewStatus;
      mergeStatus?: KanbanMergeStatus;
      publishStatus?: KanbanPublishStatus;
      ciGates?: readonly KanbanCiGate[];
      branchName?: string;
      baseBranch?: string;
      url?: string;
    },
): Promise<KanbanReviewSnapshot> {
  const result = await resilientFetch<KanbanReviewSnapshot>("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function useReviews(query: ReviewQuery = {}, interval = 15000) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (query.targetType) {
      params.set("targetType", query.targetType);
    }
    if (query.targetId) {
      params.set("targetId", query.targetId);
    }
    return `/api/reviews${params.size > 0 ? `?${params.toString()}` : ""}`;
  }, [query.targetId, query.targetType]);
  const [pendingArtifactId, setPendingArtifactId] = useState<string | null>(null);
  const { data, loading, error, refresh } = useSmartPolling<KanbanReviewSnapshot>(url, {
    interval,
    sseFilter: (event) => event.type === "update" || event.type === "new-run",
  });

  async function actOnReview(input:
    | {
        action: "submit-review";
        artifactId: string;
        decision: KanbanReviewDecision;
        summary?: string;
        executionTargetId?: string;
      }
    | { action: "approve"; artifactId: string }
    | { action: "request-changes"; artifactId: string }
    | {
        action: "add-comment";
        artifactId: string;
        body: string;
        anchor: KanbanReviewCommentAnchor;
        authorName?: string;
        feedbackSource?: KanbanReviewFeedbackSource;
      }
    | {
        action: "create-pull-request";
        artifactId: string;
        provider?: KanbanIntegrationProvider;
        title: string;
        reviewers?: string;
        branchName?: string;
        baseBranch?: string;
        url?: string;
      }
    | {
        action: "link-pull-request";
        artifactId: string;
        provider?: KanbanIntegrationProvider;
        number: number;
        title: string;
        status?: KanbanPullRequestStatus;
        reviewStatus?: KanbanReviewStatus;
        mergeStatus?: KanbanMergeStatus;
        publishStatus?: KanbanPublishStatus;
        ciGates?: readonly KanbanCiGate[];
        branchName?: string;
        baseBranch?: string;
        url?: string;
      },
  ): Promise<KanbanReviewSnapshot> {
    setPendingArtifactId(input.artifactId);
    try {
      const snapshot = await submitReviewAction(input);
      await refresh();
      return snapshot;
    } finally {
      setPendingArtifactId(null);
    }
  }

  const artifacts = data?.artifacts ?? [];
  const queue = data?.queue ?? [];
  const summary = data?.summary;
  const selectedArtifact = (artifactId: string | null | undefined): KanbanReviewArtifact | null =>
    artifacts.find((artifact) => artifact.id === artifactId) ?? null;

  return {
    snapshot: data,
    artifacts,
    queue,
    summary,
    loading,
    error,
    refresh,
    actOnReview,
    pendingArtifactId,
    selectedArtifact,
  };
}
