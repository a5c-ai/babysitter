import { describe, expect, it, vi } from "vitest";
import { AgentLoopImpl, createAgentLoop } from "../agent-loop";
import type { AgentLoopConfig, AgentLoopIterationResult } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple prompt function that echoes input with the agentId appended. */
function echoPrompt(input: string, agentId: string): Promise<string> {
  return Promise.resolve(`${input}:${agentId}`);
}

/** Collect all results from an async iterable into an array. */
async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Sequential strategy
// ---------------------------------------------------------------------------

describe("AgentLoop — sequential strategy", () => {
  it("iterate() returns a result with correct index and agentId", async () => {
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" } },
      echoPrompt,
    );

    const result = await loop.iterate("hello");

    expect(result.index).toBe(0);
    expect(result.agentId).toBe("default");
    expect(result.output).toBe("hello:default");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("iterate() with custom agentIds uses the first agent", async () => {
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" } },
      echoPrompt,
      ["agent-alpha"],
    );

    const result = await loop.iterate("hi");
    expect(result.agentId).toBe("agent-alpha");
    expect(result.output).toBe("hi:agent-alpha");
  });

  it("run() yields results until maxIterations", async () => {
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" }, maxIterations: 3 },
      echoPrompt,
    );

    const results = await collect(loop.run("msg"));

    expect(results).toHaveLength(3);
    expect(results[0].index).toBe(0);
    expect(results[1].index).toBe(1);
    expect(results[2].index).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Concurrent strategy
// ---------------------------------------------------------------------------

describe("AgentLoop — concurrent strategy", () => {
  it("runs N agents in parallel and collects results", async () => {
    const promptFn = vi.fn(echoPrompt);
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "concurrent" }, maxIterations: 1 },
      promptFn,
      ["a1", "a2", "a3"],
    );

    const results = await collect(loop.run("data"));

    expect(results).toHaveLength(1);
    // The output is a ConcurrentIterationOutput shape cast to unknown.
    const output = results[0].output as unknown as {
      results: Array<{ status: string; agentId: string; output?: string }>;
    };
    expect(output.results).toHaveLength(3);
    expect(output.results.map((r) => r.agentId)).toEqual(["a1", "a2", "a3"]);
    expect(promptFn).toHaveBeenCalledTimes(3);
  });

  it("records per-agent timeouts without discarding completed results", async () => {
    const promptFn = vi.fn(async (_input: string, agentId: string) => {
      if (agentId === "slow") {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "late";
      }
      if (agentId === "bad") {
        throw new Error("agent failed");
      }
      return `${agentId}:ok`;
    });
    const loop = createAgentLoop<string, string>(
      {
        strategy: {
          kind: "concurrent",
          perAgentTimeoutMs: 10,
        },
        maxIterations: 1,
      },
      promptFn,
      ["fast", "slow", "bad"],
    );

    const [result] = await collect(loop.run("data"));
    const output = result.output as unknown as {
      results: Array<{
        status: string;
        agentId: string;
        output?: string;
        reason?: unknown;
      }>;
    };

    expect(output.results.map((r) => [r.agentId, r.status])).toEqual([
      ["fast", "fulfilled"],
      ["slow", "timed-out"],
      ["bad", "rejected"],
    ]);
    expect(output.results[0].output).toBe("fast:ok");
  });
});

// ---------------------------------------------------------------------------
// Group-chat strategy
// ---------------------------------------------------------------------------

