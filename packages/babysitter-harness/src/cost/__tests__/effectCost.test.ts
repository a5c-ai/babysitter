import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { nextUlid, createRunDir, appendEvent, buildEffectIndex } from "@a5c-ai/babysitter-sdk";
import { computeEffectCosts, type EffectCostSummary } from "../effectCost";

describe("GAP-SUBOBS-003: Per-Effect Cost Aggregation", () => {
  let testDir: string;
  let runDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `effect-cost-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    const runId = nextUlid();
    const result = await createRunDir({
      runsRoot: testDir,
      runId,
      request: "cost-agg-test",
      processId: "cost-agg-test-process",
    });
    runDir = result.runDir;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  async function appendRunCreated() {
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { processId: "cost-agg-test-process", entrypoint: "test.js#process" },
    });
  }

  async function appendEffectRequested(effectId: string, opts?: { taskId?: string; kind?: string }) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey: `test:S000001:${effectId}`,
        invocationHash: "abc123",
        stepId: "S000001",
        taskId: opts?.taskId ?? `task-${effectId}`,
        kind: opts?.kind ?? "agent",
        label: "work",
        taskDefRef: `tasks/${effectId}/task.json`,
        labels: ["work"],
      },
    });
  }

  async function appendCostTracked(data: {
    effectId?: string;
    inputTokens?: number;
    outputTokens?: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
    costUsd?: number;
    model?: string;
    taskKind?: string;
  }) {
    await appendEvent({
      runDir,
      eventType: "COST_TRACKED",
      event: data,
    });
  }

  describe("computeEffectCosts", () => {
    it("returns empty array when no effects have cost data", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");

      const index = await buildEffectIndex({ runDir });
      const result = computeEffectCosts(index);
      expect(result.effects).toHaveLength(0);
      expect(result.totalCostUsd).toBe(0);
    });

    it("returns per-effect cost breakdown", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001", { taskId: "write-tests", kind: "agent" });
      await appendEffectRequested("eff-002", { taskId: "run-tests", kind: "shell" });
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 2000,
        outputTokens: 1000,
        costUsd: 0.03,
        model: "claude-sonnet-4-20250514",
      });
      await appendCostTracked({
        effectId: "eff-002",
        inputTokens: 500,
        outputTokens: 100,
        costUsd: 0.005,
        model: "claude-haiku-3-20240307",
      });

      const index = await buildEffectIndex({ runDir });
      const result = computeEffectCosts(index);
      expect(result.effects).toHaveLength(2);
      expect(result.totalCostUsd).toBeCloseTo(0.035);

      const eff1 = result.effects.find((e: EffectCostSummary) => e.effectId === "eff-001");
      expect(eff1).toBeDefined();
      expect(eff1!.taskId).toBe("write-tests");
      expect(eff1!.kind).toBe("agent");
      expect(eff1!.inputTokens).toBe(2000);
      expect(eff1!.outputTokens).toBe(1000);
      expect(eff1!.costUsd).toBeCloseTo(0.03);
      expect(eff1!.model).toBe("claude-sonnet-4-20250514");

      const eff2 = result.effects.find((e: EffectCostSummary) => e.effectId === "eff-002");
      expect(eff2!.costUsd).toBeCloseTo(0.005);
    });

    it("aggregates multiple COST_TRACKED events per effect", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 1000,
        outputTokens: 500,
        cacheCreationInputTokens: 100,
        cacheReadInputTokens: 50,
        costUsd: 0.01,
        model: "claude-sonnet-4-20250514",
      });
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 2000,
        outputTokens: 800,
        cacheCreationInputTokens: 200,
        cacheReadInputTokens: 100,
        costUsd: 0.02,
        model: "claude-opus-4-20250514",
      });

      const index = await buildEffectIndex({ runDir });
      const result = computeEffectCosts(index);
      expect(result.effects).toHaveLength(1);
      const eff = result.effects[0];
      expect(eff.inputTokens).toBe(3000);
      expect(eff.outputTokens).toBe(1300);
      expect(eff.cacheCreationInputTokens).toBe(300);
      expect(eff.cacheReadInputTokens).toBe(150);
      expect(eff.costUsd).toBeCloseTo(0.03);
    });

    it("excludes effects without cost data from the breakdown", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendEffectRequested("eff-002");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 1000,
        costUsd: 0.01,
      });
      // eff-002 has no cost data

      const index = await buildEffectIndex({ runDir });
      const result = computeEffectCosts(index);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].effectId).toBe("eff-001");
    });

    it("handles run-level COST_TRACKED events (no effectId) — included in totalRunCostUsd only", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 1000,
        costUsd: 0.01,
      });
      // Run-level cost (no effectId) — should NOT appear in per-effect breakdown
      await appendCostTracked({
        inputTokens: 500,
        costUsd: 0.005,
      });

      const index = await buildEffectIndex({ runDir });
      const result = computeEffectCosts(index);
      expect(result.effects).toHaveLength(1);
      expect(result.totalCostUsd).toBeCloseTo(0.01);
    });
  });
});
