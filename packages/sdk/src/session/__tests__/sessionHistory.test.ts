/**
 * GAP-SESSION-002: Session History Persistence
 *
 * Tests for addDecision, addRunSummary, saveContextSnapshot, getSessionHistory.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import {
  addDecision,
  addRunSummary,
  saveContextSnapshot,
  getSessionHistory,
  getSessionHistoryPath,
} from "../history";
import type { SessionRunSummary } from "../types";

describe("GAP-SESSION-002: Session History Persistence", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-history-${crypto.randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  // ── Path helper ─────────────────────────────────────────────────────

  describe("getSessionHistoryPath", () => {
    it("returns path with .history.json suffix", () => {
      const p = getSessionHistoryPath(testDir, "sess-abc");
      expect(p).toContain("sess-abc");
      expect(p.endsWith(".history.json")).toBe(true);
    });
  });

  // ── getSessionHistory (empty state) ──────────────────────────────────

  describe("getSessionHistory", () => {
    it("returns empty history when no history file exists (AC-5)", async () => {
      const history = await getSessionHistory(testDir, "nonexistent");
      expect(history.decisions).toEqual([]);
      expect(history.runSummaries).toEqual([]);
      expect(history.contextSnapshots).toEqual([]);
    });

    it("includes notes and sharedKnowledge defaults when no files exist", async () => {
      const history = await getSessionHistory(testDir, "nonexistent");
      expect(history.notes).toEqual([]);
      expect(history.sharedKnowledge).toEqual({});
    });

    it("merges SessionContext data with history arrays when both files exist (AC-10)", async () => {
      // Create context file with notes and sharedKnowledge
      const { updateSessionContext } = await import("../context");
      await updateSessionContext(testDir, "sess-merge", {
        notes: ["Important note"],
        sharedKnowledge: { key1: "value1" },
      });
      // Create history file with a decision
      await addDecision(testDir, "sess-merge", { description: "Merge test decision" });

      const history = await getSessionHistory(testDir, "sess-merge");
      // Verify SessionContext fields are present
      expect(history.notes).toEqual(["Important note"]);
      expect(history.sharedKnowledge).toEqual({ key1: "value1" });
      // Verify history arrays are present
      expect(history.decisions).toHaveLength(1);
      expect(history.decisions[0].description).toBe("Merge test decision");
    });
  });

  // ── addDecision ─────────────────────────────────────────────────────

  describe("addDecision", () => {
    it("creates history file and appends a decision (AC-1)", async () => {
      await addDecision(testDir, "sess-1", {
        description: "Use OAuth2 for auth",
        rationale: "Industry standard",
        runId: "run-001",
      });

      const history = await getSessionHistory(testDir, "sess-1");
      expect(history.decisions).toHaveLength(1);
      expect(history.decisions[0].description).toBe("Use OAuth2 for auth");
      expect(history.decisions[0].rationale).toBe("Industry standard");
      expect(history.decisions[0].runId).toBe("run-001");
      expect(typeof history.decisions[0].timestamp).toBe("string");
    });

    it("appends multiple decisions preserving order (AC-4)", async () => {
      await addDecision(testDir, "sess-2", { description: "Decision A" });
      await addDecision(testDir, "sess-2", { description: "Decision B" });
      await addDecision(testDir, "sess-2", { description: "Decision C" });

      const history = await getSessionHistory(testDir, "sess-2");
      expect(history.decisions).toHaveLength(3);
      expect(history.decisions[0].description).toBe("Decision A");
      expect(history.decisions[1].description).toBe("Decision B");
      expect(history.decisions[2].description).toBe("Decision C");
    });

    it("preserves existing runSummaries and snapshots when adding decision", async () => {
      // Pre-populate with a run summary
      await addRunSummary(testDir, "sess-3", {
        runId: "run-x",
        processId: "proc-x",
        status: "completed",
        startedAt: "2026-01-01T00:00:00Z",
      });
      await addDecision(testDir, "sess-3", { description: "New decision" });

      const history = await getSessionHistory(testDir, "sess-3");
      expect(history.runSummaries).toHaveLength(1);
      expect(history.decisions).toHaveLength(1);
    });
  });

  // ── addRunSummary ───────────────────────────────────────────────────

  describe("addRunSummary", () => {
    it("creates history file and appends a run summary (AC-2)", async () => {
      const summary: SessionRunSummary = {
        runId: "run-001",
        processId: "test-proc",
        status: "completed",
        startedAt: "2026-01-01T00:00:00Z",
        completedAt: "2026-01-01T01:00:00Z",
        outcome: "All tests passed",
        score: 95,
      };
      await addRunSummary(testDir, "sess-rs-1", summary);

      const history = await getSessionHistory(testDir, "sess-rs-1");
      expect(history.runSummaries).toHaveLength(1);
      expect(history.runSummaries[0].runId).toBe("run-001");
      expect(history.runSummaries[0].processId).toBe("test-proc");
      expect(history.runSummaries[0].score).toBe(95);
    });

    it("accumulates run summaries across multiple runs (AC-12)", async () => {
      await addRunSummary(testDir, "sess-multi", {
        runId: "run-1", processId: "proc-a", status: "completed", startedAt: "2026-01-01T00:00:00Z",
      });
      await addRunSummary(testDir, "sess-multi", {
        runId: "run-2", processId: "proc-b", status: "failed", startedAt: "2026-01-02T00:00:00Z",
      });
      await addRunSummary(testDir, "sess-multi", {
        runId: "run-3", processId: "proc-a", status: "completed", startedAt: "2026-01-03T00:00:00Z",
      });

      const history = await getSessionHistory(testDir, "sess-multi");
      expect(history.runSummaries).toHaveLength(3);
      expect(history.runSummaries[0].runId).toBe("run-1");
      expect(history.runSummaries[2].runId).toBe("run-3");
    });
  });

  // ── saveContextSnapshot ─────────────────────────────────────────────

  describe("saveContextSnapshot", () => {
    it("saves a snapshot with auto-generated timestamp (AC-3)", async () => {
      await saveContextSnapshot(testDir, "sess-snap", {
        runId: "run-001",
        snapshot: { phase: "planning", decision: "use React" },
      });

      const history = await getSessionHistory(testDir, "sess-snap");
      expect(history.contextSnapshots).toHaveLength(1);
      expect(history.contextSnapshots[0].snapshot).toEqual({ phase: "planning", decision: "use React" });
      expect(history.contextSnapshots[0].runId).toBe("run-001");
      expect(typeof history.contextSnapshots[0].timestamp).toBe("string");
    });

    it("appends multiple snapshots preserving order", async () => {
      await saveContextSnapshot(testDir, "sess-snaps", { snapshot: { v: 1 } });
      await saveContextSnapshot(testDir, "sess-snaps", { snapshot: { v: 2 } });

      const history = await getSessionHistory(testDir, "sess-snaps");
      expect(history.contextSnapshots).toHaveLength(2);
      expect((history.contextSnapshots[0].snapshot as { v: number }).v).toBe(1);
      expect((history.contextSnapshots[1].snapshot as { v: number }).v).toBe(2);
    });
  });

  // ── Backward compatibility ──────────────────────────────────────────

  describe("backward compatibility", () => {
    it("reads history file without new fields as empty arrays (AC-12)", async () => {
      const historyPath = getSessionHistoryPath(testDir, "sess-legacy");
      await fs.writeFile(historyPath, JSON.stringify({}), "utf8");

      const history = await getSessionHistory(testDir, "sess-legacy");
      expect(history.decisions).toEqual([]);
      expect(history.runSummaries).toEqual([]);
      expect(history.contextSnapshots).toEqual([]);
    });

    it("handles corrupt history file gracefully", async () => {
      const historyPath = getSessionHistoryPath(testDir, "sess-corrupt");
      await fs.writeFile(historyPath, "NOT JSON {{{", "utf8");

      const history = await getSessionHistory(testDir, "sess-corrupt");
      expect(history.decisions).toEqual([]);
      expect(history.runSummaries).toEqual([]);
      expect(history.contextSnapshots).toEqual([]);
    });
  });

  // ── Atomic writes ───────────────────────────────────────────────────

  describe("atomic writes (AC-6)", () => {
    it("preserves all entries across many sequential writes", async () => {
      // Write 10 decisions sequentially and verify all are present
      for (let i = 0; i < 10; i++) {
        await addDecision(testDir, "sess-atomic", { description: `Decision ${i}` });
      }
      const history = await getSessionHistory(testDir, "sess-atomic");
      expect(history.decisions).toHaveLength(10);
    });
  });
});
