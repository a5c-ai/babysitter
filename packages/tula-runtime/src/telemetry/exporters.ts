import { promises as fs } from "node:fs";
import * as path from "node:path";
import type {
  TelemetryExporter,
  TelemetryExportResult,
  TelemetrySpan,
} from "./types";

export class NoopTelemetryExporter implements TelemetryExporter {
  async export(spans: readonly TelemetrySpan[]): Promise<TelemetryExportResult> {
    return { ok: true, exported: spans.length };
  }

  async flush(): Promise<TelemetryExportResult> {
    return { ok: true, exported: 0 };
  }
}

export class InMemoryTelemetryExporter implements TelemetryExporter {
  private readonly spans: TelemetrySpan[] = [];

  async export(spans: readonly TelemetrySpan[]): Promise<TelemetryExportResult> {
    this.spans.push(...spans.map(cloneSpan));
    return { ok: true, exported: spans.length };
  }

  getSpans(): TelemetrySpan[] {
    return this.spans.map(cloneSpan);
  }

  clear(): void {
    this.spans.length = 0;
  }
}

export class FileTelemetryExporter implements TelemetryExporter {
  constructor(private readonly filePath: string) {}

  async export(spans: readonly TelemetrySpan[]): Promise<TelemetryExportResult> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const lines = spans.map((span) => JSON.stringify(span)).join("\n");
    if (lines) {
      await fs.appendFile(this.filePath, `${lines}\n`, "utf-8");
    }
    return { ok: true, exported: spans.length };
  }
}

export interface OtlpHttpTraceExporterOptions {
  endpoint: string;
  headers?: Record<string, string>;
  fetch?: (input: string, init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }) => Promise<{ ok: boolean; status: number; text?: () => Promise<string> }>;
}

export class OtlpHttpTraceExporter implements TelemetryExporter {
  constructor(private readonly options: OtlpHttpTraceExporterOptions) {}

  async export(spans: readonly TelemetrySpan[]): Promise<TelemetryExportResult> {
    const fetchImpl = this.options.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
      return { ok: false, exported: 0, error: "fetch is not available" };
    }

    try {
      const response = await fetchImpl(this.options.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...this.options.headers,
        },
        body: JSON.stringify({ resourceSpans: spans.map(toOtlpSpan) }),
      });
      if (!response.ok) {
        const text = response.text ? await response.text() : "";
        return {
          ok: false,
          exported: 0,
          error: `OTLP HTTP export failed with status ${response.status}${text ? `: ${text}` : ""}`,
        };
      }
      return { ok: true, exported: spans.length };
    } catch (error) {
      return {
        ok: false,
        exported: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

function cloneSpan(span: TelemetrySpan): TelemetrySpan {
  return {
    ...span,
    attributes: { ...span.attributes },
    events: span.events.map((event) => ({
      ...event,
      attributes: event.attributes ? { ...event.attributes } : undefined,
    })),
  };
}

function toOtlpSpan(span: TelemetrySpan): Record<string, unknown> {
  return {
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    name: span.name,
    startTimeUnixNano: Date.parse(span.startTime) * 1_000_000,
    endTimeUnixNano: span.endTime ? Date.parse(span.endTime) * 1_000_000 : undefined,
    status: { code: span.status },
    attributes: Object.entries(span.attributes).map(([key, value]) => ({
      key,
      value,
    })),
    events: span.events,
  };
}
