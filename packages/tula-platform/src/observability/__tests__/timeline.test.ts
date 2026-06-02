import { describe, it, expect } from "vitest";
import { buildPhaseTimelineFromEvents } from "../timeline";
import type { JournalEvent } from "../../storage/types";

function makeEvent(
  seq: number,
  type: string,
  recordedAt: string,
  data: Record<string, unknown> = {},
): JournalEvent {
  return {
    seq,
    ulid: `ULID${seq.toString().padStart(6, "0")}`,
    filename: `${seq.toString().padStart(6, "0")}.ULID${seq.toString().padStart(6, "0")}.json`,
    path: `/fake/journal/${seq.toString().padStart(6, "0")}.json`,
    type,
    recordedAt,
    data,
  };
}

describe("buildPhaseTimelineFromEvents", () => {
  it("AC-OBS-010: returns empty timeline for empty journal", () => {
    const result = buildPhaseTimelineFromEvents([]);
    expect(result.phases).toHaveLength(0);
    expect(result.milestones).toHaveLength(0);
    expect(result.iterations).toHaveLength(0);
    expect(result.currentPhase).toBe("planning");
    expect(result.totalDurationMs).toBeNull();
  });

  it("AC-OBS-001: returns a PhaseTimeline object with correct structure", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:05:00Z", { effectId: "e1" }),
      makeEvent(4, "RUN_COMPLETED", "2026-01-01T00:06:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result).toHaveProperty("phases");
    expect(result).toHaveProperty("milestones");
    expect(result).toHaveProperty("iterations");
    expect(result).toHaveProperty("currentPhase");
    expect(result).toHaveProperty("totalDurationMs");
  });

  it("AC-OBS-002: identifies planning phase from RUN_CREATED to first EFFECT_REQUESTED", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    const planning = result.phases.find((p) => p.name === "planning");
    expect(planning).toBeDefined();
    expect(planning!.startedAt).toBe("2026-01-01T00:00:00Z");
    expect(planning!.endedAt).toBe("2026-01-01T00:01:00Z");
    expect(planning!.durationMs).toBe(60_000);
  });

  it("AC-OBS-003: identifies execution phase spanning EFFECT_REQUESTED to EFFECT_RESOLVED", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:05:00Z", { effectId: "e1" }),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    const execution = result.phases.find((p) => p.name === "execution");
    expect(execution).toBeDefined();
    expect(execution!.startedAt).toBe("2026-01-01T00:01:00Z");
    expect(execution!.endedAt).toBe("2026-01-01T00:05:00Z");
    expect(execution!.durationMs).toBe(240_000);
  });

  it("AC-OBS-004: identifies verification phase from quality-gate events", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:05:00Z", { effectId: "e1" }),
      makeEvent(4, "EFFECT_REQUESTED", "2026-01-01T00:05:30Z", { kind: "shell", taskId: "typecheck" }),
      makeEvent(5, "EFFECT_RESOLVED", "2026-01-01T00:06:00Z", { effectId: "e2", taskId: "typecheck" }),
      makeEvent(6, "EFFECT_REQUESTED", "2026-01-01T00:06:00Z", { kind: "agent", taskId: "adversarial-review" }),
      makeEvent(7, "EFFECT_RESOLVED", "2026-01-01T00:08:00Z", { effectId: "e3", taskId: "adversarial-review" }),
      makeEvent(8, "RUN_COMPLETED", "2026-01-01T00:08:30Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    const verification = result.phases.find((p) => p.name === "verification");
    expect(verification).toBeDefined();
    expect(verification!.durationMs).toBeGreaterThan(0);
  });

  it("AC-OBS-005: identifies completion phase from RUN_COMPLETED", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:05:00Z", { effectId: "e1" }),
      makeEvent(4, "RUN_COMPLETED", "2026-01-01T00:06:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    const completion = result.phases.find((p) => p.name === "completion");
    expect(completion).toBeDefined();
    expect(completion!.endedAt).toBe("2026-01-01T00:06:00Z");
  });

  it("AC-OBS-005: identifies completion phase from RUN_FAILED", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
      makeEvent(3, "RUN_FAILED", "2026-01-01T00:02:00Z", { error: "boom" }),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result.currentPhase).toBe("failed");
  });

  it("AC-OBS-006: each PhaseEntry has name, startedAt, endedAt, durationMs", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:05:00Z", { effectId: "e1" }),
      makeEvent(4, "RUN_COMPLETED", "2026-01-01T00:06:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    for (const phase of result.phases) {
      expect(phase).toHaveProperty("name");
      expect(phase).toHaveProperty("startedAt");
      expect(phase).toHaveProperty("endedAt");
      expect(phase).toHaveProperty("durationMs");
    }
  });

  it("AC-OBS-007: milestones extracted from breakpoints and quality gates", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "breakpoint", title: "Approve plan" }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:02:00Z", { effectId: "bp1", kind: "breakpoint" }),
      makeEvent(4, "EFFECT_REQUESTED", "2026-01-01T00:03:00Z", { kind: "agent", taskId: "adversarial-review" }),
      makeEvent(5, "EFFECT_RESOLVED", "2026-01-01T00:04:00Z", { effectId: "ar1", taskId: "adversarial-review" }),
      makeEvent(6, "RUN_COMPLETED", "2026-01-01T00:05:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result.milestones.length).toBeGreaterThanOrEqual(2);
    const bpMilestone = result.milestones.find((m) => m.type === "breakpoint");
    expect(bpMilestone).toBeDefined();
    const completeMilestone = result.milestones.find((m) => m.type === "run-completed");
    expect(completeMilestone).toBeDefined();
  });

  it("AC-OBS-008: currentPhase returns active phase for in-progress run", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result.currentPhase).toBe("execution");
  });

  it("AC-OBS-008: currentPhase returns completed for finished run", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "RUN_COMPLETED", "2026-01-01T00:01:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result.currentPhase).toBe("completed");
  });

  it("AC-OBS-009: totalDurationMs computed from first to last event", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:05:00Z", { effectId: "e1" }),
      makeEvent(4, "RUN_COMPLETED", "2026-01-01T00:10:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result.totalDurationMs).toBe(600_000); // 10 minutes
  });

  it("AC-OBS-011: handles partial journal with open-ended active phase", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent" }),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    const execution = result.phases.find((p) => p.name === "execution");
    expect(execution).toBeDefined();
    expect(execution!.endedAt).toBeNull();
    expect(execution!.durationMs).toBeNull();
  });

  it("AC-OBS-013: iterations track per-iteration phase breakdowns", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
      // Iteration 1
      makeEvent(2, "EFFECT_REQUESTED", "2026-01-01T00:01:00Z", { kind: "agent", iteration: 1 }),
      makeEvent(3, "EFFECT_RESOLVED", "2026-01-01T00:05:00Z", { effectId: "e1", iteration: 1 }),
      // Iteration 2
      makeEvent(4, "EFFECT_REQUESTED", "2026-01-01T00:06:00Z", { kind: "agent", iteration: 2 }),
      makeEvent(5, "EFFECT_RESOLVED", "2026-01-01T00:10:00Z", { effectId: "e2", iteration: 2 }),
      makeEvent(6, "RUN_COMPLETED", "2026-01-01T00:11:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result.iterations.length).toBeGreaterThanOrEqual(1);
  });

  it("planning-only journal shows planning as current phase", () => {
    const events = [
      makeEvent(1, "RUN_CREATED", "2026-01-01T00:00:00Z"),
    ];
    const result = buildPhaseTimelineFromEvents(events);
    expect(result.currentPhase).toBe("planning");
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].name).toBe("planning");
    expect(result.phases[0].endedAt).toBeNull();
  });
});
