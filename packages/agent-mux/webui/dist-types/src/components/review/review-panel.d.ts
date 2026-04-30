import type { KanbanReviewArtifact, KanbanReviewCommentAnchor, KanbanReviewDecision, KanbanReviewFeedbackSource, KanbanReviewSnapshot } from "@a5c-ai/agent-mux-core/kanban";
export declare function ReviewPanel(props: {
    title: string;
    description: string;
    empty: string;
    loading: boolean;
    error?: string | null;
    artifacts: readonly KanbanReviewArtifact[];
    queue: KanbanReviewSnapshot["queue"];
    summary?: KanbanReviewSnapshot["summary"];
    pendingArtifactId?: string | null;
    onApprove: (artifactId: string) => void | Promise<void>;
    onRequestChanges: (artifactId: string) => void | Promise<void>;
    onSubmitReview?: (input: {
        artifactId: string;
        decision: KanbanReviewDecision;
        summary?: string;
        executionTargetId?: string;
    }) => void | Promise<void>;
    onAddComment: (input: {
        artifactId: string;
        body: string;
        anchor: KanbanReviewCommentAnchor;
        feedbackSource?: KanbanReviewFeedbackSource;
    }) => void | Promise<void>;
}): import("react/jsx-runtime").JSX.Element;
