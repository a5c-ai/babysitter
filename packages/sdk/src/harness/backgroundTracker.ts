export interface BackgroundEffectEntry {
  effectId: string;
  invocationKey: string;
  kind: string;
  dispatchedAt: string;
  pollIntervalMs: number;
  timeoutMs?: number;
}

export interface BackgroundEffectStatus {
  effectId: string;
  state: "running" | "completed" | "error" | "timed_out";
  lastPolledAt: string;
}

interface CompletedEntry {
  effectId: string;
  result?: {
    status: string;
    value?: unknown;
    error?: unknown;
  };
}

interface TrackedEffect {
  entry: BackgroundEffectEntry;
  lastPolledAt?: string;
  completed: boolean;
  result?: {
    status: string;
    value?: unknown;
    error?: unknown;
  };
}

/**
 * Tracks background effects that have been dispatched but not yet resolved.
 * Supports polling, timeout checking, and collecting completed results.
 */
export class BackgroundEffectTracker {
  private readonly effects = new Map<string, TrackedEffect>();

  /**
   * Start tracking a dispatched background effect.
   */
  track(entry: BackgroundEffectEntry): void {
    this.effects.set(entry.effectId, {
      entry,
      completed: false,
    });
  }

  /**
   * Get all currently tracked (non-completed) effects.
   */
  getAll(): BackgroundEffectEntry[] {
    const result: BackgroundEffectEntry[] = [];
    for (const tracked of this.effects.values()) {
      if (!tracked.completed) {
        result.push(tracked.entry);
      }
    }
    return result;
  }

  /**
   * Get a tracked effect by effectId, or undefined if not found.
   */
  get(effectId: string): BackgroundEffectEntry | undefined {
    const tracked = this.effects.get(effectId);
    if (!tracked || tracked.completed) return undefined;
    return tracked.entry;
  }

  /**
   * Poll a background effect's status. Updates lastPolledAt.
   * Throws if the effectId is not tracked.
   */
  poll(effectId: string): BackgroundEffectStatus {
    const tracked = this.effects.get(effectId);
    if (!tracked) {
      throw new Error(`Background effect not found: ${effectId}`);
    }

    const now = new Date().toISOString();
    tracked.lastPolledAt = now;

    return {
      effectId,
      state: tracked.completed ? "completed" : "running",
      lastPolledAt: now,
    };
  }

  /**
   * Mark a background effect as completed with a result.
   */
  markCompleted(effectId: string, result: { status: string; value?: unknown; error?: unknown }): void {
    const tracked = this.effects.get(effectId);
    if (!tracked) {
      throw new Error(`Background effect not found: ${effectId}`);
    }
    tracked.completed = true;
    tracked.result = result;
  }

  /**
   * Collect and remove all completed effects from the tracker.
   */
  collectCompleted(): CompletedEntry[] {
    const completed: CompletedEntry[] = [];

    for (const [id, tracked] of this.effects.entries()) {
      if (tracked.completed) {
        completed.push({
          effectId: id,
          result: tracked.result,
        });
        this.effects.delete(id);
      }
    }

    return completed;
  }

  /**
   * Check all tracked effects for timeout. Effects that have exceeded their
   * timeoutMs are marked as completed with an error.
   */
  checkTimeouts(): void {
    const now = Date.now();

    for (const tracked of this.effects.values()) {
      if (tracked.completed) continue;

      const timeoutMs = tracked.entry.timeoutMs;
      if (timeoutMs === undefined) continue;

      const dispatched = new Date(tracked.entry.dispatchedAt).getTime();
      if (now - dispatched >= timeoutMs) {
        tracked.completed = true;
        tracked.result = {
          status: "error",
          error: `Background effect '${tracked.entry.effectId}' timed out after ${timeoutMs}ms`,
        };
      }
    }
  }
}
