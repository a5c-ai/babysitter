# RunHandle, InteractionChannel, and Run Lifecycle

**Specification v1.0** | `@a5c-ai/agent-mux`

> **Note:** hermes-agent is included as a 10th supported agent per project requirements, extending the original scope's 9 agents. All ten built-in agents (claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes) share the same `RunHandle` contract.

---

## 1. Overview

This specification defines the complete runtime interface for agent invocations: the `RunHandle` returned by `mux.run()`, the `RunResult` it resolves to, the `InteractionChannel` for building interactive UIs, the run state machine, subprocess lifecycle management, and all platform-specific behaviors.

A `RunHandle` is the single object a consumer interacts with after calling `mux.run()`. It simultaneously implements three consumption patterns:

1. **AsyncIterable** -- consume events with `for await...of`.
2. **EventEmitter** -- subscribe to typed events with `on`/`off`/`once`.
3. **Promise/thenable** -- `await` directly for the final `RunResult`.

All three patterns can be used on the same handle concurrently. This tri-modal design lets consumers choose the idiom that fits their use case without losing access to the others.

### 1.1 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `AgentEvent` union type | `04-agent-events.md` | 4 |
| `AgentCapabilities` | `06-capabilities-and-models.md` | 1 |
| `Adapter contract`, `buildSpawnArgs()` | `05-adapter-system.md` | 1 |
| `CostRecord` | `01-core-types-and-client.md` | 4.2.3 |
| `ErrorCode`, `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| `RetryPolicy` | `01-core-types-and-client.md` | 5.1.1 |
| Process lifecycle (scope) | `agent-mux-scope.md` | 22 |
| CLI `amux run` | `10-cli-reference.md` | 1 |

---

## 2. RunHandle Interface

```typescript
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
interface RunHandle extends AsyncIterable<AgentEvent> {
  // ── Identity (read-only) ──────────────────────────────────────────────

  /**
   * Unique identifier for this run. Generated as a ULID if not supplied
   * via `RunOptions.runId`. Immutable for the lifetime of the handle.
   *
   * Matches the `runId` field on every `AgentEvent` emitted by this handle
   * and the entry written to `.agent-mux/run-index.jsonl`.
   */
  readonly runId: string;

  /**
   * The agent name this run targets. Matches `RunOptions.agent`.
   */
  readonly agent: AgentName;

  /**
   * The resolved model ID for this run. `undefined` when the agent does
   * not expose model selection or the adapter could not determine it.
   *
   * Set during spawn-time resolution: explicit `RunOptions.model`, then
   * profile default, then adapter default, then `undefined`.
   */
  readonly model: string | undefined;

  // ── AsyncIterable contract ────────────────────────────────────────────

  /**
   * Returns an async iterator over all `AgentEvent` values emitted by
   * this run, from the first event through completion.
   *
   * The iterator terminates (returns `{ done: true }`) when the run
   * reaches a terminal state (completed, aborted, timed-out, crashed).
   *
   * Events emitted before the iterator is created are buffered (up to
   * the configured high-water mark) and replayed in order.
   *
   * Multiple iterators can be created from the same handle. Each
   * iterator receives all events independently (fan-out, not competing).
   *
   * If the internal buffer exceeds the high-water mark, the oldest
   * unbuffered events are dropped and a `buffer_overflow` warning is
   * logged. See Section 10 for backpressure details.
   */
  [Symbol.asyncIterator](): AsyncIterator<AgentEvent>;

  // ── EventEmitter contract ─────────────────────────────────────────────

  /**
   * Subscribe to events of a specific type.
   *
   * The handler receives only events matching the given type discriminant.
   * TypeScript narrows the event parameter to the matching union member.
   *
   * Handlers are invoked synchronously in registration order. If a handler
   * throws, the error is caught, logged via `debug` event, and does not
   * prevent subsequent handlers from executing.
   *
   * @returns `this` for chaining.
   */
  on<T extends AgentEvent['type']>(
    type: T,
    handler: (event: Extract<AgentEvent, { type: T }>) => void
  ): this;

  /**
   * Unsubscribe a previously registered handler.
   *
   * Comparison is by reference identity (`===`). If the handler was
   * not previously registered, this is a no-op.
   *
   * @returns `this` for chaining.
   */
  off<T extends AgentEvent['type']>(
    type: T,
    handler: (event: Extract<AgentEvent, { type: T }>) => void
  ): this;

  /**
   * Subscribe to a single occurrence of an event type.
   *
   * The handler is automatically removed after its first invocation.
   * Equivalent to registering via `on()` and calling `off()` inside
   * the handler.
   *
   * @returns `this` for chaining.
   */
  once<T extends AgentEvent['type']>(
    type: T,
    handler: (event: Extract<AgentEvent, { type: T }>) => void
  ): this;

  // ── Promise / thenable contract ───────────────────────────────────────

  /**
   * Makes `RunHandle` a thenable, enabling `await mux.run(options)`.
   *
   * Resolves with `RunResult` when the run reaches a terminal state
   * (completed, aborted, timed-out). Never rejects -- errors are
   * captured in `RunResult.error` and `RunResult.exitCode`.
   *
   * The underlying promise is created lazily on first access to `then`,
   * `catch`, or `finally`, and cached thereafter. All three methods
   * delegate to the same internal promise.
   *
   * Consuming the handle as a promise does NOT consume the async
   * iterator. Both can be used simultaneously.
   */
  then: Promise<RunResult>['then'];

  /**
   * Delegates to the internal result promise's `catch` method.
   *
   * Since the promise never rejects under normal operation, this is
   * primarily useful for catching programming errors in chained `.then()`
   * handlers.
   */
  catch: Promise<RunResult>['catch'];

  /**
   * Delegates to the internal result promise's `finally` method.
   *
   * Guaranteed to run when the run terminates, regardless of outcome.
   * Use for cleanup (closing files, removing temp dirs, updating UI).
   */
  finally: Promise<RunResult>['finally'];

  // ── Interaction methods ───────────────────────────────────────────────

  /**
   * Send free-form text input to the running agent's stdin.
   *
   * Used for multi-turn conversation, answering agent questions, or
   * injecting follow-up prompts into an ongoing run.
   *
   * The text is written to the subprocess stdin pipe (or PTY input
   * stream for PTY-mode agents). A trailing newline is appended if
   * not already present.
   *
   * @param text - The text to send. Must be non-empty.
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
  * @throws {AgentMuxError} code `STDIN_NOT_AVAILABLE` if the agent does
  *         not support stdin injection (capability: `supportsStdinInjection`).
  */
  send(text: string): Promise<void>;

  /**
   * Queue a deferred follow-up prompt.
   *
   * The prompt is held until the requested boundary is observed on the
   * active run. If omitted, delivery defaults to the next turn boundary.
   *
   * Supported boundaries:
   * - `next-turn`
   * - `after-tool`
   * - `after-response`
   */
  queue(
    prompt: string,
    options?: { when?: 'next-turn' | 'after-tool' | 'after-response' }
  ): Promise<void>;

  /**
   * Approve a pending tool-use or action request.
   *
   * Sends the approval response to the agent for the most recent
   * pending interaction (or the interaction matching the provided detail).
   * Equivalent to calling `interaction.respond(id, { type: 'approve' })`.
   *
   * @param detail - Optional detail string forwarded to the agent.
   *                 Some agents accept a reason or scope qualifier.
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `NO_PENDING_INTERACTION` if no approval
   *         request is pending.
   */
  approve(detail?: string): Promise<void>;

