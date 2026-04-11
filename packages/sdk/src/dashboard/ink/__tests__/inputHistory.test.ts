/**
 * inputHistory.test.ts
 *
 * TDD tests for a pure input history manager: creation, insertion,
 * and up/down navigation through command history.
 *
 * Phase 4: Breakpoint & Interaction UI (GAP-UX-001c)
 *
 * All functions imported from ../helpers.js (Red phase — not yet implemented).
 */

import { describe, it, expect } from "vitest";
import {
  createInputHistory,
  addToHistory,
  navigateHistory,
} from "../helpers.js";
import type { InputHistory } from "../helpers.js";

// ---------------------------------------------------------------------------
// createInputHistory
// ---------------------------------------------------------------------------

describe("createInputHistory", () => {
  it("creates history with default maxSize of 100", () => {
    const h = createInputHistory();
    expect(h.maxSize).toBe(100);
    expect(h.entries).toEqual([]);
    expect(h.cursor).toBe(0);
  });

  it("creates history with custom maxSize", () => {
    const h = createInputHistory(50);
    expect(h.maxSize).toBe(50);
    expect(h.entries).toEqual([]);
    expect(h.cursor).toBe(0);
  });

  it("starts with empty entries", () => {
    const h = createInputHistory();
    expect(h.entries).toHaveLength(0);
  });

  it("starts with cursor at 0", () => {
    const h = createInputHistory();
    expect(h.cursor).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// addToHistory
// ---------------------------------------------------------------------------

describe("addToHistory", () => {
  it("adds an entry to the end", () => {
    const h = createInputHistory();
    const h2 = addToHistory(h, "/status");
    expect(h2.entries).toEqual(["/status"]);
  });

  it("adds multiple entries in order", () => {
    let h = createInputHistory();
    h = addToHistory(h, "first");
    h = addToHistory(h, "second");
    h = addToHistory(h, "third");
    expect(h.entries).toEqual(["first", "second", "third"]);
  });

  it("resets cursor to entries.length (past the end)", () => {
    let h = createInputHistory();
    h = addToHistory(h, "first");
    h = addToHistory(h, "second");
    expect(h.cursor).toBe(2);
  });

  it("does not add empty strings", () => {
    let h = createInputHistory();
    h = addToHistory(h, "first");
    h = addToHistory(h, "");
    expect(h.entries).toEqual(["first"]);
    expect(h.cursor).toBe(1);
  });

  it("does not add whitespace-only strings", () => {
    let h = createInputHistory();
    h = addToHistory(h, "first");
    h = addToHistory(h, "   ");
    expect(h.entries).toEqual(["first"]);
  });

  it("does not add duplicate of the most recent entry", () => {
    let h = createInputHistory();
    h = addToHistory(h, "first");
    h = addToHistory(h, "second");
    h = addToHistory(h, "second");
    expect(h.entries).toEqual(["first", "second"]);
  });

  it("allows non-consecutive duplicates", () => {
    let h = createInputHistory();
    h = addToHistory(h, "first");
    h = addToHistory(h, "second");
    h = addToHistory(h, "first");
    expect(h.entries).toEqual(["first", "second", "first"]);
  });

  it("trims to maxSize by dropping oldest entries", () => {
    let h = createInputHistory(3);
    h = addToHistory(h, "a");
    h = addToHistory(h, "b");
    h = addToHistory(h, "c");
    h = addToHistory(h, "d");
    expect(h.entries).toEqual(["b", "c", "d"]);
    expect(h.entries).toHaveLength(3);
  });

  it("returns a new object (immutable)", () => {
    const h1 = createInputHistory();
    const h2 = addToHistory(h1, "entry");
    expect(h1).not.toBe(h2);
    expect(h1.entries).toHaveLength(0);
    expect(h2.entries).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// navigateHistory
// ---------------------------------------------------------------------------

describe("navigateHistory", () => {
  describe("empty history", () => {
    it("returns null for 'up' on empty history", () => {
      const h = createInputHistory();
      const { entry } = navigateHistory(h, "up");
      expect(entry).toBeNull();
    });

    it("returns null for 'down' on empty history", () => {
      const h = createInputHistory();
      const { entry } = navigateHistory(h, "down");
      expect(entry).toBeNull();
    });
  });

  describe("navigating up", () => {
    it("returns the most recent entry when navigating up from the end", () => {
      let h = createInputHistory();
      h = addToHistory(h, "first");
      h = addToHistory(h, "second");
      // cursor is at 2 (past the end)
      const { history: h2, entry } = navigateHistory(h, "up");
      expect(entry).toBe("second");
      expect(h2.cursor).toBe(1);
    });

    it("returns older entries on successive up navigations", () => {
      let h = createInputHistory();
      h = addToHistory(h, "first");
      h = addToHistory(h, "second");
      h = addToHistory(h, "third");

      const r1 = navigateHistory(h, "up");
      expect(r1.entry).toBe("third");

      const r2 = navigateHistory(r1.history, "up");
      expect(r2.entry).toBe("second");

      const r3 = navigateHistory(r2.history, "up");
      expect(r3.entry).toBe("first");
    });

    it("stays at the oldest entry when navigating up past the beginning", () => {
      let h = createInputHistory();
      h = addToHistory(h, "only");

      const r1 = navigateHistory(h, "up");
      expect(r1.entry).toBe("only");
      expect(r1.history.cursor).toBe(0);

      const r2 = navigateHistory(r1.history, "up");
      expect(r2.entry).toBe("only");
      expect(r2.history.cursor).toBe(0);
    });
  });

  describe("navigating down", () => {
    it("returns next entry when navigating down from middle", () => {
      let h = createInputHistory();
      h = addToHistory(h, "first");
      h = addToHistory(h, "second");
      h = addToHistory(h, "third");

      // Navigate up twice to get to "second"
      const r1 = navigateHistory(h, "up");
      const r2 = navigateHistory(r1.history, "up");
      expect(r2.entry).toBe("second");

      // Navigate down to get back to "third"
      const r3 = navigateHistory(r2.history, "down");
      expect(r3.entry).toBe("third");
    });

    it("returns null when navigating down past the end", () => {
      let h = createInputHistory();
      h = addToHistory(h, "first");
      h = addToHistory(h, "second");

      // Navigate up once then down twice
      const r1 = navigateHistory(h, "up");
      const r2 = navigateHistory(r1.history, "down");
      expect(r2.entry).toBeNull();
    });

    it("returns null when already at end and navigating down", () => {
      let h = createInputHistory();
      h = addToHistory(h, "first");
      // cursor is already at 1 (past end)
      const { entry } = navigateHistory(h, "down");
      expect(entry).toBeNull();
    });
  });

  describe("round-trip navigation", () => {
    it("navigating up then down returns to the same position", () => {
      let h = createInputHistory();
      h = addToHistory(h, "a");
      h = addToHistory(h, "b");
      h = addToHistory(h, "c");

      const r1 = navigateHistory(h, "up"); // c
      const r2 = navigateHistory(r1.history, "up"); // b
      const r3 = navigateHistory(r2.history, "down"); // c
      expect(r3.entry).toBe("c");
    });

    it("full traversal up and back down", () => {
      let h = createInputHistory();
      h = addToHistory(h, "x");
      h = addToHistory(h, "y");

      // Go all the way up
      const u1 = navigateHistory(h, "up"); // y
      const u2 = navigateHistory(u1.history, "up"); // x
      const u3 = navigateHistory(u2.history, "up"); // x (clamped)
      expect(u3.entry).toBe("x");

      // Go all the way down
      const d1 = navigateHistory(u3.history, "down"); // y
      expect(d1.entry).toBe("y");
      const d2 = navigateHistory(d1.history, "down"); // null (past end)
      expect(d2.entry).toBeNull();
    });
  });
});
