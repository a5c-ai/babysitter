/**
 * Sequential loop runner — single agent, one turn at a time.
 *
 * The simplest strategy: forwards input to the prompt function for a
 * single agent and returns the result directly.
 */

import type {
  AgentLoopIterationResult,
  AgentLoopPromptContext,
  SequentialStrategy,
} from "../types";

export type PromptFn<TInput, TOutput> = (
  input: TInput,
  agentId: string,
  context?: AgentLoopPromptContext,
) => Promise<TOutput>;

export interface SequentialLoopRunnerConfig {
  readonly strategy: SequentialStrategy;
  readonly agentId: string;
}

export class SequentialLoopRunner<TInput, TOutput> {
  private readonly agentId: string;
  private readonly promptFn: PromptFn<TInput, TOutput>;

  constructor(
    config: SequentialLoopRunnerConfig,
    promptFn: PromptFn<TInput, TOutput>,
  ) {
    this.agentId = config.agentId;
    this.promptFn = promptFn;
  }

  async run(
    input: TInput,
    iterationIndex: number,
    context?: AgentLoopPromptContext,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    const start = Date.now();
    const output = await this.promptFn(input, this.agentId, context);
    const durationMs = Date.now() - start;

    return {
      index: iterationIndex,
      agentId: this.agentId,
      output,
      durationMs,
    };
  }
}
