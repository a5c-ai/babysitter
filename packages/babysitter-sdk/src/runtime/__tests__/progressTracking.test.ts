import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createRunDir, appendEvent } from "../../storage";
import { nextUlid } from "../../storage/ulids";
import { buildEffectIndex } from "../replay/effectIndex";

describe("GAP-SUBOBS-002: Subagent Progress Tracking", () => {
  let testDir: string;
  let runDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `progress-tracking-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    const runId = nextUlid();
    const result = await createRunDir({
      runsRoot: testDir,
      runId,
      request: "progress-test",
      processId: "progress-test-process",
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
      event: { processId: "progress-test-process", entrypoint: "test.js#process" },
    });
  }

  async function appendEffectRequested(effectId: string) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey: `test:S000001:${effectId}`,
        invocationHash: "abc123",
        stepId: "S000001",
        taskId: `task-${effectId}`,
        kind: "agent",
        label: "work",
        taskDefRef: `tasks/${effectId}/task.json`,
        labels: ["work"],
      },
    });
  }

  async function appendEffectProgress(effectId: string, progress: {
    progressPercent?: number;
    progressLabel?: string;
    currentStep?: string;
    progressEta?: string;
  }) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_PROGRESS",
      event: { effectId, ...progress },
    });
  }

  describe("EFFECT_PROGRESS journal event", () => {
    it("can be appended to the journal", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      // Should not throw
      await appendEffectProgress("eff-001", {
        progressPercent: 50,
        progressLabel: "step 5 of 10",
        currentStep: "processing",
      });
    });
  });

  describe("EffectIndex handles EFFECT_PROGRESS", () => {
    it("updates EffectRecord with progress fields", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendEffectProgress("eff-001", {
        progressPercent: 45,
        progressLabel: "4 of 10 items",
        currentStep: "building",
        progressEta: "2026-04-08T13:00:00Z",
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record).toBeDefined();
      expect(record!.progressPercent).toBe(45);
      expect(record!.progressLabel).toBe("4 of 10 items");
      expect(record!.currentStep).toBe("building");
      expect(record!.progressEta).toBe("2026-04-08T13:00:00Z");
    });

    it("latest progress update wins", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendEffectProgress("eff-001", {
        progressPercent: 25,
        currentStep: "step-1",
      });
      await appendEffectProgress("eff-001", {
        progressPercent: 75,
        currentStep: "step-3",
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.progressPercent).toBe(75);
      expect(record!.currentStep).toBe("step-3");
    });

    it("ignores EFFECT_PROGRESS for unknown effectId", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      // Progress for a non-existent effect — should not throw
      await appendEffectProgress("eff-unknown", {
        progressPercent: 50,
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record).toBeDefined();
      expect(record!.progressPercent).toBeUndefined();
    });

    it("preserves progress fields after resolution", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendEffectProgress("eff-001", {
        progressPercent: 80,
        currentStep: "finalizing",
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
      // Progress fields should still be there
      expect(record!.progressPercent).toBe(80);
      expect(record!.currentStep).toBe("finalizing");
    });

    it("does not set progress on non-existent effects without error", async () => {
      await appendRunCreated();
      // No EFFECT_REQUESTED — directly progress an effect
      await appendEffectProgress("eff-phantom", { progressPercent: 99 });

      // Building the index should succeed (no throw)
      const index = await buildEffectIndex({ runDir });
      expect(index.getByEffectId("eff-phantom")).toBeUndefined();
    });
  });

  describe("EffectRecord progress fields", () => {
    it("all progress fields are undefined when no progress reported", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.progressPercent).toBeUndefined();
      expect(record!.progressLabel).toBeUndefined();
      expect(record!.currentStep).toBeUndefined();
      expect(record!.progressEta).toBeUndefined();
    });

    it("partial progress updates only set provided fields", async () => {
      await appendRunCreated();
      await appendEffectRequested("eff-001");
      await appendEffectProgress("eff-001", {
        progressPercent: 30,
        // no progressLabel, currentStep, or eta
      });

      const index = await buildEffectIndex({ runDir });
      const record = index.getByEffectId("eff-001");
      expect(record!.progressPercent).toBe(30);
      expect(record!.progressLabel).toBeUndefined();
      expect(record!.currentStep).toBeUndefined();
    });
  });
});
