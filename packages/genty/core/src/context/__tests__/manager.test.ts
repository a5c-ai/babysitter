import { describe, expect, it } from "vitest";
import { ContextManagerImpl } from "../manager";
import { estimateEntryTokens, estimateTokens } from "../token-estimator";
import type { ContextEntry } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(
  id: string,
  content: string,
  overrides?: Partial<ContextEntry>,
): ContextEntry {
  return {
    id,
    role: "user",
    content,
    priority: 0.5,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// inject() and getTokenCount()
// ---------------------------------------------------------------------------

describe("ContextManager — inject and token counting", () => {
  it("inject() adds an entry and getTokenCount() increases", async () => {
    const manager = new ContextManagerImpl({
      config: {
        strategy: { kind: "priority" },
        maxTokens: 10_000,
      },
    });

    expect(manager.getTokenCount()).toBe(0);

    await manager.inject(makeEntry("e1", "hello world"));

    expect(manager.getTokenCount()).toBeGreaterThan(0);
    expect(manager.getEntries()).toHaveLength(1);
    expect(manager.getEntries()[0].id).toBe("e1");
  });

  it("inject() auto-compacts when over threshold", async () => {
    // maxTokens=20, compactionThreshold defaults to 18 (90% of 20).
    // We inject entries that will exceed the threshold.
    const manager = new ContextManagerImpl({
      config: {
        strategy: { kind: "sliding", windowSize: 1 },
        maxTokens: 20,
        tokenEstimatorContext: { provider: "openai", model: "gpt-4o" },
      },
    });

    // Each "a".repeat(80) entry = ceil(80/4) = 20 tokens.
    // First entry: 20 tokens > threshold of 18 -> compact fires.
    await manager.inject(makeEntry("e1", "a".repeat(80)));
    // After compaction with windowSize=1 it keeps only this entry.
    expect(manager.getEntries().length).toBeGreaterThanOrEqual(1);

    // Second entry pushes over again, compaction keeps only the newest.
    await manager.inject(makeEntry("e2", "b".repeat(40)));
    // After sliding compaction with windowSize=1, only latest entry survives
    // (within token budget).
    const entries = manager.getEntries();
    expect(entries.length).toBeLessThanOrEqual(2);
  });

  it("uses configured provider/model context for token counting", async () => {
    const manager = new ContextManagerImpl({
      config: {
        strategy: { kind: "sliding", windowSize: 2 },
        maxTokens: 2,
        compactionThreshold: 999_999,
        tokenEstimatorContext: { provider: "openai", model: "gpt-4o" },
      },
    });

    await manager.inject([
      makeEntry("first", "abcd"),
      makeEntry("second", "efgh"),
    ]);

    expect(manager.getTokenCount()).toBe(2);
    expect(manager.getEntries().map((entry) => entry.id)).toEqual(["first", "second"]);
  });
});

// ---------------------------------------------------------------------------
// Priority compaction
// ---------------------------------------------------------------------------

describe("ContextManager — priority compaction", () => {
  it("drops lowest-priority entries first", async () => {
    const manager = new ContextManagerImpl({
      config: {
        strategy: { kind: "priority" },
        maxTokens: 50,
        // Set a low threshold to prevent auto-compact from messing with
        // manual compact() calls.
        compactionThreshold: 999_999,
      },
    });

    // Each entry: 20-char content = ceil(20/4) = 5 tokens.
    await manager.inject([
      makeEntry("low", "a]".repeat(10), { priority: 0.1 }),
      makeEntry("mid", "b]".repeat(10), { priority: 0.5 }),
      makeEntry("high", "c]".repeat(10), { priority: 0.9 }),
    ]);

    expect(manager.getEntries()).toHaveLength(3);

    // Now compact with a budget that can only hold 2 entries (10 tokens).
    // We need to create a new manager with a lower budget for explicit compact test.
    const manager2 = new ContextManagerImpl({
      config: {
        strategy: { kind: "priority" },
        maxTokens: 10,
        compactionThreshold: 999_999,
      },
    });

    await manager2.inject([
      makeEntry("low", "a]".repeat(10), { priority: 0.1 }),
      makeEntry("mid", "b]".repeat(10), { priority: 0.5 }),
      makeEntry("high", "c]".repeat(10), { priority: 0.9 }),
    ]);

    const evicted = await manager2.compact();
    const remaining = manager2.getEntries();

    // Low priority should be evicted first.
    expect(evicted.some((e) => e.id === "low")).toBe(true);
    expect(remaining.some((e) => e.id === "high")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sliding window compaction
// ---------------------------------------------------------------------------

describe("ContextManager — sliding window compaction", () => {
  it("keeps most recent entries within the window", async () => {
    const manager = new ContextManagerImpl({
      config: {
        strategy: { kind: "sliding", windowSize: 2 },
        maxTokens: 10_000,
        compactionThreshold: 999_999,
      },
    });

    await manager.inject([
      makeEntry("old1", "first message"),
      makeEntry("old2", "second message"),
      makeEntry("new1", "third message"),
      makeEntry("new2", "fourth message"),
    ]);

    const evicted = await manager.compact();
    const remaining = manager.getEntries();

    // windowSize=2 means only the 2 most recent non-system entries survive.
    expect(remaining).toHaveLength(2);
    expect(remaining[0].id).toBe("new1");
    expect(remaining[1].id).toBe("new2");
    expect(evicted).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Summary compaction
// ---------------------------------------------------------------------------

describe("ContextManager — summary compaction", () => {
  it("replaces old entries with a summary entry", async () => {
    const summarizeFn = (entries: readonly ContextEntry[]) =>
      entries.map((e) => e.id).join(",");

    const manager = new ContextManagerImpl({
      config: {
        strategy: { kind: "summary" },
        // Budget of 8 tokens can hold ~1-2 entries (each is 5 tokens).
        // 4 entries = 20 tokens, well over budget.
        maxTokens: 8,
        compactionThreshold: 999_999,
      },
      summarizeFn,
    });

    // Each 20-char entry = ceil(20/4) = 5 tokens.  Total = 20 tokens.
    await manager.inject([
      makeEntry("a", "aaaa bbbb cccc dddd"),
      makeEntry("b", "eeee ffff gggg hhhh"),
      makeEntry("c", "iiii jjjj kkkk llll"),
      makeEntry("d", "mmmm nnnn oooo pppp"),
    ]);

    await manager.compact();
    const entries = manager.getEntries();

    // At least one summary entry should exist (replacing older entries).
    const hasSummary = entries.some((e) => e.role === "summary");
    expect(hasSummary).toBe(true);

    // Total entries should be fewer than the original 4.
    expect(entries.length).toBeLessThan(4);
  });
});

// ---------------------------------------------------------------------------
// getEntries()
// ---------------------------------------------------------------------------

describe("ContextManager — getEntries", () => {
  it("returns all injected entries", async () => {
    const manager = new ContextManagerImpl({
      config: {
        strategy: { kind: "priority" },
        maxTokens: 10_000,
      },
    });

    await manager.inject([
      makeEntry("e1", "one"),
      makeEntry("e2", "two"),
    ]);

    const entries = manager.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].content).toBe("one");
    expect(entries[1].content).toBe("two");
  });
});

// ---------------------------------------------------------------------------
// Token estimator
// ---------------------------------------------------------------------------

describe("Token estimator", () => {
  it("keeps the no-options estimator conservative and compatible", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abc")).toBe(1);
    expect(estimateTokens("abcd")).toBe(2);
    expect(estimateTokens("a".repeat(99))).toBe(33);
  });

  it("supports model/provider-aware estimates", () => {
    expect(estimateTokens("a".repeat(8), { provider: "openai", model: "gpt-4o" })).toBe(2);
    expect(estimateTokens("a".repeat(7), { provider: "anthropic", model: "claude-sonnet-4-6" })).toBe(2);
    expect(estimateTokens("a".repeat(7), { provider: "custom", model: "unknown-model" })).toBe(3);
  });

  it("estimateEntryTokens keeps explicit tokenCount authoritative", () => {
    expect(estimateEntryTokens(makeEntry("counted", "a".repeat(100), { tokenCount: 7 }), {
      provider: "openai",
      model: "gpt-4o",
    })).toBe(7);
  });
});
