/**
 * Cost tracking module for Babysitter SDK.
 *
 * Provides type definitions, pricing constants, and cost calculation utilities
 * for Anthropic Claude API token usage.
 *
 * @example
 * ```ts
 * import { calculateCostUsd, MODEL_PRICING } from '../cost';
 *
 * const cost = calculateCostUsd('claude-opus-4-6', 1000, 500, 200, 100);
 * ```
 */
export {
  // Event-level types
  type CostEventData,

  // Aggregation types
  type ModelCostStats,
  type KindCostStats,
  type RunCostStats,
  type AggregateCostStats,

  // Pricing types and constants
  type ModelPricing,
  type ModelPricingExtended,
  MODEL_PRICING,
  MODEL_PRICING_EXTENDED,

  // Cost calculation
  calculateCostUsd,
  calculateCostUsdExtended,

  // CLI options
  type CostStatsOptions,
} from "./types";

export {
  // Journal helpers
  COST_TRACKED_EVENT_TYPE,
  appendCostEvent,
  extractCostEvents,
  computeRunCostStats,
} from "./journal";

export {
  // Claude Code JSONL parser
  parseClaudeCodeSession,
  parseClaudeCodeSessionWithSubagents,
  aggregateUsageData,
  type AggregatedUsage,
} from "./claudeCodeParser";

export {
  // Cost data collector
  collectCostDataForRun,
  resolveClaudeCodeSessionDir,
} from "./collector";

// effectCost moved to @a5c-ai/babysitter-agent (GAP-SUBOBS-003)
