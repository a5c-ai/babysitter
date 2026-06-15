/**
 * Subagent Progress Tracking (GAP-SUBOBS-002).
 *
 * Tracks progress of delegated subagent tasks with status, timing,
 * and token usage. Provides real-time visibility into what subagents
 * are doing during orchestration.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubagentStatus = "pending" | "running" | "completed" | "failed";

export interface SubagentProgressEntry {
  /** Unique identifier for the subagent invocation. */
  id: string;
  /** Human-readable label or task description. */
  label: string;
  /** Current status. */
  status: SubagentStatus;
  /** When the subagent was started (ISO 8601). */
  startedAt: string;
  /** When the subagent completed or failed (ISO 8601), if finished. */
  finishedAt: string | null;
  /** Duration in milliseconds, or null if still running. */
  durationMs: number | null;
  /** Estimated tokens consumed so far. */
  tokensUsed: number;
  /** Optional progress message or detail. */
  message?: string;
}

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

/**
 * Tracks subagent progress for an orchestration session.
 *
 * Thread-safe for single-threaded Node.js event loop usage.
 */
export class SubagentProgressTracker {
  private readonly entries = new Map<string, SubagentProgressEntry>();

  /**
   * Start tracking a new subagent invocation.
   */
  start(id: string, label: string): SubagentProgressEntry {
    const entry: SubagentProgressEntry = {
      id,
      label,
      status: "running",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      durationMs: null,
      tokensUsed: 0,
    };
    this.entries.set(id, entry);
    return entry;
  }

  /**
   * Update an existing subagent entry with partial data.
   * Returns the updated entry, or undefined if the id is not found.
   */
  update(
    id: string,
    updates: Partial<Pick<SubagentProgressEntry, "status" | "tokensUsed" | "message">>,
  ): SubagentProgressEntry | undefined {
    const entry = this.entries.get(id);
    if (!entry) return undefined;

    if (updates.status !== undefined) {
      entry.status = updates.status;
      if (updates.status === "completed" || updates.status === "failed") {
        entry.finishedAt = new Date().toISOString();
        entry.durationMs = new Date(entry.finishedAt).getTime() - new Date(entry.startedAt).getTime();
      }
    }
    if (updates.tokensUsed !== undefined) {
      entry.tokensUsed = updates.tokensUsed;
    }
    if (updates.message !== undefined) {
      entry.message = updates.message;
    }

    return entry;
  }

  /**
   * Get all tracked entries.
   */
  getAll(): SubagentProgressEntry[] {
    return [...this.entries.values()];
  }

  /**
   * Get entries that are still running.
   */
  getActive(): SubagentProgressEntry[] {
    return this.getAll().filter((e) => e.status === "running" || e.status === "pending");
  }

  /**
   * Get entries that have completed (successfully or with failure).
   */
  getCompleted(): SubagentProgressEntry[] {
    return this.getAll().filter((e) => e.status === "completed" || e.status === "failed");
  }

  /**
   * Get a specific entry by id.
   */
  get(id: string): SubagentProgressEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Remove all tracked entries.
   */
  clear(): void {
    this.entries.clear();
  }
}
