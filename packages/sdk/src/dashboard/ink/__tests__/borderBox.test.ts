/**
 * borderBox.test.ts
 *
 * Tests for pure functions supporting the BorderBox primitive:
 *
 *   borderBoxReducer(state, action) — state machine for BorderBox
 *   getBorderChars(style) — returns unicode border characters
 *
 * Imports the real implementations from BorderBox.tsx.
 */

import { describe, it, expect } from "vitest";
import {
  getBorderChars,
  borderBoxReducer,
  type BorderStyle,
  type BorderBoxState,
} from "../components/primitives/BorderBox.js";

// ---------------------------------------------------------------------------
// Default state fixture
// ---------------------------------------------------------------------------

const DEFAULT_STATE: BorderBoxState = {
  style: "single",
  title: undefined,
  collapsed: false,
  padding: 0,
};

// ---------------------------------------------------------------------------
// borderBoxReducer
// ---------------------------------------------------------------------------

describe("borderBoxReducer", () => {
  describe("default state", () => {
    it("has style 'single'", () => {
      expect(DEFAULT_STATE.style).toBe("single");
    });

    it("has undefined title", () => {
      expect(DEFAULT_STATE.title).toBeUndefined();
    });

    it("has collapsed false", () => {
      expect(DEFAULT_STATE.collapsed).toBe(false);
    });

    it("has padding 0", () => {
      expect(DEFAULT_STATE.padding).toBe(0);
    });
  });

  describe("SET_STYLE action", () => {
    it("changes style to double", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_STYLE",
        style: "double",
      });
      expect(next.style).toBe("double");
    });

    it("changes style to round", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_STYLE",
        style: "round",
      });
      expect(next.style).toBe("round");
    });

    it("changes style to none", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_STYLE",
        style: "none",
      });
      expect(next.style).toBe("none");
    });

    it("does not mutate other state fields", () => {
      const state: BorderBoxState = {
        ...DEFAULT_STATE,
        title: "My Box",
        collapsed: true,
        padding: 2,
      };
      const next = borderBoxReducer(state, {
        type: "SET_STYLE",
        style: "bold",
      });
      expect(next.title).toBe("My Box");
      expect(next.collapsed).toBe(true);
      expect(next.padding).toBe(2);
    });
  });

  describe("SET_TITLE action", () => {
    it("sets a title string", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_TITLE",
        title: "Effects",
      });
      expect(next.title).toBe("Effects");
    });

    it("clears the title when set to undefined", () => {
      const state: BorderBoxState = { ...DEFAULT_STATE, title: "Old Title" };
      const next = borderBoxReducer(state, {
        type: "SET_TITLE",
        title: undefined,
      });
      expect(next.title).toBeUndefined();
    });

    it("does not mutate other state fields", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_TITLE",
        title: "New",
      });
      expect(next.style).toBe("single");
      expect(next.collapsed).toBe(false);
      expect(next.padding).toBe(0);
    });
  });

  describe("TOGGLE_COLLAPSE action", () => {
    it("toggles from false to true", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "TOGGLE_COLLAPSE",
      });
      expect(next.collapsed).toBe(true);
    });

    it("toggles from true to false", () => {
      const state: BorderBoxState = { ...DEFAULT_STATE, collapsed: true };
      const next = borderBoxReducer(state, { type: "TOGGLE_COLLAPSE" });
      expect(next.collapsed).toBe(false);
    });

    it("double toggle returns to original state", () => {
      const once = borderBoxReducer(DEFAULT_STATE, {
        type: "TOGGLE_COLLAPSE",
      });
      const twice = borderBoxReducer(once, { type: "TOGGLE_COLLAPSE" });
      expect(twice.collapsed).toBe(DEFAULT_STATE.collapsed);
    });

    it("does not mutate other state fields", () => {
      const state: BorderBoxState = {
        ...DEFAULT_STATE,
        style: "bold",
        title: "Test",
        padding: 3,
      };
      const next = borderBoxReducer(state, { type: "TOGGLE_COLLAPSE" });
      expect(next.style).toBe("bold");
      expect(next.title).toBe("Test");
      expect(next.padding).toBe(3);
    });
  });

  describe("SET_PADDING action", () => {
    it("sets padding to a valid value", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_PADDING",
        padding: 2,
      });
      expect(next.padding).toBe(2);
    });

    it("clamps padding below 0 to 0", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_PADDING",
        padding: -5,
      });
      expect(next.padding).toBe(0);
    });

    it("clamps padding above 4 to 4", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_PADDING",
        padding: 10,
      });
      expect(next.padding).toBe(4);
    });

    it("allows padding of exactly 0", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_PADDING",
        padding: 0,
      });
      expect(next.padding).toBe(0);
    });

    it("allows padding of exactly 4", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_PADDING",
        padding: 4,
      });
      expect(next.padding).toBe(4);
    });

    it("does not mutate other state fields", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_PADDING",
        padding: 3,
      });
      expect(next.style).toBe("single");
      expect(next.title).toBeUndefined();
      expect(next.collapsed).toBe(false);
    });
  });

  describe("immutability", () => {
    it("returns a new object, not the original", () => {
      const next = borderBoxReducer(DEFAULT_STATE, {
        type: "SET_STYLE",
        style: "double",
      });
      expect(next).not.toBe(DEFAULT_STATE);
    });

    it("does not modify the input state", () => {
      const original: BorderBoxState = { ...DEFAULT_STATE };
      borderBoxReducer(original, { type: "SET_PADDING", padding: 3 });
      expect(original.padding).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// getBorderChars
// ---------------------------------------------------------------------------

describe("getBorderChars", () => {
  it("returns six fields for every style", () => {
    const styles: BorderStyle[] = ["single", "double", "round", "bold", "none"];
    const expectedKeys = [
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight",
      "horizontal",
      "vertical",
    ];
    for (const style of styles) {
      const chars = getBorderChars(style);
      expect(Object.keys(chars).sort()).toEqual(expectedKeys.sort());
    }
  });

  describe("single style", () => {
    it("returns correct unicode characters", () => {
      const chars = getBorderChars("single");
      expect(chars.topLeft).toBe("\u250c");
      expect(chars.topRight).toBe("\u2510");
      expect(chars.bottomLeft).toBe("\u2514");
      expect(chars.bottomRight).toBe("\u2518");
      expect(chars.horizontal).toBe("\u2500");
      expect(chars.vertical).toBe("\u2502");
    });
  });

  describe("double style", () => {
    it("returns double-line unicode characters", () => {
      const chars = getBorderChars("double");
      expect(chars.topLeft).toBe("\u2554");
      expect(chars.topRight).toBe("\u2557");
      expect(chars.bottomLeft).toBe("\u255a");
      expect(chars.bottomRight).toBe("\u255d");
      expect(chars.horizontal).toBe("\u2550");
      expect(chars.vertical).toBe("\u2551");
    });
  });

  describe("round style", () => {
    it("returns rounded corner characters", () => {
      const chars = getBorderChars("round");
      expect(chars.topLeft).toBe("\u256d");
      expect(chars.topRight).toBe("\u256e");
      expect(chars.bottomLeft).toBe("\u2570");
      expect(chars.bottomRight).toBe("\u256f");
    });

    it("shares horizontal and vertical with single", () => {
      const round = getBorderChars("round");
      const single = getBorderChars("single");
      expect(round.horizontal).toBe(single.horizontal);
      expect(round.vertical).toBe(single.vertical);
    });
  });

  describe("bold style", () => {
    it("returns heavy-weight unicode characters", () => {
      const chars = getBorderChars("bold");
      expect(chars.topLeft).toBe("\u250f");
      expect(chars.topRight).toBe("\u2513");
      expect(chars.bottomLeft).toBe("\u2517");
      expect(chars.bottomRight).toBe("\u251b");
      expect(chars.horizontal).toBe("\u2501");
      expect(chars.vertical).toBe("\u2503");
    });
  });

  describe("none style", () => {
    it("returns all empty strings", () => {
      const chars = getBorderChars("none");
      expect(chars.topLeft).toBe("");
      expect(chars.topRight).toBe("");
      expect(chars.bottomLeft).toBe("");
      expect(chars.bottomRight).toBe("");
      expect(chars.horizontal).toBe("");
      expect(chars.vertical).toBe("");
    });
  });

  describe("distinct styles produce distinct chars", () => {
    it("single, double, round, and bold have distinct corner characters", () => {
      const styles: BorderStyle[] = ["single", "double", "round", "bold"];
      const topLefts = styles.map((s) => getBorderChars(s).topLeft);
      expect(new Set(topLefts).size).toBe(styles.length);
    });
  });
});
