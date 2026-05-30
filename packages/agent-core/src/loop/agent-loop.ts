/**
 * Main AgentLoop implementation for the L4 Agent-Core layer.
 *
 * Dispatches to strategy-specific runners based on the configured
 * strategy kind.  The loop itself is pure orchestration — it knows
 * nothing about LLMs, tools, or transports.  Callers inject their own
 * prompt execution logic via `PromptFn`.
 */

import type {
  AgentLoop,
  AgentLoopConfig,
  AgentLoopIterationResult,
  AgentLoopPromptContext,
  AgentLoopRunOptions,
  AgentLoopStrategy,
  AgentLoopState,
} from "./types";
import { SequentialLoopRunner } from "./strategies/sequential";
import { ConcurrentLoopRunner } from "./strategies/concurrent";
import type { ConcurrentIterationOutput } from "./strategies/concurrent";
import { GroupChatLoopRunner } from "./strategies/group-chat";
import { HandoffLoopRunner } from "./strategies/handoff";

// ---------------------------------------------------------------------------
// PromptFn type
// ---------------------------------------------------------------------------

/**
 * The prompt function abstraction.  Callers provide this to bridge
 * the loop to whatever execution backend they use (LLM, tool pipeline,
 * local function, etc.).
 */
export type PromptFn<TInput, TOutput> = (
  input: TInput,
  agentId: string,
  context?: AgentLoopPromptContext,
) => Promise<TOutput>;

// ---------------------------------------------------------------------------
// Iteration callback type
// ---------------------------------------------------------------------------

type IterationCallback<TOutput> = (
  result: AgentLoopIterationResult<TOutput>,
) => void;

// ---------------------------------------------------------------------------
// AgentLoopImpl
// ---------------------------------------------------------------------------

const DEFAULT_AGENT_ID = "default";

