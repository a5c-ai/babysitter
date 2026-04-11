/**
 * actionMenuCallbacks.test.ts
 *
 * Tests that ActionMenu correctly maps shortcut keys to action IDs
 * and exposes the mapping for DashboardView integration.
 *
 * Phase 1: Fix ActionMenu callback integration (Wave 6)
 */

import { describe, it, expect } from "vitest";
import {
  SHORTCUTS,
  mapKeyToAction,
} from "../components/ActionMenu.js";

// ---------------------------------------------------------------------------
// Shortcut definitions
// ---------------------------------------------------------------------------

describe("ActionMenu SHORTCUTS", () => {
  it("exports SHORTCUTS array", () => {
    expect(Array.isArray(SHORTCUTS)).toBe(true);
    expect(SHORTCUTS.length).toBeGreaterThan(0);
  });

  it("each shortcut has key, label, and action", () => {
    for (const shortcut of SHORTCUTS) {
      expect(typeof shortcut.key).toBe("string");
      expect(typeof shortcut.label).toBe("string");
      expect(typeof shortcut.action).toBe("string");
    }
  });

  it("contains expected shortcuts", () => {
    const actions = SHORTCUTS.map((s) => s.action);
    expect(actions).toContain("details");
    expect(actions).toContain("session");
    expect(actions).toContain("new");
    expect(actions).toContain("refresh");
    expect(actions).toContain("quit");
  });

  it("has unique action IDs", () => {
    const actions = SHORTCUTS.map((s) => s.action);
    expect(new Set(actions).size).toBe(actions.length);
  });

  it("has unique keys", () => {
    const keys = SHORTCUTS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// Key-to-action mapping
// ---------------------------------------------------------------------------

describe("mapKeyToAction", () => {
  it("maps 'n' to 'new'", () => {
    expect(mapKeyToAction("n", { return: false })).toBe("new");
  });

  it("maps 's' to 'session'", () => {
    expect(mapKeyToAction("s", { return: false })).toBe("session");
  });

  it("maps 'r' to 'refresh'", () => {
    expect(mapKeyToAction("r", { return: false })).toBe("refresh");
  });

  it("maps 'q' to 'quit'", () => {
    expect(mapKeyToAction("q", { return: false })).toBe("quit");
  });

  it("maps Enter key to 'details'", () => {
    expect(mapKeyToAction("", { return: true })).toBe("details");
  });

  it("maps Escape to 'quit'", () => {
    expect(mapKeyToAction("", { escape: true })).toBe("quit");
  });

  it("returns null for unrecognized keys", () => {
    expect(mapKeyToAction("x", { return: false })).toBeNull();
    expect(mapKeyToAction("z", { return: false })).toBeNull();
  });

  it("returns null for arrow keys", () => {
    expect(mapKeyToAction("", { upArrow: true })).toBeNull();
    expect(mapKeyToAction("", { downArrow: true })).toBeNull();
  });
});
