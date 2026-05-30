/**
 * Agent loop interfaces for the L4 Agent-Core layer.
 *
 * Defines the pluggable loop strategies that control how an agent iterates
 * through prompt-response cycles: sequentially, concurrently, in a
 * group-chat round-robin, or via handoff between specialized agents.
 */

// ---------------------------------------------------------------------------
// Loop Strategies
// ---------------------------------------------------------------------------

/** Discriminator for the loop execution strategy. */
export type AgentLoopStrategyKind =
  | 'sequential'
  | 'concurrent'
  | 'group-chat'
  | 'handoff'
  | 'composed';

/** Sequential: one agent processes turns in order. */
export interface SequentialStrategy {
  readonly kind: 'sequential';
}

/**
 * Concurrent: multiple agents process the same input in parallel.
 * Results are collected and optionally synthesized.
 */
export interface ConcurrentStrategy {
  readonly kind: 'concurrent';
  /** Maximum number of agents that may run in parallel. */
  readonly maxParallelism?: number;
  /** Optional timeout for each individual agent prompt. */
  readonly perAgentTimeoutMs?: number;
}

/**
 * Group-chat: agents take turns in a round-robin or moderator-driven order.
 * A termination condition controls when the loop ends.
 */
export interface GroupChatStrategy {
  readonly kind: 'group-chat';
  /** Maximum rounds before the loop terminates. */
  readonly maxRounds?: number;
  /** Optional moderator agent that selects the next speaker. */
  readonly moderatorAgentId?: string;
}

/** Context passed to a handoff input transformer. */
export interface HandoffContextTransfer<TInput = unknown, TOutput = unknown> {
  readonly previousInput: TInput;
  readonly output: TOutput;
  readonly fromAgentId: string;
  readonly toAgentId: string;
}

/**
 * Handoff: the active agent explicitly transfers control to another agent.
 * The loop ends when no further handoff is requested or a terminal
 * condition is met.
 */
export interface HandoffStrategy {
  readonly kind: 'handoff';
  /** Agent ID that begins the chain. */
  readonly entryAgentId: string;
  /** Maximum handoffs before forced termination. */
  readonly maxHandoffs?: number;
  /** Optional transformer for the input sent to the next handoff target. */
  readonly prepareHandoffInput?: (
    context: HandoffContextTransfer,
  ) => unknown;
}

/** Composition: execute multiple strategies as one loop iteration. */
export interface ComposedStrategy {
  readonly kind: 'composed';
  readonly strategies: readonly AgentLoopStrategy[];
}

/** Union of all supported loop strategies. */
export type AgentLoopStrategy =
  | SequentialStrategy
  | ConcurrentStrategy
  | GroupChatStrategy
  | HandoffStrategy
  | ComposedStrategy;

// ---------------------------------------------------------------------------
// Loop State
// ---------------------------------------------------------------------------

/** Observable state of a running loop. */
export type AgentLoopState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'errored';

// ---------------------------------------------------------------------------
// Iteration Result
// ---------------------------------------------------------------------------

/** The outcome of a single loop iteration. */
export interface AgentLoopIterationResult<TOutput = unknown> {
  /** Zero-based iteration index. */
  readonly index: number;

  /** Agent that produced this result. */
  readonly agentId: string;

  /** The output payload (prompt result, tool result, etc.). */
  readonly output: TOutput;

  /** Wall-clock duration of the iteration in milliseconds. */
  readonly durationMs: number;

  /** Token usage for this iteration, if available. */
  readonly tokenUsage?: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };

  /**
   * When the strategy is `handoff`, the next agent to receive control.
   * `undefined` signals the loop should terminate.
   */
  readonly handoffTarget?: string;
}

// ---------------------------------------------------------------------------
// Loop Configuration
// ---------------------------------------------------------------------------

/** Configuration for an AgentLoop instance. */
export interface AgentLoopConfig<TOutput = unknown> {
  /** The strategy that governs iteration behavior. */
  readonly strategy: AgentLoopStrategy;

  /** Maximum total iterations before the loop force-terminates. */
  readonly maxIterations?: number;

  /** Per-iteration timeout in milliseconds. */
  readonly iterationTimeoutMs?: number;

  /**
   * Predicate evaluated after each iteration.
   * Return `true` to signal the loop should stop.
   */
  shouldTerminate?: (
    result: AgentLoopIterationResult<TOutput>,
    iterationCount: number,
  ) => boolean | Promise<boolean>;
}

/** Prompt execution context supplied by loop runners. */
export interface AgentLoopPromptContext {
  readonly signal?: AbortSignal;
}

/** Options accepted by loop execution methods. */
export interface AgentLoopRunOptions {
  readonly signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// AgentLoop Interface
// ---------------------------------------------------------------------------

/**
 * Core loop abstraction for the L4 agent layer.
 *
 * Implementations drive the prompt-response cycle according to the
 * configured strategy, emitting iteration results that callers can
 * observe or aggregate.
 */
export interface AgentLoop<TInput = string, TOutput = unknown> {
  /**
   * Run the next iteration of the loop.
   *
   * @param input - The input payload for this iteration (e.g. a user prompt).
   * @returns The result of the iteration.
   */
  iterate(
    input: TInput,
    options?: AgentLoopRunOptions,
  ): Promise<AgentLoopIterationResult<TOutput>>;

  /**
   * Run the loop to completion, yielding results as an async iterable.
   *
   * The loop terminates when the strategy signals completion, the
   * `shouldTerminate` predicate returns `true`, or `maxIterations` is reached.
   *
   * @param input - The initial input payload.
   */
  run(
    input: TInput,
    options?: AgentLoopRunOptions,
  ): AsyncIterable<AgentLoopIterationResult<TOutput>>;

  /** Return the current observable state of the loop. */
  getState(): AgentLoopState;

  /** Reset the loop to its initial state, discarding accumulated context. */
  reset(): void;

  /**
   * Register a callback invoked after each iteration completes.
   *
   * @returns A dispose function that removes the callback.
   */
  onIterationComplete(
    callback: (result: AgentLoopIterationResult<TOutput>) => void,
  ): () => void;
}