  /**
   * Deny a pending tool-use or action request.
   *
   * Sends a denial response for the most recent pending interaction.
   * Equivalent to calling `interaction.respond(id, { type: 'deny', reason })`.
   *
   * @param reason - Optional human-readable reason for the denial.
   *                 Forwarded to the agent where supported.
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `NO_PENDING_INTERACTION` if no approval
   *         request is pending.
   */
  deny(reason?: string): Promise<void>;

  /**
   * Continue the agent with a new follow-up prompt.
   *
   * Functionally equivalent to `send(prompt)` but semantically signals
   * a new turn. Adapters may format this differently from raw stdin
   * input (e.g., wrapping in a turn delimiter, resetting inactivity
   * timers).
   *
  * @param prompt - The follow-up prompt. Must be non-empty.
  * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
  */
  continue(prompt: string): Promise<void>;

  /**
   * Steer the current run with a deferred prompt injection.
   *
   * This is the same transport mechanism as `queue()`, but defaults to
   * `after-response` so the next completed assistant message becomes the
   * steering boundary.
   */
  steer(
    prompt: string,
    options?: { when?: 'next-turn' | 'after-tool' | 'after-response' }
  ): Promise<void>;

  // ── Control methods ───────────────────────────────────────────────────

  /**
   * Interrupt the agent's current operation.
   *
   * Sends SIGINT (Unix) or a Ctrl+C sequence (Windows PTY) to the
   * subprocess. The agent may handle this gracefully (e.g., stopping
   * the current tool call but remaining alive for further input) or
   * may terminate.
   *
   * Transitions the run state to `interrupted`. If the agent process
   * remains alive, the state transitions back to `running` when output
   * resumes.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has
   *         already terminated.
   */
  interrupt(): Promise<void>;

  /**
   * Abort the run immediately.
   *
   * Initiates a forced shutdown sequence:
   * 1. Send SIGTERM (Unix) or begin graceful termination (Windows).
   * 2. Wait for the grace period (default: 5000ms).
   * 3. If still alive, send SIGKILL (Unix) or `TerminateProcess` (Windows).
   *
   * Transitions the run state to `aborted`. The result promise resolves
   * with `exitReason: 'aborted'`.
   *
   * Calling `abort()` on an already-terminated run is a no-op.
   */
  abort(): Promise<void>;

  /**
   * Pause event emission and agent execution.
   *
   * Sends SIGTSTP (Unix) or suspends the process (Windows) to pause
   * the subprocess. Events already in the internal buffer remain
   * available for consumption.
   *
   * Transitions the run state to `paused`.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `INVALID_STATE_TRANSITION` if already paused.
   */
  pause(): Promise<void>;

  /**
   * Resume a paused run.
   *
   * Sends SIGCONT (Unix) or resumes the process (Windows). Events
   * resume flowing.
   *
   * Transitions the run state from `paused` back to `running`.
   *
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   * @throws {AgentMuxError} code `INVALID_STATE_TRANSITION` if not paused.
   */
  resume(): Promise<void>;

  // ── Interaction channel ───────────────────────────────────────────────

  /**
   * Structured interaction channel for building interactive UIs.
   *
   * Provides a queue-based interface for handling pending approval
   * requests and input prompts, decoupled from the event stream.
   * See Section 4 for the full `InteractionChannel` specification.
   */
  readonly interaction: InteractionChannel;

  // ── Result accessor ───────────────────────────────────────────────────

  /**
   * Returns a promise that resolves with the final `RunResult`.
   *
   * Functionally equivalent to `await handle` but available as an
   * explicit method for contexts where thenable behavior is ambiguous
   * (e.g., when passing the handle to a function that checks for
   * thenables).
   *
   * The returned promise is the same instance as the one backing the
   * thenable interface. Calling `result()` multiple times returns the
   * same promise.
   */
  result(): Promise<RunResult>;
}
```

---

## 3. RunResult Interface

```typescript
/**
 * The final outcome of a completed run.
 *
 * Resolved by the `RunHandle` promise when the run reaches any
 * terminal state. Contains the accumulated text output, cost data,
 * timing information, and termination metadata.
 *
 * `RunResult` never represents a partial run. If the run was aborted
 * or timed out, `text` contains whatever output was captured before
 * termination and `exitReason` indicates why it ended.
 */
interface RunResult {
  /**
   * The run identifier. Matches `RunHandle.runId`.
   */
  readonly runId: string;

  /**
   * The agent that executed this run.
   */
  readonly agent: AgentName;

  /**
   * The resolved model ID. `undefined` if the adapter could not
   * determine it.
   */
  readonly model: string | undefined;

  /**
   * The session ID assigned by the agent. `undefined` for ephemeral
   * runs (`noSession: true`) or agents that do not support sessions.
   */
  readonly sessionId: string | undefined;

  /**
   * The accumulated text output from the agent.
   *
   * This is the concatenation of all `text_delta` events' `delta`
   * fields, equivalent to the final `message_stop` event's `text`
   * field. For runs that produced no text output, this is an empty
   * string.
   */
  readonly text: string;

  /**
   * Cost accounting for this run.
   *
   * Aggregated from all `cost` events emitted during the run. `null`
   * when the adapter does not report cost data.
   */
  readonly cost: CostRecord | null;

  /**
   * Wall-clock duration of the run in milliseconds.
   *
   * Measured from subprocess spawn to process exit (or forced kill).
   * Includes time spent paused.
   */
  readonly durationMs: number;

  /**
   * The process exit code of the agent subprocess.
   *
   * `0` for successful completion. Non-zero for crashes, errors, or
   * forced termination. `null` if the process was killed by a signal
   * before it could set an exit code.
   */
  readonly exitCode: number | null;

  /**
   * The signal that terminated the process, if any.
   *
   * `null` when the process exited normally (with an exit code).
   * Common values: `'SIGTERM'`, `'SIGKILL'`, `'SIGINT'`.
   *
   * On Windows, this is always `null` (Windows does not have POSIX
   * signals; see Section 8.2 for Windows termination).
   */
  readonly signal: string | null;

  /**
   * Why the run ended. Discriminates normal completion from
   * abnormal termination.
   */
  readonly exitReason:
    | 'completed'      // Agent finished normally
    | 'aborted'        // Consumer called abort()
    | 'interrupted'    // Consumer called interrupt() and agent exited
    | 'timeout'        // Run timeout expired
    | 'inactivity'     // Inactivity timeout expired
    | 'turn_limit'     // maxTurns reached
    | 'crashed'        // Non-zero exit code without explicit abort
    | 'killed';        // Process killed by external signal

  /**
   * Token usage totals for the run.
   *
   * Aggregated from all `token_usage` events. `null` if the adapter
   * does not report token counts.
   */
  readonly tokenUsage: TokenUsageSummary | null;

  /**
   * The number of conversational turns completed.
   *
   * Derived from `turn_start`/`turn_end` event pairs. `0` when the
   * agent never started a turn (e.g., immediate auth failure).
   */
  readonly turnCount: number;

  /**
   * Error information when the run ended abnormally.
   *
   * `null` for successful runs (`exitReason: 'completed'`). For
   * failures, contains the last error event's details.
   */
  readonly error: RunError | null;

  /**
   * All events emitted during the run, in order.
   *
   * Only populated when `RunOptions.collectEvents` is `true`
   * (default: `false`). When `false`, this is an empty array to
   * avoid unbounded memory growth for long-running agents.
   *
   * @spec-extension `RunOptions.collectEvents` is defined by this specification
   * and is not present in the original scope's RunOptions definition (scope
   * section 6). It enables post-run event analysis without requiring consumers
   * to buffer events manually.
   */
  readonly events: AgentEvent[];

