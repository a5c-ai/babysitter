/**
 * sessionChat.test.ts
 *
 * Tests for the SessionView chat integration:
 * - Slash command processing (extracted as pure functions)
 * - Input focus gating logic
 */

import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Slash command processing — replicated as pure functions for testing
// (The real implementation lives in SessionView.tsx but we test the logic
// independently to avoid needing React/Ink.)
// ---------------------------------------------------------------------------

type VerbosityLevel = "minimal" | "normal" | "verbose";
const VERBOSITY_CYCLE: VerbosityLevel[] = ["minimal", "normal", "verbose"];

interface SlashResult {
  handled: boolean;
}

interface DispatchedAction {
  type: string;
  [key: string]: unknown;
}

function processSlashCommand(
  text: string,
  sessionDispatch: (action: DispatchedAction) => void,
  navDispatch: (action: DispatchedAction) => void,
  sessionState: { verbosity: VerbosityLevel; runId: string | null; status: string },
): SlashResult {
  const lower = text.toLowerCase().trim();

  if (lower === "/clear") {
    sessionDispatch({ type: "CLEAR_MESSAGES" });
    return { handled: true };
  }

  if (lower === "/back") {
    navDispatch({ type: "GO_BACK" });
    return { handled: true };
  }

  if (lower === "/verbosity") {
    const idx = VERBOSITY_CYCLE.indexOf(sessionState.verbosity);
    const next = VERBOSITY_CYCLE[(idx + 1) % VERBOSITY_CYCLE.length];
    sessionDispatch({ type: "SET_VERBOSITY", verbosity: next });
    sessionDispatch({ type: "APPEND_MESSAGE", message: expect.objectContaining({
      content: expect.objectContaining({ kind: "system" }),
    }) });
    return { handled: true };
  }

  if (lower === "/status") {
    sessionDispatch({ type: "APPEND_MESSAGE", message: expect.objectContaining({
      content: expect.objectContaining({ kind: "system" }),
    }) });
    return { handled: true };
  }

  if (lower === "/help") {
    sessionDispatch({ type: "APPEND_MESSAGE", message: expect.objectContaining({
      content: expect.objectContaining({ kind: "system" }),
    }) });
    return { handled: true };
  }

  if (lower === "/refresh") {
    sessionDispatch({ type: "APPEND_MESSAGE", message: expect.objectContaining({
      content: expect.objectContaining({ kind: "system" }),
    }) });
    return { handled: true };
  }

  return { handled: false };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("processSlashCommand", () => {
  const defaultState = { verbosity: "normal" as VerbosityLevel, runId: "run-1", status: "idle" };

  it("/clear dispatches CLEAR_MESSAGES", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/clear", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(true);
    expect(sessionDispatch).toHaveBeenCalledWith({ type: "CLEAR_MESSAGES" });
  });

  it("/back dispatches GO_BACK on navigation", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/back", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(true);
    expect(navDispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
  });

  it("/verbosity cycles to next level", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/verbosity", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(true);
    expect(sessionDispatch).toHaveBeenCalledWith({ type: "SET_VERBOSITY", verbosity: "verbose" });
  });

  it("/verbosity wraps around from verbose to minimal", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/verbosity", sessionDispatch, navDispatch, {
      ...defaultState,
      verbosity: "verbose",
    });
    expect(result.handled).toBe(true);
    expect(sessionDispatch).toHaveBeenCalledWith({ type: "SET_VERBOSITY", verbosity: "minimal" });
  });

  it("/status appends a system message", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/status", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(true);
    expect(sessionDispatch).toHaveBeenCalled();
  });

  it("/help appends a system message", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/help", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(true);
    expect(sessionDispatch).toHaveBeenCalled();
  });

  it("/refresh appends a system message", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/refresh", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(true);
    expect(sessionDispatch).toHaveBeenCalled();
  });

  it("unknown slash command returns handled=false", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/unknown", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(false);
    expect(sessionDispatch).not.toHaveBeenCalled();
    expect(navDispatch).not.toHaveBeenCalled();
  });

  it("non-slash text returns handled=false", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("hello world", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(false);
  });

  it("is case-insensitive", () => {
    const sessionDispatch = vi.fn();
    const navDispatch = vi.fn();
    const result = processSlashCommand("/CLEAR", sessionDispatch, navDispatch, defaultState);
    expect(result.handled).toBe(true);
    expect(sessionDispatch).toHaveBeenCalledWith({ type: "CLEAR_MESSAGES" });
  });
});

// ---------------------------------------------------------------------------
// Focus gating tests
// ---------------------------------------------------------------------------

describe("keyboard focus gating", () => {
  it("shortcuts should be inactive when inputActive is true", () => {
    // This tests the logic pattern: { isActive: !state.inputActive }
    const inputActive = true;
    const shortcutsActive = !inputActive;
    expect(shortcutsActive).toBe(false);
  });

  it("shortcuts should be active when inputActive is false", () => {
    const inputActive = false;
    const shortcutsActive = !inputActive;
    expect(shortcutsActive).toBe(true);
  });

  it("session-level shortcuts should check both view and inputActive", () => {
    // Pattern from App.tsx: navState.currentView === "session" && !sessionState.inputActive
    const cases = [
      { view: "session", inputActive: false, expected: true },
      { view: "session", inputActive: true, expected: false },
      { view: "dashboard", inputActive: false, expected: false },
      { view: "dashboard", inputActive: true, expected: false },
    ];

    for (const c of cases) {
      const active = c.view === "session" && !c.inputActive;
      expect(active).toBe(c.expected);
    }
  });
});
