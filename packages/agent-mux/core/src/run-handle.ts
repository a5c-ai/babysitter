/**
 * RunHandle interface, RunResult, TokenUsageSummary, and RunError for @a5c-ai/agent-mux.
 *
 * RunHandle is the single object returned by mux.run(). It simultaneously
 * implements AsyncIterable<AgentEvent>, EventEmitter-like typed subscriptions,
 * and Promise<RunResult> (thenable).
 */

import type { AgentName, CostRecord } from './types.js';
import type { AgentEvent, AgentEventType, EventOfType } from './events.js';
import type { InteractionChannel } from './interaction.js';
import type { ErrorCode } from './types.js';

// ---------------------------------------------------------------------------
// TokenUsageSummary
// ---------------------------------------------------------------------------

/**
 * Aggregated token usage for a completed run.
 */
export interface TokenUsageSummary {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly thinkingTokens: number;
  readonly cachedTokens: number;
  readonly totalTokens: number;
}

// ---------------------------------------------------------------------------
// RunError
// ---------------------------------------------------------------------------

/**
 * Error details for abnormal run termination.
 */
export interface RunError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly stderr: string;
  readonly recoverable: boolean;
}

/** When a deferred prompt should be injected into an active run. */
export type DeferredPromptTarget = 'next-turn' | 'after-tool' | 'after-response';

/** Options shared by deferred prompt queueing / steering methods. */
export interface DeferredPromptOptions {
  /** Delivery boundary for the deferred prompt. */
  when?: DeferredPromptTarget;
}

// ---------------------------------------------------------------------------
// RunResult
// ---------------------------------------------------------------------------

/**
 * The final outcome of a completed run.
 *
 * Resolved by the RunHandle promise when the run reaches any terminal state.
 * Never represents a partial run.
 */
export interface RunResult {
  /** The run identifier. Matches RunHandle.runId. */
  readonly runId: string;

  /** The agent that executed this run. */
  readonly agent: AgentName;

  /** The resolved model ID. `undefined` if the adapter could not determine it. */
  readonly model: string | undefined;

  /** The session ID assigned by the agent. `undefined` for ephemeral runs. */
  readonly sessionId: string | undefined;

  /**
   * The accumulated text output from the agent.
   * Concatenation of all `text_delta.delta` fields.
   */
  readonly text: string;

  /**
   * Cost accounting for this run. Aggregated from all `cost` events.
   * `null` when the adapter does not report cost data.
   */
  readonly cost: CostRecord | null;

  /** Wall-clock duration of the run in milliseconds. */
  readonly durationMs: number;

  /** The process exit code. `null` if killed by a signal. */
  readonly exitCode: number | null;

  /** The signal that terminated the process, if any. `null` when process exited normally. */
  readonly signal: string | null;

  /** Why the run ended. */
  readonly exitReason:
    | 'completed'
    | 'aborted'
    | 'interrupted'
    | 'timeout'
    | 'inactivity'
    | 'turn_limit'
    | 'crashed'
    | 'killed';

  /**
   * Token usage totals. Aggregated from all `token_usage` events.
   * `null` if the adapter does not report token counts.
   */
  readonly tokenUsage: TokenUsageSummary | null;

  /** The number of conversational turns completed. */
  readonly turnCount: number;

  /**
   * Error information when the run ended abnormally.
   * `null` for successful runs.
   */
  readonly error: RunError | null;

  /**
   * All events emitted during the run, in order.
   * Only populated when `RunOptions.collectEvents` is `true` (default: `false`).
   */
  readonly events: AgentEvent[];

  /** Metadata tags from `RunOptions.tags`. Echoed back for correlation. */
  readonly tags: string[];
}

// ---------------------------------------------------------------------------
// RunHandle
// ---------------------------------------------------------------------------

/**
 * The runtime handle for a single agent invocation.
 *
 * Returned synchronously by `mux.run()`. The subprocess is spawned
 * immediately upon construction; events begin flowing before the consumer
 * attaches any listener or iterator.
 *
 * Implements three consumption contracts simultaneously:
 * - AsyncIterable<AgentEvent> — for `for await...of` loops
 * - EventEmitter-like — for `on`/`off`/`once` subscriptions
 * - Promise<RunResult> (thenable) — for direct `await`
 *
 * All three can be used concurrently on the same handle instance.
 */
export interface RunHandle extends AsyncIterable<AgentEvent> {
  // ── Identity (read-only) ──────────────────────────────────────────────

