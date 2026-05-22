/**
 * InteractionChannel types for @a5c-ai/agent-mux.
 *
 * Defines the queue-based interaction handler for pending agent requests
 * (approval requests and input prompts), and associated response types.
 */

// ---------------------------------------------------------------------------
// InteractionDetail
// ---------------------------------------------------------------------------

export interface ApprovalDetail {
  readonly kind: 'approval';
  readonly action: string;
  readonly toolName: string | undefined;
  readonly riskLevel: 'low' | 'medium' | 'high';
}

export interface InputDetail {
  readonly kind: 'input';
  readonly question: string;
  readonly context: string | undefined;
  readonly source: 'agent' | 'tool';
}

/** Discriminated union for the additional context carried by a PendingInteraction. */
export type InteractionDetail = ApprovalDetail | InputDetail;

// ---------------------------------------------------------------------------
// PendingInteraction
// ---------------------------------------------------------------------------

/**
 * A pending interaction awaiting a response from the consumer.
 *
 * Created when the agent emits an `approval_request` or `input_required`
 * event and not yet resolved.
 */
export interface PendingInteraction {
  /** Unique identifier for this interaction. Matches the `interactionId` on the source event. */
  readonly id: string;

  /** Discriminant for the interaction type. */
  readonly type: 'approval' | 'input';

  /** The `runId` of the run that generated this interaction. */
  readonly runId: string;

  /** Human-readable description of what the agent wants to do or needs. */
  readonly description: string;

  /** Additional context about the interaction. */
  readonly detail: InteractionDetail;

  /** Timestamp (ms since epoch) when the interaction was created. */
  readonly createdAt: number;
}

// ---------------------------------------------------------------------------
// InteractionResponse
// ---------------------------------------------------------------------------

export interface ApproveResponse {
  readonly type: 'approve';
  readonly detail?: string;
}

export interface DenyResponse {
  readonly type: 'deny';
  readonly reason?: string;
}

export interface TextInputResponse {
  readonly type: 'text';
  readonly text: string;
}

/** A response to a pending interaction. */
export type InteractionResponse = ApproveResponse | DenyResponse | TextInputResponse;

// ---------------------------------------------------------------------------
// InteractionChannel
// ---------------------------------------------------------------------------

/**
 * Queue-based interaction handler for pending agent requests.
 *
 * Tracks all unresolved approval requests and input prompts, provides
 * notification when new interactions arrive, and offers response methods
 * for individual or batch resolution.
 */
export interface InteractionChannel {
  /**
   * Array of currently pending interactions, in arrival order.
   * Read this each time you need the current state — it is not updated in place.
   */
  readonly pending: PendingInteraction[];

  /**
   * Register a callback invoked whenever a new interaction becomes pending.
   *
   * @returns An unsubscribe function.
   */
  onPending(handler: (interaction: PendingInteraction) => void): () => void;

  /**
   * Respond to a specific pending interaction by its ID.
   *
   * @throws {AgentMuxError} code `INTERACTION_NOT_FOUND` if no pending interaction matches.
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   */
  respond(id: string, response: InteractionResponse): Promise<void>;

  /**
   * Approve all currently pending approval interactions at once.
   * Input interactions are skipped.
   */
  approveAll(): Promise<void>;

  /**
   * Deny all currently pending approval interactions.
   * Input interactions are skipped.
   *
   * @param reason - Optional denial reason forwarded to the agent.
   */
  denyAll(reason?: string): Promise<void>;
}
