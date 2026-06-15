/**
 * Subagent Health Monitoring (GAP-SUBOBS-004).
 *
 * Monitors the liveness of delegated subagents via heartbeat tracking.
 * Detects stale agents that have stopped reporting and surfaces health
 * status for orchestration decision-making.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubagentHealthStatus = "healthy" | "degraded" | "stale" | "unknown";

export interface SubagentHealthRecord {
  /** Subagent identifier. */
  id: string;
  /** Current health status. */
  status: SubagentHealthStatus;
  /** Timestamp of the last heartbeat (ISO 8601). */
  lastHeartbeatAt: string;
  /** When the agent was first registered (ISO 8601). */
  registeredAt: string;
  /** Number of heartbeats received. */
  heartbeatCount: number;
}

// ---------------------------------------------------------------------------
// Monitor
// ---------------------------------------------------------------------------

export interface SubagentHealthMonitorOptions {
  /**
   * Duration in milliseconds after which a subagent with no heartbeat
   * is considered stale. Default: 60_000 (1 minute).
   */
  staleThresholdMs?: number;
}

const DEFAULT_STALE_THRESHOLD_MS = 60_000;

/**
 * Monitors subagent health via heartbeat registration and staleness checks.
 */
export class SubagentHealthMonitor {
  private readonly records = new Map<string, SubagentHealthRecord>();
  private readonly staleThresholdMs: number;

  constructor(options?: SubagentHealthMonitorOptions) {
    this.staleThresholdMs = options?.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS;
  }

  /**
   * Register a new subagent for health monitoring.
   */
  register(id: string): SubagentHealthRecord {
    const now = new Date().toISOString();
    const record: SubagentHealthRecord = {
      id,
      status: "unknown",
      lastHeartbeatAt: now,
      registeredAt: now,
      heartbeatCount: 0,
    };
    this.records.set(id, record);
    return record;
  }

  /**
   * Record a heartbeat from a subagent.
   * Marks the agent as healthy if it was previously unknown or degraded.
   */
  heartbeat(id: string): SubagentHealthRecord | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;

    record.lastHeartbeatAt = new Date().toISOString();
    record.heartbeatCount += 1;
    record.status = "healthy";
    return record;
  }

  /**
   * Check the health of a specific subagent at a given point in time.
   * Updates the status based on elapsed time since last heartbeat.
   */
  checkHealth(id: string, now?: number): SubagentHealthRecord | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;

    const currentTime = now ?? Date.now();
    const elapsed = currentTime - new Date(record.lastHeartbeatAt).getTime();

    if (record.heartbeatCount === 0) {
      record.status = "unknown";
    } else if (elapsed > this.staleThresholdMs) {
      record.status = "stale";
    } else if (elapsed > this.staleThresholdMs / 2) {
      record.status = "degraded";
    } else {
      record.status = "healthy";
    }

    return record;
  }

  /**
   * Get all subagents whose last heartbeat exceeds the stale threshold.
   */
  getStaleAgents(now?: number): SubagentHealthRecord[] {
    const currentTime = now ?? Date.now();
    const stale: SubagentHealthRecord[] = [];

    for (const record of this.records.values()) {
      const elapsed = currentTime - new Date(record.lastHeartbeatAt).getTime();
      if (elapsed > this.staleThresholdMs && record.heartbeatCount > 0) {
        record.status = "stale";
        stale.push(record);
      }
    }

    return stale;
  }

  /**
   * Get a specific record by id.
   */
  get(id: string): SubagentHealthRecord | undefined {
    return this.records.get(id);
  }

  /**
   * Get all registered records.
   */
  getAll(): SubagentHealthRecord[] {
    return [...this.records.values()];
  }

  /**
   * Unregister a subagent.
   */
  unregister(id: string): boolean {
    return this.records.delete(id);
  }
}
