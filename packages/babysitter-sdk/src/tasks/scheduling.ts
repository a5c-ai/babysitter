/**
 * Effect Scheduling (GAP-ROUTE-002).
 *
 * Priority-based scheduling for effect execution. Effects are enqueued
 * with a priority level and dequeued in priority order (highest first).
 * Enables orchestration to process critical effects before lower-priority ones.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Priority levels for effect scheduling, from lowest to highest. */
export type EffectPriority = "low" | "normal" | "high" | "critical";

/** An effect entry in the priority queue. */
export interface ScheduledEffect<T = unknown> {
  /** Unique identifier for the scheduled effect. */
  id: string;
  /** Priority level. */
  priority: EffectPriority;
  /** The effect payload. */
  payload: T;
  /** When the effect was enqueued (ISO 8601). */
  enqueuedAt: string;
}

// ---------------------------------------------------------------------------
// Priority ordering
// ---------------------------------------------------------------------------

const PRIORITY_ORDER: Record<EffectPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

/** Compare two priorities. Returns positive if a > b, negative if a < b. */
export function comparePriority(a: EffectPriority, b: EffectPriority): number {
  return PRIORITY_ORDER[a] - PRIORITY_ORDER[b];
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

/**
 * Priority queue for scheduling effects.
 *
 * Effects are dequeued in priority order (critical first, then high,
 * normal, low). Within the same priority, FIFO ordering is preserved.
 */
export class EffectScheduler<T = unknown> {
  private readonly queue: Array<ScheduledEffect<T>> = [];

  /**
   * Enqueue an effect with a given priority.
   */
  enqueue(id: string, payload: T, priority: EffectPriority = "normal"): ScheduledEffect<T> {
    const entry: ScheduledEffect<T> = {
      id,
      priority,
      payload,
      enqueuedAt: new Date().toISOString(),
    };

    // Insert in sorted position (highest priority first, FIFO within same priority)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (PRIORITY_ORDER[this.queue[i]!.priority] < PRIORITY_ORDER[priority]) {
        insertIndex = i;
        break;
      }
    }
    this.queue.splice(insertIndex, 0, entry);

    return entry;
  }

  /**
   * Dequeue the highest-priority effect.
   * Returns undefined if the queue is empty.
   */
  dequeue(): ScheduledEffect<T> | undefined {
    return this.queue.shift();
  }

  /**
   * Peek at the highest-priority effect without removing it.
   */
  peek(): ScheduledEffect<T> | undefined {
    return this.queue[0];
  }

  /**
   * Get all scheduled effects in priority order (highest first).
   */
  getAll(): ReadonlyArray<ScheduledEffect<T>> {
    return [...this.queue];
  }

  /**
   * Get all effects with a specific priority.
   */
  getByPriority(priority: EffectPriority): Array<ScheduledEffect<T>> {
    return this.queue.filter((e) => e.priority === priority);
  }

  /**
   * Remove a specific effect by id.
   * Returns true if the effect was found and removed.
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.queue.splice(index, 1);
    return true;
  }

  /**
   * Number of effects in the queue.
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Whether the queue is empty.
   */
  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all scheduled effects.
   */
  clear(): void {
    this.queue.length = 0;
  }
}
