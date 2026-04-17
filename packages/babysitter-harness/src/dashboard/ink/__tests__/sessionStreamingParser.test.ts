/**
 * sessionStreamingParser.test.ts
 *
 * Tests verifying that SessionView should use createStreamingParser
 * with getHarnessStreamingFormat instead of stateless parseStreamingLine.
 *
 * Phase 1: Wire createStreamingParser in SessionView (Wave 9)
 */

import { describe, it, expect } from "vitest";
import {
  createStreamingParser,
  getHarnessStreamingFormat,
  parseStreamingLine,
} from "../helpers.js";

describe("SessionView streaming parser integration", () => {
  describe("harness-aware format selection", () => {
    it("claude-code format is anthropic-sse", () => {
      const format = getHarnessStreamingFormat("claude-code");
      expect(format).toBe("anthropic-sse");
    });

    it("gemini-cli format is plain-text", () => {
      const format = getHarnessStreamingFormat("gemini-cli");
      expect(format).toBe("plain-text");
    });

    it("internal format is anthropic-sse", () => {
      const format = getHarnessStreamingFormat("internal");
      expect(format).toBe("anthropic-sse");
    });
  });

  describe("stateful parser resolves tool_end correctly", () => {
    it("content_block_stop emits tool_end via stateful parser", () => {
      const parser = createStreamingParser("anthropic-sse");

      // Start a tool block
      parser.parse(JSON.stringify({
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", name: "Edit", id: "tb_001" },
      }));

      // Stop the block — no content_block field (real API behavior)
      const event = parser.parse(JSON.stringify({
        type: "content_block_stop",
        index: 0,
      }));

      expect(event).toEqual({
        kind: "tool_end",
        toolName: "Edit",
        toolId: "tb_001",
      });
    });

    it("stateless parseStreamingLine returns null for same scenario", () => {
      // This confirms the bug that Phase 1 fixes
      const event = parseStreamingLine(JSON.stringify({
        type: "content_block_stop",
        index: 0,
      }));
      expect(event).toBeNull();
    });
  });

  describe("parser reset between messages", () => {
    it("reset clears tracked blocks", () => {
      const parser = createStreamingParser("anthropic-sse");

      parser.parse(JSON.stringify({
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", name: "Read", id: "tb_002" },
      }));

      parser.reset();

      // After reset, stop should not find tracked block
      const event = parser.parse(JSON.stringify({
        type: "content_block_stop",
        index: 0,
      }));
      expect(event).toBeNull();
    });
  });

  describe("plain-text harness wraps all lines as text events", () => {
    it("gemini-cli parser wraps plain text", () => {
      const parser = createStreamingParser("plain-text");
      const event = parser.parse("Here is the generated code...");
      expect(event).toEqual({ kind: "text", text: "Here is the generated code..." });
    });

    it("gemini-cli parser wraps JSON-looking output as text", () => {
      const parser = createStreamingParser("plain-text");
      const event = parser.parse('{"some": "json"}');
      expect(event).toEqual({ kind: "text", text: '{"some": "json"}' });
    });
  });

  describe("codex-json parser handles codex events", () => {
    it("parses codex message event", () => {
      const parser = createStreamingParser("codex-json");
      const event = parser.parse(JSON.stringify({
        type: "message",
        content: "Fix applied successfully",
      }));
      expect(event).toEqual({ kind: "text", text: "Fix applied successfully" });
    });

    it("parses codex tool_result as tool_end", () => {
      const parser = createStreamingParser("codex-json");
      const event = parser.parse(JSON.stringify({
        type: "tool_result",
        name: "shell",
        id: "call_xyz",
      }));
      expect(event).toEqual({
        kind: "tool_end",
        toolName: "shell",
        toolId: "call_xyz",
      });
    });
  });
});
