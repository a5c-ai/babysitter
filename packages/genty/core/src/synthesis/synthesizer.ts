/**
 * ResultSynthesizerImpl — concrete implementation of the {@link ResultSynthesizer}
 * interface for L4 Agent-Core.
 *
 * Dispatches synthesis to the appropriate strategy based on the
 * {@link SynthesisStrategy.kind} discriminator.
 */

import type {
  ResultSynthesizer,
  SynthesisInput,
  SynthesisOutput,
  SynthesisStrategy,
} from "./types";
import { applyMergeSynthesis } from "./strategies/merge";
import { applyVoteSynthesis } from "./strategies/vote";
import { applyRankSynthesis, type RankSynthesisConfig } from "./strategies/rank";

/**
 * Options for constructing a {@link ResultSynthesizerImpl}.
 */
export interface ResultSynthesizerImplOptions<T> {
  /**
   * Custom scoring function for the `rank` strategy.
   * When provided, overrides the default confidence-based scoring.
   */
  readonly scoreFn?: (input: SynthesisInput<T>) => number;
}

export class ResultSynthesizerImpl<T = unknown> implements ResultSynthesizer<T> {
  private readonly rankConfig: RankSynthesisConfig<T> | undefined;

  constructor(options?: ResultSynthesizerImplOptions<T>) {
    if (options?.scoreFn) {
      this.rankConfig = { scoreFn: options.scoreFn };
    }
  }

  async synthesize(
    inputs: readonly SynthesisInput<T>[],
    strategy: SynthesisStrategy,
  ): Promise<SynthesisOutput<T>> {
    if (inputs.length === 0) {
      throw new Error("ResultSynthesizer requires at least one input");
    }

    switch (strategy.kind) {
      case "merge":
        return applyMergeSynthesis(inputs, strategy);
      case "vote":
        return applyVoteSynthesis(inputs, strategy);
      case "rank":
        return applyRankSynthesis(inputs, strategy, this.rankConfig);
    }
  }

  async combine(inputs: readonly SynthesisInput<T>[]): Promise<SynthesisOutput<T>> {
    return this.synthesize(inputs, { kind: "merge" });
  }
}
