/**
 * GAP-PAR-003: Multi-Harness Dispatch tests.
 */

import { describe, it, expect, vi } from "vitest";
import {
  MultiHarnessDispatcher,
  type DispatchTarget,
  type DispatchHandler,
} from "../multiHarnessDispatch";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTarget(harness: string, prompt = "test", timeoutMs?: number): DispatchTarget {
  return { harness, prompt, timeoutMs };
}

function delayedHandler(responseMap: Record<string, string>, delayMs = 10): DispatchHandler {
  return async (target) => {
    await new Promise((r) => setTimeout(r, delayMs));
    const response = responseMap[target.harness];
    if (response === undefined) {
      throw new Error(`Unknown harness: ${target.harness}`);
    }
    return response;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MultiHarnessDispatcher", () => {
  // ---- Basic dispatch ----

  it("dispatches to all targets and returns results", async () => {
    const handler = delayedHandler({
      "claude-code": "response-cc",
      cursor: "response-cursor",
    });
    const dispatcher = new MultiHarnessDispatcher(handler);

    const results = await dispatcher.dispatch([
      makeTarget("claude-code"),
      makeTarget("cursor"),
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]!.status).toBe("fulfilled");
    expect(results[0]!.response).toBe("response-cc");
    expect(results[1]!.status).toBe("fulfilled");
    expect(results[1]!.response).toBe("response-cursor");
  });

  it("returns empty array for empty targets", async () => {
    const handler = vi.fn();
    const dispatcher = new MultiHarnessDispatcher(handler);
    const results = await dispatcher.dispatch([]);
    expect(results).toHaveLength(0);
    expect(handler).not.toHaveBeenCalled();
  });

  // ---- Error handling ----

  it("captures failures without throwing", async () => {
    const handler: DispatchHandler = async (target) => {
      if (target.harness === "broken") throw new Error("connection refused");
      return "ok";
    };
    const dispatcher = new MultiHarnessDispatcher(handler);

    const results = await dispatcher.dispatch([
      makeTarget("claude-code"),
      makeTarget("broken"),
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]!.status).toBe("fulfilled");
    expect(results[0]!.response).toBe("ok");
    expect(results[1]!.status).toBe("rejected");
    expect((results[1]!.reason as Error).message).toBe("connection refused");
  });

  // ---- Timeout ----

  it("rejects with timeout error when target exceeds timeoutMs", async () => {
    const handler: DispatchHandler = async () => {
      await new Promise((r) => setTimeout(r, 200));
      return "late";
    };
    const dispatcher = new MultiHarnessDispatcher(handler);

    const results = await dispatcher.dispatch([
      makeTarget("slow-harness", "prompt", 50),
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("rejected");
    expect((results[0]!.reason as Error).message).toContain("timed out");
  });

  it("does not timeout when handler completes in time", async () => {
    const handler = delayedHandler({ fast: "quick-response" }, 5);
    const dispatcher = new MultiHarnessDispatcher(handler);

    const results = await dispatcher.dispatch([
      makeTarget("fast", "prompt", 1000),
    ]);

    expect(results[0]!.status).toBe("fulfilled");
    expect(results[0]!.response).toBe("quick-response");
  });

  // ---- Timing ----

  it("records durationMs for each dispatch", async () => {
    const handler = delayedHandler({ h1: "ok" }, 20);
    const dispatcher = new MultiHarnessDispatcher(handler);

    const results = await dispatcher.dispatch([makeTarget("h1")]);

    expect(results[0]!.durationMs).toBeGreaterThanOrEqual(15);
  });

  // ---- Preserves target reference ----

  it("includes the original target in each result", async () => {
    const handler = delayedHandler({ h1: "ok" });
    const dispatcher = new MultiHarnessDispatcher(handler);
    const target = makeTarget("h1", "my prompt");

    const results = await dispatcher.dispatch([target]);

    expect(results[0]!.target).toBe(target);
    expect(results[0]!.target.prompt).toBe("my prompt");
  });

  // ---- Concurrent execution ----

  it("dispatches targets concurrently", async () => {
    let concurrent = 0;
    let maxObserved = 0;

    const handler: DispatchHandler = async () => {
      concurrent += 1;
      maxObserved = Math.max(maxObserved, concurrent);
      await new Promise((r) => setTimeout(r, 20));
      concurrent -= 1;
      return "ok";
    };
    const dispatcher = new MultiHarnessDispatcher(handler);

    await dispatcher.dispatch([
      makeTarget("h1"),
      makeTarget("h2"),
      makeTarget("h3"),
    ]);

    // All 3 should run concurrently
    expect(maxObserved).toBe(3);
  });
});
