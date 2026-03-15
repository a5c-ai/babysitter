import { describe, expect, test } from "vitest";
import { compressContext } from "../utils/compressContext";

// ---------------------------------------------------------------------------
// Helper: generate a long context of approximately N "words".
// ---------------------------------------------------------------------------
function makeContext(wordCount: number): string {
  const sentence =
    "The quick brown fox jumps over the lazy dog near the riverbank every morning. ";
  const repetitions = Math.ceil(wordCount / 14); // ~14 words per sentence
  return sentence.repeat(repetitions).trim();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compressContext", () => {
  test("empty context returns empty compressedText with zero tokens", async () => {
    const result = await compressContext("", "what is the summary?");

    expect(result.compressedText).toBe("");
    expect(result.originalTokens).toBe(0);
    expect(result.compressedTokens).toBe(0);
    expect(result.reductionRatio).toBe(0);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("short context (below minCompressionTokens=80) is passed through without meaningful reduction", async () => {
    // ~25 tokens — well below the 80-token compression threshold
    const shortContext = "This is a short context. It has only a few sentences. No compression needed.";
    const result = await compressContext(shortContext, "short context summary", {
      minCompressionTokens: 80,
    });

    expect(result.originalTokens).toBeGreaterThan(0);
    // The engine will still return something — check it's non-empty
    expect(result.compressedText.length).toBeGreaterThan(0);
    // Reduction should be minimal or zero for very short inputs
    expect(result.reductionRatio).toBeGreaterThanOrEqual(0);
    expect(result.reductionRatio).toBeLessThan(1);
  });

  test("long context is compressed toward targetReduction=0.45", async () => {
    const context = makeContext(300); // ~300 tokens
    const result = await compressContext(
      context,
      "fox jumps over the dog",
      { targetReduction: 0.45, minCompressionTokens: 80, maxCompressionSentences: 20 }
    );

    expect(result.originalTokens).toBeGreaterThan(80);
    expect(result.compressedTokens).toBeLessThan(result.originalTokens);
    // Should have achieved at least some reduction
    expect(result.reductionRatio).toBeGreaterThan(0);
    expect(result.compressedText.length).toBeGreaterThan(0);
  });

  test("result shape satisfies the CompressContextResult interface", async () => {
    const context = makeContext(200);
    const result = await compressContext(context, "riverbank morning fox");

    expect(typeof result.compressedText).toBe("string");
    expect(typeof result.originalTokens).toBe("number");
    expect(typeof result.compressedTokens).toBe("number");
    expect(typeof result.reductionRatio).toBe("number");
    expect(typeof result.latencyMs).toBe("number");
    // reductionRatio must be in [0, 1]
    expect(result.reductionRatio).toBeGreaterThanOrEqual(0);
    expect(result.reductionRatio).toBeLessThanOrEqual(1);
  });

  test("compressed text preserves query-relevant sentences", async () => {
    const irrelevant = "Bananas are yellow. Apples grow on trees. Oranges are citrus fruits. ";
    const relevant = "The deployment pipeline uses Docker containers to ship the application. CI runs on every pull request and triggers automated tests.";
    const context = (irrelevant.repeat(10) + relevant).trim();

    const result = await compressContext(
      context,
      "deployment pipeline Docker CI tests",
      { targetReduction: 0.45, minCompressionTokens: 80, maxCompressionSentences: 20 }
    );

    // The relevant sentences should appear in the compressed output
    const lower = result.compressedText.toLowerCase();
    const mentionsDeployment = lower.includes("deployment") || lower.includes("docker") || lower.includes("ci") || lower.includes("pipeline");
    expect(mentionsDeployment).toBe(true);
  });
});
