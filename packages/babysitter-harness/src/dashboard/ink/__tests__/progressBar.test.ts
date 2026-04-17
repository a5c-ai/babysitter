/**
 * progressBar.test.ts
 *
 * Tests for the pure function renderProgressBar, which produces a text-based
 * progress bar suitable for terminal rendering.
 *
 * Imports the real implementation from ProgressBar.tsx.
 */

import { describe, it, expect } from "vitest";
import { renderProgressBar } from "../components/primitives/ProgressBar.js";

// ---------------------------------------------------------------------------
// Defaults (specification constants for assertions)
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 20;
const DEFAULT_FILL = "\u2588"; // "█"
const DEFAULT_EMPTY = "\u2591"; // "░"

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("renderProgressBar", () => {
  describe("defaults", () => {
    it("uses width=20 when not specified", () => {
      const result = renderProgressBar({ progress: 0.5 });
      expect(result.bar).toHaveLength(DEFAULT_WIDTH);
    });

    it("uses fill char \u2588 when not specified", () => {
      const result = renderProgressBar({ progress: 1 });
      expect(result.bar).toBe(DEFAULT_FILL.repeat(DEFAULT_WIDTH));
    });

    it("uses empty char \u2591 when not specified", () => {
      const result = renderProgressBar({ progress: 0 });
      expect(result.bar).toBe(DEFAULT_EMPTY.repeat(DEFAULT_WIDTH));
    });

    it("does not show label by default", () => {
      const result = renderProgressBar({ progress: 0.5 });
      expect(result.label).toBe("");
    });
  });

  describe("progress = 0", () => {
    it("returns all empty chars", () => {
      const result = renderProgressBar({ progress: 0 });
      expect(result.bar).toBe(DEFAULT_EMPTY.repeat(DEFAULT_WIDTH));
      expect(result.filledCount).toBe(0);
    });
  });

  describe("progress = 1", () => {
    it("returns all fill chars", () => {
      const result = renderProgressBar({ progress: 1 });
      expect(result.bar).toBe(DEFAULT_FILL.repeat(DEFAULT_WIDTH));
      expect(result.filledCount).toBe(DEFAULT_WIDTH);
    });
  });

  describe("progress = 0.5", () => {
    it("returns half filled, half empty", () => {
      const result = renderProgressBar({ progress: 0.5 });
      expect(result.filledCount).toBe(10);
      const expected =
        DEFAULT_FILL.repeat(10) + DEFAULT_EMPTY.repeat(10);
      expect(result.bar).toBe(expected);
    });
  });

  describe("clamping", () => {
    it("clamps progress below 0 to 0", () => {
      const result = renderProgressBar({ progress: -0.5 });
      expect(result.filledCount).toBe(0);
      expect(result.bar).toBe(DEFAULT_EMPTY.repeat(DEFAULT_WIDTH));
    });

    it("clamps progress above 1 to 1", () => {
      const result = renderProgressBar({ progress: 1.5 });
      expect(result.filledCount).toBe(DEFAULT_WIDTH);
      expect(result.bar).toBe(DEFAULT_FILL.repeat(DEFAULT_WIDTH));
    });

    it("clamps extremely negative values", () => {
      const result = renderProgressBar({ progress: -100 });
      expect(result.filledCount).toBe(0);
    });

    it("clamps extremely positive values", () => {
      const result = renderProgressBar({ progress: 999 });
      expect(result.filledCount).toBe(DEFAULT_WIDTH);
    });
  });

  describe("custom width", () => {
    it("respects custom width", () => {
      const result = renderProgressBar({ progress: 0.5, width: 40 });
      expect(result.bar).toHaveLength(40);
      expect(result.filledCount).toBe(20);
    });

    it("bar length equals width when showLabel is false", () => {
      const widths = [5, 10, 30, 50, 100];
      for (const width of widths) {
        const result = renderProgressBar({
          progress: 0.75,
          width,
          showLabel: false,
        });
        expect(result.bar).toHaveLength(width);
      }
    });

    it("handles width of 1", () => {
      const result = renderProgressBar({ progress: 0.5, width: 1 });
      expect(result.bar).toHaveLength(1);
    });
  });

  describe("custom characters", () => {
    it("uses custom fill character", () => {
      const result = renderProgressBar({
        progress: 1,
        width: 5,
        fillChar: "#",
      });
      expect(result.bar).toBe("#####");
    });

    it("uses custom empty character", () => {
      const result = renderProgressBar({
        progress: 0,
        width: 5,
        emptyChar: "-",
      });
      expect(result.bar).toBe("-----");
    });

    it("uses both custom fill and empty characters", () => {
      const result = renderProgressBar({
        progress: 0.5,
        width: 4,
        fillChar: "=",
        emptyChar: ".",
      });
      expect(result.bar).toBe("==..");
    });
  });

  describe("showLabel", () => {
    it("shows label when showLabel is true", () => {
      const result = renderProgressBar({ progress: 0.5, showLabel: true });
      expect(result.label).toBe(" 50%");
    });

    it("shows 0% for progress 0", () => {
      const result = renderProgressBar({ progress: 0, showLabel: true });
      expect(result.label).toBe(" 0%");
    });

    it("shows 100% for progress 1", () => {
      const result = renderProgressBar({ progress: 1, showLabel: true });
      expect(result.label).toBe(" 100%");
    });

    it("rounds percentage to nearest integer", () => {
      const result = renderProgressBar({ progress: 0.333, showLabel: true });
      expect(result.label).toBe(" 33%");
    });

    it("label is empty string when showLabel is false", () => {
      const result = renderProgressBar({ progress: 0.5, showLabel: false });
      expect(result.label).toBe("");
    });
  });

  describe("bar length invariant", () => {
    it("bar.length always equals width when showLabel is false", () => {
      const widths = [10, 20, 50];
      const progresses = [0, 0.25, 0.5, 0.75, 1];
      for (const width of widths) {
        for (const progress of progresses) {
          const result = renderProgressBar({
            progress,
            width,
            showLabel: false,
          });
          expect(result.bar).toHaveLength(width);
        }
      }
    });
  });

  describe("filledCount consistency", () => {
    it("filledCount matches actual fill chars in bar", () => {
      const result = renderProgressBar({
        progress: 0.3,
        width: 10,
        fillChar: "#",
        emptyChar: ".",
      });
      const actualFilled = result.bar.split("").filter((c) => c === "#").length;
      expect(actualFilled).toBe(result.filledCount);
    });

    it("filledCount is between 0 and width inclusive", () => {
      for (let p = 0; p <= 1; p += 0.1) {
        const result = renderProgressBar({ progress: p, width: 20 });
        expect(result.filledCount).toBeGreaterThanOrEqual(0);
        expect(result.filledCount).toBeLessThanOrEqual(20);
      }
    });
  });
});
