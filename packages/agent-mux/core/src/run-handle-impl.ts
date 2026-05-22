/**
 * RunHandleImpl — concrete implementation of RunHandle.
 *
 * Implements:
 * - Typed EventEmitter dispatch with per-type handler maps
 * - AsyncIterator fan-out with shared replay buffer (high-water-mark bounded)
 * - State machine (via state-machine.ts)
 * - Thenable contract (lazy internal promise, resolves to RunResult)
 * - Control method guards (RUN_NOT_ACTIVE, INVALID_STATE_TRANSITION)
 * - Interaction channel wiring
 */

import type { AgentName, CostRecord } from './types.js';
import type { AgentEvent, AgentEventType, EventOfType, DebugEvent } from './events.js';
import type {
  DeferredPromptOptions,
  DeferredPromptTarget,
  RunHandle,
  RunResult,
  TokenUsageSummary,
  RunError,
} from './run-handle.js';
import type { InteractionChannel, InteractionResponse } from './interaction.js';
import type { ApprovalRequestEvent, InputRequiredEvent, TokenUsageEvent, CostEvent, TextDeltaEvent, TurnStartEvent } from './events.js';
import { AgentMuxError } from './errors.js';
import { type RunState, assertTransition, isTerminal } from './state-machine.js';
import { InteractionChannelImpl } from './interaction-channel-impl.js';
import {
  accumulateTokenUsage,
  accumulateCost,
  buildTokenUsageSummary,
  type CostAccumulator,
  type TokenAccumulator,
} from './run-handle-cost.js';
import { createComponentLogger, telemetry } from '@a5c-ai/agent-mux-observability';
import type { Span } from '@opentelemetry/api';
import { context, trace } from '@opentelemetry/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for constructing a RunHandleImpl. */
export interface RunHandleImplOptions {
  readonly runId: string;
  readonly agent: AgentName;
  readonly model?: string;
  /** Approval mode for the interaction channel. */
  readonly approvalMode?: 'yolo' | 'prompt' | 'deny';
  /** Maximum number of events to buffer for late async iterators. */
  readonly bufferHighWaterMark?: number;
  /** Whether to collect all events in RunResult.events. */
  readonly collectEvents?: boolean;
  /** Tags echoed back in RunResult. */
  readonly tags?: string[];
}

/** Default high-water mark for the shared event buffer. */
const DEFAULT_HWM = 1000;

// ---------------------------------------------------------------------------
// Iterator state
// ---------------------------------------------------------------------------

interface IteratorState {
  /** Position in the shared _buffer from which this iterator should next yield. */
  position: number;

  /** Resolve function for the current `next()` call that is awaiting an event. */
  waiting: ((value: IteratorResult<AgentEvent>) => void) | null;
}

interface DeferredPrompt {
  id: string;
  mode: 'queue' | 'steer';
  prompt: string;
  when: DeferredPromptTarget;
}

// ---------------------------------------------------------------------------
// RunHandleImpl
// ---------------------------------------------------------------------------

export class RunHandleImpl implements RunHandle {
  // ── Identity ─────────────────────────────────────────────────────────────

  readonly runId: string;
  readonly agent: AgentName;
  readonly model: string | undefined;

  // ── State machine ─────────────────────────────────────────────────────────

  private _state: RunState = 'spawned';

  // ── EventEmitter handler map ──────────────────────────────────────────────

  /** Map from event type -> array of handlers. */
  private readonly _handlers = new Map<string, ((event: AgentEvent) => void)[]>();

  // ── AsyncIterator fan-out ─────────────────────────────────────────────────

  /** Shared ordered buffer of all events emitted so far. */
  private readonly _buffer: AgentEvent[] = [];

  /** Per-iterator tracking state. */
  private readonly _iterators: Set<IteratorState> = new Set();

  /** When true, the run has ended and all iterators should drain and stop. */
  private _done = false;

  /** High-water mark for the buffer. */
  private readonly _hwm: number;

  // ── Thenable / result promise (lazy, per spec §2) ─────────────────────────

  private _resultPromise: Promise<RunResult> | null = null;
  private _resolveResult: ((result: RunResult) => void) | null = null;
  /** Queued result if complete() is called before the promise is created. */
  private _pendingResult: RunResult | null = null;

  // ── Run result accumulators ───────────────────────────────────────────────

