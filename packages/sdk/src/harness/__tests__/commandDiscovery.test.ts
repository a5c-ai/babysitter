import { describe, it, expect } from "vitest";
import {
  searchCommands,
  getCommandsByCommandCategory,
  getContextualSuggestions,
  getAllCommands,
  getCommandCategories,
} from "../commandDiscovery";

describe("GAP-UX-011: Command Discovery", () => {
  describe("searchCommands", () => {
    it("finds commands by exact name match", () => {
      const results = searchCommands("run:status");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe("run:status");
    });

    it("finds commands by tag", () => {
      const results = searchCommands("tokens");
      expect(results.some((c) => c.name === "tokens:stats")).toBe(true);
    });

    it("finds commands by description keyword", () => {
      const results = searchCommands("journal");
      expect(results.some((c) => c.name === "run:events")).toBe(true);
    });

    it("returns empty for unmatched query", () => {
      const results = searchCommands("xyznonexistent");
      expect(results).toEqual([]);
    });

    it("returns all commands with empty query", () => {
      const all = getAllCommands();
      const results = searchCommands("", 100);
      expect(results.length).toBe(all.length);
    });

    it("respects maxResults", () => {
      const results = searchCommands("run", 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getCommandsByCommandCategory", () => {
    it("returns run commands", () => {
      const cmds = getCommandsByCommandCategory("run");
      expect(cmds.length).toBeGreaterThan(0);
      expect(cmds.every((c) => c.category === "run")).toBe(true);
    });
  });

  describe("getContextualSuggestions", () => {
    it("suggests status commands when run exists", () => {
      const suggestions = getContextualSuggestions({
        hasRun: true,
        hasPendingTasks: false,
        hasSession: false,
        isStuck: false,
      });
      expect(suggestions.some((c) => c.name === "run:status")).toBe(true);
    });

    it("suggests task commands when tasks are pending", () => {
      const suggestions = getContextualSuggestions({
        hasRun: true,
        hasPendingTasks: true,
        hasSession: false,
        isStuck: false,
      });
      expect(suggestions.some((c) => c.name === "task:list")).toBe(true);
    });

    it("suggests recovery commands when stuck", () => {
      const suggestions = getContextualSuggestions({
        hasRun: true,
        hasPendingTasks: false,
        hasSession: false,
        isStuck: true,
      });
      expect(suggestions.some((c) => c.name === "run:rebuild-state")).toBe(true);
    });

    it("suggests harness commands when no run exists", () => {
      const suggestions = getContextualSuggestions({
        hasRun: false,
        hasPendingTasks: false,
        hasSession: false,
        isStuck: false,
      });
      expect(suggestions.some((c) => c.name === "harness:call")).toBe(true);
    });
  });

  describe("getCommandCategories", () => {
    it("returns distinct sorted categories", () => {
      const categories = getCommandCategories();
      expect(categories.length).toBeGreaterThan(3);
      expect(categories).toEqual([...categories].sort());
    });
  });
});
