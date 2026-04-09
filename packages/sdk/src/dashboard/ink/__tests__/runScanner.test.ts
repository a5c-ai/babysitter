/**
 * runScanner.test.ts
 *
 * Tests for the pure runScanner module (data/runScanner.ts).
 * Uses real filesystem fixtures via createRunDir/appendEvent.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createRunDir, appendEvent } from "../../../storage";
import { nextUlid } from "../../../storage/ulids";
import { scanRuns, getRunDetail } from "../data/runScanner.js";

describe("runScanner", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `run-scanner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  async function createRun(
    state: "completed" | "waiting" | "failed" | "created" = "created",
    opts?: { processId?: string; prompt?: string },
  ) {
    const runId = nextUlid();
    const result = await createRunDir({
      runsRoot: testDir,
      runId,
      request: opts?.prompt ?? "test",
      processId: opts?.processId ?? "test-process",
    });

    await appendEvent({
      runDir: result.runDir,
      eventType: "RUN_CREATED",
      event: { processId: opts?.processId ?? "test-process", entrypoint: "test.js#process" },
    });

    if (state === "completed") {
      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_COMPLETED",
        event: { result: { status: "ok" } },
      });
    } else if (state === "failed") {
      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_FAILED",
        event: { error: "something broke" },
      });
    } else if (state === "waiting") {
      await appendEvent({
        runDir: result.runDir,
        eventType: "EFFECT_REQUESTED",
        event: {
          effectId: `eff-${runId.slice(-4)}`,
          invocationKey: `test:S000001:task-1`,
          invocationHash: "abc",
          stepId: "S000001",
          taskId: "task-1",
          kind: "agent",
          label: "work",
          taskDefRef: `tasks/eff-${runId.slice(-4)}/task.json`,
          labels: ["work"],
        },
      });
    }

    return { runId, runDir: result.runDir };
  }

  // -------------------------------------------------------------------------
  // scanRuns
  // -------------------------------------------------------------------------

  describe("scanRuns", () => {
    it("returns empty array for non-existent directory", async () => {
      const runs = await scanRuns(path.join(testDir, "nope"));
      expect(runs).toEqual([]);
    });

    it("returns empty array for empty directory", async () => {
      const runs = await scanRuns(testDir);
      expect(runs).toEqual([]);
    });

    it("returns summaries for all valid runs", async () => {
      await createRun("completed");
      await createRun("waiting");
      await createRun("failed");

      const runs = await scanRuns(testDir);
      expect(runs).toHaveLength(3);
    });

    it("derives correct states", async () => {
      await createRun("completed");
      await createRun("waiting");
      await createRun("failed");
      await createRun("created");

      const runs = await scanRuns(testDir);
      const states = runs.map((r) => r.state).sort();
      expect(states).toEqual(["completed", "created", "failed", "waiting"]);
    });

    it("sorts by createdAt descending (most recent first)", async () => {
      const r1 = await createRun("completed");
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const r2 = await createRun("waiting");

      const runs = await scanRuns(testDir);
      expect(runs[0].runId).toBe(r2.runId);
      expect(runs[1].runId).toBe(r1.runId);
    });

    it("includes processId in summaries", async () => {
      await createRun("completed", { processId: "my-process" });

      const runs = await scanRuns(testDir);
      expect(runs[0].processId).toBe("my-process");
    });

    it("computes correct pendingCount for waiting run", async () => {
      await createRun("waiting");

      const runs = await scanRuns(testDir);
      const waiting = runs.find((r) => r.state === "waiting");
      expect(waiting).toBeDefined();
      expect(waiting!.pendingCount).toBe(1);
    });

    it("reports zero pendingCount for completed run", async () => {
      await createRun("completed");

      const runs = await scanRuns(testDir);
      expect(runs[0].pendingCount).toBe(0);
    });

    it("skips directories without run.json", async () => {
      await createRun("completed");
      // Create a non-run directory
      await fs.mkdir(path.join(testDir, "not-a-run"), { recursive: true });

      const runs = await scanRuns(testDir);
      expect(runs).toHaveLength(1);
    });

    it("includes eventCount in summaries", async () => {
      await createRun("completed");

      const runs = await scanRuns(testDir);
      // RUN_CREATED + RUN_COMPLETED = 2 events
      expect(runs[0].eventCount).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // getRunDetail
  // -------------------------------------------------------------------------

  describe("getRunDetail", () => {
    it("returns detail for a completed run", async () => {
      const { runDir } = await createRun("completed");
      const detail = await getRunDetail(runDir);

      expect(detail.state).toBe("completed");
      expect(detail.processId).toBe("test-process");
      expect(detail.eventCount).toBe(2);
      expect(detail.pendingCount).toBe(0);
      expect(detail.resolvedCount).toBe(0);
    });

    it("returns detail for a waiting run with pending effects", async () => {
      const { runDir } = await createRun("waiting");
      const detail = await getRunDetail(runDir);

      expect(detail.state).toBe("waiting");
      expect(detail.pendingCount).toBe(1);
    });

    it("returns detail for a failed run", async () => {
      const { runDir } = await createRun("failed");
      const detail = await getRunDetail(runDir);

      expect(detail.state).toBe("failed");
    });

    it("includes events array with correct types", async () => {
      const { runDir } = await createRun("waiting");
      const detail = await getRunDetail(runDir);

      expect(detail.events.length).toBeGreaterThanOrEqual(2);
      const types = detail.events.map((e) => e.type);
      expect(types).toContain("RUN_CREATED");
      expect(types).toContain("EFFECT_REQUESTED");
    });

    it("each event has type, recordedAt, and seq", async () => {
      const { runDir } = await createRun("completed");
      const detail = await getRunDetail(runDir);

      for (const event of detail.events) {
        expect(event.type).toBeDefined();
        expect(event.recordedAt).toBeDefined();
        expect(typeof event.seq).toBe("number");
      }
    });

    it("throws for non-existent run directory", async () => {
      await expect(
        getRunDetail(path.join(testDir, "nonexistent")),
      ).rejects.toThrow();
    });

    it("computes resolvedCount correctly when effects are resolved", async () => {
      const { runDir, runId } = await createRun("waiting");
      const effectId = `eff-${runId.slice(-4)}`;

      // Resolve the pending effect
      await appendEvent({
        runDir,
        eventType: "EFFECT_RESOLVED",
        event: {
          effectId,
          invocationKey: `test:S000001:task-1`,
          status: "ok",
          value: { done: true },
        },
      });

      const detail = await getRunDetail(runDir);
      expect(detail.resolvedCount).toBe(1);
      expect(detail.pendingCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // deriveRunState logic (tested indirectly)
  // -------------------------------------------------------------------------

  describe("state derivation", () => {
    it("created state: no lifecycle events and no pending effects", async () => {
      const { runDir } = await createRun("created");
      const detail = await getRunDetail(runDir);
      expect(detail.state).toBe("created");
    });

    it("completed state takes priority over pending effects", async () => {
      // Create a run with a pending effect then complete it
      const runId = nextUlid();
      const result = await createRunDir({
        runsRoot: testDir,
        runId,
        request: "test",
        processId: "test-process",
      });

      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_CREATED",
        event: { processId: "test-process", entrypoint: "test.js#process" },
      });

      await appendEvent({
        runDir: result.runDir,
        eventType: "EFFECT_REQUESTED",
        event: {
          effectId: "eff-1",
          invocationKey: "test:S000001:task-1",
          invocationHash: "abc",
          stepId: "S000001",
          taskId: "task-1",
          kind: "agent",
          label: "work",
          taskDefRef: "tasks/eff-1/task.json",
          labels: ["work"],
        },
      });

      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_COMPLETED",
        event: { result: { status: "ok" } },
      });

      const detail = await getRunDetail(result.runDir);
      expect(detail.state).toBe("completed");
    });

    it("failed state takes priority over pending effects", async () => {
      const runId = nextUlid();
      const result = await createRunDir({
        runsRoot: testDir,
        runId,
        request: "test",
        processId: "test-process",
      });

      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_CREATED",
        event: { processId: "test-process", entrypoint: "test.js#process" },
      });

      await appendEvent({
        runDir: result.runDir,
        eventType: "EFFECT_REQUESTED",
        event: {
          effectId: "eff-1",
          invocationKey: "test:S000001:task-1",
          invocationHash: "abc",
          stepId: "S000001",
          taskId: "task-1",
          kind: "agent",
          label: "work",
          taskDefRef: "tasks/eff-1/task.json",
          labels: ["work"],
        },
      });

      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_FAILED",
        event: { error: "boom" },
      });

      const detail = await getRunDetail(result.runDir);
      expect(detail.state).toBe("failed");
    });
  });
});
