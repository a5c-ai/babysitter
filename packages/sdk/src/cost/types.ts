/**
 * Cost tracking type definitions for Babysitter SDK.
 *
 * Covers Anthropic Claude API token usage structures as seen in Claude Code
 * session JSONL files, plus aggregation interfaces for run-level and
 * cross-run cost reporting.
 *
 * Pricing source: https://docs.anthropic.com/en/docs/about-claude/pricing
 * Last verified: 2026-04-05
 */

// ============================================================================
// Event-level types
// ============================================================================

/**
 * Token/cost data for a single API interaction (assistant message).
 */
export interface CostEventData {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cacheCreation5mTokens: number;
  cacheCreation1hTokens: number;
  serviceTier?: string;
  effectId?: string;
  taskKind?: string;
  durationMs?: number;
  costUsd?: number;
  timestamp?: string;
}

// ============================================================================
// Aggregation types
// ============================================================================

export interface ModelCostStats {
  model: string;
  eventCount: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  costUsd: number;
}

export interface KindCostStats {
  kind: string;
  eventCount: number;
  costUsd: number;
}

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

export interface AggregateCostStats {
  totalRuns: number;
  totalEvents: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreation: number;
  totalCacheRead: number;
  totalCostUsd: number;
  overallCostUsd: number;
  runs: RunCostStats[];
}

// ============================================================================
// Pricing model
// ============================================================================

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
  cacheCreationPer1M: number;
  cacheReadPer1M: number;
}

export interface ModelPricingExtended extends ModelPricing {
  cacheCreation5mPer1M: number;
  cacheCreation1hPer1M: number;
}

// ============================================================================
// CLI options
// ============================================================================

export interface CostStatsOptions {
  runId?: string;
  all?: boolean;
  json?: boolean;
  runsDir?: string;
  model?: string;
  kind?: string;
  since?: string;
  until?: string;
}

// Re-export pricing constants and functions from the extracted module
export {
  MODEL_PRICING,
  MODEL_PRICING_EXTENDED,
  calculateCostUsd,
  calculateCostUsdExtended,
} from "./pricing";
