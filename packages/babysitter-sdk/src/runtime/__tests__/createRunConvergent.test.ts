import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRunConvergent } from "../createRunConvergent";
import * as runtimeHooks from "../hooks/runtime";
import { createRunDir } from "../../storage/createRunDir";
import { classifyConvergentRun } from "../convergentRun/classify";

let root: string;
let inputsPath: string;
let processSnapshotPath: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-create-convergent-"));
  inputsPath = path.join(root, "inputs.json");
  processSnapshotPath = path.join(root, "hermes-wave.mjs");
  await fs.writeFile(inputsPath, JSON.stringify({ objective: "recover" }, null, 2) + "\n");
  await fs.writeFile(processSnapshotPath, "export async function process() { return 'ok'; }\n");
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(root, { recursive: true, force: true });
});

describe("createRunConvergent", () => {
  it("Given an absent run, When creation completes, Then a reread completion marker makes retry read-only", async () => {
    const options = await createOptions("hermes-wave-7101-r2");
    const hookSpy = vi.spyOn(runtimeHooks, "callRuntimeHook").mockResolvedValue({
      hookType: "on-run-start",
      success: true,
      output: { ready: true },
      executedHooks: [],
    });

    await expect(classifyConvergentRun(options)).resolves.toEqual({ kind: "ABSENT" });
    const first = await createRunConvergent(options);
    const second = await createRunConvergent(options);

    expect(second).toEqual(first);
    expect(Object.keys(first).sort()).toEqual([
      "completionMarkerPath",
      "completionMarkerSelfHash",
      "hookResultSha256",
      "hookStatus",
      "runCreatedEventSha256",
      "runCreatedEventUlid",
      "runId",
      "runJsonSha256",
    ]);
    expect(hookSpy).toHaveBeenCalledTimes(1);
    await expect(fs.access(first.completionMarkerPath)).resolves.toBeUndefined();
  });

  it("Given an exact pre-journal run, When no run.json digest is supplied, Then resume is rejected without rewriting bytes", async () => {
    const options = await createOptions("hermes-wave-7102-r2");
    const runDir = path.join(root, options.runId);
    await createRunDir({
      runsRoot: root,
      runId: options.runId,
      request: options.request,
      processId: options.process.processId,
      inputs: { objective: "recover" },
      entrypoint: {
        importPath: path.relative(runDir, processSnapshotPath),
        exportName: options.process.exportName,
      },
      processPath: path.relative(runDir, processSnapshotPath),
      extraMetadata: {
        processCodeHash: options.processSnapshotHash,
      },
    });
    const runJsonPath = path.join(runDir, "run.json");
    const before = await fs.readFile(runJsonPath);

    await expect(classifyConvergentRun(options)).resolves.toMatchObject({ kind: "PRE_JOURNAL_EXACT" });

    await expect(createRunConvergent(options)).rejects.toMatchObject({
      name: "RUN_CREATE_RESUME_UNSUPPORTED",
    });

    expect(await fs.readFile(runJsonPath)).toEqual(before);
  });

  it("Given a pre-hook marker, When creation resumes, Then it invokes the hook exactly once", async () => {
    const options = await createOptions("hermes-wave-7103-r2");
    const hookSpy = vi.spyOn(runtimeHooks, "callRuntimeHook").mockResolvedValue({
      hookType: "on-run-start",
      success: true,
      output: null,
      executedHooks: [],
    });
    const complete = await createRunConvergent(options);
    const markerDirectory = path.dirname(complete.completionMarkerPath);
    await fs.rm(complete.completionMarkerPath);
    await fs.rename(
      path.join(markerDirectory, "hook-may-have-started.json"),
      path.join(markerDirectory, "hook-not-started.json"),
    );
    hookSpy.mockClear();

    await expect(classifyConvergentRun(options)).resolves.toMatchObject({ kind: "JOURNALED_PRE_HOOK_PROVEN" });

    await createRunConvergent(options);

    expect(hookSpy).toHaveBeenCalledTimes(1);
  });

  it("Given hook finalization is unknown, When creation retries, Then it fails closed without another hook call", async () => {
    const options = await createOptions("hermes-wave-7104-r2");
    const hookSpy = vi.spyOn(runtimeHooks, "callRuntimeHook").mockRejectedValue(new Error("simulated kill"));

    await expect(createRunConvergent(options)).rejects.toMatchObject({
      name: "RUN_CREATE_HOOK_FINALIZATION_UNKNOWN",
    });
    const markerPath = path.join(root, options.runId, "state", "run-create-convergent-v1", "hook-may-have-started.json");
    const beforeRetry = await fs.readFile(markerPath);
    await expect(classifyConvergentRun(options)).resolves.toEqual({ kind: "JOURNALED_HOOK_FINALIZATION_UNKNOWN" });
    await expect(createRunConvergent(options)).rejects.toMatchObject({
      name: "RUN_CREATE_HOOK_FINALIZATION_UNKNOWN",
    });

    expect(hookSpy).toHaveBeenCalledTimes(1);
    expect(await fs.readFile(markerPath)).toEqual(beforeRetry);
  });

  it("Given a divergent completion marker or partial run, When creation retries, Then it returns the precise fail-closed code", async () => {
    const options = await createOptions("hermes-wave-7105-r2");
    vi.spyOn(runtimeHooks, "callRuntimeHook").mockResolvedValue({
      hookType: "on-run-start",
      success: true,
      output: null,
      executedHooks: [],
    });
    const complete = await createRunConvergent(options);
    await expect(classifyConvergentRun(options)).resolves.toMatchObject({ kind: "CREATED_COMPLETE" });
    await fs.appendFile(complete.completionMarkerPath, "\n");

    await expect(createRunConvergent(options)).rejects.toMatchObject({
      name: "RUN_CREATE_COMPLETION_MARKER_DIVERGED",
    });

    const partialOptions = await createOptions("hermes-wave-7106-r2");
    await fs.mkdir(path.join(root, partialOptions.runId));
    await fs.writeFile(path.join(root, partialOptions.runId, "unexpected"), "partial");

    await expect(classifyConvergentRun(partialOptions)).resolves.toEqual({ kind: "PARTIAL_UNKNOWN" });

    await expect(createRunConvergent(partialOptions)).rejects.toMatchObject({
      name: "RUN_CREATE_PARTIAL_INVALID",
    });
  });
});

async function createOptions(runId: string) {
  const inputBytes = await fs.readFile(inputsPath);
  const snapshotBytes = await fs.readFile(processSnapshotPath);
  return {
    runsDir: root,
    runId,
    request: "hermes-wave",
    process: {
      processId: "hermes-wave",
      importPath: processSnapshotPath,
      exportName: "process",
    },
    inputsPath,
    canonicalInputSha256: sha256(inputBytes),
    processSnapshotPath,
    processSnapshotHash: sha256(snapshotBytes),
    replacementSessionId: "ses_fresh_replacement",
  };
}

function sha256(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
