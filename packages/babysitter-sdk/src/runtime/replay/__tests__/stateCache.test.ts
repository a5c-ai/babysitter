import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../../storage/createRunDir";
import { appendEvent } from "../../../storage/journal";
import {
  journalHeadsEqual,
  normalizeSnapshot,
  readStateCache,
  rebuildStateCache,
} from "../stateCache";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-state-cache-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function createTestRun(runId = `run-${Date.now()}`): Promise<string> {
  const { runDir } = await createRunDir({
    runsRoot: tmpRoot,
    runId,
    request: "state-cache-test",
    processPath: "./process.js",
  });
  await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
  return runDir;
}

describe("state cache helpers", () => {
  test("rebuildStateCache derives summaries and pending counts", async () => {
    const runDir = await createTestRun("run-derived");
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "effect-one",
        invocationKey: "invoke-one",
        stepId: "step-1",
        taskId: "task-1",
        taskDefRef: "tasks/effect-one/task.json",
        inputsRef: "tasks/effect-one/inputs.json",
        kind: "node",
        label: "effect-one",
      },
    });
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId: "effect-one",
        status: "ok",
        resultRef: "tasks/effect-one/result.json",
      },
    });
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "effect-two",
        invocationKey: "invoke-two",
        stepId: "step-2",
        taskId: "task-2",
        taskDefRef: "tasks/effect-two/task.json",
        kind: "node",
        label: "pending-node",
      },
    });
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "effect-three",
        invocationKey: "invoke-three",
        stepId: "step-3",
        taskId: "task-3",
        taskDefRef: "tasks/effect-three/task.json",
      },
    });

    const snapshot = await rebuildStateCache(runDir, { reason: "manual_rebuild" });

    expect(snapshot.stateVersion).toBe(5);
    expect(snapshot.rebuildReason).toBe("manual_rebuild");
    expect(Object.keys(snapshot.effectsByInvocation)).toHaveLength(3);
    expect(snapshot.effectsByInvocation["invoke-one"]).toMatchObject({
      effectId: "effect-one",
      invocationKey: "invoke-one",
      status: "resolved_ok",
      kind: "node",
      label: "effect-one",
      taskId: "task-1",
      stepId: "step-1",
    });
    expect(snapshot.effectsByInvocation["invoke-one"]?.resolvedAt).toEqual(expect.any(String));
    expect(snapshot.effectsByInvocation["invoke-two"]).toMatchObject({
      effectId: "effect-two",
      invocationKey: "invoke-two",
      status: "requested",
      kind: "node",
      label: "pending-node",
      taskId: "task-2",
      stepId: "step-2",
    });
    expect(snapshot.effectsByInvocation["invoke-three"]).toMatchObject({
      effectId: "effect-three",
      invocationKey: "invoke-three",
      status: "requested",
      taskId: "task-3",
      stepId: "step-3",
    });
    expect(snapshot.pendingEffectsByKind).toEqual({ node: 1, unknown: 1 });
  });

  test("readStateCache throws on invalid JSON and rebuild overwrites snapshot", async () => {
    const runDir = await createTestRun("run-corrupt");
    const stateFile = path.join(runDir, "state", "state.json");
    await fs.writeFile(stateFile, "{ not valid json", "utf8");

    await expect(readStateCache(runDir)).rejects.toThrow();

    await rebuildStateCache(runDir, { reason: "corrupted_file" });

    const repaired = await readStateCache(runDir);
    expect(repaired).not.toBeNull();
    expect(repaired?.rebuildReason).toBe("corrupted_file");
    expect(repaired?.stateVersion).toBe(1);
    expect(repaired?.effectsByInvocation).toEqual({});
  });

  test("normalizeSnapshot provides defaults for legacy payloads", () => {
    const normalized = normalizeSnapshot({
      schemaVersion: "2025.01.state-cache",
      savedAt: "2025-01-01T00:00:00.000Z",
      journalHead: { seq: 2, ulid: "01HX123ABCDEF" },
    });
    expect(normalized.schemaVersion).toBe("2025.01.state-cache");
    expect(normalized.savedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(normalized.stateVersion).toBe(0);
    expect(normalized.effectsByInvocation).toEqual({});
    expect(normalized.pendingEffectsByKind).toEqual({});
    expect(normalized.rebuildReason).toBeNull();
    expect(normalized.journalHead).toMatchObject({ seq: 2, ulid: "01HX123ABCDEF" });
  });

  test("journalHeadsEqual detects checksum mismatches", () => {
    const base = { seq: 3, ulid: "01HX123ABCDEF", checksum: "aaa" };
    const other = { seq: 3, ulid: "01HX123ABCDEF", checksum: "bbb" };
    expect(journalHeadsEqual(base, other)).toBe(false);
    expect(journalHeadsEqual(base, { seq: 3, ulid: "01HX123ABCDEF" })).toBe(true);
  });
});
