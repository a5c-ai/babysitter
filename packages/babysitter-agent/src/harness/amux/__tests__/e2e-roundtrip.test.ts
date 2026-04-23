/**
 * End-to-end integration test verifying the full round-trip:
 *
 *   babysitter-agent (invokeViaAgentMux)
 *     -> mock AmuxClient event stream
 *     -> babysitter-agent event processing (text accumulation, cost, errors)
 *     -> formatResultAsAmuxEvents (JSONL output)
 *     -> parseable by agent-mux's babysitter adapter
 *
 * @module harness/amux/__tests__/e2e-roundtrip
 */

import { describe, it, expect, vi } from "vitest";
import { invokeViaAgentMux } from "../amuxBridge";
import { formatResultAsAmuxEvents } from "../../../cli/amuxEventsFormatter";
import type {
  AmuxClient,
  AmuxRunHandle,
  AmuxAgentEvent,
  AmuxInteractionChannel,
} from "../amuxTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(): string {
  return new Date().toISOString();
}

async function* asyncIterableFrom(
  events: AmuxAgentEvent[],
): AsyncGenerator<AmuxAgentEvent> {
  for (const event of events) {
    yield event;
  }
}

function createMockInteractions(): AmuxInteractionChannel {
  return {
    respond: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockClient(
  events: AmuxAgentEvent[],
  handleOverrides: Partial<AmuxRunHandle> = {},
): AmuxClient {
  return {
    run: vi.fn().mockReturnValue({
      events: asyncIterableFrom(events),
      interactions: createMockInteractions(),
      sessionId: "test-session-123",
      exitCode: 0,
      abort: vi.fn(),
      ...handleOverrides,
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("E2E: babysitter-agent <-> agent-mux round-trip", () => {
  it("full invocation round-trip with text, tool use, and cost", async () => {
    // Simulate a Claude run with text deltas, tool use, and cost events
    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-1", agent: "claude", timestamp: ts(), sessionId: "sess-1" },
      { type: "text_delta", runId: "run-1", agent: "claude", timestamp: ts(), text: "I will fix " },
      { type: "text_delta", runId: "run-1", agent: "claude", timestamp: ts(), text: "the bug." },
      { type: "tool_call_start", runId: "run-1", agent: "claude", timestamp: ts(), toolCallId: "tc-1", toolName: "Read", input: { file_path: "src/index.ts" } },
      { type: "tool_result", runId: "run-1", agent: "claude", timestamp: ts(), toolCallId: "tc-1", output: "// file contents" },
      { type: "cost", runId: "run-1", agent: "claude", timestamp: ts(), inputTokens: 1000, outputTokens: 500, totalCost: 0.02 },
      { type: "session_end", runId: "run-1", agent: "claude", timestamp: ts(), exitReason: "completed" },
    ];

    const client = createMockClient(mockEvents);

    // Step 1: babysitter-agent invokes via amux bridge
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "Fix the bug",
      model: "claude-opus-4-6",
      workspace: "/project",
    });

    // Step 2: Verify babysitter-agent processed events correctly
    expect(result.success).toBe(true);
    expect(result.lastMessage).toBe("I will fix the bug.");
    expect(result.output).toBe("I will fix the bug.");
    expect(result.totalCost).toBe(0.02);
    expect(result.events).toHaveLength(7);
    expect(result.sessionId).toBe("test-session-123");
    expect(result.harness).toBe("claude-code");
    expect(result.exitCode).toBe(0);

    // Verify mapped event kinds
    const kinds = result.events.map((e) => e.kind);
    expect(kinds).toEqual([
      "session_start",
      "text_delta",
      "text_delta",
      "tool_call_start",
      "tool_result",
      "cost",
      "session_end",
    ]);

    // Step 3: Format as amux-events JSONL (what agent-mux babysitter adapter would parse)
    // formatResultAsAmuxEvents takes (harness, result) and generates its own runId
    const jsonlLines = formatResultAsAmuxEvents("claude-code", result);
    expect(jsonlLines.length).toBeGreaterThan(0);

    // Step 4: Verify each JSONL line is valid JSON with required fields
    for (const line of jsonlLines) {
      const parsed = JSON.parse(line);
      expect(parsed.type).toBeDefined();
      expect(parsed.runId).toBeDefined();
      expect(typeof parsed.runId).toBe("string");
      // agent should be the amux adapter name "claude" (mapped from "claude-code")
      expect(parsed.agent).toBe("claude");
      expect(parsed.timestamp).toBeDefined();
    }

    // Step 5: Verify session_start and session_end bookend the events
    const parsedEvents = jsonlLines.map((l) => JSON.parse(l));
    expect(parsedEvents[0].type).toBe("session_start");
    expect(parsedEvents[parsedEvents.length - 1].type).toBe("session_end");

    // Verify text_delta is present in the JSONL output
    const textEvent = parsedEvents.find((e: Record<string, unknown>) => e.type === "text_delta");
    expect(textEvent).toBeDefined();
    expect(textEvent.text).toBe("I will fix the bug.");

    // Verify cost event is present
    const costEvent = parsedEvents.find((e: Record<string, unknown>) => e.type === "cost");
    expect(costEvent).toBeDefined();

    // Verify session_end carries success info
    const endEvent = parsedEvents[parsedEvents.length - 1];
    expect(endEvent.success).toBe(true);
    expect(endEvent.exitCode).toBe(0);
  });

  it("error handling round-trip", async () => {
    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-2", agent: "claude", timestamp: ts() },
      { type: "error", runId: "run-2", agent: "claude", timestamp: ts(), message: "API rate limited", code: "rate_limit" },
      { type: "session_end", runId: "run-2", agent: "claude", timestamp: ts(), exitReason: "error" },
    ];

    const client = createMockClient(mockEvents, { exitCode: 1 });
    const result = await invokeViaAgentMux(client, "claude-code", { prompt: "test" });

    // Bridge should detect the error event and mark as failed
    expect(result.success).toBe(false);
    expect(result.events.some((e) => e.kind === "error")).toBe(true);

    // Format the failed result as JSONL
    const jsonlLines = formatResultAsAmuxEvents("claude-code", result);
    const parsedEvents = jsonlLines.map((l) => JSON.parse(l));

    // Should contain an error event in the JSONL output
    const errorEvent = parsedEvents.find((e: Record<string, unknown>) => e.type === "error");
    expect(errorEvent).toBeDefined();

    // session_end should reflect the failure
    const endEvent = parsedEvents[parsedEvents.length - 1];
    expect(endEvent.type).toBe("session_end");
    expect(endEvent.success).toBe(false);
  });

  it("approval interaction events are collected", async () => {
    const respondFn = vi.fn().mockResolvedValue(undefined);

    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-3", agent: "claude", timestamp: ts() },
      { type: "approval_request", runId: "run-3", agent: "claude", timestamp: ts(), interactionId: "int-1", description: "Allow file write?" },
      { type: "text_delta", runId: "run-3", agent: "claude", timestamp: ts(), text: "Done." },
      { type: "session_end", runId: "run-3", agent: "claude", timestamp: ts() },
    ];

    const client: AmuxClient = {
      run: vi.fn().mockReturnValue({
        events: asyncIterableFrom(mockEvents),
        interactions: { respond: respondFn },
        sessionId: "sess-3",
        exitCode: 0,
        abort: vi.fn(),
      }),
    };

    const result = await invokeViaAgentMux(client, "claude-code", { prompt: "test" });

    // All events including approval_request should be collected
    expect(result.events).toHaveLength(4);
    expect(result.events.some((e) => e.kind === "approval_request")).toBe(true);

    // The approval event data should carry through
    const approvalEvent = result.events.find((e) => e.kind === "approval_request");
    expect(approvalEvent).toBeDefined();
    expect(approvalEvent!.data["interactionId"]).toBe("int-1");
    expect(approvalEvent!.data["description"]).toBe("Allow file write?");
  });

  it("harness name mapping -- codex adapter round-trip", async () => {
    const client = createMockClient([
      { type: "session_start", runId: "r", agent: "codex", timestamp: ts() },
      { type: "text_delta", runId: "r", agent: "codex", timestamp: ts(), text: "codex output" },
      { type: "session_end", runId: "r", agent: "codex", timestamp: ts() },
    ]);

    const result = await invokeViaAgentMux(client, "codex", { prompt: "test" });
    expect(result.success).toBe(true);
    expect(result.harness).toBe("codex");
    expect(result.lastMessage).toBe("codex output");

    // Verify the client.run was called with the correct adapter name
    const opts = (client.run as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(opts.agent).toBe("codex");

    // Format and verify JSONL uses the codex adapter name
    const jsonlLines = formatResultAsAmuxEvents("codex", result);
    const parsedEvents = jsonlLines.map((l) => JSON.parse(l));
    expect(parsedEvents[0].agent).toBe("codex");
  });

  it("Pi rejection -- pi harness cannot use agent-mux", async () => {
    const client = createMockClient([]);
    await expect(
      invokeViaAgentMux(client, "pi", { prompt: "test" }),
    ).rejects.toThrow(/agent-core/);
  });

  it("onEvent callback fires for every mapped event during the round-trip", async () => {
    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-cb", agent: "claude", timestamp: ts() },
      { type: "text_delta", runId: "run-cb", agent: "claude", timestamp: ts(), text: "streaming " },
      { type: "text_delta", runId: "run-cb", agent: "claude", timestamp: ts(), text: "output" },
      { type: "cost", runId: "run-cb", agent: "claude", timestamp: ts(), totalCost: 0.05 },
      { type: "session_end", runId: "run-cb", agent: "claude", timestamp: ts() },
    ];

    const client = createMockClient(mockEvents);
    const callbackEvents: unknown[] = [];
    const onEvent = vi.fn((event) => {
      callbackEvents.push(event);
    });

    const result = await invokeViaAgentMux(
      client,
      "claude-code",
      { prompt: "stream test" },
      onEvent,
    );

    // Callback should have received every mapped event
    expect(onEvent).toHaveBeenCalledTimes(5);
    expect(callbackEvents).toHaveLength(5);

    // Final result should also have all events
    expect(result.events).toHaveLength(5);
    expect(result.lastMessage).toBe("streaming output");
    expect(result.totalCost).toBe(0.05);
  });

  it("multiple cost events accumulate correctly across the round-trip", async () => {
    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-mc", agent: "claude", timestamp: ts() },
      { type: "cost", runId: "run-mc", agent: "claude", timestamp: ts(), inputTokens: 500, outputTokens: 200, totalCost: 0.01 },
      { type: "text_delta", runId: "run-mc", agent: "claude", timestamp: ts(), text: "first turn" },
      { type: "cost", runId: "run-mc", agent: "claude", timestamp: ts(), inputTokens: 800, outputTokens: 400, totalCost: 0.03 },
      { type: "text_delta", runId: "run-mc", agent: "claude", timestamp: ts(), text: " second turn" },
      { type: "cost", runId: "run-mc", agent: "claude", timestamp: ts(), inputTokens: 200, outputTokens: 100, totalCost: 0.005 },
      { type: "session_end", runId: "run-mc", agent: "claude", timestamp: ts() },
    ];

    const client = createMockClient(mockEvents);
    const result = await invokeViaAgentMux(client, "claude-code", { prompt: "multi cost" });

    expect(result.totalCost).toBeCloseTo(0.045);
    expect(result.lastMessage).toBe("first turn second turn");
  });

  it("empty event stream produces valid JSONL output", async () => {
    const client = createMockClient([]);
    const result = await invokeViaAgentMux(client, "claude-code", { prompt: "silence" });

    expect(result.success).toBe(true);
    expect(result.lastMessage).toBe("");
    expect(result.events).toHaveLength(0);

    // Even an empty result should produce valid JSONL with bookends
    const jsonlLines = formatResultAsAmuxEvents("claude-code", result);
    expect(jsonlLines.length).toBeGreaterThanOrEqual(2); // at least session_start + session_end

    const parsedEvents = jsonlLines.map((l) => JSON.parse(l));
    expect(parsedEvents[0].type).toBe("session_start");
    expect(parsedEvents[parsedEvents.length - 1].type).toBe("session_end");
  });

  it("unknown event types pass through as 'unknown' kind", async () => {
    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-u", agent: "claude", timestamp: ts() },
      { type: "custom_debug_event", runId: "run-u", agent: "claude", timestamp: ts(), detail: "some debug info" },
      { type: "session_end", runId: "run-u", agent: "claude", timestamp: ts() },
    ];

    const client = createMockClient(mockEvents);
    const result = await invokeViaAgentMux(client, "claude-code", { prompt: "test" });

    expect(result.events).toHaveLength(3);
    const unknownEvent = result.events.find((e) => e.kind === "unknown");
    expect(unknownEvent).toBeDefined();
    expect(unknownEvent!.data["originalType"]).toBe("custom_debug_event");
    expect(unknownEvent!.data["detail"]).toBe("some debug info");
  });

  it("gemini-cli harness name maps to gemini adapter in JSONL output", async () => {
    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-g", agent: "gemini", timestamp: ts() },
      { type: "text_delta", runId: "run-g", agent: "gemini", timestamp: ts(), text: "Gemini says hi" },
      { type: "session_end", runId: "run-g", agent: "gemini", timestamp: ts() },
    ];

    const client = createMockClient(mockEvents);
    const result = await invokeViaAgentMux(client, "gemini-cli", { prompt: "test" });

    // Verify bridge called with correct adapter
    const opts = (client.run as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(opts.agent).toBe("gemini");

    // Verify JSONL output uses "gemini" adapter name
    const jsonlLines = formatResultAsAmuxEvents("gemini-cli", result);
    const parsedEvents = jsonlLines.map((l) => JSON.parse(l));
    expect(parsedEvents[0].agent).toBe("gemini");
  });

  it("crash event marks result as failed even with exitCode 0 and produces error JSONL", async () => {
    const mockEvents: AmuxAgentEvent[] = [
      { type: "session_start", runId: "run-crash", agent: "claude", timestamp: ts() },
      { type: "text_delta", runId: "run-crash", agent: "claude", timestamp: ts(), text: "partial" },
      { type: "crash", runId: "run-crash", agent: "claude", timestamp: ts(), message: "segfault in adapter" },
      { type: "session_end", runId: "run-crash", agent: "claude", timestamp: ts() },
    ];

    // exitCode 0 but crash event present
    const client = createMockClient(mockEvents, { exitCode: 0 });
    const result = await invokeViaAgentMux(client, "claude-code", { prompt: "test" });

    // hasError flag should override exitCode 0
    expect(result.success).toBe(false);

    // Format as JSONL -- should contain error event since success is false
    const jsonlLines = formatResultAsAmuxEvents("claude-code", result);
    const parsedEvents = jsonlLines.map((l) => JSON.parse(l));
    const errorEvent = parsedEvents.find((e: Record<string, unknown>) => e.type === "error");
    expect(errorEvent).toBeDefined();
  });
});
