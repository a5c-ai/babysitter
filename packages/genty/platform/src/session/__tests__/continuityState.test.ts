/**
 * Tests for GAP-PERF-008: Structured Continuity State.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

import * as fs from "node:fs/promises";
import {
  getContinuityStatePath,
  getContinuityState,
  setCurrentPhase,
  upsertDecision,
  updateWorkingContext,
  buildContinuityResumePrompt,
  CONTINUITY_STATE_SCHEMA_VERSION,
  type ContinuityState,
} from "../continuityState";

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockRename = vi.mocked(fs.rename);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("continuityState (GAP-PERF-008)", () => {
  const stateDir = "/tmp/state";
  const sessionId = "test-session";

  describe("getContinuityStatePath", () => {
    it("returns correct path", () => {
      const p = getContinuityStatePath(stateDir, sessionId);
      expect(p).toContain(sessionId);
      expect(p).toContain("continuity.json");
    });
  });

  describe("getContinuityState", () => {
    it("returns empty default on ENOENT", async () => {
      const err = new Error("ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      mockReadFile.mockRejectedValueOnce(err);

      const state = await getContinuityState(stateDir, sessionId);
      expect(state.schemaVersion).toBe(CONTINUITY_STATE_SCHEMA_VERSION);
      expect(state.decisions).toEqual([]);
      expect(state.currentPhase).toBeNull();
    });

    it("returns empty default on corrupt JSON", async () => {
      mockReadFile.mockResolvedValueOnce("not json{{{" as never);

      const state = await getContinuityState(stateDir, sessionId);
      expect(state.schemaVersion).toBe(CONTINUITY_STATE_SCHEMA_VERSION);
      expect(state.decisions).toEqual([]);
    });

    it("parses valid state", async () => {
      const existing: ContinuityState = {
        schemaVersion: CONTINUITY_STATE_SCHEMA_VERSION,
        updatedAt: "2026-01-01T00:00:00Z",
        currentPhase: { name: "execution", startedAt: "2026-01-01T00:00:00Z", description: "test" },
        decisions: [{ key: "arch.db", value: "sqlite", madeAt: "2026-01-01T00:00:00Z" }],
        workingContext: { focus: "testing", blockers: [], nextSteps: [] },
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(existing) as never);

      const state = await getContinuityState(stateDir, sessionId);
      expect(state.currentPhase?.name).toBe("execution");
      expect(state.decisions).toHaveLength(1);
    });
  });

  describe("setCurrentPhase", () => {
    it("writes phase with auto-timestamped startedAt", async () => {
      const err = new Error("ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      mockReadFile.mockRejectedValueOnce(err);

      await setCurrentPhase(stateDir, sessionId, { name: "planning", description: "Initial planning" });

      expect(mockWriteFile).toHaveBeenCalled();
      const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as ContinuityState;
      expect(written.currentPhase?.name).toBe("planning");
      expect(written.currentPhase?.startedAt).toBeDefined();
    });
  });

  describe("upsertDecision", () => {
    it("inserts new decision", async () => {
      const err = new Error("ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      mockReadFile.mockRejectedValueOnce(err);

      await upsertDecision(stateDir, sessionId, { key: "db.type", value: "postgres" });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as ContinuityState;
      expect(written.decisions).toHaveLength(1);
      expect(written.decisions[0].key).toBe("db.type");
      expect(written.decisions[0].madeAt).toBeDefined();
    });

    it("replaces existing decision with same key", async () => {
      const existing: ContinuityState = {
        schemaVersion: CONTINUITY_STATE_SCHEMA_VERSION,
        updatedAt: "2026-01-01T00:00:00Z",
        currentPhase: null,
        decisions: [{ key: "db.type", value: "sqlite", madeAt: "2026-01-01T00:00:00Z" }],
        workingContext: { focus: "", blockers: [], nextSteps: [] },
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(existing) as never);

      await upsertDecision(stateDir, sessionId, { key: "db.type", value: "postgres" });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as ContinuityState;
      expect(written.decisions).toHaveLength(1);
      expect(written.decisions[0].value).toBe("postgres");
    });
  });

  describe("updateWorkingContext", () => {
    it("merges partial updates", async () => {
      const existing: ContinuityState = {
        schemaVersion: CONTINUITY_STATE_SCHEMA_VERSION,
        updatedAt: "2026-01-01T00:00:00Z",
        currentPhase: null,
        decisions: [],
        workingContext: { focus: "old focus", blockers: ["blocker1"], nextSteps: ["step1"] },
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(existing) as never);

      await updateWorkingContext(stateDir, sessionId, { focus: "new focus" });

      const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as ContinuityState;
      expect(written.workingContext.focus).toBe("new focus");
      expect(written.workingContext.blockers).toEqual(["blocker1"]);
    });
  });

  describe("buildContinuityResumePrompt", () => {
    it("returns empty string when state has no meaningful data", async () => {
      const err = new Error("ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      mockReadFile.mockRejectedValueOnce(err);

      const prompt = await buildContinuityResumePrompt(stateDir, sessionId);
      expect(prompt).toBe("");
    });

    it("returns formatted markdown with populated state", async () => {
      const state: ContinuityState = {
        schemaVersion: CONTINUITY_STATE_SCHEMA_VERSION,
        updatedAt: "2026-01-01T00:00:00Z",
        currentPhase: { name: "execution", startedAt: "2026-01-01T00:00:00Z", description: "Building features" },
        decisions: [{ key: "arch.db", value: "sqlite", rationale: "lightweight", madeAt: "2026-01-01T00:00:00Z" }],
        workingContext: { focus: "Implementing GAP items", blockers: ["CI failing"], nextSteps: ["Fix tests", "Deploy"] },
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(state) as never);

      const prompt = await buildContinuityResumePrompt(stateDir, sessionId);
      expect(prompt).toContain("execution");
      expect(prompt).toContain("sqlite");
      expect(prompt).toContain("CI failing");
      expect(prompt).toContain("Fix tests");
    });
  });
});
