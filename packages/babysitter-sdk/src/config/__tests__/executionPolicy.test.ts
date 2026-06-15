import { afterEach, beforeEach, describe, expect, it } from "vitest";
// NOTE (#949): executionPolicy does not exist yet — this import is expected to
// fail to resolve until the gating helpers are implemented. That makes this
// suite RED on purpose.
import { crossSubagentsEnabled, executeTasksEnabled } from "../executionPolicy";

const ENV_KEYS = ["BABYSITTER_CROSS_SUBAGENTS", "BABYSITTER_EXECUTE_TASKS"] as const;

describe("executionPolicy env gating (#949)", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
  });

  describe("crossSubagentsEnabled()", () => {
    it("is false by default (unset)", () => {
      delete process.env.BABYSITTER_CROSS_SUBAGENTS;
      expect(crossSubagentsEnabled()).toBe(false);
    });

    it('is true for "1"', () => {
      process.env.BABYSITTER_CROSS_SUBAGENTS = "1";
      expect(crossSubagentsEnabled()).toBe(true);
    });

    it('is true for "true"', () => {
      process.env.BABYSITTER_CROSS_SUBAGENTS = "true";
      expect(crossSubagentsEnabled()).toBe(true);
    });

    it('is false for "0"', () => {
      process.env.BABYSITTER_CROSS_SUBAGENTS = "0";
      expect(crossSubagentsEnabled()).toBe(false);
    });

    it('is false for "" (empty)', () => {
      process.env.BABYSITTER_CROSS_SUBAGENTS = "";
      expect(crossSubagentsEnabled()).toBe(false);
    });
  });

  describe("executeTasksEnabled()", () => {
    it("is false by default (unset)", () => {
      delete process.env.BABYSITTER_EXECUTE_TASKS;
      expect(executeTasksEnabled()).toBe(false);
    });

    it('is true for "1"', () => {
      process.env.BABYSITTER_EXECUTE_TASKS = "1";
      expect(executeTasksEnabled()).toBe(true);
    });

    it('is true for "true"', () => {
      process.env.BABYSITTER_EXECUTE_TASKS = "true";
      expect(executeTasksEnabled()).toBe(true);
    });

    it('is false for "0"', () => {
      process.env.BABYSITTER_EXECUTE_TASKS = "0";
      expect(executeTasksEnabled()).toBe(false);
    });

    it('is false for "" (empty)', () => {
      process.env.BABYSITTER_EXECUTE_TASKS = "";
      expect(executeTasksEnabled()).toBe(false);
    });
  });

  it("the two flags are independent of each other", () => {
    process.env.BABYSITTER_CROSS_SUBAGENTS = "1";
    delete process.env.BABYSITTER_EXECUTE_TASKS;
    expect(crossSubagentsEnabled()).toBe(true);
    expect(executeTasksEnabled()).toBe(false);

    delete process.env.BABYSITTER_CROSS_SUBAGENTS;
    process.env.BABYSITTER_EXECUTE_TASKS = "1";
    expect(crossSubagentsEnabled()).toBe(false);
    expect(executeTasksEnabled()).toBe(true);
  });
});
