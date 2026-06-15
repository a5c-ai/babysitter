import { describe, expect, it, vi } from "vitest";
import {
  AgentMuxResponderBackend,
  AgentMuxResponderBackendError,
} from "../backends/adapters.js";

describe("issue #606 AgentMuxResponderBackend contract", () => {
  it("requires an agent or adapter before dispatch can be configured", () => {
    expect(() => new AgentMuxResponderBackend({} as never)).toThrow(AgentMuxResponderBackendError);
  });

  it("maps a mock adapters client response to a breakpoint answer", async () => {
    const handle = {
      runId: "adapters-run-1",
      agent: "codex",
      model: "gpt-5.4",
      result: vi.fn().mockResolvedValue({
        runId: "adapters-run-1",
        agent: "codex",
        model: "gpt-5.4",
        sessionId: "session-1",
        text: "Mock response",
        cost: 0.01,
        durationMs: 25,
        exitCode: 0,
        signal: null,
        exitReason: "completed",
        tokenUsage: { input: 10, output: 3 },
        turnCount: 1,
        error: null,
        events: [],
        tags: ["issue-606"],
      }),
      abort: vi.fn(),
      then: undefined,
      catch: undefined,
      finally: undefined,
    };
    const client = {
      run: vi.fn().mockReturnValue(handle),
    };
    const backend = new AgentMuxResponderBackend({
      adapter: "codex",
      client,
      timeoutMs: 1000,
    });

    const breakpoint = await backend.submitBreakpoint({
      text: "Review this patch",
      context: {
        description: "External agent review",
        codeSnippets: [],
        fileReferences: [],
        tags: ["issue-606"],
      },
      routing: {
        strategy: "single",
        targetResponders: ["codex"],
        timeoutMs: 1000,
        presentToUser: false,
        responderType: "agent",
        adapter: "codex",
        model: "gpt-5.4",
      },
    });

    expect(client.run).toHaveBeenCalledWith(expect.objectContaining({
      agent: "codex",
      model: "gpt-5.4",
      nonInteractive: true,
    }));
    expect(breakpoint.answers[0]).toMatchObject({
      responderId: "codex",
      responderName: "codex",
      text: "Mock response",
    });
  });
});
