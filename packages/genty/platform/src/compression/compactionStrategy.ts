/**
 * Compaction Strategy (GAP-PERF-002).
 *
 * Higher-level compaction strategy selection and auto-compaction triggers.
 * Complements the existing compaction.ts with strategy-based compression
 * targeting and message-count-aware auto-compact recommendations.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Compaction aggressiveness level. */
export type CompactionStrategyLevel = "aggressive" | "balanced" | "conservative";

/** Metrics captured from a compaction pass. */
export interface CompactionMetrics {
  /** Token count of input (pre-compaction). */
  inputTokens: number;
  /** Token count of output (post-compaction). */
  outputTokens: number;
  /** Ratio of output to input (0-1, lower = more compressed). */
  compressionRatio: number;
  /** Wall-clock duration of the compaction pass in milliseconds. */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Strategy → target ratio mapping
// ---------------------------------------------------------------------------

const STRATEGY_TARGETS: Record<CompactionStrategyLevel, number> = {
  aggressive: 0.3,
  balanced: 0.5,
  conservative: 0.7,
};

/**
 * Returns the target compression ratio for a given strategy.
 *
 * - aggressive  → 0.3  (keep 30% of tokens)
 * - balanced    → 0.5  (keep 50% of tokens)
 * - conservative → 0.7  (keep 70% of tokens)
 */
export function getCompressionTarget(strategy: CompactionStrategyLevel): number {
  return STRATEGY_TARGETS[strategy];
}

// ---------------------------------------------------------------------------
// Auto-compaction recommendation
// ---------------------------------------------------------------------------

/**
 * Thresholds per strategy for triggering auto-compaction.
 * More aggressive strategies trigger sooner.
 */
const AUTO_COMPACT_THRESHOLDS: Record<CompactionStrategyLevel, { messageCount: number; tokenEstimate: number }> = {
  aggressive: { messageCount: 20, tokenEstimate: 40_000 },
  balanced: { messageCount: 50, tokenEstimate: 80_000 },
  conservative: { messageCount: 100, tokenEstimate: 120_000 },
};

/**
 * Determines whether auto-compaction should be triggered based on
 * current message count, estimated token usage, and the chosen strategy.
 *
 * Returns true when either threshold (message count OR token estimate)
 * is exceeded.
 */
export function shouldAutoCompact(
  messageCount: number,
  tokenEstimate: number,
  strategy: CompactionStrategyLevel,
): boolean {
  const thresholds = AUTO_COMPACT_THRESHOLDS[strategy];
  return messageCount >= thresholds.messageCount || tokenEstimate >= thresholds.tokenEstimate;
}
