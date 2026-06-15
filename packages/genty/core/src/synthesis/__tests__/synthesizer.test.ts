import { describe, expect, it } from "vitest";
import { ResultSynthesizerImpl } from "../synthesizer";
import type { SynthesisInput } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput<T>(
  sourceId: string,
  value: T,
  confidence?: number,
): SynthesisInput<T> {
  return { sourceId, value, ...(confidence !== undefined ? { confidence } : {}) };
}

// ---------------------------------------------------------------------------
// Merge strategy
// ---------------------------------------------------------------------------

describe("ResultSynthesizer — merge", () => {
  it("deep-merges objects", async () => {
    const synth = new ResultSynthesizerImpl<Record<string, unknown>>();

    const result = await synth.synthesize(
      [
        makeInput("a", { x: 1, nested: { foo: "bar" } }),
        makeInput("b", { y: 2, nested: { baz: "qux" } }),
      ],
      { kind: "merge" },
    );

    expect(result.strategy).toBe("merge");
    expect(result.value).toEqual({
      x: 1,
      y: 2,
      nested: { foo: "bar", baz: "qux" },
    });
    expect(result.contributingSources).toEqual(["a", "b"]);
  });

  it("concatenates arrays", async () => {
    const synth = new ResultSynthesizerImpl<number[]>();

    const result = await synth.synthesize(
      [
        makeInput("a", [1, 2]),
        makeInput("b", [3, 4]),
      ],
      { kind: "merge" },
    );

    expect(result.value).toEqual([1, 2, 3, 4]);
  });

  it("last-wins for primitives", async () => {
    const synth = new ResultSynthesizerImpl<string>();

    const result = await synth.synthesize(
      [
        makeInput("a", "first"),
        makeInput("b", "second"),
      ],
      { kind: "merge" },
    );

    expect(result.value).toBe("second");
  });
});

// ---------------------------------------------------------------------------
// Vote strategy
// ---------------------------------------------------------------------------

describe("ResultSynthesizer — vote", () => {
  it("returns majority value", async () => {
    const synth = new ResultSynthesizerImpl<string>();

    const result = await synth.synthesize(
      [
        makeInput("a1", "yes"),
        makeInput("a2", "yes"),
        makeInput("a3", "no"),
      ],
      { kind: "vote" },
    );

    expect(result.strategy).toBe("vote");
    expect(result.value).toBe("yes");
    expect(result.confidence).toBeCloseTo(2 / 3);
    expect(result.contributingSources).toEqual(["a1", "a2"]);
  });

  it("tie-break by weight (confidence)", async () => {
    const synth = new ResultSynthesizerImpl<string>();

    // 1 vote for "alpha" with high confidence, 1 vote for "beta" with low confidence.
    // Both have count=1, so totalWeight breaks the tie.
    const result = await synth.synthesize(
      [
        makeInput("a1", "alpha", 0.9),
        makeInput("a2", "beta", 0.1),
      ],
      { kind: "vote" },
    );

    expect(result.value).toBe("alpha");
  });

  it("reports low confidence when no clear majority", async () => {
    const synth = new ResultSynthesizerImpl<string>();

    const result = await synth.synthesize(
      [
        makeInput("a1", "x"),
        makeInput("a2", "y"),
        makeInput("a3", "z"),
      ],
      { kind: "vote" },
    );

    // Each has 1/3 agreement, confidence should be ~0.333.
    expect(result.confidence).toBeCloseTo(1 / 3);
  });
});

// ---------------------------------------------------------------------------
// Rank strategy
// ---------------------------------------------------------------------------

describe("ResultSynthesizer — rank", () => {
  it("returns highest-scored input (by confidence)", async () => {
    const synth = new ResultSynthesizerImpl<string>();

    const result = await synth.synthesize(
      [
        makeInput("low", "bad", 0.2),
        makeInput("high", "good", 0.9),
        makeInput("mid", "ok", 0.5),
      ],
      { kind: "rank" },
    );

    expect(result.strategy).toBe("rank");
    expect(result.value).toBe("good");
    expect(result.confidence).toBe(0.9);
    expect(result.contributingSources).toEqual(["high"]);
  });

  it("uses custom scoreFn when provided", async () => {
    // Custom scoreFn that ranks by string length of the value.
    const synth = new ResultSynthesizerImpl<string>({
      scoreFn: (input) => (input.value as string).length,
    });

    const result = await synth.synthesize(
      [
        makeInput("short", "hi", 1.0),
        makeInput("long", "hello world", 0.1),
        makeInput("mid", "hello", 0.5),
      ],
      { kind: "rank" },
    );

    // "hello world" is the longest string.
    expect(result.value).toBe("hello world");
    expect(result.contributingSources).toEqual(["long"]);
  });

  it("returns top-K when topK > 1", async () => {
    const synth = new ResultSynthesizerImpl<string>();

    const result = await synth.synthesize(
      [
        makeInput("a", "first", 0.9),
        makeInput("b", "second", 0.8),
        makeInput("c", "third", 0.1),
      ],
      { kind: "rank", topK: 2 },
    );

    // topK=2 returns an array of the top 2 values.
    const values = result.value as unknown as string[];
    expect(values).toEqual(["first", "second"]);
    expect(result.contributingSources).toEqual(["a", "b"]);
  });
});

// ---------------------------------------------------------------------------
// combine() convenience method
// ---------------------------------------------------------------------------

describe("ResultSynthesizer — combine", () => {
  it("uses merge strategy by default", async () => {
    const synth = new ResultSynthesizerImpl<Record<string, number>>();

    const result = await synth.combine([
      makeInput("a", { x: 1 }),
      makeInput("b", { y: 2 }),
    ]);

    expect(result.strategy).toBe("merge");
    expect(result.value).toEqual({ x: 1, y: 2 });
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("ResultSynthesizer — edge cases", () => {
  it("throws when inputs array is empty", async () => {
    const synth = new ResultSynthesizerImpl<string>();

    await expect(synth.synthesize([], { kind: "merge" })).rejects.toThrow(
      "at least one input",
    );
  });
});
