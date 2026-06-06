import { describe, expect, test } from "vitest";
import {
  MODEL_PRICING,
  MODEL_PRICING_EXTENDED,
  calculateCostUsd,
  calculateCostUsdExtended,
} from "../types";

// ============================================================================
// MODEL_PRICING table
// ============================================================================

describe("MODEL_PRICING", () => {
  test("contains entries for all expected model families", () => {
    const keys = Object.keys(MODEL_PRICING);

    // Opus family
    expect(keys).toContain("claude-opus-4-6");
    expect(keys).toContain("claude-opus-4-5");
    expect(keys).toContain("claude-opus-4-1");
    expect(keys).toContain("claude-opus-4-0");

    // Sonnet family
    expect(keys).toContain("claude-sonnet-4-6");
    expect(keys).toContain("claude-sonnet-4-5");
    expect(keys).toContain("claude-sonnet-4-0");

    // Haiku family
    expect(keys).toContain("claude-haiku-4-5");
    expect(keys).toContain("claude-haiku-3-5");
  });

  test("all pricing entries have positive rates", () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
      expect(pricing.inputPer1M, `${model} inputPer1M`).toBeGreaterThan(0);
      expect(pricing.outputPer1M, `${model} outputPer1M`).toBeGreaterThan(0);
      expect(pricing.cacheCreationPer1M, `${model} cacheCreationPer1M`).toBeGreaterThan(0);
      expect(pricing.cacheReadPer1M, `${model} cacheReadPer1M`).toBeGreaterThan(0);
    }
  });

  test("cache-creation rate is 1.25x input rate for all models", () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
      const expected = pricing.inputPer1M * 1.25;
      expect(pricing.cacheCreationPer1M, `${model} cacheCreation should be 1.25x input`).toBeCloseTo(expected, 6);
    }
  });

  test("cache-read rate is 0.1x input rate for all models", () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
      const expected = pricing.inputPer1M * 0.1;
      expect(pricing.cacheReadPer1M, `${model} cacheRead should be 0.1x input`).toBeCloseTo(expected, 6);
    }
  });
});

// ============================================================================
// MODEL_PRICING_EXTENDED table
// ============================================================================

describe("MODEL_PRICING_EXTENDED", () => {
  test("has the same model keys as MODEL_PRICING", () => {
    const baseKeys = Object.keys(MODEL_PRICING).sort();
    const extKeys = Object.keys(MODEL_PRICING_EXTENDED).sort();
    expect(extKeys).toEqual(baseKeys);
  });

  test("1-hour cache rate is 2x input rate for all models", () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING_EXTENDED)) {
      const expected = pricing.inputPer1M * 2;
      expect(pricing.cacheCreation1hPer1M, `${model} 1h cache should be 2x input`).toBeCloseTo(expected, 6);
    }
  });

  test("5-minute cache rate matches base cacheCreationPer1M", () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING_EXTENDED)) {
      expect(pricing.cacheCreation5mPer1M, `${model} 5m cache should match base`).toBe(pricing.cacheCreationPer1M);
    }
  });
});

// ============================================================================
// calculateCostUsd
// ============================================================================

