import { describe, expect, it, vi } from "vitest";
import { SubagentInvokerImpl } from "../invoker";
import type { SubagentDescriptor } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDescriptor(overrides?: Partial<SubagentDescriptor>): SubagentDescriptor {
  return {
    id: "sub-1",
    name: "TestSubagent",
    description: "A test subagent",
    ...overrides,
  };
}

function slow<T>(value: T, ms = 25): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

// ---------------------------------------------------------------------------
// invoke()
// ---------------------------------------------------------------------------

describe("SubagentInvoker — invoke", () => {
  it("calls the invokeFn with descriptor and input", async () => {
    const invokeFn = vi.fn(async () => "result");
    const invoker = new SubagentInvokerImpl(invokeFn);
    const descriptor = makeDescriptor();

    await invoker.invoke(descriptor, "do something");

    expect(invokeFn).toHaveBeenCalledTimes(1);
    expect(invokeFn).toHaveBeenCalledWith(descriptor, "do something", undefined);
  });

  it("returns SubagentResult with correct agentId and output", async () => {
    const invokeFn = vi.fn(async () => ({ answer: 42 }));
    const invoker = new SubagentInvokerImpl(invokeFn);
    const descriptor = makeDescriptor({ id: "agent-x" });

    const result = await invoker.invoke(descriptor, "question");

    expect(result.agentId).toBe("agent-x");
    expect(result.mode).toBe("as-tool-call");
    expect(result.output).toEqual({ answer: 42 });
    expect(result.success).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.turnsUsed).toBe(0);
  });

  it("returns error result when invokeFn throws", async () => {
    const invokeFn = vi.fn(async () => {
      throw new Error("fail");
    });
    const invoker = new SubagentInvokerImpl(invokeFn);

    const result = await invoker.invoke(makeDescriptor(), "input");

    expect(result.success).toBe(false);
    expect(result.error).toBe("fail");
    expect(result.mode).toBe("as-tool-call");
  });
});

// ---------------------------------------------------------------------------
// delegate()
// ---------------------------------------------------------------------------

describe("SubagentInvoker — delegate", () => {
  it("accepted on first try when review approves", async () => {
    const invokeFn = vi.fn(async () => "good output");
    const reviewFn = vi.fn(async () => ({ accepted: true }));
    const invoker = new SubagentInvokerImpl(invokeFn, reviewFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: { requireApproval: true },
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("good output");
    expect(result.mode).toBe("delegation");
    expect(reviewFn).toHaveBeenCalledTimes(1);
  });

  it("returns rejected result when review rejects (maxRetries=0)", async () => {
    const invokeFn = vi.fn(async () => "bad output");
    const reviewFn = vi.fn(async () => ({
      accepted: false,
      feedback: "not good enough",
    }));
    const invoker = new SubagentInvokerImpl(invokeFn, reviewFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: { requireApproval: true },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Oversight rejected");
    expect(result.error).toContain("not good enough");
    expect(reviewFn).toHaveBeenCalledTimes(1);
  });

  it("skips oversight when requireApproval is false", async () => {
    const invokeFn = vi.fn(async () => "output");
    const reviewFn = vi.fn(async () => ({ accepted: false }));
    const invoker = new SubagentInvokerImpl(invokeFn, reviewFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: { requireApproval: false },
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("output");
    expect(reviewFn).not.toHaveBeenCalled();
  });

  it("skips oversight when no reviewFn is provided", async () => {
    const invokeFn = vi.fn(async () => "output");
    const invoker = new SubagentInvokerImpl(invokeFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: { requireApproval: true },
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("output");
  });

  it("enforces oversight timeoutMs for delegation", async () => {
    const invokeFn = vi.fn(
      async () => slow("late result"),
    );
    const invoker = new SubagentInvokerImpl(invokeFn);

    const result = await invoker.delegate(
      makeDescriptor({ id: "slow-subagent" }),
      "task",
      {
        oversight: { requireApproval: false, timeoutMs: 5 },
      },
    );

    expect(result).toMatchObject({
      agentId: "slow-subagent",
      mode: "delegation",
      success: false,
    });
    expect(result.error).toMatch(/timed out after 5ms/i);
  });

  it("uses configurable review-only oversight retries", async () => {
    const invokeFn = vi.fn(async () => "review me");
    const reviewFn = vi
      .fn()
      .mockResolvedValueOnce({ accepted: false, feedback: "try again" })
      .mockResolvedValueOnce({ accepted: true });
    const invoker = new SubagentInvokerImpl(invokeFn, reviewFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: { requireApproval: true, maxRetries: 1 } as any,
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("review me");
    expect(invokeFn).toHaveBeenCalledTimes(1);
    expect(reviewFn).toHaveBeenCalledTimes(2);
  });

  it("can reinvoke the subagent with reviewer feedback between retries", async () => {
    const invokeFn = vi
      .fn()
      .mockResolvedValueOnce("first output")
      .mockResolvedValueOnce("revised output");
    const reviewFn = vi
      .fn()
      .mockResolvedValueOnce({ accepted: false, feedback: "include sources" })
      .mockResolvedValueOnce({ accepted: true });
    const invoker = new SubagentInvokerImpl(invokeFn, reviewFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: {
        requireApproval: true,
        maxRetries: 1,
        retryMode: "reinvoke",
      } as any,
      sharedContext: [{ role: "system", content: "parent context" }],
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("revised output");
    expect(invokeFn).toHaveBeenCalledTimes(2);
    expect(invokeFn.mock.calls[1][2]).toMatchObject({
      sharedContext: [
        { role: "system", content: "parent context" },
        { role: "user", content: expect.stringContaining("include sources") },
      ],
    });
    expect(reviewFn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// handoff()
// ---------------------------------------------------------------------------

describe("SubagentInvoker — handoff", () => {
  it("sets handoffTarget in result to the descriptor id", async () => {
    const invokeFn = vi.fn(async () => "handoff-output");
    const invoker = new SubagentInvokerImpl(invokeFn);
    const descriptor = makeDescriptor({ id: "target-agent" });

    const result = await invoker.handoff(descriptor, "context");

    expect(result.mode).toBe("handoff");
    expect(result.handoffTarget).toBe("target-agent");
    expect(result.success).toBe(true);
    expect(result.output).toBe("handoff-output");
  });

  it("returns error result when invokeFn throws during handoff", async () => {
    const invokeFn = vi.fn(async () => {
      throw new Error("handoff-error");
    });
    const invoker = new SubagentInvokerImpl(invokeFn);

    const result = await invoker.handoff(makeDescriptor(), "context");

    expect(result.success).toBe(false);
    expect(result.error).toBe("handoff-error");
    expect(result.mode).toBe("handoff");
  });
});
