import { promises as fs } from "node:fs";
import { type KanbanCiGate, type KanbanIntegrationProvider, type KanbanMergeStatus, type KanbanPublishStatus, type KanbanPullRequestStatus, type KanbanReviewArtifact, type KanbanReviewCommentAnchor, type KanbanReviewFeedbackSource, type KanbanReviewDecision, type KanbanReviewStatus, type KanbanReviewSnapshot } from "@a5c-ai/agent-mux-core/kanban";
export interface ReviewServiceDeps {
    readFile: typeof fs.readFile;
    writeFile: typeof fs.writeFile;
    mkdir: typeof fs.mkdir;
    reviewFilePath: string;
    now: () => string;
    cwd: () => string;
}
export type ReviewActionInput = {
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
};
export declare class ReviewService {
    private readonly deps;
    constructor(overrides?: Partial<ReviewServiceDeps>);
    private readArtifacts;
    listReviews(filter?: {
        targetType?: KanbanReviewArtifact["targetType"];
        targetId?: string;
    }): Promise<KanbanReviewSnapshot>;
    applyAction(input: ReviewActionInput): Promise<KanbanReviewSnapshot>;
}