  /**
   * Metadata tags from `RunOptions.tags`. Echoed back for correlation.
   */
  readonly tags: string[];
}

/**
 * Aggregated token usage for a completed run.
 */
interface TokenUsageSummary {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly thinkingTokens: number;
  readonly cachedTokens: number;
  readonly totalTokens: number;
}

/**
 * Error details for abnormal run termination.
 */
interface RunError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly stderr: string;
  readonly recoverable: boolean;
}
```

---

## 4. InteractionChannel

The `InteractionChannel` provides a structured, queue-based interface for handling agent interactions (approval requests and input prompts). It is designed for building interactive UIs where pending interactions are displayed as a list and the user responds to each one individually.

The interaction channel is decoupled from the event stream. While `approval_request` and `input_required` events flow through the normal event pipeline, the `InteractionChannel` provides a separate, stateful view of pending interactions with explicit response methods.

```typescript
/**
 * Queue-based interaction handler for pending agent requests.
 *
 * Tracks all unresolved approval requests and input prompts,
 * provides notification when new interactions arrive, and
 * offers response methods for individual or batch resolution.
 */
interface InteractionChannel {
  /**
   * Array of currently pending interactions, in arrival order.
   *
   * Interactions are added when `approval_request` or `input_required`
   * events are emitted, and removed when responded to (via `respond()`,
   * `approveAll()`, or `denyAll()`).
   *
   * This array is a snapshot; it does not update in place. Read it
   * each time you need the current state.
   */
  readonly pending: PendingInteraction[];

  /**
   * Register a callback invoked whenever a new interaction becomes
   * pending.
   *
   * The callback receives the new `PendingInteraction` object. It is
   * invoked synchronously during event processing.
   *
   * @returns An unsubscribe function. Calling it removes the handler.
   */
  onPending(handler: (interaction: PendingInteraction) => void): () => void;

  /**
   * Respond to a specific pending interaction by its ID.
   *
   * The response is forwarded to the agent subprocess via the
   * appropriate mechanism (stdin for most agents, PTY input for
   * PTY-mode agents).
   *
   * After responding, the interaction is removed from `pending`.
   *
   * @param id - The `interactionId` from the `PendingInteraction`.
   * @param response - The response to send.
   * @throws {AgentMuxError} code `INTERACTION_NOT_FOUND` if no pending
   *         interaction matches the given ID.
   * @throws {AgentMuxError} code `RUN_NOT_ACTIVE` if the run has terminated.
   */
  respond(id: string, response: InteractionResponse): Promise<void>;

  /**
   * Approve all currently pending interactions at once.
   *
   * Iterates `pending` in arrival order and sends an approval response
   * for each. Input-required interactions are skipped (they require
   * a text response, not an approval).
   *
   * Equivalent to calling `respond(id, { type: 'approve' })` for
   * each pending approval-type interaction.
   *
   * No-op if there are no pending approval interactions.
   */
  approveAll(): Promise<void>;

  /**
   * Deny all currently pending approval interactions.
   *
   * @param reason - Optional denial reason forwarded to the agent
   *                 for each denied interaction.
   *
   * No-op if there are no pending approval interactions.
   */
  denyAll(reason?: string): Promise<void>;
}
```

### 4.1 PendingInteraction Type

```typescript
/**
 * A pending interaction awaiting a response from the consumer.
 *
 * Created when the agent emits an `approval_request` or
 * `input_required` event and not yet resolved.
 */
interface PendingInteraction {
  /**
   * Unique identifier for this interaction. Matches the
   * `interactionId` field on the originating event.
   */
  readonly id: string;

  /**
   * Discriminant for the interaction type.
   *
   * - `'approval'` -- the agent is requesting permission to perform
   *   an action (tool call, file write, shell command, etc.).
   * - `'input'` -- the agent is requesting free-form text input
   *   (a question, clarification, or missing parameter).
   */
  readonly type: 'approval' | 'input';

  /**
   * The `runId` of the run that generated this interaction.
   */
  readonly runId: string;

  /**
   * Human-readable description of what the agent wants to do
   * (for approvals) or what information it needs (for input).
   */
  readonly description: string;

  /**
   * Additional context about the interaction.
   *
   * For approvals: the action detail, tool name, and risk level.
   * For input: the question context and source.
   */
  readonly detail: InteractionDetail;

  /**
   * Timestamp (ms since epoch) when the interaction was created.
   */
  readonly createdAt: number;
}

/**
 * Additional context for a pending interaction.
 */
type InteractionDetail = ApprovalDetail | InputDetail;

interface ApprovalDetail {
  readonly kind: 'approval';
  readonly action: string;
  readonly toolName: string | undefined;
  readonly riskLevel: 'low' | 'medium' | 'high';
}

interface InputDetail {
  readonly kind: 'input';
  readonly question: string;
  readonly context: string | undefined;
  readonly source: 'agent' | 'tool';
}
```

### 4.2 InteractionResponse Type

```typescript
/**
 * A response to a pending interaction.
 */
type InteractionResponse =
  | ApproveResponse
  | DenyResponse
  | TextInputResponse;

interface ApproveResponse {
  readonly type: 'approve';
  readonly detail?: string;
}

interface DenyResponse {
  readonly type: 'deny';
  readonly reason?: string;
}

interface TextInputResponse {
  readonly type: 'text';
  readonly text: string;
}
```

### 4.3 Interaction Lifecycle

Interactions follow a strict lifecycle:

1. **Created**: Agent emits `approval_request` or `input_required` event. The adapter creates a `PendingInteraction` and adds it to `InteractionChannel.pending`. The `onPending` callback fires.
2. **Pending**: The interaction remains in the `pending` array until responded to or the run terminates.
3. **Responded**: Consumer calls `respond()`, `approveAll()`, or `denyAll()`. The response is forwarded to the agent. The interaction is removed from `pending`. A corresponding `approval_granted` or `approval_denied` event is emitted.
4. **Expired**: If the run terminates while interactions are still pending, they are removed from `pending` and discarded. No response is sent.

Auto-resolution by `approvalMode`:

- `approvalMode: 'yolo'` -- All approval interactions are automatically responded to with `{ type: 'approve' }` before reaching the `pending` array. Input interactions still require manual response.
- `approvalMode: 'deny'` -- All approval interactions are automatically responded to with `{ type: 'deny' }`. Input interactions still require manual response.
- `approvalMode: 'prompt'` (default) -- All interactions are queued in `pending` and require explicit consumer response.

---

## 5. Run State Machine

Every run progresses through a deterministic state machine. States are mutually exclusive.

### 5.1 States

```typescript
type RunState =
  | 'spawned'       // Process spawn initiated, not yet confirmed alive
  | 'running'       // Process is alive and producing output
  | 'paused'        // Process suspended (SIGTSTP / SuspendThread)
  | 'interrupted'   // SIGINT sent; waiting for agent response
  | 'aborted'       // SIGTERM/SIGKILL sequence initiated
  | 'timed-out'     // Timeout or inactivity timeout expired
  | 'completed'     // Process exited with code 0
  | 'crashed'       // Process exited with non-zero code
  | 'killed';       // Process killed by external signal
