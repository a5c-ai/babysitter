import { describe, expect, it } from "vitest";
import {
  createTraceContext,
  parseTraceParent,
  serializeTraceParent,
} from "../traceContext";

describe("W3C trace context helpers", () => {
  it("parses and serializes a valid traceparent header", () => {
    const header = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

    const context = parseTraceParent(header);

    expect(context).toEqual({
      version: "00",
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7",
      traceFlags: "01",
    });
    expect(serializeTraceParent(context!)).toBe(header);
  });

  it("rejects malformed and all-zero traceparent identifiers", () => {
    expect(parseTraceParent("not-a-traceparent")).toBeNull();
    expect(parseTraceParent("00-00000000000000000000000000000000-00f067aa0ba902b7-01")).toBeNull();
    expect(parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01")).toBeNull();
  });

  it("creates trace context with optional propagated parent and correlation id", () => {
    const parent = parseTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")!;

    const child = createTraceContext({ parent, correlationId: "corr-123" });

    expect(child.traceId).toBe(parent.traceId);
    expect(child.parentSpanId).toBe(parent.spanId);
    expect(child.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(child.correlationId).toBe("corr-123");
  });
});
