/**
 * Cost tracking type definitions and pricing constants for Babysitter SDK.
 *
 * Covers Anthropic Claude API token usage structures as seen in Claude Code
 * session JSONL files, plus aggregation interfaces for run-level and
 * cross-run cost reporting.
 *
 * Pricing source: https://docs.anthropic.com/en/docs/about-claude/pricing
 * Last verified: 2026-04-05
 */

/**
 * Token/cost data for a single API interaction (assistant message).
 *
 * Field names mirror the Anthropic API usage response shape, converted to
 * camelCase for SDK consistency.
 */
export interface CostEventData {
  /** Model identifier, e.g. "claude-opus-4-6", "claude-sonnet-4-6". */
  model: string;

  /** Base (non-cached) input tokens. */
  inputTokens: number;

  /** Output (completion) tokens. */
  outputTokens: number;

  /** Total cache-creation input tokens (sum of 5m + 1h buckets). */
  cacheCreationTokens: number;

  /** Tokens read from prompt cache (cache hits). */
  cacheReadTokens: number;

  /** Ephemeral 5-minute cache-creation input tokens. */
  cacheCreation5mTokens: number;

  /** Extended 1-hour cache-creation input tokens. */
  cacheCreation1hTokens: number;

  /** Service tier reported by the API (e.g. "standard"). */
  serviceTier?: string;

  /** Effect ID that produced this usage, when tracked inside a run. */
  effectId?: string;

  /** Task kind (e.g. "orchestrator_task", "node", "breakpoint"). */
  taskKind?: string;

  /** Wall-clock duration of the API call in milliseconds. */
  durationMs?: number;

  /** Computed cost in USD for this single event. */
  costUsd?: number;

  /** ISO-8601 timestamp of the event. */
  timestamp?: string;
}

/** Per-model cost aggregation within a run. */
export interface ModelCostStats {
  model: string;
  eventCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  costUsd: number;
}

/** Per-task-kind cost aggregation within a run. */
export interface KindCostStats {
  kind: string;
  eventCount: number;
  costUsd: number;
}

/** Cost summary for a single run. */
export interface RunCostStats {
  runId: string;
  date: string;
  eventCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreation: number;
  totalCacheRead: number;
  totalCostUsd: number;
  byModel: Record<string, ModelCostStats>;
  byKind: Record<string, KindCostStats>;
}

/** Aggregate cost summary across multiple runs. */
export interface AggregateCostStats {
  totalRuns: number;
  totalEvents: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreation: number;
  totalCacheRead: number;
  totalCostUsd: number;
  /** Overall cost including all token categories across all runs. */
  overallCostUsd: number;
  runs: RunCostStats[];
}

/** Per-million-token pricing for a single model. All values in USD. */
export interface ModelPricing {
  /** Base (non-cached) input tokens, per 1M tokens. */
  inputPer1M: number;
  /** Output tokens, per 1M tokens. */
  outputPer1M: number;
  /**
   * Cache-creation tokens, per 1M tokens.
   *
   * This is the blended/default rate used when the 5m vs 1h breakdown is
   * unavailable. Defaults to the 5-minute cache write rate (1.25x input).
   */
  cacheCreationPer1M: number;
  /** Cache-read (hit) tokens, per 1M tokens (0.1x input). */
  cacheReadPer1M: number;
}

/**
 * Pricing table for known Claude models.
 *
 * Keys use the API model identifier format (e.g. "claude-opus-4-6").
 * Pricing sourced from https://docs.anthropic.com/en/docs/about-claude/pricing
 *
 * Cache-creation rates default to the 5-minute write multiplier (1.25x input).
 * For fine-grained 5m vs 1h cost splits, use {@link MODEL_PRICING_EXTENDED}.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // --- Opus family ---
  "claude-opus-4-6": {
    inputPer1M: 5,
    outputPer1M: 25,
    cacheCreationPer1M: 6.25, // 1.25x input
    cacheReadPer1M: 0.5, // 0.1x input
  },
  "claude-opus-4-5": {
    inputPer1M: 5,
    outputPer1M: 25,
    cacheCreationPer1M: 6.25,
    cacheReadPer1M: 0.5,
  },
  "claude-opus-4-1": {
    inputPer1M: 15,
    outputPer1M: 75,
    cacheCreationPer1M: 18.75,
    cacheReadPer1M: 1.5,
  },
  "claude-opus-4-0": {
    inputPer1M: 15,
    outputPer1M: 75,
    cacheCreationPer1M: 18.75,
    cacheReadPer1M: 1.5,
  },

  // --- Sonnet family ---
  "claude-sonnet-4-6": {
    inputPer1M: 3,
    outputPer1M: 15,
    cacheCreationPer1M: 3.75,
    cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-5": {
    inputPer1M: 3,
    outputPer1M: 15,
    cacheCreationPer1M: 3.75,
    cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-0": {
    inputPer1M: 3,
    outputPer1M: 15,
    cacheCreationPer1M: 3.75,
    cacheReadPer1M: 0.3,
  },

  // --- Haiku family ---
  "claude-haiku-4-5": {
    inputPer1M: 1,
    outputPer1M: 5,
    cacheCreationPer1M: 1.25,
    cacheReadPer1M: 0.1,
  },
  "claude-haiku-3-5": {
    inputPer1M: 0.8,
    outputPer1M: 4,
    cacheCreationPer1M: 1,
    cacheReadPer1M: 0.08,
  },
};

/**
 * Extended pricing with separate 5-minute and 1-hour cache write rates.
 *
 * Use this when the event data provides the `cacheCreation5mTokens` /
 * `cacheCreation1hTokens` breakdown (available via the `cache_creation`
 * sub-object in the Anthropic API response).
 */