```

### 5.2 State Transitions

```
                         ┌──────────────────────────────┐
                         │                              │
                         v                              │
  ┌─────────┐     ┌───────────┐     ┌──────────┐       │
  │ spawned │────>│  running  │────>│  paused  │───────>│
  └─────────┘     └───────────┘     └──────────┘       │
       │               │ │                              │
       │               │ │   ┌──────────────┐           │
       │               │ └──>│ interrupted  │──────────>│
       │               │     └──────────────┘           │
       │               │                                │
       │               v                                │
       │         ┌───────────┐    (terminal states)     │
       │         │           │                          │
       └────────>│ TERMINAL  │<─────────────────────────┘
                 │           │
                 └───────────┘
                  completed
                  aborted
                  timed-out
                  crashed
                  killed
```

### 5.3 Transition Rules

| From | To | Trigger |
|---|---|---|
| `spawned` | `running` | First output received from subprocess stdout/stderr |
| `spawned` | `crashed` | Spawn fails (binary not found, permission denied, immediate exit) |
| `spawned` | `timed-out` | Run timeout expires before first output |
| `running` | `paused` | Consumer calls `pause()` |
| `running` | `interrupted` | Consumer calls `interrupt()` |
| `running` | `aborted` | Consumer calls `abort()` |
| `running` | `timed-out` | Run timeout or inactivity timeout expires |
| `running` | `completed` | Process exits with code 0 |
| `running` | `crashed` | Process exits with non-zero code |
| `running` | `killed` | Process receives external signal (not from agent-mux) |
| `paused` | `running` | Consumer calls `resume()` |
| `paused` | `aborted` | Consumer calls `abort()` |
| `paused` | `timed-out` | Run timeout expires (inactivity timeout is suspended while paused) |
| `interrupted` | `running` | Agent resumes output after handling SIGINT |
| `interrupted` | `completed` | Agent exits cleanly after SIGINT |
| `interrupted` | `crashed` | Agent exits with non-zero code after SIGINT |
| `interrupted` | `aborted` | Consumer calls `abort()` while interrupted |

Terminal states (`completed`, `aborted`, `timed-out`, `crashed`, `killed`) are absorbing. No transitions out.

### 5.4 State Change Events

Every state transition emits a corresponding event on the `RunHandle`:

| Transition | Event emitted |
|---|---|
| any -> `running` | (no dedicated event; first content event implies running) |
| any -> `paused` | `{ type: 'paused' }` |
| any -> `running` (from paused) | `{ type: 'resumed' }` |
| any -> `interrupted` | `{ type: 'interrupted' }` |
| any -> `aborted` | `{ type: 'aborted' }` |
| any -> `timed-out` | `{ type: 'timeout', kind: 'run' \| 'inactivity' }` |
| any -> `completed` | Process exit handled; `RunResult` resolves |
| any -> `crashed` | `{ type: 'crash', exitCode, stderr }` |
| any -> `killed` | Process exit handled; `RunResult` resolves |

---

## 6. Subprocess Management

### 6.1 Spawn Sequence

When `mux.run(options)` is called:

1. **Option resolution**: Profile defaults are merged with explicit options. Capability validation runs. Model is resolved.
2. **Temp dir creation**: A unique temporary directory is created under `os.tmpdir()/agent-mux-<runId>/` for this run's ephemeral state (see Section 9).
3. **Spawn args assembly**: The adapter's `buildSpawnArgs(options)` method produces the command, arguments, environment variables, and working directory.
4. **Process group creation**: The subprocess is spawned in a new process group (`detached: true` on Unix, job object on Windows) to enable group-wide signal delivery.
5. **PTY check**: If the adapter's capabilities include `requiresPty: true`, the subprocess is spawned via `node-pty` instead of `child_process.spawn()` (see Section 7).
6. **Pipe attachment**: stdout and stderr are piped to the event parser. stdin is piped for interaction injection.
7. **Registration**: The process is registered in the global process tracker for zombie prevention (see Section 6.4).
8. **Timer start**: Run timeout and inactivity timeout timers begin.
9. **State**: Set to `spawned`, then to `running` on first output.

### 6.2 Signal Handling (Unix: macOS, Linux)

| Action | Signal sent | Behavior |
|---|---|---|
| `interrupt()` | `SIGINT` to process group | Agent may catch and handle gracefully |
| `abort()` | `SIGTERM` to process group, then `SIGKILL` after grace period | Two-phase shutdown |
| `pause()` | `SIGTSTP` to process group | Suspends all processes in group |
| `resume()` | `SIGCONT` to process group | Resumes all processes in group |
| Node.js exit | `SIGINT` to all tracked process groups, then `SIGKILL` after grace period | Zombie prevention (SIGINT first, SIGKILL after grace period per scope §22) |

The grace period between `SIGTERM` and `SIGKILL` defaults to 5000ms and is configurable via `RunOptions.gracePeriodMs` or the global config `gracePeriodMs` field.

> **Note:** `RunOptions.gracePeriodMs` is an extension field defined by this specification. It is not present in the original scope's `RunOptions` definition (scope section 6), but is required to implement the two-phase shutdown behavior specified in scope section 22.

Process-group signals ensure that child processes spawned by the agent (e.g., language servers, build tools) are also terminated.

### 6.3 Signal Handling (Windows)

Windows does not have POSIX signals. The adapter uses platform-specific equivalents:

| Action | Windows mechanism | Notes |
|---|---|---|
| `interrupt()` | `GenerateConsoleCtrlEvent(CTRL_C_EVENT)` for console processes; PTY Ctrl+C sequence for PTY-mode | Requires the subprocess to share a console or use PTY |
| `abort()` | `TerminateProcess` on the process handle after grace period | No graceful shutdown equivalent to SIGTERM; the grace period uses `GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT)` first |
| `pause()` | `SuspendThread` on all threads of the process | Requires enumerating threads via `NtQuerySystemInformation` |
| `resume()` | `ResumeThread` on all suspended threads | Reverses `SuspendThread` |
| Node.js exit | `TerminateProcess` on all tracked processes | Job object auto-kill on handle close |

On Windows, the subprocess is assigned to a Job Object created with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. When the Node.js process exits (normally or via crash), the OS automatically terminates all processes in the job, preventing zombies without explicit signal handling.

### 6.4 Zombie Prevention

All spawned subprocesses are tracked in a global `ProcessTracker` singleton:

```typescript
/**
 * Global process tracker for zombie prevention.
 *
 * Maintains a set of all active subprocess PIDs and their process
 * group IDs (Unix) or job object handles (Windows). On Node.js exit,
 * all tracked processes are forcefully terminated.
 */
interface ProcessTracker {
  /**
   * Register a spawned process. Called automatically by RunHandle
   * during spawn.
   */
  register(pid: number, groupId: number, runId: string): void;

  /**
   * Unregister a process after it exits. Called automatically by
   * RunHandle on process exit.
   */
  unregister(pid: number): void;

  /**
   * Kill all tracked processes. Called from `process.on('exit')`,
   * `process.on('SIGTERM')`, and `process.on('uncaughtException')`.
   *
   * On Unix: sends SIGINT to each tracked process group first, waits
   * for the grace period (default: 5000ms), then sends SIGKILL to any
   * processes that have not exited. This matches the two-phase shutdown
   * described in scope section 22.
   * On Windows: closes each job object handle (triggering auto-kill).
   */
  killAll(): void;

