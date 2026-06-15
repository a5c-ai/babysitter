import { describe, it, expect, beforeEach, vi } from "vitest";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ResponderProfile, BreakpointContext } from "../types.js";
import { ResponderMatcher } from "../client/responder-matcher.js";

// ────────────────────────────────────────────────────────────────────────────
// Factories
// ────────────────────────────────────────────────────────────────────────────

function makeResponder(overrides: Partial<ResponderProfile> = {}): ResponderProfile {
  return {
    id: "resp-001",
    name: "Tal M",
    title: "Senior Engineer",
    domains: ["backend", "database"],
    tags: ["performance", "redis"],
    availability: true,
    responseTimeSla: 3600,
    ...overrides,
  };
}

function makeContext(overrides: Partial<BreakpointContext> = {}): BreakpointContext {
  return {
    description: "",
    codeSnippets: [],
    fileReferences: [],
    tags: [],
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("ResponderMatcher", () => {
  const packagedResponderDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../responder",
  );

  // ── Constructor ──────────────────────────────────────────────────────────

  describe("constructor", () => {
    it("should accept an array of responders in options", () => {
      const responders = [makeResponder()];
      const matcher = new ResponderMatcher({ responders });
      expect(matcher.getResponders()).toHaveLength(1);
    });

    it("should accept a string as responder directory path", () => {
      const matcher = new ResponderMatcher("/some/path");
      expect(matcher.getResponders()).toHaveLength(0);
    });

    it("should accept empty options", () => {
      const matcher = new ResponderMatcher({});
      expect(matcher.getResponders()).toHaveLength(0);
    });

    it("should accept no arguments", () => {
      const matcher = new ResponderMatcher();
      expect(matcher.getResponders()).toHaveLength(0);
    });
  });

  // ── getResponders ───────────────────────────────────────────────────────

  describe("getResponders()", () => {
    it("should return a copy of loaded responders", () => {
      const responders = [makeResponder()];
      const matcher = new ResponderMatcher({ responders });
      const returned = matcher.getResponders();

      expect(returned).toHaveLength(1);
      expect(returned).not.toBe(responders); // Different reference
    });
  });

  describe("loadResponders()", () => {
    it("loads the packaged responder examples exactly as shipped", async () => {
      const matcher = new ResponderMatcher(packagedResponderDir);

      const responders = await matcher.loadResponders();

      expect(responders.map((responder) => responder.id).sort()).toEqual([
        "backend-responder",
        "devops-responder",
        "frontend-responder",
      ]);
    });
  });

  // ── matchResponders ─────────────────────────────────────────────────────

  describe("matchResponders()", () => {
    it("should throw if loadResponders has not been called (and no responders provided)", () => {
      const matcher = new ResponderMatcher({});
      expect(() => matcher.matchResponders("test")).toThrow("Responders not loaded");
    });

    it("should not throw if responders were provided in constructor", () => {
      const matcher = new ResponderMatcher({ responders: [makeResponder()] });
      expect(() => matcher.matchResponders("test")).not.toThrow();
    });

    it("should match responders by domain keywords", () => {
      const responders = [
        makeResponder({ id: "backend-expert", domains: ["backend", "database"], tags: [] }),
        makeResponder({ id: "frontend-expert", domains: ["frontend", "react"], tags: [] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("Need help with the backend database query");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].responder.id).toBe("backend-expert");
    });

    it("should match responders by tag keywords", () => {
      const responders = [
        makeResponder({ id: "redis-expert", domains: [], tags: ["redis", "caching"] }),
        makeResponder({ id: "postgres-expert", domains: [], tags: ["postgres", "sql"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("Redis caching strategy question");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].responder.id).toBe("redis-expert");
    });

    it("should use context tags for matching", () => {
      const responders = [
        makeResponder({ id: "security-expert", domains: ["security"], tags: ["auth"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const context = makeContext({ tags: ["security", "auth"] });
      const results = matcher.matchResponders("How to handle this?", context);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedDomains).toContain("security");
    });

    it("should use context description for matching", () => {
      const responders = [
        makeResponder({ id: "infra-expert", domains: ["infrastructure"], tags: [] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const context = makeContext({ description: "Infrastructure scaling problem" });
      const results = matcher.matchResponders("Help needed", context);

      expect(results.length).toBeGreaterThan(0);
    });

    it("should exclude unavailable responders", () => {
      const responders = [
        makeResponder({ id: "available", availability: true, domains: ["backend"] }),
        makeResponder({ id: "unavailable", availability: false, domains: ["backend"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("Backend issue");

      expect(results).toHaveLength(1);
      expect(results[0].responder.id).toBe("available");
    });

    it("should return empty array when no responders match", () => {
      const responders = [
        makeResponder({ id: "backend-expert", domains: ["backend"], tags: ["database"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("quantum physics question");

      expect(results).toEqual([]);
    });

    it("should sort results by descending score", () => {
      const responders = [
        makeResponder({ id: "low-match", domains: ["backend"], tags: [] }),
        makeResponder({ id: "high-match", domains: ["backend", "database"], tags: ["performance", "redis"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("backend database performance redis optimization");

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results[0].responder.id).toBe("high-match");
    });

    it("should filter by required domains when provided", () => {
      const responders = [
        makeResponder({ id: "backend-expert", domains: ["backend", "database"], tags: [] }),
        makeResponder({ id: "frontend-expert", domains: ["frontend", "react"], tags: [] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("frontend and backend question", undefined, ["frontend"]);

      const ids = results.map((r) => r.responder.id);
      expect(ids).toContain("frontend-expert");
      expect(ids).not.toContain("backend-expert");
    });

    it("should include matched domains in the result", () => {
      const responders = [
        makeResponder({ id: "expert", domains: ["backend", "security"], tags: [] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("backend security question");

      expect(results[0].matchedDomains).toContain("backend");
      expect(results[0].matchedDomains).toContain("security");
    });

    it("should include matched topics in the result", () => {
      const responders = [
        makeResponder({ id: "expert", domains: [], tags: ["redis", "caching", "performance"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("redis caching question");

      expect(results[0].matchedTopics.length).toBeGreaterThan(0);
    });

    it("should award 3 points per domain keyword match", () => {
      const responders = [
        makeResponder({ id: "expert", domains: ["backend"], tags: [] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("backend issue");

      // "backend" token matches "backend" domain -> +3
      expect(results[0].score).toBe(3);
    });

    it("should award 2 points per tag match", () => {
      const responders = [
        makeResponder({ id: "expert", domains: [], tags: ["redis"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("redis question");

      // "redis" token matches "redis" tag -> +2
      expect(results[0].score).toBe(2);
    });

    it("should ignore tokens shorter than 3 characters", () => {
      const responders = [
        makeResponder({ id: "expert", domains: ["go"], tags: ["ai"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      // "go" and "ai" are < 3 chars, so no match
      const results = matcher.matchResponders("go ai");
      expect(results).toEqual([]);
    });

    it("should handle responders with no domains or tags", () => {
      const responders = [
        makeResponder({ id: "generalist", domains: [], tags: [] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("any question");
      expect(results).toEqual([]);
    });

    it("should handle multiple responders matching the same breakpoint", () => {
      const responders = [
        makeResponder({ id: "expert-1", domains: ["backend"], tags: ["performance"] }),
        makeResponder({ id: "expert-2", domains: ["backend"], tags: ["security"] }),
        makeResponder({ id: "expert-3", domains: ["frontend"], tags: ["performance"] }),
      ];
      const matcher = new ResponderMatcher({ responders });

      const results = matcher.matchResponders("backend performance optimization");

      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── loadResponders ──────────────────────────────────────────────────────

  describe("loadResponders()", () => {
    it("should return provided responders if they were given in constructor", async () => {
      const responders = [makeResponder()];
      const matcher = new ResponderMatcher({ responders });

      const loaded = await matcher.loadResponders();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe("resp-001");
    });

    it("should return empty array when directory does not exist", async () => {
      const matcher = new ResponderMatcher({ responderDir: "/nonexistent/path/to/responders" });

      const loaded = await matcher.loadResponders();
      expect(loaded).toEqual([]);
    });
  });
});
