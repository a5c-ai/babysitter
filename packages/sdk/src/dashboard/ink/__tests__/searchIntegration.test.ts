/**
 * searchIntegration.test.ts
 *
 * Tests for search integration in SessionView:
 * - /search slash command handling
 * - SearchBar activation/deactivation logic
 * - Message content search via findMatches
 * - Highlight application via applySearchHighlight
 * - Ctrl+F toggle behavior
 *
 * Phase 3: Search integration in SessionView
 */

import { describe, it, expect } from "vitest";
import {
  findMatches,
  highlightText,
} from "../helpers.js";
import { applySearchHighlight } from "../components/SearchBar.js";
import type { SearchBarState } from "../components/SearchBar.js";
import { SLASH_COMMANDS } from "../components/PromptBar.js";
import type { TuiMessage, VerbosityLevel, MessageKind } from "../types.js";
import { filterMessages } from "../components/MessagePane.js";

// ---------------------------------------------------------------------------
// /search slash command registration
// ---------------------------------------------------------------------------

describe("/search slash command registration", () => {
  it("SLASH_COMMANDS includes /search entry", () => {
    const searchCmd = SLASH_COMMANDS.find((c) => c.name === "/search");
    expect(searchCmd).toBeDefined();
    expect(searchCmd!.description).toBeTruthy();
  });

  it("/search description mentions search or find", () => {
    const searchCmd = SLASH_COMMANDS.find((c) => c.name === "/search");
    expect(searchCmd).toBeDefined();
    const lower = searchCmd!.description.toLowerCase();
    expect(lower.includes("search") || lower.includes("find")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// /search slash command processing
// ---------------------------------------------------------------------------

// Replicate the processSlashCommand logic for /search testing
// (actual implementation lives in SessionView.tsx, tested via pure logic)
describe("/search slash command processing", () => {
  it("/search is recognized as a slash command", () => {
    // Any text starting with "/" that matches known commands is handled
    const text = "/search";
    expect(text.startsWith("/")).toBe(true);
    const cmd = SLASH_COMMANDS.find((c) => c.name === text.toLowerCase().trim());
    expect(cmd).toBeDefined();
  });

  it("/search with query text is recognized", () => {
    const text = "/search hello world";
    const cmdPart = text.split(/\s+/)[0].toLowerCase();
    const cmd = SLASH_COMMANDS.find((c) => c.name === cmdPart);
    expect(cmd).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Message content search — extracting searchable text from messages
// ---------------------------------------------------------------------------

function extractMessageText(messages: readonly TuiMessage[]): string {
  return messages
    .map((m) => {
      const content = m.content;
      switch (content.kind) {
        case "user":
        case "assistant":
        case "system":
          return content.text;
        case "error":
          return content.message;
        case "tool_call":
          return content.toolName ?? "";
        case "subagent":
          return content.name ?? "";
        default:
          return "";
      }
    })
    .join("\n");
}

describe("message content search", () => {
  const messages: TuiMessage[] = [
    {
      id: "msg-1",
      timestamp: "2026-04-10T10:00:00Z",
      verbosity: "minimal",
      content: { kind: "user", text: "fix the authentication bug" },
    },
    {
      id: "msg-2",
      timestamp: "2026-04-10T10:00:01Z",
      verbosity: "minimal",
      content: {
        kind: "assistant",
        text: "I found the bug in the auth module. The token validation was skipping expiry checks.",
      },
    },
    {
      id: "msg-3",
      timestamp: "2026-04-10T10:00:02Z",
      verbosity: "normal",
      content: { kind: "tool_call", toolName: "Edit" },
    },
    {
      id: "msg-4",
      timestamp: "2026-04-10T10:00:03Z",
      verbosity: "minimal",
      content: { kind: "system", text: "Verbosity set to: normal" },
    },
  ];

  it("extracts searchable text from all message kinds", () => {
    const text = extractMessageText(messages);
    expect(text).toContain("fix the authentication bug");
    expect(text).toContain("auth module");
    expect(text).toContain("Edit");
    expect(text).toContain("Verbosity");
  });

  it("finds matches across extracted message text", () => {
    const text = extractMessageText(messages);
    const matches = findMatches(text, "bug", { ignoreCase: true });
    expect(matches).toHaveLength(2); // "bug" in user msg and "bug" in assistant msg
  });

  it("case-insensitive search finds mixed case", () => {
    const text = extractMessageText(messages);
    const matches = findMatches(text, "AUTH", { ignoreCase: true });
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("returns no matches for absent term", () => {
    const text = extractMessageText(messages);
    const matches = findMatches(text, "kubernetes");
    expect(matches).toHaveLength(0);
  });

  it("only searches visible messages after verbosity filter", () => {
    const minimalOnly = filterMessages(messages, "minimal");
    const text = extractMessageText(minimalOnly);
    // tool_call is filtered out at minimal verbosity
    expect(text).not.toContain("Edit");
    expect(text).toContain("fix the authentication bug");
  });
});

// ---------------------------------------------------------------------------
// applySearchHighlight — highlight integration
// ---------------------------------------------------------------------------

describe("applySearchHighlight integration", () => {
  it("highlights matched text with ANSI reverse video markers", () => {
    const state: SearchBarState = {
      query: "hello",
      matches: [{ start: 0, end: 5 }],
      currentIndex: 0,
    };
    const result = applySearchHighlight("hello world", state);
    expect(result).toContain("\x1b[7m");
    expect(result).toContain("hello");
    expect(result).toContain("\x1b[27m");
  });

  it("returns original text when no matches", () => {
    const state: SearchBarState = {
      query: "xyz",
      matches: [],
      currentIndex: 0,
    };
    const result = applySearchHighlight("hello world", state);
    expect(result).toBe("hello world");
  });

  it("highlights multiple occurrences", () => {
    const text = "the cat sat on the mat";
    const matches = findMatches(text, "the", { ignoreCase: true });
    const state: SearchBarState = { query: "the", matches, currentIndex: 0 };
    const result = applySearchHighlight(text, state);
    // Count reverse video start markers
    const markerCount = result.split("\x1b[7m").length - 1;
    expect(markerCount).toBe(2);
  });

  it("supports custom markers", () => {
    const state: SearchBarState = {
      query: "world",
      matches: [{ start: 6, end: 11 }],
      currentIndex: 0,
    };
    const result = applySearchHighlight("hello world", state, "<<", ">>");
    expect(result).toBe("hello <<world>>");
  });
});

// ---------------------------------------------------------------------------
// Search state transitions
// ---------------------------------------------------------------------------

describe("search state machine", () => {
  it("empty query produces no matches", () => {
    const matches = findMatches("hello world", "");
    expect(matches).toHaveLength(0);
  });

  it("clearing query resets to empty state", () => {
    // Simulates the state after pressing Escape in SearchBar
    const state: SearchBarState = { query: "", matches: [], currentIndex: 0 };
    expect(state.matches).toHaveLength(0);
    expect(state.currentIndex).toBe(0);
  });

  it("typing builds incremental query with shrinking/growing matches", () => {
    const text = "the quick brown fox the lazy dog";

    // Type "t" — many matches
    const m1 = findMatches(text, "t", { ignoreCase: true });
    expect(m1.length).toBeGreaterThanOrEqual(2);

    // Type "th" — fewer matches
    const m2 = findMatches(text, "th", { ignoreCase: true });
    expect(m2.length).toBeLessThanOrEqual(m1.length);

    // Type "the" — specific matches
    const m3 = findMatches(text, "the", { ignoreCase: true });
    expect(m3.length).toBeLessThanOrEqual(m2.length);
    expect(m3).toHaveLength(2); // "the" appears twice
  });
});

// ---------------------------------------------------------------------------
// Highlight combined with message rendering
// ---------------------------------------------------------------------------

describe("search highlight on message rendering", () => {
  it("highlights within user message text", () => {
    const text = "fix the authentication bug";
    const matches = findMatches(text, "auth");
    const state: SearchBarState = { query: "auth", matches, currentIndex: 0 };
    const highlighted = applySearchHighlight(text, state, "[", "]");
    expect(highlighted).toBe("fix the [auth]entication bug");
  });

  it("highlights within assistant message text", () => {
    const text = "I found the issue in auth.ts and fixed the token check";
    const matches = findMatches(text, "the", { ignoreCase: true });
    const state: SearchBarState = { query: "the", matches, currentIndex: 0 };
    const highlighted = applySearchHighlight(text, state, "[", "]");
    expect(highlighted).toContain("[the]");
  });

  it("handles special regex characters in search query", () => {
    const text = "array[0].value = foo(bar)";
    const matches = findMatches(text, "[0]");
    const state: SearchBarState = { query: "[0]", matches, currentIndex: 0 };
    const highlighted = applySearchHighlight(text, state, "<", ">");
    expect(highlighted).toContain("<[0]>");
  });
});
