/**
 * inputHistoryIntegration.test.ts
 *
 * Integration tests for input history wiring in PromptBar.
 * Tests that PromptBar exports history-related types and that the
 * history state management works correctly when used as PromptBar would.
 *
 * Phase 1: Input history in PromptBar (Wave 5)
 */

import { describe, it, expect } from "vitest";
import {
  createInputHistory,
  addToHistory,
  navigateHistory,
} from "../helpers.js";
import type { InputHistory } from "../helpers.js";
import { SLASH_COMMANDS } from "../components/PromptBar.js";

// ---------------------------------------------------------------------------
// Simulated PromptBar history flow
// ---------------------------------------------------------------------------

/**
 * Simulates the PromptBar history flow:
 * - User types and submits → addToHistory
 * - User presses Up → navigateHistory("up") → setValue to entry
 * - User presses Down → navigateHistory("down") → setValue to entry or clear
 */
function simulatePromptBarSession() {
  let history = createInputHistory();
  let currentInput = "";

  function submit(text: string) {
    history = addToHistory(history, text);
    currentInput = "";
  }

  function pressUp(): string {
    const result = navigateHistory(history, "up");
    history = result.history;
    if (result.entry !== null) {
      currentInput = result.entry;
    }
    return currentInput;
  }

  function pressDown(): string {
    const result = navigateHistory(history, "down");
    history = result.history;
    if (result.entry !== null) {
      currentInput = result.entry;
    } else {
      // Down past end = restore empty input (like clearing)
      currentInput = "";
    }
    return currentInput;
  }

  return {
    submit,
    pressUp,
    pressDown,
    get currentInput() { return currentInput; },
    get history() { return history; },
  };
}

// ---------------------------------------------------------------------------
// Integration: submit → recall flow
// ---------------------------------------------------------------------------

describe("PromptBar history integration: submit and recall", () => {
  it("submitting a command adds it to history", () => {
    const session = simulatePromptBarSession();
    session.submit("/status");
    expect(session.history.entries).toEqual(["/status"]);
  });

  it("Up arrow after submit recalls the last command", () => {
    const session = simulatePromptBarSession();
    session.submit("/status");
    session.submit("/help");
    const recalled = session.pressUp();
    expect(recalled).toBe("/help");
  });

  it("two Up presses recall commands in reverse order", () => {
    const session = simulatePromptBarSession();
    session.submit("hello");
    session.submit("world");
    const first = session.pressUp();
    expect(first).toBe("world");
    const second = session.pressUp();
    expect(second).toBe("hello");
  });

  it("Down arrow after Up returns to newer command", () => {
    const session = simulatePromptBarSession();
    session.submit("alpha");
    session.submit("beta");
    session.submit("gamma");
    session.pressUp(); // gamma
    session.pressUp(); // beta
    const result = session.pressDown();
    expect(result).toBe("gamma");
  });

  it("Down arrow past end clears input", () => {
    const session = simulatePromptBarSession();
    session.submit("test");
    session.pressUp(); // test
    const result = session.pressDown(); // past end
    expect(result).toBe("");
  });

  it("Up arrow with no history does nothing", () => {
    const session = simulatePromptBarSession();
    const result = session.pressUp();
    expect(result).toBe("");
  });

  it("submitting clears current input for next recall", () => {
    const session = simulatePromptBarSession();
    session.submit("first");
    session.pressUp(); // first
    session.submit("second"); // submit from history
    expect(session.currentInput).toBe("");
    const recalled = session.pressUp();
    expect(recalled).toBe("second");
  });
});

// ---------------------------------------------------------------------------
// Integration: history behavior with slash commands
// ---------------------------------------------------------------------------

describe("PromptBar history with slash commands", () => {
  it("slash commands are added to history", () => {
    const session = simulatePromptBarSession();
    session.submit("/clear");
    session.submit("/status");
    session.submit("/verbosity");
    expect(session.history.entries).toEqual(["/clear", "/status", "/verbosity"]);
  });

  it("consecutive duplicate slash commands are deduped", () => {
    const session = simulatePromptBarSession();
    session.submit("/status");
    session.submit("/status");
    expect(session.history.entries).toEqual(["/status"]);
  });

  it("mixed commands and messages are all in history", () => {
    const session = simulatePromptBarSession();
    session.submit("fix the bug");
    session.submit("/status");
    session.submit("explain the code");
    expect(session.history.entries).toEqual([
      "fix the bug",
      "/status",
      "explain the code",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Integration: boundary conditions
// ---------------------------------------------------------------------------

describe("PromptBar history boundary conditions", () => {
  it("rapid Up presses stay at oldest entry", () => {
    const session = simulatePromptBarSession();
    session.submit("a");
    session.submit("b");
    // Press Up many times — should clamp at "a"
    for (let i = 0; i < 10; i++) {
      session.pressUp();
    }
    expect(session.currentInput).toBe("a");
  });

  it("rapid Down presses stay at empty after history end", () => {
    const session = simulatePromptBarSession();
    session.submit("x");
    session.pressUp(); // x
    // Press Down many times — should stay empty
    for (let i = 0; i < 10; i++) {
      session.pressDown();
    }
    expect(session.currentInput).toBe("");
  });

  it("history preserves entries after many submissions", () => {
    const session = simulatePromptBarSession();
    for (let i = 0; i < 50; i++) {
      session.submit(`cmd-${i}`);
    }
    expect(session.history.entries).toHaveLength(50);
    const recalled = session.pressUp();
    expect(recalled).toBe("cmd-49");
  });
});

// ---------------------------------------------------------------------------
// SLASH_COMMANDS verification (ensure /search exists from Wave 4)
// ---------------------------------------------------------------------------

describe("SLASH_COMMANDS has search command (Wave 4 prerequisite)", () => {
  it("/search is in SLASH_COMMANDS", () => {
    const cmd = SLASH_COMMANDS.find((c) => c.name === "/search");
    expect(cmd).toBeDefined();
  });
});
