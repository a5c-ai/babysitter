import { describe, it, expect } from "vitest";
import {
  searchCommands,
  suggestCommands,
  COMMAND_REGISTRY,
  type CommandInfo,
} from "../commandRegistry";

describe("GAP-UX-011: Command Discoverability", () => {
  describe("COMMAND_REGISTRY", () => {
    it("contains all major command categories", () => {
      const categories = new Set(COMMAND_REGISTRY.map((c) => c.category));
      expect(categories).toContain("run");
      expect(categories).toContain("task");
      expect(categories).toContain("session");
      expect(categories).toContain("harness");
      expect(categories).toContain("plugin");
      expect(categories).toContain("config");
      expect(categories).toContain("debug");
      expect(categories).toContain("help");
    });

    it("has at least 40 commands", () => {
      expect(COMMAND_REGISTRY.length).toBeGreaterThanOrEqual(40);
    });

    it("every command has name and description", () => {
      for (const cmd of COMMAND_REGISTRY) {
        expect(cmd.name).toBeTruthy();
        expect(cmd.description).toBeTruthy();
      }
    });
  });

  describe("searchCommands", () => {
    it("finds by exact command name", () => {
      const results = searchCommands("run:create");
      expect(results.some((c) => c.name === "run:create")).toBe(true);
    });

    it("finds by partial name", () => {
      const results = searchCommands("task:");
      expect(results.length).toBeGreaterThanOrEqual(3);
      expect(results.every((c) => c.name.includes("task:"))).toBe(true);
    });

    it("finds by description keyword", () => {
      const results = searchCommands("journal");
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("finds by alias", () => {
      const results = searchCommands("status");
      expect(results.some((c) => c.aliases?.includes("status"))).toBe(true);
    });

    it("returns empty for nonsense query", () => {
      expect(searchCommands("xyzzy42")).toHaveLength(0);
    });

    it("is case insensitive", () => {
      const results = searchCommands("RUN:CREATE");
      expect(results.some((c) => c.name === "run:create")).toBe(true);
    });

    it("returns empty for empty query", () => {
      expect(searchCommands("")).toHaveLength(0);
      expect(searchCommands("  ")).toHaveLength(0);
    });

    it("finds by category", () => {
      const results = searchCommands("plugin");
      expect(results.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("suggestCommands", () => {
    it("suggests run:create when no active run", () => {
      const suggestions = suggestCommands({ hasRun: false });
      expect(suggestions.some((c) => c.name === "run:create")).toBe(true);
    });

    it("suggests task:post when effects pending", () => {
      const suggestions = suggestCommands({ hasRun: true, hasPendingEffects: true });
      expect(suggestions.some((c) => c.name === "task:post")).toBe(true);
      expect(suggestions.some((c) => c.name === "task:list")).toBe(true);
    });

    it("suggests recovery for failed runs", () => {
      const suggestions = suggestCommands({ hasRun: true, runStatus: "failed" });
      expect(suggestions.some((c) => c.name === "run:rebuild-state")).toBe(true);
      expect(suggestions.some((c) => c.name === "run:repair-journal")).toBe(true);
    });

    it("suggests review commands for completed runs", () => {
      const suggestions = suggestCommands({ hasRun: true, runStatus: "completed" });
      expect(suggestions.some((c) => c.name === "run:events")).toBe(true);
    });

    it("always includes run:status for active runs", () => {
      const suggestions = suggestCommands({ hasRun: true });
      expect(suggestions.some((c) => c.name === "run:status")).toBe(true);
    });

    it("does not contain duplicates", () => {
      const suggestions = suggestCommands({ hasRun: true, hasPendingEffects: true });
      const names = suggestions.map((s) => s.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });
});
