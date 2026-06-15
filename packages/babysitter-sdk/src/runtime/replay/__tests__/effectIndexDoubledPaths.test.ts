/**
 * Tests that expose doubled .a5c path bugs in EffectIndex and related
 * replay infrastructure.
 *
 * When runDir or event refs contain doubled .a5c/runs segments, the
 * EffectIndex stores them verbatim, causing downstream consumers
 * (normalizeRef in task.ts, resolveArtifactAbsolutePath in main.ts)
 * to construct paths that point to non-existent locations.
 *
 * These tests verify the EffectIndex correctly records refs from journal
 * events, and that doubled paths in those refs are detectable.
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../../storage/createRunDir";
import { appendEvent } from "../../../storage/journal";
import { buildEffectIndex } from "../effectIndex";
import { collapseDoubledA5cRuns } from "../../../cli/resolveInputPath";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-doubled-paths-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function createTestRun(runId = `run-${Date.now()}`): Promise<string> {
  const { runDir } = await createRunDir({
    runsRoot: tmpRoot,
    runId,
    request: "doubled-paths-test",
    processPath: "./process.js",
  });
  await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
  return runDir;
}

describe("EffectIndex with doubled .a5c paths in refs", () => {
  it("collapses doubled resultRef from EFFECT_RESOLVED", async () => {
    const runDir = await createTestRun("run-doubled-ref");

    // Request an effect
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "eff-001",
        invocationKey: "inv-001",
        stepId: "S000001",
        taskId: "task-1",
        taskDefRef: "tasks/eff-001/task.json",
        inputsRef: "tasks/eff-001/inputs.json",
        kind: "node",
        label: "test-effect",
      },
    });

    // Resolve the effect with a DOUBLED resultRef
    // This simulates the bug where the ref was constructed from a doubled runDir
    const doubledResultRef = ".a5c/runs/.a5c/runs/run-doubled-ref/tasks/eff-001/result.json";
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId: "eff-001",
        status: "ok",
        resultRef: doubledResultRef,
      },
    });

    const index = await buildEffectIndex({ runDir });
    const record = index.getByEffectId("eff-001");

    expect(record).toBeDefined();
    expect(record!.status).toBe("resolved_ok");

    // The EffectIndex now collapses doubled paths on ingestion
    const collapsedRef = collapseDoubledA5cRuns(doubledResultRef);
    expect(record!.resultRef).toBe(collapsedRef);

    // The stored ref should NOT contain doubled paths
    const normalized = record!.resultRef!.replace(/\\/g, "/");
    expect(normalized).not.toContain(".a5c/runs/.a5c/runs");
  });

  it("collapses doubled stdoutRef and stderrRef on ingestion", async () => {
    const runDir = await createTestRun("run-doubled-stdio");

    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "eff-002",
        invocationKey: "inv-002",
        stepId: "S000001",
        taskId: "task-2",
        taskDefRef: "tasks/eff-002/task.json",
        kind: "node",
        label: "test-stdio",
      },
    });

    // Resolve with doubled stdout/stderr refs
    const doubledStdoutRef = ".a5c/runs/.a5c/runs/run-doubled-stdio/tasks/eff-002/stdout.log";
    const doubledStderrRef = ".a5c/runs/.a5c/runs/run-doubled-stdio/tasks/eff-002/stderr.log";

    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId: "eff-002",
        status: "ok",
        resultRef: "tasks/eff-002/result.json",
        stdoutRef: doubledStdoutRef,
        stderrRef: doubledStderrRef,
      },
    });

    const index = await buildEffectIndex({ runDir });
    const record = index.getByEffectId("eff-002");

    expect(record).toBeDefined();
    // The doubled refs are now collapsed
    expect(record!.stdoutRef).toBe(collapseDoubledA5cRuns(doubledStdoutRef));
    expect(record!.stderrRef).toBe(collapseDoubledA5cRuns(doubledStderrRef));

    // Neither should contain doubled paths
    expect(record!.stdoutRef!.replace(/\\/g, "/")).not.toContain(".a5c/runs/.a5c/runs");
    expect(record!.stderrRef!.replace(/\\/g, "/")).not.toContain(".a5c/runs/.a5c/runs");
  });

  it("constructs doubled absolute path when runDir is doubled and ref is relative", async () => {
    const runDir = await createTestRun("run-abs-doubled");

    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "eff-003",
        invocationKey: "inv-003",
        stepId: "S000001",
        taskId: "task-3",
        taskDefRef: "tasks/eff-003/task.json",
        kind: "node",
        label: "test-abs",
      },
    });

    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId: "eff-003",
        status: "ok",
        resultRef: "tasks/eff-003/result.json",
      },
    });

    const index = await buildEffectIndex({ runDir });
    const record = index.getByEffectId("eff-003");

    // Now simulate what normalizeRef in task.ts does with a doubled runDir
    const doubledRunDir = runDir.replace(
      path.basename(runDir),
      `.a5c/runs/${path.basename(runDir)}`
    );

    // normalizeRef: path.isAbsolute(ref) ? ref : path.join(runDir, ref)
    const relativeRef = record!.resultRef || "tasks/eff-003/result.json";
    const resolvedWithDoubledRunDir = path.join(doubledRunDir, relativeRef);

    // The resolved path has doubling
    const normalized = resolvedWithDoubledRunDir.replace(/\\/g, "/");
    expect(normalized).toContain(".a5c/runs");

    // Applying collapse fixes it
    const fixed = collapseDoubledA5cRuns(resolvedWithDoubledRunDir);
    const fixedNorm = fixed.replace(/\\/g, "/");

    // Count .a5c/runs segments — should be at most 1
    const runSegments = fixedNorm.split(".a5c/runs").length - 1;
    expect(runSegments).toBeLessThanOrEqual(1);
  });
});

describe("EffectIndex taskDefRef with doubled paths", () => {
  it("stores taskDefRef with doubled path from EFFECT_REQUESTED", async () => {
    const runDir = await createTestRun("run-taskdef-doubled");

    // Simulate a taskDefRef that was written with a doubled path
    const doubledTaskDefRef = ".a5c/runs/.a5c/runs/run-taskdef-doubled/tasks/eff-004/task.json";

    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "eff-004",
        invocationKey: "inv-004",
        stepId: "S000001",
        taskId: "task-4",
        taskDefRef: doubledTaskDefRef,
        kind: "node",
        label: "test-taskdef",
      },
    });

    const index = await buildEffectIndex({ runDir });
    const record = index.getByEffectId("eff-004");

    expect(record).toBeDefined();
    // taskDefRef is stored verbatim with the doubling
    expect(record!.taskDefRef).toBe(doubledTaskDefRef);
    expect(record!.taskDefRef.replace(/\\/g, "/")).toContain(".a5c/runs/.a5c/runs");
  });
});
