import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "node:fs";
import { createBabysitterCli } from "../main";
import { readRunMetadata } from "../../storage/runFiles";
import { DEFAULT_LAYOUT_VERSION, getStateFile } from "../../storage/paths";
import { appendEvent, loadJournal } from "../../storage/journal";
import { createRunDir } from "../../storage/createRunDir";
import { createStateCacheSnapshot, writeStateCache } from "../../runtime/replay/stateCache";
import * as orchestrateIterationModule from "../../runtime/orchestrateIteration";
import * as nodeTaskRunnerModule from "../nodeTaskRunner";
import * as runFilesModule from "../../storage/runFiles";

const realReadRunMetadata = readRunMetadata;

describe("babysitter run:create CLI", () => {
  let runsRoot: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-create-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(runsRoot, { recursive: true, force: true });
  });

  it("creates a run on disk and records metadata plus RUN_CREATED event", async () => {
    const entryFile = await writeEntrypoint("processes/pipeline.mjs", `export async function handler() {\n  return "ok";\n}\n`);
    const inputsPath = path.join(runsRoot, "inputs.json");
    await fs.writeFile(inputsPath, JSON.stringify({ branch: "main", sha: "abc123" }));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/pipeline",
      "--entry",
      `${entryFile}#handler`,
      "--inputs",
      inputsPath,
      "--process-revision",
      "rev-42",
      "--request",
      "deploy/req-7",
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[run:create] runId="));

    const runDir = await expectSingleRunDir();
    const metadata = await readRunMetadata(runDir);
    expect(metadata.processId).toBe("ci/pipeline");
    expect(metadata.request).toBe("deploy/req-7");
    expect(metadata.processRevision).toBe("rev-42");
    expect(metadata.layoutVersion).toBe(DEFAULT_LAYOUT_VERSION);
    expect(metadata.entrypoint).toEqual({
      importPath: toPosixRelative(runDir, entryFile),
      exportName: "handler",
    });

    const journal = await loadJournal(runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");
    expect(journal[0].data).toMatchObject({
      entrypoint: metadata.entrypoint,
      inputsRef: "inputs.json",
      processRevision: "rev-42",
    });
  });

  it("supports machine-readable --json output", async () => {
    const entryFile = await writeEntrypoint("processes/build.mjs", `export async function process() { return true; }\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/build",
      "--entry",
      `${entryFile}#process`,
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    const runDir = await expectSingleRunDir();
    const metadata = await readRunMetadata(runDir);

    expect(payload).toMatchObject({
      runId: metadata.runId,
      runDir,
      entry: `${metadata.entrypoint.importPath}#${metadata.entrypoint.exportName}`,
    });
  });

  it("describes dry-run plans without creating run directories", async () => {
    const entryFile = await writeEntrypoint("processes/dry-run.mjs", `export const handler = () => "dry";\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/dry",
      "--entry",
      `${entryFile}#handler`,
      "--dry-run",
      "--request",
      "deploy/req-dry",
    ]);

    expect(exitCode).toBe(0);
    const line = String(logSpy.mock.calls.at(-1)?.[0] ?? "");
    expect(line).toContain("[run:create] dry-run");
    expect(line).toContain(`runsDir=${runsRoot}`);
    expect(line).toContain("processId=ci/dry");
    expect(await listRunDirs()).toHaveLength(0);
  });

  it("emits JSON summaries for run:create --dry-run and leaves disk untouched", async () => {
    const entryFile = await writeEntrypoint("processes/dry-json.mjs", `export const handler = () => "dry-json";\n`);
    const inputsPath = path.join(runsRoot, "inputs.json");
    await fs.writeFile(inputsPath, JSON.stringify({ branch: "main" }));

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/json",
      "--entry",
      `${entryFile}#handler`,
      "--run-id",
      "manual-run",
      "--process-revision",
      "rev-json",
      "--request",
      "deploy/json",
      "--inputs",
      inputsPath,
      "--dry-run",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload).toEqual({
      dryRun: true,
      runsDir: runsRoot,
      processId: "ci/json",
      entry: `${entryFile}#handler`,
      runId: "manual-run",
      request: "deploy/json",
      processRevision: "rev-json",
      inputsPath,
    });
    expect(await listRunDirs()).toHaveLength(0);
  });

  it("fails fast when required flags are missing", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run(["run:create", "--entry", "./process.mjs"]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith("--process-id is required for run:create");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("babysitter run:create"));
  });

  async function writeEntrypoint(relativePath: string, contents: string) {
    const absolutePath = path.join(runsRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, contents, "utf8");
    return absolutePath;
  }

  async function expectSingleRunDir(): Promise<string> {
    const entries = await fs.readdir(runsRoot, { withFileTypes: true });
    const runDir = entries.find((entry) => entry.isDirectory() && /^[0-9A-Za-z]{26}$/.test(entry.name));
    if (!runDir) {
      throw new Error(`Expected run directory inside ${runsRoot}, found: ${entries.map((entry) => entry.name).join(", ")}`);
    }
    return path.join(runsRoot, runDir.name);
  }

  async function listRunDirs(): Promise<string[]> {
    const entries = await fs.readdir(runsRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && /^[0-9A-Za-z]{26}$/.test(entry.name))
      .map((entry) => path.join(runsRoot, entry.name));
  }

  function toPosixRelative(fromDir: string, target: string): string {
    const relative = path.relative(fromDir, target).replace(/\\/g, "/");
    return path.posix.normalize(relative);
  }

  function readLastJsonLine(spy: ReturnType<typeof vi.spyOn>) {
    const raw = String(spy.mock.calls.at(-1)?.[0] ?? "{}");
    return JSON.parse(raw);
  }
});

