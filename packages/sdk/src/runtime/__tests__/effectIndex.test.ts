import { describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { buildEffectIndex } from "../replay/effectIndex";
import { JournalEvent } from "../../storage/types";
import { RunFailedError } from "../exceptions";

const runDir = path.join(os.tmpdir(), "babysitter-effect-index-tests");

function makeEvent(seq: number, type: string, data: Record<string, unknown>): JournalEvent {
  const filename = `${seq.toString().padStart(6, "0")}.TEST.json`;
  return {
    seq,
    ulid: `01BX${seq.toString().padStart(4, "0")}`,
    filename,
    path: path.join(runDir, "journal", filename),
    type,
    recordedAt: new Date(1700000000000 + seq * 1000).toISOString(),
    data,
  };
}

describe("EffectIndex", () => {
  test("builds lookup maps from journal data", async () => {
    const events = [
      makeEvent(1, "EFFECT_REQUESTED", {
        effectId: "ef-1",
        invocationKey: "proc:S000001:demo",
        stepId: "S000001",
        taskId: "demo",
        kind: "node",
        taskDefRef: "tasks/ef-1/task.json",
      }),
      makeEvent(2, "EFFECT_RESOLVED", {
        effectId: "ef-1",
        status: "ok",
        resultRef: "tasks/ef-1/result.json",
      }),
    ];

    const index = await buildEffectIndex({ runDir, events });
    expect(index.getByEffectId("ef-1")?.status).toBe("resolved_ok");
    expect(index.getByInvocation("proc:S000001:demo")).toBeDefined();
  });

  test("throws when duplicate invocation keys appear", async () => {
    const events = [
      makeEvent(1, "EFFECT_REQUESTED", {
        effectId: "ef-dup",
        invocationKey: "proc:S000001:dup",
        stepId: "S000001",
        taskId: "dup",
        taskDefRef: "tasks/ef-dup/task.json",
      }),
      makeEvent(2, "EFFECT_REQUESTED", {
        effectId: "ef-dup-2",
        invocationKey: "proc:S000001:dup",
        stepId: "S000002",
        taskId: "dup",
        taskDefRef: "tasks/ef-dup-2/task.json",
      }),
    ];

    await expect(buildEffectIndex({ runDir, events })).rejects.toThrow(RunFailedError);
  });

  test("throws when journal sequence numbers skip", async () => {
    const events = [
      makeEvent(1, "EFFECT_REQUESTED", {
        effectId: "ef-gap",
        invocationKey: "proc:S000001:gap",
        stepId: "S000001",
        taskId: "gap",
        taskDefRef: "tasks/ef-gap/task.json",
      }),
      { ...makeEvent(3, "EFFECT_RESOLVED", { effectId: "ef-gap", status: "ok" as const }) },
    ];

    await expect(buildEffectIndex({ runDir, events })).rejects.toThrow(RunFailedError);
  });

  test("throws when journal ULIDs regress", async () => {
    const first = makeEvent(1, "EFFECT_REQUESTED", {
      effectId: "ef-ulid",
      invocationKey: "proc:S000001:ulid",
      stepId: "S000001",
      taskId: "ulid",
      taskDefRef: "tasks/ef-ulid/task.json",
    });
    const second = {
      ...makeEvent(2, "EFFECT_RESOLVED", { effectId: "ef-ulid", status: "ok" as const }),
      ulid: "01AALOWER",
    };

    await expect(buildEffectIndex({ runDir, events: [first, second] })).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(RunFailedError);
      const runError = error as RunFailedError;
      expect(runError.message).toContain("ULID order regression");
      expect(runError.details?.path).toBe(second.path);
      return true;
    });
  });

  test("silently skips unknown journal event types", async () => {
    const unknownEvent = makeEvent(1, "STOP_HOOK_INVOKED", { reason: "test" });
    const index = await buildEffectIndex({ runDir, events: [unknownEvent] });
    // Informational events should not affect the effect index
    expect(index.listEffects()).toHaveLength(0);
  });

  test("validates EFFECT_REQUESTED payload fields", async () => {
    const badEvent = makeEvent(1, "EFFECT_REQUESTED", {
      effectId: "",
      invocationKey: "",
      stepId: "S000001",
      taskId: "missing-fields",
      taskDefRef: "",
    });
    await expect(buildEffectIndex({ runDir, events: [badEvent] })).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(RunFailedError);
      const runError = error as RunFailedError;
      expect(runError.message).toContain("Malformed journal event missing effectId");
      expect(runError.details?.path).toBe(badEvent.path);
      return true;
    });
  });

  test("rejects EFFECT_RESOLVED events that reference unknown effects", async () => {
    const orphan = makeEvent(1, "EFFECT_RESOLVED", {
      effectId: "ef-missing",
      status: "ok",
    });

    await expect(buildEffectIndex({ runDir, events: [orphan] })).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(RunFailedError);
      const runError = error as RunFailedError;
      expect(runError.message).toContain("unknown effectId");
      expect(runError.details?.path).toBe(orphan.path);
      return true;
    });
  });

  test("rejects EFFECT_RESOLVED events with invalid status or refs", async () => {
    const events = [
      makeEvent(1, "EFFECT_REQUESTED", {
        effectId: "ef-invalid-refs",
        invocationKey: "proc:S000001:invalid",
        stepId: "S000001",
        taskId: "invalid",
        taskDefRef: "tasks/ef-invalid-refs/task.json",
      }),
      makeEvent(2, "EFFECT_RESOLVED", {
        effectId: "ef-invalid-refs",
        status: "pending",
        stdoutRef: 123,
      }),
    ];

    await expect(buildEffectIndex({ runDir, events })).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(RunFailedError);
      const runError = error as RunFailedError;
      expect(runError.message).toMatch(/Unknown EFFECT_RESOLVED status/);
      expect(runError.details?.path).toBe(events[1].path);
      return true;
    });
  });

  test("surface RunFailedError with file path when journal JSON is corrupt", async () => {
    const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "effect-index-corruption-"));
    const journalDir = path.join(runDir, "journal");
    await fs.mkdir(journalDir, { recursive: true });
    const badPath = path.join(journalDir, "000001.BAD.json");
    await fs.writeFile(badPath, "{ invalid json");

    await expect(buildEffectIndex({ runDir })).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(RunFailedError);
      expect((error as RunFailedError).details?.path).toBe(badPath);
      return true;
    });
  });
});
