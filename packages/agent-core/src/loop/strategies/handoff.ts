/**
 * Handoff loop runner — the active agent explicitly transfers control.
 *
 * Starts with `entryAgentId`.  After each iteration the runner inspects
 * `result.handoffTarget`: if set, the next iteration uses that agent;
 * if not, the loop signals termination.
 *
 * `maxHandoffs` puts an upper bound on the total number of agent
 * switches to prevent infinite delegation chains.
 */

import type {
  AgentLoopIterationResult,
  AgentLoopPromptContext,
  HandoffContextTransfer,
  HandoffStrategy,
} from "../types";

export type PromptFn<TInput, TOutput> = (
  input: TInput,
  agentId: string,
  context?: AgentLoopPromptContext,
) => Promise<TOutput>;

/**
 * Callers that wish to signal a handoff should include a `handoffTarget`
 * property on their prompt output.  This interface describes the minimal
 * shape we inspect.
 */
export interface HandoffCapableOutput {
  handoffTarget?: string;
}

export interface HandoffLoopRunnerConfig {
  readonly strategy: HandoffStrategy;
  readonly agentIds: string[];
}

export class HandoffLoopRunner<TInput, TOutput> {
  private readonly entryAgentId: string;
  private readonly agentIds: ReadonlySet<string>;
  private readonly maxHandoffs: number;
  private readonly prepareHandoffInput:
    | ((context: HandoffContextTransfer<TInput, TOutput>) => TInput)
    | undefined;
  private readonly promptFn: PromptFn<TInput, TOutput>;

  private currentAgentId: string;
  private nextInput: TInput | undefined;
  private handoffCount = 0;
  private _terminated = false;

  constructor(
    config: HandoffLoopRunnerConfig,
    promptFn: PromptFn<TInput, TOutput>,
  ) {
    this.entryAgentId = config.strategy.entryAgentId;
    this.agentIds = new Set(config.agentIds);
    if (!this.agentIds.has(this.entryAgentId)) {
      throw new Error(`Unknown handoff entry agent: ${this.entryAgentId}`);
    }
    this.maxHandoffs = config.strategy.maxHandoffs ?? Infinity;
    this.prepareHandoffInput = config.strategy.prepareHandoffInput as
      | ((context: HandoffContextTransfer<TInput, TOutput>) => TInput)
      | undefined;
    this.promptFn = promptFn;
    this.currentAgentId = this.entryAgentId;
  }

  /** Whether the runner has signalled termination. */
  get terminated(): boolean {
    return this._terminated;
  }

  async run(
    input: TInput,
    iterationIndex: number,
    context?: AgentLoopPromptContext,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    if (this._terminated) {
      throw new Error("HandoffLoopRunner: loop has already terminated");
    }

    const agentId = this.currentAgentId;
    const currentInput = this.nextInput ?? input;
    const start = Date.now();
    const output = await this.promptFn(currentInput, agentId, context);
    const durationMs = Date.now() - start;

    // Determine if a handoff was requested
    const handoffTarget = this.extractHandoffTarget(output);

    if (handoffTarget) {
      this.assertKnownTarget(handoffTarget);
      if (this.handoffCount >= this.maxHandoffs) {
        // Max handoffs reached — terminate after this iteration
        this._terminated = true;
      } else {
        this.nextInput = this.buildNextInput(
          currentInput,
          output,
          agentId,
          handoffTarget,
        );
        this.currentAgentId = handoffTarget;
        this.handoffCount++;
      }
    } else {
      // No handoff requested — signal termination
      this._terminated = true;
    }

    return {
      index: iterationIndex,
      agentId,
      output,
      durationMs,
      handoffTarget,
    };
  }

  reset(): void {
    this.currentAgentId = this.entryAgentId;
    this.nextInput = undefined;
    this.handoffCount = 0;
    this._terminated = false;
  }

  /**
   * Extract a handoff target from the prompt output.
   *
   * Checks for an explicit `handoffTarget` property first, then
   * returns undefined (no handoff).
   */
  private extractHandoffTarget(output: TOutput): string | undefined {
    if (
      output !== null &&
      typeof output === "object" &&
      "handoffTarget" in output
    ) {
      const target = (output as HandoffCapableOutput).handoffTarget;
      return typeof target === "string" ? target : undefined;
    }
    return undefined;
  }

  private assertKnownTarget(target: string): void {
    if (!this.agentIds.has(target)) {
      throw new Error(`Unknown handoff target: ${target}`);
    }
  }

  private buildNextInput(
    previousInput: TInput,
    output: TOutput,
    fromAgentId: string,
    toAgentId: string,
  ): TInput {
    if (!this.prepareHandoffInput) {
      return previousInput;
    }

    return this.prepareHandoffInput({
      previousInput,
      output,
      fromAgentId,
      toAgentId,
    });
  }
}
