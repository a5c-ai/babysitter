import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { createRunDir } from "@a5c-ai/babysitter-sdk";
import { snapshotState } from "../snapshotState";
import { storeTaskArtifacts } from "../storeTaskArtifacts";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-agent-storage-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("harness storage helpers", () => {
  test("snapshotState writes rebuildable cache", async () => {
    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-3",
      request: "state",
      processPath: ".a5c/processes/foo.js",
    });
    await snapshotState({ runDir, state: { cursor: 123 }, journalHead: { seq: 1, ulid: "X" } });
    const contents = JSON.parse(await fs.readFile(path.join(runDir, "state", "state.json"), "utf8"));
    expect(contents.state.cursor).toBe(123);
    expect(contents.journalHead.seq).toBe(1);
  });

  test("storeTaskArtifacts writes metadata and blobs", async () => {
    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "run-4",
      request: "tasks",
      processPath: ".a5c/processes/foo.js",
    });
    await storeTaskArtifacts({
      runDir,
      effectId: "effect-1",
      task: { kind: "act" },
      result: { ok: true },
      artifacts: [
        { name: "stdout.txt", data: "hello" },
        { name: "large.bin", data: Buffer.alloc(600 * 1024, 1) },
      ],
    });
    const artifactsManifest = JSON.parse(
      await fs.readFile(path.join(runDir, "tasks/effect-1/artifacts.json"), "utf8"),
    ) as Array<{ name: string; storedAt: string }>;
    expect(artifactsManifest).toHaveLength(2);
    const blobEntry = artifactsManifest.find((entry) => entry.storedAt.startsWith("blobs/"));
    expect(blobEntry).toBeDefined();
  });
});
