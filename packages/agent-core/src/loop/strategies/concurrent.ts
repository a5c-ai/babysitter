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
  context?: AgentLoopPromptContext<TInput>,
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
    | { readonly status: "timed-out"; readonly agentId: string; readonly timeoutMs: number; readonly reason: Error }
    | { readonly status: "cancelled"; readonly agentId: string; readonly reason: Error }
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
    context?: AgentLoopPromptContext<TInput>,
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
          allResults.push(s.value);
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

  private async runAgent(
    input: TInput,
    agentId: string,
    context?: AgentLoopPromptContext<TInput>,
  ): Promise<ConcurrentIterationOutput<TOutput>["results"][number]> {
    if (context?.signal?.aborted) {
      return {
        status: "cancelled",
        agentId,
        reason: createAbortError(`Agent ${agentId} cancelled`),
      };
    }

    const prompt = this.promptFn(input, agentId, context).then((output) => ({
      status: "fulfilled" as const,
      agentId,
      output,
    }));

    if (this.perAgentTimeoutMs === undefined) {
      return prompt;
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const timeoutMs = this.perAgentTimeoutMs!;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        context?.signal?.removeEventListener("abort", onAbort);
        resolve({
          status: "timed-out",
          agentId,
          timeoutMs,
          reason: new Error(`Agent ${agentId} timed out after ${timeoutMs}ms`),
        });
      }, timeoutMs);

      const onAbort = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          status: "cancelled",
          agentId,
          reason: createAbortError(`Agent ${agentId} cancelled`),
        });
      };

      context?.signal?.addEventListener("abort", onAbort, { once: true });

      prompt
        .then((value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          context?.signal?.removeEventListener("abort", onAbort);
          resolve(value);
        })
        .catch((err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          context?.signal?.removeEventListener("abort", onAbort);
          reject(err);
        });
    });
  }
}

function createAbortError(message: string): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}
