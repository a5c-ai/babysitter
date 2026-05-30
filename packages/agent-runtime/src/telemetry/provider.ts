/**
 * InMemoryTelemetryProvider — in-process telemetry backend for development,
 * testing, and single-process agent runtimes.
 *
 * Stores spans in memory and supports flush/drain for export pipelines.
 */

import { randomUUID } from "node:crypto";
import type {
  TelemetryProvider,
  TelemetrySpan,
  TelemetryEvent,
  TelemetrySpanStartOptions,
} from "./types";
import { TelemetrySpanStatus } from "./types";

/**
 * Mutable internal representation of a span.
 *
 * The public TelemetrySpan interface is readonly; we maintain a writable
 * copy internally and freeze on output.
 */
interface MutableSpan {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: string;
  endTime?: string;
  status: TelemetrySpanStatus;
  attributes: Record<string, string | number | boolean>;
  events: TelemetryEvent[];
}

function toReadonly(span: MutableSpan): TelemetrySpan {
  return { ...span, attributes: { ...span.attributes }, events: [...span.events] };
}

/**
 * In-memory telemetry provider that satisfies the TelemetryProvider interface.
 *
 * - `startSpan` creates a new span and tracks it as active.
 * - `endSpan` marks a span as completed and moves it to the completed set.
 * - `recordEvent` appends a discrete event to an active span.
 * - `flush` returns all completed spans and clears the completed buffer.
 * - `getActiveSpans` returns all currently open (un-ended) spans.
 */
export class InMemoryTelemetryProvider implements TelemetryProvider {
  /** Active (in-flight) spans keyed by spanId. */
  private readonly active = new Map<string, MutableSpan>();
  /** Completed spans awaiting flush. */
  private readonly completed: MutableSpan[] = [];
  /** Maps spanId -> traceId so child spans inherit the parent's trace. */
  private readonly traceIndex = new Map<string, string>();

  // ---------- TelemetryProvider interface ----------

  async startSpan(name: string, parentSpanId?: string): Promise<TelemetrySpan>;
  async startSpan(name: string, options?: TelemetrySpanStartOptions): Promise<TelemetrySpan>;
  async startSpan(name: string, optionsOrParentSpanId?: string | TelemetrySpanStartOptions): Promise<TelemetrySpan> {
    const spanId = randomUUID();
    const options = typeof optionsOrParentSpanId === "string"
      ? { parentSpanId: optionsOrParentSpanId }
      : optionsOrParentSpanId;
    const parentSpanId = options?.traceContext?.spanId ?? options?.parentSpanId;
    let traceId: string;

    if (options?.traceContext) {
      traceId = options.traceContext.traceId;
    } else if (parentSpanId) {
      // Inherit traceId from the parent span.
      traceId = this.traceIndex.get(parentSpanId) ?? randomUUID();
    } else {
      traceId = randomUUID();
    }

    const span: MutableSpan = {
      name,
      traceId,
      spanId,
      parentSpanId,
      startTime: new Date().toISOString(),
      status: TelemetrySpanStatus.Unset,
      attributes: {
        ...options?.attributes,
        ...(options?.correlationId
          ? { "babysitter.correlation_id": options.correlationId }
          : {}),
        ...(options?.traceContext?.correlationId && !options?.correlationId
          ? { "babysitter.correlation_id": options.traceContext.correlationId }
          : {}),
      },
      events: [],
    };

    this.active.set(spanId, span);
    this.traceIndex.set(spanId, traceId);

    return toReadonly(span);
  }

  async endSpan(spanId: string, status?: TelemetrySpanStatus): Promise<void> {
    const span = this.active.get(spanId);
    if (!span) {
      return; // Silently ignore unknown/already-ended spans.
    }

    span.endTime = new Date().toISOString();
    span.status = status ?? TelemetrySpanStatus.Ok;

    this.active.delete(spanId);
    this.completed.push(span);
  }

  async recordEvent(spanId: string, event: TelemetryEvent): Promise<void> {
    const span = this.active.get(spanId);
    if (!span) {
      return; // Silently ignore events on unknown/ended spans.
    }

    span.events.push(event);
  }

  async flush(): Promise<void> {
    this.completed.length = 0;
  }

  /**
   * Drain completed spans — returns and clears the completed buffer.
   *
   * Unlike `flush()` (which satisfies the TelemetryProvider interface and
   * returns void), this method hands the span data back to the caller.
   */
  async drain(): Promise<TelemetrySpan[]> {
    return this.completed.splice(0).map(toReadonly);
  }

  // ---------- Extra helpers (not on interface) ----------

  /** Return a snapshot of all currently open (un-ended) spans. */
  getActiveSpans(): TelemetrySpan[] {
    return [...this.active.values()].map(toReadonly);
  }
}
