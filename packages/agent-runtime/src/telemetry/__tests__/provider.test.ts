import { describe, it, expect } from "vitest";
import { InMemoryTelemetryProvider } from "../provider";
import { TelemetrySpanStatus } from "../types";
import { AuditLog } from "../audit-log";
import { SpanTree } from "../span-tree";
import type { TelemetrySpan } from "../types";

// ---------------------------------------------------------------------------
// InMemoryTelemetryProvider
// ---------------------------------------------------------------------------

describe("InMemoryTelemetryProvider", () => {
  it("startSpan creates a span with id, name, and traceId", async () => {
    const provider = new InMemoryTelemetryProvider();
    const span = await provider.startSpan("test-span");

    expect(span.spanId).toBeDefined();
    expect(span.name).toBe("test-span");
    expect(span.traceId).toBeDefined();
    expect(span.status).toBe(TelemetrySpanStatus.Unset);
    expect(span.startTime).toBeDefined();
    expect(span.endTime).toBeUndefined();
  });

  it("endSpan marks span as completed with endTime", async () => {
    const provider = new InMemoryTelemetryProvider();
    const span = await provider.startSpan("my-span");

    await provider.endSpan(span.spanId, TelemetrySpanStatus.Ok);

    // The span should have moved from active to completed
    const active = provider.getActiveSpans();
    expect(active).toHaveLength(0);

    const drained = await provider.drain();
    expect(drained).toHaveLength(1);
    expect(drained[0].endTime).toBeDefined();
    expect(drained[0].status).toBe(TelemetrySpanStatus.Ok);
  });

  it("recordEvent appends an event to the span", async () => {
    const provider = new InMemoryTelemetryProvider();
    const span = await provider.startSpan("event-span");

    await provider.recordEvent(span.spanId, {
      name: "checkpoint",
      timestamp: new Date().toISOString(),
      attributes: { step: 1 },
    });

    const active = provider.getActiveSpans();
    expect(active).toHaveLength(1);
    expect(active[0].events).toHaveLength(1);
    expect(active[0].events[0].name).toBe("checkpoint");
  });

  it("flush clears the completed buffer", async () => {
    const provider = new InMemoryTelemetryProvider();
    const span = await provider.startSpan("flush-span");
    await provider.endSpan(span.spanId);

    await provider.flush();

    // drain should return empty after flush
    const drained = await provider.drain();
    expect(drained).toHaveLength(0);
  });

  it("getActiveSpans returns only open spans", async () => {
    const provider = new InMemoryTelemetryProvider();
    const s1 = await provider.startSpan("s1");
    await provider.startSpan("s2");

    expect(provider.getActiveSpans()).toHaveLength(2);

    await provider.endSpan(s1.spanId);
    expect(provider.getActiveSpans()).toHaveLength(1);
    expect(provider.getActiveSpans()[0].name).toBe("s2");
  });

  it("child span inherits traceId from parent", async () => {
    const provider = new InMemoryTelemetryProvider();
    const parent = await provider.startSpan("parent");
    const child = await provider.startSpan("child", parent.spanId);

    expect(child.traceId).toBe(parent.traceId);
    expect(child.parentSpanId).toBe(parent.spanId);
  });

  it("starts spans from propagated W3C context and attaches correlation IDs", async () => {
    const provider = new InMemoryTelemetryProvider();
    const span = await provider.startSpan("propagated", {
      traceContext: {
        version: "00",
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7",
        traceFlags: "01",
      },
      correlationId: "corr-123",
      attributes: { component: "agent-runtime" },
    });

    expect(span.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(span.parentSpanId).toBe("00f067aa0ba902b7");
    expect(span.attributes).toMatchObject({
      "babysitter.correlation_id": "corr-123",
      component: "agent-runtime",
    });
  });
});

// ---------------------------------------------------------------------------
// AuditLog
// ---------------------------------------------------------------------------

describe("AuditLog", () => {
  it("record adds an entry and getEntries returns all entries", () => {
    const log = new AuditLog();

    log.record({ actor: "agent-1", action: "spawn", target: "task-42" });
    log.record({ actor: "user", action: "approve", target: "task-42" });

    const entries = log.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].actor).toBe("agent-1");
    expect(entries[0].timestamp).toBeDefined();
    expect(log.size).toBe(2);
  });

  it("getEntries filters by actor", () => {
    const log = new AuditLog();

    log.record({ actor: "agent-1", action: "spawn", target: "t1" });
    log.record({ actor: "agent-2", action: "spawn", target: "t2" });
    log.record({ actor: "agent-1", action: "destroy", target: "t1" });

    const filtered = log.getEntries({ actor: "agent-1" });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e) => e.actor === "agent-1")).toBe(true);
  });

  it("getEntries filters by action", () => {
    const log = new AuditLog();

    log.record({ actor: "a", action: "spawn", target: "t1" });
    log.record({ actor: "b", action: "destroy", target: "t2" });
    log.record({ actor: "a", action: "spawn", target: "t3" });

    const filtered = log.getEntries({ action: "spawn" });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e) => e.action === "spawn")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SpanTree
// ---------------------------------------------------------------------------

describe("SpanTree", () => {
  function makeSpan(overrides: Partial<TelemetrySpan> & { spanId: string; name: string; traceId: string }): TelemetrySpan {
    return {
      startTime: new Date().toISOString(),
      status: TelemetrySpanStatus.Ok,
      attributes: {},
      events: [],
      ...overrides,
    };
  }

  it("addSpan + getRoots returns top-level spans", () => {
    const tree = new SpanTree();

    const root1 = makeSpan({ spanId: "r1", name: "root1", traceId: "t1" });
    const root2 = makeSpan({ spanId: "r2", name: "root2", traceId: "t1" });

    tree.addSpan(root1);
    tree.addSpan(root2);

    const roots = tree.getRoots();
    expect(roots).toHaveLength(2);
    expect(roots.map((r) => r.spanId)).toEqual(["r1", "r2"]);
  });

  it("getChildren returns direct children of a span", () => {
    const tree = new SpanTree();

    const root = makeSpan({ spanId: "r1", name: "root", traceId: "t1" });
    const child1 = makeSpan({ spanId: "c1", name: "child1", traceId: "t1", parentSpanId: "r1" });
    const child2 = makeSpan({ spanId: "c2", name: "child2", traceId: "t1", parentSpanId: "r1" });

    tree.addSpan(root);
    tree.addSpan(child1);
    tree.addSpan(child2);

    const children = tree.getChildren("r1");
    expect(children).toHaveLength(2);
    expect(children.map((c) => c.spanId)).toEqual(["c1", "c2"]);
  });

  it("toJSON produces a serializable tree structure", () => {
    const tree = new SpanTree();

    const root = makeSpan({ spanId: "r1", name: "root", traceId: "t1" });
    const child = makeSpan({ spanId: "c1", name: "child", traceId: "t1", parentSpanId: "r1" });

    tree.addSpan(root);
    tree.addSpan(child);

    const json = tree.toJSON();
    expect(json).toHaveLength(1);
    expect(json[0].spanId).toBe("r1");
    expect(json[0].children).toHaveLength(1);
    expect(json[0].children[0].spanId).toBe("c1");
  });
});
