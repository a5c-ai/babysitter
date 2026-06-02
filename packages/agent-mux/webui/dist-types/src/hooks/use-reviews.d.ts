import type { KanbanCiGate, KanbanIntegrationProvider, KanbanMergeStatus, KanbanPublishStatus, KanbanPullRequestStatus, KanbanReviewArtifact, KanbanReviewCommentAnchor, KanbanReviewDecision, KanbanReviewFeedbackSource, KanbanReviewStatus, KanbanReviewSnapshot, KanbanReviewTargetType } from "@a5c-ai/agent-mux-comm/kanban";
export interface ReviewQuery {
    targetType?: KanbanReviewTargetType;
    targetId?: string;
}
export declare function loadReviews(query?: ReviewQuery): Promise<KanbanReviewSnapshot>;
export declare function submitReviewAction(input: {
    action: "submit-review";
    artifactId: string;
    decision: KanbanReviewDecision;
    summary?: string;
    executionTargetId?: string;
} | {
    action: "approve";
    artifactId: string;
} | {
    action: "request-changes";
    artifactId: string;
} | {
    action: "add-comment";
    artifactId: string;
    body: string;
    anchor: KanbanReviewCommentAnchor;
    authorName?: string;
    feedbackSource?: KanbanReviewFeedbackSource;
} | {
    action: "create-pull-request";
    artifactId: string;
    provider?: KanbanIntegrationProvider;
    title: string;
    reviewers?: string;
    branchName?: string;
    baseBranch?: string;
    url?: string;
} | {
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
}): Promise<KanbanReviewSnapshot>;
export declare function useReviews(query?: ReviewQuery, interval?: number): {
    snapshot: KanbanReviewSnapshot | null;
    artifacts: readonly KanbanReviewArtifact[];
    queue: readonly import("@a5c-ai/agent-mux-comm").KanbanReviewQueueItem[];
    summary: {
        readonly total: number;
        readonly issueCount: number;
        readonly workspaceCount: number;
        readonly pendingCount: number;
        readonly changesRequestedCount: number;
        readonly approvedCount: number;
        readonly openCommentCount: number;
    } | undefined;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    actOnReview: (input: {
        action: "submit-review";
        artifactId: string;
        decision: KanbanReviewDecision;
        summary?: string;
        executionTargetId?: string;
    } | {
        action: "approve";
        artifactId: string;
    } | {
        action: "request-changes";
        artifactId: string;
    } | {
        action: "add-comment";
        artifactId: string;
        body: string;
        anchor: KanbanReviewCommentAnchor;
        authorName?: string;
        feedbackSource?: KanbanReviewFeedbackSource;
    } | {
        action: "create-pull-request";
        artifactId: string;
        provider?: KanbanIntegrationProvider;
        title: string;
        reviewers?: string;
        branchName?: string;
        baseBranch?: string;
        url?: string;
    } | {
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
    }) => Promise<KanbanReviewSnapshot>;
    pendingArtifactId: string | null;
    selectedArtifact: (artifactId: string | null | undefined) => KanbanReviewArtifact | null;
};
