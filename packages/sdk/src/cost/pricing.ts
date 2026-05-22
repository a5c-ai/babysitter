/**
 * Pricing constants and calculation functions for Claude models.
 * Extracted from types.ts for max-lines compliance.
 */

import type { ModelPricing, ModelPricingExtended } from "./types";

/**
 * Pricing table for known Claude models.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // --- Opus family ---
  "claude-opus-4-6": {
    inputPer1M: 5, outputPer1M: 25, cacheCreationPer1M: 6.25, cacheReadPer1M: 0.5,
  },
  "claude-opus-4-5": {
    inputPer1M: 5, outputPer1M: 25, cacheCreationPer1M: 6.25, cacheReadPer1M: 0.5,
  },
  "claude-opus-4-1": {
    inputPer1M: 15, outputPer1M: 75, cacheCreationPer1M: 18.75, cacheReadPer1M: 1.5,
  },
  "claude-opus-4-0": {
    inputPer1M: 15, outputPer1M: 75, cacheCreationPer1M: 18.75, cacheReadPer1M: 1.5,
  },
  // --- Sonnet family ---
  "claude-sonnet-4-6": {
    inputPer1M: 3, outputPer1M: 15, cacheCreationPer1M: 3.75, cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-5": {
    inputPer1M: 3, outputPer1M: 15, cacheCreationPer1M: 3.75, cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-0": {
    inputPer1M: 3, outputPer1M: 15, cacheCreationPer1M: 3.75, cacheReadPer1M: 0.3,
  },
  // --- Haiku family ---
  "claude-haiku-4-5": {
    inputPer1M: 1, outputPer1M: 5, cacheCreationPer1M: 1.25, cacheReadPer1M: 0.1,
  },
  "claude-haiku-3-5": {
    inputPer1M: 0.8, outputPer1M: 4, cacheCreationPer1M: 1, cacheReadPer1M: 0.08,
  },
};

export const MODEL_PRICING_EXTENDED: Record<string, ModelPricingExtended> = {
  "claude-opus-4-6": {
    inputPer1M: 5, outputPer1M: 25, cacheCreationPer1M: 6.25,
    cacheCreation5mPer1M: 6.25, cacheCreation1hPer1M: 10, cacheReadPer1M: 0.5,
  },
  "claude-opus-4-5": {
    inputPer1M: 5, outputPer1M: 25, cacheCreationPer1M: 6.25,
    cacheCreation5mPer1M: 6.25, cacheCreation1hPer1M: 10, cacheReadPer1M: 0.5,
  },
  "claude-opus-4-1": {
    inputPer1M: 15, outputPer1M: 75, cacheCreationPer1M: 18.75,
    cacheCreation5mPer1M: 18.75, cacheCreation1hPer1M: 30, cacheReadPer1M: 1.5,
  },
  "claude-opus-4-0": {
    inputPer1M: 15, outputPer1M: 75, cacheCreationPer1M: 18.75,
    cacheCreation5mPer1M: 18.75, cacheCreation1hPer1M: 30, cacheReadPer1M: 1.5,
  },
  "claude-sonnet-4-6": {
    inputPer1M: 3, outputPer1M: 15, cacheCreationPer1M: 3.75,
    cacheCreation5mPer1M: 3.75, cacheCreation1hPer1M: 6, cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-5": {
    inputPer1M: 3, outputPer1M: 15, cacheCreationPer1M: 3.75,
    cacheCreation5mPer1M: 3.75, cacheCreation1hPer1M: 6, cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-0": {
    inputPer1M: 3, outputPer1M: 15, cacheCreationPer1M: 3.75,
    cacheCreation5mPer1M: 3.75, cacheCreation1hPer1M: 6, cacheReadPer1M: 0.3,
  },
  "claude-haiku-4-5": {
    inputPer1M: 1, outputPer1M: 5, cacheCreationPer1M: 1.25,
    cacheCreation5mPer1M: 1.25, cacheCreation1hPer1M: 2, cacheReadPer1M: 0.1,
  },
  "claude-haiku-3-5": {
    inputPer1M: 0.8, outputPer1M: 4, cacheCreationPer1M: 1,
    cacheCreation5mPer1M: 1, cacheCreation1hPer1M: 1.6, cacheReadPer1M: 0.08,
  },
};

/**
 * Resolve pricing for a model identifier.
 */
function resolvePricing(model: string): ModelPricing | undefined {
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  const withoutDate = model.replace(/-\d{8}$/, "");
  if (MODEL_PRICING[withoutDate]) return MODEL_PRICING[withoutDate];
  const keys = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (withoutDate.startsWith(key)) return MODEL_PRICING[key];
  }
  return undefined;
}

/**
 * Calculate the USD cost for a single API interaction.
 */
export function calculateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number,
  cacheReadTokens: number,
): number | undefined {
  const pricing = resolvePricing(model);
  if (!pricing) return undefined;
  const cost =
    (inputTokens / 1_000_000) * pricing.inputPer1M +
    (outputTokens / 1_000_000) * pricing.outputPer1M +
    (cacheCreationTokens / 1_000_000) * pricing.cacheCreationPer1M +
    (cacheReadTokens / 1_000_000) * pricing.cacheReadPer1M;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * Calculate the USD cost with separate 5-minute and 1-hour cache write rates.
 */
export function calculateCostUsdExtended(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreation5mTokens: number,
  cacheCreation1hTokens: number,
  cacheReadTokens: number,
): number | undefined {
  const pricing = MODEL_PRICING_EXTENDED[model] ?? (() => {
    const base = resolvePricing(model);
    if (!base) return undefined;
    return {
      ...base,
      cacheCreation5mPer1M: base.cacheCreationPer1M,
      cacheCreation1hPer1M: base.inputPer1M * 2,
    };
  })();
  if (!pricing) return undefined;
  const ext = pricing;
  const cost =
    (inputTokens / 1_000_000) * ext.inputPer1M +
    (outputTokens / 1_000_000) * ext.outputPer1M +
    (cacheCreation5mTokens / 1_000_000) * ext.cacheCreation5mPer1M +
    (cacheCreation1hTokens / 1_000_000) * ext.cacheCreation1hPer1M +
    (cacheReadTokens / 1_000_000) * ext.cacheReadPer1M;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
