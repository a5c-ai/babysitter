import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createRunDir, appendEvent } from "../../storage";
import { nextUlid } from "../../storage/ulids";
import { buildEffectIndex } from "../replay/effectIndex";

describe("GAP-SUBOBS-003: Per-Effect Token/Cost Tracking", () => {
  let testDir: string;
  let runDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `cost-tracking-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    const runId = nextUlid();
    const result = await createRunDir({
      runsRoot: testDir,
      runId,
      request: "cost-test",
      processId: "cost-test-process",
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
      event: { processId: "cost-test-process", entrypoint: "test.js#process" },
    });
  }

  async function appendEffectRequested(effectId: string, taskId?: string) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey: `test:S000001:${effectId}`,
        invocationHash: "abc123",
        stepId: "S000001",
        taskId: taskId ?? `task-${effectId}`,
        kind: "agent",
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

  describe("EffectIndex handles COST_TRACKED events with effectId", () => {
    it("accumulates cost fields on EffectRecord after EFFECT_REQUESTED + COST_TRACKED", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 1000,
        outputTokens: 500,
        cacheCreationInputTokens: 200,
        cacheReadInputTokens: 100,
        costUsd: 0.015,
        model: "claude-sonnet-4-20250514",
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record).toBeDefined();
      expect(record!.inputTokens).toBe(1000);
      expect(record!.outputTokens).toBe(500);
      expect(record!.cacheCreationInputTokens).toBe(200);
      expect(record!.cacheReadInputTokens).toBe(100);
      expect(record!.costUsd).toBeCloseTo(0.015);
      expect(record!.costModel).toBe("claude-sonnet-4-20250514");
    });

    it("accumulates multiple COST_TRACKED events for the same effectId", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 1000,
        outputTokens: 500,
        costUsd: 0.01,
        model: "claude-sonnet-4-20250514",
      });
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 2000,
        outputTokens: 800,
        costUsd: 0.02,
        model: "claude-opus-4-20250514",
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.inputTokens).toBe(3000);
      expect(record!.outputTokens).toBe(1300);
      expect(record!.costUsd).toBeCloseTo(0.03);
      // Latest model wins
      expect(record!.costModel).toBe("claude-opus-4-20250514");
    });

    it("silently ignores COST_TRACKED without effectId (run-level only)", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        inputTokens: 500,
        outputTokens: 200,
        costUsd: 0.005,
        model: "claude-sonnet-4-20250514",
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.inputTokens).toBeUndefined();
      expect(record!.costUsd).toBeUndefined();
    });

    it("silently ignores COST_TRACKED for unknown effectId", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-unknown",
        inputTokens: 500,
        outputTokens: 200,
        costUsd: 0.005,
      });

      const index = await buildEffectIndex({ runDir });
      expect(index.getByEffectId("eff-unknown")).toBeUndefined();
      const record = index.getByEffectId("eff-001");
      expect(record!.inputTokens).toBeUndefined();
    });
  });

  describe("EffectRecord cost fields", () => {
    it("all cost fields are undefined when no COST_TRACKED event", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.inputTokens).toBeUndefined();
      expect(record!.outputTokens).toBeUndefined();
      expect(record!.cacheCreationInputTokens).toBeUndefined();
      expect(record!.cacheReadInputTokens).toBeUndefined();
      expect(record!.costUsd).toBeUndefined();
      expect(record!.costModel).toBeUndefined();
    });

    it("partial cost data only sets provided fields", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 1000,
        costUsd: 0.01,
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.inputTokens).toBe(1000);
      expect(record!.outputTokens).toBeUndefined();
      expect(record!.cacheCreationInputTokens).toBeUndefined();
      expect(record!.cacheReadInputTokens).toBeUndefined();
      expect(record!.costUsd).toBeCloseTo(0.01);
    });

    it("preserves cost fields after effect resolution", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 1500,
        outputTokens: 700,
        costUsd: 0.02,
        model: "claude-sonnet-4-20250514",
      });
      await appendEvent({
        runDir,
        eventType: "EFFECT_RESOLVED",
        event: {
          effectId: "eff-001",
          status: "ok",
          resultRef: "tasks/eff-001/result.json",
        },
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.status).toBe("resolved_ok");
      expect(record!.inputTokens).toBe(1500);
      expect(record!.outputTokens).toBe(700);
      expect(record!.costUsd).toBeCloseTo(0.02);
      expect(record!.costModel).toBe("claude-sonnet-4-20250514");
    });

    it("can accumulate cost after resolution (late cost events)", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 500,
        costUsd: 0.005,
        model: "claude-sonnet-4-20250514",
      });
      await appendEvent({
        runDir,
        eventType: "EFFECT_RESOLVED",
        event: {
          effectId: "eff-001",
          status: "ok",
          resultRef: "tasks/eff-001/result.json",
        },
      });
      // Late cost event after resolution
      await appendCostTracked({
        effectId: "eff-001",
        inputTokens: 300,
        costUsd: 0.003,
        model: "claude-sonnet-4-20250514",
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.inputTokens).toBe(800);
      expect(record!.costUsd).toBeCloseTo(0.008);
    });
  });
});