export class AgentLoopImpl<TInput = string, TOutput = unknown>
  implements AgentLoop<TInput, TOutput>
{
  private readonly config: AgentLoopConfig<TOutput>;
  private readonly promptFn: PromptFn<TInput, TOutput>;
  private readonly agentIds: readonly string[];

  private state: AgentLoopState = "idle";
  private iterationCount = 0;
  private readonly callbacks = new Set<IterationCallback<TOutput>>();

  // Strategy-specific runners (lazily created on first use)
  private sequentialRunner?: SequentialLoopRunner<TInput, TOutput>;
  private concurrentRunner?: ConcurrentLoopRunner<TInput, TOutput>;
  private groupChatRunner?: GroupChatLoopRunner<TInput, TOutput>;
  private handoffRunner?: HandoffLoopRunner<TInput, TOutput>;

  constructor(
    config: AgentLoopConfig<TOutput>,
    promptFn: PromptFn<TInput, TOutput>,
    agentIds?: string[],
  ) {
    this.config = config;
    this.promptFn = promptFn;
    this.agentIds =
      agentIds && agentIds.length > 0 ? agentIds : [DEFAULT_AGENT_ID];
  }

  // -----------------------------------------------------------------------
  // AgentLoop interface
  // -----------------------------------------------------------------------

  async iterate(
    input: TInput,
    options?: AgentLoopRunOptions,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    this.state = "running";

    try {
      this.throwIfAborted(options?.signal);
      const result = await this.withAbort(
        this.runIteration(input, options),
        options?.signal,
      );
      this.iterationCount++;
      this.notifyCallbacks(result);
      return result;
    } catch (err) {
      if (isAbortError(err)) {
        this.state = "cancelled";
        throw err;
      }
      this.state = "errored";
      throw err;
    }
  }

  async *run(
    input: TInput,
    options?: AgentLoopRunOptions,
  ): AsyncIterable<AgentLoopIterationResult<TOutput>> {
    this.state = "running";
    this.iterationCount = 0;

    try {
      while (true) {
        if (options?.signal?.aborted) {
          this.state = "cancelled";
          break;
        }

        // Check max iterations
        if (
          this.config.maxIterations !== undefined &&
          this.iterationCount >= this.config.maxIterations
        ) {
          break;
        }

        // Check strategy-specific exhaustion
        if (this.isStrategyExhausted()) {
          break;
        }

        const result = await this.withAbort(
          this.runIteration(input, options),
          options?.signal,
        );
        this.iterationCount++;
        this.notifyCallbacks(result);

        yield result;

        if (options?.signal?.aborted) {
          this.state = "cancelled";
          break;
        }

        // Check shouldTerminate predicate
        if (this.config.shouldTerminate) {
          const terminate = await this.config.shouldTerminate(
            result,
            this.iterationCount,
          );
          if (terminate) {
            break;
          }
        }

        // Check strategy-specific termination after yielding
        if (this.isStrategyExhausted()) {
          break;
        }
      }

      if (this.state !== "cancelled") {
        this.state = "completed";
      }
    } catch (err) {
      if (isAbortError(err)) {
        this.state = "cancelled";
        return;
      }
      this.state = "errored";
      throw err;
    }
  }

  getState(): AgentLoopState {
    return this.state;
  }

  reset(): void {
    this.state = "idle";
    this.iterationCount = 0;
    this.sequentialRunner = undefined;
    this.concurrentRunner = undefined;
    this.groupChatRunner?.reset();
    this.groupChatRunner = undefined;
    this.handoffRunner?.reset();
    this.handoffRunner = undefined;
  }

  onIterationComplete(
    callback: (result: AgentLoopIterationResult<TOutput>) => void,
  ): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // -----------------------------------------------------------------------
  // Internal dispatch
  // -----------------------------------------------------------------------

  private async runIteration(
    input: TInput,
    options?: AgentLoopRunOptions,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    const iterationIndex = this.iterationCount;

    // Apply per-iteration timeout if configured
    if (this.config.iterationTimeoutMs !== undefined) {
      return this.withTimeout(
        this.dispatchToStrategy(input, iterationIndex, options),
        this.config.iterationTimeoutMs,
      );
    }

    return this.dispatchToStrategy(input, iterationIndex, options);
  }

  private async dispatchToStrategy(
    input: TInput,
    iterationIndex: number,
    options?: AgentLoopRunOptions,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    return this.dispatchSpecificStrategy(
      this.config.strategy,
      input,
      iterationIndex,
      options,
    );
  }

  private async dispatchSpecificStrategy(
    strategy: AgentLoopStrategy,
    input: TInput,
    iterationIndex: number,
    options?: AgentLoopRunOptions,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    const promptContext = { signal: options?.signal };

    switch (strategy.kind) {
      case "sequential": {
        const runner = this.getSequentialRunner(strategy);
        return runner.run(input, iterationIndex, promptContext);
      }

      case "concurrent": {
        const runner = this.getConcurrentRunner(strategy);
        const result = await runner.run(input, iterationIndex, promptContext);

        // Runtime shape check: the concurrent runner wraps TOutput inside
        // ConcurrentIterationOutput<TOutput>.  Validate the envelope before
        // re-typing so callers get a clear error instead of silent corruption.
        if (
          typeof result !== "object" ||
          result === null ||
          typeof result.index !== "number" ||
          typeof result.agentId !== "string" ||
          typeof result.durationMs !== "number" ||
          typeof result.output !== "object" ||
          result.output === null ||
          !Array.isArray((result.output as ConcurrentIterationOutput<TOutput>).results)
        ) {
          throw new Error(
            `ConcurrentLoopRunner returned an unexpected shape at iteration ${iterationIndex}. ` +
            `Expected AgentLoopIterationResult<ConcurrentIterationOutput<TOutput>> with ` +
            `{index, agentId, durationMs, output: {results: [...]}}. ` +
            `Got keys: ${result ? Object.keys(result).join(", ") : "null"}`,
          );
        }

        // The output is ConcurrentIterationOutput<TOutput>, not bare TOutput.
        // Callers using the concurrent strategy are expected to handle this
        // wrapped shape.  We narrow through a validated structural cast rather
        // than a blind double-cast.
        return result as AgentLoopIterationResult<ConcurrentIterationOutput<TOutput>> as AgentLoopIterationResult<TOutput>;
      }

      case "group-chat": {
        const runner = this.getGroupChatRunner(strategy);
        return runner.run(input, iterationIndex, promptContext);
      }

      case "handoff": {
        const runner = this.getHandoffRunner(strategy);
        return runner.run(input, iterationIndex, promptContext);
      }

      case "composite": {
        const errors: unknown[] = [];
        for (const nested of strategy.strategies) {
          try {
            return await this.dispatchSpecificStrategy(
              nested,
              input,
              iterationIndex,
              options,
            );
          } catch (err) {
            errors.push(err);
          }
        }
        throw new AggregateError(
          errors,
          "Composite strategy fallback exhausted all strategies",
        );
      }

      default: {
        const _exhaustive: never = strategy;
        throw new Error(
          `Unknown strategy kind: ${(_exhaustive as { kind: string }).kind}`,
        );
      }
    }
  }

  private isStrategyExhausted(): boolean {
    const { strategy } = this.config;

    if (strategy.kind === "group-chat" && this.groupChatRunner) {
      return this.groupChatRunner.isExhausted;
    }

    if (strategy.kind === "handoff" && this.handoffRunner) {
      return this.handoffRunner.terminated;
    }

    return false;
  }

  // -----------------------------------------------------------------------
  // Runner factories (lazy)
  // -----------------------------------------------------------------------

  private getSequentialRunner(
    strategy = { kind: "sequential" as const },
  ): SequentialLoopRunner<TInput, TOutput> {
    if (!this.sequentialRunner) {
      this.sequentialRunner = new SequentialLoopRunner(
        { strategy, agentId: this.agentIds[0]! },
        this.promptFn,
      );
    }
    return this.sequentialRunner;
  }

  private getConcurrentRunner(
    strategy = this.config.strategy,
  ): ConcurrentLoopRunner<TInput, TOutput> {
    if (!this.concurrentRunner) {
      if (strategy.kind !== "concurrent") {
        throw new Error("Strategy mismatch");
      }
      this.concurrentRunner = new ConcurrentLoopRunner(
        { strategy, agentIds: [...this.agentIds] },
        this.promptFn,
      );
    }
    return this.concurrentRunner;
  }

  private getGroupChatRunner(
    strategy = this.config.strategy,
  ): GroupChatLoopRunner<TInput, TOutput> {
    if (!this.groupChatRunner) {
      if (strategy.kind !== "group-chat") {
        throw new Error("Strategy mismatch");
      }
      this.groupChatRunner = new GroupChatLoopRunner(
        { strategy, agentIds: [...this.agentIds] },
        this.promptFn,
      );
    }
    return this.groupChatRunner;
  }

  private getHandoffRunner(
    strategy = this.config.strategy,
  ): HandoffLoopRunner<TInput, TOutput> {
    if (!this.handoffRunner) {
      if (strategy.kind !== "handoff") {
        throw new Error("Strategy mismatch");
      }
      this.handoffRunner = new HandoffLoopRunner(
        { strategy, agentIds: [...this.agentIds] },
        this.promptFn,
      );
    }
    return this.handoffRunner;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private notifyCallbacks(result: AgentLoopIterationResult<TOutput>): void {
    for (const cb of this.callbacks) {
      cb(result);
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Iteration timed out after ${timeoutMs}ms`));
      }, timeoutMs);

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

  private async withAbort<T>(
    promise: Promise<T>,
    signal: AbortSignal | undefined,
  ): Promise<T> {
    if (!signal) return promise;
    this.throwIfAborted(signal);

    return new Promise<T>((resolve, reject) => {
      const abort = () => reject(newAbortError());
      signal.addEventListener("abort", abort, { once: true });

      promise
        .then(resolve, reject)
        .finally(() => signal.removeEventListener("abort", abort));
    });
  }

  private throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) {
      throw newAbortError();
    }
  }
}

function newAbortError(): Error {
  const err = new Error("Agent loop cancelled");
  err.name = "AbortError";
  return err;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an AgentLoop with the given configuration.
 *
 * @param config   - Loop strategy & termination settings.
 * @param promptFn - The function that executes a single prompt turn.
 * @param agentIds - Agent identifiers (required for multi-agent strategies).
 */
export function createAgentLoop<TInput = string, TOutput = unknown>(
  config: AgentLoopConfig<TOutput>,
  promptFn: PromptFn<TInput, TOutput>,
  agentIds?: string[],
): AgentLoop<TInput, TOutput> {
  return new AgentLoopImpl<TInput, TOutput>(config, promptFn, agentIds);
}
