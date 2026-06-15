import type {
  Breakpoint,
  BreakpointComment,
  BreakpointDependency,
  BreakpointPublicAnswer,
  BreakpointContext,
  BreakpointRouting,
  BreakpointStatus,
  BreakpointWaitResult,
  ResponderProfile,
  TaskPriority,
} from "./types.js";

/**
 * Parameters for submitting a new breakpoint to a backend.
 */
export interface SubmitBreakpointParams {
  /** The breakpoint question text. */
  text: string;
  /** Rich context for the breakpoint. */
  context: BreakpointContext;
  /** Routing configuration. */
  routing: BreakpointRouting;
  /** Optional task-management priority. */
  priority?: TaskPriority;
  /** Optional dependency list that can block completion. */
  dependsOn?: BreakpointDependency[];
  /** Whether the requester requires a signed answer. */
  proven?: boolean;
  /** Optional project scope. */
  projectId?: string;
  /** Optional repository scope. */
  repoId?: string;
}

/**
 * Options for waiting for an answer from a backend.
 */
export interface WaitForAnswerOptions {
  /** Maximum time to wait in milliseconds. */
  timeoutMs?: number;
  /** Polling interval in milliseconds (for polling-based backends). */
  pollIntervalMs?: number;
  /** Whether to prefer event-based updates over polling. */
  preferStreaming?: boolean;
  /** AbortSignal for external cancellation. */
  signal?: AbortSignal;
}

/**
 * Parameters for submitting an answer to a breakpoint.
 */
export interface SubmitAnswerParams {
  /** ID of the responder submitting the answer. */
  responderId: string;
  /** Display name of the responder. */
  responderName: string;
  /** The answer text. */
  text: string;
  /** Whether the breakpoint action is approved (for approval-type breakpoints). */
  approved?: boolean;
  /** Confidence score 0-100. */
  confidence?: number;
  /** Reference links or file paths. */
  references?: string[];
  /** Follow-up questions to consider. */
  followUpQuestions?: string[];
  /** Decision memory for future reference. */
  decisionMemory?: { applicabilityContext: string; reasoning: string };
  /** Whether the responder explicitly requests signing. */
  sign?: boolean;
  /** Specific signing key fingerprint to use when signing. */
  keyFingerprint?: string;
}

/**
 * Options for listing responders.
 */
export interface ListRespondersParams {
  projectId?: string;
  repoId?: string;
}

export interface BreakpointBackendCapabilities {
  search: boolean;
  bulkOperations: boolean;
  assignment: boolean;
  comments: boolean;
  history: boolean;
  metrics: boolean;
  export: boolean;
  forms: boolean;
  notifications: boolean;
  escalation: boolean;
}

export interface BreakpointSearchQuery {
  query?: string;
  status?: BreakpointStatus[];
  priority?: TaskPriority[];
  assigneeId?: string;
  responderId?: string;
  tags?: string[];
  domain?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortDirection?: "asc" | "desc";
  offset?: number;
  limit?: number;
}

export interface SearchBreakpointsResult {
  items: Breakpoint[];
  total: number;
  offset: number;
  limit: number;
}

export interface AssignBreakpointParams {
  assigneeId: string;
  assigneeName?: string;
  actorId?: string;
}

export interface TransitionBreakpointParams {
  status: BreakpointStatus;
  actorId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface AddBreakpointCommentParams {
  authorId: string;
  authorName?: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface BulkUpdateBreakpointsParams {
  ids: string[];
  action: "approve" | "close" | "cancel" | "reassign" | "transition";
  actorId?: string;
  assigneeId?: string;
  assigneeName?: string;
  status?: BreakpointStatus;
  answer?: SubmitAnswerParams;
  message?: string;
}

export interface BulkUpdateBreakpointItemResult {
  id: string;
  ok: boolean;
  breakpoint?: Breakpoint;
  errorCode?: "not_found" | "invalid_transition" | "unsupported" | "error";
  error?: string;
}

export interface BulkBreakpointOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  items: BulkUpdateBreakpointItemResult[];
}

export interface BreakpointMetricsSummary {
  total: number;
  byStatus: Partial<Record<BreakpointStatus, number>>;
  byPriority: Partial<Record<TaskPriority, number>>;
  responseTimeAverageMs?: number;
  completionTimeAverageMs?: number;
}

export interface BreakpointExport {
  schemaVersion: 1;
  exportedAt: string;
  total: number;
  items: Breakpoint[];
}

export class UnsupportedBreakpointFeatureError extends Error {
  readonly backendName: string;
  readonly feature: string;