describe("calculateCostUsd", () => {
  test("returns correct cost for claude-opus-4-6 with known token counts", () => {
    // 1000 input tokens at $5/1M = $0.005
    // 500 output tokens at $25/1M = $0.0125
    // 200 cache-creation tokens at $6.25/1M = $0.00125
    // 100 cache-read tokens at $0.50/1M = $0.00005
    // Total = $0.01880
    const cost = calculateCostUsd("claude-opus-4-6", 1000, 500, 200, 100);
    expect(cost).toBeCloseTo(0.01880, 5);
  });

  test("returns correct cost for claude-sonnet-4-6", () => {
    // 1,000,000 input tokens at $3/1M = $3.00
    // 1,000,000 output tokens at $15/1M = $15.00
    // 0 cache tokens
    // Total = $18.00
    const cost = calculateCostUsd("claude-sonnet-4-6", 1_000_000, 1_000_000, 0, 0);
    expect(cost).toBe(18);
  });

  test("returns correct cost for claude-haiku-3-5", () => {
    // 500,000 input at $0.80/1M = $0.40
    // 250,000 output at $4/1M = $1.00
    // 100,000 cache-creation at $1/1M = $0.10
    // 50,000 cache-read at $0.08/1M = $0.004
    // Total = $1.504
    const cost = calculateCostUsd("claude-haiku-3-5", 500_000, 250_000, 100_000, 50_000);
    expect(cost).toBeCloseTo(1.504, 6);
  });

  test("returns undefined for unknown model", () => {
    const cost = calculateCostUsd("gpt-4o-turbo", 1000, 500, 0, 0);
    expect(cost).toBeUndefined();
  });

  test("returns undefined for empty model string", () => {
    const cost = calculateCostUsd("", 1000, 500, 0, 0);
    expect(cost).toBeUndefined();
  });

  test("returns 0 when all token counts are 0", () => {
    const cost = calculateCostUsd("claude-opus-4-6", 0, 0, 0, 0);
    expect(cost).toBe(0);
  });

  test("handles date-suffixed model identifiers", () => {
    // "claude-opus-4-6-20260301" should resolve to "claude-opus-4-6"
    const cost = calculateCostUsd("claude-opus-4-6-20260301", 1_000_000, 0, 0, 0);
    expect(cost).toBe(5); // $5/1M input tokens
  });

  test("handles prefix matching for future model variants", () => {
    // "claude-opus-4-6-preview" should match "claude-opus-4-6" via prefix
    const cost = calculateCostUsd("claude-opus-4-6-preview", 1_000_000, 0, 0, 0);
    expect(cost).toBe(5);
  });

  test("rounds result to 6 decimal places", () => {
    // Use values that would produce floating-point drift
    const cost = calculateCostUsd("claude-sonnet-4-6", 333, 777, 111, 999);
    expect(cost).toBeDefined();
    // Verify at most 6 decimal places
    const parts = cost!.toString().split(".");
    if (parts.length > 1) {
      expect(parts[1].length).toBeLessThanOrEqual(6);
    }
  });
});

// ============================================================================
// calculateCostUsdExtended
// ============================================================================

describe("calculateCostUsdExtended", () => {
  test("returns correct cost with 5m and 1h cache split", () => {
    // claude-opus-4-6:
    // 1000 input at $5/1M = $0.005
    // 500 output at $25/1M = $0.0125
    // 200 5m-cache at $6.25/1M = $0.00125
    // 300 1h-cache at $10/1M = $0.003
    // 100 cache-read at $0.50/1M = $0.00005
    // Total = $0.02180
    const cost = calculateCostUsdExtended("claude-opus-4-6", 1000, 500, 200, 300, 100);
    expect(cost).toBeCloseTo(0.02180, 5);
  });

  test("returns undefined for unknown model", () => {
    const cost = calculateCostUsdExtended("unknown-model", 1000, 500, 200, 300, 100);
    expect(cost).toBeUndefined();
  });

  test("returns 0 when all tokens are 0", () => {
    const cost = calculateCostUsdExtended("claude-opus-4-6", 0, 0, 0, 0, 0);
    expect(cost).toBe(0);
  });

  test("1h cache rate is more expensive than 5m cache rate", () => {
    // Same tokens, but 1h cache should cost more than 5m cache
    const costWith5m = calculateCostUsdExtended("claude-opus-4-6", 0, 0, 1_000_000, 0, 0);
    const costWith1h = calculateCostUsdExtended("claude-opus-4-6", 0, 0, 0, 1_000_000, 0);
    expect(costWith1h!).toBeGreaterThan(costWith5m!);
  });

  test("rounds result to 6 decimal places", () => {
    const cost = calculateCostUsdExtended("claude-sonnet-4-6", 333, 777, 111, 222, 999);
    expect(cost).toBeDefined();
    const parts = cost!.toString().split(".");
    if (parts.length > 1) {
      expect(parts[1].length).toBeLessThanOrEqual(6);
    }
  });
});
