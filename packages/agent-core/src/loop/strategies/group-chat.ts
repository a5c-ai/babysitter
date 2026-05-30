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
  context?: AgentLoopPromptContext<TInput>,
) => Promise<TOutput>;

export interface GroupChatLoopRunnerConfig {
  readonly strategy: GroupChatStrategy;
  readonly agentIds: string[];
}

export class GroupChatLoopRunner<TInput, TOutput> {
  private readonly agentIds: readonly string[];
  private readonly maxRounds: number;
  private readonly moderatorAgentId: string | undefined;
  private readonly invalidSelectionBehavior: "throw" | "fallback";
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
    this.invalidSelectionBehavior =
      config.strategy.invalidSelectionBehavior ?? "throw";
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
    context?: AgentLoopPromptContext<TInput>,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    if (this.isExhausted) {
      throw new Error(
        `GroupChatLoopRunner: maxRounds (${this.maxRounds}) reached`,
      );
    }

    let currentSpeaker: string;

    if (this.moderatorAgentId) {
      // Ask the moderator to select the next speaker.
      // The moderator's output is expected to be a string containing the agent id.
      const moderatorOutput = await this.promptFn(
        input,
        this.moderatorAgentId,
        context,
      );
      const selectedAgent = this.resolveModeratorSelection(moderatorOutput);
      currentSpeaker = selectedAgent ?? this.agentIds[this.speakerIndex]!;
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
   * Extract a selected agent from the moderator output.
   * Structured output is preferred; string output must exactly equal one agent id.
   */
  private resolveModeratorSelection(output: TOutput): string | undefined {
    const selected = this.extractStructuredSelection(output);
    if (selected !== undefined) {
      return this.validateSelection(selected, "structured");
    }

    if (typeof output === "string") {
      const text = output.trim();
      if (this.agentIds.includes(text)) {
        return text;
      }

      const mentioned = this.agentIds.filter((id) => output.includes(id));
      if (mentioned.length > 0) {
        return this.handleInvalidSelection(
          `GroupChatLoopRunner: ambiguous moderator selection '${output}'. ` +
          `Return exactly one agent id or structured { nextSpeakerId }.`,
        );
      }
    }

    return this.handleInvalidSelection(
      `GroupChatLoopRunner: moderator did not select a valid speaker`,
    );
  }

  private extractStructuredSelection(output: TOutput): string | undefined {
    if (output === null || typeof output !== "object") {
      return undefined;
    }

    const candidate = output as {
      nextSpeakerId?: unknown;
      agentId?: unknown;
      speakerId?: unknown;
    };
    const selected =
      candidate.nextSpeakerId ?? candidate.agentId ?? candidate.speakerId;
    return typeof selected === "string" ? selected : undefined;
  }

  private validateSelection(
    selected: string,
    source: "structured" | "string",
  ): string | undefined {
    if (this.agentIds.includes(selected)) {
      return selected;
    }

    return this.handleInvalidSelection(
      `GroupChatLoopRunner: ${source} moderator selection '${selected}' ` +
      `is not in configured agents: ${this.agentIds.join(", ")}`,
    );
  }

  private handleInvalidSelection(message: string): undefined {
    if (this.invalidSelectionBehavior === "fallback") {
      return undefined;
    }
    throw new Error(message);
  }
}
