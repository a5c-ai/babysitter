/**
 * MicroagentDispatcher tests.
 */

import { describe, it, expect, vi } from "vitest";
import type { MicroagentInvocation, MicroagentResult } from "@a5c-ai/genty-core";
import { MicroagentDispatcher, type MicroagentRunnable } from "../dispatch";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function okResult(output: unknown, durationMs = 5): MicroagentResult {
  return { output, exitCode: 0, durationMs };
}

function makeMockRunner(
  impl?: (inv: MicroagentInvocation) => Promise<MicroagentResult>,
): MicroagentRunnable {
  return {
    run: vi.fn(
      impl ??
        (async (inv) => okResult({ echo: inv.input })),
    ),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MicroagentDispatcher", () => {
  // ---- dispatch() ----

  it("dispatch() calls runner.run with correct invocation", async () => {
    const runner = makeMockRunner();
    const dispatcher = new MicroagentDispatcher(runner);

    const result = await dispatcher.dispatch("format-converter", { src: "hello" });

    expect(runner.run).toHaveBeenCalledTimes(1);
    const inv = (runner.run as ReturnType<typeof vi.fn>).mock.calls[0]![0] as MicroagentInvocation;
    expect(inv.microagentName).toBe("format-converter");
    expect(inv.input).toEqual({ src: "hello" });
    expect(result.exitCode).toBe(0);
  });

  it("dispatch() passes options (timeout, correlationId, parentAgentId)", async () => {
    const runner = makeMockRunner();
    const dispatcher = new MicroagentDispatcher(runner);

    await dispatcher.dispatch("code-analyzer", { file: "x.ts" }, {
      timeout: 5000,
      correlationId: "corr-123",
      parentAgentId: "agent-A",
    });

    const inv = (runner.run as ReturnType<typeof vi.fn>).mock.calls[0]![0] as MicroagentInvocation;
    expect(inv.timeout).toBe(5000);
    expect(inv.correlationId).toBe("corr-123");
    expect(inv.parentAgentId).toBe("agent-A");
  });

  it("dispatch() omits optional fields when not provided", async () => {
    const runner = makeMockRunner();
    const dispatcher = new MicroagentDispatcher(runner);

    await dispatcher.dispatch("diff-applier", {});

    const inv = (runner.run as ReturnType<typeof vi.fn>).mock.calls[0]![0] as MicroagentInvocation;
    expect(inv.correlationId).toBeUndefined();
    expect(inv.parentAgentId).toBeUndefined();
    expect(inv.timeout).toBeUndefined();
  });

  // ---- dispatchBatch() ----

  it("dispatchBatch() runs multiple invocations", async () => {
    const runner = makeMockRunner();
    const dispatcher = new MicroagentDispatcher(runner);

    const invocations: MicroagentInvocation[] = [
      { microagentName: "a", input: 1 },
      { microagentName: "b", input: 2 },
      { microagentName: "c", input: 3 },
    ];

    const results = await dispatcher.dispatchBatch(invocations);

    expect(results).toHaveLength(3);
    expect(runner.run).toHaveBeenCalledTimes(3);
    results.forEach((r) => expect(r.exitCode).toBe(0));
  });

  it("dispatchBatch() respects concurrency limit", async () => {
    let concurrent = 0;
    let maxObserved = 0;

    const runner = makeMockRunner(async (inv) => {
      concurrent++;
      maxObserved = Math.max(maxObserved, concurrent);
      await new Promise((r) => setTimeout(r, 20));
      concurrent--;
      return okResult(inv.input);
    });

    const dispatcher = new MicroagentDispatcher(runner);

    const invocations: MicroagentInvocation[] = Array.from({ length: 8 }, (_, i) => ({
      microagentName: `agent-${i}`,
      input: i,
    }));

    await dispatcher.dispatchBatch(invocations, 3);

    // Should have capped at 3 concurrent
    expect(maxObserved).toBeLessThanOrEqual(3);
    expect(maxObserved).toBeGreaterThanOrEqual(1);
  });

  it("dispatchBatch() returns empty array for empty input", async () => {
    const runner = makeMockRunner();
    const dispatcher = new MicroagentDispatcher(runner);
    const results = await dispatcher.dispatchBatch([]);
    expect(results).toHaveLength(0);
    expect(runner.run).not.toHaveBeenCalled();
  });
});