describe("AgentLoop — group-chat strategy", () => {
  it("cycles through agents in round-robin order", async () => {
    const loop = createAgentLoop<string, string>(
      {
        strategy: { kind: "group-chat", maxRounds: 1 },
      },
      echoPrompt,
      ["alice", "bob"],
    );

    const results = await collect(loop.run("topic"));

    // One round with 2 agents = 2 iterations.
    expect(results).toHaveLength(2);
    expect(results[0].agentId).toBe("alice");
    expect(results[1].agentId).toBe("bob");
  });

  it("respects maxRounds", async () => {
    const loop = createAgentLoop<string, string>(
      {
        strategy: { kind: "group-chat", maxRounds: 2 },
      },
      echoPrompt,
      ["x", "y"],
    );

    const results = await collect(loop.run("chat"));

    // 2 rounds * 2 agents = 4 iterations.
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.agentId)).toEqual(["x", "y", "x", "y"]);
  });

  it("uses structured moderator selection and validates configured speakers", async () => {
    const promptFn = vi.fn(async (_input: string, agentId: string) => {
      if (agentId === "mod") return { nextSpeakerId: "bob" };
      return `${agentId}:spoke`;
    });
    const loop = createAgentLoop<string, unknown>(
      {
        strategy: { kind: "group-chat", maxRounds: 1, moderatorAgentId: "mod" },
      },
      promptFn,
      ["alice", "bob"],
    );

    const [result] = await collect(loop.run("topic"));

    expect(result.agentId).toBe("bob");
    expect(result.output).toBe("bob:spoke");
  });

  it("rejects ambiguous moderator selections instead of falling back", async () => {
    const promptFn = vi.fn(async (_input: string, agentId: string) => {
      if (agentId === "mod") return "alice or bob";
      return `${agentId}:spoke`;
    });
    const loop = createAgentLoop<string, string>(
      {
        strategy: { kind: "group-chat", maxRounds: 1, moderatorAgentId: "mod" },
      },
      promptFn,
      ["alice", "bob"],
    );

    await expect(collect(loop.run("topic"))).rejects.toThrow(
      /ambiguous moderator selection/i,
    );
  });

  it("rejects moderator selections outside the configured agent list", async () => {
    const promptFn = vi.fn(async (_input: string, agentId: string) => {
      if (agentId === "mod") return { nextSpeakerId: "mallory" };
      return `${agentId}:spoke`;
    });
    const loop = createAgentLoop<string, unknown>(
      {
        strategy: { kind: "group-chat", maxRounds: 1, moderatorAgentId: "mod" },
      },
      promptFn,
      ["alice", "bob"],
    );

    await expect(collect(loop.run("topic"))).rejects.toThrow(
      /invalid moderator selection/i,
    );
  });
});

// ---------------------------------------------------------------------------
// Handoff strategy
// ---------------------------------------------------------------------------

describe("AgentLoop — handoff strategy", () => {
  it("follows handoffTarget chain and stops when undefined", async () => {
    // Agent "a" hands off to "b", "b" returns no handoff (terminates).
    const promptFn = vi.fn(
      async (_input: string, agentId: string) => {
        if (agentId === "a") return { handoffTarget: "b", data: "from-a" };
        return { data: "from-b" };
      },
    );

    const loop = createAgentLoop(
      {
        strategy: { kind: "handoff", entryAgentId: "a" },
      },
      promptFn,
      ["a", "b"],
    );

    const results = await collect(loop.run("start"));

    expect(results).toHaveLength(2);
    expect(results[0].agentId).toBe("a");
    expect(results[0].handoffTarget).toBe("b");
    expect(results[1].agentId).toBe("b");
    expect(results[1].handoffTarget).toBeUndefined();
  });

  it("respects maxHandoffs", async () => {
    // Each agent always hands off to the next in a cycle.
    const agents = ["a", "b", "c"];
    let callCount = 0;
    const promptFn = vi.fn(async (_input: string, agentId: string) => {
      callCount++;
      const nextIdx = (agents.indexOf(agentId) + 1) % agents.length;
      return { handoffTarget: agents[nextIdx] };
    });

    const loop = createAgentLoop(
      {
        strategy: { kind: "handoff", entryAgentId: "a", maxHandoffs: 2 },
      },
      promptFn,
      agents,
    );

    const results = await collect(loop.run("go"));

    // entryAgent "a" + 2 handoffs = 3 iterations; the 3rd terminates
    // because maxHandoffs is reached.
    expect(results).toHaveLength(3);
    expect(results[0].agentId).toBe("a");
    expect(results[1].agentId).toBe("b");
    expect(results[2].agentId).toBe("c");
  });

  it("passes structured handoff context to the target agent", async () => {
    const seenContexts: unknown[] = [];
    const promptFn = vi.fn(
      async (_input: string, agentId: string, context?: { handoffContext?: unknown }) => {
        seenContexts.push(context?.handoffContext);
        if (agentId === "a") {
          return {
            handoffTarget: "b",
            handoffContext: { summary: "a completed research" },
          };
        }
        return { done: true };
      },
    );

    const loop = createAgentLoop(
      {
        strategy: { kind: "handoff", entryAgentId: "a" },
      },
      promptFn,
      ["a", "b"],
    );

    const results = await collect(loop.run("start"));

    expect(results).toHaveLength(2);
    expect(seenContexts).toEqual([
      undefined,
      { summary: "a completed research" },
    ]);
  });

  it("rejects handoff targets outside the configured agent list", async () => {
    const promptFn = vi.fn(async () => ({ handoffTarget: "missing" }));
    const loop = createAgentLoop(
      {
        strategy: { kind: "handoff", entryAgentId: "a" },
      },
      promptFn,
      ["a", "b"],
    );

    await expect(collect(loop.run("start"))).rejects.toThrow(
      /invalid handoff target/i,
    );
  });
});

