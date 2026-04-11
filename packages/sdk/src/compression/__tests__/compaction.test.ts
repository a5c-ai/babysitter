import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  shouldAutoCompact,
  buildIterationDigest,
  compactSession,
  getCompactionState,
  renderCompactedHistory,
  DEFAULT_COMPACTION_CONFIG,
} from "../compaction";
import type { CompactionConfig, CompactionState } from "../compaction";

describe("GAP-PERF-002: Session Compaction", () => {
  let stateDir: string;
  let runsDir: string;
  const sessionId = "test-session";

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "compaction-test-state-"));
    runsDir = await fs.mkdtemp(path.join(os.tmpdir(), "compaction-test-runs-"));
  });

  describe("shouldAutoCompact", () => {
    it("returns true when estimated tokens exceed threshold", () => {
      expect(shouldAutoCompact(100_000, DEFAULT_COMPACTION_CONFIG)).toBe(true);
    });

    it("returns false when below threshold", () => {
      expect(shouldAutoCompact(50_000, DEFAULT_COMPACTION_CONFIG)).toBe(false);
    });

    it("returns false when compaction is disabled", () => {
      const config: CompactionConfig = { ...DEFAULT_COMPACTION_CONFIG, enabled: false };
      expect(shouldAutoCompact(100_000, config)).toBe(false);
    });

    it("returns false at exact threshold (not exceeded)", () => {
      expect(shouldAutoCompact(80_000, DEFAULT_COMPACTION_CONFIG)).toBe(false);
    });

    it("returns true one above threshold", () => {
      expect(shouldAutoCompact(80_001, DEFAULT_COMPACTION_CONFIG)).toBe(true);
    });
  });

  describe("buildIterationDigest", () => {
    it("produces correct summary from journal events", () => {
      const events = [
        { type: "EFFECT_REQUESTED", recordedAt: "2026-01-01T00:00:00Z", data: { effectId: "e1" } },
        { type: "EFFECT_RESOLVED", recordedAt: "2026-01-01T00:00:10Z", data: { effectId: "e1" } },
        { type: "EFFECT_REQUESTED", recordedAt: "2026-01-01T00:00:11Z", data: { effectId: "e2" } },
        { type: "EFFECT_RESOLVED", recordedAt: "2026-01-01T00:00:20Z", data: { effectId: "e2" } },
      ];
      const digest = buildIterationDigest("run-1", 1, events);
      expect(digest.iteration).toBe(1);
      expect(digest.runId).toBe("run-1");
      expect(digest.resolvedEffects).toEqual(["e1", "e2"]);
      expect(digest.durationSeconds).toBe(20);
      expect(digest.summary).toContain("2 effect(s) resolved");
    });

    it("handles empty events", () => {
      const digest = buildIterationDigest("run-1", 1, []);
      expect(digest.resolvedEffects).toEqual([]);
      expect(digest.durationSeconds).toBe(0);
    });

    it("extracts unique event types in summary", () => {
      const events = [
        { type: "RUN_CREATED", recordedAt: "2026-01-01T00:00:00Z" },
        { type: "EFFECT_REQUESTED", recordedAt: "2026-01-01T00:00:01Z" },
        { type: "EFFECT_REQUESTED", recordedAt: "2026-01-01T00:00:02Z" },
      ];
      const digest = buildIterationDigest("run-1", 1, events);
      expect(digest.summary).toContain("RUN_CREATED");
      expect(digest.summary).toContain("EFFECT_REQUESTED");
    });
  });

  describe("getCompactionState", () => {
    it("returns empty state when file does not exist", async () => {
      const state = await getCompactionState(stateDir, sessionId);
      expect(state.operations).toEqual([]);
      expect(state.iterationDigests).toEqual([]);
      expect(state.totalTokensSaved).toBe(0);
    });
  });

  describe("compactSession", () => {
    it("returns empty results when compaction is disabled", async () => {
      const config: CompactionConfig = { ...DEFAULT_COMPACTION_CONFIG, enabled: false };
      const results = await compactSession(stateDir, sessionId, runsDir, config);
      expect(results).toEqual([]);
    });

    it("applies strategies and persists state to disk", async () => {
      // Create a synthetic run with journal events
      const runDir = path.join(runsDir, "test-run");
      const journalDir = path.join(runDir, "journal");
      await fs.mkdir(journalDir, { recursive: true });

      // Write enough journal events to trigger compaction
      for (let i = 0; i < 10; i++) {
        const event = {
          type: i % 2 === 0 ? "EFFECT_REQUESTED" : "EFFECT_RESOLVED",
          recordedAt: new Date(Date.now() + i * 1000).toISOString(),
          data: { effectId: `e${Math.floor(i / 2)}` },
        };
        await fs.writeFile(
          path.join(journalDir, `${String(i + 1).padStart(6, "0")}.test.json`),
          JSON.stringify(event),
          "utf8",
        );
      }

      const config: CompactionConfig = {
        enabled: true,
        autoCompactThreshold: 100,
        strategies: ["iteration-digest"],
        keepRecentIterations: 1,
        toolOutputTargetReduction: 0.6,
      };

      const results = await compactSession(stateDir, sessionId, runsDir, config);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].strategy).toBe("iteration-digest");
      expect(results[0].itemsCompacted).toBeGreaterThan(0);

      // Verify persistence
      const state = await getCompactionState(stateDir, sessionId);
      expect(state.operations.length).toBeGreaterThan(0);
      expect(state.totalTokensSaved).toBeGreaterThan(0);
    });

    it("handles empty runs directory gracefully", async () => {
      const config: CompactionConfig = {
        ...DEFAULT_COMPACTION_CONFIG,
        strategies: ["iteration-digest"],
      };
      const results = await compactSession(stateDir, sessionId, runsDir, config);
      expect(results).toEqual([]);
    });
  });

  describe("renderCompactedHistory", () => {
    it("returns empty string when no digests exist", () => {
      const state: CompactionState = { operations: [], iterationDigests: [], toolOutputSummaries: [], totalTokensSaved: 0 };
      expect(renderCompactedHistory(state)).toBe("");
    });

    it("produces markdown from iteration digests", () => {
      const state: CompactionState = {
        operations: [{ strategy: "iteration-digest", tokensBefore: 1000, tokensAfter: 200, itemsCompacted: 2, compactedAt: "" }],
        iterationDigests: [
          { iteration: 1, runId: "run-1", summary: "2 effects resolved", resolvedEffects: ["e1", "e2"], durationSeconds: 15.5, timestamp: "" },
          { iteration: 2, runId: "run-1", summary: "1 effect resolved", resolvedEffects: ["e3"], durationSeconds: 8.2, timestamp: "" },
        ],
        toolOutputSummaries: [],
        totalTokensSaved: 800,
      };
      const result = renderCompactedHistory(state);
      expect(result).toContain("## Compacted History");
      expect(result).toContain("**Iter 1** (run-1)");
      expect(result).toContain("**Iter 2** (run-1)");
      expect(result).toContain("800 tokens saved");
      expect(result).toContain("15.5s");
    });
  });
});
