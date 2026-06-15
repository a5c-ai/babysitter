/**
 * Rank synthesis strategy.
 *
 * Scores each input using its weight (confidence) or a custom scoring
 * function, then returns the top-scored input's value.
 */

import type {
  RankSynthesisStrategy,
  SynthesisInput,
  SynthesisOutput,
} from "../types";

/**
 * Optional configuration for the rank strategy, extending the base
 * strategy with a custom scoring function.
 */
export interface RankSynthesisConfig<T> {
  /** Custom scoring function. When provided, overrides input.confidence. */
  readonly scoreFn?: (input: SynthesisInput<T>) => number;
}

/**
 * Apply the rank synthesis strategy to the given inputs.
 *
 * @param inputs   - The inputs to rank. Must contain at least one entry.
 * @param strategy - Rank strategy configuration.
 * @param config   - Optional extended configuration with a custom scoreFn.
 * @returns The ranked synthesis output (top-scored input).
 */
export function applyRankSynthesis<T>(
  inputs: readonly SynthesisInput<T>[],
  strategy: RankSynthesisStrategy,
  config?: RankSynthesisConfig<T>,
): SynthesisOutput<T> {
  if (inputs.length === 0) {
    throw new Error("RankSynthesis requires at least one input");
  }

  const scoreFn = config?.scoreFn ?? ((input: SynthesisInput<T>) => input.confidence ?? 1);

  // Score and sort descending.
  const scored = inputs.map((input) => ({
    input,
    score: scoreFn(input),
  }));

  scored.sort((a, b) => b.score - a.score);

  const topK = strategy.topK ?? 1;

  if (topK === 1) {
    // Fast path: return the single top-scored input.
    const best = scored[0];
    return {
      value: best.input.value,
      strategy: "rank",
      confidence: best.input.confidence ?? 1,
      contributingSources: [best.input.sourceId],
    };
  }

  // topK > 1: merge the top-K values into an array.
  const topEntries = scored.slice(0, topK);
  const values = topEntries.map((e) => e.input.value);
  const avgConfidence =
    topEntries.reduce((sum, e) => sum + (e.input.confidence ?? 1), 0) /
    topEntries.length;

  return {
    value: values as unknown as T,
    strategy: "rank",
    confidence: avgConfidence,
    contributingSources: topEntries.map((e) => e.input.sourceId),
  };
}
