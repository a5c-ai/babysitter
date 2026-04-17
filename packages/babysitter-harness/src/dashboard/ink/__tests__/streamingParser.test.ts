/**
 * streamingParser.test.ts
 *
 * Tests for parseStreamingLine helper and formatTurnElapsed helper.
 * Verifies extraction of tool_use, tool_result, token_usage, and cost events
 * from harness JSON streaming output lines.
 */

import { describe, it, expect } from "vitest";
import {
  parseStreamingLine,
  formatTurnElapsed,
  formatTokenSummary,
} from "../helpers.js";
import type { StreamingEvent } from "../helpers.js";
import type { TokenUsage } from "../types.js";

// ---------------------------------------------------------------------------
// parseStreamingLine — tool events
// ---------------------------------------------------------------------------

describe("parseStreamingLine tool events", () => {
  it("parses tool_use event from JSON line", () => {
    const line = JSON.stringify({
      type: "content_block_start",
      content_block: { type: "tool_use", name: "Read", id: "tool-1" },
    });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("tool_start");
    if (event!.kind === "tool_start") {
      expect(event!.toolName).toBe("Read");
    }
  });

  it("parses tool_result event from JSON line", () => {
    const line = JSON.stringify({
      type: "content_block_stop",
      content_block: { type: "tool_use", name: "Edit", id: "tool-2" },
    });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("tool_end");
    if (event!.kind === "tool_end") {
      expect(event!.toolName).toBe("Edit");
    }
  });

  it("parses tool_use from flat format", () => {
    const line = JSON.stringify({ type: "tool_use", name: "Bash", id: "t-3" });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("tool_start");
  });
});

// ---------------------------------------------------------------------------
// parseStreamingLine — token events
// ---------------------------------------------------------------------------

describe("parseStreamingLine token events", () => {
  it("parses token_usage from message_delta", () => {
    const line = JSON.stringify({
      type: "message_delta",
      usage: { input_tokens: 1500, output_tokens: 300 },
    });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("token_update");
    if (event!.kind === "token_update") {
      expect(event!.inputTokens).toBe(1500);
      expect(event!.outputTokens).toBe(300);
    }
  });

  it("parses token_usage from message_start", () => {
    const line = JSON.stringify({
      type: "message_start",
      message: { usage: { input_tokens: 500, output_tokens: 0 } },
    });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("token_update");
  });

  it("parses usage field at top level", () => {
    const line = JSON.stringify({
      type: "usage",
      input_tokens: 2000,
      output_tokens: 500,
      cache_read_input_tokens: 100,
    });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("token_update");
    if (event!.kind === "token_update") {
      expect(event!.inputTokens).toBe(2000);
      expect(event!.outputTokens).toBe(500);
      expect(event!.cacheReadTokens).toBe(100);
    }
  });
});

// ---------------------------------------------------------------------------
// parseStreamingLine — cost events
// ---------------------------------------------------------------------------

describe("parseStreamingLine cost events", () => {
  it("parses cost field from message", () => {
    const line = JSON.stringify({
      type: "message_stop",
      cost: 0.0035,
    });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("cost_update");
    if (event!.kind === "cost_update") {
      expect(event!.cost).toBe(0.0035);
    }
  });
});

// ---------------------------------------------------------------------------
// parseStreamingLine — non-events
// ---------------------------------------------------------------------------

describe("parseStreamingLine non-events", () => {
  it("returns null for plain text lines", () => {
    expect(parseStreamingLine("Hello world")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseStreamingLine("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseStreamingLine("{not valid json")).toBeNull();
  });

  it("returns null for JSON without recognized type", () => {
    const line = JSON.stringify({ type: "ping" });
    expect(parseStreamingLine(line)).toBeNull();
  });

  it("returns null for JSON array", () => {
    expect(parseStreamingLine("[1,2,3]")).toBeNull();
  });

  it("returns text event for content_block_delta with text", () => {
    const line = JSON.stringify({
      type: "content_block_delta",
      delta: { type: "text_delta", text: "Hello" },
    });
    const event = parseStreamingLine(line);
    expect(event).not.toBeNull();
    expect(event!.kind).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// formatTurnElapsed
// ---------------------------------------------------------------------------

describe("formatTurnElapsed", () => {
  it("formats zero as 0s", () => {
    expect(formatTurnElapsed(0)).toBe("0s");
  });

  it("formats seconds only", () => {
    expect(formatTurnElapsed(5000)).toBe("5s");
  });

  it("formats minutes and seconds", () => {
    expect(formatTurnElapsed(90_000)).toBe("1m30s");
  });

  it("formats minutes without seconds when even", () => {
    expect(formatTurnElapsed(120_000)).toBe("2m0s");
  });

  it("formats large values", () => {
    expect(formatTurnElapsed(3_661_000)).toBe("61m1s");
  });
});

// ---------------------------------------------------------------------------
// StreamingEvent type discrimination
// ---------------------------------------------------------------------------

describe("StreamingEvent type discrimination", () => {
  it("tool_start has toolName and toolId", () => {
    const line = JSON.stringify({
      type: "tool_use",
      name: "Write",
      id: "t-1",
    });
    const event = parseStreamingLine(line) as StreamingEvent & { kind: "tool_start" };
    expect(event.toolName).toBe("Write");
    expect(event.toolId).toBe("t-1");
  });

  it("token_update has inputTokens and outputTokens", () => {
    const line = JSON.stringify({
      type: "message_delta",
      usage: { input_tokens: 100, output_tokens: 50 },
    });
    const event = parseStreamingLine(line) as StreamingEvent & { kind: "token_update" };
    expect(event.inputTokens).toBe(100);
    expect(event.outputTokens).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// formatTokenSummary
// ---------------------------------------------------------------------------

describe("formatTokenSummary", () => {
  it("formats basic input/output counts", () => {
    const usage: TokenUsage = { input: 1500, output: 300, total: 1800 };
    const result = formatTokenSummary(usage);
    expect(result).toContain("1.5k");
    expect(result).toContain("300");
  });

  it("formats with cache read tokens", () => {
    const usage: TokenUsage = { input: 2000, output: 500, total: 2500, cacheRead: 1000 };
    const result = formatTokenSummary(usage);
    expect(result).toContain("cache");
  });

  it("formats zero values", () => {
    const usage: TokenUsage = { input: 0, output: 0, total: 0 };
    const result = formatTokenSummary(usage);
    expect(result).toContain("0");
  });

  it("formats large values (millions)", () => {
    const usage: TokenUsage = { input: 1_500_000, output: 300_000, total: 1_800_000 };
    const result = formatTokenSummary(usage);
    expect(result).toContain("1.5M");
  });

  it("includes cache write when present", () => {
    const usage: TokenUsage = { input: 1000, output: 200, total: 1200, cacheWrite: 500 };
    const result = formatTokenSummary(usage);
    expect(result).toContain("cache");
  });

  it("omits cache info when not present", () => {
    const usage: TokenUsage = { input: 1000, output: 200, total: 1200 };
    const result = formatTokenSummary(usage);
    expect(result).not.toContain("cache");
  });
});
