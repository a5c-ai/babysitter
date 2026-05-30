import { describe, expect, it, vi } from "vitest";
import type { SubmitBreakpointParams, WaitForAnswerOptions } from "../backend.js";
import {
  AgentMuxResponderBackend,
  AgentMuxResponderBackendError,
} from "../backends/agent-mux.js";
import type {
  AgentMuxClientLike,
  AgentMuxResponderBackendConfig,
  AgentMuxRunHandleLike,
  AgentMuxRunResult,
} from "../backends/agent-mux.js";
import {
  AgentMuxBackendConfigSchema,
  BackendConfigSchema,
} from "../types.js";
import {
  createBackend,
  listRegisteredBackends,
} from "../backends/index.js";

function makeSubmitParams(overrides: Partial<SubmitBreakpointParams> = {}): SubmitBreakpointParams {
  return {
    text: "Should I proceed?",
    context: {
      description: "A breakpoint that should be resolved by an agent.",
      codeSnippets: [],
      fileReferences: ["src/app.ts"],
      tags: ["agent", "automation"],
    },
    routing: {
      strategy: "single",
      targetResponders: ["codex"],
      timeoutMs: 10_000,
      presentToUser: false,
    },
    projectId: "project-1",
    repoId: "repo-1",
    ...overrides,
  };
}

function makeRunResult(overrides: Partial<AgentMuxRunResult> = {}): AgentMuxRunResult {
  return {
    runId: "run-1",
    agent: "codex",
    model: "gpt-5.3-codex",
    sessionId: "session-1",
    text: "Proceed with the implementation.",
    cost: {
      amount: 0.42,
      currency: "USD",
    },
    durationMs: 1234,
    exitCode: 0,
    signal: null,
    exitReason: "completed",
    tokenUsage: {
      inputTokens: 100,
      outputTokens: 50,
      thinkingTokens: 25,
      cachedTokens: 10,
      totalTokens: 185,
    },
    turnCount: 1,
    error: null,
    events: [
      {
        type: "cost",
        runId: "run-1",
        agent: "codex",
        timestamp: 1,
        cost: { amount: 0.42, currency: "USD" },
      },
    ],
    tags: ["tasks-mux", "breakpoint"],
    ...overrides,
  };
}

function makeRunHandle(result: AgentMuxRunResult | Promise<AgentMuxRunResult>): AgentMuxRunHandleLike {
  const promise = Promise.resolve(result);
  return {
    runId: "run-1",
    agent: "codex",
    model: "gpt-5.3-codex",
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
    result: () => promise,
    abort: vi.fn(),
  };
}

function makeClient(runHandle: AgentMuxRunHandleLike): AgentMuxClientLike {
  return {
    run: vi.fn(() => runHandle),
  };
}

function makeBackend(
  overrides: Partial<AgentMuxResponderBackendConfig> = {},
  client?: AgentMuxClientLike,
): AgentMuxResponderBackend {
  return new AgentMuxResponderBackend({
    agent: "codex",
    model: "gpt-5.3-codex",
    cwd: "/tmp/project",
    timeoutMs: 10_000,
    client,
    ...overrides,
  });
}

