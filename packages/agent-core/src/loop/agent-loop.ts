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
  context?: AgentLoopPromptContext<TInput>,
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
      const result = await this.runIteration(input, options);
      this.iterationCount++;
      this.notifyCallbacks(result);
      if (options?.signal?.aborted) {
        this.state = "cancelled";
      }
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

        const result = await this.runIteration(input, options);
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
        throw err;
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
    const context = this.buildPromptContext(input, iterationIndex, options);

    // Apply per-iteration timeout if configured
    if (this.config.iterationTimeoutMs !== undefined) {
      return this.withTimeout(
        this.dispatchToStrategy(input, iterationIndex, context, options),
        this.config.iterationTimeoutMs,
      );
    }

    return this.dispatchToStrategy(input, iterationIndex, context, options);
  }

  private async dispatchToStrategy(
    input: TInput,
    iterationIndex: number,
    context: AgentLoopPromptContext<TInput>,
    options?: AgentLoopRunOptions,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    const { strategy } = this.config;

    switch (strategy.kind) {
      case "sequential": {
        const runner = this.getSequentialRunner();
        return runner.run(input, iterationIndex, context);
      }

      case "concurrent": {
        const runner = this.getConcurrentRunner();
        const result = await runner.run(input, iterationIndex, context);

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
        const runner = this.getGroupChatRunner();
        return runner.run(input, iterationIndex, context);
      }

      case "handoff": {
        const runner = this.getHandoffRunner();
        return runner.run(input, iterationIndex, context);
      }

      case "composite": {
        return this.runComposite(input, iterationIndex, context, options);
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

  private getSequentialRunner(): SequentialLoopRunner<TInput, TOutput> {
    if (!this.sequentialRunner) {
      this.sequentialRunner = new SequentialLoopRunner(
        { strategy: { kind: "sequential" as const }, agentId: this.agentIds[0]! },
        this.promptFn,
      );
    }
    return this.sequentialRunner;
  }

  private getConcurrentRunner(): ConcurrentLoopRunner<TInput, TOutput> {
    if (!this.concurrentRunner) {
      const strategy = this.config.strategy;
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

  private getGroupChatRunner(): GroupChatLoopRunner<TInput, TOutput> {
    if (!this.groupChatRunner) {
      const strategy = this.config.strategy;
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

  private getHandoffRunner(): HandoffLoopRunner<TInput, TOutput> {
    if (!this.handoffRunner) {
      const strategy = this.config.strategy;
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

  private buildPromptContext(
    input: TInput,
    iterationIndex: number,
    options?: AgentLoopRunOptions,
  ): AgentLoopPromptContext<TInput> {
    return {
      signal: options?.signal,
      iterationIndex,
      strategy: this.config.strategy.kind,
      input,
    };
  }

  private async runComposite(
    input: TInput,
    iterationIndex: number,
    _context: AgentLoopPromptContext<TInput>,
    options?: AgentLoopRunOptions,
  ): Promise<AgentLoopIterationResult<TOutput>> {
    const strategy = this.config.strategy;
    if (strategy.kind !== "composite") {
      throw new Error("Strategy mismatch");
    }

    const start = Date.now();
    let currentInput: unknown = input;
    const results: Array<{
      strategy: string;
      agentId: string;
      output: unknown;
      result: AgentLoopIterationResult<unknown>;
    }> = [];

    for (const childStrategy of strategy.strategies) {
      this.throwIfAborted(options?.signal);
      const childLoop = new AgentLoopImpl<unknown, unknown>(
        { strategy: childStrategy, maxIterations: 1 },
        this.promptFn as PromptFn<unknown, unknown>,
        [...this.agentIds],
      );
      const childResult = await childLoop.iterate(currentInput, options);
      results.push({
        strategy: childStrategy.kind,
        agentId: childResult.agentId,
        output: childResult.output,
        result: childResult,
      });
      currentInput = childResult.output;
    }

    return {
      index: iterationIndex,
      agentId: "composite",
      output: { results } as TOutput,
      durationMs: Date.now() - start,
    };
  }

  private throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw createAbortError("Agent loop cancelled");
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

function createAbortError(message: string): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || /cancelled/i.test(err.message))
  );
}
