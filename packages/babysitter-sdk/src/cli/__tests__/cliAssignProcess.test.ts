import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "node:fs";
import { createBabysitterCli } from "../main";
import { readRunMetadata } from "../../storage/runFiles";
import { loadJournal } from "../../storage/journal";
import { createRunDir } from "../../storage/createRunDir";

describe("babysitter run:assign-process CLI", () => {
  let runsRoot: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-assign-process-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(runsRoot, { recursive: true, force: true });
  });

  async function createBareRun(): Promise<{ runDir: string; runId: string }> {
    const result = await createRunDir({
      runsRoot,
      runId: "test-bare-run",
      request: "test-request",
      processId: "placeholder",
      entrypoint: { importPath: "bare-run" },
    });
    return { runDir: result.runDir, runId: "test-bare-run" };
  }

  async function createRunWithProcess(entryFile: string): Promise<{ runDir: string; runId: string }> {
    const result = await createRunDir({
      runsRoot,
      runId: "test-assigned-run",
      request: "test-request",
      processId: "existing-process",
      entrypoint: { importPath: entryFile, exportName: "process" },
      processPath: entryFile,
    });
    return { runDir: result.runDir, runId: "test-assigned-run" };
  }

  async function writeEntrypoint(relativePath: string, contents: string) {
    const absolutePath = path.join(runsRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, contents, "utf8");
    return absolutePath;
  }

  function readLastJsonLine(spy: ReturnType<typeof vi.spyOn>) {
    const raw = String(spy.mock.calls.at(-1)?.[0] ?? "{}");
    return JSON.parse(raw);
  }

  it("assigns a process to a bare run and appends PROCESS_ASSIGNED journal event", async () => {
    const { runDir } = await createBareRun();
    const entryFile = await writeEntrypoint("processes/my-process.mjs", `export async function handler() { return "ok"; }\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${entryFile}#handler`,
      "--process-id",
      "my-custom-process",
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[run:assign-process]"));

    const metadata = await readRunMetadata(runDir);
    expect(metadata.entrypoint.importPath).toBe(entryFile);
    expect(metadata.entrypoint.exportName).toBe("handler");
    expect(metadata.processId).toBe("my-custom-process");
    expect(metadata.processPath).toBe(entryFile);

    const journal = await loadJournal(runDir);
    const assignEvent = journal.find((e) => e.type === "PROCESS_ASSIGNED");
    expect(assignEvent).toBeDefined();
    expect(assignEvent!.data.processId).toBe("my-custom-process");
    expect(assignEvent!.data.previousEntrypoint).toEqual({ importPath: "bare-run" });
    expect(assignEvent!.data.entrypoint).toEqual({ importPath: entryFile, exportName: "handler" });
  });

  it("supports --json output", async () => {
    const { runDir } = await createBareRun();
    const entryFile = await writeEntrypoint("processes/json-test.mjs", `export async function process() { return true; }\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${entryFile}#process`,
      "--process-id",
      "json-process",
      "--runs-dir",
      runsRoot,
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload).toMatchObject({
      runId: "test-bare-run",
      assigned: true,
      processId: "json-process",
      previousEntrypoint: { importPath: "bare-run" },
    });
    expect(payload.entry).toContain("json-test.mjs#process");
  });

  it("supports --dry-run without mutating", async () => {
    const { runDir } = await createBareRun();
    const entryFile = await writeEntrypoint("processes/dry-run.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${entryFile}#handler`,
      "--process-id",
      "dry-run-process",
      "--runs-dir",
      runsRoot,
      "--dry-run",
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("dry-run"));

    const metadata = await readRunMetadata(runDir);
    expect(metadata.entrypoint.importPath).toBe("bare-run");
  });

  it("supports --dry-run with --json output", async () => {
    const { runDir } = await createBareRun();
    const entryFile = await writeEntrypoint("processes/dry-json.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${entryFile}#handler`,
      "--runs-dir",
      runsRoot,
      "--dry-run",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload.dryRun).toBe(true);
    expect(payload.previousEntrypoint).toEqual({ importPath: "bare-run" });
  });

  it("rejects when process already assigned (not a bare run)", async () => {
    const entryFile = await writeEntrypoint("processes/existing.mjs", `export async function process() {}\n`);
    const { runDir } = await createRunWithProcess(entryFile);
    const newEntry = await writeEntrypoint("processes/new.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${newEntry}#handler`,
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("already has a process assigned"));
  });

  it("rejects when process already assigned with --json output", async () => {
    const entryFile = await writeEntrypoint("processes/existing-json.mjs", `export async function process() {}\n`);
    const { runDir } = await createRunWithProcess(entryFile);
    const newEntry = await writeEntrypoint("processes/new-json.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${newEntry}#handler`,
      "--runs-dir",
      runsRoot,
      "--json",
    ]);

    expect(exitCode).toBe(1);
    const payload = readLastJsonLine(logSpy);
    expect(payload.error).toBe("PROCESS_ALREADY_ASSIGNED");
  });

  it("allows --force to override existing process assignment", async () => {
    const entryFile = await writeEntrypoint("processes/original.mjs", `export async function process() {}\n`);
    const { runDir } = await createRunWithProcess(entryFile);
    const newEntry = await writeEntrypoint("processes/replacement.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${newEntry}#handler`,
      "--process-id",
      "forced-process",
      "--force",
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(0);

    const metadata = await readRunMetadata(runDir);
    expect(metadata.entrypoint.importPath).toBe(newEntry);
    expect(metadata.processId).toBe("forced-process");

    const journal = await loadJournal(runDir);
    const assignEvent = journal.find((e) => e.type === "PROCESS_ASSIGNED");
    expect(assignEvent).toBeDefined();
    expect(assignEvent!.data.force).toBe(true);
    expect(assignEvent!.data.previousEntrypoint).toEqual({ importPath: entryFile, exportName: "process" });
  });

  it("fails when --entry is missing", async () => {
    const { runDir } = await createBareRun();

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("--entry is required"));
  });

  it("fails when run directory does not exist", async () => {
    const entryFile = await writeEntrypoint("processes/missing.mjs", `export async function handler() {}\n`);
    const fakeRunDir = path.join(runsRoot, "nonexistent-run-id");

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      fakeRunDir,
      "--entry",
      `${entryFile}#handler`,
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(1);
  });

  it("fails when entrypoint file does not exist", async () => {
    const { runDir } = await createBareRun();

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      "/nonexistent/path.mjs#handler",
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(1);
  });

  it("preserves --process-id override propagation", async () => {
    const { runDir } = await createBareRun();
    const entryFile = await writeEntrypoint("processes/pid-test.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${entryFile}#handler`,
      "--process-id",
      "custom/my-process-v2",
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(0);
    const metadata = await readRunMetadata(runDir);
    expect(metadata.processId).toBe("custom/my-process-v2");
  });

  it("falls back to existing processId when --process-id is not provided", async () => {
    const { runDir } = await createBareRun();
    const entryFile = await writeEntrypoint("processes/fallback.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${entryFile}#handler`,
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(0);
    const metadata = await readRunMetadata(runDir);
    expect(metadata.processId).toBe("placeholder");
  });

  it("propagates --process-revision to metadata", async () => {
    const { runDir } = await createBareRun();
    const entryFile = await writeEntrypoint("processes/rev.mjs", `export async function handler() {}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      runDir,
      "--entry",
      `${entryFile}#handler`,
      "--process-revision",
      "v2.1.0",
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(0);
    const metadata = await readRunMetadata(runDir);
    expect(metadata.processRevision).toBe("v2.1.0");
  });

  it("run:iterate rejects bare run with helpful error", async () => {
    const { runDir } = await createBareRun();

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:iterate",
      runDir,
      "--runs-dir",
      runsRoot,
      "--json",
    ]);

    expect(exitCode).toBe(1);
    const allOutput = [...logSpy.mock.calls, ...errorSpy.mock.calls].map((c) => String(c[0])).join("\n");
    expect(allOutput).toContain("no process assigned");
  });

  it("fails when <runDir> positional is missing", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:assign-process",
      "--entry",
      "some/path.mjs#handler",
      "--runs-dir",
      runsRoot,
    ]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("requires a <runDir>"));
  });
});