describe("AgentMuxResponderBackend", () => {
  it("dispatches to agent-mux synchronously and stores the answered breakpoint", async () => {
    const runHandle = makeRunHandle(makeRunResult());
    const client = makeClient(runHandle);
    const backend = makeBackend({}, client);

    const breakpoint = await backend.submitBreakpoint(makeSubmitParams());

    expect(client.run).toHaveBeenCalledOnce();
    expect(breakpoint.status).toBe("answered");
    expect(breakpoint.answers).toHaveLength(1);
    expect(breakpoint.answers[0]).toMatchObject({
      responderId: "codex",
      responderName: "codex",
      text: "Proceed with the implementation.",
      confidence: 100,
      references: [],
      followUpQuestions: [],
    });
    expect(breakpoint.selectedAnswer).toBe(breakpoint.answers[0].id);

    await expect(backend.getBreakpoint(breakpoint.id)).resolves.toEqual(breakpoint);
    await expect(backend.waitForAnswer(breakpoint.id)).resolves.toMatchObject({
      answered: true,
      answer: breakpoint.answers[0],
      allAnswers: breakpoint.answers,
      resolution: "answered",
    });
    await expect(backend.listPendingBreakpoints()).resolves.toEqual([]);
  });

  it("maps submit params and config into RunOptions", async () => {
    const runHandle = makeRunHandle(makeRunResult());
    const client = makeClient(runHandle);
    const backend = makeBackend({
      agent: "claude-code",
      model: "claude-opus-4-5",
      cwd: "/repo",
      collectEvents: true,
      tags: ["custom-tag"],
      approvalMode: "yolo",
      nonInteractive: true,
    }, client);

    await backend.submitBreakpoint(makeSubmitParams({
      text: "Review this change",
      routing: {
        strategy: "single",
        targetResponders: ["codex"],
        timeoutMs: 15_000,
        presentToUser: false,
      },
    }));

    expect(client.run).toHaveBeenCalledWith(expect.objectContaining({
      agent: "codex",
      prompt: expect.stringContaining("Review this change"),
      model: "claude-opus-4-5",
      cwd: "/repo",
      timeout: 15_000,
      collectEvents: true,
      tags: expect.arrayContaining(["custom-tag", "tasks-mux", "breakpoint"]),
      approvalMode: "yolo",
      nonInteractive: true,
    }));
  });

  it("uses routing adapter when task routing targets an agent-mux adapter", async () => {
    const runHandle = makeRunHandle(makeRunResult({ agent: "codex" }));
    const client = makeClient(runHandle);
    const backend = new AgentMuxResponderBackend({
      adapter: "claude-code",
      model: "claude-opus-4-5",
      client,
    });

    await backend.submitBreakpoint(makeSubmitParams({
      routing: {
        strategy: "single",
        targetResponders: [],
        timeoutMs: 10_000,
        presentToUser: false,
        responderType: "agent",
        adapter: "codex",
        model: "gpt-5.3-codex",
      },
    }));

    expect(client.run).toHaveBeenCalledWith(expect.objectContaining({
      agent: "codex",
      model: "gpt-5.3-codex",
      nonInteractive: true,
    }));
  });

  it("records agent-mux cost, token, run, and event metadata in breakpoint context", async () => {
    const backend = makeBackend({}, makeClient(makeRunHandle(makeRunResult())));

    const breakpoint = await backend.submitBreakpoint(makeSubmitParams());

    expect(breakpoint.context.metadata).toMatchObject({
      agentMux: {
        runId: "run-1",
        agent: "codex",
        model: "gpt-5.3-codex",
        sessionId: "session-1",
        exitReason: "completed",
        durationMs: 1234,
        cost: { amount: 0.42, currency: "USD" },
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 50,
          thinkingTokens: 25,
          cachedTokens: 10,
          totalTokens: 185,
        },
        costEvents: [{ amount: 0.42, currency: "USD" }],
      },
    });
  });

  it("surfaces adapter, authentication, failed run, timeout, and abort errors", async () => {
    const adapterBackend = makeBackend({}, {
      run: vi.fn(() => {
        const err = new Error("No adapter registered for agent");
        Object.assign(err, { code: "UNKNOWN_AGENT" });
        throw err;
      }),
    });
    await expect(adapterBackend.submitBreakpoint(makeSubmitParams()))
      .rejects.toThrow(/agent-mux adapter is not installed or unknown/i);

    const authBackend = makeBackend({}, {
      run: vi.fn(() => {
        const err = new Error("Please sign in");
        Object.assign(err, { code: "AUTH_ERROR" });
        throw err;
      }),
    });
    await expect(authBackend.submitBreakpoint(makeSubmitParams()))
      .rejects.toThrow(/agent-mux authentication failed/i);

    const failedBackend = makeBackend({}, makeClient(makeRunHandle(makeRunResult({
      exitCode: 1,
      exitReason: "crashed",
      error: {
        code: "AGENT_CRASH",
        message: "agent crashed",
        stderr: "stack",
        recoverable: false,
      },
    }))));
    await expect(failedBackend.submitBreakpoint(makeSubmitParams()))
      .rejects.toThrow(/agent-mux run failed.*agent crashed/i);

    vi.useFakeTimers();
    try {
      const never = new Promise<AgentMuxRunResult>(() => {});
      const timeoutHandle = makeRunHandle(never);
      const timeoutBackend = makeBackend({ timeoutMs: 5 }, makeClient(timeoutHandle));
      const timeoutPromise = timeoutBackend.submitBreakpoint(makeSubmitParams({
        routing: {
          strategy: "single",
          targetResponders: ["codex"],
          timeoutMs: 5,
          presentToUser: false,
        },
      }));
      const timeoutExpectation = expect(timeoutPromise).rejects.toThrow(/agent-mux run timed out/i);

      await vi.advanceTimersByTimeAsync(6);
      await timeoutExpectation;
      expect(timeoutHandle.abort).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }

    const backend = makeBackend({}, makeClient(makeRunHandle(makeRunResult())));
    const controller = new AbortController();
    controller.abort();
    await expect(
      backend.waitForAnswer("missing", { signal: controller.signal } satisfies WaitForAnswerOptions),
    ).rejects.toThrow(/aborted/i);
  });

  it("supports manual answers, cancellation, responders, registry, exports, and config schema", async () => {
    const backend = makeBackend({}, makeClient(makeRunHandle(makeRunResult())));
    const breakpoint = await backend.submitBreakpoint(makeSubmitParams());

    const manualAnswer = await backend.answerBreakpoint(breakpoint.id, {
      responderId: "human",
      responderName: "Human",
      text: "Manual override",
      confidence: 80,
    });
    expect(manualAnswer.text).toBe("Manual override");

    await expect(backend.listResponders()).resolves.toEqual([
      expect.objectContaining({
        id: "codex",
        name: "codex",
        availability: true,
      }),
    ]);

    const pending = await makeBackend({}, makeClient(makeRunHandle(makeRunResult()))).cancelBreakpoint("unknown")
      .then(() => "cancelled")
      .catch((err: unknown) => err);
    expect(pending).toBeInstanceOf(AgentMuxResponderBackendError);

    expect(listRegisteredBackends()).toContain("agent-mux");
    expect(createBackend("agent-mux", {
      type: "agent-mux",
      agent: "codex",
    }).name).toBe("agent-mux");
    expect(AgentMuxBackendConfigSchema.safeParse({
      type: "agent-mux",
      agent: "codex",
      model: "gpt-5.3-codex",
      timeoutMs: 30_000,
      collectEvents: true,
    }).success).toBe(true);
    expect(BackendConfigSchema.safeParse({
      type: "agent-mux",
      agent: "codex",
    }).success).toBe(true);
  });
});
