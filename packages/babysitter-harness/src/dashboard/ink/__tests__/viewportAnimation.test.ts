/**
 * viewportAnimation.test.ts
 *
 * Tests for viewport-aware animation pure functions.
 */

import { describe, it, expect } from "vitest";
import {
  shouldAnimateTick,
  computeFrameIndex,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// shouldAnimateTick
// ---------------------------------------------------------------------------

describe("shouldAnimateTick", () => {
  it("returns true when element is visible", () => {
    expect(shouldAnimateTick({ visible: true, focused: true })).toBe(true);
  });

  it("returns false when element is not visible", () => {
    expect(shouldAnimateTick({ visible: false, focused: true })).toBe(false);
  });

  it("returns true when visible but terminal not focused (reduced rate)", () => {
    // Should still animate, but caller can use reduced rate
    expect(shouldAnimateTick({ visible: true, focused: false })).toBe(true);
  });

  it("returns false when not visible and not focused", () => {
    expect(shouldAnimateTick({ visible: false, focused: false })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeFrameIndex
// ---------------------------------------------------------------------------

describe("computeFrameIndex", () => {
  it("returns 0 at time 0", () => {
    expect(computeFrameIndex(0, 100, 4)).toBe(0);
  });

  it("advances frame based on elapsed and interval", () => {
    // 250ms elapsed, 100ms interval, 4 frames → frame 2
    expect(computeFrameIndex(250, 100, 4)).toBe(2);
  });

  it("wraps around when exceeding frame count", () => {
    // 500ms elapsed, 100ms interval, 4 frames → frame 1 (5 % 4 = 1)
    expect(computeFrameIndex(500, 100, 4)).toBe(1);
  });

  it("handles single frame", () => {
    expect(computeFrameIndex(1000, 100, 1)).toBe(0);
  });

  it("handles zero interval gracefully", () => {
    expect(computeFrameIndex(100, 0, 4)).toBe(0);
  });

  it("handles negative elapsed", () => {
    expect(computeFrameIndex(-100, 100, 4)).toBe(0);
  });
});