  private _text = '';
  private _sessionId: string | undefined;
  private _cost: CostAccumulator | null = null;
  private _startTime = Date.now();
  private _tokenUsage: TokenAccumulator = { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, cachedTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
  private _turnCount = 0;
  private _exitCode: number | null = null;
  private _signal: string | null = null;
  private _runError: RunError | null = null;
  private _collectedEvents: AgentEvent[] = [];
  private readonly _collectEvents: boolean;
  private readonly _tags: string[];

  // ── Interaction channel ───────────────────────────────────────────────────

  readonly interaction: InteractionChannelImpl;

  /** Logger instance for this run. */
  private readonly logger: any;

  /** OpenTelemetry span for this run. */
  private readonly _runSpan: Span;

  /** Map of active tool call spans by toolCallId. */
  private readonly _toolSpans = new Map<string, Span>();

  /** Map of active subagent spans by subagentId. */
  private readonly _subagentSpans = new Map<string, Span>();

  /** Bound runtime input transport used by send()/queue()/steer(). */
  private _inputTransport: ((text: string) => Promise<void>) | null = null;

  /** Bound interaction response transport used by approval/input dispatch. */
  private _interactionTransport: ((id: string, response: InteractionResponse) => Promise<void>) | null = null;

  /** Deferred prompts waiting for a matching run boundary. */
  private readonly _deferredPrompts: DeferredPrompt[] = [];

  /** Serializes deferred prompt delivery. */
  private _deferredDeliveryChain: Promise<void> = Promise.resolve();

  /** Monotonic counter for deferred prompt bookkeeping. */
  private _deferredPromptSeq = 0;

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor(options: RunHandleImplOptions) {
    this.runId = options.runId;
    this.agent = options.agent;
    this.model = options.model;
    this._hwm = options.bufferHighWaterMark ?? DEFAULT_HWM;
    this._collectEvents = options.collectEvents ?? false;
    this._tags = options.tags ?? [];

    this.interaction = new InteractionChannelImpl(options.approvalMode ?? 'prompt');

    // Initialize logger for this run
    this.logger = createComponentLogger(this.agent) as any;

    // Start OpenTelemetry span for this run
    this._runSpan = telemetry.startRunSpan(this.runId, this.agent, this.model);

    // Wire up the interaction channel's response dispatcher.
    this.interaction.setDispatch(async (id, response) => {
      await this._handleInteractionResponse(id, response);
    });
    // Result promise is created lazily per spec §2.
  }

  // ── State machine ─────────────────────────────────────────────────────────

  /** Current run state. */
  get state(): RunState {
    return this._state;
  }

  /**
   * Transition to a new state.
   * Validates the transition and updates the internal state.
   * Does NOT emit a state-change event — callers should emit the appropriate event then call this.
   */
  transitionTo(next: RunState): void {
    assertTransition(this._state, next);
    this._state = next;
  }

  // ── Event dispatch ────────────────────────────────────────────────────────

  /**
   * Emit an event. Called by the adapter or test harness.
   *
   * 1. Accumulates relevant fields (text, token usage, cost, session ID).
   * 2. Appends to the shared buffer (with HWM enforcement).
   * 3. Wakes up waiting async iterators.
   * 4. Dispatches to registered EventEmitter handlers.
   */
  emit(event: AgentEvent): void {
    // Log important events
    this._logEvent(event);

    // Accumulate run result fields.
    this._accumulate(event);

    // Collect if requested.
    if (this._collectEvents) {
      this._collectedEvents.push(event);
    }

    // Append to shared buffer with HWM enforcement.
    if (this._buffer.length >= this._hwm) {
      // Drop oldest events already consumed by all iterators per spec §10.3.
      let minPosition = this._buffer.length;
      for (const iter of this._iterators) {
        if (iter.position < minPosition) minPosition = iter.position;
      }
      if (minPosition > 0) {
        // Evict events already consumed by all iterators.
        this._buffer.splice(0, minPosition);
        for (const iter of this._iterators) {
          iter.position -= minPosition;
        }
      } else if (this._buffer.length >= this._hwm) {
        // All iterators at position 0 — must drop oldest anyway.
        this._buffer.shift();
        // No position adjustment needed since they haven't consumed it.
      }
      this._emitDebugEvent('warn', `Event buffer overflow: events dropped (HWM=${this._hwm})`);
    }
    this._buffer.push(event);

    // Wake waiting iterators.
    for (const iter of this._iterators) {
      if (iter.waiting !== null) {
        const resolve = iter.waiting;
        iter.waiting = null;
        iter.position++;
        resolve({ value: event, done: false });
      }
    }

    // Dispatch to EventEmitter handlers.
    this._dispatchHandlers(event);

    // Deferred prompt delivery runs after consumers have observed the
    // boundary event that triggered it.
    this._triggerDeferredPromptDelivery(event);
  }

  /**
   * Log important events for observability.
   */
  private _logEvent(event: AgentEvent): void {
    switch (event.type) {
      case 'tool_call_start':
        this.logger.toolCallStart({
          runId: this.runId,
          toolName: (event as any).toolName,
          toolCallId: (event as any).toolCallId,
          args: (event as any).inputAccumulated,
        });

        // Start tool call span
        const toolSpan = telemetry.startToolCallSpan((event as any).toolName, (event as any).toolCallId, this._runSpan);
        this._toolSpans.set((event as any).toolCallId, toolSpan);
        break;

      case 'tool_call_ready':
        // Tool call is ready to be executed (or result is pending)
        break;

      case 'tool_result':
        {
          const span = this._toolSpans.get((event as any).toolCallId);
          const duration = (event as any).durationMs || 0;
          
          this.logger.toolCallComplete({
            runId: this.runId,
            toolName: (event as any).toolName,
            toolCallId: (event as any).toolCallId,
            duration,
            result: (event as any).result,
          });

          if (span) {
            telemetry.endSpanSuccess(span, {
              'tool.duration_ms': duration,
            });
            this._toolSpans.delete((event as any).toolCallId);
          }
          telemetry.recordToolCall((event as any).toolName, duration, true);
        }
        break;

      case 'tool_error':
        {
          const span = this._toolSpans.get((event as any).toolCallId);
          const duration = (event as any).durationMs || 0;

          this.logger.toolCallComplete({
            runId: this.runId,
            toolName: (event as any).toolName,
            toolCallId: (event as any).toolCallId,
            duration,
            result: (event as any).error,
          });

          if (span) {
            telemetry.endSpanError(span, (event as any).error);
            this._toolSpans.delete((event as any).toolCallId);
          }
          telemetry.recordToolCall((event as any).toolName, duration, false);
        }
        break;

      case 'subagent_spawn':
        {
          const subagentSpan = telemetry.startSubagentSpan(
            (event as any).subagentId,
            (event as any).agentName,
            this._runSpan,
          );
          this._subagentSpans.set((event as any).subagentId, subagentSpan);
        }
        break;

      case 'subagent_result':
        {
          const span = this._subagentSpans.get((event as any).subagentId);
          if (span) {
            telemetry.endSpanSuccess(span);
            this._subagentSpans.delete((event as any).subagentId);
          }
        }
        break;

      case 'subagent_error':
        {
          const span = this._subagentSpans.get((event as any).subagentId);
          if (span) {
            telemetry.endSpanError(span, (event as any).error);
            this._subagentSpans.delete((event as any).subagentId);
          }
        }
        break;

      case 'error':
        this.logger.error({
          runId: this.runId,
          agent: this.agent,
          error: {
            code: (event as any).code,
            message: (event as any).message,
            recoverable: (event as any).recoverable,
          },
        }, 'Agent error occurred');
        break;

      case 'session_start':
        this.logger.session('Session started', {
          runId: this.runId,
          sessionId: event.sessionId,
          action: 'create',
        });
        break;

      case 'session_resume':
        this.logger.session('Session resumed', {
          runId: this.runId,
          sessionId: event.sessionId,
          action: 'resume',
        });
        break;

      case 'cost':
        this.logger.debug({
          runId: this.runId,
          cost: event.cost,
        }, 'Cost update received');
        break;

      // Log other important events as debug
      default:
        if (['approval_request', 'input_required'].includes(event.type)) {
          this.logger.debug({ runId: this.runId, eventType: event.type }, 'Interaction event');
        }
        break;
    }
  }

  /**
   * Signal that the run has ended with the given exit information.
   * Resolves the result promise and terminates all async iterators.
   */
  complete(exitReason: RunResult['exitReason'], exitCode: number | null, signal: string | null): void {
    this._exitCode = exitCode;
    this._signal = signal;
    this._done = true;
    this.interaction.terminate();

    // Log run completion
    const duration = Date.now() - this._startTime;
    const cost = this._cost ? {
      totalUsd: this._cost.totalUsd,
      inputTokens: this._tokenUsage.inputTokens,
      outputTokens: this._tokenUsage.outputTokens,
      thinkingTokens: this._tokenUsage.thinkingTokens,
    } : undefined;

    if (exitReason === 'completed') {
      this.logger.runComplete({
        runId: this.runId,
        agent: this.agent,
        duration,
        cost,
      });
      telemetry.recordRunComplete(this.agent, this.model, duration, cost);
      telemetry.endSpanSuccess(this._runSpan, {
        exitReason,
        durationMs: duration,
        ...(cost || {}),
      });
    } else {
      const error = this._runError || { message: `Run failed with reason: ${exitReason}` };
      this.logger.runError({
        runId: this.runId,
        agent: this.agent,
        error,
      });
      telemetry.recordRunError(this.agent, this.model, error.message, cost);
      telemetry.endSpanError(this._runSpan, error.message, {
        exitReason,
        durationMs: duration,
        ...(cost || {}),
      });
    }

    // Wake all waiting iterators with done = true.
    for (const iter of this._iterators) {
      if (iter.waiting !== null) {
        const resolve = iter.waiting;
        iter.waiting = null;
        resolve({ value: undefined as unknown as AgentEvent, done: true });
      }
    }

    // Resolve the result promise (or queue for lazy creation).
    const result = this._buildResult(exitReason);
    if (this._resolveResult) {
      this._resolveResult(result);
    } else {
      this._pendingResult = result;
    }
  }

  // ── AsyncIterable ─────────────────────────────────────────────────────────

  [Symbol.asyncIterator](): AsyncIterator<AgentEvent> {
    const iterState: IteratorState = {
      position: 0,
      waiting: null,
    };
    this._iterators.add(iterState);

    const self = this;
    return {
      next(): Promise<IteratorResult<AgentEvent>> {
        // Replay buffered events that this iterator hasn't consumed yet.
        if (iterState.position < self._buffer.length) {
          const event = self._buffer[iterState.position++]!;
          return Promise.resolve({ value: event, done: false });
        }

        // If the run is done and we've consumed all buffered events, terminate.
        if (self._done) {
          self._iterators.delete(iterState);
          return Promise.resolve({ value: undefined as unknown as AgentEvent, done: true });
        }

        // Wait for the next event.
        return new Promise<IteratorResult<AgentEvent>>((resolve) => {
          iterState.waiting = resolve;
        });
      },

      return(): Promise<IteratorResult<AgentEvent>> {
        iterState.waiting = null;
        self._iterators.delete(iterState);
        return Promise.resolve({ value: undefined as unknown as AgentEvent, done: true });
      },
    };
  }

  // ── EventEmitter ──────────────────────────────────────────────────────────

  on<T extends AgentEventType>(type: T, handler: (event: EventOfType<T>) => void): this {
    const list = this._handlers.get(type) ?? [];
    list.push(handler as (event: AgentEvent) => void);
    this._handlers.set(type, list);
    return this;
  }

  off<T extends AgentEventType>(type: T, handler: (event: EventOfType<T>) => void): this {
    const list = this._handlers.get(type);
    if (!list) return this;
    const idx = list.indexOf(handler as (event: AgentEvent) => void);
    if (idx !== -1) list.splice(idx, 1);
    return this;
  }

  once<T extends AgentEventType>(type: T, handler: (event: EventOfType<T>) => void): this {
    const wrapper = (event: EventOfType<T>) => {
      this.off(type, wrapper);
      handler(event);
    };
    return this.on(type, wrapper);
  }

  // ── Thenable ──────────────────────────────────────────────────────────────

  /** Lazily create the result promise per spec §2. */
  private _ensureResultPromise(): Promise<RunResult> {
    if (!this._resultPromise) {
      if (this._pendingResult) {
        // complete() was called before anyone accessed the promise.
        this._resultPromise = Promise.resolve(this._pendingResult);
      } else {
        this._resultPromise = new Promise<RunResult>((resolve) => {
          this._resolveResult = resolve;
        });
      }
    }
    return this._resultPromise;
  }

  get then(): Promise<RunResult>['then'] {
    const p = this._ensureResultPromise();
    return p.then.bind(p);
  }

  get catch(): Promise<RunResult>['catch'] {
    const p = this._ensureResultPromise();
    return p.catch.bind(p);
  }

  get finally(): Promise<RunResult>['finally'] {
    const p = this._ensureResultPromise();
    return p.finally.bind(p);
  }

  result(): Promise<RunResult> {
    return this._ensureResultPromise();
  }

  /** @internal Bind the active runtime input transport. */
  bindInputTransport(writer: (text: string) => Promise<void>): void {
    this._inputTransport = writer;
  }

  /** @internal Bind the active runtime interaction transport. */
  bindInteractionTransport(writer: (id: string, response: InteractionResponse) => Promise<void>): void {
    this._interactionTransport = writer;
  }

  // ── Interaction methods ───────────────────────────────────────────────────

  async send(text: string): Promise<void> {
    this._assertActive();
    if (!text) {
      throw new AgentMuxError('VALIDATION_ERROR', 'send() requires non-empty text', false);
    }
    await this._sendNow(text);
  }

  async queue(prompt: string, options?: DeferredPromptOptions): Promise<void> {
    await this._enqueueDeferredPrompt('queue', prompt, options?.when ?? 'next-turn');
  }

  async approve(detail?: string): Promise<void> {
    this._assertActive();
    const pending = this.interaction.pending.filter((p) => p.type === 'approval');
    if (pending.length === 0) {
      throw new AgentMuxError('NO_PENDING_INTERACTION', 'No pending approval interaction', false);
    }
    await this.interaction.respond(pending[0]!.id, { type: 'approve', detail });
  }

  async deny(reason?: string): Promise<void> {
    this._assertActive();
    const pending = this.interaction.pending.filter((p) => p.type === 'approval');
    if (pending.length === 0) {
      throw new AgentMuxError('NO_PENDING_INTERACTION', 'No pending approval interaction', false);
    }
    await this.interaction.respond(pending[0]!.id, { type: 'deny', reason });
  }

  async continue(prompt: string): Promise<void> {
    this._assertActive();
    if (!prompt) {
      throw new AgentMuxError('VALIDATION_ERROR', 'continue() requires non-empty prompt', false);
    }
    // Semantically equivalent to send() — adapters may differentiate later.
    await this.send(prompt);
  }

  async steer(prompt: string, options?: DeferredPromptOptions): Promise<void> {
    await this._enqueueDeferredPrompt('steer', prompt, options?.when ?? 'after-response');
  }

  // ── Control methods ───────────────────────────────────────────────────────

  async interrupt(): Promise<void> {
    this._assertActive();
    this.transitionTo('interrupted');
  }

  async abort(): Promise<void> {
    if (isTerminal(this._state)) {
      // No-op for already-terminated runs.
      return;
    }
    this.transitionTo('aborted');
  }

  async pause(): Promise<void> {
    this._assertActive();
    this.transitionTo('paused');
  }

  async resume(): Promise<void> {
    this._assertActive();
    this.transitionTo('running');
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _assertActive(): void {
    if (isTerminal(this._state)) {
      throw new AgentMuxError('RUN_NOT_ACTIVE', `Run ${this.runId} is not active (state: ${this._state})`, false);
    }
  }

  private _accumulate(event: AgentEvent): void {
    switch (event.type) {
      case 'text_delta':
        this._text += (event as TextDeltaEvent).delta;
        break;
      case 'session_start':
        this._sessionId = (event as { sessionId: string }).sessionId;
        break;
      case 'token_usage':
        accumulateTokenUsage(this._tokenUsage, event as TokenUsageEvent);
        break;
      case 'cost':
        this._cost = accumulateCost(this._cost, event as CostEvent);
        break;
      case 'turn_start':
        this._turnCount = (event as TurnStartEvent).turnIndex + 1;
        break;
      case 'crash':
        this._runError = {
          code: 'AGENT_CRASH',
          message: (event as { stderr: string }).stderr || 'Agent crashed',
          stderr: (event as { stderr: string }).stderr,
          recoverable: false,
        };
        break;
      case 'error':
        this._runError = {
          code: (event as { code: import('./types.js').ErrorCode }).code,
          message: (event as { message: string }).message,
          stderr: '',
          recoverable: (event as { recoverable: boolean }).recoverable,
        };
        break;
      case 'approval_request':
        this.interaction.handleApprovalRequest(event as ApprovalRequestEvent);
        break;
      case 'input_required':
        this.interaction.handleInputRequired(event as InputRequiredEvent);
        break;
    }
  }

  private _dispatchHandlers(event: AgentEvent): void {
    const list = this._handlers.get(event.type);
    if (!list || list.length === 0) return;
    // Invoke handlers in registration order; catch errors and emit debug events per spec §10.4.
    for (const handler of list.slice()) {
      try {
        handler(event);
      } catch (err) {
        // Per spec: errors in handlers are caught, logged via debug event,
        // and do not prevent subsequent handlers from executing.
        this._emitDebugEvent(
          'warn',
          `EventEmitter handler threw: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  /** Emit a debug event without recursing through _dispatchHandlers for debug handlers. */
  private _emitDebugEvent(level: 'verbose' | 'info' | 'warn', message: string): void {
    const debugEvent: DebugEvent = {
      type: 'debug',
      runId: this.runId,
      agent: this.agent,
      timestamp: Date.now(),
      level,
      message,
    };
    // Append to buffer and collected events, but dispatch to debug handlers
    // directly to avoid infinite recursion.
    if (this._collectEvents) {
      this._collectedEvents.push(debugEvent);
    }
    this._buffer.push(debugEvent);
    // Wake waiting iterators for the debug event.
    for (const iter of this._iterators) {
      if (iter.waiting !== null) {
        const resolve = iter.waiting;
        iter.waiting = null;
        iter.position++;
        resolve({ value: debugEvent, done: false });
      }
    }
    // Dispatch only to 'debug' handlers (not the handler that just threw).
    const debugHandlers = this._handlers.get('debug');
    if (debugHandlers && debugHandlers.length > 0) {
      for (const h of debugHandlers.slice()) {
        try {
          h(debugEvent);
        } catch {
          // Swallow errors in debug handlers to prevent infinite recursion.
        }
      }
    }
  }

  private _buildResult(exitReason: RunResult['exitReason']): RunResult {
    const durationMs = Date.now() - this._startTime;
    const tokenUsage = buildTokenUsageSummary(this._tokenUsage);
    return {
      runId: this.runId,
      agent: this.agent,
      model: this.model,
      sessionId: this._sessionId,
      text: this._text,
      cost: this._cost,
      durationMs,
      exitCode: this._exitCode,
      signal: this._signal,
      exitReason,
      tokenUsage,
      turnCount: this._turnCount,
      error: this._runError,
      events: this._collectEvents ? [...this._collectedEvents] : [],
      tags: [...this._tags],
    };
  }

  private async _handleInteractionResponse(_id: string, _response: InteractionResponse): Promise<void> {
    const writer = this._interactionTransport;
    if (!writer) {
      return;
    }
    await writer(_id, _response);
  }

  private async _sendNow(text: string): Promise<void> {
    const writer = this._inputTransport;
    if (!writer) {
      throw new AgentMuxError('STDIN_NOT_AVAILABLE', 'Agent stdin is not available', false);
    }
    await writer(text);
  }

  private async _enqueueDeferredPrompt(
    mode: 'queue' | 'steer',
    prompt: string,
    when: DeferredPromptTarget,
  ): Promise<void> {
    this._assertActive();
    if (!prompt) {
      const method = mode === 'queue' ? 'queue()' : 'steer()';
      throw new AgentMuxError('VALIDATION_ERROR', `${method} requires non-empty prompt`, false);
    }
    if (!this._inputTransport) {
      throw new AgentMuxError('STDIN_NOT_AVAILABLE', 'Agent stdin is not available', false);
    }
    this._deferredPrompts.push({
      id: `deferred-${++this._deferredPromptSeq}`,
      mode,
      prompt,
      when,
    });
  }

  private _triggerDeferredPromptDelivery(event: AgentEvent): void {
    if (this._deferredPrompts.length === 0 || !this._inputTransport) {
      return;
    }

    const boundaries = this._boundariesForEvent(event);
    if (boundaries.length === 0) {
      return;
    }

    const deliverNow = this._deferredPrompts.filter((entry) => boundaries.includes(entry.when));
    if (deliverNow.length === 0) {
      return;
    }

    const pending = this._deferredPrompts.filter((entry) => !boundaries.includes(entry.when));
    this._deferredPrompts.splice(0, this._deferredPrompts.length, ...pending);

    this._deferredDeliveryChain = this._deferredDeliveryChain
      .then(async () => {
        for (const entry of deliverNow) {
          try {
            await this._sendNow(entry.prompt);
          } catch (err) {
            this._emitDebugEvent(
              'warn',
              `Deferred ${entry.mode} delivery failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      })
      .catch(() => {});
  }

  private _boundariesForEvent(event: AgentEvent): DeferredPromptTarget[] {
    switch (event.type) {
      case 'tool_result':
      case 'tool_error':
        return ['after-tool'];
      case 'message_stop':
        return ['after-response', 'next-turn'];
      case 'turn_end':
        return ['next-turn'];
      default:
        return [];
    }
  }
}