describe("AgentLoop — cancellation", () => {
  it("can cancel run() from outside and transitions to cancelled", async () => {
    const controller = new AbortController();
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" }, maxIterations: 5 },
      async (_input, _agentId, context) => {
        expect(context?.signal).toBe(controller.signal);
        return "first";
      },
    );
    loop.onIterationComplete(() => controller.abort());

    const results = await collect(loop.run("x", { signal: controller.signal }));

    expect(results).toHaveLength(1);
    expect(loop.getState()).toBe("cancelled");
  });
});

describe("AgentLoop — strategy composition", () => {
  it("supports explicit fallback composition between strategies", async () => {
    let calls = 0;
    const promptFn = vi.fn(async (_input: string, agentId: string) => {
      calls++;
      if (agentId === "a" && calls === 1) return { handoffTarget: "missing" };
      return `${agentId}:fallback`;
    });
    const loop = createAgentLoop<string, unknown>(
      {
        strategy: {
          kind: "composite",
          mode: "fallback",
          strategies: [
            { kind: "handoff", entryAgentId: "a" },
            { kind: "sequential" },
          ],
        },
        maxIterations: 1,
      },
      promptFn,
      ["a", "b"],
    );

    const [result] = await collect(loop.run("x"));

    expect(result.agentId).toBe("a");
    expect(result.output).toBe("a:fallback");
  });
});

// ---------------------------------------------------------------------------
// shouldTerminate predicate
// ---------------------------------------------------------------------------

describe("AgentLoop — shouldTerminate", () => {
  it("stops the loop when shouldTerminate returns true", async () => {
    const loop = createAgentLoop<string, string>(
      {
        strategy: { kind: "sequential" },
        maxIterations: 100,
        shouldTerminate: (_result, iterationCount) => iterationCount >= 2,
      },
      echoPrompt,
    );

    const results = await collect(loop.run("x"));

    // shouldTerminate fires after yielding, so 2 iterations are yielded
    // before the loop stops.
    expect(results).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getState() transitions
// ---------------------------------------------------------------------------

describe("AgentLoop — state management", () => {
  it("transitions idle -> running -> completed", async () => {
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" }, maxIterations: 1 },
      echoPrompt,
    );

    expect(loop.getState()).toBe("idle");

    const results = await collect(loop.run("x"));
    expect(results).toHaveLength(1);

    expect(loop.getState()).toBe("completed");
  });

  it("transitions to errored on prompt failure", async () => {
    const failingPrompt = async () => {
      throw new Error("boom");
    };
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" }, maxIterations: 1 },
      failingPrompt,
    );

    await expect(collect(loop.run("x"))).rejects.toThrow("boom");
    expect(loop.getState()).toBe("errored");
  });
});

// ---------------------------------------------------------------------------
// reset()
// ---------------------------------------------------------------------------

describe("AgentLoop — reset", () => {
  it("clears state back to idle", async () => {
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" }, maxIterations: 1 },
      echoPrompt,
    );

    await collect(loop.run("x"));
    expect(loop.getState()).toBe("completed");

    loop.reset();
    expect(loop.getState()).toBe("idle");
  });
});

// ---------------------------------------------------------------------------
// onIterationComplete callback
// ---------------------------------------------------------------------------

describe("AgentLoop — onIterationComplete", () => {
  it("fires callback after each iteration", async () => {
    const callback = vi.fn();
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" }, maxIterations: 3 },
      echoPrompt,
    );
    loop.onIterationComplete(callback);

    await collect(loop.run("msg"));

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback.mock.calls[0][0].index).toBe(0);
    expect(callback.mock.calls[1][0].index).toBe(1);
    expect(callback.mock.calls[2][0].index).toBe(2);
  });

  it("dispose function removes the callback", async () => {
    const callback = vi.fn();
    const loop = createAgentLoop<string, string>(
      { strategy: { kind: "sequential" }, maxIterations: 3 },
      echoPrompt,
    );
    const dispose = loop.onIterationComplete(callback);

    // Run one iteration via iterate(), then dispose.
    await loop.iterate("a");
    expect(callback).toHaveBeenCalledTimes(1);

    dispose();

    await loop.iterate("b");
    // Callback should NOT have been called again after disposal.
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
