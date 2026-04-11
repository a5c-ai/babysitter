/**
 * scrollBox.test.ts
 *
 * Tests for scroll math pure functions (Phase 7: Advanced Rendering).
 * clampScrollOffset, computeVisibleRange, shouldAutoScroll,
 * scrollTo, scrollBy, scrollToBottom.
 */

import { describe, it, expect } from "vitest";
import {
  clampScrollOffset,
  computeVisibleRange,
  shouldAutoScroll,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// clampScrollOffset
// ---------------------------------------------------------------------------

describe("clampScrollOffset", () => {
  it("clamps offset to 0 when content fits in viewport", () => {
    expect(clampScrollOffset(5, 10, 20)).toBe(0);
  });

  it("clamps negative offset to 0", () => {
    expect(clampScrollOffset(-5, 100, 20)).toBe(0);
  });

  it("clamps offset to max when exceeding content", () => {
    // 100 items, viewport 20 → max offset = 80
    expect(clampScrollOffset(90, 100, 20)).toBe(80);
  });

  it("returns offset unchanged when within bounds", () => {
    expect(clampScrollOffset(30, 100, 20)).toBe(30);
  });

  it("handles zero content length", () => {
    expect(clampScrollOffset(0, 0, 20)).toBe(0);
  });

  it("handles zero viewport height", () => {
    expect(clampScrollOffset(0, 100, 0)).toBe(0);
  });

  it("returns 0 when content equals viewport", () => {
    expect(clampScrollOffset(0, 20, 20)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeVisibleRange
// ---------------------------------------------------------------------------

describe("computeVisibleRange", () => {
  it("returns correct start/end for offset 0", () => {
    const range = computeVisibleRange(0, 100, 20);
    expect(range.start).toBe(0);
    expect(range.end).toBe(20);
  });

  it("returns correct range for middle offset", () => {
    const range = computeVisibleRange(30, 100, 20);
    expect(range.start).toBe(30);
    expect(range.end).toBe(50);
  });

  it("clamps end to content length", () => {
    const range = computeVisibleRange(90, 100, 20);
    expect(range.start).toBe(80); // clamped
    expect(range.end).toBe(100);
  });

  it("handles empty content", () => {
    const range = computeVisibleRange(0, 0, 20);
    expect(range.start).toBe(0);
    expect(range.end).toBe(0);
  });

  it("handles content smaller than viewport", () => {
    const range = computeVisibleRange(0, 5, 20);
    expect(range.start).toBe(0);
    expect(range.end).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// shouldAutoScroll (sticky scroll detection)
// ---------------------------------------------------------------------------

describe("shouldAutoScroll", () => {
  it("returns true when scrolled to bottom", () => {
    // offset 80, content 100, viewport 20 → at bottom
    expect(shouldAutoScroll(80, 100, 20)).toBe(true);
  });

  it("returns true when near bottom (within threshold)", () => {
    // offset 78, content 100, viewport 20 → max is 80, within 2 of bottom
    expect(shouldAutoScroll(78, 100, 20, 3)).toBe(true);
  });

  it("returns false when scrolled away from bottom", () => {
    expect(shouldAutoScroll(50, 100, 20)).toBe(false);
  });

  it("returns true for empty content", () => {
    expect(shouldAutoScroll(0, 0, 20)).toBe(true);
  });

  it("returns true when content fits in viewport", () => {
    expect(shouldAutoScroll(0, 10, 20)).toBe(true);
  });

  it("uses default threshold of 1", () => {
    // offset 79, max is 80 → within default threshold of 1
    expect(shouldAutoScroll(79, 100, 20)).toBe(true);
  });
});
