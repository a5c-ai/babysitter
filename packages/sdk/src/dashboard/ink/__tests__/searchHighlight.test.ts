/**
 * searchHighlight.test.ts
 *
 * Tests for search and highlight pure functions.
 */

import { describe, it, expect } from "vitest";
import {
  findMatches,
  highlightText,
  navigateMatch,
} from "../helpers.js";
import type { SearchMatch } from "../helpers.js";

// ---------------------------------------------------------------------------
// findMatches
// ---------------------------------------------------------------------------

describe("findMatches", () => {
  it("returns correct positions for a simple pattern", () => {
    const matches = findMatches("hello world hello", "hello");
    expect(matches).toHaveLength(2);
    expect(matches[0].start).toBe(0);
    expect(matches[0].end).toBe(5);
    expect(matches[1].start).toBe(12);
    expect(matches[1].end).toBe(17);
  });

  it("returns empty array for no matches", () => {
    const matches = findMatches("hello world", "xyz");
    expect(matches).toHaveLength(0);
  });

  it("handles case-insensitive search", () => {
    const matches = findMatches("Hello HELLO hello", "hello", { ignoreCase: true });
    expect(matches).toHaveLength(3);
  });

  it("is case-sensitive by default", () => {
    const matches = findMatches("Hello HELLO hello", "hello");
    expect(matches).toHaveLength(1);
    expect(matches[0].start).toBe(12);
  });

  it("returns empty for empty pattern", () => {
    const matches = findMatches("hello world", "");
    expect(matches).toHaveLength(0);
  });

  it("returns empty for empty text", () => {
    const matches = findMatches("", "hello");
    expect(matches).toHaveLength(0);
  });

  it("handles overlapping matches at different positions", () => {
    const matches = findMatches("aaa", "aa");
    // Should find at least 1 match (non-overlapping)
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// highlightText
// ---------------------------------------------------------------------------

describe("highlightText", () => {
  it("wraps matches with markers", () => {
    const matches: SearchMatch[] = [{ start: 0, end: 5 }];
    const result = highlightText("hello world", matches, "[", "]");
    expect(result).toBe("[hello] world");
  });

  it("handles multiple matches", () => {
    const matches: SearchMatch[] = [
      { start: 0, end: 5 },
      { start: 6, end: 11 },
    ];
    const result = highlightText("hello world", matches, "[", "]");
    expect(result).toBe("[hello] [world]");
  });

  it("returns original text for no matches", () => {
    const result = highlightText("hello world", [], "[", "]");
    expect(result).toBe("hello world");
  });

  it("handles adjacent matches", () => {
    const matches: SearchMatch[] = [
      { start: 0, end: 3 },
      { start: 3, end: 6 },
    ];
    const result = highlightText("abcdef", matches, "[", "]");
    expect(result).toBe("[abc][def]");
  });
});

// ---------------------------------------------------------------------------
// navigateMatch
// ---------------------------------------------------------------------------

describe("navigateMatch", () => {
  it("advances to next match index", () => {
    expect(navigateMatch(0, 5, "next")).toBe(1);
  });

  it("wraps around to 0 at end", () => {
    expect(navigateMatch(4, 5, "next")).toBe(0);
  });

  it("goes to previous match", () => {
    expect(navigateMatch(2, 5, "prev")).toBe(1);
  });

  it("wraps around to last at beginning", () => {
    expect(navigateMatch(0, 5, "prev")).toBe(4);
  });

  it("returns 0 for single match", () => {
    expect(navigateMatch(0, 1, "next")).toBe(0);
  });

  it("returns 0 for zero matches", () => {
    expect(navigateMatch(0, 0, "next")).toBe(0);
  });
});
