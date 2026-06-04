import { describe, it, expect } from "vitest";
import {
  mapAmuxEvent,
  isToolEvent,
  isCostEvent,
  isInteractiveEvent,
  isErrorEvent,
  isSessionLifecycleEvent,
} from "../agentMuxEventMapper";
import type { AmuxAgentEvent } from "../agentMuxTypes";

function makeEvent(overrides: Partial<AmuxAgentEvent> = {}): AmuxAgentEvent {
  return {
    type: "text_delta",
    runId: "run-001",
    agent: "claude",
    timestamp: "2026-04-19T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapAmuxEvent", () => {
  it("maps a known event type to the corresponding kind", () => {
    const result = mapAmuxEvent(makeEvent({ type: "session_start" }));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("session_start");
  });

  it("preserves runId, agent, and timestamp", () => {
    const result = mapAmuxEvent(
      makeEvent({
        type: "text_delta",
        runId: "r-42",
        agent: "codex",
        timestamp: "2026-01-01T12:00:00Z",
      }),
    );
    expect(result!.runId).toBe("r-42");
    expect(result!.agent).toBe("codex");
    expect(result!.timestamp).toBe("2026-01-01T12:00:00Z");
  });

  it("puts extra fields into data with originalType", () => {
    const result = mapAmuxEvent(
      makeEvent({
        type: "cost",
        totalCost: 0.05,
        inputTokens: 100,
      }),
    );
    expect(result!.data["originalType"]).toBe("cost");
    expect(result!.data["totalCost"]).toBe(0.05);
    expect(result!.data["inputTokens"]).toBe(100);
  });

  it("maps unknown event types to 'unknown' kind", () => {
    const result = mapAmuxEvent(makeEvent({ type: "debug_internal_xyz" }));
    expect(result!.kind).toBe("unknown");
    expect(result!.data["originalType"]).toBe("debug_internal_xyz");
  });

  it("returns null for null or undefined input", () => {
    expect(mapAmuxEvent(null as unknown as AmuxAgentEvent)).toBeNull();
    expect(mapAmuxEvent(undefined as unknown as AmuxAgentEvent)).toBeNull();
  });

  it("returns null for event with no type", () => {
    expect(
      mapAmuxEvent({ runId: "r", agent: "a", timestamp: "t" } as unknown as AmuxAgentEvent),
    ).toBeNull();
  });

  it("maps all known event types correctly", () => {
    const knownTypes = [
      "session_start",
      "session_end",
      "text_delta",
      "thinking_delta",
      "tool_call_start",
      "tool_result",
      "cost",
      "token_usage",
      "approval_request",
      "input_required",
      "error",
      "crash",
      "context_compacted",
    ];
    for (const type of knownTypes) {
      const result = mapAmuxEvent(makeEvent({ type }));
      expect(result!.kind).toBe(type);
    }
  });

  it("defaults agent to 'unknown' when missing", () => {
    const event = { type: "text_delta", runId: "r", timestamp: "t" } as AmuxAgentEvent;
    const result = mapAmuxEvent(event);
    expect(result!.agent).toBe("unknown");
  });

  it("defaults runId to empty string when missing", () => {
    const event = { type: "text_delta", agent: "a", timestamp: "t" } as AmuxAgentEvent;
    const result = mapAmuxEvent(event);
    expect(result!.runId).toBe("");
  });
});

describe("event predicates", () => {
  it("isToolEvent identifies tool_call_start and tool_result", () => {
    expect(isToolEvent(mapAmuxEvent(makeEvent({ type: "tool_call_start" }))!)).toBe(true);
    expect(isToolEvent(mapAmuxEvent(makeEvent({ type: "tool_result" }))!)).toBe(true);
    expect(isToolEvent(mapAmuxEvent(makeEvent({ type: "text_delta" }))!)).toBe(false);
  });

  it("isCostEvent identifies cost and token_usage", () => {
    expect(isCostEvent(mapAmuxEvent(makeEvent({ type: "cost" }))!)).toBe(true);
    expect(isCostEvent(mapAmuxEvent(makeEvent({ type: "token_usage" }))!)).toBe(true);
    expect(isCostEvent(mapAmuxEvent(makeEvent({ type: "text_delta" }))!)).toBe(false);
  });

  it("isInteractiveEvent identifies approval_request and input_required", () => {
    expect(
      isInteractiveEvent(mapAmuxEvent(makeEvent({ type: "approval_request" }))!),
    ).toBe(true);
    expect(
      isInteractiveEvent(mapAmuxEvent(makeEvent({ type: "input_required" }))!),
    ).toBe(true);
    expect(
      isInteractiveEvent(mapAmuxEvent(makeEvent({ type: "error" }))!),
    ).toBe(false);
  });

  it("isErrorEvent identifies error and crash", () => {
    expect(isErrorEvent(mapAmuxEvent(makeEvent({ type: "error" }))!)).toBe(true);
    expect(isErrorEvent(mapAmuxEvent(makeEvent({ type: "crash" }))!)).toBe(true);
    expect(isErrorEvent(mapAmuxEvent(makeEvent({ type: "text_delta" }))!)).toBe(false);
  });

  it("isSessionLifecycleEvent identifies session_start and session_end", () => {
    expect(
      isSessionLifecycleEvent(mapAmuxEvent(makeEvent({ type: "session_start" }))!),
    ).toBe(true);
    expect(
      isSessionLifecycleEvent(mapAmuxEvent(makeEvent({ type: "session_end" }))!),
    ).toBe(true);
    expect(
      isSessionLifecycleEvent(mapAmuxEvent(makeEvent({ type: "text_delta" }))!),
    ).toBe(false);
  });
});