  /** Unique run identifier (ULID). Matches `runId` on every AgentEvent. */
  readonly runId: string;

  /** The agent name this run targets. */
  readonly agent: AgentName;

  /** The resolved model ID. `undefined` when unknown. */
  readonly model: string | undefined;

  // ── AsyncIterable contract ────────────────────────────────────────────

  /**
   * Returns an async iterator over all AgentEvents emitted by this run.
   *
   * Events emitted before the iterator is created are buffered and replayed.
   * Multiple independent iterators can be created (fan-out, not competing).
   * The iterator terminates when the run reaches a terminal state.
   */
  [Symbol.asyncIterator](): AsyncIterator<AgentEvent>;

  // ── EventEmitter contract ─────────────────────────────────────────────

  /**
   * Subscribe to events of a specific type.
   * TypeScript narrows the event parameter to the matching union member.
   * @returns `this` for chaining.
   */
  on<T extends AgentEventType>(
    type: T,
    handler: (event: EventOfType<T>) => void,
  ): this;

  /**
   * Unsubscribe a previously registered handler.
   * @returns `this` for chaining.
   */
  off<T extends AgentEventType>(
    type: T,
    handler: (event: EventOfType<T>) => void,
  ): this;

  /**
   * Subscribe to a single occurrence of an event type.
   * @returns `this` for chaining.
   */
  once<T extends AgentEventType>(
    type: T,
    handler: (event: EventOfType<T>) => void,
  ): this;

  // ── Promise / thenable contract ───────────────────────────────────────

  /**
   * Makes RunHandle a thenable. Resolves with RunResult when the run
   * reaches a terminal state. Never rejects.
   */
  then: Promise<RunResult>['then'];

  /** Delegates to the internal result promise's catch. */
  catch: Promise<RunResult>['catch'];

  /** Delegates to the internal result promise's finally. */
  finally: Promise<RunResult>['finally'];

  // ── Interaction methods ───────────────────────────────────────────────

  /**
   * Send free-form text input to the running agent's stdin.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `STDIN_NOT_AVAILABLE` if the agent does not support stdin injection.
   */
  send(text: string): Promise<void>;

  /**
   * Queue a follow-up prompt for delivery at a later run boundary.
   *
   * Defaults to the next turn boundary.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `STDIN_NOT_AVAILABLE` if the agent does not support stdin injection.
   */
  queue(prompt: string, options?: DeferredPromptOptions): Promise<void>;

  /**
   * Approve a pending tool-use or action request.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `NO_PENDING_INTERACTION` if no approval request is pending.
   */
  approve(detail?: string): Promise<void>;

  /**
   * Deny a pending tool-use or action request.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `NO_PENDING_INTERACTION` if no approval request is pending.
   */
  deny(reason?: string): Promise<void>;

  /**
   * Continue the agent with a new follow-up prompt.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   */
  continue(prompt: string): Promise<void>;

  /**
   * Steer the current run by injecting a deferred follow-up prompt.
   *
   * Defaults to delivery after the next completed agent response.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `STDIN_NOT_AVAILABLE` if the agent does not support stdin injection.
   */
  steer(prompt: string, options?: DeferredPromptOptions): Promise<void>;

  // ── Control methods ───────────────────────────────────────────────────

  /**
   * Interrupt the agent's current operation (SIGINT / Ctrl+C).
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if already terminated.
   */
  interrupt(): Promise<void>;

  /**
   * Abort the run immediately (SIGTERM then SIGKILL after grace period).
   * Calling on an already-terminated run is a no-op.
   */
  abort(): Promise<void>;

  /**
   * Pause event emission and agent execution.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if already terminated.
   * @throws {AgentMuxError} code `INVALID_STATE_TRANSITION` if already paused.
   */
  pause(): Promise<void>;

  /**
   * Resume a paused run.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if already terminated.
   * @throws {AgentMuxError} code `INVALID_STATE_TRANSITION` if not paused.
   */
  resume(): Promise<void>;

  // ── Interaction channel ───────────────────────────────────────────────

  /** Structured interaction channel for building interactive UIs. */
  readonly interaction: InteractionChannel;

  // ── Result accessor ───────────────────────────────────────────────────

  /**
   * Returns the same promise as the thenable interface.
   * Useful in contexts where thenable detection would be ambiguous.
   */
  result(): Promise<RunResult>;
}
