/**
 * GAP-PERF-004: Streaming Renderer tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  StreamingRenderer,
  type StreamChunk,
  type StreamChunkType,
} from "../streamingRenderer";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StreamingRenderer", () => {
  let renderer: StreamingRenderer;

  beforeEach(() => {
    renderer = new StreamingRenderer();
  });

  // ---- push ----

  it("pushes chunks into the buffer", () => {
    renderer.push("text", "Hello");
    renderer.push("text", " world");
    expect(renderer.size).toBe(2);
  });

  it("assigns sequential seq numbers", () => {
    const c1 = renderer.push("text", "first");
    const c2 = renderer.push("text", "second");
    const c3 = renderer.push("tool_use", "third");
    expect(c1.seq).toBe(0);
    expect(c2.seq).toBe(1);
    expect(c3.seq).toBe(2);
  });

  it("sets chunk type, content, and timestamp", () => {
    const chunk = renderer.push("thinking", "analyzing...");
    expect(chunk.type).toBe("thinking" satisfies StreamChunkType);
    expect(chunk.content).toBe("analyzing...");
    expect(chunk.timestamp).toBeDefined();
    expect(new Date(chunk.timestamp).getTime()).not.toBeNaN();
  });

  // ---- onChunk ----

  it("dispatches chunks to registered listeners", () => {
    const received: StreamChunk[] = [];
    renderer.onChunk((chunk) => received.push(chunk));

    renderer.push("text", "hello");
    renderer.push("text", "world");

    expect(received).toHaveLength(2);
    expect(received[0]!.content).toBe("hello");
    expect(received[1]!.content).toBe("world");
  });

  it("supports multiple listeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    renderer.onChunk(listener1);
    renderer.onChunk(listener2);

    renderer.push("text", "data");

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it("unsubscribes a listener via returned function", () => {
    const listener = vi.fn();
    const unsub = renderer.onChunk(listener);

    renderer.push("text", "before");
    unsub();
    renderer.push("text", "after");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  // ---- flush ----

  it("returns all buffered chunks and clears the buffer", () => {
    renderer.push("text", "a");
    renderer.push("text", "b");

    const flushed = renderer.flush();
    expect(flushed).toHaveLength(2);
    expect(flushed[0]!.content).toBe("a");
    expect(flushed[1]!.content).toBe("b");
    expect(renderer.size).toBe(0);
  });

  it("returns empty array when buffer is empty", () => {
    const flushed = renderer.flush();
    expect(flushed).toHaveLength(0);
  });

  // ---- getBuffer ----

  it("returns buffer contents without clearing", () => {
    renderer.push("text", "persistent");
    const buffer = renderer.getBuffer();
    expect(buffer).toHaveLength(1);
    expect(renderer.size).toBe(1); // Not cleared
  });

  it("returns a copy (not a reference to the internal buffer)", () => {
    renderer.push("text", "item");
    const buffer = renderer.getBuffer();
    // Mutating the copy should not affect the renderer
    (buffer as StreamChunk[]).pop();
    expect(renderer.size).toBe(1);
  });

  // ---- getByType ----

  it("filters chunks by type", () => {
    renderer.push("text", "hello");
    renderer.push("tool_use", "grep");
    renderer.push("text", "world");
    renderer.push("error", "oops");

    const textChunks = renderer.getByType("text");
    expect(textChunks).toHaveLength(2);
    expect(textChunks.every((c) => c.type === "text")).toBe(true);

    const errorChunks = renderer.getByType("error");
    expect(errorChunks).toHaveLength(1);
    expect(errorChunks[0]!.content).toBe("oops");
  });

  it("returns empty array for type with no chunks", () => {
    renderer.push("text", "data");
    expect(renderer.getByType("thinking")).toHaveLength(0);
  });

  // ---- size ----

  it("reports correct size", () => {
    expect(renderer.size).toBe(0);
    renderer.push("text", "a");
    expect(renderer.size).toBe(1);
    renderer.push("text", "b");
    expect(renderer.size).toBe(2);
    renderer.flush();
    expect(renderer.size).toBe(0);
  });

  // ---- reset ----

  it("clears buffer and resets sequence counter", () => {
    renderer.push("text", "a");
    renderer.push("text", "b");
    renderer.reset();

    expect(renderer.size).toBe(0);
    const chunk = renderer.push("text", "c");
    expect(chunk.seq).toBe(0); // Reset to 0
  });

  // ---- all chunk types ----

  it("supports all chunk types", () => {
    const types: StreamChunkType[] = ["text", "tool_use", "tool_result", "thinking", "error"];
    for (const type of types) {
      const chunk = renderer.push(type, `content-${type}`);
      expect(chunk.type).toBe(type);
    }
    expect(renderer.size).toBe(types.length);
  });
});
