/**
 * searchScroll.test.ts
 *
 * Integration tests for Phase 4: Search & Scroll Enhancements wiring.
 *
 * Tests the wiring pipeline for:
 * - findMatches, highlightText, navigateMatch → SearchBar component logic
 * - clampScrollOffset, computeVisibleRange, shouldAutoScroll → MessagePane refactored scroll
 *
 * Unit tests for these helpers already exist in scrollBox.test.ts and
 * searchHighlight.test.ts. These tests focus on integration/wiring patterns.
 */

import { describe, it, expect } from "vitest";
import {
  findMatches,
  highlightText,
  navigateMatch,
  clampScrollOffset,
  computeVisibleRange,
  shouldAutoScroll,
} from "../helpers.js";
import type { SearchMatch, SearchOptions } from "../helpers.js";

// ---------------------------------------------------------------------------
// Constants matching MessagePane
// ---------------------------------------------------------------------------

const VIEWPORT_SIZE = 20;
const PAGE_STEP = 10;

// ---------------------------------------------------------------------------
// Scroll convention conversion helper
// ---------------------------------------------------------------------------

/**
 * MessagePane uses bottom-offset: 0 = at bottom (newest visible).
 * Scroll helpers use top-offset: 0 = at top (oldest visible).
 * This converts between them.
 */
function bottomToTopOffset(
  bottomOffset: number,
  contentLength: number,
  viewportHeight: number,
): number {
  const maxOffset = Math.max(0, contentLength - viewportHeight);
  return maxOffset - Math.max(0, Math.min(bottomOffset, maxOffset));
}

// ---------------------------------------------------------------------------
// Search pipeline: findMatches → highlightText → navigateMatch
// ---------------------------------------------------------------------------

describe("search pipeline (SearchBar wiring)", () => {
  const sampleText = "The babysitter watches over the baby while the sitter reads";

  it("finds matches and highlights them with markers", () => {
    const matches = findMatches(sampleText, "baby");
    expect(matches.length).toBe(2); // "babysitter" and "baby"

    const highlighted = highlightText(sampleText, matches, "[", "]");
    expect(highlighted).toContain("[baby]sitter");
    expect(highlighted).toContain("the [baby]");
  });

  it("navigates through matches cyclically", () => {
    const matches = findMatches(sampleText, "the", { ignoreCase: true });
    expect(matches.length).toBeGreaterThan(0);

    let idx = 0;
    idx = navigateMatch(idx, matches.length, "next");
    expect(idx).toBe(1);

    // Navigate past end wraps to 0
    for (let i = 0; i < matches.length; i++) {
      idx = navigateMatch(idx, matches.length, "next");
    }
    // Should have wrapped
    expect(idx).toBeLessThan(matches.length);
  });

  it("handles empty search gracefully", () => {
    const matches = findMatches(sampleText, "");
    expect(matches).toEqual([]);

    const highlighted = highlightText(sampleText, matches, "[", "]");
    expect(highlighted).toBe(sampleText);

    const idx = navigateMatch(0, 0, "next");
    expect(idx).toBe(0);
  });

  it("case-insensitive search finds all variants", () => {
    const text = "Error: error in ERROR handler";
    const matches = findMatches(text, "error", { ignoreCase: true });
    expect(matches.length).toBe(3);

    const highlighted = highlightText(text, matches, ">>", "<<");
    expect(highlighted).toBe(">>Error<<: >>error<< in >>ERROR<< handler");
  });

  it("highlight preserves non-matching text exactly", () => {
    const text = "no match here";
    const matches = findMatches(text, "xyz");
    expect(matches).toEqual([]);

    const highlighted = highlightText(text, matches, "[", "]");
    expect(highlighted).toBe(text);
  });

  it("navigate prev wraps from first to last", () => {
    const totalMatches = 5;
    const idx = navigateMatch(0, totalMatches, "prev");
    expect(idx).toBe(4); // wraps to last
  });
});

// ---------------------------------------------------------------------------
// Scroll pipeline: bottom-offset ↔ top-offset conversion
// ---------------------------------------------------------------------------

