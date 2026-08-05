import { createHash } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { parseBabysitterCheckpoint } from "../parser";
import type { TaskEffect } from "@/types";

const tempDirs: string[] = [];
const schemaVersion = "2026.07.omp-driver-v1";

async function createRun(): Promise<string> {
  const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "observer-omp-checkpoint-"));
  tempDirs.push(runDir);
  return runDir;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value));
}

function task(status: TaskEffect["status"] = "requested", kind: TaskEffect["kind"] = "agent") {
  return { effectId: "effect-1", invocationKey: "invocation-1", kind, status };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("OMP execution checkpoint parsing", () => {
  it("reports requested and shell-running states", async () => {
    const runDir = await createRun();
    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toEqual({ state: "requested" });

    await writeJson(path.join(runDir, "tasks/effect-1/execution.json"), {
      schemaVersion,
      effectId: "effect-1",
      invocationKey: "invocation-1",
      kind: "shell",
      state: "in_progress",
    });
    await expect(parseBabysitterCheckpoint(runDir, task("requested", "shell"))).resolves.toEqual({
      state: "shell-running",
    });
  });

  it("links an allocator-suffixed checkpointed owner reference", async () => {
    const runDir = await createRun();
    await writeJson(path.join(runDir, "tasks/effect-1/execution.json"), {
      schemaVersion,
      effectId: "effect-1",
      invocationKey: "invocation-1",
      kind: "agent",
      state: "in_progress",
      attempt: 2,
      attemptState: "claimed",
      ownerName: "Babysitter-effect-1",
      dispatchToken: "dispatch-1",
    });
    await writeJson(path.join(runDir, "tasks/effect-1/agent-owner.json"), {
      schemaVersion,
      effectId: "effect-1",
      invocationKey: "invocation-1",
      ownerName: "Babysitter-effect-1",
      dispatchToken: "dispatch-1",
      attempt: 2,
      toolCallId: "tool-call-1",
      claimedAt: "2026-07-24T00:00:00.000Z",
      agentRef: "agent://Babysitter-effect-1-2",
      transcript: "must never be copied",
    });

    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toEqual({
      state: "agent-owned",
      attempt: 2,
      agentRef: "agent://Babysitter-effect-1-2",
    });
  });

  it("rejects forged handles and identifies a retained late owner", async () => {
    const runDir = await createRun();
    const execution = {
      schemaVersion,
      effectId: "effect-1",
      invocationKey: "invocation-1",
      kind: "agent",
      state: "in_progress",
      attempt: 1,
      attemptState: "awaiting_late_owner",
      ownerName: "Babysitter-effect-1",
      dispatchToken: "dispatch-1",
    };
    await writeJson(path.join(runDir, "tasks/effect-1/execution.json"), execution);
    const ownerPath = path.join(runDir, "tasks/effect-1/agent-owner.json");
    await writeJson(ownerPath, {
      schemaVersion,
      effectId: "effect-1",
      invocationKey: "invocation-1",
      ownerName: "Babysitter-effect-1",
      dispatchToken: "dispatch-1",
      attempt: 1,
      toolCallId: "tool-call-1",
      agentRef: "agent://forged-owner",
    });
    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toMatchObject({
      state: "failed/attention",
      attention: "Forged or non-owner agent reference",
    });

    for (const forgedLookalike of [
      "agent://Babysitter-effect-1-1",
      "agent://Babysitter-effect-1-02",
      "agent://Babysitter-effect-1-2evil",
      "agent://Babysitter-effect-1-copy",
    ]) {
      await writeJson(ownerPath, {
        schemaVersion,
        effectId: "effect-1",
        invocationKey: "invocation-1",
        ownerName: "Babysitter-effect-1",
        dispatchToken: "dispatch-1",
        attempt: 1,
        toolCallId: "tool-call-1",
        agentRef: forgedLookalike,
      });
      await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toMatchObject({
        state: "failed/attention",
        attention: "Forged or non-owner agent reference",
      });
    }

    await writeJson(ownerPath, {
      schemaVersion,
      effectId: "effect-1",
      invocationKey: "invocation-1",
      ownerName: "Babysitter-effect-1",
      dispatchToken: "dispatch-1",
      attempt: 1,
      toolCallId: "tool-call-1",
    });
    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toEqual({
      state: "awaiting-late-owner",
      attempt: 1,
    });
  });

  it("distinguishes durable uncommitted output while canonical journal resolution wins", async () => {
    const runDir = await createRun();
    const output = { approved: true };
    await writeJson(path.join(runDir, "tasks/effect-1/execution.json"), {
      schemaVersion,
      effectId: "effect-1",
      invocationKey: "invocation-1",
      kind: "agent",
      state: "completed",
      attempt: 1,
      outputRef: "tasks/effect-1/output.json",
      outputSha256: createHash("sha256").update(JSON.stringify(output)).digest("hex"),
    });
    await writeJson(path.join(runDir, "tasks/effect-1/output.json"), output);

    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toEqual({
      state: "durable-output-uncommitted",
      attempt: 1,
    });
    await writeJson(path.join(runDir, "tasks/effect-1/output.json"), { approved: false });
    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toEqual({
      state: "failed/attention",
      attention: "Durable output checksum mismatch",
    });
    await fs.writeFile(path.join(runDir, "tasks/effect-1/execution.json"), "not-json");
    await expect(parseBabysitterCheckpoint(runDir, task("resolved"))).resolves.toEqual({ state: "committed" });
    await expect(parseBabysitterCheckpoint(runDir, task("error"))).resolves.toEqual({ state: "committed" });
  });

  it("surfaces malformed or version-mismatched artifacts as attention", async () => {
    const runDir = await createRun();
    const executionPath = path.join(runDir, "tasks/effect-1/execution.json");
    await fs.mkdir(path.dirname(executionPath), { recursive: true });
    await fs.writeFile(executionPath, "{");
    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toMatchObject({ state: "failed/attention" });

    await writeJson(executionPath, {
      schemaVersion: "2025.01.incompatible",
      effectId: "effect-1",
      invocationKey: "invocation-1",
      kind: "agent",
      state: "in_progress",
    });
    await expect(parseBabysitterCheckpoint(runDir, task())).resolves.toMatchObject({
      state: "failed/attention",
      attention: expect.stringContaining("version mismatch"),
    });
  });
});