  constructor(backendName: string, feature: string) {
    super(`Backend "${backendName}" does not support ${feature}`);
    this.name = "UnsupportedBreakpointFeatureError";
    this.backendName = backendName;
    this.feature = feature;
  }
}

export const unsupportedBreakpointBackendCapabilities: BreakpointBackendCapabilities = {
  search: false,
  bulkOperations: false,
  assignment: false,
  comments: false,
  history: false,
  metrics: false,
  export: false,
  forms: false,
  notifications: false,
  escalation: false,
};

export function unsupportedBreakpointFeature(backendName: string, feature: string): never {
  throw new UnsupportedBreakpointFeatureError(backendName, feature);
}

/**
 * Backend-agnostic interface for breakpoint lifecycle operations.
 *
 * Implementations may target different transports (git filesystem,
 * HTTP server, GitHub Issues, etc.) while presenting a uniform API.
 */
export interface BreakpointBackend {
  /** Human-readable name for this backend (e.g., "git-native", "server"). */
  readonly name: string;

  /**
   * Submit a new breakpoint.
   * Returns the created Breakpoint with a backend-assigned ID.
   */
  submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint>;

  /**
   * Retrieve a breakpoint by its ID.
   */
  getBreakpoint(id: string): Promise<Breakpoint>;

  /**
   * Wait for an answer to a breakpoint.
   * Resolves when an answer arrives, the breakpoint reaches a terminal state,
   * the timeout elapses, or the operation is aborted.
   */
  waitForAnswer(id: string, options?: WaitForAnswerOptions): Promise<BreakpointWaitResult>;

  /**
   * List pending breakpoints, optionally filtered by responder.
   */
  listPendingBreakpoints(responderId?: string): Promise<Breakpoint[]>;

  /**
   * Submit an answer for a breakpoint.
   */
  answerBreakpoint(id: string, answer: SubmitAnswerParams): Promise<BreakpointPublicAnswer>;

  /**
   * Cancel a pending breakpoint.
   */
  cancelBreakpoint(id: string): Promise<void>;

  /**
   * List available responder profiles.
   * Optional -- backends that don't manage responder discovery may return [].
   */
  listResponders?(params?: ListRespondersParams): Promise<ResponderProfile[]>;

  /**
   * Claim a breakpoint, indicating intent to answer.
   * Optional -- not all backends support explicit claiming.
   */
  claimBreakpoint?(id: string, responderId: string): Promise<Breakpoint>;

  /**
   * Report task-management capabilities supported by this backend.
   */
  capabilities?(): Promise<BreakpointBackendCapabilities> | BreakpointBackendCapabilities;

  /**
   * Search and filter breakpoints across lifecycle states.
   */
  searchBreakpoints?(query: BreakpointSearchQuery): Promise<SearchBreakpointsResult>;

  /**
   * Assign or reassign a breakpoint to a responder.
   */
  assignBreakpoint?(id: string, params: AssignBreakpointParams): Promise<Breakpoint>;

  /**
   * Transition a breakpoint through the validated task lifecycle.
   */
  transitionBreakpoint?(id: string, params: TransitionBreakpointParams): Promise<Breakpoint>;

  /**
   * Append a discussion comment to a breakpoint.
   */
  addBreakpointComment?(id: string, params: AddBreakpointCommentParams): Promise<BreakpointComment>;

  /**
   * Apply an operation to many breakpoints and report item-level outcomes.
   */
  bulkUpdateBreakpoints?(params: BulkUpdateBreakpointsParams): Promise<BulkBreakpointOperationResult>;

  /**
   * Compute deterministic metrics for matching breakpoints.
   */
  getBreakpointMetrics?(query?: BreakpointSearchQuery): Promise<BreakpointMetricsSummary>;

  /**
   * Export matching breakpoint data with credentials redacted.
   */
  exportBreakpoints?(query?: BreakpointSearchQuery): Promise<BreakpointExport>;
}

export function selectBreakpointAnswer(
  breakpoint: Pick<Breakpoint, "answers" | "selectedAnswer">,
): BreakpointPublicAnswer | undefined {
  if (breakpoint.answers.length === 0) {
    return undefined;
  }

  if (breakpoint.selectedAnswer) {
    return breakpoint.answers.find((answer) => answer.id === breakpoint.selectedAnswer);
  }

  return breakpoint.answers[0];
}

export function supportsProvenAnswers(backendName: string): boolean {
  return backendName === "git-native";
}

export function unsupportedBackendFeatureMessage(backendName: string, feature: string): string {
  return `Backend "${backendName}" does not support ${feature}. Proven signing is currently supported only by "git-native".`;
}
