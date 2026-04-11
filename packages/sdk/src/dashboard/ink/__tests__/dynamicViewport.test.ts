/**
 * dynamicViewport.test.ts
 *
 * Tests for dynamic viewport sizing based on terminal dimensions.
 *
 * Phase 4: Dynamic viewport sizing (Wave 9)
 */

import { describe, it, expect } from "vitest";
import {
  computeViewportSize,
  computeVisibleRows,
} from "../helpers.js";

describe("computeViewportSize", () => {
  it("returns terminal rows minus reserved rows", () => {
    const size = computeViewportSize(30, 8);
    expect(size).toBe(22); // 30 - 8
  });

  it("defaults reserved rows to 8", () => {
    const size = computeViewportSize(30);
    expect(size).toBe(22); // 30 - 8
  });

  it("enforces minimum of 5", () => {
    const size = computeViewportSize(10, 8);
    expect(size).toBe(5); // max(5, 10-8) = max(5, 2) = 5
  });

  it("handles very small terminal", () => {
    const size = computeViewportSize(5, 8);
    expect(size).toBe(5); // max(5, 5-8) = max(5, -3) = 5
  });

  it("defaults terminal rows to 24 when undefined", () => {
    const size = computeViewportSize(undefined, 8);
    expect(size).toBe(16); // max(5, 24-8) = 16
  });

  it("handles large terminal", () => {
    const size = computeViewportSize(80, 8);
    expect(size).toBe(72); // 80 - 8
  });

  it("handles custom reserved rows", () => {
    const size = computeViewportSize(40, 15);
    expect(size).toBe(25); // 40 - 15
  });
});

describe("computeVisibleRows", () => {
  it("returns terminal rows minus reserved rows", () => {
    const rows = computeVisibleRows(30, 6);
    expect(rows).toBe(24); // 30 - 6
  });

  it("defaults reserved rows to 6", () => {
    const rows = computeVisibleRows(30);
    expect(rows).toBe(24); // 30 - 6
  });

  it("enforces minimum of 3", () => {
    const rows = computeVisibleRows(5, 6);
    expect(rows).toBe(3); // max(3, 5-6) = max(3, -1) = 3
  });

  it("defaults terminal rows to 24 when undefined", () => {
    const rows = computeVisibleRows(undefined, 6);
    expect(rows).toBe(18); // max(3, 24-6) = 18
  });
});