  /**
   * Number of currently tracked processes.
   */
  readonly activeCount: number;
}
```

The `ProcessTracker` installs handlers on the following Node.js events:

- `process.on('exit')` -- synchronous `killAll()`.
- `process.on('SIGTERM')` -- `killAll()` then `process.exit(1)`.
- `process.on('SIGINT')` -- `killAll()` then `process.exit(1)`.
- `process.on('uncaughtException')` -- `killAll()` then rethrow.
- `process.on('unhandledRejection')` -- `killAll()` then rethrow.

Handlers are installed once, on first `ProcessTracker.register()` call.

### 6.5 Grace Period Sequence

When `abort()` is called, the shutdown follows a timed sequence:

```
  t=0ms     Send SIGTERM (Unix) or CTRL_BREAK_EVENT (Windows)
            Start grace period timer (default: 5000ms)
            
  t=0..G    Monitor process for exit
            If process exits → cleanup, resolve RunResult
            
  t=G ms    Grace period expired, process still alive
            Send SIGKILL (Unix) or TerminateProcess (Windows)
            
  t=G+100   Final check — process guaranteed dead
            Cleanup temp dir, resolve RunResult
```

---

## 7. PTY Support

Some agents require a pseudo-terminal (PTY) to function correctly. This is declared in the adapter's capabilities as `requiresPty: true`. PTY mode changes how the subprocess is spawned and how I/O is handled.

### 7.1 When PTY Is Used

| Agent | requiresPty | Reason |
|---|---|---|
| claude | false | Streams JSON to stdout; no terminal control codes needed |
| codex | false | Streams JSON to stdout |
| gemini | false | Streams JSON to stdout |
| copilot | false | Structured output |
| cursor | false | Structured output |
| opencode | false | Structured output |
| pi | false | Structured output |
| omp | false | Structured output |
| openclaw | true | Interactive TUI; uses terminal control sequences for rich output |
| hermes | false | Structured output via `--output-format jsonl` flag |

### 7.2 PTY Spawn

When `requiresPty` is true:

```typescript
import * as pty from 'node-pty';

const ptyProcess = pty.spawn(command, args, {
  name: 'xterm-256color',
  cols: 120,
  rows: 40,
  cwd: resolvedCwd,
  env: resolvedEnv,
});
```

Key differences from pipe-mode spawn:

| Aspect | Pipe mode | PTY mode |
|---|---|---|
| Spawn function | `child_process.spawn()` | `pty.spawn()` |
| stdout/stderr | Separate pipes | Single PTY output stream (merged) |
| stdin | Writable pipe | PTY input stream |
| Line discipline | None | Terminal line discipline (echo, line editing) |
| Control characters | Not interpreted | Interpreted (Ctrl+C = SIGINT, etc.) |
| `interrupt()` | `process.kill('SIGINT')` | Write `\x03` (Ctrl+C) to PTY input |
| `pause()` | `process.kill('SIGTSTP')` | Write `\x1a` (Ctrl+Z) to PTY input |
| Output parsing | Line-based (newline-delimited) | Requires VT sequence stripping before parsing |

### 7.3 node-pty Dependency

`node-pty` is a native module with platform-specific compilation requirements. It is an optional peer dependency of `@a5c-ai/agent-mux-core`:

```json
{
  "peerDependencies": {
    "node-pty": ">=1.0.0"
  },
  "peerDependenciesMeta": {
    "node-pty": { "optional": true }
  }
}
```

If `requiresPty` is true for the selected agent and `node-pty` is not installed, `mux.run()` throws:

```typescript
throw new AgentMuxError(
  'PTY_NOT_AVAILABLE',
  `Agent "${agent}" requires PTY support but node-pty is not installed. ` +
  `Install it with: npm install node-pty`
);
```

---

## 8. Platform Differences

### 8.1 Unix (macOS and Linux)

- Process groups via `detached: true` + `process.kill(-pid, signal)`.
- Full POSIX signal support: SIGINT, SIGTERM, SIGKILL, SIGTSTP, SIGCONT.
- Shell commands spawned via `/bin/sh -c` when using shell mode.
- Temp dirs created under `$TMPDIR/agent-mux-<runId>/` (macOS) or `/tmp/agent-mux-<runId>/` (Linux).
- Config paths follow XDG conventions on Linux (`$XDG_CONFIG_HOME` or `~/.config/`). macOS uses `~/Library/Application Support/` for agents that follow macOS conventions, but agent-mux's own config always uses `~/.agent-mux/`.

### 8.2 Windows

- No POSIX signals. All signal-based operations use Windows API equivalents (see Section 6.3).
- Job Objects for process group management and automatic zombie cleanup.
- `GenerateConsoleCtrlEvent` for interrupt delivery.
- `TerminateProcess` for forceful kill (no SIGKILL equivalent; immediate and unconditional).
- Shell commands spawned via `cmd.exe /c` or `powershell.exe -Command` depending on the agent's requirements.
- Temp dirs created under `%TEMP%\agent-mux-<runId>\`.
- Path separators normalized to forward slashes in all events and API surfaces, regardless of platform.
- PTY support via `node-pty`'s `winpty` or `ConPTY` backend (ConPTY preferred on Windows 10 1809+).

### 8.3 Platform Abstraction

Platform-specific behavior is encapsulated in a `PlatformAdapter` internal module:

```typescript
interface PlatformAdapter {
  sendInterrupt(pid: number): void;
  sendTerminate(pid: number): void;
  sendKill(pid: number): void;
  suspendProcess(pid: number): void;
  resumeProcess(pid: number): void;
  createProcessGroup(pid: number): ProcessGroupHandle;
  killProcessGroup(handle: ProcessGroupHandle): void;
  tempDir(runId: string): string;
  shellCommand(): [string, string[]];
}
```

The correct implementation is selected at module load time based on `process.platform`:

```typescript
const platform: PlatformAdapter =
  process.platform === 'win32'
    ? new WindowsPlatformAdapter()
    : new UnixPlatformAdapter();
```

---

## 9. Run Isolation

Each run operates in an isolated environment to prevent cross-contamination between concurrent runs.

### 9.1 Temporary Directory

Every run gets a dedicated temp directory:

```
<os.tmpdir()>/agent-mux-<runId>/
  stdin-buffer.txt      # Buffered stdin input for batch injection
  harness-state.json    # Internal harness state (interaction queue, etc.)
  pty-log.txt           # PTY raw output log (PTY mode only, debug mode only)
```

The temp directory is created during the spawn sequence (Section 6.1, step 2) and removed during cleanup after the run terminates. Cleanup is best-effort: if the directory cannot be removed (e.g., locked files on Windows), it is left for OS-level temp cleanup.

### 9.2 Isolated Resources

| Resource | Isolation mechanism |
|---|---|
| Subprocess | Own PID, own process group, own stdio pipes |
| Temp directory | Unique path per runId |
| Event buffer | Per-RunHandle instance, not shared |
| Interaction queue | Per-InteractionChannel instance |
| Timers | Per-run timeout and inactivity timeout timers |
| State machine | Per-RunHandle `RunState` |

### 9.3 Shared Resources

Some resources are shared across concurrent runs and require synchronization:

| Resource | Sharing model | Synchronization |
|---|---|---|
| Agent config files | Read-only during runs; writes via `ConfigManager` | File-level advisory locking |
| Session files | Read-only during runs; writes by agent subprocess | No locking (agent-owned) |
| `run-index.jsonl` | Append-only by each RunHandle on completion | File-level advisory locking |
| `ProcessTracker` | Singleton, all runs register | Synchronous access (no async gaps) |
| `node-pty` instances | One per PTY-mode run | No sharing needed |

---

## 10. Backpressure and Buffer Management

### 10.1 High-Water Mark

The async iterator's internal event buffer has a configurable high-water mark. When the buffer length exceeds this threshold, the oldest events not yet consumed by any iterator are dropped.

```typescript
/**
 * Default high-water mark: 1000 events.
 *
 * Configurable per-client via `createClient({ eventBufferSize })` or
 * per-run via `RunOptions.eventBufferSize`.
 */
