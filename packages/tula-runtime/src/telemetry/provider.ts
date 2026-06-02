/**
 * InMemoryTelemetryProvider — in-process telemetry backend for development,
 * testing, and single-process agent runtimes.
 *
 * Stores spans in memory and supports flush/drain for export pipelines.
 */

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type {
  TelemetryExporter,
  TelemetryExportResult,
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

export interface InMemoryTelemetryProviderOptions {
  exporters?: TelemetryExporter[];
}

export class FileTelemetryExporter implements TelemetryExporter {
  constructor(private readonly filePath: string) {}

  async export(spans: readonly TelemetrySpan[]): Promise<TelemetryExportResult> {
    if (spans.length === 0) return { ok: true, exported: 0 };
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const payload = spans.map((span) => JSON.stringify(redactSpan(span))).join("\n") + "\n";
    await fs.appendFile(this.filePath, payload, "utf-8");
    return { ok: true, exported: spans.length };
  }
}

export type HttpTelemetrySend = (url: string, payload: unknown) => Promise<void>;

export class HttpTelemetryExporter implements TelemetryExporter {
  constructor(
    private readonly url: string,
    private readonly send: HttpTelemetrySend = defaultHttpSend,
  ) {}

  async export(spans: readonly TelemetrySpan[]): Promise<TelemetryExportResult> {
    if (spans.length === 0) return { ok: true, exported: 0 };
    await this.send(this.url, toOtlpPayload(spans.map(redactSpan)));
    return { ok: true, exported: spans.length };
  }
}

function toReadonly(span: MutableSpan): TelemetrySpan {
  return {
    ...span,
    attributes: { ...span.attributes },
    events: span.events.map((event) => ({
      ...event,
      attributes: event.attributes ? { ...event.attributes } : undefined,
    })),
  };
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
  private readonly exporters: TelemetryExporter[];

  constructor(options?: InMemoryTelemetryProviderOptions) {
    this.exporters = options?.exporters ?? [];
  }

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
    const spans = this.completed.map(toReadonly);
    for (const exporter of this.exporters) {
      await exporter.export(spans);
    }
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

function redactSpan(span: TelemetrySpan): TelemetrySpan {
  return {
    ...span,
    attributes: redactAttributes(span.attributes),
    events: span.events.map((event) => ({
      ...event,
      attributes: event.attributes ? redactAttributes(event.attributes) : undefined,
    })),
  };
}

function redactAttributes(
  attributes: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [
      key,
      isSecretKey(key) || (typeof value === "string" && looksSecretValue(value))
        ? "[REDACTED]"
        : value,
    ]),
  );
}

function isSecretKey(key: string): boolean {
  return /(token|secret|password|api[_-]?key|authorization|credential)/i.test(key);
}

function looksSecretValue(value: string): boolean {
  return /(bearer\s+\S+|token=\S+|password=\S+|secret=\S+)/i.test(value);
}

function toOtlpPayload(spans: readonly TelemetrySpan[]): unknown {
  return {
    resourceSpans: [
      {
        resource: { attributes: [] },
        scopeSpans: [
          {
            scope: { name: "@a5c-ai/tula-runtime" },
            spans: spans.map((span) => ({
              traceId: span.traceId,
              spanId: span.spanId,
              parentSpanId: span.parentSpanId,
              name: span.name,
              startTimeUnixNano: isoToUnixNano(span.startTime),
              endTimeUnixNano: span.endTime ? isoToUnixNano(span.endTime) : undefined,
              status: { code: span.status },
              attributes: toOtlpAttributes(span.attributes),
              events: span.events.map((event) => ({
                name: event.name,
                timeUnixNano: isoToUnixNano(event.timestamp),
                attributes: event.attributes ? toOtlpAttributes(event.attributes) : [],
              })),
            })),
          },
        ],
      },
    ],
  };
}

function toOtlpAttributes(attributes: Record<string, string | number | boolean>): Array<{ key: string; value: unknown }> {
  return Object.entries(attributes).map(([key, value]) => ({
    key,
    value: typeof value === "string"
      ? { stringValue: value }
      : typeof value === "number"
        ? { doubleValue: value }
        : { boolValue: value },
  }));
}

function isoToUnixNano(value: string): string {
  return String(BigInt(new Date(value).getTime()) * 1_000_000n);
}

async function defaultHttpSend(url: string, payload: unknown): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Telemetry export failed with HTTP ${response.status}`);
  }
}
