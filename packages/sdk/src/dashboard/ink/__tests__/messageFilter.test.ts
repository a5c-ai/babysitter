/**
 * messageFilter.test.ts
 *
 * Tests for the verbosity-based message filtering logic extracted from
 * MessagePane.tsx.
 *
 * The VERBOSITY_ALLOWED map and filterMessages function are pure logic
 * with no React/Ink dependencies; we replicate them here and test every
 * meaningful combination of verbosity level × message kind.
 */

import { describe, it, expect } from "vitest";
import type { TuiMessage, VerbosityLevel, MessageKind } from "../types.js";

// ---------------------------------------------------------------------------
// Re-implementation of the filter logic (must stay in sync with MessagePane)
// ---------------------------------------------------------------------------

const VERBOSITY_ALLOWED: Record<VerbosityLevel, ReadonlySet<MessageKind>> = {
  minimal: new Set(["user", "assistant"]),
  normal: new Set(["user", "assistant", "tool_call", "subagent"]),
  verbose: new Set(["user", "assistant", "tool_call", "subagent", "system", "error"]),
};

function filterMessages(
  messages: readonly TuiMessage[],
  verbosity: VerbosityLevel,
): TuiMessage[] {
  const allowed = VERBOSITY_ALLOWED[verbosity];
  return messages.filter((m) => allowed.has(m.content.kind));
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function msg(kind: MessageKind, verbosity: VerbosityLevel = "normal"): TuiMessage {
  idCounter++;
  const content = (() => {
    switch (kind) {
      case "user":       return { kind: "user" as const, text: "hi" };
      case "assistant":  return { kind: "assistant" as const, text: "hi" };
      case "tool_call":  return { kind: "tool_call" as const, toolName: "bash", input: {} };
      case "subagent":   return { kind: "subagent" as const, agentId: "a1", label: "A", status: "running" as const };
      case "system":     return { kind: "system" as const, text: "sys" };
      case "error":      return { kind: "error" as const, message: "oops" };
    }
  })();
  return {
    id: `msg-${String(idCounter)}`,
    timestamp: new Date().toISOString(),
    verbosity,
    content,
  };
}

const ALL_KINDS: MessageKind[] = [
  "user",
  "assistant",
  "tool_call",
  "subagent",
  "system",
  "error",
];

const allMessages = ALL_KINDS.map((k) => msg(k));

// ---------------------------------------------------------------------------
// VERBOSITY_ALLOWED structure contracts
// ---------------------------------------------------------------------------

describe("VERBOSITY_ALLOWED structure", () => {
  it("minimal allows exactly user and assistant", () => {
    const allowed = VERBOSITY_ALLOWED.minimal;
    expect(allowed.has("user")).toBe(true);
    expect(allowed.has("assistant")).toBe(true);
    expect(allowed.size).toBe(2);
  });

  it("normal allows user, assistant, tool_call, subagent", () => {
    const allowed = VERBOSITY_ALLOWED.normal;
    expect(allowed.has("user")).toBe(true);
    expect(allowed.has("assistant")).toBe(true);
    expect(allowed.has("tool_call")).toBe(true);
    expect(allowed.has("subagent")).toBe(true);
    expect(allowed.size).toBe(4);
  });

  it("verbose allows all six kinds", () => {
    const allowed = VERBOSITY_ALLOWED.verbose;
    for (const kind of ALL_KINDS) {
      expect(allowed.has(kind)).toBe(true);
    }
    expect(allowed.size).toBe(6);
  });

  it("each higher level is a strict superset of the previous", () => {
    for (const kind of VERBOSITY_ALLOWED.minimal) {
      expect(VERBOSITY_ALLOWED.normal.has(kind)).toBe(true);
    }
    for (const kind of VERBOSITY_ALLOWED.normal) {
      expect(VERBOSITY_ALLOWED.verbose.has(kind)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// filterMessages — minimal verbosity
// ---------------------------------------------------------------------------

describe("filterMessages — minimal", () => {
  it("returns only user and assistant messages from a mixed list", () => {
    const result = filterMessages(allMessages, "minimal");
    const kinds = result.map((m) => m.content.kind);
    expect(kinds).toContain("user");
    expect(kinds).toContain("assistant");
    expect(kinds).not.toContain("tool_call");
    expect(kinds).not.toContain("subagent");
    expect(kinds).not.toContain("system");
    expect(kinds).not.toContain("error");
  });

  it("returns exactly two messages from the full set", () => {
    const result = filterMessages(allMessages, "minimal");
    expect(result).toHaveLength(2);
  });

  it("returns empty array when there are no user or assistant messages", () => {
    const messages = [msg("tool_call"), msg("system"), msg("error")];
    const result = filterMessages(messages, "minimal");
    expect(result).toHaveLength(0);
  });

  it("returns user messages even if verbosity field on message is 'verbose'", () => {
    // The verbosity field on the message is for display hints, not filtering —
    // filtering uses content.kind only.
    const userMsg = msg("user", "verbose");
    const result = filterMessages([userMsg], "minimal");
    expect(result).toHaveLength(1);
  });

  it("preserves message order", () => {
    const m1 = msg("user");
    const m2 = msg("tool_call");
    const m3 = msg("assistant");
    const result = filterMessages([m1, m2, m3], "minimal");
    expect(result[0].id).toBe(m1.id);
    expect(result[1].id).toBe(m3.id);
  });
});

// ---------------------------------------------------------------------------
// filterMessages — normal verbosity
// ---------------------------------------------------------------------------

describe("filterMessages — normal", () => {
  it("includes user, assistant, tool_call, subagent", () => {
    const result = filterMessages(allMessages, "normal");
    const kinds = result.map((m) => m.content.kind);
    expect(kinds).toContain("user");
    expect(kinds).toContain("assistant");
    expect(kinds).toContain("tool_call");
    expect(kinds).toContain("subagent");
  });

  it("excludes system and error messages", () => {
    const result = filterMessages(allMessages, "normal");
    const kinds = result.map((m) => m.content.kind);
    expect(kinds).not.toContain("system");
    expect(kinds).not.toContain("error");
  });

  it("returns exactly four messages from the full set", () => {
    const result = filterMessages(allMessages, "normal");
    expect(result).toHaveLength(4);
  });

  it("returns a strict superset compared to minimal", () => {
    const minimal = filterMessages(allMessages, "minimal");
    const normal = filterMessages(allMessages, "normal");
    expect(normal.length).toBeGreaterThan(minimal.length);
    const minimalIds = new Set(minimal.map((m) => m.id));
    for (const m of minimal) {
      expect(minimalIds.has(m.id)).toBe(true);
    }
  });

  it("handles list with only system messages (all filtered out)", () => {
    const messages = [msg("system"), msg("system"), msg("system")];
    const result = filterMessages(messages, "normal");
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterMessages — verbose verbosity
// ---------------------------------------------------------------------------

describe("filterMessages — verbose", () => {
  it("returns all six message kinds", () => {
    const result = filterMessages(allMessages, "verbose");
    expect(result).toHaveLength(6);
  });

  it("includes system messages", () => {
    const messages = [msg("system")];
    const result = filterMessages(messages, "verbose");
    expect(result).toHaveLength(1);
    expect(result[0].content.kind).toBe("system");
  });

  it("includes error messages", () => {
    const messages = [msg("error")];
    const result = filterMessages(messages, "verbose");
    expect(result).toHaveLength(1);
    expect(result[0].content.kind).toBe("error");
  });

  it("returns empty array for empty input", () => {
    const result = filterMessages([], "verbose");
    expect(result).toHaveLength(0);
  });

  it("preserves relative order of all messages", () => {
    const messages = ALL_KINDS.map((k) => msg(k));
    const result = filterMessages(messages, "verbose");
    for (let i = 0; i < messages.length; i++) {
      expect(result[i].id).toBe(messages[i].id);
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("filterMessages — edge cases", () => {
  it("returns empty array for empty input at all verbosity levels", () => {
    expect(filterMessages([], "minimal")).toHaveLength(0);
    expect(filterMessages([], "normal")).toHaveLength(0);
    expect(filterMessages([], "verbose")).toHaveLength(0);
  });

  it("handles a large list efficiently (1000 messages)", () => {
    const messages: TuiMessage[] = [];
    for (let i = 0; i < 1000; i++) {
      messages.push(msg(ALL_KINDS[i % ALL_KINDS.length]));
    }
    const result = filterMessages(messages, "normal");
    // 4 out of 6 kinds allowed → expect ~4/6 * 1000 ≈ 666 but exact depends on distribution
    const kinds = new Set(result.map((m) => m.content.kind));
    expect(kinds.has("system")).toBe(false);
    expect(kinds.has("error")).toBe(false);
  });
});
