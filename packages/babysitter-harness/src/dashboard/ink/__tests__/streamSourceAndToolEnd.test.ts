/**
 * streamSourceAndToolEnd.test.ts
 *
 * Tests for:
 * A) StreamingEvent source field (stdout/stderr distinction)
 * B) createStreamingParser stateful parser with tool_end fix
 * C) StreamCallbacks onLine receives stream source
 *
 * Phase 2: Stream source distinction and tool_end fix (Wave 8)
 */

import { describe, it, expect } from "vitest";
import {
  createStreamingParser,
  parseStreamingLine,
} from "../helpers.js";
import type { StreamCallbacks } from "../contexts/ChatContext.js";

// ---------------------------------------------------------------------------
// StreamCallbacks source parameter
// ---------------------------------------------------------------------------

describe("StreamCallbacks.onLine source parameter", () => {
  it("onLine signature accepts optional source parameter", () => {
    // StreamCallbacks.onLine should accept (line, source?) where source is 'stdout' | 'stderr'
    const callbacks: StreamCallbacks = {
      onLine: (line: string, source?: "stdout" | "stderr") => {
        expect(typeof line).toBe("string");
        if (source !== undefined) {
          expect(["stdout", "stderr"]).toContain(source);
        }
      },
    };
    callbacks.onLine?.("test line", "stdout");
    callbacks.onLine?.("error line", "stderr");
  });
});

// ---------------------------------------------------------------------------
// createStreamingParser — stateful parser
// ---------------------------------------------------------------------------

describe("createStreamingParser", () => {
  it("returns a parse function", () => {
    const parser = createStreamingParser();
    expect(typeof parser.parse).toBe("function");
  });

  it("parses regular events like parseStreamingLine", () => {
    const parser = createStreamingParser();
    const line = JSON.stringify({
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", name: "Read", id: "tb_100" },
    });
    const event = parser.parse(line);
    expect(event).toEqual({
      kind: "tool_start",
      toolName: "Read",
      toolId: "tb_100",
    });
  });

  it("tracks tool blocks by index and emits tool_end on content_block_stop", () => {
    const parser = createStreamingParser();

    // Start a tool block at index 1
    const startLine = JSON.stringify({
      type: "content_block_start",
      index: 1,
      content_block: { type: "tool_use", name: "Edit", id: "tb_200" },
    });
    const startEvent = parser.parse(startLine);
    expect(startEvent?.kind).toBe("tool_start");

    // Stop block at index 1 — no content_block field (real API behavior)
    const stopLine = JSON.stringify({
      type: "content_block_stop",
      index: 1,
    });
    const stopEvent = parser.parse(stopLine);
    expect(stopEvent).toEqual({
      kind: "tool_end",
      toolName: "Edit",
      toolId: "tb_200",
    });
  });

  it("does not emit tool_end for non-tool blocks", () => {
    const parser = createStreamingParser();

    // Start a text block at index 0
    const startLine = JSON.stringify({
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    });
    parser.parse(startLine);

    // Stop block at index 0
    const stopLine = JSON.stringify({
      type: "content_block_stop",
      index: 0,
    });
    const stopEvent = parser.parse(stopLine);
    // Should return null — it was a text block, not a tool_use block
    expect(stopEvent).toBeNull();
  });

  it("handles multiple tool blocks at different indices", () => {
    const parser = createStreamingParser();

    // Start tool at index 1
    parser.parse(JSON.stringify({
      type: "content_block_start",
      index: 1,
      content_block: { type: "tool_use", name: "Read", id: "tb_a" },
    }));

    // Start tool at index 3
    parser.parse(JSON.stringify({
      type: "content_block_start",
      index: 3,
      content_block: { type: "tool_use", name: "Write", id: "tb_b" },
    }));

    // Stop index 1
    const stop1 = parser.parse(JSON.stringify({
      type: "content_block_stop",
      index: 1,
    }));
    expect(stop1).toEqual({
      kind: "tool_end",
      toolName: "Read",
      toolId: "tb_a",
    });

    // Stop index 3
    const stop3 = parser.parse(JSON.stringify({
      type: "content_block_stop",
      index: 3,
    }));
    expect(stop3).toEqual({
      kind: "tool_end",
      toolName: "Write",
      toolId: "tb_b",
    });
  });

  it("cleans up tracked blocks after stop", () => {
    const parser = createStreamingParser();

    parser.parse(JSON.stringify({
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", name: "Bash", id: "tb_c" },
    }));

    parser.parse(JSON.stringify({
      type: "content_block_stop",
      index: 0,
    }));

    // Second stop at same index should return null (already cleaned up)
    const secondStop = parser.parse(JSON.stringify({
      type: "content_block_stop",
      index: 0,
    }));
    expect(secondStop).toBeNull();
  });

  it("accepts format parameter", () => {
    const parser = createStreamingParser("plain-text");
    const event = parser.parse("just plain text");
    expect(event).toEqual({ kind: "text", text: "just plain text" });
  });

  it("resets state via reset()", () => {
    const parser = createStreamingParser();

    parser.parse(JSON.stringify({
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", name: "Read", id: "tb_d" },
    }));

    parser.reset();

    // After reset, stop should not find the tracked block
    const stopEvent = parser.parse(JSON.stringify({
      type: "content_block_stop",
      index: 0,
    }));
    expect(stopEvent).toBeNull();
  });

  it("delegates non-block events to parseStreamingLine", () => {
    const parser = createStreamingParser();
    const line = JSON.stringify({ cost: 0.042 });
    const event = parser.parse(line);
    expect(event).toEqual({ kind: "cost_update", cost: 0.042 });
  });
});

// ---------------------------------------------------------------------------
// parseStreamingLine tool_end backward compatibility
// ---------------------------------------------------------------------------

describe("parseStreamingLine content_block_stop", () => {
  it("returns null for content_block_stop without content_block (stateless)", () => {
    // The stateless parseStreamingLine cannot resolve tool_end without
    // the content_block field — this is expected behavior. Use
    // createStreamingParser for stateful tracking.
    const line = JSON.stringify({
      type: "content_block_stop",
      index: 1,
    });
    expect(parseStreamingLine(line)).toBeNull();
  });

  it("still handles content_block_stop WITH content_block for backward compat", () => {
    // If some implementation does include content_block, it should still work
    const line = JSON.stringify({
      type: "content_block_stop",
      content_block: { type: "tool_use", name: "Grep", id: "tb_e" },
    });
    expect(parseStreamingLine(line)).toEqual({
      kind: "tool_end",
      toolName: "Grep",
      toolId: "tb_e",
    });
  });
});
