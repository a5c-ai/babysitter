/**
 * harnessStreamingProtocol.test.ts
 *
 * Tests for harness-aware streaming protocol types and parseStreamingLine
 * format parameter.
 *
 * Phase 1: Harness streaming protocol types (Wave 8)
 */

import { describe, it, expect } from "vitest";
import {
  parseStreamingLine,
  getHarnessStreamingFormat,
  HARNESS_STREAMING_FORMATS,
} from "../helpers.js";
import type { HarnessStreamingFormat } from "../helpers.js";

// ---------------------------------------------------------------------------
// HarnessStreamingFormat type + mapping
// ---------------------------------------------------------------------------

describe("HARNESS_STREAMING_FORMATS", () => {
  it("maps claude-code to anthropic-sse", () => {
    expect(HARNESS_STREAMING_FORMATS["claude-code"]).toBe("anthropic-sse");
  });

  it("maps internal to anthropic-sse", () => {
    expect(HARNESS_STREAMING_FORMATS["internal"]).toBe("anthropic-sse");
  });

  it("maps codex to codex-json", () => {
    expect(HARNESS_STREAMING_FORMATS["codex"]).toBe("codex-json");
  });

  it("maps gemini-cli to plain-text", () => {
    expect(HARNESS_STREAMING_FORMATS["gemini-cli"]).toBe("plain-text");
  });

  it("maps cursor to plain-text", () => {
    expect(HARNESS_STREAMING_FORMATS["cursor"]).toBe("plain-text");
  });

  it("maps github-copilot to plain-text", () => {
    expect(HARNESS_STREAMING_FORMATS["github-copilot"]).toBe("plain-text");
  });

  it("maps opencode to plain-text", () => {
    expect(HARNESS_STREAMING_FORMATS["opencode"]).toBe("plain-text");
  });
});

describe("getHarnessStreamingFormat", () => {
  it("returns mapped format for known harness", () => {
    expect(getHarnessStreamingFormat("claude-code")).toBe("anthropic-sse");
  });

  it("returns plain-text for unknown harness", () => {
    expect(getHarnessStreamingFormat("some-unknown-harness")).toBe("plain-text");
  });

  it("returns anthropic-sse for internal", () => {
    expect(getHarnessStreamingFormat("internal")).toBe("anthropic-sse");
  });
});

// ---------------------------------------------------------------------------
// parseStreamingLine with format parameter
// ---------------------------------------------------------------------------

describe("parseStreamingLine with format parameter", () => {
  describe("anthropic-sse format (default)", () => {
    it("parses content_block_start tool_use as before", () => {
      const line = JSON.stringify({
        type: "content_block_start",
        content_block: { type: "tool_use", name: "Read", id: "tb_123" },
      });
      const event = parseStreamingLine(line, "anthropic-sse");
      expect(event).toEqual({
        kind: "tool_start",
        toolName: "Read",
        toolId: "tb_123",
      });
    });

    it("parses message_delta with usage", () => {
      const line = JSON.stringify({
        type: "message_delta",
        usage: { input_tokens: 100, output_tokens: 50 },
      });
      const event = parseStreamingLine(line, "anthropic-sse");
      expect(event).toEqual({
        kind: "token_update",
        inputTokens: 100,
        outputTokens: 50,
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
      });
    });

    it("preserves backward compatibility when format is omitted", () => {
      const line = JSON.stringify({
        type: "content_block_start",
        content_block: { type: "tool_use", name: "Edit", id: "tb_456" },
      });
      const event = parseStreamingLine(line);
      expect(event).toEqual({
        kind: "tool_start",
        toolName: "Edit",
        toolId: "tb_456",
      });
    });
  });

  describe("plain-text format", () => {
    it("returns text event for any non-empty line", () => {
      const event = parseStreamingLine("Hello, world!", "plain-text");
      expect(event).toEqual({ kind: "text", text: "Hello, world!" });
    });

    it("returns text event even for JSON-looking lines", () => {
      const line = JSON.stringify({ type: "content_block_start" });
      const event = parseStreamingLine(line, "plain-text");
      expect(event).toEqual({ kind: "text", text: line });
    });

    it("returns null for empty lines", () => {
      expect(parseStreamingLine("", "plain-text")).toBeNull();
    });
  });

  describe("codex-json format", () => {
    it("parses codex message event with content as text", () => {
      const line = JSON.stringify({
        type: "message",
        content: "Here is the fix for the bug.",
      });
      const event = parseStreamingLine(line, "codex-json");
      expect(event).toEqual({ kind: "text", text: "Here is the fix for the bug." });
    });

    it("parses codex tool_use event as tool_start", () => {
      const line = JSON.stringify({
        type: "tool_use",
        name: "shell",
        id: "call_abc",
      });
      const event = parseStreamingLine(line, "codex-json");
      expect(event).toEqual({
        kind: "tool_start",
        toolName: "shell",
        toolId: "call_abc",
      });
    });

    it("parses codex tool_result event as tool_end", () => {
      const line = JSON.stringify({
        type: "tool_result",
        name: "shell",
        id: "call_abc",
      });
      const event = parseStreamingLine(line, "codex-json");
      expect(event).toEqual({
        kind: "tool_end",
        toolName: "shell",
        toolId: "call_abc",
      });
    });

    it("falls back to anthropic-sse parsing for unrecognized codex events", () => {
      const line = JSON.stringify({
        type: "message_delta",
        usage: { input_tokens: 200, output_tokens: 100 },
      });
      const event = parseStreamingLine(line, "codex-json");
      expect(event).toEqual({
        kind: "token_update",
        inputTokens: 200,
        outputTokens: 100,
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
      });
    });

    it("returns null for empty lines", () => {
      expect(parseStreamingLine("", "codex-json")).toBeNull();
    });
  });

  describe("generic-json format", () => {
    it("parses any JSON with text/content field as text event", () => {
      const line = JSON.stringify({ type: "response", text: "Generated code here" });
      const event = parseStreamingLine(line, "generic-json");
      expect(event).toEqual({ kind: "text", text: "Generated code here" });
    });

    it("parses JSON with content field as text event", () => {
      const line = JSON.stringify({ type: "chunk", content: "Some output" });
      const event = parseStreamingLine(line, "generic-json");
      expect(event).toEqual({ kind: "text", text: "Some output" });
    });

    it("falls through to anthropic-sse for recognized SSE types", () => {
      const line = JSON.stringify({
        type: "content_block_start",
        content_block: { type: "tool_use", name: "Bash", id: "tb_789" },
      });
      const event = parseStreamingLine(line, "generic-json");
      expect(event).toEqual({
        kind: "tool_start",
        toolName: "Bash",
        toolId: "tb_789",
      });
    });

    it("returns null for non-JSON lines", () => {
      expect(parseStreamingLine("plain text here", "generic-json")).toBeNull();
    });

    it("returns null for empty lines", () => {
      expect(parseStreamingLine("", "generic-json")).toBeNull();
    });
  });
});
