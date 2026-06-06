/**
 * GAP-PAR-001: Concurrent Effects tests.
 */

import { describe, it, expect } from "vitest";
import {
  executeConcurrentGroup,
  type ConcurrencyPolicy,
  type ConcurrentEffectResult,
} from "../concurrentEffects";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a delayed effect that resolves with a value. */
function delayed<T>(value: T, ms: number): () => Promise<T> {
  return () => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
}

/** Create a delayed effect that rejects with an error. */
function delayedFail(message: string, ms: number): () => Promise<never> {
  return () => new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("executeConcurrentGroup", () => {
  // ---- Basic execution ----

  it("executes all effects and returns fulfilled results", async () => {
    const effects = [
      delayed("a", 10),
      delayed("b", 10),
      delayed("c", 10),
    ];
    const policy: ConcurrencyPolicy = { maxConcurrency: 3 };

    const results = await executeConcurrentGroup(effects, policy);

    expect(results).toHaveLength(3);
    expect(results[0]!.status).toBe("fulfilled");
    expect(results[0]!.value).toBe("a");
    expect(results[1]!.status).toBe("fulfilled");
    expect(results[1]!.value).toBe("b");
    expect(results[2]!.status).toBe("fulfilled");
    expect(results[2]!.value).toBe("c");
  });

  it("returns empty array for empty effects", async () => {
    const results = await executeConcurrentGroup([], { maxConcurrency: 5 });
    expect(results).toHaveLength(0);
  });

  // ---- Concurrency limiting ----

  it("respects maxConcurrency limit", async () => {
    let concurrent = 0;
    let maxObserved = 0;

    const effects = Array.from({ length: 6 }, (_, i) => async () => {
      concurrent += 1;
      maxObserved = Math.max(maxObserved, concurrent);
      await new Promise((r) => setTimeout(r, 20));
      concurrent -= 1;
      return i;
    });

    const policy: ConcurrencyPolicy = { maxConcurrency: 2 };
    const results = await executeConcurrentGroup(effects, policy);

    expect(results).toHaveLength(6);
    expect(maxObserved).toBeLessThanOrEqual(2);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });

  it("normalizes maxConcurrency to at least 1", async () => {
    const effects = [delayed("x", 5)];
    const results = await executeConcurrentGroup(effects, { maxConcurrency: 0 });
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("fulfilled");
  });

  // ---- Error handling ----

  it("captures failures without throwing (continueOnFailure=true)", async () => {
    const effects = [
      delayed("ok", 10),
      delayedFail("boom", 10),
      delayed("also-ok", 10),
    ];

    const results = await executeConcurrentGroup(effects, {
      maxConcurrency: 3,
      continueOnFailure: true,
    });

    expect(results).toHaveLength(3);
    expect(results[0]!.status).toBe("fulfilled");
    expect(results[1]!.status).toBe("rejected");
    expect((results[1]!.reason as Error).message).toBe("boom");
    expect(results[2]!.status).toBe("fulfilled");
  });

  it("aborts remaining effects when continueOnFailure=false", async () => {
    const effects = [
      delayedFail("early-fail", 5),
      delayed("should-not-run", 50),
      delayed("should-not-run-2", 50),
    ];

    const results = await executeConcurrentGroup(effects, {
      maxConcurrency: 1,
      continueOnFailure: false,
    });

    expect(results).toHaveLength(3);
    expect(results[0]!.status).toBe("rejected");
    // Remaining effects should be aborted
    expect(results[1]!.status).toBe("rejected");
    expect(results[2]!.status).toBe("rejected");
  });

  // ---- Preserves order ----

  it("preserves result order matching input order", async () => {
    const effects = [
      delayed(1, 30),
      delayed(2, 10),
      delayed(3, 20),
    ];

    const results = await executeConcurrentGroup(effects, { maxConcurrency: 3 });

    expect(results[0]!.index).toBe(0);
    expect(results[0]!.value).toBe(1);
    expect(results[1]!.index).toBe(1);
    expect(results[1]!.value).toBe(2);
    expect(results[2]!.index).toBe(2);
    expect(results[2]!.value).toBe(3);
  });

  // ---- Single effect ----

  it("handles single effect", async () => {
    const results = await executeConcurrentGroup(
      [delayed("solo", 5)],
      { maxConcurrency: 10 },
    );
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("fulfilled");
    expect(results[0]!.value).toBe("solo");
  });

  // ---- Default continueOnFailure ----

  it("defaults to continueOnFailure=true", async () => {
    const effects = [
      delayedFail("fail", 5),
      delayed("ok", 10),
    ];

    const results = await executeConcurrentGroup(effects, { maxConcurrency: 1 });

    // Should still run the second effect
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
  });
});
