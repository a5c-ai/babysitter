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
  HandoffPromptContext,
  HandoffStrategy,
} from "../types";

export type PromptFn<TInput, TOutput> = (
  input: TInput,
  agentId: string,
  context?: AgentLoopPromptContext<TInput>,
) => Promise<TOutput>;

/**
 * Callers that wish to signal a handoff should include a `handoffTarget`
 * property on their prompt output.  This interface describes the minimal
 * shape we inspect.
 */
export interface HandoffCapableOutput {
  handoffTarget?: string;
  handoffContext?: unknown;
  context?: unknown;
  summary?: unknown;
  reason?: unknown;
}

export interface HandoffLoopRunnerConfig {
  readonly strategy: HandoffStrategy;
  readonly agentIds: string[];
}

export class HandoffLoopRunner<TInput, TOutput> {
  private readonly entryAgentId: string;
  private readonly agentIds: ReadonlySet<string>;
  private readonly maxHandoffs: number;
  private readonly contextFormatter: HandoffStrategy["contextFormatter"];
  private readonly promptFn: PromptFn<TInput, TOutput>;

  private currentAgentId: string;
  private currentInput: TInput | undefined;
  private pendingHandoffContext: HandoffPromptContext | undefined;
  private handoffCount = 0;
  private _terminated = false;

  constructor(
    config: HandoffLoopRunnerConfig,
    promptFn: PromptFn<TInput, TOutput>,
  ) {
    this.entryAgentId = config.strategy.entryAgentId;
    this.agentIds = new Set(config.agentIds);
    this.maxHandoffs = config.strategy.maxHandoffs ?? Infinity;
    this.contextFormatter = config.strategy.contextFormatter;
    this.promptFn = promptFn;
    if (!this.agentIds.has(this.entryAgentId)) {
      throw new Error(
        `HandoffLoopRunner: entryAgentId '${this.entryAgentId}' is not in configured agents: ` +
        `${config.agentIds.join(", ")}`,
      );
    }
    this.currentAgentId = this.entryAgentId;
  }

  /** Whether the runner has signalled termination. */
  get terminated(): boolean {
    return this._terminated;
  }

  async run(
    input: TInput,
    iterationIndex: number,
    context?: AgentLoopPromptContext<TInput>,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    if (this._terminated) {
      throw new Error("HandoffLoopRunner: loop has already terminated");
    }

    const agentId = this.currentAgentId;
    const promptInput = this.currentInput ?? input;
    const promptContext: AgentLoopPromptContext<TInput> = {
      ...(context ?? {
        iterationIndex,
        strategy: "handoff" as const,
        input: promptInput,
      }),
      input: promptInput,
      handoff: this.pendingHandoffContext,
    };
    const start = Date.now();
    const output = await this.promptFn(promptInput, agentId, promptContext);
    const durationMs = Date.now() - start;

    // Determine if a handoff was requested
    const handoffTarget = this.extractHandoffTarget(output);

    if (handoffTarget) {
      if (!this.agentIds.has(handoffTarget)) {
        throw new Error(
          `HandoffLoopRunner: handoff target '${handoffTarget}' is not in configured agents: ` +
          `${Array.from(this.agentIds).join(", ")}`,
        );
      }

      const nextHandoffCount = this.handoffCount + 1;
      const handoffContext: HandoffPromptContext = {
        previousAgentId: agentId,
        handoffTarget,
        handoffCount: nextHandoffCount,
        previousOutput: output,
        handoffContext: this.extractHandoffContext(output),
      };

      if (this.handoffCount >= this.maxHandoffs) {
        // Max handoffs reached — terminate after this iteration
        this._terminated = true;
      } else {
        this.currentAgentId = handoffTarget;
        this.handoffCount = nextHandoffCount;
        this.pendingHandoffContext = handoffContext;
        this.currentInput = this.formatNextInput(
          promptInput,
          output,
          handoffContext,
        );
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
    this.currentInput = undefined;
    this.pendingHandoffContext = undefined;
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

  private extractHandoffContext(output: TOutput): unknown {
    if (output === null || typeof output !== "object") {
      return undefined;
    }

    const capable = output as HandoffCapableOutput;
    return (
      capable.handoffContext ??
      capable.context ??
      capable.summary ??
      capable.reason
    );
  }

  private formatNextInput(
    input: TInput,
    output: TOutput,
    context: HandoffPromptContext,
  ): TInput {
    if (!this.contextFormatter) {
      return input;
    }

    return this.contextFormatter(input, output, context) as TInput;
  }
}
