/**
 * slashCommands.test.ts
 *
 * TDD tests for slash command parsing, validation, and completion helpers.
 *
 * Phase 4: Breakpoint & Interaction UI (GAP-UX-001c)
 *
 * All functions imported from ../helpers.js (Red phase — not yet implemented).
 */

import { describe, it, expect } from "vitest";
import {
  parseSlashCommand,
  isValidSlashCommand,
  getSlashCompletions,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// SlashCommandDef shape used by getSlashCompletions
// ---------------------------------------------------------------------------

interface SlashCommandDef {
  readonly name: string;
  readonly description: string;
}

const SAMPLE_COMMANDS: SlashCommandDef[] = [
  { name: "/status", description: "Show run status" },
  { name: "/show", description: "Show details" },
  { name: "/back", description: "Go back" },
  { name: "/help", description: "Show help" },
  { name: "/clear", description: "Clear messages" },
];

// ---------------------------------------------------------------------------
// parseSlashCommand
// ---------------------------------------------------------------------------

describe("parseSlashCommand", () => {
  it("parses a simple command with no args", () => {
    expect(parseSlashCommand("/status")).toEqual({
      command: "status",
      args: "",
    });
  });

  it("parses a command with args", () => {
    expect(parseSlashCommand("/status foo")).toEqual({
      command: "status",
      args: "foo",
    });
  });

  it("parses a command with multiple args", () => {
    expect(parseSlashCommand("/show run-123 --verbose")).toEqual({
      command: "show",
      args: "run-123 --verbose",
    });
  });

  it("parses /back with no args", () => {
    expect(parseSlashCommand("/back")).toEqual({
      command: "back",
      args: "",
    });
  });

  it("returns null for plain text (not a slash command)", () => {
    expect(parseSlashCommand("hello")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseSlashCommand("")).toBeNull();
  });

  it("returns null for just a slash with no command name", () => {
    expect(parseSlashCommand("/")).toBeNull();
  });

  it("handles case insensitive command names", () => {
    expect(parseSlashCommand("/STATUS")).toEqual({
      command: "status",
      args: "",
    });
  });

  it("handles mixed case command names", () => {
    expect(parseSlashCommand("/Status")).toEqual({
      command: "status",
      args: "",
    });
  });

  it("trims whitespace from input", () => {
    expect(parseSlashCommand("  /status  ")).toEqual({
      command: "status",
      args: "",
    });
  });

  it("trims whitespace from args", () => {
    expect(parseSlashCommand("/status   foo bar  ")).toEqual({
      command: "status",
      args: "foo bar",
    });
  });

  it("returns null for whitespace-only input", () => {
    expect(parseSlashCommand("   ")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isValidSlashCommand
// ---------------------------------------------------------------------------

describe("isValidSlashCommand", () => {
  const validCommands = ["status", "back", "help", "clear", "verbosity"];

  it("returns true for a known command", () => {
    expect(isValidSlashCommand("status", validCommands)).toBe(true);
  });

  it("returns true for another known command", () => {
    expect(isValidSlashCommand("back", validCommands)).toBe(true);
  });

  it("returns false for an unknown command", () => {
    expect(isValidSlashCommand("unknown", validCommands)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidSlashCommand("", validCommands)).toBe(false);
  });

  it("handles case insensitive matching", () => {
    expect(isValidSlashCommand("STATUS", validCommands)).toBe(true);
  });

  it("handles mixed case matching", () => {
    expect(isValidSlashCommand("Help", validCommands)).toBe(true);
  });

  it("returns false with empty valid commands list", () => {
    expect(isValidSlashCommand("status", [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getSlashCompletions
// ---------------------------------------------------------------------------

describe("getSlashCompletions", () => {
  it("returns matching commands for partial input /s", () => {
    const results = getSlashCompletions("/s", SAMPLE_COMMANDS);
    const names = results.map((r) => r.name);
    expect(names).toContain("/status");
    expect(names).toContain("/show");
    expect(names).not.toContain("/back");
  });

  it("returns all commands for bare slash /", () => {
    const results = getSlashCompletions("/", SAMPLE_COMMANDS);
    expect(results).toHaveLength(SAMPLE_COMMANDS.length);
  });

  it("returns empty array for input that matches nothing", () => {
    const results = getSlashCompletions("/xyz", SAMPLE_COMMANDS);
    expect(results).toHaveLength(0);
  });

  it("returns exact match for full command name", () => {
    const results = getSlashCompletions("/status", SAMPLE_COMMANDS);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("/status");
  });

  it("returns empty array for non-slash input", () => {
    const results = getSlashCompletions("", SAMPLE_COMMANDS);
    expect(results).toHaveLength(0);
  });

  it("returns empty array for plain text", () => {
    const results = getSlashCompletions("status", SAMPLE_COMMANDS);
    expect(results).toHaveLength(0);
  });

  it("is case insensitive", () => {
    const results = getSlashCompletions("/S", SAMPLE_COMMANDS);
    const names = results.map((r) => r.name);
    expect(names).toContain("/status");
    expect(names).toContain("/show");
  });

  it("matches /b to /back only", () => {
    const results = getSlashCompletions("/b", SAMPLE_COMMANDS);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("/back");
  });

  it("matches /h to /help only", () => {
    const results = getSlashCompletions("/h", SAMPLE_COMMANDS);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("/help");
  });

  it("matches /cl to /clear only", () => {
    const results = getSlashCompletions("/cl", SAMPLE_COMMANDS);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("/clear");
  });
});
