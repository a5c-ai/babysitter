import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";
import { createBabysitterCli } from "../main";
import { readRunMetadata } from "../../storage/runFiles";
import { DEFAULT_LAYOUT_VERSION, getStateFile } from "../../storage/paths";
import { appendEvent, loadJournal } from "../../storage/journal";
import { createRunDir } from "../../storage/createRunDir";
import { createStateCacheSnapshot, writeStateCache } from "../../runtime/replay/stateCache";
import * as orchestrateIterationModule from "../../runtime/orchestrateIteration";
import * as runFilesModule from "../../storage/runFiles";
import { deriveCompletionProof } from "../completionProof";
import {
  __resetCacheForTests,
  __setAncestorResolverForTests,
  getSessionMarkerPath,
} from "../../utils/sessionMarker";
import { validateProcessEntrypoint } from "../main/runSupport";

const realReadRunMetadata = readRunMetadata;

describe("babysitter run:create CLI", () => {
  let runsRoot: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  const sessionEnvKeys = [
    "AGENT_SESSION_ID",
    "AGENT_SESSION_ID",
    "AGENT_ENABLE_SESSION_PID_MARKERS",
    "BABYSITTER_ENABLE_SESSION_PID_MARKERS",
    "BABYSITTER_GLOBAL_STATE_DIR",
    "AGENT_TRUST_ENV_SESSION",
    "BABYSITTER_TRUST_ENV_SESSION",
    "CLAUDE_ENV_FILE",
    "CODEX_THREAD_ID",
    "CODEX_SESSION_ID",
    "CODEX_PLUGIN_ROOT",
  ] as const;
  let savedSessionEnv: Record<(typeof sessionEnvKeys)[number], string | undefined>;

  beforeEach(async () => {
    runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-create-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    savedSessionEnv = {
      AGENT_SESSION_ID: process.env.AGENT_SESSION_ID,
      AGENT_TRUST_ENV_SESSION: process.env.AGENT_TRUST_ENV_SESSION,
      BABYSITTER_ENABLE_SESSION_PID_MARKERS: process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS,
      BABYSITTER_GLOBAL_STATE_DIR: process.env.BABYSITTER_GLOBAL_STATE_DIR,
      BABYSITTER_TRUST_ENV_SESSION: process.env.BABYSITTER_TRUST_ENV_SESSION,
      CLAUDE_ENV_FILE: process.env.CLAUDE_ENV_FILE,
      CODEX_THREAD_ID: process.env.CODEX_THREAD_ID,
      CODEX_SESSION_ID: process.env.CODEX_SESSION_ID,
      CODEX_PLUGIN_ROOT: process.env.CODEX_PLUGIN_ROOT,
    };
    for (const key of sessionEnvKeys) {
      delete process.env[key];
    }
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    for (const key of sessionEnvKeys) {
      if (savedSessionEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedSessionEnv[key];
      }
    }
    __resetCacheForTests();
    __setAncestorResolverForTests(undefined);
    vi.restoreAllMocks();
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

  it("binds claude-code runs to the current marker-backed session instead of leaked AGENT_SESSION_ID", async () => {
    const entryFile = await writeEntrypoint("processes/claude-session.mjs", `export async function process() { return true; }\n`);
    const globalStateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-create-claude-state-"));
    const currentSessionId = "current-claude-session";
    const leakedSessionId = "leaked-background-shell-session";

    process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateRoot;
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    process.env.AGENT_SESSION_ID = leakedSessionId;
    __resetCacheForTests();
    __setAncestorResolverForTests(() => ({ pid: process.pid }));

    const markerPath = getSessionMarkerPath("claude-code", process.pid);
    await fs.mkdir(path.dirname(markerPath), { recursive: true });
    await fs.writeFile(markerPath, `${currentSessionId}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/claude-session",
      "--entry",
      `${entryFile}#process`,
      "--harness",
      "claude-code",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload.session).toMatchObject({
      harness: "claude-code",
      sessionId: currentSessionId,
      resolvedFrom: "pid-marker",
      ancestorPid: process.pid,
      ancestorAlive: true,
    });
    expect(String(payload.session.stateFile).replace(/\\/g, "/")).toContain(`/state/${currentSessionId}.md`);
    await expect(
      fs.access(path.join(globalStateRoot, "state", `${currentSessionId}.md`)),
    ).resolves.toBeUndefined();

    await fs.rm(globalStateRoot, { recursive: true, force: true });
  });

  it("keeps claude-code env-first binding when trust-env is explicitly set", async () => {
    const entryFile = await writeEntrypoint("processes/claude-trust-env.mjs", `export async function process() { return true; }\n`);
    const globalStateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-create-claude-trust-"));
    const currentSessionId = "current-claude-session";
    const trustedSessionId = "trusted-ci-session";

    process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateRoot;
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    process.env.AGENT_SESSION_ID = trustedSessionId;
    process.env.AGENT_TRUST_ENV_SESSION = "1";
    __resetCacheForTests();
    __setAncestorResolverForTests(() => ({ pid: process.pid }));

    const markerPath = getSessionMarkerPath("claude-code", process.pid);
    await fs.mkdir(path.dirname(markerPath), { recursive: true });
    await fs.writeFile(markerPath, `${currentSessionId}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/claude-trust-env",
      "--entry",
      `${entryFile}#process`,
      "--harness",
      "claude-code",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload.session).toMatchObject({
      harness: "claude-code",
      sessionId: trustedSessionId,
      resolvedFrom: "env-var",
    });
    expect(String(payload.session.stateFile).replace(/\\/g, "/")).toContain(`/state/${trustedSessionId}.md`);
    await expect(
      fs.access(path.join(globalStateRoot, "state", `${trustedSessionId}.md`)),
    ).resolves.toBeUndefined();

    await fs.rm(globalStateRoot, { recursive: true, force: true });
  });

  it("seeds the first iteration for claude-code run:create when session binding succeeds", async () => {
    const entryFile = await writeEntrypoint(
      "processes/claude-first-iteration.mjs",
      `export async function process() { return true; }\n`,
    );
    const globalStateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-create-claude-first-"));
    const currentSessionId = "current-claude-first-iteration";
    const firstEffectId = "ef-issue-170-first";

    const orchestrateSpy = vi.spyOn(orchestrateIterationModule, "orchestrateIteration").mockImplementation(
      async (options) => {
        await appendEvent({
          runDir: options.runDir,
          eventType: "EFFECT_REQUESTED",
          event: {
            effectId: firstEffectId,
            invocationKey: "issue-170:first-effect",
            stepId: "first-effect",
            taskId: "issue-170-first-effect",
            kind: "agent",
            label: "agent",
          },
        });
        return {
          status: "waiting",
          nextActions: [
            {
              effectId: firstEffectId,
              invocationKey: "issue-170:first-effect",
              kind: "agent",
              label: "agent",
              taskDef: { kind: "agent", title: "first effect" },
            },
          ],
        };
      },
    );

    process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateRoot;
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    __resetCacheForTests();
    __setAncestorResolverForTests(() => ({ pid: process.pid }));

    const markerPath = getSessionMarkerPath("claude-code", process.pid);
    await fs.mkdir(path.dirname(markerPath), { recursive: true });
    await fs.writeFile(markerPath, `${currentSessionId}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/claude-first-iteration",
      "--entry",
      `${entryFile}#process`,
      "--harness",
      "claude-code",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload.session).toMatchObject({
      harness: "claude-code",
      sessionId: currentSessionId,
    });
    expect(payload.initialIteration).toMatchObject({
      iteration: 1,
      status: "waiting",
      reason: "agent-pending",
    });
    expect(orchestrateSpy).toHaveBeenCalledTimes(1);

    const runDir = await expectSingleRunDir();
    const journal = await loadJournal(runDir);
    expect(journal.map((event) => event.type)).toContain("EFFECT_REQUESTED");
    expect(journal.filter((event) => event.type === "EFFECT_REQUESTED")).toHaveLength(1);

    await fs.rm(globalStateRoot, { recursive: true, force: true });
    orchestrateSpy.mockRestore();
  });

  it("does not seed the first iteration for claude-code bare runs", async () => {
    const globalStateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-create-claude-bare-"));
    const currentSessionId = "current-claude-bare-run";

    process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateRoot;
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    __resetCacheForTests();
    __setAncestorResolverForTests(() => ({ pid: process.pid }));

    const markerPath = getSessionMarkerPath("claude-code", process.pid);
    await fs.mkdir(path.dirname(markerPath), { recursive: true });
    await fs.writeFile(markerPath, `${currentSessionId}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--harness",
      "claude-code",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload.initialIteration).toBeUndefined();

    const runDir = await expectSingleRunDir();
    const journal = await loadJournal(runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");

    await fs.rm(globalStateRoot, { recursive: true, force: true });
  });

  it("does not seed the first iteration when claude-code session binding is unresolved", async () => {
    const entryFile = await writeEntrypoint("processes/claude-no-session.mjs", `export async function process() { return true; }\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/claude-no-session",
      "--entry",
      `${entryFile}#process`,
      "--harness",
      "claude-code",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const payload = readLastJsonLine(logSpy);
    expect(payload.initialIteration).toBeUndefined();
    expect(payload.session).toMatchObject({
      harness: "claude-code",
      sessionId: "",
    });
    expect(payload.session.error).toContain("session");

    const runDir = await expectSingleRunDir();
    const journal = await loadJournal(runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");
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

  it("accepts --prompt flag and persists prompt in metadata and journal", async () => {
    const entryFile = await writeEntrypoint("processes/prompted.mjs", `export async function process() {\n  return "prompted";\n}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/prompted",
      "--entry",
      `${entryFile}#process`,
      "--prompt",
      "Build a REST API with user authentication",
    ]);

    expect(exitCode).toBe(0);

    const runDir = await expectSingleRunDir();
    const metadata = await readRunMetadata(runDir);
    expect(metadata.prompt).toBe("Build a REST API with user authentication");
    expect(metadata.processId).toBe("ci/prompted");

    const journal = await loadJournal(runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");
    expect(journal[0].data.prompt).toBe("Build a REST API with user authentication");
  });

  it("validates entry modules that import the SDK by preparing a local fallback dependency", async () => {
    const entryDir = path.join(runsRoot, "external-process");
    const entryFile = path.join(entryDir, "process.mjs");
    const fallbackSdkDir = await writeFakeSdkPackage(path.join(runsRoot, "fallback-sdk"), "fallback");
    await fs.mkdir(entryDir, { recursive: true });
    await fs.writeFile(
      entryFile,
      [
        'import { __marker } from "@a5c-ai/babysitter-sdk";',
        "export const sdkMarker = __marker;",
        'export async function process() { return "ok"; }',
        "",
      ].join("\n"),
      "utf8",
    );

    await expect(
      validateProcessEntrypoint(entryFile, "process", {
        resolveSdkPackageDir: () => fallbackSdkDir,
      }),
    ).resolves.toBeUndefined();

    await expect(fs.realpath(path.join(entryDir, "node_modules", "@a5c-ai", "babysitter-sdk"))).resolves.toBe(
      fallbackSdkDir,
    );

    const loaded = await import(`${pathToFileURL(entryFile).href}?marker=fallback`);
    expect(loaded.sdkMarker).toBe("fallback");
  });

  it("prefers an existing project-local SDK dependency over the fallback link", async () => {
    const projectRoot = path.join(runsRoot, "project-local");
    const entryDir = path.join(projectRoot, "processes");
    const entryFile = path.join(entryDir, "process.mjs");
    const localSdkDir = await writeFakeSdkPackage(
      path.join(projectRoot, "node_modules", "@a5c-ai", "babysitter-sdk"),
      "local",
      true,
    );
    const fallbackSdkDir = await writeFakeSdkPackage(path.join(runsRoot, "fallback-sdk-local"), "fallback");
    await fs.mkdir(entryDir, { recursive: true });
    await fs.writeFile(
      entryFile,
      [
        'import { __marker } from "@a5c-ai/babysitter-sdk";',
        "export const sdkMarker = __marker;",
        'export async function process() { return "ok"; }',
        "",
      ].join("\n"),
      "utf8",
    );

    await expect(
      validateProcessEntrypoint(entryFile, "process", {
        resolveSdkPackageDir: () => fallbackSdkDir,
      }),
    ).resolves.toBeUndefined();

    await expect(
      fs.access(path.join(entryDir, "node_modules", "@a5c-ai", "babysitter-sdk")),
    ).rejects.toMatchObject({ code: "ENOENT" });

    const loaded = await import(`${pathToFileURL(entryFile).href}?marker=local`);
    expect(loaded.sdkMarker).toBe("local");
    await expect(fs.realpath(localSdkDir)).resolves.toBe(localSdkDir);
  });

  it("persists --harness in run.json and stamps it on journal events", async () => {
    const entryFile = await writeEntrypoint("processes/harnessed.mjs", `export async function process() {\n  return "harnessed";\n}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/harnessed",
      "--entry",
      `${entryFile}#process`,
      "--harness",
      "codex",
    ]);

    expect(exitCode).toBe(0);

    const runDir = await expectSingleRunDir();
    const metadata = await readRunMetadata(runDir);
    expect(metadata.harness).toBe("codex");

    const journal = await loadJournal(runDir);
    expect(journal[0].type).toBe("RUN_CREATED");
    expect(journal[0].data.harness).toBe("codex");
  });

  it("omits prompt from metadata and journal when --prompt is not provided", async () => {
    const entryFile = await writeEntrypoint("processes/noprompt.mjs", `export async function process() {\n  return "no-prompt";\n}\n`);

    const cli = createBabysitterCli();
    const exitCode = await cli.run([
      "run:create",
      "--runs-dir",
      runsRoot,
      "--process-id",
      "ci/noprompt",
      "--entry",
      `${entryFile}#process`,
    ]);

    expect(exitCode).toBe(0);

    const runDir = await expectSingleRunDir();
    const metadata = await readRunMetadata(runDir);
    expect(metadata.prompt).toBeUndefined();

    const journal = await loadJournal(runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");
    expect(journal[0].data.prompt).toBeUndefined();
  });

  it("fails fast when required flags are missing", async () => {
    const cli = createBabysitterCli();
    const exitCode = await cli.run(["run:create", "--entry", "./process.mjs"]);

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith("--process-id is required for run:create (unless creating a bare run without --entry)");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("babysitter run:create"));
  });

  async function writeEntrypoint(relativePath: string, contents: string) {
    const absolutePath = path.join(runsRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, contents, "utf8");
    return absolutePath;
  }

  async function writeFakeSdkPackage(packageRoot: string, marker: string, absolute = false) {
    const resolvedRoot = absolute ? packageRoot : path.resolve(packageRoot);
    await fs.mkdir(path.join(resolvedRoot, "dist"), { recursive: true });
    await fs.writeFile(
      path.join(resolvedRoot, "package.json"),
      JSON.stringify({
        name: "@a5c-ai/babysitter-sdk",
        type: "commonjs",
        main: "dist/index.js",
      }, null, 2),
      "utf8",
    );
    await fs.writeFile(
      path.join(resolvedRoot, "dist", "index.js"),
      `exports.__marker = ${JSON.stringify(marker)};\nexports.defineTask = function defineTask() { return null; };\n`,
      "utf8",
    );
    return resolvedRoot;
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

  describe("run:iterate", () => {
    it("enables plugin-local subprocess support when iterating inside plugin mode", async () => {
      const runDir = await createRunSkeleton("run-plugin-local-iterate");
      const savedEnv = {
        AGENT_PLUGIN_ROOT: process.env.AGENT_PLUGIN_ROOT,
        AGENT_SESSION_ID: process.env.AGENT_SESSION_ID,
        AGENT_CAPABILITIES_JSON: process.env.AGENT_CAPABILITIES_JSON,
        BABYSITTER_STATE_DIR: process.env.BABYSITTER_STATE_DIR,
      };
      const orchestrateSpy = vi.spyOn(orchestrateIterationModule, "orchestrateIteration").mockResolvedValue({
        status: "completed",
        output: { ok: true },
      });

      process.env.AGENT_PLUGIN_ROOT = path.join(runsRoot, "plugin-root");
      process.env.AGENT_SESSION_ID = "plugin-session";
      process.env.AGENT_CAPABILITIES_JSON = JSON.stringify({ tools: ["bash"] });
      process.env.BABYSITTER_STATE_DIR = path.join(runsRoot, "state");

      try {
        const exitCode = await cli.run(["run:iterate", runDir, "--json"]);

        expect(exitCode).toBe(0);
        expect(orchestrateSpy).toHaveBeenCalledWith(expect.objectContaining({
          runDir,
          subprocessSupport: "plugin-local",
        }));
      } finally {
        for (const [key, value] of Object.entries(savedEnv)) {
          if (value === undefined) {
            delete process.env[key];
          } else {
            process.env[key] = value;
          }
        }
        orchestrateSpy.mockRestore();
      }
    });

    it("keeps subprocess support disabled for ordinary local iteration", async () => {
      const runDir = await createRunSkeleton("run-local-iterate");
      const orchestrateSpy = vi.spyOn(orchestrateIterationModule, "orchestrateIteration").mockResolvedValue({
        status: "completed",
        output: { ok: true },
      });

      const exitCode = await cli.run(["run:iterate", runDir, "--json"]);

      expect(exitCode).toBe(0);
      expect(orchestrateSpy).toHaveBeenCalledWith(expect.objectContaining({
        runDir,
      }));
      expect(orchestrateSpy.mock.calls[0][0]).not.toHaveProperty("subprocessSupport");
      orchestrateSpy.mockRestore();
    });

    it("returns non-zero for halted runs without a completion proof", async () => {
      const runDir = await createRunSkeleton("run-halted-iterate");
      const orchestrateSpy = vi.spyOn(orchestrateIterationModule, "orchestrateIteration").mockResolvedValue({
        status: "halted",
        reason: "phase-0",
        payload: { reason: "invalid-input" },
      });

      const exitCode = await cli.run(["run:iterate", runDir, "--json"]);

      expect(exitCode).toBe(1);
      const payload = readLastJson(logSpy);
      expect(payload).toMatchObject({
        status: "halted",
        reason: "phase-0",
        payload: { reason: "invalid-input" },
      });
      expect(payload.completionProof).toBeUndefined();
      orchestrateSpy.mockRestore();
    });
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

    it("derives a completion proof for completed runs without stored metadata", async () => {
      const runId = "run-complete";
      const runDir = await createRunSkeleton(runId);
      await appendEvent({
        runDir,
        eventType: "RUN_COMPLETED",
        event: { outputRef: "state/output.json" },
      });

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.state).toBe("completed");
      expect(payload.completionProof).toBe(deriveCompletionProof(runId));
    });

    it("reports halted runs with reason and no completion proof", async () => {
      const runId = "run-halted-status";
      const runDir = await createRunSkeleton(runId);
      await appendEvent({
        runDir,
        eventType: "RUN_HALTED",
        event: { reason: "phase-0", payload: { reason: "invalid-input" } },
      });

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.state).toBe("halted");
      expect(payload.reason).toBe("phase-0");
      expect(payload.payload).toEqual({ reason: "invalid-input" });
      expect(payload.completionProof).toBeNull();
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

    it("includes pendingEffectsSummary with zero totals and needsMoreIterations=false for a fresh run", async () => {
      const runDir = await createRunSkeleton("run-fresh-summary");

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.state).toBe("created");
      expect(payload.pendingEffectsSummary).toEqual({
        totalPending: 0,
        countsByKind: {},
        autoRunnableCount: 0,
      });
      expect(payload.needsMoreIterations).toBe(false);
    });

    it("includes pendingEffectsSummary with autoRunnableCount > 0 and needsMoreIterations=true when node effects are pending", async () => {
      const runDir = await createRunWithPendingEffects();

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.state).toBe("waiting");
      expect(payload.pendingEffectsSummary.totalPending).toBe(2);
      expect(payload.pendingEffectsSummary.countsByKind).toEqual({ breakpoint: 1, node: 1 });
      expect(payload.pendingEffectsSummary.autoRunnableCount).toBe(1);
      expect(payload.needsMoreIterations).toBe(true);
    });

    it("reports needsMoreIterations=false for a completed run", async () => {
      const runId = "run-completed-iterations";
      const runDir = await createRunSkeleton(runId);
      await appendRequestedEffect(runDir, "ef-node-done", "node", "build");
      await appendResolvedEffect(runDir, "ef-node-done");
      await appendEvent({
        runDir,
        eventType: "RUN_COMPLETED",
        event: { outputRef: "state/output.json" },
      });

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.state).toBe("completed");
      expect(payload.pendingEffectsSummary.totalPending).toBe(0);
      expect(payload.pendingEffectsSummary.autoRunnableCount).toBe(0);
      expect(payload.needsMoreIterations).toBe(false);
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

    it("reports PROCESS_RUNTIME_ERROR as a distinct failed state", async () => {
      const runDir = await createRunWithProcessRuntimeError();

      const exitCode = await cli.run(["run:status", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.state).toBe("failed");
      expect(payload.reason).toBe("process_runtime_error");
      expect(payload.lastEvent).toMatchObject({
        type: "PROCESS_RUNTIME_ERROR",
        data: {
          error: {
            message: "Cannot read properties of undefined",
          },
          recovery: {
            command: "run:recover-process-error",
            recoverable: true,
          },
        },
      });
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

    it("filters PROCESS_RUNTIME_ERROR events", async () => {
      const runDir = await createRunWithProcessRuntimeError();

      const exitCode = await cli.run(["run:events", runDir, "--filter-type", "process_runtime_error", "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.events).toHaveLength(1);
      expect(payload.events[0]).toMatchObject({
        type: "PROCESS_RUNTIME_ERROR",
        data: {
          error: {
            message: "Cannot read properties of undefined",
          },
        },
      });
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


  describe("run:repair-journal", () => {
    it("skips 0-byte corrupt journal files and reports droppedCorrupt count", async () => {
      const runDir = await createRunSkeleton("run-repair-empty");
      // Manually write a 0-byte file into the journal directory
      const journalDir = path.join(runDir, "journal");
      await fs.writeFile(path.join(journalDir, "000099.FAKECORRUPT00000000.json"), "", "utf8");

      const exitCode = await cli.run(["run:repair-journal", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.journal.droppedCorrupt).toBeGreaterThanOrEqual(1);
      expect(payload.repaired).toBe(true);
    });

    it("skips journal files containing invalid JSON and reports them as corrupt", async () => {
      const runDir = await createRunSkeleton("run-repair-badjson");
      const journalDir = path.join(runDir, "journal");
      await fs.writeFile(
        path.join(journalDir, "000099.FAKECORRUPT00000001.json"),
        "{ this is not valid json }}}",
        "utf8"
      );

      const exitCode = await cli.run(["run:repair-journal", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload.journal.droppedCorrupt).toBeGreaterThanOrEqual(1);
      expect(payload.repaired).toBe(true);
    });

    it("still processes normal journal files correctly alongside corrupt ones", async () => {
      const runDir = await createRunSkeleton("run-repair-mixed");
      const journalDir = path.join(runDir, "journal");
      // Add a corrupt (0-byte) file
      await fs.writeFile(path.join(journalDir, "000099.FAKECORRUPT00000002.json"), "", "utf8");

      const exitCode = await cli.run(["run:repair-journal", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      // The RUN_CREATED event from createRunSkeleton should still be kept
      expect(payload.journal.keptEvents).toBeGreaterThanOrEqual(1);
      expect(payload.journal.droppedCorrupt).toBeGreaterThanOrEqual(1);
      expect(payload.repaired).toBe(true);
    });

    it("includes droppedCorrupt in human-readable dry-run output", async () => {
      const runDir = await createRunSkeleton("run-repair-dryrun");
      const journalDir = path.join(runDir, "journal");
      await fs.writeFile(path.join(journalDir, "000099.FAKECORRUPT00000003.json"), "", "utf8");

      const exitCode = await cli.run(["run:repair-journal", runDir, "--dry-run"]);

      expect(exitCode).toBe(0);
      const line = findSingleLine(logSpy, (entry) => entry.startsWith("[run:repair-journal]"));
      expect(line).toContain("droppedCorrupt=");
    });
  });

  describe("run:recover-process-error", () => {
    it("supports dry-run JSON without mutating the journal", async () => {
      const runDir = await createRunWithProcessRuntimeError();
      const before = await loadJournal(runDir);

      const exitCode = await cli.run(["run:recover-process-error", runDir, "--dry-run", "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload).toMatchObject({
        dryRun: true,
        runDir,
        recovered: false,
        processError: {
          type: "PROCESS_RUNTIME_ERROR",
        },
      });
      const after = await loadJournal(runDir);
      expect(after.map((event) => event.type)).toEqual(before.map((event) => event.type));
    });

    it("patches the offending task result and clears the latest process error marker", async () => {
      const runDir = await createRunWithProcessRuntimeError();

      const exitCode = await cli.run([
        "run:recover-process-error",
        runDir,
        "--patch-effect",
        "ef-process:value.checks=[]",
        "--json",
      ]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload).toMatchObject({
        recovered: true,
        patchedEffect: {
          effectId: "ef-process",
          path: "value.checks",
        },
      });
      const result = JSON.parse(await fs.readFile(path.join(runDir, "tasks", "ef-process", "result.json"), "utf8"));
      expect(result.value.checks).toEqual([]);
      const journal = await loadJournal(runDir);
      expect(journal.some((event) => event.type === "PROCESS_RUNTIME_ERROR")).toBe(false);
    });

    it("clears the marker without a patch so the next iterate can honestly rethrow", async () => {
      const runDir = await createRunWithProcessRuntimeError();

      const exitCode = await cli.run(["run:recover-process-error", runDir, "--json"]);

      expect(exitCode).toBe(0);
      const payload = readLastJson(logSpy);
      expect(payload).toMatchObject({ recovered: true, patchedEffect: null });
      const journal = await loadJournal(runDir);
      expect(journal.some((event) => event.type === "PROCESS_RUNTIME_ERROR")).toBe(false);
      const result = JSON.parse(await fs.readFile(path.join(runDir, "tasks", "ef-process", "result.json"), "utf8"));
      expect(result.value).toEqual({ verified: true });
    });

    it("rejects malformed patch input without mutating artifacts", async () => {
      const runDir = await createRunWithProcessRuntimeError();
      const beforeJournal = (await loadJournal(runDir)).map((event) => event.type);
      const beforeResult = await fs.readFile(path.join(runDir, "tasks", "ef-process", "result.json"), "utf8");

      const exitCode = await cli.run([
        "run:recover-process-error",
        runDir,
        "--patch-effect",
        "ef-process:value.checks",
        "--json",
      ]);

      expect(exitCode).toBe(1);
      expect(hasLineContaining(errorSpy, "[run:recover-process-error]")).toBe(true);
      expect((await loadJournal(runDir)).map((event) => event.type)).toEqual(beforeJournal);
      await expect(fs.readFile(path.join(runDir, "tasks", "ef-process", "result.json"), "utf8")).resolves.toBe(beforeResult);
    });

    it("fails cleanly when no process error marker exists", async () => {
      const runDir = await createRunSkeleton("run-no-process-error");

      const exitCode = await cli.run(["run:recover-process-error", runDir, "--json"]);

      expect(exitCode).toBe(1);
      expect(hasLineContaining(errorSpy, "no PROCESS_RUNTIME_ERROR event found")).toBe(true);
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

  async function createRunWithProcessRuntimeError() {
    const runDir = await createRunSkeleton("run-process-runtime-error");
    await appendRequestedEffect(runDir, "ef-process", "node", "verify");
    const taskDir = path.join(runDir, "tasks", "ef-process");
    await fs.writeFile(
      path.join(taskDir, "result.json"),
      JSON.stringify({
        schemaVersion: "test",
        effectId: "ef-process",
        taskId: "node-task",
        invocationKey: "ef-process:inv",
        status: "ok",
        value: { verified: true },
      }, null, 2),
    );
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId: "ef-process",
        status: "ok",
        resultRef: "tasks/ef-process/result.json",
      },
    });
    await appendEvent({
      runDir,
      eventType: "PROCESS_RUNTIME_ERROR",
      event: {
        error: { name: "TypeError", message: "Cannot read properties of undefined" },
        iteration: 2,
        runId: "run-process-runtime-error",
        processId: "process-id",
        journalHead: { seq: 3, ulid: "01HPROCESS0000000000000" },
        lastEffect: {
          effectId: "ef-process",
          invocationKey: "ef-process:inv",
          taskId: "node-task",
          stepId: "step-ef-process",
          kind: "node",
          status: "resolved_ok",
          resultRef: "tasks/ef-process/result.json",
        },
        recovery: {
          command: "run:recover-process-error",
          recoverable: true,
        },
      },
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
