/**
 * GAP-SUBOBS-004: Subagent Health Monitor tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  SubagentHealthMonitor,
  type SubagentHealthRecord,
  type SubagentHealthStatus,
} from "../subagentHealth";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SubagentHealthMonitor", () => {
  let monitor: SubagentHealthMonitor;

  beforeEach(() => {
    monitor = new SubagentHealthMonitor({ staleThresholdMs: 10_000 });
  });

  // ---- register ----

  it("registers a new subagent with unknown status", () => {
    const record = monitor.register("agent-1");
    expect(record.id).toBe("agent-1");
    expect(record.status).toBe("unknown" satisfies SubagentHealthStatus);
    expect(record.heartbeatCount).toBe(0);
    expect(record.registeredAt).toBeDefined();
    expect(record.lastHeartbeatAt).toBeDefined();
  });

  it("registers multiple agents", () => {
    monitor.register("agent-1");
    monitor.register("agent-2");
    expect(monitor.getAll()).toHaveLength(2);
  });

  // ---- heartbeat ----

  it("marks agent as healthy after heartbeat", () => {
    monitor.register("agent-1");
    const record = monitor.heartbeat("agent-1");
    expect(record).toBeDefined();
    expect(record!.status).toBe("healthy" satisfies SubagentHealthStatus);
    expect(record!.heartbeatCount).toBe(1);
  });

  it("increments heartbeat count on each call", () => {
    monitor.register("agent-1");
    monitor.heartbeat("agent-1");
    monitor.heartbeat("agent-1");
    monitor.heartbeat("agent-1");
    const record = monitor.get("agent-1");
    expect(record!.heartbeatCount).toBe(3);
  });

  it("returns undefined for heartbeat on unregistered agent", () => {
    expect(monitor.heartbeat("unknown")).toBeUndefined();
  });

  // ---- checkHealth ----

  it("returns healthy for recently active agent", () => {
    monitor.register("agent-1");
    monitor.heartbeat("agent-1");
    const now = Date.now();
    const record = monitor.checkHealth("agent-1", now);
    expect(record!.status).toBe("healthy" satisfies SubagentHealthStatus);
  });

  it("returns degraded when past half stale threshold", () => {
    monitor.register("agent-1");
    monitor.heartbeat("agent-1");
    // Advance time past half the stale threshold (5s with 10s threshold)
    const now = Date.now() + 6_000;
    const record = monitor.checkHealth("agent-1", now);
    expect(record!.status).toBe("degraded" satisfies SubagentHealthStatus);
  });

  it("returns stale when past stale threshold", () => {
    monitor.register("agent-1");
    monitor.heartbeat("agent-1");
    // Advance time past the stale threshold (10s)
    const now = Date.now() + 11_000;
    const record = monitor.checkHealth("agent-1", now);
    expect(record!.status).toBe("stale" satisfies SubagentHealthStatus);
  });

  it("returns unknown for agent with no heartbeats", () => {
    monitor.register("agent-1");
    const now = Date.now() + 20_000;
    const record = monitor.checkHealth("agent-1", now);
    expect(record!.status).toBe("unknown" satisfies SubagentHealthStatus);
  });

  it("returns undefined for non-existent agent", () => {
    expect(monitor.checkHealth("unknown")).toBeUndefined();
  });

  // ---- getStaleAgents ----

  it("returns agents that exceeded stale threshold", () => {
    monitor.register("agent-1");
    monitor.register("agent-2");
    monitor.heartbeat("agent-1");
    monitor.heartbeat("agent-2");

    // Advance time past threshold for both
    const now = Date.now() + 15_000;
    const stale = monitor.getStaleAgents(now);
    expect(stale).toHaveLength(2);
    expect(stale.every((r) => r.status === "stale")).toBe(true);
  });

  it("excludes agents with recent heartbeats", () => {
    monitor.register("agent-1");
    monitor.register("agent-2");
    monitor.heartbeat("agent-1");
    monitor.heartbeat("agent-2");

    // Only slightly advanced — neither stale
    const now = Date.now() + 1_000;
    const stale = monitor.getStaleAgents(now);
    expect(stale).toHaveLength(0);
  });

  it("excludes agents with no heartbeats (unknown)", () => {
    monitor.register("agent-1");
    const now = Date.now() + 20_000;
    const stale = monitor.getStaleAgents(now);
    // Agent has heartbeatCount=0, so not considered stale (just unknown)
    expect(stale).toHaveLength(0);
  });

  // ---- get / getAll ----

  it("retrieves a specific record by id", () => {
    monitor.register("agent-1");
    const record = monitor.get("agent-1");
    expect(record).toBeDefined();
    expect(record!.id).toBe("agent-1");
  });

  it("returns undefined for unknown id", () => {
    expect(monitor.get("unknown")).toBeUndefined();
  });

  it("returns all records", () => {
    monitor.register("agent-1");
    monitor.register("agent-2");
    monitor.register("agent-3");
    expect(monitor.getAll()).toHaveLength(3);
  });

  // ---- unregister ----

  it("removes a registered agent", () => {
    monitor.register("agent-1");
    expect(monitor.unregister("agent-1")).toBe(true);
    expect(monitor.get("agent-1")).toBeUndefined();
    expect(monitor.getAll()).toHaveLength(0);
  });

  it("returns false for unregistering unknown agent", () => {
    expect(monitor.unregister("unknown")).toBe(false);
  });

  // ---- default stale threshold ----

  it("uses default stale threshold of 60s when none specified", () => {
    const defaultMonitor = new SubagentHealthMonitor();
    defaultMonitor.register("agent-1");
    defaultMonitor.heartbeat("agent-1");

    // At 30s (half threshold): should be degraded
    const record30s = defaultMonitor.checkHealth("agent-1", Date.now() + 31_000);
    expect(record30s!.status).toBe("degraded");

    // At 61s: should be stale
    const record61s = defaultMonitor.checkHealth("agent-1", Date.now() + 61_000);
    expect(record61s!.status).toBe("stale");
  });
});
