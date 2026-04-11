/**
 * sessionKeyboardHelp.test.ts
 *
 * Tests for keyboard help overlay in SessionView:
 * - KEYBOARD_HELP["session"] entries
 * - formatKeyboardHelp("session") output
 *
 * Phase 2: Keyboard help overlay for SessionView (Wave 7)
 */

import { describe, it, expect } from "vitest";
import { formatKeyboardHelp } from "../helpers.js";

// ---------------------------------------------------------------------------
// KEYBOARD_HELP["session"] entries
// ---------------------------------------------------------------------------

describe("formatKeyboardHelp session", () => {
  it("returns non-empty help lines for 'session' view", () => {
    const lines = formatKeyboardHelp("session");
    expect(lines.length).toBeGreaterThan(0);
  });

  it("includes Escape shortcut", () => {
    const lines = formatKeyboardHelp("session");
    const hasEsc = lines.some((l) => l.includes("Esc"));
    expect(hasEsc).toBe(true);
  });

  it("includes Ctrl+F for search", () => {
    const lines = formatKeyboardHelp("session");
    const hasCtrlF = lines.some((l) => l.includes("Ctrl+F"));
    expect(hasCtrlF).toBe(true);
  });

  it("includes ? key for help toggle", () => {
    const lines = formatKeyboardHelp("session");
    const hasHelp = lines.some((l) => l.includes("?"));
    expect(hasHelp).toBe(true);
  });

  it("includes scroll shortcuts", () => {
    const lines = formatKeyboardHelp("session");
    const hasScroll = lines.some((l) => l.includes("Scroll") || l.includes("scroll"));
    expect(hasScroll).toBe(true);
  });

  it("includes slash command hint", () => {
    const lines = formatKeyboardHelp("session");
    const hasSlash = lines.some((l) => l.includes("/"));
    expect(hasSlash).toBe(true);
  });

  it("each line is formatted with key padding", () => {
    const lines = formatKeyboardHelp("session");
    for (const line of lines) {
      // Each line starts with spaces (indentation)
      expect(line.startsWith("  ")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Other view coverage
// ---------------------------------------------------------------------------

describe("formatKeyboardHelp run-detail", () => {
  it("still returns help for run-detail", () => {
    const lines = formatKeyboardHelp("run-detail");
    expect(lines.length).toBeGreaterThan(0);
  });
});

describe("formatKeyboardHelp unknown", () => {
  it("returns empty for unknown view", () => {
    const lines = formatKeyboardHelp("nonexistent");
    expect(lines).toEqual([]);
  });
});
