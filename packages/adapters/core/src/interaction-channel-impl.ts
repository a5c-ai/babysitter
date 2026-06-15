/**
 * InteractionChannelImpl — concrete implementation of InteractionChannel.
 *
 * Maintains a pending queue of interactions, fires onPending callbacks,
 * and performs auto-resolution for 'yolo' and 'deny' approval modes.
 */

import { AgentMuxError } from './errors.js';
import type {
  InteractionChannel,
  PendingInteraction,
  InteractionResponse,
  ApprovalDetail,
  InputDetail,
} from './interaction.js';
import type { ApprovalRequestEvent, InputRequiredEvent } from './events.js';

// ---------------------------------------------------------------------------
// InteractionChannelImpl
// ---------------------------------------------------------------------------

export class InteractionChannelImpl implements InteractionChannel {
  /** Currently pending interactions, in arrival order. */
  private _pending: PendingInteraction[] = [];

  /** Registered onPending handlers. */
  private _handlers: ((interaction: PendingInteraction) => void)[] = [];

  /**
   * Response dispatcher injected by RunHandleImpl.
   * Called when the consumer responds to an interaction; the run handle
   * is responsible for writing the response to the agent subprocess.
   */
  private _dispatch: ((id: string, response: InteractionResponse) => Promise<void>) | null = null;

  /** Whether the run is still active. Set to false when the run terminates. */
  private _active = true;

  /** Approval mode for auto-resolution. */
  private readonly _approvalMode: 'yolo' | 'prompt' | 'deny';

  constructor(approvalMode: 'yolo' | 'prompt' | 'deny' = 'prompt') {
    this._approvalMode = approvalMode;
  }

  // ── InteractionChannel interface ─────────────────────────────────────────

  get pending(): PendingInteraction[] {
    return [...this._pending];
  }

  onPending(handler: (interaction: PendingInteraction) => void): () => void {
    this._handlers.push(handler);
    return () => {
      const idx = this._handlers.indexOf(handler);
      if (idx !== -1) this._handlers.splice(idx, 1);
    };
  }

  async respond(id: string, response: InteractionResponse): Promise<void> {
    if (!this._active) {
      throw new AgentMuxError('RUN_NOT_ACTIVE', 'Cannot respond to an interaction after the run has terminated', false);
    }

    const idx = this._pending.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new AgentMuxError('INTERACTION_NOT_FOUND', `No pending interaction with id '${id}'`, false);
    }

    // Remove from pending before dispatching (prevents double-response).
    this._pending.splice(idx, 1);

    if (this._dispatch) {
      await this._dispatch(id, response);
    }
  }

  async approveAll(): Promise<void> {
    const approvals = this._pending.filter((p) => p.type === 'approval');
    for (const interaction of approvals) {
      await this.respond(interaction.id, { type: 'approve' });
    }
  }

  async denyAll(reason?: string): Promise<void> {
    const approvals = this._pending.filter((p) => p.type === 'approval');
    for (const interaction of approvals) {
      await this.respond(interaction.id, { type: 'deny', reason });
    }
  }

  // ── Internal methods (called by RunHandleImpl) ────────────────────────────

  /**
   * Inject the response dispatcher. Called by RunHandleImpl during construction.
   */
  setDispatch(dispatch: (id: string, response: InteractionResponse) => Promise<void>): void {
    this._dispatch = dispatch;
  }

  /**
   * Mark the run as terminated. Clears pending interactions (they expire).
   */
  terminate(): void {
    this._active = false;
    this._pending = [];
  }

  /**
   * Handle an incoming approval_request event.
   *
   * If approvalMode is 'yolo', auto-approves without queuing.
   * If approvalMode is 'deny', auto-denies without queuing.
   * Otherwise, queues to pending and fires onPending handlers.
   *
   * @returns Whether the interaction was auto-resolved (true = handled internally).
   */
  handleApprovalRequest(event: ApprovalRequestEvent): boolean {
    if (this._approvalMode === 'yolo') {
      // Auto-approve — do not queue, caller should emit approval_granted
      if (this._dispatch) {
        void this._dispatch(event.interactionId, { type: 'approve' });
      }
      return true;
    }

    if (this._approvalMode === 'deny') {
      // Auto-deny — do not queue, caller should emit approval_denied
      if (this._dispatch) {
        void this._dispatch(event.interactionId, { type: 'deny' });
      }
      return true;
    }

    // 'prompt' mode — queue it
    const detail: ApprovalDetail = {
      kind: 'approval',
      action: event.action,
      toolName: event.toolName,
      riskLevel: event.riskLevel,
    };
    const interaction: PendingInteraction = {
      id: event.interactionId,
      type: 'approval',
      runId: event.runId,
      description: event.detail,
      detail,
      createdAt: event.timestamp,
    };
    this._addPending(interaction);
    return false;
  }

  /**
   * Handle an incoming input_required event.
   *
   * Input interactions are always queued regardless of approvalMode.
   * (approvalMode only affects approval-type interactions.)
   */
  handleInputRequired(event: InputRequiredEvent): void {
    const detail: InputDetail = {
      kind: 'input',
      question: event.question,
      context: event.context,
      source: event.source,
    };
    const interaction: PendingInteraction = {
      id: event.interactionId,
      type: 'input',
      runId: event.runId,
      description: event.question,
      detail,
      createdAt: event.timestamp,
    };
    this._addPending(interaction);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _addPending(interaction: PendingInteraction): void {
    this._pending.push(interaction);
    for (const handler of this._handlers) {
      try {
        handler(interaction);
      } catch (_err) {
        // Swallow handler errors — they must not disrupt the interaction pipeline.
      }
    }
  }
}
