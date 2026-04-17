import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  getSessionCost,
  getSessionCostPath,
  updateSessionCost,
  setSessionBudget,
  checkBudget,
  markThresholdsTriggered,
} from "../cost";
import type { SessionCostState, SessionBudget } from "../cost";

describe("GAP-SESSION-004: Session-Level Cost Tracking", () => {
  let stateDir: string;
  const sessionId = "test-session";

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "cost-test-"));
  });

  describe("getSessionCost", () => {
    it("returns empty state when file does not exist", async () => {
      const state = await getSessionCost(stateDir, sessionId);
      expect(state.totalCostUsd).toBe(0);
      expect(state.totalInputTokens).toBe(0);
      expect(state.totalOutputTokens).toBe(0);
      expect(state.runCosts).toEqual([]);
      expect(state.paused).toBe(false);
      expect(state.triggeredThresholds).toEqual([]);
    });

    it("returns empty state on corrupt JSON", async () => {
      const filePath = getSessionCostPath(stateDir, sessionId);
      await fs.writeFile(filePath, "{bad", "utf8");
      const state = await getSessionCost(stateDir, sessionId);
      expect(state.totalCostUsd).toBe(0);
    });
  });

  describe("updateSessionCost", () => {
    it("accumulates costs from multiple runs", async () => {
      await updateSessionCost(stateDir, sessionId, {
        runId: "run-1", costUsd: 0.05, inputTokens: 1000, outputTokens: 500,
      });
      await updateSessionCost(stateDir, sessionId, {
        runId: "run-2", costUsd: 0.10, inputTokens: 2000, outputTokens: 1000,
      });
      const state = await getSessionCost(stateDir, sessionId);
      expect(state.totalCostUsd).toBeCloseTo(0.15);
      expect(state.totalInputTokens).toBe(3000);
      expect(state.totalOutputTokens).toBe(1500);
      expect(state.runCosts).toHaveLength(2);
    });

    it("updates existing run cost entry on re-aggregation", async () => {
      await updateSessionCost(stateDir, sessionId, {
        runId: "run-1", costUsd: 0.05, inputTokens: 1000, outputTokens: 500,
      });
      // Re-aggregate run-1 with new cost
      await updateSessionCost(stateDir, sessionId, {
        runId: "run-1", costUsd: 0.08, inputTokens: 1500, outputTokens: 700,
      });
      const state = await getSessionCost(stateDir, sessionId);
      expect(state.totalCostUsd).toBeCloseTo(0.08); // Replaced, not added
      expect(state.totalInputTokens).toBe(1500); // Corrected, not accumulated
      expect(state.totalOutputTokens).toBe(700); // Corrected, not accumulated
      expect(state.runCosts).toHaveLength(1);
      expect(state.runCosts[0].costUsd).toBe(0.08);
    });

    it("persists cost state to disk", async () => {
      await updateSessionCost(stateDir, sessionId, {
        runId: "run-1", costUsd: 0.01, inputTokens: 100, outputTokens: 50,
      });
      const filePath = getSessionCostPath(stateDir, sessionId);
      const raw = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(raw) as SessionCostState;
      expect(data.totalCostUsd).toBeCloseTo(0.01);
    });
  });

  describe("setSessionBudget", () => {
    it("persists budget config to disk", async () => {
      const budget: SessionBudget = { maxCostUsd: 5.0, alertThresholds: [50, 80, 100], autoPause: true };
      const state = await setSessionBudget(stateDir, sessionId, budget);
      expect(state.budget).toEqual(budget);

      // Verify persistence
      const reread = await getSessionCost(stateDir, sessionId);
      expect(reread.budget?.maxCostUsd).toBe(5.0);
    });
  });

  describe("checkBudget", () => {
    it("returns no alerts when no budget is set", () => {
      const state: SessionCostState = {
        totalCostUsd: 10, totalInputTokens: 0, totalOutputTokens: 0,
        runCosts: [], triggeredThresholds: [], paused: false, lastUpdatedAt: "",
      };
      const result = checkBudget(state);
      expect(result.exceeded).toBe(false);
      expect(result.alerts).toEqual([]);
      expect(result.shouldPause).toBe(false);
    });

    it("returns no alerts when budget maxCostUsd is 0 (unlimited)", () => {
      const state: SessionCostState = {
        totalCostUsd: 100, totalInputTokens: 0, totalOutputTokens: 0,
        runCosts: [], triggeredThresholds: [], paused: false, lastUpdatedAt: "",
        budget: { maxCostUsd: 0, alertThresholds: [50, 100], autoPause: false },
      };
      const result = checkBudget(state);
      expect(result.exceeded).toBe(false);
    });

    it("returns correct alerts at 50%, 80%, 100% thresholds", () => {
      const state: SessionCostState = {
        totalCostUsd: 9, totalInputTokens: 0, totalOutputTokens: 0,
        runCosts: [], triggeredThresholds: [], paused: false, lastUpdatedAt: "",
        budget: { maxCostUsd: 10, alertThresholds: [50, 80, 100], autoPause: false },
      };
      const result = checkBudget(state);
      // 90% > 50% and 80%, but < 100%
      expect(result.alerts).toHaveLength(2);
      expect(result.alerts.map((a) => a.thresholdPct)).toEqual([50, 80]);
      expect(result.exceeded).toBe(false);
    });

    it("does not re-trigger already-triggered thresholds", () => {
      const state: SessionCostState = {
        totalCostUsd: 9, totalInputTokens: 0, totalOutputTokens: 0,
        runCosts: [], triggeredThresholds: [50], paused: false, lastUpdatedAt: "",
        budget: { maxCostUsd: 10, alertThresholds: [50, 80, 100], autoPause: false },
      };
      const result = checkBudget(state);
      // 50% already triggered, only 80% is new
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].thresholdPct).toBe(80);
    });

    it("returns shouldPause=true when exceeded and autoPause=true", () => {
      const state: SessionCostState = {
        totalCostUsd: 10, totalInputTokens: 0, totalOutputTokens: 0,
        runCosts: [], triggeredThresholds: [], paused: false, lastUpdatedAt: "",
        budget: { maxCostUsd: 10, alertThresholds: [100], autoPause: true },
      };
      const result = checkBudget(state);
      expect(result.exceeded).toBe(true);
      expect(result.shouldPause).toBe(true);
      expect(result.alerts).toHaveLength(1);
    });

    it("returns shouldPause=false when exceeded but autoPause=false", () => {
      const state: SessionCostState = {
        totalCostUsd: 15, totalInputTokens: 0, totalOutputTokens: 0,
        runCosts: [], triggeredThresholds: [], paused: false, lastUpdatedAt: "",
        budget: { maxCostUsd: 10, alertThresholds: [100], autoPause: false },
      };
      const result = checkBudget(state);
      expect(result.exceeded).toBe(true);
      expect(result.shouldPause).toBe(false);
    });
  });

  describe("markThresholdsTriggered", () => {
    it("persists triggered thresholds to cost state", async () => {
      await setSessionBudget(stateDir, sessionId, { maxCostUsd: 10, alertThresholds: [50, 80, 100], autoPause: false });
      await markThresholdsTriggered(stateDir, sessionId, [50, 80]);
      const state = await getSessionCost(stateDir, sessionId);
      expect(state.triggeredThresholds).toContain(50);
      expect(state.triggeredThresholds).toContain(80);
    });

    it("does nothing when no thresholds provided", async () => {
      await setSessionBudget(stateDir, sessionId, { maxCostUsd: 10, alertThresholds: [50], autoPause: false });
      await markThresholdsTriggered(stateDir, sessionId, []);
      const state = await getSessionCost(stateDir, sessionId);
      expect(state.triggeredThresholds).toEqual([]);
    });

    it("deduplicates already-triggered thresholds", async () => {
      await markThresholdsTriggered(stateDir, sessionId, [50]);
      await markThresholdsTriggered(stateDir, sessionId, [50, 80]);
      const state = await getSessionCost(stateDir, sessionId);
      expect(state.triggeredThresholds).toEqual([50, 80]);
    });
  });
});
