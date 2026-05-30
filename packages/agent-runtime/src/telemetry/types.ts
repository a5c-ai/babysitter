/**
 * OpenTelemetry-aligned structured telemetry interfaces for Babysitter Agent Runtime.
 *
 * These are interface-only type stubs — implementations will follow in issue #217.
 */

// ---------------------------------------------------------------------------
// Span Status
// ---------------------------------------------------------------------------

/** Status of a telemetry span, aligned with OpenTelemetry StatusCode. */
export enum TelemetrySpanStatus {
  /** The span completed without error. */
  Ok = "Ok",
  /** The span ended with an error. */
  Error = "Error",
  /** Status has not been explicitly set (default). */
  Unset = "Unset",
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** A discrete event recorded within a span. */
export interface TelemetryEvent {
  /** Human-readable event name. */
  readonly name: string;
  /** ISO-8601 timestamp of when the event occurred. */
  readonly timestamp: string;
  /** Optional key-value attributes attached to the event. */
  readonly attributes?: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------------
// Spans
// ---------------------------------------------------------------------------

/** A unit of work within a trace, aligned with the OpenTelemetry Span model. */
export interface TelemetrySpan {
  /** Human-readable span name. */
  readonly name: string;
  /** Trace identifier shared across the entire distributed trace. */
  readonly traceId: string;
  /** Unique identifier for this span within the trace. */
  readonly spanId: string;
  /** Span ID of the parent span, if this is a child span. */
  readonly parentSpanId?: string;
  /** ISO-8601 timestamp when the span started. */
  readonly startTime: string;
  /** ISO-8601 timestamp when the span ended; undefined while in-flight. */
  readonly endTime?: string;
  /** Terminal status of the span. */
  readonly status: TelemetrySpanStatus;
  /** Key-value attributes attached to the span. */
  readonly attributes: Record<string, string | number | boolean>;
  /** Discrete events recorded during the span's lifetime. */
  readonly events: TelemetryEvent[];
}

export interface TraceContext {
  readonly version: "00";
  readonly traceId: string;
  readonly spanId: string;
  readonly traceFlags: string;
  readonly parentSpanId?: string;
  readonly correlationId?: string;
}

export interface TelemetrySpanStartOptions {
  readonly parentSpanId?: string;
  readonly traceContext?: TraceContext;
  readonly correlationId?: string;
  readonly attributes?: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/** Abstraction over a telemetry backend (e.g. OTLP exporter, console, no-op). */
export interface TelemetryProvider {
  /**
   * Begin a new span.
   *
   * @param name - Human-readable span name.
   * @param parentSpanId - Optional parent span to nest under.
   * @returns The newly created span.
   */
  startSpan(name: string, parentSpanId?: string): Promise<TelemetrySpan>;
  startSpan(name: string, options?: TelemetrySpanStartOptions): Promise<TelemetrySpan>;

  /**
   * End an in-flight span.
   *
   * @param spanId - ID of the span to end.
   * @param status - Terminal status; defaults to `Ok` if omitted.
   */
  endSpan(spanId: string, status?: TelemetrySpanStatus): Promise<void>;

  /**
   * Record a discrete event on an active span.
   *
   * @param spanId - ID of the span to attach the event to.
   * @param event - The event payload.
   */
  recordEvent(spanId: string, event: TelemetryEvent): Promise<void>;

  /**
   * Flush any buffered telemetry data to the configured exporters.
   */
  flush(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Configuration for the telemetry subsystem. */
export interface TelemetryConfig {
  /** Whether telemetry collection is enabled. */
  readonly enabled: boolean;
  /** Provider implementation to use; when absent a no-op provider is assumed. */
  readonly provider?: TelemetryProvider;
  /** Sampling rate between 0 (none) and 1 (all traces). */
  readonly sampleRate?: number;
  /** Named exporters to send telemetry data to (e.g. "otlp", "console", "file"). */
  readonly exporters?: string[];
}

export interface TelemetryExportResult {
  readonly ok: boolean;
  readonly exported: number;
  readonly error?: string;
}

export interface TelemetryExporter {
  export(spans: readonly TelemetrySpan[]): Promise<TelemetryExportResult>;
  flush?(): Promise<TelemetryExportResult>;
}
