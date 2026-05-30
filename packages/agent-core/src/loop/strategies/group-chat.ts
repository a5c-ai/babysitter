/**
 * Group-chat loop runner — agents take turns in round-robin order.
 *
 * Each call to `run()` advances to the next speaker in the queue.
 * When every agent has spoken once, a round is complete.  The runner
 * tracks the round count so the outer loop can enforce `maxRounds`.
 *
 * An optional moderator agent can override round-robin order by
 * returning a next-speaker selection as part of its output.
 */

import type {
  AgentLoopIterationResult,
  AgentLoopPromptContext,
  GroupChatStrategy,
} from "../types";

export type PromptFn<TInput, TOutput> = (
  input: TInput,
  agentId: string,
  context?: AgentLoopPromptContext,
) => Promise<TOutput>;

export interface GroupChatLoopRunnerConfig {
  readonly strategy: GroupChatStrategy;
  readonly agentIds: string[];
}

export class GroupChatLoopRunner<TInput, TOutput> {
  private readonly agentIds: readonly string[];
  private readonly maxRounds: number;
  private readonly moderatorAgentId: string | undefined;
  private readonly promptFn: PromptFn<TInput, TOutput>;

  /** Index into agentIds for the next speaker (round-robin). */
  private speakerIndex = 0;

  /** How many complete rounds have been executed. */
  private completedRounds = 0;

  /** How many agents have spoken in the current round. */
  private turnsInCurrentRound = 0;

  constructor(
    config: GroupChatLoopRunnerConfig,
    promptFn: PromptFn<TInput, TOutput>,
  ) {
    this.agentIds = config.agentIds;
    this.maxRounds = config.strategy.maxRounds ?? Infinity;
    this.moderatorAgentId = config.strategy.moderatorAgentId;
    this.promptFn = promptFn;
  }

  /** Whether the maximum rounds have been reached. */
  get isExhausted(): boolean {
    return this.completedRounds >= this.maxRounds;
  }

  /** Current completed round count. */
  get rounds(): number {
    return this.completedRounds;
  }

  async run(
    input: TInput,
    iterationIndex: number,
    context?: AgentLoopPromptContext,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    if (this.isExhausted) {
      throw new Error(
        `GroupChatLoopRunner: maxRounds (${this.maxRounds}) reached`,
      );
    }

    let currentSpeaker: string;

    if (this.moderatorAgentId) {
      const moderatorOutput = await this.promptFn(
        input,
        this.moderatorAgentId,
        context,
      );
      currentSpeaker = this.resolveModeratorSelection(moderatorOutput);
    } else {
      currentSpeaker = this.agentIds[this.speakerIndex]!;
    }

    const start = Date.now();
    const output = await this.promptFn(input, currentSpeaker, context);
    const durationMs = Date.now() - start;

    // Advance round-robin pointer
    this.speakerIndex = (this.speakerIndex + 1) % this.agentIds.length;
    this.turnsInCurrentRound++;

    if (this.turnsInCurrentRound >= this.agentIds.length) {
      this.completedRounds++;
      this.turnsInCurrentRound = 0;
    }

    return {
      index: iterationIndex,
      agentId: currentSpeaker,
      output,
      durationMs,
    };
  }

  reset(): void {
    this.speakerIndex = 0;
    this.completedRounds = 0;
    this.turnsInCurrentRound = 0;
  }

  /**
   * Resolve a selected agent from structured output or an exact string id.
   * Invalid and ambiguous selections are rejected instead of silently falling
   * back to round-robin.
   */
  private resolveModeratorSelection(output: TOutput): string {
    if (
      output !== null &&
      typeof output === "object" &&
      "nextSpeakerId" in output
    ) {
      const selected = (output as { nextSpeakerId?: unknown }).nextSpeakerId;
      if (typeof selected !== "string" || !this.agentIds.includes(selected)) {
        throw new Error(
          `Invalid moderator selection: ${String(selected)} is not a configured agent`,
        );
      }
      return selected;
    }

    if (typeof output !== "string") {
      throw new Error("Invalid moderator selection: expected nextSpeakerId");
    }

    const exact = output.trim();
    if (this.agentIds.includes(exact)) {
      return exact;
    }

    const matches = this.agentIds.filter((id) => output.includes(id));
    if (matches.length > 1) {
      throw new Error(
        `Ambiguous moderator selection: matched ${matches.join(", ")}`,
      );
    }
    throw new Error(
      `Invalid moderator selection: ${output} is not a configured agent`,
    );
  }
}
