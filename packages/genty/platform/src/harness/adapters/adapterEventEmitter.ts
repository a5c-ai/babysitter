/**
 * Emits adapters compatible JSONL events to stdout during harness execution.
 *
 * Used when `--output-format adapters-events` is passed to `invoke` or
 * `call`. Each event is a single JSON line matching the
 * {@link AdapterAgentEvent} shape so the adapters babysitter adapter's
 * `parseEvent()` can consume it directly.
 *
 * @module harness/adapters/adapterEventEmitter
 */

import type { AdapterAgentEvent } from "./adapterTypes";

/**
 * Stateful emitter that writes adapters compatible JSONL events to stdout.
 *
 * Each `emit()` call writes one JSON line to `process.stdout`. The emitter
 * auto-stamps every event with `runId`, `agent`, and `timestamp` so callers
 * only need to supply the event-specific fields.
 */
export class AdapterEventEmitter {
  constructor(
    private readonly runId: string,
    private readonly agent: string = "babysitter",
  ) {}

  // ── Core emit ───────────────────────────────────────────────────────

  /**
   * Write a single JSONL event to stdout.
   *
   * Base fields (`runId`, `agent`, `timestamp`) are merged automatically.
   * Any field in `event` overrides the base fields.
   */
  emit(event: Partial<AdapterAgentEvent>): void {
    const full: AdapterAgentEvent = {
      type: "unknown",
      runId: this.runId,
      agent: this.agent,
      timestamp: new Date().toISOString(),
      ...event,
    };
    process.stdout.write(JSON.stringify(full) + "\n");
  }

  // ── Session lifecycle ───────────────────────────────────────────────

  /** Mark the beginning of a session / run. */
  sessionStart(sessionId?: string): void {
    this.emit({
      type: "session_start",
      sessionId: sessionId ?? this.runId,
      resumed: false,
    });
  }

  /** Mark the end of a session / run. */
  sessionEnd(exitReason: string, turnCount?: number): void {
    this.emit({
      type: "session_end",
      sessionId: this.runId,
      exitReason,
      turnCount: turnCount ?? 0,
    });
  }

  // ── Content streaming ───────────────────────────────────────────────

  /** Emit a text output chunk. */
  textDelta(text: string): void {
    this.emit({
      type: "text_delta",
      text,
      delta: text,
    });
  }

  // ── Tool calls ──────────────────────────────────────────────────────

  /** Signal the start of a tool invocation. */
  toolCallStart(toolCallId: string, toolName: string, input?: unknown): void {
    this.emit({
      type: "tool_call_start",
      toolCallId,
      toolName,
      input: input ?? {},
    });
  }

  /** Signal a tool invocation result. */
  toolResult(toolCallId: string, toolName: string, output: unknown): void {
    this.emit({
      type: "tool_result",
      toolCallId,
      toolName,
      output,
    });
  }

  // ── Cost / usage ────────────────────────────────────────────────────

  /** Emit cost / token usage information. */
  cost(inputTokens: number, outputTokens: number, totalCost: number): void {
    this.emit({
      type: "cost",
      cost: {
        inputTokens,
        outputTokens,
        totalCost,
      },
      inputTokens,
      outputTokens,
      totalCost,
    });
  }

  // ── Turn / iteration boundaries ─────────────────────────────────────

  /** Signal the start of an orchestration iteration / turn. */
  turnStart(iteration: number): void {
    this.emit({
      type: "turn_start",
      turnIndex: iteration,
      iteration,
    });
  }

  /** Signal the end of an orchestration iteration / turn. */
  turnEnd(iteration: number): void {
    this.emit({
      type: "turn_end",
      turnIndex: iteration,
      iteration,
    });
  }

  // ── Errors ──────────────────────────────────────────────────────────

  /** Emit an error event. */
  error(message: string, code?: string): void {
    this.emit({
      type: "error",
      message,
      error: message,
      code: code ?? "INTERNAL",
    });
  }

  // ── Approval requests ───────────────────────────────────────────────

  /** Request user approval for an action. */
  approvalRequest(id: string, description: string): void {
    this.emit({
      type: "approval_request",
      id,
      description,
    });
  }
}
