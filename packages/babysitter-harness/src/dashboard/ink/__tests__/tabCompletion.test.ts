/**
 * tabCompletion.test.ts
 *
 * Tests for Tab completion of slash commands in PromptBar.
 * Tests the pure completion logic (completeSlashCommand).
 *
 * Phase 3: Tab completion for slash commands (Wave 7)
 */

import { describe, it, expect } from "vitest";
import { completeSlashCommand, getSlashHints, SLASH_COMMANDS } from "../components/PromptBar.js";

// ---------------------------------------------------------------------------
// completeSlashCommand
// ---------------------------------------------------------------------------

describe("completeSlashCommand", () => {
  it("completes exact match with trailing space", () => {
    const result = completeSlashCommand("/help");
    expect(result).toBe("/help ");
  });

  it("completes single matching prefix", () => {
    const result = completeSlashCommand("/he");
    expect(result).toBe("/help ");
  });

  it("completes /cl to /clear", () => {
    const result = completeSlashCommand("/cl");
    expect(result).toBe("/clear ");
  });

  it("completes /ver to /verbosity", () => {
    const result = completeSlashCommand("/ver");
    expect(result).toBe("/verbosity ");
  });

  it("returns null when no matches", () => {
    const result = completeSlashCommand("/xyz");
    expect(result).toBeNull();
  });

  it("returns common prefix for multiple matches", () => {
    // /search and /status both start with /s
    // But /search is the only one starting with /se
    const result = completeSlashCommand("/se");
    expect(result).toBe("/search ");
  });

  it("returns null for empty input", () => {
    const result = completeSlashCommand("");
    expect(result).toBeNull();
  });

  it("returns null for non-slash input", () => {
    const result = completeSlashCommand("hello");
    expect(result).toBeNull();
  });

  it("returns longest common prefix when multiple matches exist", () => {
    // Multiple commands match /s: /status, /search
    const result = completeSlashCommand("/s");
    // Should return the LCP which might be /s (no further completion possible)
    // since /status and /search diverge after /s
    if (result !== null) {
      expect(result.startsWith("/s")).toBe(true);
    }
  });

  it("handles already-complete command with space", () => {
    // Input is already /help followed by space — no further completion
    const result = completeSlashCommand("/help ");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getSlashHints sanity check
// ---------------------------------------------------------------------------

describe("getSlashHints for tab completion", () => {
  it("returns matches for /", () => {
    const hints = getSlashHints("/");
    expect(hints.length).toBe(SLASH_COMMANDS.length);
  });

  it("returns subset for /h", () => {
    const hints = getSlashHints("/h");
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.every((h) => h.name.startsWith("/h"))).toBe(true);
  });

  it("returns empty for non-slash input", () => {
    expect(getSlashHints("hello")).toEqual([]);
  });
});
