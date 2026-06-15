/**
 * Cost / token accumulation helpers for RunHandleImpl.
 *
 * Pure functions extracted so the main run-handle implementation stays
 * focused on orchestration (state machine, iterators, thenable). No behavior
 * change — these are the exact mutations previously inlined in
 * RunHandleImpl._accumulate and RunHandleImpl._buildResult.
 */

import type { AgentEvent, CostEvent, TokenUsageEvent } from './events.js';
import type { CostRecord } from './types.js';
import type { RunResult, TokenUsageSummary } from './run-handle.js';

export interface CostAccumulator {
  totalUsd: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export interface TokenAccumulator {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

/** Fold a `token_usage` event into the running accumulator. */
export function accumulateTokenUsage(acc: TokenAccumulator, event: TokenUsageEvent): void {
  acc.inputTokens += event.inputTokens;
  acc.outputTokens += event.outputTokens;
  if (event.thinkingTokens) acc.thinkingTokens += event.thinkingTokens;
  if (event.cachedTokens) acc.cachedTokens += event.cachedTokens;
  // Note: TokenUsageEvent doesn't have granular cache fields yet, so we
  // accumulate them from CostEvents instead for now
}

/**
 * Fold a `cost` event into the running accumulator. Returns the new
 * accumulator (which may be a freshly allocated record on the first call).
 */
export function accumulateCost(current: CostAccumulator | null, event: CostEvent): CostAccumulator {
  const c = event.cost;
  if (current === null) {
    return {
      totalUsd: c.totalUsd,
      inputTokens: c.inputTokens,
      outputTokens: c.outputTokens,
      thinkingTokens: c.thinkingTokens ?? 0,
      cachedTokens: c.cachedTokens ?? 0,
      cacheCreationTokens: c.cacheCreationTokens ?? 0,
      cacheReadTokens: c.cacheReadTokens ?? 0,
    };
  }
  current.totalUsd += c.totalUsd;
  current.inputTokens += c.inputTokens;
  current.outputTokens += c.outputTokens;
  current.thinkingTokens += c.thinkingTokens ?? 0;
  current.cachedTokens += c.cachedTokens ?? 0;
  current.cacheCreationTokens += c.cacheCreationTokens ?? 0;
  current.cacheReadTokens += c.cacheReadTokens ?? 0;
  return current;
}

/** Build the token usage summary, or null when no usage was seen. */
export function buildTokenUsageSummary(acc: TokenAccumulator): TokenUsageSummary | null {
  const hasUsage =
    acc.inputTokens > 0 ||
    acc.outputTokens > 0 ||
    acc.thinkingTokens > 0 ||
    acc.cachedTokens > 0;
  if (!hasUsage) return null;
  return {
    inputTokens: acc.inputTokens,
    outputTokens: acc.outputTokens,
    thinkingTokens: acc.thinkingTokens,
    cachedTokens: acc.cachedTokens,
    totalTokens: acc.inputTokens + acc.outputTokens + acc.thinkingTokens,
  };
}