const DEFAULT_EVENT_BUFFER_SIZE = 1000;
```

> **Note:** `RunOptions.eventBufferSize` is an extension field defined by this specification. It is not present in the original scope's `RunOptions` definition (scope section 6), but is required to support the backpressure and buffer management behavior described in this section.

### 10.2 Buffer Architecture

```
  Subprocess stdout ──> Line Parser ──> Adapter.parseEvent() ──> Event Buffer
                                                                      │
                                           ┌──────────────────────────┤
                                           │                          │
                                           v                          v
                                    AsyncIterator 1           AsyncIterator 2
                                    (for await)               (for await)
                                           │                          │
                                           v                          v
                                    Consumer code             Consumer code
```

Each iterator maintains its own read cursor into the shared event buffer. Events are retained in the buffer until all active iterators have consumed them (or they are evicted by the high-water mark).

### 10.3 Backpressure Behavior

When the buffer exceeds the high-water mark:

1. The oldest events (those already consumed by all active iterators) are evicted first.
2. If no events can be evicted (all iterators are stalled), the oldest unconsumed events are dropped.
3. A `debug` event with `level: 'warn'` and message `'Event buffer overflow: N events dropped'` is emitted (this event is not subject to backpressure and always delivered).
4. The `RunResult.events` array (when `collectEvents: true`) is unaffected by backpressure drops -- it maintains its own separate collection.

### 10.4 EventEmitter Backpressure

EventEmitter-style handlers (`on`/`off`/`once`) are not subject to backpressure. They receive events synchronously as they are parsed, before the event enters the buffer. This means:

- EventEmitter handlers always see every event, even if the async iterator is stalled.
- A slow EventEmitter handler can delay event delivery to subsequent handlers and the buffer, but cannot cause event drops.
- If an EventEmitter handler throws, the error is caught and emitted as a `debug` event. The event is still delivered to subsequent handlers and the buffer.

---

## 11. Concurrency Safety

Multiple `RunHandle` instances can exist simultaneously, each driving a separate agent subprocess. The following guarantees hold:

### 11.1 Per-Handle Isolation

- Each `RunHandle` has its own subprocess, event buffer, state machine, interaction channel, and timers.
- No state leaks between handles.
- Calling `abort()` on one handle does not affect others.
- Each handle's async iterator is independent.

### 11.2 Global Resource Safety

- `ProcessTracker` is a singleton with synchronous registration/unregistration. No race conditions between concurrent `register()` calls.
- `run-index.jsonl` appends use file-level advisory locking. Concurrent writes from multiple RunHandles are serialized.
- Config file reads during option resolution are point-in-time snapshots. A concurrent config write does not affect an in-flight run's options.

### 11.3 Concurrent Consumption Patterns

A single `RunHandle` supports concurrent access from multiple consumers:

```typescript
const handle = mux.run({ agent: 'claude', prompt: 'refactor this' });

// Consumer 1: async iteration
(async () => {
  for await (const event of handle) {
    console.log('iter:', event.type);
  }
})();

// Consumer 2: event emitter
handle.on('text_delta', (e) => {
  process.stdout.write(e.delta);
});

// Consumer 3: await result
const result = await handle;
console.log('done:', result.exitReason);
```

All three consumers operate independently:
- The async iterator receives all events in order.
- The EventEmitter handler fires for every `text_delta` event.
- The `await` resolves when the run terminates.

No consumer blocks or interferes with another.

---

## 12. Edge Cases and Error Handling

### 12.1 Iterating and Awaiting the Same Handle

Both operations are fully supported on the same handle:

```typescript
const handle = mux.run({ agent: 'claude', prompt: 'hello' });

// Start iterating
const events: AgentEvent[] = [];
for await (const event of handle) {
  events.push(event);
}

// Iterator completes when run terminates. Awaiting afterward resolves immediately.
const result = await handle;
// result is available; events array has all events.
```

If the consumer `await`s the handle first and then tries to iterate:

```typescript
const handle = mux.run({ agent: 'claude', prompt: 'hello' });
const result = await handle;

// Iterating after completion: yields all buffered events (if within high-water mark),
// then immediately completes.
for await (const event of handle) {
  // Receives buffered events in order, then done.
}
```

### 12.2 Callback Errors in EventEmitter Handlers

If a handler registered via `on()` or `once()` throws synchronously:

1. The error is caught.
2. A `debug` event is emitted: `{ type: 'debug', level: 'warn', message: 'Handler error for event "<type>": <error.message>' }`.
3. Remaining handlers for the same event type still execute.
4. The event is still delivered to the async iterator buffer.
5. The error does not propagate to the consumer and does not terminate the run.

If a handler returns a rejected promise (async throw), the rejection is treated as an unhandled rejection. The handler is not awaited; it runs fire-and-forget.

### 12.3 Orphaned Processes

Orphaned processes (agent subprocesses whose parent Node.js process has exited) are prevented by the `ProcessTracker` (Section 6.4). In the event that the Node.js process is killed with `SIGKILL` (which cannot be caught):

- **Unix**: Orphaned processes are re-parented to PID 1 (init/systemd). They continue running until explicitly killed. The process group ID is preserved, so `kill -9 -<pgid>` from a shell can clean them up.
- **Windows**: Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` ensures orphaned processes are terminated when the job handle is closed, even on abrupt exit.

### 12.4 Spawn Failures

If the agent binary is not found or the spawn fails immediately:

1. State transitions directly from `spawned` to `crashed`.
2. A `crash` event is emitted with `exitCode: -1` and `stderr` containing the spawn error message.
3. The result promise resolves with `exitReason: 'crashed'` and `error` populated.
4. The async iterator yields the `crash` event, then completes.
5. No process is registered with `ProcessTracker`.

### 12.5 Multiple abort() Calls

Calling `abort()` multiple times is safe:

- First call initiates the shutdown sequence.
- Subsequent calls are no-ops (state is already `aborted` or terminal).
- The result promise resolves only once, with the first abort's outcome.

### 12.6 Calling Control Methods After Termination

Calling `send()`, `approve()`, `deny()`, `continue()`, `interrupt()`, `pause()`, or `resume()` after the run has reached a terminal state throws `AgentMuxError` with code `RUN_NOT_ACTIVE`. The `abort()` method is the exception: it is a no-op after termination.

`queue()` and `steer()` follow the same active-run guard and also require an
input transport. On the current implementation path, deferred prompt delivery
is available for stdin-backed live runs. The runtime flushes deferred prompts
when it observes the requested boundary event:

- `after-tool` on `tool_result` / `tool_error`
- `after-response` on `message_stop`
- `next-turn` on `turn_end` or `message_stop`

### 12.7 Empty Runs

If an agent produces no output and exits with code 0:

- `RunResult.text` is `''` (empty string).
- `RunResult.exitReason` is `'completed'`.
- `RunResult.turnCount` is `0`.
- `RunResult.cost` is `null`.
- `RunResult.tokenUsage` is `null`.
- The async iterator yields zero events, then completes.

---

## 13. Code Examples

### 13.1 Simple Await Pattern

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

// Simplest usage: await the result directly.
const result = await mux.run({
  agent: 'claude',
  prompt: 'What is the capital of France?',
});

