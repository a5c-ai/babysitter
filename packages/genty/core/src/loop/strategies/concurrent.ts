/**
 * Concurrent loop runner — runs promptFn for each agent in parallel.
 *
 * Uses Promise.allSettled so a single agent failure does not abort
 * the whole iteration.  Respects maxParallelism by batching agents
 * into groups that run sequentially.
 */

import type {
  AgentLoopIterationResult,
  AgentLoopPromptContext,
  ConcurrentStrategy,
} from "../types";

export type PromptFn<TInput, TOutput> = (
  input: TInput,
  agentId: string,
  context?: AgentLoopPromptContext,
) => Promise<TOutput>;

export interface ConcurrentLoopRunnerConfig {
  readonly strategy: ConcurrentStrategy;
  readonly agentIds: string[];
}

/** Result wrapper that includes per-agent settled status. */
export interface ConcurrentIterationOutput<TOutput> {
  readonly results: ReadonlyArray<
    | {
        readonly status: "fulfilled";
        readonly agentId: string;
        readonly output: TOutput;
        readonly durationMs: number;
      }
    | {
        readonly status: "rejected";
        readonly agentId: string;
        readonly reason: unknown;
        readonly durationMs: number;
        readonly timedOut?: boolean;
      }
  >;
  readonly partial: boolean;
}

export class ConcurrentLoopRunner<TInput, TOutput> {
  private readonly agentIds: readonly string[];
  private readonly maxParallelism: number;
  private readonly perAgentTimeoutMs: number | undefined;
  private readonly promptFn: PromptFn<TInput, TOutput>;

  constructor(
    config: ConcurrentLoopRunnerConfig,
    promptFn: PromptFn<TInput, TOutput>,
  ) {
    this.agentIds = config.agentIds;
    this.maxParallelism = config.strategy.maxParallelism ?? config.agentIds.length;
    this.perAgentTimeoutMs = config.strategy.perAgentTimeoutMs;
    this.promptFn = promptFn;
  }

  async run(
    input: TInput,
    iterationIndex: number,
    context?: AgentLoopPromptContext,
  ): Promise<AgentLoopIterationResult<ConcurrentIterationOutput<TOutput>>> {
    const start = Date.now();

    const allResults: ConcurrentIterationOutput<TOutput>["results"][number][] = [];

    // Process agents in batches of maxParallelism
    for (let i = 0; i < this.agentIds.length; i += this.maxParallelism) {
      const batch = this.agentIds.slice(i, i + this.maxParallelism);
      const settled = await Promise.all(
        batch.map((agentId) => this.runAgent(input, agentId, context)),
      );

      allResults.push(...settled);
    }

    const durationMs = Date.now() - start;

    return {
      index: iterationIndex,
      agentId: this.agentIds[0] ?? "concurrent",
      output: {
        results: allResults,
        partial: allResults.some((result) => result.status === "rejected"),
      },
      durationMs,
    };
  }

  private async runAgent(
    input: TInput,
    agentId: string,
    context?: AgentLoopPromptContext,
  ): Promise<ConcurrentIterationOutput<TOutput>["results"][number]> {
    const start = Date.now();
    try {
      const output = await this.withOptionalTimeout(
        this.promptFn(input, agentId, context),
        agentId,
      );
      return {
        status: "fulfilled",
        agentId,
        output,
        durationMs: Date.now() - start,
      };
    } catch (reason) {
      return {
        status: "rejected",
        agentId,
        reason,
        durationMs: Date.now() - start,
        ...(this.isTimeoutError(reason) ? { timedOut: true } : {}),
      };
    }
  }

  private async withOptionalTimeout(
    promise: Promise<TOutput>,
    agentId: string,
  ): Promise<TOutput> {
    if (this.perAgentTimeoutMs === undefined) {
      return promise;
    }

    return new Promise<TOutput>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Agent ${agentId} timed out after ${this.perAgentTimeoutMs}ms`,
          ),
        );
      }, this.perAgentTimeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private isTimeoutError(reason: unknown): boolean {
    return reason instanceof Error && reason.message.includes("timed out");
  }
}
