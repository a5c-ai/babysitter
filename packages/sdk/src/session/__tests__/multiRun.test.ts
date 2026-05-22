import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  addRunToSession,
  getSessionRuns,
} from "../write";
import {
  parseSessionState,
  readSessionFile,
  DEFAULT_SESSION_STATE,
} from "../parse";
import {
  serializeSessionState,
  writeSessionFile,
} from "../write";
import { SessionErrorCode } from "../types";
import type { SessionState } from "../types";

describe("GAP-SESSION-001: Session-to-Run One-to-Many", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-multi-run-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  describe("SessionState.runIds field", () => {
    it("DEFAULT_SESSION_STATE includes empty runIds array", () => {
      expect(DEFAULT_SESSION_STATE.runIds).toEqual([]);
    });

    it("runIds is an array of strings", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runIds: ["run-1", "run-2"],
      };
      expect(state.runIds).toEqual(["run-1", "run-2"]);
    });
  });

  describe("addRunToSession", () => {
    it("binds a run to an unbound session", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        active: true,
        startedAt: "2026-01-01T00:00:00Z",
      };
      const updated = addRunToSession(state, "run-abc");
      expect(updated.runId).toBe("run-abc");
      expect(updated.runIds).toEqual(["run-abc"]);
    });

    it("is idempotent when re-binding the same runId", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-1",
        runIds: ["run-1"],
      };
      const updated = addRunToSession(state, "run-1");
      expect(updated).toBe(state); // exact same object — no-op
      expect(updated.runId).toBe("run-1");
      expect(updated.runIds).toEqual(["run-1"]);
    });

    it("throws when binding a new run while another is active", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-1",
        runIds: ["run-1"],
      };
      expect(() => addRunToSession(state, "run-2")).toThrow();
      expect(() => addRunToSession(state, "run-2")).toThrow(
        expect.objectContaining({ code: SessionErrorCode.RUN_ALREADY_ASSOCIATED }),
      );
    });

    it("retires the old run and binds the new one with retirePrevious", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-1",
        runIds: ["run-1"],
      };
      const updated = addRunToSession(state, "run-2", { retirePrevious: true });
      expect(updated.runId).toBe("run-2");
      expect(updated.runIds).toEqual(["run-1", "run-2"]);
    });

    it("does not duplicate history entries when retiring", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-2",
        runIds: ["run-1", "run-2"],
      };
      const updated = addRunToSession(state, "run-3", { retirePrevious: true });
      expect(updated.runId).toBe("run-3");
      expect(updated.runIds).toEqual(["run-1", "run-2", "run-3"]);
    });

    it("preserves other state fields", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        active: true,
        iteration: 5,
        maxIterations: 100,
        startedAt: "2026-01-01T00:00:00Z",
      };
      const updated = addRunToSession(state, "run-new");
      expect(updated.active).toBe(true);
      expect(updated.iteration).toBe(5);
      expect(updated.maxIterations).toBe(100);
    });
  });

  describe("getSessionRuns", () => {
    it("returns runIds when populated", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runIds: ["run-1", "run-2", "run-3"],
      };
      expect(getSessionRuns(state)).toEqual(["run-1", "run-2", "run-3"]);
    });

    it("falls back to [runId] when runIds is empty", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-legacy",
        runIds: [],
      };
      expect(getSessionRuns(state)).toEqual(["run-legacy"]);
    });

    it("returns empty array when both runId and runIds are empty", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "",
        runIds: [],
      };
      expect(getSessionRuns(state)).toEqual([]);
    });
  });

  describe("serialization round-trip", () => {
    it("serializes runIds as comma-separated", () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-2",
        runIds: ["run-1", "run-2"],
        active: true,
        startedAt: "2026-01-01T00:00:00Z",
      };
      const serialized = serializeSessionState(state);
      expect(serialized).toContain("run_ids:");
      expect(serialized).toContain("run-1");
      expect(serialized).toContain("run-2");
    });

    it("round-trips through serialize and parse", () => {
      const original: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-latest",
        runIds: ["run-first", "run-second", "run-latest"],
        active: true,
        iteration: 3,
        startedAt: "2026-01-01T00:00:00Z",
        lastIterationAt: "2026-01-01T00:05:00Z",
      };
      const serialized = serializeSessionState(original);
      // Parse it back — simulate frontmatter parsing
      const lines = serialized.split("\n");
      const frontmatter: Record<string, string> = {};
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          let value = line.slice(colonIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"'))) {
            value = value.slice(1, -1);
          }
          frontmatter[key] = value;
        }
      }
      const parsed = parseSessionState(frontmatter);
      expect(parsed.runIds).toEqual(["run-first", "run-second", "run-latest"]);
      expect(parsed.runId).toBe("run-latest");
    });

    it("round-trips through file write and read", async () => {
      const state: SessionState = {
        ...DEFAULT_SESSION_STATE,
        runId: "run-b",
        runIds: ["run-a", "run-b"],
        active: true,
        startedAt: "2026-01-01T00:00:00Z",
      };
      const filePath = path.join(testDir, "test-session.md");
      await writeSessionFile(filePath, state, "Test prompt");

      const file = await readSessionFile(filePath);
      expect(file.state.runIds).toEqual(["run-a", "run-b"]);
      expect(file.state.runId).toBe("run-b");
      expect(file.prompt).toBe("Test prompt");
    });
  });

  describe("backward compatibility", () => {
    it("parses old format without runIds gracefully", () => {
      const frontmatter: Record<string, string> = {
        active: "true",
        iteration: "1",
        max_iterations: "65000",
        run_id: "old-run",
        started_at: "2026-01-01T00:00:00Z",
        last_iteration_at: "",
        iteration_times: "",
      };
      const state = parseSessionState(frontmatter);
      expect(state.runId).toBe("old-run");
      expect(state.runIds).toEqual([]);
      // getSessionRuns should fallback to [runId]
      expect(getSessionRuns(state)).toEqual(["old-run"]);
    });
  });
});

