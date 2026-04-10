/**
 * promptBarHelpers.test.ts
 *
 * Tests for pure helper functions exported from PromptBar.tsx:
 * getSlashHints, countLines, SLASH_COMMANDS.
 */

import { describe, it, expect } from "vitest";
import {
  getSlashHints,
  countLines,
  SLASH_COMMANDS,
} from "../components/PromptBar.js";

// ---------------------------------------------------------------------------
// SLASH_COMMANDS
// ---------------------------------------------------------------------------

describe("SLASH_COMMANDS", () => {
  it("is a non-empty array", () => {
    expect(SLASH_COMMANDS.length).toBeGreaterThan(0);
  });

  it("every command has a name starting with /", () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.name.startsWith("/")).toBe(true);
    }
  });

  it("every command has a non-empty description", () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.description.length).toBeGreaterThan(0);
    }
  });

  it("includes /status command", () => {
    const found = SLASH_COMMANDS.find((c) => c.name === "/status");
    expect(found).toBeDefined();
  });

  it("includes /help command", () => {
    const found = SLASH_COMMANDS.find((c) => c.name === "/help");
    expect(found).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// getSlashHints
// ---------------------------------------------------------------------------

describe("getSlashHints", () => {
  it("returns empty for non-slash input", () => {
    expect(getSlashHints("hello")).toEqual([]);
  });

  it("returns empty for empty string", () => {
    expect(getSlashHints("")).toEqual([]);
  });

  it("returns all commands for just /", () => {
    const result = getSlashHints("/");
    expect(result.length).toBe(SLASH_COMMANDS.length);
  });

  it("filters by prefix match", () => {
    const result = getSlashHints("/st");
    expect(result.length).toBeGreaterThan(0);
    for (const cmd of result) {
      expect(cmd.name.startsWith("/st")).toBe(true);
    }
  });

  it("returns matching command for exact name", () => {
    const result = getSlashHints("/status");
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("/status");
  });

  it("is case-insensitive", () => {
    const result = getSlashHints("/STATUS");
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("/status");
  });

  it("returns empty for non-matching prefix", () => {
    const result = getSlashHints("/zzz");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// countLines
// ---------------------------------------------------------------------------

describe("countLines", () => {
  it("returns 1 for single line", () => {
    expect(countLines("hello")).toBe(1);
  });

  it("returns 2 for text with one newline", () => {
    expect(countLines("hello\nworld")).toBe(2);
  });

  it("returns 1 for empty string", () => {
    expect(countLines("")).toBe(1);
  });

  it("counts multiple newlines", () => {
    expect(countLines("a\nb\nc\nd")).toBe(4);
  });

  it("handles trailing newline", () => {
    expect(countLines("hello\n")).toBe(2);
  });
});
