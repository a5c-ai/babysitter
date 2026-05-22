import type {
  Breakpoint,
  BreakpointPublicAnswer,
  BreakpointContext,
  BreakpointRouting,
  BreakpointWaitResult,
  ResponderProfile,
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