console.log(result.text);        // "The capital of France is Paris."
console.log(result.durationMs);  // 2340
console.log(result.cost);        // { inputCost: 0.003, outputCost: 0.012, totalCost: 0.015 }
```

### 13.2 Async Iterator Pattern

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const handle = mux.run({
  agent: 'codex',
  prompt: 'Refactor the auth module to use JWT',
  model: 'o4-mini',
});

// Stream events as they arrive.
for await (const event of handle) {
  switch (event.type) {
    case 'text_delta':
      process.stdout.write(event.delta);
      break;
    case 'tool_call_ready':
      console.log(`\n[Tool: ${event.toolName}]`);
      break;
    case 'file_write':
      console.log(`\n[Wrote: ${event.path} (${event.byteCount} bytes)]`);
      break;
    case 'cost':
      console.log(`\n[Cost: $${event.cost.totalCost.toFixed(4)}]`);
      break;
  }
}

// After iteration completes, get the final result.
const result = await handle;
console.log(`\nCompleted in ${result.durationMs}ms`);
```

### 13.3 EventEmitter Pattern

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const handle = mux.run({
  agent: 'gemini',
  prompt: 'Generate a REST API for user management',
});

// Selective event handling.
handle.on('text_delta', (e) => {
  process.stdout.write(e.delta);
});

handle.on('file_write', (e) => {
  console.log(`[Created: ${e.path}]`);
});

handle.on('approval_request', (e) => {
  console.log(`[Approval needed: ${e.action}]`);
});

handle.on('crash', (e) => {
  console.error(`Agent crashed: exit code ${e.exitCode}`);
  console.error(e.stderr);
});

// Wait for completion.
const result = await handle;
```

### 13.4 Interactive UI with InteractionChannel

```typescript
import { createClient } from '@a5c-ai/agent-mux';
import * as readline from 'node:readline/promises';

const mux = createClient({ approvalMode: 'prompt' });

