/**
 * AuditLog — append-only structured log for security-relevant and
 * compliance-relevant actions within a babysitter agent runtime session.
 *
 * Each entry captures *who* did *what* to *which target*, with an optional
 * telemetry span correlation. Entries are queryable by actor, action, and
 * time range.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single audit log entry. */
export interface AuditEntry {
  /** Who performed the action (user id, agent name, system, etc.). */
  readonly actor: string;
  /** What action was performed. */
  readonly action: string;
  /** What the action was performed on (resource, span, task, etc.). */
  readonly target: string;
  /** Optional human-readable detail or serialized context. */
  readonly detail?: string;
  /** Optional telemetry span ID to correlate with the span tree. */
  readonly spanId?: string;
  /** ISO-8601 timestamp of when the entry was recorded. */
  readonly timestamp: string;
}

/** Filter criteria for querying the audit log. */
export interface AuditFilter {
  /** Match entries from this actor. */
  actor?: string;
  /** Match entries with this action. */
  action?: string;
  /** Match entries recorded at or after this ISO-8601 timestamp. */
  from?: string;
  /** Match entries recorded at or before this ISO-8601 timestamp. */
  to?: string;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/** Append-only in-memory audit log. */
export class AuditLog {
  private readonly entries: AuditEntry[] = [];

  /**
   * Record a new audit entry.
   *
   * The timestamp is auto-populated to the current time.
   */
  record(entry: Omit<AuditEntry, "timestamp">): AuditEntry {
    const full: AuditEntry = { ...entry, timestamp: new Date().toISOString() };
    this.entries.push(full);
    return full;
  }

  /**
   * Query log entries with optional filters.
   *
   * All supplied filter fields are AND-ed together. Omitted fields match
   * everything.
   */
  getEntries(filter?: AuditFilter): AuditEntry[] {
    if (!filter) {
      return [...this.entries];
    }

    return this.entries.filter((e) => {
      if (filter.actor && e.actor !== filter.actor) return false;
      if (filter.action && e.action !== filter.action) return false;
      if (filter.from && e.timestamp < filter.from) return false;
      if (filter.to && e.timestamp > filter.to) return false;
      return true;
    });
  }

  /** Total number of entries in the log. */
  get size(): number {
    return this.entries.length;
  }

  /** Clear all entries (useful in tests or session resets). */
  clear(): void {
    this.entries.length = 0;
  }
}
