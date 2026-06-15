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

  it("uses configured oversight review retries", async () => {
    const invokeFn = vi.fn(async () => "eventual output");
    const reviewFn = vi
      .fn()
      .mockResolvedValueOnce({ accepted: false, feedback: "try again" })
      .mockResolvedValueOnce({ accepted: false, feedback: "still no" })
      .mockResolvedValueOnce({ accepted: true });
    const invoker = new SubagentInvokerImpl(invokeFn, reviewFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: { requireApproval: true, maxReviewRetries: 2 },
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("eventual output");
    expect(reviewFn).toHaveBeenCalledTimes(3);
  });

  it("enforces delegation timeoutMs", async () => {
    const invokeFn = vi.fn(
      async () => new Promise((resolve) => setTimeout(() => resolve("late"), 50)),
    );
    const invoker = new SubagentInvokerImpl(invokeFn);

    const result = await invoker.delegate(makeDescriptor(), "task", {
      oversight: { requireApproval: false, timeoutMs: 5 },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("timed out");
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
