#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const RUN_ID = "cli-smoke";
const PROCESS_ID = "cli-smoke/process";
const PROCESS_EXPORT = "process";
const pkgRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");
const fixtureRoot = path.join(pkgRoot, "test-fixtures", "cli");
const fixtureProcessesDir = path.join(fixtureRoot, "processes");
const fixtureInputsDir = path.join(fixtureRoot, "inputs");
const defaultRunsDir = path.join(fixtureRoot, "runs", "smoke");
const defaultCliEntry = path.join(pkgRoot, "dist", "cli", "main.js");
const deterministicModulePath = path.join(pkgRoot, "dist", "testing", "deterministic.js");
const deterministicIndexPath = path.join(pkgRoot, "dist", "testing");

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const runsRoot = resolveWorkspacePath(options.runsDir);
  const cliEntry = resolveWorkspacePath(options.cliPath);
  const startTime = Date.now();

  try {
    await ensureBuildArtifacts(cliEntry);
    const deterministicRequireTarget = await resolveDeterministicModule();

    await prepareRunsRoot(runsRoot);
    await stageFixtures(runsRoot);
    const hookPath = await writeDeterministicBootstrap(runsRoot, deterministicRequireTarget);

    const context = {
      runsRoot,
      runId: RUN_ID,
      cliEntry,
      hookPath,
      processEntry: path.join(runsRoot, "processes", "smoke-process.mjs"),
      inputsPath: path.join(runsRoot, "inputs", "smoke.json"),
      runDir: path.join(runsRoot, RUN_ID),
      secretToken: "cli-smoke-secret-value",
      internalKey: "cli-smoke-internal-key",
    };

    const summary = await runSmokeSequence(context);
    logSummary(summary, Date.now() - startTime);

    if (!options.keep) {
      await cleanupRunsRoot(runsRoot);
    }
  } catch (error) {
    if (!options.keep) {
      await cleanupRunsRoot(runsRoot).catch(() => undefined);
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const options = {
    runsDir: defaultRunsDir,
    cliPath: defaultCliEntry,
    keep: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--runs-dir") {
      options.runsDir = expectFlagValue(argv, ++i, "--runs-dir");
    } else if (arg === "--cli") {
      options.cliPath = expectFlagValue(argv, ++i, "--cli");
    } else if (arg === "--keep") {
      options.keep = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
      break;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function expectFlagValue(argv, index, flag) {
  const value = argv[index];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log(
    [
      "Usage: node scripts/smoke-cli.js [--runs-dir <dir>] [--cli <path>] [--keep]",
      "",
      "Options:",
      "  --runs-dir   Where runs/process fixtures are staged (default: test-fixtures/cli/runs/smoke).",
      "  --cli        CLI entry file (default: dist/cli/main.js).",
      "  --keep       Skip cleanup so the staged run can be inspected manually.",
      "",
      "This harness is also published as `pnpm --filter @a5c-ai/babysitter-sdk run smoke:cli`.",
    ].join("\n")
  );
}

function resolveWorkspacePath(input) {
  if (!input) {
    return input;
  }
  if (path.isAbsolute(input)) {
    return input;
  }
  const normalized = input.replace(/\\/g, "/");
  if (normalized.startsWith("packages/")) {
    return path.resolve(repoRoot, input);
  }
  return path.resolve(pkgRoot, input);
}

async function ensureBuildArtifacts(cliEntry) {
  await ensureFile(cliEntry, "CLI entrypoint missing. Run `pnpm --filter @a5c-ai/babysitter-sdk run build` first.");
  await ensureFile(
    deterministicModulePath,
    "Deterministic helpers missing. Run `pnpm --filter @a5c-ai/babysitter-sdk run build` first."
  );
}

async function ensureFile(targetPath, message) {
  try {
    await fsp.access(targetPath, fs.constants.R_OK);
  } catch {
    throw new Error(message);
  }
}

async function resolveDeterministicModule() {
  const candidates = [deterministicModulePath, deterministicIndexPath];
  for (const candidate of candidates) {
    try {
      const exportsObject = require(candidate);
      if (typeof exportsObject.installFixedClock === "function" && typeof exportsObject.installDeterministicUlids === "function") {
        return candidate;
      }
    } catch {
      // ignore and keep checking other candidates
    }
  }
  throw new Error("Deterministic helpers are unavailable; rebuild the SDK before running the smoke harness.");
}

async function prepareRunsRoot(runsRoot) {
  await fsp.rm(runsRoot, { recursive: true, force: true });
  await fsp.mkdir(runsRoot, { recursive: true });
}

async function cleanupRunsRoot(runsRoot) {
  await fsp.rm(runsRoot, { recursive: true, force: true });
}

async function stageFixtures(runsRoot) {
  await ensureDirectory(fixtureProcessesDir, "Fixture process directory is missing.");
  await ensureDirectory(fixtureInputsDir, "Fixture input directory is missing.");
  await copyDirectory(fixtureProcessesDir, path.join(runsRoot, "processes"));
  await copyDirectory(fixtureInputsDir, path.join(runsRoot, "inputs"));
}

async function ensureDirectory(targetPath, message) {
  try {
    const stats = await fsp.stat(targetPath);
    if (!stats.isDirectory()) {
      throw new Error(message);
    }
  } catch {
    throw new Error(message);
  }
}

async function copyDirectory(source, destination) {
  await fsp.mkdir(destination, { recursive: true });
  const entries = await fsp.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else if (entry.isFile()) {
      await fsp.copyFile(sourcePath, destPath);
    }
  }
}

async function writeDeterministicBootstrap(runsRoot, modulePath) {
  const hookDir = path.join(runsRoot, "__smoke__");
  await fsp.mkdir(hookDir, { recursive: true });
  const hookPath = path.join(hookDir, "deterministic-preload.cjs");
  const counterPath = path.join(hookDir, "ulid-counter.json");
  const payload = `"use strict";
const fs = require("node:fs");
const path = require("node:path");
const deterministic = require(${JSON.stringify(modulePath)});
const installFixedClock = deterministic.installFixedClock;
const installDeterministicUlids = deterministic.installDeterministicUlids;
const handles = [];

function applyHandle(handle) {
  if (!handle || typeof handle.apply !== "function") {
    return;
  }
  const release = handle.apply();
  if (typeof release === "function") {
    handles.push(release);
  }
}

function restoreHandle(handle) {
  if (handle && typeof handle.restore === "function") {
    try {
      handle.restore();
    } catch {
      // noop
    }
  }
}

function nextUlidEpochMs() {
  const counterFile = ${JSON.stringify(counterPath)};
  let counter = 0;
  try {
    const raw = fs.readFileSync(counterFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.counter === "number") {
      counter = parsed.counter;
    }
  } catch {
    // treat as empty
  }
  counter += 1;
  try {
    fs.mkdirSync(path.dirname(counterFile), { recursive: true });
    fs.writeFileSync(counterFile, JSON.stringify({ counter }, null, 2) + "\\n", "utf8");
  } catch {
    // best-effort; still proceed
  }
  const base = Date.UTC(2025, 0, 1, 0, 0, 0, 0);
  // Ensure monotonic ULID timestamps across separate Node processes by advancing the epoch per invocation.
  return base + counter * 60_000;
}

try {
  const clock = typeof installFixedClock === "function" ? installFixedClock({ start: "2025-01-01T00:00:00.000Z", stepMs: 250 }) : null;
  const ulids =
    typeof installDeterministicUlids === "function"
      ? installDeterministicUlids({ randomnessSeed: 42, epochMs: nextUlidEpochMs(), incrementMs: 1 })
      : null;

  applyHandle(clock);
  applyHandle(ulids);

  function cleanup() {
    while (handles.length) {
      const release = handles.pop();
      if (typeof release === "function") {
        try {
          release();
        } catch {
          // noop
        }
      }
    }
    restoreHandle(ulids);
    restoreHandle(clock);
  }

  process.once("exit", cleanup);
  process.once("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[smoke-cli] Failed to install deterministic hooks:", message);
  process.exit(1);
}
`;
  await fsp.writeFile(hookPath, payload, "utf8");
  return hookPath;
}

async function runSmokeSequence(context) {
  const sequence = [];
  const runCreate = await runCliJson(
    context,
    withRunsDir(context, [
      "run:create",
      context.runId,
      "--run-id",
      context.runId,
      "--process-id",
      PROCESS_ID,
      "--entry",
      `${context.processEntry}#${PROCESS_EXPORT}`,
      "--inputs",
      context.inputsPath,
      "--json",
    ])
  );
  validateRunCreate(runCreate.json, context);
  sequence.push({ command: "run:create", detail: runCreate.json });

  const runStatus = await runCliJson(context, withRunsDir(context, ["run:status", context.runId, "--json"]));
  sequence.push({ command: "run:status", detail: runStatus.json });

  const runIterate = await runCliJson(
    context,
    withRunsDir(context, ["run:iterate", context.runId, "--iteration", "1", "--json"])
  );
  ensureWaiting(runIterate.json);
  sequence.push({ command: "run:iterate", detail: runIterate.json, iteration: 1 });

  const runEvents = await runCliJson(context, withRunsDir(context, ["run:events", context.runId, "--json"]));
  validateEventPaths(runEvents.json, context.runDir);
  sequence.push({ command: "run:events", detail: runEvents.json });

  const runRebuild = await runCliJson(
    context,
    withRunsDir(context, ["run:rebuild-state", context.runId, "--dry-run", "--json"])
  );
  ensureDryRunPlan(runRebuild.json, context.runDir);
  sequence.push({ command: "run:rebuild-state", detail: runRebuild.json });

  const taskList = await runCliJson(context, withRunsDir(context, ["task:list", context.runId, "--pending", "--json"]));
  const effectId = pickEffectIdFromTaskList(taskList.json);
  validateTaskList(taskList.json, effectId);
  sequence.push({ command: "task:list", detail: taskList.json, effectId });

  const taskShowRedacted = await runCliJson(
    context,
    withRunsDir(context, ["task:show", context.runId, effectId, "--json", "--verbose"])
  );
  ensurePayloadRedacted(taskShowRedacted.json);
  sequence.push({ command: "task:show (redacted)", detail: taskShowRedacted.json });

  const taskShowUnredacted = await runCliJson(
    context,
    withRunsDir(context, ["task:show", context.runId, effectId, "--json", "--verbose"]),
    { env: { BABYSITTER_ALLOW_SECRET_LOGS: "1" } }
  );
  ensurePayloadVisible(taskShowUnredacted.json, context.secretToken, context.internalKey);
  sequence.push({ command: "task:show (allow secrets)", detail: taskShowUnredacted.json });

  const firstValuePath = path.join(context.runsRoot, "inputs", "effect-1.json");
  await fsp.writeFile(firstValuePath, JSON.stringify({ ok: true, effect: 1 }, null, 2));
  const firstPost = await runCliJson(
    context,
    withRunsDir(context, ["task:post", context.runId, effectId, "--status", "ok", "--value", firstValuePath, "--json"])
  );
  sequence.push({ command: "task:post", detail: firstPost.json, effectId });

  const runIterate2 = await runCliJson(
    context,
    withRunsDir(context, ["run:iterate", context.runId, "--iteration", "2", "--json"])
  );
  ensureWaiting(runIterate2.json);
  sequence.push({ command: "run:iterate", detail: runIterate2.json, iteration: 2 });

  const taskList2 = await runCliJson(context, withRunsDir(context, ["task:list", context.runId, "--pending", "--json"]));
  const effectId2 = pickEffectIdFromTaskList(taskList2.json);
  if (effectId2 === effectId) {
    throw new Error("run:iterate did not advance to the next effect (effectId unchanged after posting result)");
  }
  validateTaskList(taskList2.json, effectId2);
  sequence.push({ command: "task:list", detail: taskList2.json, effectId: effectId2 });

  const secondValuePath = path.join(context.runsRoot, "inputs", "effect-2.json");
  await fsp.writeFile(secondValuePath, JSON.stringify({ ok: true, effect: 2 }, null, 2));
  const secondPost = await runCliJson(
    context,
    withRunsDir(context, ["task:post", context.runId, effectId2, "--status", "ok", "--value", secondValuePath, "--json"])
  );
  sequence.push({ command: "task:post", detail: secondPost.json, effectId: effectId2 });

  const runIterate3 = await runCliJson(
    context,
    withRunsDir(context, ["run:iterate", context.runId, "--iteration", "3", "--json"])
  );
  ensureCompleted(runIterate3.json);
  sequence.push({ command: "run:iterate", detail: runIterate3.json, iteration: 3 });

  return sequence;
}

function validateRunCreate(payload, context) {
  if (payload.runId !== context.runId) {
    throw new Error(`run:create returned unexpected runId ${payload.runId}`);
  }
  if (!payload.entry || !payload.entry.endsWith("processes/smoke-process.mjs#process")) {
    throw new Error("run:create entry spec did not point to the smoke process");
  }
  const resolvedRunDir = path.resolve(payload.runDir);
  if (resolvedRunDir !== path.resolve(context.runDir)) {
    throw new Error("run:create resolved runDir mismatch");
  }
}

function ensureWaiting(payload) {
  if (payload.status !== "waiting") {
    throw new Error(`run:iterate expected waiting status, received ${payload.status || "unknown"}`);
  }
}

function ensureCompleted(payload) {
  if (payload.status !== "completed") {
    throw new Error(`run:iterate expected completed status, received ${payload.status || "unknown"}`);
  }
}

function pickEffectIdFromTaskList(payload) {
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const candidate = tasks.find((entry) => entry.kind === "node" && entry.status === "requested");
  if (!candidate?.effectId) {
    throw new Error("Unable to discover pending node effect id");
  }
  return candidate.effectId;
}

function validateEventPaths(payload, runDir) {
  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length < 2) {
    throw new Error("run:events expected at least RUN_CREATED and EFFECT_REQUESTED entries");
  }
  for (const event of events) {
    if (typeof event.path !== "string" || event.path.includes("\\")) {
      throw new Error(`run:events emitted non-POSIX path for seq=${event.seq ?? "unknown"}`);
    }
    if (!event.path.startsWith("..")) {
      // ensure formatting keeps journal references relative
      const absolute = path.resolve(runDir, event.path);
      if (!absolute.startsWith(runDir)) {
        throw new Error(`run:events path escaped runDir for seq=${event.seq ?? "unknown"}`);
      }
    }
  }
}

function ensureDryRunPlan(payload, runDir) {
  if (!payload || payload.runDir !== path.resolve(runDir) || payload.plan !== "rebuild_state_cache") {
    throw new Error("run:rebuild-state dry-run payload missing expected fields");
  }
}

function validateTaskList(payload, effectId) {
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  if (!tasks.length) {
    throw new Error("task:list returned no pending tasks");
  }
  const target = tasks.find((task) => task.effectId === effectId);
  if (!target) {
    throw new Error("task:list did not include the pending node effect");
  }
  if (target.status !== "requested") {
    throw new Error(`task:list expected pending status, received ${target.status}`);
  }
  assertPosixRefs(target);
}

function ensurePayloadRedacted(payload) {
  if (payload.task !== null || payload.result !== null) {
    throw new Error("task:show returned payloads without BABYSITTER_ALLOW_SECRET_LOGS");
  }
}

function ensurePayloadVisible(payload, secretToken, internalKey) {
  if (!payload.task || !payload.task.node?.env) {
    throw new Error("task:show did not return task payload when secrets were allowed");
  }
  if (payload.task.node.env.SECRET_TOKEN !== secretToken || payload.task.node.env.INTERNAL_API_KEY !== internalKey) {
    throw new Error("task:show returned unexpected env payloads");
  }
}

function ensureDryRunStatus(payload) {
  if (payload.status !== "skipped") {
    throw new Error(`task:post --dry-run expected status=skipped, received ${payload.status}`);
  }
}

function assertPosixRefs(entry) {
  const refs = ["taskDefRef", "inputsRef", "resultRef", "stdoutRef", "stderrRef"];
  for (const ref of refs) {
    const value = entry[ref];
    if (value && value.includes("\\")) {
      throw new Error(`task:list emitted non-POSIX ref for ${ref}`);
    }
  }
}

async function runCliJson(context, args, options = {}) {
  const spawnArgs = ["-r", context.hookPath, context.cliEntry, ...args];
  const env = buildEnv(options.env);
  const result = await exec(process.execPath, spawnArgs, { cwd: pkgRoot, env });
  if (result.code !== 0) {
    throw new Error(
      [
        `Command "${args[0]}" failed with exit code ${result.code}`,
        result.stdout ? `stdout: ${result.stdout}` : "",
        result.stderr ? `stderr: ${result.stderr}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
  const trimmed = result.stdout.trim();
  if (!trimmed) {
    throw new Error(`Command "${args[0]}" did not emit JSON output`);
  }
  try {
    return { json: JSON.parse(trimmed), stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    throw new Error(`Command "${args[0]}" emitted invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function withRunsDir(context, args) {
  if (args.includes("--runs-dir")) {
    return args;
  }
  return [...args, "--runs-dir", context.runsRoot];
}

function buildEnv(overrides = {}) {
  const env = { ...process.env };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return env;
}

function exec(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error) => {
      reject(error);
    });
    child.once("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function logSummary(sequence, durationMs) {
  console.log("[smoke:cli] Completed babysitter CLI smoke run.");
  for (const entry of sequence) {
    if (entry.effectId) {
      console.log(`- ${entry.command}: ok (effect ${entry.effectId})`);
    } else {
      console.log(`- ${entry.command}: ok`);
    }
  }
  console.log(`[smoke:cli] Duration: ${durationMs}ms`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
