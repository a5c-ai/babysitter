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
    | { readonly status: "fulfilled"; readonly agentId: string; readonly output: TOutput }
    | { readonly status: "rejected"; readonly agentId: string; readonly reason: unknown }
    | { readonly status: "timed-out"; readonly agentId: string; readonly timeoutMs: number }
  >;
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
      const settled = await Promise.allSettled(
        batch.map((agentId) => this.runAgent(input, agentId, context)),
      );

      for (let j = 0; j < settled.length; j++) {
        const s = settled[j]!;
        const agentId = batch[j]!;
        if (s.status === "fulfilled") {
          allResults.push({ status: "fulfilled", agentId, output: s.value });
        } else if (s.reason instanceof AgentTimeoutError) {
          allResults.push({
            status: "timed-out",
            agentId,
            timeoutMs: s.reason.timeoutMs,
          });
        } else {
          allResults.push({ status: "rejected", agentId, reason: s.reason });
        }
      }
    }

    const durationMs = Date.now() - start;

    return {
      index: iterationIndex,
      agentId: this.agentIds[0] ?? "concurrent",
      output: { results: allResults },
      durationMs,
    };
  }

  private runAgent(
    input: TInput,
    agentId: string,
    context?: AgentLoopPromptContext,
  ): Promise<TOutput> {
    const promise = this.promptFn(input, agentId, context);
    if (this.perAgentTimeoutMs === undefined) {
      return promise;
    }

    return new Promise<TOutput>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new AgentTimeoutError(agentId, this.perAgentTimeoutMs!));
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
}

class AgentTimeoutError extends Error {
  constructor(
    readonly agentId: string,
    readonly timeoutMs: number,
  ) {
    super(`Agent ${agentId} timed out after ${timeoutMs}ms`);
    this.name = "AgentTimeoutError";
  }
}
