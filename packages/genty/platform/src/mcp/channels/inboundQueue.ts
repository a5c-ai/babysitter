/**
 * GAP-MCPC-001: Inbound Message Queue.
 *
 * Stores inbound channel messages in-memory and provides wake-up
 * triggers for sleeping runs. Messages do not survive process restarts.
 */

import type { ChannelMessage, ChannelBinding } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WakeCallback = (runId: string, message: ChannelMessage) => void;

export interface InboundQueueOptions {
  /** Maximum messages to buffer per run before dropping oldest. */
  maxQueueSize?: number;
  /** Callback fired when a bound run receives a message (for wake-up). */
  onWake?: WakeCallback;
}

// ---------------------------------------------------------------------------
// InboundMessageQueue
// ---------------------------------------------------------------------------

export class InboundMessageQueue {
  private readonly _queues = new Map<string, ChannelMessage[]>();
  private readonly _bindings = new Map<string, ChannelBinding>();
  private readonly _maxQueueSize: number;
  private readonly _onWake: WakeCallback | undefined;

  constructor(options?: InboundQueueOptions) {
    this._maxQueueSize = options?.maxQueueSize ?? 100;
    this._onWake = options?.onWake;
  }

  /** Bind a channel to a run for message routing. */
  bindChannel(channelSource: string, runId: string): void {
    this._bindings.set(channelSource, {
      channelSource,
      runId,
      boundAt: new Date().toISOString(),
    });
  }

  /** Unbind a channel from its run. */
  unbindChannel(channelSource: string): void {
    this._bindings.delete(channelSource);
  }

  /** Get the run ID a channel is bound to (if any). */
  getBoundRunId(channelSource: string): string | undefined {
    return this._bindings.get(channelSource)?.runId;
  }

  /** Get all active bindings. */
  getBindings(): ChannelBinding[] {
    return [...this._bindings.values()];
  }

  /**
   * Enqueue an inbound message. Routes to bound run if one exists.
   * Fires the wake callback if a binding exists.
   */
  enqueue(message: ChannelMessage): void {
    const runId = this._bindings.get(message.source)?.runId;
    const queueKey = runId ?? "__unbound__";

    let queue = this._queues.get(queueKey);
    if (!queue) {
      queue = [];
      this._queues.set(queueKey, queue);
    }

    queue.push(message);

    // Trim if over max
    if (queue.length > this._maxQueueSize) {
      queue.shift();
    }

    // Fire wake callback for bound runs
    if (runId && this._onWake) {
      this._onWake(runId, message);
    }
  }

  /** Peek at messages for a run (does not remove). */
  peek(runId: string, limit = 10): ChannelMessage[] {
    const queue = this._queues.get(runId);
    if (!queue) return [];
    return queue.slice(-limit);
  }

  /** Dequeue (remove and return) messages for a run. */
  dequeue(runId: string, limit = 10): ChannelMessage[] {
    const queue = this._queues.get(runId);
    if (!queue || queue.length === 0) return [];
    return queue.splice(0, Math.min(limit, queue.length));
  }

  /** Get the number of queued messages for a run. */
  queueSize(runId: string): number {
    return this._queues.get(runId)?.length ?? 0;
  }

  /** Check if there are any messages for a run. */
  hasMessages(runId: string): boolean {
    return this.queueSize(runId) > 0;
  }

  /** Get unbound messages (not routed to any run). */
  getUnboundMessages(limit = 10): ChannelMessage[] {
    return this.peek("__unbound__", limit);
  }

  /** Clear all queues and bindings. */
  clear(): void {
    this._queues.clear();
    this._bindings.clear();
  }
}
