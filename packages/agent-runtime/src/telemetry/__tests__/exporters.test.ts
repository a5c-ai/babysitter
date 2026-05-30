import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FileTelemetryExporter,
  InMemoryTelemetryExporter,
  NoopTelemetryExporter,
  OtlpHttpTraceExporter,
} from "../exporters";
import { TelemetrySpanStatus, type TelemetrySpan } from "../types";

function span(overrides: Partial<TelemetrySpan> = {}): TelemetrySpan {
  return {
    name: "test-span",
    traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
    spanId: "00f067aa0ba902b7",
    startTime: "2026-01-01T00:00:00.000Z",
    endTime: "2026-01-01T00:00:01.000Z",
    status: TelemetrySpanStatus.Ok,
    attributes: { "babysitter.correlation_id": "corr-1" },
    events: [],
    ...overrides,
  };
}

describe("telemetry exporters", () => {
  it("keeps no-op export safe by default", async () => {
    const exporter = new NoopTelemetryExporter();

    await expect(exporter.export([span()])).resolves.toEqual({ ok: true, exported: 1 });
    await expect(exporter.flush()).resolves.toEqual({ ok: true, exported: 0 });
  });

  it("stores exported spans in memory for tests and offline inspection", async () => {
    const exporter = new InMemoryTelemetryExporter();

    await exporter.export([span({ name: "one" }), span({ name: "two" })]);

    expect(exporter.getSpans().map((item) => item.name)).toEqual(["one", "two"]);
  });

  it("writes spans as local JSONL without remote telemetry services", async () => {
    const dir = await mkdtemp(join(tmpdir(), "agent-runtime-exporter-"));
    const file = join(dir, "spans.jsonl");
    const exporter = new FileTelemetryExporter(file);

    await exporter.export([span()]);

    const lines = (await readFile(file, "utf-8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ name: "test-span", spanId: "00f067aa0ba902b7" });
  });

  it("isolates OTLP HTTP exporter failures from daemon startup paths", async () => {
    const exporter = new OtlpHttpTraceExporter({
      endpoint: "http://127.0.0.1:4318/v1/traces",
      fetch: async () => {
        throw new Error("collector offline");
      },
    });

    await expect(exporter.export([span()])).resolves.toMatchObject({
      ok: false,
      exported: 0,
      error: "collector offline",
    });
  });
});