const handle = mux.run({
  agent: 'claude',
  prompt: 'Refactor the database layer',
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Listen for new interactions.
handle.interaction.onPending(async (interaction) => {
  if (interaction.type === 'approval') {
    const detail = interaction.detail as ApprovalDetail;
    const answer = await rl.question(
      `[${detail.riskLevel.toUpperCase()}] ${interaction.description}\n` +
      `Approve? (y/n): `
    );
    if (answer.toLowerCase() === 'y') {
      await handle.interaction.respond(interaction.id, { type: 'approve' });
    } else {
      await handle.interaction.respond(interaction.id, {
        type: 'deny',
        reason: 'User declined',
      });
    }
  } else {
    const answer = await rl.question(
      `${interaction.description}\n> `
    );
    await handle.interaction.respond(interaction.id, {
      type: 'text',
      text: answer,
    });
  }
});

// Stream text output while interactions are handled.
handle.on('text_delta', (e) => process.stdout.write(e.delta));

const result = await handle;
rl.close();
console.log(`\nDone: ${result.exitReason}`);
```

### 13.5 Concurrent Runs

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient({ approvalMode: 'yolo' });

// Launch three agents concurrently.
const runs = await Promise.all([
  mux.run({ agent: 'claude', prompt: 'Write unit tests for auth.ts' }),
  mux.run({ agent: 'codex', prompt: 'Write unit tests for db.ts' }),
  mux.run({ agent: 'gemini', prompt: 'Write unit tests for api.ts' }),
]);

for (const result of runs) {
  console.log(`${result.agent}: ${result.exitReason} (${result.durationMs}ms)`);
  if (result.cost) {
    console.log(`  Cost: $${result.cost.totalCost.toFixed(4)}`);
  }
}
```

### 13.6 Abort with Timeout

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const handle = mux.run({
  agent: 'openclaw',
  prompt: 'Analyze the entire codebase',
  timeout: 60_000, // 1 minute
});

// External abort after 30 seconds.
const timer = setTimeout(() => {
  handle.abort();
}, 30_000);

const result = await handle;
clearTimeout(timer);

if (result.exitReason === 'aborted') {
  console.log('Run was aborted. Partial output:');
  console.log(result.text.slice(0, 500));
} else {
  console.log('Run completed:', result.text);
}
```

### 13.7 Pause and Resume

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const handle = mux.run({
  agent: 'claude',
  prompt: 'Generate a comprehensive test suite',
});

// Pause after 10 seconds to inspect output so far.
setTimeout(async () => {
  await handle.pause();
  console.log('\n--- PAUSED ---');

  // Resume after 5 seconds.
  setTimeout(async () => {
    console.log('--- RESUMING ---\n');
    await handle.resume();
  }, 5_000);
}, 10_000);

for await (const event of handle) {
  if (event.type === 'text_delta') {
    process.stdout.write(event.delta);
  }
}
```

### 13.8 Hermes Agent Usage

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

// Hermes agent: NousResearch Hermes agent, the 10th built-in agent.
// Requires Python >= 3.11 and installation via pip/uv.
const result = await mux.run({
  agent: 'hermes',
  prompt: 'Explain the architecture of this project',
  model: 'hermes-3-llama-3.1-70b',
});

console.log(result.text);
console.log(`Tokens: ${result.tokenUsage?.totalTokens}`);
```

### 13.9 Chained EventEmitter

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

// Method chaining on event registration.
const handle = mux.run({ agent: 'pi', prompt: 'Optimize the build pipeline' });

handle
  .on('text_delta', (e) => process.stdout.write(e.delta))
  .on('tool_call_ready', (e) => console.log(`\n[${e.toolName}]`))
  .on('cost', (e) => console.log(`\n[Cost: $${e.cost.totalCost.toFixed(4)}]`))
  .on('crash', (e) => console.error(`\nCrash: ${e.stderr}`));

await handle;
```

### 13.10 Collecting All Events

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const result = await mux.run({
  agent: 'opencode',
  prompt: 'Add input validation to all API endpoints',
  collectEvents: true,  // Capture all events in RunResult.events
});

// Post-run analysis of all events.
const toolCalls = result.events.filter((e) => e.type === 'tool_call_ready');
const fileWrites = result.events.filter((e) => e.type === 'file_write');

console.log(`Tool calls: ${toolCalls.length}`);
console.log(`Files written: ${fileWrites.length}`);
console.log(`Total cost: $${result.cost?.totalCost.toFixed(4)}`);
```

### 13.11 Follow-Up with continue()

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient();

const handle = mux.run({
  agent: 'claude',
  prompt: 'List the files in the src directory',
});

handle.on('message_stop', async () => {
  // Agent finished first response; send follow-up.
  await handle.continue('Now refactor the largest file');
});

// The second once fires after the follow-up response completes.
let turnCount = 0;
handle.on('turn_end', () => {
  turnCount++;
  if (turnCount >= 2) {
    handle.abort(); // Done after two turns.
  }
});

const result = await handle;
console.log(result.text);
```

### 13.12 Batch Approval

```typescript
import { createClient } from '@a5c-ai/agent-mux';

const mux = createClient({ approvalMode: 'prompt' });

const handle = mux.run({
  agent: 'omp',
  prompt: 'Rename all test files from .test.ts to .spec.ts',
});

// Approve all pending interactions every 2 seconds.
const interval = setInterval(async () => {
  if (handle.interaction.pending.length > 0) {
    console.log(`Auto-approving ${handle.interaction.pending.length} interactions`);
    await handle.interaction.approveAll();
  }
}, 2_000);

const result = await handle;
clearInterval(interval);
```

---

## 14. Internal Implementation Notes

### 14.1 RunHandle Construction

`RunHandle` is not directly instantiated by consumers. It is created internally by `AgentMuxClient.run()` and returned as the public interface. The internal implementation class (`RunHandleImpl`) holds private state:

- The `ChildProcess` (or `IPty`) instance.
- The event buffer (circular buffer with high-water mark).
- The state machine current state.
- The interaction channel state.
- Timeout timer handles.
- The result promise and its resolve function.

### 14.2 Event Flow Pipeline

```
  Subprocess stdout
       │
       v
  Line Accumulator (handles partial lines, PTY escape sequences)
       │
       v
  Adapter.parseEvent(line, context)
       │
       v
  Event Enrichment (add runId, agent, timestamp)
       │
       v
  InteractionChannel (extracts approval_request / input_required)
       │
       v
  EventEmitter dispatch (synchronous, all on/once handlers)
       │
       v
  Event Buffer (for async iterators)
       │
       v
  RunResult accumulator (text, cost, tokens, turn count)
```

### 14.3 Result Promise Lifecycle

The internal result promise is created lazily on first access to `then`, `catch`, or `finally` (not during construction), and cached thereafter. All three properties delegate to the same internal promise instance. This lazy approach avoids allocating a promise for handles that are consumed only via the async iterator or EventEmitter pattern.

It resolves when:

1. The subprocess exits (any exit code or signal).
2. The `abort()` sequence completes (SIGKILL confirmed).
3. A timeout fires and the subsequent kill completes.

The `then`, `catch`, and `finally` properties on `RunHandle` are bound delegates to this promise's methods. This makes the handle a valid thenable for `await`, `Promise.all()`, `Promise.race()`, and other promise-consuming APIs.

### 14.4 Inactivity Timeout

The inactivity timeout resets on every event received from the subprocess. If no events arrive within the configured `inactivityTimeout` (milliseconds), the run transitions to `timed-out` and the abort sequence begins.

- The inactivity timer is paused while the run is in the `paused` state.
- The inactivity timer is reset when the run transitions from `paused` to `running`.
- The inactivity timer does not reset on events generated internally (e.g., `debug`, `paused`, `resumed`).

---

## 15. Complete Type Reference

All types defined or referenced in this specification, consolidated:

```typescript
// ── RunHandle ───────────────────────────────────────────────────────────

interface RunHandle extends AsyncIterable<AgentEvent> {
  readonly runId: string;
  readonly agent: AgentName;
  readonly model: string | undefined;

  [Symbol.asyncIterator](): AsyncIterator<AgentEvent>;

  on<T extends AgentEvent['type']>(
    type: T,
    handler: (event: Extract<AgentEvent, { type: T }>) => void
  ): this;
  off<T extends AgentEvent['type']>(
    type: T,
    handler: (event: Extract<AgentEvent, { type: T }>) => void
  ): this;
  once<T extends AgentEvent['type']>(
    type: T,
    handler: (event: Extract<AgentEvent, { type: T }>) => void
  ): this;

  then: Promise<RunResult>['then'];
  catch: Promise<RunResult>['catch'];
  finally: Promise<RunResult>['finally'];

  send(text: string): Promise<void>;
  queue(
    prompt: string,
    options?: { when?: 'next-turn' | 'after-tool' | 'after-response' }
  ): Promise<void>;
  approve(detail?: string): Promise<void>;
  deny(reason?: string): Promise<void>;
  continue(prompt: string): Promise<void>;
  steer(
    prompt: string,
    options?: { when?: 'next-turn' | 'after-tool' | 'after-response' }
  ): Promise<void>;

  interrupt(): Promise<void>;
  abort(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;

  readonly interaction: InteractionChannel;

  result(): Promise<RunResult>;
}

// ── RunResult ───────────────────────────────────────────────────────────

interface RunResult {
  readonly runId: string;
  readonly agent: AgentName;
  readonly model: string | undefined;
  readonly sessionId: string | undefined;
  readonly text: string;
  readonly cost: CostRecord | null;
  readonly durationMs: number;
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly exitReason:
    | 'completed'
    | 'aborted'
    | 'interrupted'
    | 'timeout'
    | 'inactivity'
    | 'turn_limit'
    | 'crashed'
    | 'killed';
  readonly tokenUsage: TokenUsageSummary | null;
  readonly turnCount: number;
  readonly error: RunError | null;
  readonly events: AgentEvent[];
  readonly tags: string[];
}

interface TokenUsageSummary {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly thinkingTokens: number;
  readonly cachedTokens: number;
  readonly totalTokens: number;
}

interface RunError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly stderr: string;
  readonly recoverable: boolean;
}

// ── RunState ────────────────────────────────────────────────────────────

type RunState =
  | 'spawned'
  | 'running'
  | 'paused'
  | 'interrupted'
  | 'aborted'
  | 'timed-out'
  | 'completed'
  | 'crashed'
  | 'killed';

// ── InteractionChannel ──────────────────────────────────────────────────

interface InteractionChannel {
  readonly pending: PendingInteraction[];
  onPending(handler: (interaction: PendingInteraction) => void): () => void;
  respond(id: string, response: InteractionResponse): Promise<void>;
  approveAll(): Promise<void>;
  denyAll(reason?: string): Promise<void>;
}

// ── PendingInteraction ──────────────────────────────────────────────────

interface PendingInteraction {
  readonly id: string;
  readonly type: 'approval' | 'input';
  readonly runId: string;
  readonly description: string;
  readonly detail: InteractionDetail;
  readonly createdAt: number;
}

type InteractionDetail = ApprovalDetail | InputDetail;

interface ApprovalDetail {
  readonly kind: 'approval';
  readonly action: string;
  readonly toolName: string | undefined;
  readonly riskLevel: 'low' | 'medium' | 'high';
}

interface InputDetail {
  readonly kind: 'input';
  readonly question: string;
  readonly context: string | undefined;
  readonly source: 'agent' | 'tool';
}

// ── InteractionResponse ─────────────────────────────────────────────────

type InteractionResponse =
  | ApproveResponse
  | DenyResponse
  | TextInputResponse;

interface ApproveResponse {
  readonly type: 'approve';
  readonly detail?: string;
}

interface DenyResponse {
  readonly type: 'deny';
  readonly reason?: string;
}

interface TextInputResponse {
  readonly type: 'text';
  readonly text: string;
}

// ── ProcessTracker ──────────────────────────────────────────────────────

interface ProcessTracker {
  register(pid: number, groupId: number, runId: string): void;
  unregister(pid: number): void;
  killAll(): void;
  readonly activeCount: number;
}

// ── PlatformAdapter ─────────────────────────────────────────────────────

interface PlatformAdapter {
  sendInterrupt(pid: number): void;
  sendTerminate(pid: number): void;
  sendKill(pid: number): void;
  suspendProcess(pid: number): void;
  resumeProcess(pid: number): void;
  createProcessGroup(pid: number): ProcessGroupHandle;
  killProcessGroup(handle: ProcessGroupHandle): void;
  tempDir(runId: string): string;
  shellCommand(): [string, string[]];
}

type ProcessGroupHandle = number | JobObjectHandle;
type JobObjectHandle = { readonly handle: unknown };
```

---

## Implementation Status (2026-04-12)

`RunHandle` is now backed by a live `node:child_process.spawn` pipeline. `startSpawnLoop()` in `packages/core/src/spawn-runner.ts` owns the process lifetime, wires stdout/stderr into the adapter's `parseEvent()`, and honours `RunOptions.retryPolicy`, `timeout`, and `inactivityTimeout`. Abort performs a two-phase shutdown (SIGTERM, then SIGKILL after `gracePeriodMs`). On Unix, processes are spawned with `detached: true` and killed as a group via `process.kill(-pid, sig)`; Windows relies on the native job object / process tree and falls back to `taskkill /T`. See `docs/11-process-lifecycle-and-platform.md` for the full spawn/kill contract.
