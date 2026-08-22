import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createBabysitterCli } from "../main";
import { EffectRequestedError } from "../../runtime/exceptions";
import { runTaskIntrinsic } from "../../runtime/intrinsics/task";
import type { DefinedTask } from "../../runtime/types";
import { loadJournal } from "../../storage/journal";
import { buildTaskContext, createTestRun } from "../../runtime/__tests__/testHelpers";

const sampleTask: DefinedTask<Record<string, never>, { bound: string }> = {
  id: "checksum-bound-cli-test",
  async build() {
    return { kind: "node", title: "checksum-bound-cli-test" };
  },
};

const tempRoots: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("task CLI identity and checksum boundaries", () => {
  it("does not resolve a real requested effect when the handoff file is replaced before CLI read", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "task-post-checksum-integration-"));
    tempRoots.push(root);
    const { runDir, runId } = await createTestRun(root);
    const context = await buildTaskContext(runDir, runId);
    let effectId = "";
    let invocationKey = "";
    try {
      await runTaskIntrinsic({ task: sampleTask, args: {}, context });
    } catch (error) {
      if (!(error instanceof EffectRequestedError)) throw error;
      effectId = error.action.effectId;
      invocationKey = error.action.invocationKey;
    }
    if (!effectId || !invocationKey) throw new Error("expected a requested effect");

    const taskDir = path.join(runDir, "tasks", effectId);
    const handoffPath = path.join(taskDir, "output.json");
    const authenticatedBytes = Buffer.from('{"bound":"authenticated"}\n');
    const replacementPath = `${handoffPath}.replacement`;
    await fs.writeFile(handoffPath, authenticatedBytes);
    await fs.writeFile(replacementPath, '{"bound":"replacement"}\n');
    await fs.rename(replacementPath, handoffPath);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const exitCode = await createBabysitterCli().run([
      "task:post",
      runDir,
      effectId,
      "--status",
      "ok",
      "--value",
      handoffPath,
      "--value-sha256",
      createHash("sha256").update(authenticatedBytes).digest("hex"),
      "--invocation-key",
      invocationKey,
      "--runs-dir",
      root,
    ]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/checksum mismatch/i));
    await expect(fs.access(path.join(taskDir, "result.json"))).rejects.toMatchObject({ code: "ENOENT" });
    const journal = await loadJournal(runDir);
    expect(journal.some((event) => event.type === "EFFECT_RESOLVED")).toBe(false);
  });

  it("shows the journal invocation identity for a real resolved effect", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "task-show-identity-integration-"));
    tempRoots.push(root);
    const { runDir, runId } = await createTestRun(root);
    const context = await buildTaskContext(runDir, runId);
    let effectId = "";
    let invocationKey = "";
    try {
      await runTaskIntrinsic({ task: sampleTask, args: {}, context });
    } catch (error) {
      if (!(error instanceof EffectRequestedError)) throw error;
      effectId = error.action.effectId;
      invocationKey = error.action.invocationKey;
    }
    if (!effectId || !invocationKey) throw new Error("expected a requested effect");

    const outputPath = path.join(runDir, "tasks", effectId, "output.json");
    await fs.writeFile(outputPath, '{"bound":"resolved"}\n');
    const cli = createBabysitterCli();
    await expect(cli.run([
      "task:post",
      runDir,
      effectId,
      "--status",
      "ok",
      "--value",
      outputPath,
      "--invocation-key",
      invocationKey,
      "--runs-dir",
      root,
    ])).resolves.toBe(0);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await expect(cli.run(["task:show", runDir, effectId, "--json", "--runs-dir", root])).resolves.toBe(0);
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0])) as {
      effect: { invocationKey?: string };
    };
    const requested = (await loadJournal(runDir)).find((event) => event.type === "EFFECT_REQUESTED");

    expect(requested?.data.invocationKey).toBe(invocationKey);
    expect(payload.effect.invocationKey).toBe(requested?.data.invocationKey);
  });
});
