import { describe, it, expect, vi } from "vitest";
import { invokeViaAgentMux } from "../amuxBridge";
import type {
  AmuxClient,
  AmuxRunHandle,
  AmuxAgentEvent,
  AmuxInteractionChannel,
} from "../amuxTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<AmuxAgentEvent> = {}): AmuxAgentEvent {
  return {
    type: "text_delta",
    runId: "run-001",
    agent: "claude",
    timestamp: "2026-04-19T00:00:00.000Z",
    ...overrides,
  };
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
      sessionId: "session-abc",
      exitCode: 0,
      abort: vi.fn(),
      ...handleOverrides,
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("invokeViaAgentMux", () => {
  it("maps harness name and calls client.run with correct adapter", async () => {
    const client = createMockClient([]);
    await invokeViaAgentMux(client, "claude-code", { prompt: "hello" });

    expect(client.run).toHaveBeenCalledOnce();
    const opts = (client.run as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(opts.agent).toBe("claude");
    expect(opts.prompt).toBe("hello");
    expect(opts.stream).toBe(true);
  });

  it("passes model, workspace, timeout, and sessionId", async () => {
    const client = createMockClient([]);
    await invokeViaAgentMux(client, "codex", {
      prompt: "fix lint",
      model: "claude-opus-4-6",
      workspace: "/project",
      timeout: 60000,
      sessionId: "s-42",
    });

    const opts = (client.run as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(opts.agent).toBe("codex");
    expect(opts.model).toBe("claude-opus-4-6");
    expect(opts.cwd).toBe("/project");
    expect(opts.timeout).toBe(60000);
    expect(opts.sessionId).toBe("s-42");
    expect(opts.env["AGENT_SESSION_ID"]).toBe("s-42");
  });

  it("sets approvalMode to yolo when nonInteractive is true", async () => {
    const client = createMockClient([]);
    await invokeViaAgentMux(client, "claude-code", {
      prompt: "go",
      nonInteractive: true,
    });

    const opts = (client.run as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(opts.approvalMode).toBe("yolo");
    expect(opts.nonInteractive).toBe(true);
  });

  it("accumulates text deltas into lastMessage", async () => {
    const events: AmuxAgentEvent[] = [
      makeEvent({ type: "text_delta", text: "Hello " }),
      makeEvent({ type: "text_delta", text: "world!" }),
    ];
    const client = createMockClient(events);
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "greet",
    });

    expect(result.lastMessage).toBe("Hello world!");
    expect(result.output).toBe("Hello world!");
  });

  it("accumulates cost from cost events", async () => {
    const events: AmuxAgentEvent[] = [
      makeEvent({ type: "cost", totalCost: 0.03 }),
      makeEvent({ type: "cost", totalCost: 0.07 }),
    ];
    const client = createMockClient(events);
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "calc",
    });

    expect(result.totalCost).toBeCloseTo(0.1);
  });

  it("marks result as failed when error events are present", async () => {
    const events: AmuxAgentEvent[] = [
      makeEvent({ type: "error", message: "boom" }),
    ];
    const client = createMockClient(events, { exitCode: 1 });
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "break",
    });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
  });

  it("marks result as failed on crash events even with exitCode 0", async () => {
    const events: AmuxAgentEvent[] = [
      makeEvent({ type: "crash", message: "segfault" }),
    ];
    const client = createMockClient(events, { exitCode: 0 });
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "go",
    });

    expect(result.success).toBe(false);
  });

  it("returns sessionId from the handle", async () => {
    const client = createMockClient([], { sessionId: "s-99" });
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "hi",
    });

    expect(result.sessionId).toBe("s-99");
  });

  it("collects all mapped events", async () => {
    const events: AmuxAgentEvent[] = [
      makeEvent({ type: "session_start" }),
      makeEvent({ type: "text_delta", text: "hi" }),
      makeEvent({ type: "session_end" }),
    ];
    const client = createMockClient(events);
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "hi",
    });

    expect(result.events).toHaveLength(3);
    expect(result.events[0].kind).toBe("session_start");
    expect(result.events[1].kind).toBe("text_delta");
    expect(result.events[2].kind).toBe("session_end");
  });

  it("invokes onEvent callback for each mapped event", async () => {
    const events: AmuxAgentEvent[] = [
      makeEvent({ type: "session_start" }),
      makeEvent({ type: "text_delta", text: "yo" }),
    ];
    const client = createMockClient(events);
    const callback = vi.fn();
    await invokeViaAgentMux(client, "claude-code", { prompt: "go" }, callback);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[0][0].kind).toBe("session_start");
    expect(callback.mock.calls[1][0].kind).toBe("text_delta");
  });

  it("throws for pi harness", async () => {
    const client = createMockClient([]);
    await expect(
      invokeViaAgentMux(client, "pi", { prompt: "nope" }),
    ).rejects.toThrow(/agent-core/);
  });

  it("throws for unknown harness", async () => {
    const client = createMockClient([]);
    await expect(
      invokeViaAgentMux(client, "nonexistent", { prompt: "nope" }),
    ).rejects.toThrow(/No agent-mux adapter mapping/);
  });

  it("records duration as wall-clock time", async () => {
    const client = createMockClient([]);
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "quick",
    });

    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(typeof result.duration).toBe("number");
  });

  it("preserves harness name in result", async () => {
    const client = createMockClient([]);
    const result = await invokeViaAgentMux(client, "gemini-cli", {
      prompt: "go",
    });

    expect(result.harness).toBe("gemini-cli");
  });

  it("calls handle.abort() when signal is already aborted", async () => {
    const abortFn = vi.fn();
    const client: AmuxClient = {
      run: vi.fn().mockReturnValue({
        events: asyncIterableFrom([]),
        interactions: createMockInteractions(),
        exitCode: 0,
        abort: abortFn,
      }),
    };
    const controller = new AbortController();
    controller.abort();

    await invokeViaAgentMux(client, "claude-code", {
      prompt: "cancel",
      signal: controller.signal,
    });

    expect(abortFn).toHaveBeenCalledOnce();
  });

  it("forwards env and skills to client.run", async () => {
    const client = createMockClient([]);
    await invokeViaAgentMux(client, "claude-code", {
      prompt: "go",
      env: { FOO: "bar" },
      skills: ["skill-a", "skill-b"],
    });

    const opts = (client.run as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(opts.env["FOO"]).toBe("bar");
    expect(opts.skills).toEqual(["skill-a", "skill-b"]);
  });

  it("handles empty event stream gracefully", async () => {
    const client = createMockClient([]);
    const result = await invokeViaAgentMux(client, "claude-code", {
      prompt: "silence",
    });

    expect(result.success).toBe(true);
    expect(result.lastMessage).toBe("");
    expect(result.totalCost).toBe(0);
    expect(result.events).toHaveLength(0);
  });
});