export interface ModelPricingExtended extends ModelPricing {
  /** 5-minute cache write, per 1M tokens (1.25x input). */
  cacheCreation5mPer1M: number;
  /** 1-hour cache write, per 1M tokens (2x input). */
  cacheCreation1hPer1M: number;
}

export const MODEL_PRICING_EXTENDED: Record<string, ModelPricingExtended> = {
  "claude-opus-4-6": {
    inputPer1M: 5,
    outputPer1M: 25,
    cacheCreationPer1M: 6.25,
    cacheCreation5mPer1M: 6.25,
    cacheCreation1hPer1M: 10,
    cacheReadPer1M: 0.5,
  },
  "claude-opus-4-5": {
    inputPer1M: 5,
    outputPer1M: 25,
    cacheCreationPer1M: 6.25,
    cacheCreation5mPer1M: 6.25,
    cacheCreation1hPer1M: 10,
    cacheReadPer1M: 0.5,
  },
  "claude-opus-4-1": {
    inputPer1M: 15,
    outputPer1M: 75,
    cacheCreationPer1M: 18.75,
    cacheCreation5mPer1M: 18.75,
    cacheCreation1hPer1M: 30,
    cacheReadPer1M: 1.5,
  },
  "claude-opus-4-0": {
    inputPer1M: 15,
    outputPer1M: 75,
    cacheCreationPer1M: 18.75,
    cacheCreation5mPer1M: 18.75,
    cacheCreation1hPer1M: 30,
    cacheReadPer1M: 1.5,
  },
  "claude-sonnet-4-6": {
    inputPer1M: 3,
    outputPer1M: 15,
    cacheCreationPer1M: 3.75,
    cacheCreation5mPer1M: 3.75,
    cacheCreation1hPer1M: 6,
    cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-5": {
    inputPer1M: 3,
    outputPer1M: 15,
    cacheCreationPer1M: 3.75,
    cacheCreation5mPer1M: 3.75,
    cacheCreation1hPer1M: 6,
    cacheReadPer1M: 0.3,
  },
  "claude-sonnet-4-0": {
    inputPer1M: 3,
    outputPer1M: 15,
    cacheCreationPer1M: 3.75,
    cacheCreation5mPer1M: 3.75,
    cacheCreation1hPer1M: 6,
    cacheReadPer1M: 0.3,
  },
  "claude-haiku-4-5": {
    inputPer1M: 1,
    outputPer1M: 5,
    cacheCreationPer1M: 1.25,
    cacheCreation5mPer1M: 1.25,
    cacheCreation1hPer1M: 2,
    cacheReadPer1M: 0.1,
  },
  "claude-haiku-3-5": {
    inputPer1M: 0.8,
    outputPer1M: 4,
    cacheCreationPer1M: 1,
    cacheCreation5mPer1M: 1,
    cacheCreation1hPer1M: 1.6,
    cacheReadPer1M: 0.08,
  },
};

/**
 * Resolve pricing for a model identifier.
 *
 * Handles common variations: the API may return "claude-opus-4-6-20260301"
 * or similar dated suffixes. We strip the date and try progressively
 * shorter prefixes until we find a match.
 */
function resolvePricing(model: string): ModelPricing | undefined {
  // Direct match first.
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];

  // Strip date suffix (e.g. "claude-opus-4-6-20260301" -> "claude-opus-4-6").
  const withoutDate = model.replace(/-\d{8}$/, "");
  if (MODEL_PRICING[withoutDate]) return MODEL_PRICING[withoutDate];

  // Try prefix matching (longest first).
  const keys = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (withoutDate.startsWith(key)) return MODEL_PRICING[key];
  }

  return undefined;
}

/**
 * Calculate the USD cost for a single API interaction.
 *
 * Uses the blended cache-creation rate from {@link MODEL_PRICING}.
 * For fine-grained 5m/1h splits, use {@link calculateCostUsdExtended}.
 *
 * @returns Cost in USD, or `undefined` if the model is unknown.
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

  return Math.round(cost * 1_000_000) / 1_000_000; // 6 decimal places
}

/**
 * Calculate the USD cost with separate 5-minute and 1-hour cache write rates.
 *
 * Use when the Anthropic API response includes the `cache_creation` sub-object
 * with `ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens`.
 *
 * @returns Cost in USD, or `undefined` if the model is unknown.
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
    // Fall back to base pricing with derived 1h rate (2x input).
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

/** Options for the cost:stats CLI command. */
export interface CostStatsOptions {
  /** Show stats for a specific run. */
  runId?: string;
  /** Aggregate stats across all runs. */
  all?: boolean;
  /** Output JSON instead of a table. */
  json?: boolean;
  /** Custom runs directory. */
  runsDir?: string;
  /** Filter to a specific model. */
  model?: string;
  /** Filter to a specific task kind. */
  kind?: string;
  /** Only show runs after this ISO-8601 date. */
  since?: string;
  /** Only show runs before this ISO-8601 date. */
  until?: string;
}