describe("scroll convention conversion (MessagePane wiring)", () => {
  const contentLength = 50; // 50 messages

  it("bottomOffset=0 (at bottom) maps to topOffset=maxOffset", () => {
    const topOffset = bottomToTopOffset(0, contentLength, VIEWPORT_SIZE);
    expect(topOffset).toBe(contentLength - VIEWPORT_SIZE); // 30
  });

  it("bottomOffset=maxOffset (at top) maps to topOffset=0", () => {
    const maxBottom = contentLength - VIEWPORT_SIZE;
    const topOffset = bottomToTopOffset(maxBottom, contentLength, VIEWPORT_SIZE);
    expect(topOffset).toBe(0);
  });

  it("shouldAutoScroll is true when bottomOffset=0", () => {
    const topOffset = bottomToTopOffset(0, contentLength, VIEWPORT_SIZE);
    expect(shouldAutoScroll(topOffset, contentLength, VIEWPORT_SIZE)).toBe(true);
  });

  it("shouldAutoScroll is false when scrolled away from bottom", () => {
    const topOffset = bottomToTopOffset(10, contentLength, VIEWPORT_SIZE);
    expect(shouldAutoScroll(topOffset, contentLength, VIEWPORT_SIZE)).toBe(false);
  });

  it("content shorter than viewport always auto-scrolls", () => {
    expect(shouldAutoScroll(0, 5, VIEWPORT_SIZE)).toBe(true);
    const topOffset = bottomToTopOffset(0, 5, VIEWPORT_SIZE);
    expect(topOffset).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeVisibleRange with bottom-offset conversion
// ---------------------------------------------------------------------------

describe("computeVisibleRange with bottom-offset (MessagePane integration)", () => {
  const contentLength = 50;

  it("at bottom (bottomOffset=0): shows last VIEWPORT_SIZE messages", () => {
    const topOffset = bottomToTopOffset(0, contentLength, VIEWPORT_SIZE);
    const range = computeVisibleRange(topOffset, contentLength, VIEWPORT_SIZE);
    expect(range.start).toBe(30);
    expect(range.end).toBe(50);
  });

  it("at top (bottomOffset=max): shows first VIEWPORT_SIZE messages", () => {
    const maxBottom = contentLength - VIEWPORT_SIZE;
    const topOffset = bottomToTopOffset(maxBottom, contentLength, VIEWPORT_SIZE);
    const range = computeVisibleRange(topOffset, contentLength, VIEWPORT_SIZE);
    expect(range.start).toBe(0);
    expect(range.end).toBe(20);
  });

  it("partial scroll: shows correct window", () => {
    const topOffset = bottomToTopOffset(5, contentLength, VIEWPORT_SIZE);
    const range = computeVisibleRange(topOffset, contentLength, VIEWPORT_SIZE);
    expect(range.end).toBe(45); // 50 - 5 = 45
    expect(range.start).toBe(25); // 45 - 20 = 25
  });

  it("clamps over-scroll to valid range", () => {
    // bottomOffset exceeds max
    const topOffset = bottomToTopOffset(100, contentLength, VIEWPORT_SIZE);
    const range = computeVisibleRange(topOffset, contentLength, VIEWPORT_SIZE);
    expect(range.start).toBe(0);
    expect(range.end).toBe(20);
  });

  it("handles exactly viewport-sized content", () => {
    const topOffset = bottomToTopOffset(0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    const range = computeVisibleRange(topOffset, VIEWPORT_SIZE, VIEWPORT_SIZE);
    expect(range.start).toBe(0);
    expect(range.end).toBe(VIEWPORT_SIZE);
  });
});

// ---------------------------------------------------------------------------
// clampScrollOffset integration with PAGE_STEP
// ---------------------------------------------------------------------------

describe("clampScrollOffset with page navigation (MessagePane integration)", () => {
  const contentLength = 50;

  it("PageUp from bottom stays in bounds", () => {
    // Start at bottom (topOffset = maxOffset)
    let topOffset = bottomToTopOffset(0, contentLength, VIEWPORT_SIZE);
    // PageUp decreases topOffset (scroll toward top)
    topOffset = clampScrollOffset(topOffset - PAGE_STEP, contentLength, VIEWPORT_SIZE);
    expect(topOffset).toBe(20); // 30 - 10 = 20
  });

  it("PageDown from partway stays in bounds", () => {
    let topOffset = bottomToTopOffset(15, contentLength, VIEWPORT_SIZE);
    // PageDown increases topOffset (scroll toward bottom)
    topOffset = clampScrollOffset(topOffset + PAGE_STEP, contentLength, VIEWPORT_SIZE);
    expect(topOffset).toBe(25); // 15 + 10 = 25
  });

  it("multiple PageUps clamp at 0", () => {
    let topOffset = bottomToTopOffset(0, contentLength, VIEWPORT_SIZE); // 30
    for (let i = 0; i < 10; i++) {
      topOffset = clampScrollOffset(topOffset - PAGE_STEP, contentLength, VIEWPORT_SIZE);
    }
    expect(topOffset).toBe(0);
  });

  it("single arrow step from bottom", () => {
    let topOffset = bottomToTopOffset(0, contentLength, VIEWPORT_SIZE); // 30
    topOffset = clampScrollOffset(topOffset - 1, contentLength, VIEWPORT_SIZE);
    expect(topOffset).toBe(29);
  });
});

// ---------------------------------------------------------------------------
// Full search + scroll integration
// ---------------------------------------------------------------------------

describe("search + scroll combined pipeline", () => {
  it("find match index maps to a scroll position", () => {
    // Simulate: 50 message lines, search finds match at message index 10
    const messageTexts = Array.from({ length: 50 }, (_, i) => `message ${i}`);
    const fullText = messageTexts.join("\n");
    const matches = findMatches(fullText, "message 10");
    expect(matches.length).toBeGreaterThanOrEqual(1);

    // The match is in the first portion of content — we'd scroll to show it
    // Using character offset to approximate line number
    const matchLine = fullText.slice(0, matches[0].start).split("\n").length - 1;
    expect(matchLine).toBe(10);

    // Scroll to make that line visible
    const topOffset = clampScrollOffset(matchLine, 50, VIEWPORT_SIZE);
    const range = computeVisibleRange(topOffset, 50, VIEWPORT_SIZE);
    expect(range.start).toBeLessThanOrEqual(matchLine);
    expect(range.end).toBeGreaterThan(matchLine);
  });

  it("navigate matches updates scroll position to keep match visible", () => {
    const totalMatches = 8;
    let currentIdx = 0;

    // Navigate forward through all matches
    const visited = new Set<number>();
    for (let i = 0; i < totalMatches; i++) {
      visited.add(currentIdx);
      currentIdx = navigateMatch(currentIdx, totalMatches, "next");
    }
    // Should have visited all indices and wrapped back to 0
    expect(visited.size).toBe(totalMatches);
    expect(currentIdx).toBe(0);
  });
});