describe("run lifecycle inspection commands", () => {
  let runsRoot: string;
  let cli: ReturnType<typeof createBabysitterCli>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-inspect-"));
    cli = createBabysitterCli();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(runsRoot, { recursive: true, force: true });
  });

  describe("run:status", () => {
    it("reports state, last event, and pending counts", async () => {
      const runDir = await createRunWithPendingEffects();

      const exitCode = await cli.run(["run:status", runDir]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:status]"));
      expect(line).toContain("state=waiting");
      expect(line).toContain("last=EFFECT_REQUESTED#000003");
      expect(line).toContain("pending[total]=2");
      expect(line).toContain("pending[breakpoint]=1");
      expect(line).toContain("pending[node]=1");
    });

    it("emits JSON payload with state and last event details", async () => {
      const runDir = await createRunWithPendingEffects();

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.state).toBe("waiting");
      expect(payload.pendingByKind).toEqual({ breakpoint: 1, node: 1 });
      expect(payload.lastEvent).toMatchObject({ type: "EFFECT_REQUESTED", seq: 3 });
      expect(payload.lastEvent.path).toMatch(/^journal\//);
    });

    it("includes iteration metadata in JSON output", async () => {
      const runDir = await createRunWithPendingEffects();
      await seedStateCache(runDir, { stateVersion: 5 });

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.metadata).toMatchObject({
        stateVersion: 5,
        pendingEffectsByKind: { breakpoint: 1, node: 1 },
      });
    });

    it("renders state metadata in human-readable output", async () => {
      const runDir = await createRunWithPendingEffects();
      await seedStateCache(runDir, { stateVersion: 7 });

      const exitCode = await cli.run(["run:status", runDir]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:status]"));
      expect(line).toContain("stateVersion=7");
      expect(line).toContain("pending[breakpoint]=1");
      expect(line).toContain("pending[node]=1");
    });

    it("surfaces rebuild metadata after run:rebuild-state", async () => {
      const runDir = await createRunWithPendingEffects();

      await cli.run(["run:rebuild-state", runDir]);
      logSpy.mockClear();

      const exitCode = await cli.run(["run:status", runDir]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:status]"));
      expect(line).toContain("stateVersion=");
      expect(line).toContain("journalHead=#");
      expect(line).toContain("journalHead.ulid=");
      expect(line).toContain("stateRebuilt=true(cli_manual)");
    });

    it("fails clearly when the run directory is missing", async () => {
      const missingDir = path.join(runsRoot, "missing-run");

      const exitCode = await cli.run(["run:status", missingDir]);

      expect(exitCode).toBe(1);
      expect(hasLineContaining(errorSpy, "[run:status] unable to read run metadata")).toBe(true);
    });

    it("reports created state when no work has been requested yet", async () => {
      const runDir = await createRunSkeleton("run-empty");

      const exitCode = await cli.run(["run:status", runDir]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:status]"));
      expect(line).toContain("state=created");
      expect(line).toContain("pending[total]=0");
    });

    it("honors terminal RUN_* events even if pending work remains", async () => {
      const runDir = await createRunWithHistory();

      const exitCode = await cli.run(["run:status", runDir]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:status]"));
      expect(line).toContain("state=failed");
      expect(line).toContain("pending[breakpoint]=1");
      expect(line).toContain("last=RUN_FAILED#000005");
    });
  });

  describe("run:events", () => {
    it("lists events with filtering, reverse ordering, and limits", async () => {
      const runDir = await createRunWithHistory();

      const exitCode = await cli.run([
        "run:events",
        runDir,
        "--filter-type",
        "effect_requested",
        "--limit",
        "1",
        "--reverse",
      ]);

      expect(exitCode).toBe(0);
      const header = findSingleLine(logSpy, (entry) => entry.startsWith("[run:events]"));
      expect(header).toContain("total=5");
      expect(header).toContain("matching=2");
      expect(header).toContain("showing=1");
      expect(header).toContain("filter=EFFECT_REQUESTED");
      expect(header).toContain("limit=1");
      expect(header).toContain("order=desc");
      const entries = collectPrefixed(logSpy, "- ");
      expect(entries).toHaveLength(1);
      expect(entries[0]).toContain("#000003");
      expect(entries[0]).toContain("EFFECT_REQUESTED");
    });

    it("emits JSON event arrays", async () => {
      const runDir = await createRunWithHistory();

      const exitCode = await cli.run(["run:events", runDir, "--limit", "2", "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(Array.isArray(payload.events)).toBe(true);
      expect(payload.events).toHaveLength(2);
      expect(payload.events[0]).toMatchObject({ seq: 1, type: "RUN_CREATED" });
      expect(payload.events[1]).toMatchObject({ seq: 2, type: "EFFECT_REQUESTED" });
      expect(payload.metadata).toBeNull();
    });

    it("fails fast when --limit is invalid", async () => {
      const runDir = await createRunWithHistory();

      const exitCode = await cli.run(["run:events", runDir, "--limit", "0"]);

      expect(exitCode).toBe(1);
      expect(hasLineContaining(errorSpy, "--limit must be a positive integer")).toBe(true);
    });

    it("fails clearly when the run directory cannot be read", async () => {
      const missingDir = path.join(runsRoot, "missing-events");

      const exitCode = await cli.run(["run:events", missingDir]);

      expect(exitCode).toBe(1);
      expect(hasLineContaining(errorSpy, "[run:events] unable to read run metadata")).toBe(true);
    });

    it("surfaces iteration metadata in JSON output", async () => {
      const runDir = await createRunSkeleton("run-iteration-events");
      const iterationMetadata = {
        stateVersion: 4,
        pendingEffectsByKind: { node: 1 },
        stateRebuilt: true,
        stateRebuildReason: "runtime_refresh",
      };
      await appendEvent({
        runDir,
        eventType: "RUN_ITERATION",
        event: {
          iteration: {
            status: "waiting",
            nextActions: [],
            metadata: iterationMetadata,
          },
        },
      });

      const exitCode = await cli.run(["run:events", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(Array.isArray(payload.events)).toBe(true);
      const lastEvent = payload.events.at(-1);
      expect(lastEvent.data.iteration.metadata).toEqual(iterationMetadata);
    });

    it("keeps pagination summaries while appending metadata after run:rebuild-state", async () => {
      const runDir = await createRunWithHistory();
      await cli.run(["run:rebuild-state", runDir]);
      logSpy.mockClear();

      const exitCode = await cli.run([
        "run:events",
        runDir,
        "--filter-type",
        "effect_requested",
        "--limit",
        "1",
        "--reverse",
      ]);

      expect(exitCode).toBe(0);
      const header = findSingleLine(logSpy, (entry) => entry.startsWith("[run:events]"));
      expect(header).toContain("total=5");
      expect(header).toContain("matching=2");
      expect(header).toContain("showing=1");
      expect(header).toContain("filter=EFFECT_REQUESTED");
      expect(header).toContain("limit=1");
      expect(header).toContain("order=desc");
      expect(header).toContain("stateVersion=");
      expect(header).toContain("journalHead=#");
      expect(header).toContain("stateRebuilt=true(cli_manual)");
    });

    it("exposes metadata in JSON mode when a rebuilt cache exists", async () => {
      const runDir = await createRunWithHistory();
      await cli.run(["run:rebuild-state", runDir]);
      logSpy.mockClear();

      const exitCode = await cli.run(["run:events", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.metadata).toMatchObject({
        stateRebuilt: true,
        stateRebuildReason: "cli_manual",
      });
      expect(typeof payload.metadata.stateVersion).toBe("number");
      expect(payload.metadata.journalHead).toEqual(
        expect.objectContaining({
          seq: expect.any(Number),
          ulid: expect.any(String),
        })
      );
    });
  });

  describe("run:rebuild-state", () => {
    it("rebuilds the cache and prints metadata summary", async () => {
      const runDir = await createRunWithPendingEffects();

      const exitCode = await cli.run(["run:rebuild-state", runDir]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:rebuild-state]"));
      expect(line).toContain(`runDir=${runDir}`);
      expect(line).toContain("pending[total]=2");
      expect(line).toContain("pending[breakpoint]=1");
      expect(line).toContain("pending[node]=1");
    });

    it("supports machine-readable metadata", async () => {
      const runDir = await createRunWithPendingEffects();

      const exitCode = await cli.run(["run:rebuild-state", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload).toMatchObject({
        runDir,
        metadata: expect.objectContaining({
          stateRebuilt: true,
          stateRebuildReason: "cli_manual",
          pendingEffectsByKind: { breakpoint: 1, node: 1 },
        }),
      });
      expect(typeof payload.metadata.stateVersion).toBe("number");
    });

    it("describes dry-run plans without touching the state cache", async () => {
      const runDir = await createRunWithPendingEffects();

      const exitCode = await cli.run(["run:rebuild-state", runDir, "--dry-run"]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:rebuild-state] dry-run"));
      expect(line).toContain(`runDir=${runDir}`);
      expect(line).toContain("plan=rebuild_state_cache");
      expect(line).toContain("reason=cli_manual");
      await expectStateCacheMissing(runDir);
    });

    it("emits JSON summaries for run:rebuild-state --dry-run", async () => {
      const runDir = await createRunWithPendingEffects();

      const exitCode = await cli.run(["run:rebuild-state", runDir, "--dry-run", "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload).toEqual({
        dryRun: true,
        runDir,
        plan: "rebuild_state_cache",
        reason: "cli_manual",
      });
      await expectStateCacheMissing(runDir);
    });
  });

  describe("run:continue", () => {
    let orchestrateSpy: ReturnType<typeof vi.spyOn>;
    let runNodeTaskSpy: ReturnType<typeof vi.spyOn>;
    let readMetadataSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      orchestrateSpy = vi.spyOn(orchestrateIterationModule, "orchestrateIteration");
      runNodeTaskSpy = vi.spyOn(nodeTaskRunnerModule, "runNodeTaskFromCli").mockResolvedValue({} as any);
      readMetadataSpy = vi.spyOn(runFilesModule, "readRunMetadata");
    });

    afterEach(() => {
      orchestrateSpy.mockRestore();
      runNodeTaskSpy.mockRestore();
      readMetadataSpy.mockRestore();
    });

    async function stubRunMetadata(runDir: string) {
      const metadata = await realReadRunMetadata(runDir);
      readMetadataSpy.mockResolvedValue(metadata);
    }

    it("auto-runs node tasks until the run completes", async () => {
      const runDir = await createRunSkeleton("run-auto-success");
      await stubRunMetadata(runDir);
      const taskDef = { kind: "node", node: { entry: "./script.js" } };
      orchestrateSpy
        .mockResolvedValueOnce({
          status: "waiting",
          nextActions: [
            {
              effectId: "ef-auto",
              invocationKey: "invoke-ef-auto",
              kind: "node",
              label: "auto node",
              taskDef,
            },
          ],
          metadata: { pendingEffectsByKind: { node: 1 }, stateVersion: 1 },
        })
        .mockResolvedValueOnce({
          status: "completed",
          output: { ok: true },
          metadata: { stateVersion: 2 },
        });

      const exitCode = await cli.run(["run:continue", runDir, "--auto-node-tasks", "--json"]);

      expect(exitCode).toBe(0);
      expect(orchestrateSpy).toHaveBeenCalledTimes(2);
      expect(runNodeTaskSpy).toHaveBeenCalledTimes(1);
      expect(runNodeTaskSpy).toHaveBeenCalledWith({
        runDir,
        effectId: "ef-auto",
        task: taskDef,
        invocationKey: "invoke-ef-auto",
        dryRun: false,
      });
      const payload = readLastJson(logSpy);
      expect(payload.status).toBe("completed");
      expect(payload.autoRun.executed).toHaveLength(1);
      expect(payload.autoRun.executed[0]).toMatchObject({ effectId: "ef-auto", kind: "node" });
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[auto-run] ef-auto [node]"));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[run:continue] status=completed"));
    });

    it("describes dry-run auto-node plans without invoking runners", async () => {
      const runDir = await createRunSkeleton("run-auto-dry");
      await stubRunMetadata(runDir);
      const taskDef = { kind: "node", node: { entry: "./plan.js" } };
      orchestrateSpy.mockResolvedValueOnce({
        status: "waiting",
        nextActions: [
          {
            effectId: "ef-plan",
            invocationKey: "invoke-plan",
            kind: "node",
            label: "plan-only",
            taskDef,
          },
        ],
        metadata: { pendingEffectsByKind: { node: 1 }, stateVersion: 5 },
      });

      const exitCode = await cli.run(["run:continue", runDir, "--auto-node-tasks", "--dry-run", "--json"]);

      expect(exitCode).toBe(0);
      expect(runNodeTaskSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("dry-run auto-node tasks count=1"));
      const payload = readLastJson(logSpy);
      expect(payload.status).toBe("waiting");
      expect(payload.autoRun.executed).toHaveLength(0);
      expect(payload.autoRun.pending).toHaveLength(1);
      expect(payload.pending).toHaveLength(1);
      expect(payload.metadata).toMatchObject({
        stateVersion: 5,
        pendingEffectsByKind: { node: 1 },
      });
    });

    it("returns pending summaries with inferred metadata and auto-run plans in JSON mode", async () => {
      const runDir = await createRunSkeleton("run-wait-json");
      await stubRunMetadata(runDir);
      orchestrateSpy.mockResolvedValueOnce({
        status: "waiting",
        nextActions: [
          {
            effectId: "ef-node",
            invocationKey: "invoke-node",
            kind: "node",
            label: "auto me",
            taskDef: { kind: "node", node: { entry: "./auto.js" } },
          },
          {
            effectId: "ef-break",
            invocationKey: "invoke-break",
            kind: "breakpoint",
            label: "manual check",
            taskDef: { kind: "breakpoint", breakpoint: { confirmationRequired: true } },
          },
        ],
      });

      const exitCode = await cli.run(["run:continue", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.status).toBe("waiting");
      expect(payload.pending).toEqual([
        { effectId: "ef-node", kind: "node", label: "auto me" },
        { effectId: "ef-break", kind: "breakpoint", label: "manual check" },
      ]);
      expect(payload.autoRun.executed).toEqual([]);
      expect(payload.autoRun.pending).toEqual([{ effectId: "ef-node", kind: "node", label: "auto me" }]);
      expect(payload.metadata).toEqual({
        pendingEffectsByKind: { breakpoint: 1, node: 1 },
      });
    });

    it("injects rebuilt state metadata into waiting payloads when the runtime omits it", async () => {
      const runDir = await createRunSkeleton("run-wait-cache");
      await cli.run(["run:rebuild-state", runDir]);
      await stubRunMetadata(runDir);
      logSpy.mockClear();
      errorSpy.mockClear();
      orchestrateSpy.mockResolvedValueOnce({
        status: "waiting",
        nextActions: [
          {
            effectId: "ef-node",
            invocationKey: "invoke-node",
            kind: "node",
            label: "auto me",
            taskDef: { kind: "node", node: { entry: "./auto.js" } },
          },
          {
            effectId: "ef-break",
            invocationKey: "invoke-break",
            kind: "breakpoint",
            label: "manual check",
            taskDef: { kind: "breakpoint", breakpoint: { confirmationRequired: true } },
          },
        ],
      });

      const exitCode = await cli.run(["run:continue", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.metadata).toMatchObject({
        stateRebuilt: true,
        stateRebuildReason: "cli_manual",
      });
      expect(payload.metadata.pendingEffectsByKind).toEqual({ breakpoint: 1, node: 1 });
      expect(payload.metadata.stateVersion).toBeGreaterThanOrEqual(1);
      const statusLine = findSingleLine(errorSpy, (line) => line.startsWith("[run:continue] status=waiting"));
      expect(statusLine).toContain("journalHead=#");
    });
    it("propagates failure metadata and errors", async () => {
      const runDir = await createRunSkeleton("run-failure");
      await stubRunMetadata(runDir);
      orchestrateSpy.mockResolvedValueOnce({
        status: "failed",
        error: { message: "boom" },
        metadata: {
          stateVersion: 3,
          stateRebuilt: true,
          stateRebuildReason: "runtime_refresh",
          pendingEffectsByKind: { node: 2 },
        },
      });

      const exitCode = await cli.run(["run:continue", runDir, "--json"]);

      expect(exitCode).toBe(1);
      const payload = readLastJson(logSpy);
      expect(payload).toMatchObject({
        status: "failed",
        error: { message: "boom" },
        metadata: {
          stateVersion: 3,
          stateRebuilt: true,
          stateRebuildReason: "runtime_refresh",
          pendingEffectsByKind: { node: 2 },
        },
      });
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[run:continue] status=failed"));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("pending[node]=2"));
    });

    it("logs scheduler sleep hints when pending actions provide sleep targets", async () => {
      const runDir = await createRunSkeleton("run-sleep");
      await stubRunMetadata(runDir);
      const sleepUntilEpochMs = Date.now() + 1_000;
      orchestrateSpy.mockResolvedValueOnce({
        status: "waiting",
        nextActions: [
          {
            effectId: "ef-sleep",
            invocationKey: "invoke-sleep",
            kind: "node",
            label: "sleepy",
            taskDef: { kind: "node", node: { entry: "./sleep.js" } },
            schedulerHints: { sleepUntilEpochMs, pendingCount: 4 },
          },
        ],
      });

      const exitCode = await cli.run(["run:continue", runDir]);

      expect(exitCode).toBe(0);
      const iso = new Date(sleepUntilEpochMs).toISOString();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(`[run:continue] sleep-until=${iso} effect=ef-sleep`));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("pendingCount=4"));
    });
  });

  async function createRunWithPendingEffects() {
    const runDir = await createRunSkeleton("run-pending");
    await appendRequestedEffect(runDir, "ef-node", "node", "build");
    await appendRequestedEffect(runDir, "ef-break", "breakpoint", "manual");
    return runDir;
  }

  async function createRunWithHistory() {
    const runDir = await createRunSkeleton("run-history");
    await appendRequestedEffect(runDir, "ef-node", "node", "build");
    await appendRequestedEffect(runDir, "ef-break", "breakpoint", "manual");
    await appendResolvedEffect(runDir, "ef-node");
    await appendEvent({
      runDir,
      eventType: "RUN_FAILED",
      event: { reason: "boom" },
    });
    return runDir;
  }

  async function seedStateCache(
    runDir: string,
    options: { stateVersion?: number; pendingEffectsByKind?: Record<string, number> } = {}
  ) {
    await writeStateCache(
      runDir,
      createStateCacheSnapshot({
        stateVersion: options.stateVersion,
        pendingEffectsByKind: options.pendingEffectsByKind,
        journalHead: {
          seq: options.stateVersion ?? 0,
          ulid: "01HSTATECACHE0000000000000",
        },
      })
    );
  }

  async function createRunSkeleton(runId: string) {
    const { runDir } = await createRunDir({
      runsRoot,
      runId,
      request: "cli-test",
      processPath: "./process.js",
    });
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId },
    });
    return runDir;
  }

  async function appendRequestedEffect(runDir: string, effectId: string, kind: string, label: string) {
    const refs = await writeTaskFiles(runDir, effectId, kind);
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey: `${effectId}:inv`,
        stepId: `step-${effectId}`,
        taskId: `${kind}-task`,
        kind,
        label,
        taskDefRef: refs.taskDefRef,
        inputsRef: refs.inputsRef,
      },
    });
  }

  async function appendResolvedEffect(runDir: string, effectId: string) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId,
        status: "ok",
        resultRef: `tasks/${effectId}/result.json`,
        stdoutRef: `tasks/${effectId}/stdout.log`,
        stderrRef: `tasks/${effectId}/stderr.log`,
      },
    });
  }

  async function writeTaskFiles(runDir: string, effectId: string, kind: string) {
    const taskDir = path.join(runDir, "tasks", effectId);
    await fs.mkdir(taskDir, { recursive: true });
    const taskDefPath = path.join(taskDir, "task.json");
    const inputsPath = path.join(taskDir, "inputs.json");
    await fs.writeFile(taskDefPath, JSON.stringify({ kind, schemaVersion: "test" }, null, 2));
    await fs.writeFile(inputsPath, JSON.stringify({ effectId }, null, 2));
    return {
      taskDefRef: `tasks/${effectId}/task.json`,
      inputsRef: `tasks/${effectId}/inputs.json`,
    };
  }

  function readLastJson(spy: ReturnType<typeof vi.spyOn>) {
    const raw = linesFrom(spy).at(-1) ?? "{}";
    return JSON.parse(raw);
  }

  function linesFrom(spy: ReturnType<typeof vi.spyOn>) {
    return spy.mock.calls.map((call) => call.map((value) => String(value ?? "")).join(" "));
  }

  function findSingleLine(spy: ReturnType<typeof vi.spyOn>, predicate: (line: string) => boolean) {
    const line = linesFrom(spy).find(predicate);
    if (!line) {
      throw new Error(`Expected matching log line. Logs:\n${linesFrom(spy).join("\n")}`);
    }
    return line;
  }

  function collectPrefixed(spy: ReturnType<typeof vi.spyOn>, prefix: string) {
    return linesFrom(spy).filter((line) => line.trimStart().startsWith(prefix));
  }

  function hasLineContaining(spy: ReturnType<typeof vi.spyOn>, needle: string) {
    return linesFrom(spy).some((line) => line.includes(needle));
  }

  async function expectStateCacheMissing(runDir: string) {
    const stateFile = getStateFile(runDir);
    await fs
      .access(stateFile)
      .then(() => {
        throw new Error(`Expected ${stateFile} to be missing`);
      })
      .catch((error: NodeJS.ErrnoException) => {
        expect(error.code).toBe("ENOENT");
      });
  }
});
