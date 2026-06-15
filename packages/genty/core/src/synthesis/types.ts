/**
 * Result synthesis interfaces for the L4 Agent-Core layer.
 *
 * Defines how results from multiple sources (parallel agents, tool calls,
 * subagent invocations) are combined into a single coherent output.
 */

// ---------------------------------------------------------------------------
// Synthesis Strategies
// ---------------------------------------------------------------------------

/** Discriminator for the synthesis algorithm. */
export type SynthesisStrategyKind = 'merge' | 'vote' | 'rank';

/**
 * Merge strategy: all inputs are concatenated or structurally merged
 * into a single output, optionally deduplicated.
 */
export interface MergeSynthesisStrategy {
  readonly kind: 'merge';
  /** When `true`, duplicate content across inputs is removed. */
  readonly deduplicate?: boolean;
}

/**
 * Vote strategy: inputs represent competing answers and the most
 * common (or highest-confidence) answer wins.
 */
export interface VoteSynthesisStrategy {
  readonly kind: 'vote';
  /**
   * Minimum agreement ratio (0-1) required for a result to be accepted.
   * When no result meets the threshold, the synthesizer returns the
   * highest-voted candidate with a low-confidence flag.
   */
  readonly threshold?: number;
}

/**
 * Rank strategy: inputs are scored and ordered; the top-ranked result
 * (or top-N results) are returned.
 */
export interface RankSynthesisStrategy {
  readonly kind: 'rank';
  /** Number of top results to include in the output. Defaults to 1. */
  readonly topK?: number;
}

/** Union of all supported synthesis strategies. */
export type SynthesisStrategy =
  | MergeSynthesisStrategy
  | VoteSynthesisStrategy
  | RankSynthesisStrategy;

// ---------------------------------------------------------------------------
// Synthesis Input
// ---------------------------------------------------------------------------

/** A single input to the synthesis process. */
export interface SynthesisInput<T = unknown> {
  /** Identifier of the source that produced this input (agent ID, tool name, etc.). */
  readonly sourceId: string;

  /** The payload to be synthesized. */
  readonly value: T;

  /**
   * Confidence score (0-1) assigned by the source.
   * Used by the `vote` and `rank` strategies. Defaults to 1.
   */
  readonly confidence?: number;

  /** Arbitrary metadata from the source. */
  readonly metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Synthesis Output
// ---------------------------------------------------------------------------

/** The output of a synthesis operation. */
export interface SynthesisOutput<T = unknown> {
  /** The synthesized result. */
  readonly value: T;

  /** The strategy that was used to produce this result. */
  readonly strategy: SynthesisStrategyKind;

  /**
   * Confidence in the synthesized result (0-1).
   * For `vote`, this reflects agreement ratio.
   * For `rank`, this is the top-ranked input's confidence.
   * For `merge`, this is the average confidence of all inputs.
   */
  readonly confidence: number;

  /** The source IDs that contributed to this result. */
  readonly contributingSources: readonly string[];
}

// ---------------------------------------------------------------------------
// ResultSynthesizer Interface
// ---------------------------------------------------------------------------

/**
 * Core result synthesis abstraction for the L4 agent layer.
 *
 * Combines outputs from multiple sources into a single coherent result
 * using the configured strategy.
 */
export interface ResultSynthesizer<T = unknown> {
  /**
   * Synthesize multiple inputs into a single output using the
   * configured strategy.
   *
   * @param inputs - The inputs to synthesize. Must contain at least one entry.
   * @param strategy - The synthesis strategy to apply.
   * @returns The synthesized output.
   */
  synthesize(
    inputs: readonly SynthesisInput<T>[],
    strategy: SynthesisStrategy,
  ): Promise<SynthesisOutput<T>>;

  /**
   * Convenience method that synthesizes inputs using the `merge` strategy.
   *
   * @param inputs - The inputs to combine.
   * @returns The merged output.
   */
  combine(inputs: readonly SynthesisInput<T>[]): Promise<SynthesisOutput<T>>;
}
