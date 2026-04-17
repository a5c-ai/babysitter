/**
 * messagePaneHelpers.test.ts
 *
 * Tests for pure helper functions exported from MessagePane.tsx:
 * filterMessages, VERBOSITY_ALLOWED.
 */

import { describe, it, expect } from "vitest";
import {
  filterMessages,
  VERBOSITY_ALLOWED,
} from "../components/MessagePane.js";
import type { TuiMessage, VerbosityLevel, MessageKind } from "../types.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeMessage(kind: MessageKind, text = "test"): TuiMessage {
  return {
    id: `msg-${kind}`,
    timestamp: Date.now(),
    content: { kind, text } as TuiMessage["content"],
  };
}

// ---------------------------------------------------------------------------
// VERBOSITY_ALLOWED
// ---------------------------------------------------------------------------

describe("VERBOSITY_ALLOWED", () => {
  it("minimal allows only user and assistant", () => {
    const allowed = VERBOSITY_ALLOWED.minimal;
    expect(allowed.has("user")).toBe(true);
    expect(allowed.has("assistant")).toBe(true);
    expect(allowed.has("tool_call")).toBe(false);
    expect(allowed.has("subagent")).toBe(false);
    expect(allowed.has("system")).toBe(false);
    expect(allowed.has("error")).toBe(false);
  });

  it("normal allows user, assistant, tool_call, subagent", () => {
    const allowed = VERBOSITY_ALLOWED.normal;
    expect(allowed.has("user")).toBe(true);
    expect(allowed.has("assistant")).toBe(true);
    expect(allowed.has("tool_call")).toBe(true);
    expect(allowed.has("subagent")).toBe(true);
    expect(allowed.has("system")).toBe(false);
    expect(allowed.has("error")).toBe(false);
  });

  it("verbose allows all message kinds", () => {
    const allowed = VERBOSITY_ALLOWED.verbose;
    const allKinds: MessageKind[] = ["user", "assistant", "tool_call", "subagent", "system", "error"];
    for (const kind of allKinds) {
      expect(allowed.has(kind)).toBe(true);
    }
  });

  it("has entries for all VerbosityLevel values", () => {
    const levels: VerbosityLevel[] = ["minimal", "normal", "verbose"];
    for (const level of levels) {
      expect(VERBOSITY_ALLOWED[level]).toBeDefined();
      expect(VERBOSITY_ALLOWED[level].size).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// filterMessages
// ---------------------------------------------------------------------------

describe("filterMessages", () => {
  const allMessages: TuiMessage[] = [
    makeMessage("user"),
    makeMessage("assistant"),
    makeMessage("tool_call"),
    makeMessage("subagent"),
    makeMessage("system"),
    makeMessage("error"),
  ];

  it("minimal filters to only user and assistant", () => {
    const result = filterMessages(allMessages, "minimal");
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.content.kind)).toEqual(["user", "assistant"]);
  });

  it("normal includes user, assistant, tool_call, subagent", () => {
    const result = filterMessages(allMessages, "normal");
    expect(result).toHaveLength(4);
    expect(result.map((m) => m.content.kind)).toEqual([
      "user", "assistant", "tool_call", "subagent",
    ]);
  });

  it("verbose includes all messages", () => {
    const result = filterMessages(allMessages, "verbose");
    expect(result).toHaveLength(6);
  });

  it("returns empty array when no messages", () => {
    expect(filterMessages([], "verbose")).toEqual([]);
  });

  it("preserves message order", () => {
    const msgs = [makeMessage("assistant"), makeMessage("user"), makeMessage("assistant")];
    const result = filterMessages(msgs, "minimal");
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("msg-assistant");
  });
});
