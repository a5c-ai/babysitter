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
      // Ask the moderator to select the next speaker.
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
   * Extract and validate a selected agent from moderator output.
   * Structured output is preferred: `{ nextAgentId: "agent-id" }`.
   * String output is accepted only when it maps to exactly one configured agent.
   */
  private resolveModeratorSelection(output: TOutput): string {
    const structured = this.extractStructuredSelection(output);
    if (structured !== undefined) {
      this.assertKnownAgent(structured);
      return structured;
    }

    const text = typeof output === "string" ? output.trim() : String(output);
    const exact = this.agentIds.filter((id) => text === id);
    if (exact.length === 1) {
      return exact[0]!;
    }

    const mentioned = this.agentIds.filter((id) => text.includes(id));
    if (mentioned.length === 1) {
      return mentioned[0]!;
    }
    if (mentioned.length > 1) {
      throw new Error(
        `Moderator selected multiple agents: ${mentioned.join(", ")}`,
      );
    }

    throw new Error(`Moderator selected unknown agent: ${text}`);
  }

  private extractStructuredSelection(output: TOutput): string | undefined {
    if (output !== null && typeof output === "object") {
      const record = output as { nextAgentId?: unknown; agentId?: unknown };
      const target = record.nextAgentId ?? record.agentId;
      return typeof target === "string" ? target : undefined;
    }

    if (typeof output === "string" && output.trim().startsWith("{")) {
      try {
        return this.extractStructuredSelection(JSON.parse(output));
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private assertKnownAgent(agentId: string): void {
    if (!this.agentIds.includes(agentId)) {
      throw new Error(`Moderator selected unknown agent: ${agentId}`);
    }
  }
}
