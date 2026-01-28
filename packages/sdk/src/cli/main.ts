#!/usr/bin/env node
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import * as crypto from "node:crypto";
import { commitEffectResult } from "../runtime/commitEffectResult";
import { createRun } from "../runtime/createRun";
import { buildEffectIndex } from "../runtime/replay/effectIndex";
import { readStateCache, rebuildStateCache } from "../runtime/replay/stateCache";
import type { StateCacheSnapshot } from "../runtime/replay/stateCache";
import { EffectAction, EffectRecord, IterationMetadata } from "../runtime/types";
import type { JsonRecord } from "../storage/types";
import { nextUlid } from "../storage/ulids";
import { readTaskDefinition, readTaskResult } from "../storage/tasks";
import { loadJournal } from "../storage/journal";
import { readRunMetadata } from "../storage/runFiles";
import type { JournalEvent, RunMetadata, StoredTaskResult } from "../storage/types";
import { runIterate } from "./commands/runIterate";
import { resolveCompletionSecret } from "./completionSecret";

const USAGE = `Usage:
  babysitter run:create --process-id <id> --entry <path#export> [--runs-dir <dir>] [--inputs <file>] [--run-id <id>] [--process-revision <rev>] [--request <id>] [--json] [--dry-run]
  babysitter run:status <runDir> [--runs-dir <dir>] [--json]
  babysitter run:events <runDir> [--runs-dir <dir>] [--json] [--limit <n>] [--reverse] [--filter-type <type>]
  babysitter run:rebuild-state <runDir> [--runs-dir <dir>] [--json] [--dry-run]
  babysitter run:repair-journal <runDir> [--runs-dir <dir>] [--json] [--dry-run]
  babysitter run:iterate <runDir> [--runs-dir <dir>] [--json] [--verbose] [--iteration <n>]
  babysitter task:post <runDir> <effectId> --status <ok|error> [--runs-dir <dir>] [--json] [--dry-run] [--value <file>] [--error <file>] [--stdout-ref <ref>] [--stderr-ref <ref>] [--stdout-file <file>] [--stderr-file <file>] [--started-at <iso8601>] [--finished-at <iso8601>] [--metadata <file>] [--invocation-key <key>]
  babysitter task:list <runDir> [--runs-dir <dir>] [--pending] [--kind <kind>] [--json]
  babysitter task:show <runDir> <effectId> [--runs-dir <dir>] [--json]
  babysitter version

Global flags:
  --runs-dir <dir>   Override the runs directory (defaults to .a5c/runs).
  --json             Emit JSON output when supported by the command.
  --dry-run          Describe planned mutations without changing on-disk state.
  --verbose          Log resolved paths and options to stderr for debugging.
  --help, -h         Show this help text.
  --version, -v      Show CLI version.`;

interface ParsedArgs {
  command?: string;
  runsDir: string;
  json: boolean;
  dryRun: boolean;
  verbose: boolean;
  helpRequested: boolean;
  pendingOnly: boolean;
  kindFilter?: string;
  limit?: number;
  reverseOrder: boolean;
  filterType?: string;
  runDirArg?: string;
  effectId?: string;
  taskStatus?: "ok" | "error";
  valuePath?: string;
  errorPath?: string;
  stdoutRef?: string;
  stderrRef?: string;
  stdoutFile?: string;
  stderrFile?: string;
  startedAt?: string;
  finishedAt?: string;
  metadataPath?: string;
  invocationKey?: string;
  processId?: string;
  entrySpecifier?: string;
  inputsPath?: string;
  runIdOverride?: string;
  processRevision?: string;
  requestId?: string;
  iteration?: number;
}

interface ActionSummary {
  effectId: string;
  kind: string;
  label?: string;
}

interface TaskListEntry {
  effectId: string;
  taskId: string;
  stepId: string;
  status: string;
  kind?: string;
  label?: string;
  labels?: string[];
  taskDefRef: string | null;
  inputsRef: string | null;
  resultRef: string | null;
  stdoutRef: string | null;
  stderrRef: string | null;
  requestedAt?: string;
  resolvedAt?: string;
}

const LARGE_RESULT_PREVIEW_LIMIT = 1024 * 1024; // 1 MiB

function parseArgs(argv: string[]): ParsedArgs {
  const [initialCommand, ...rest] = argv;
  const parsed: ParsedArgs = {
    command: initialCommand,
    runsDir: ".a5c/runs",
    json: false,
    dryRun: false,
    verbose: false,
    helpRequested: false,
    pendingOnly: false,
    reverseOrder: false,
  };
  if (parsed.command === "--help" || parsed.command === "-h") {
    parsed.command = undefined;
    parsed.helpRequested = true;
  }
  if (parsed.command === "--version" || parsed.command === "-v") {
    parsed.command = "version";
  }
  const positionals: string[] = [];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--help" || arg === "-h") {
      parsed.helpRequested = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      parsed.command = "version";
      continue;
    }
    if (arg === "--runs-dir") {
      parsed.runsDir = expectFlagValue(rest, ++i, "--runs-dir");
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (arg === "--verbose") {
      parsed.verbose = true;
      continue;
    }
    if (arg === "--pending") {
      parsed.pendingOnly = true;
      continue;
    }
    if (arg === "--kind") {
      parsed.kindFilter = expectFlagValue(rest, ++i, "--kind");
      continue;
    }
    if (arg === "--limit") {
      const raw = expectFlagValue(rest, ++i, "--limit");
      parsed.limit = parsePositiveInteger(raw, "--limit");
      continue;
    }
    if (arg === "--iteration") {
      const raw = expectFlagValue(rest, ++i, "--iteration");
      parsed.iteration = parsePositiveInteger(raw, "--iteration");
      continue;
    }
    if (arg === "--reverse") {
      parsed.reverseOrder = true;
      continue;
    }
    if (arg === "--filter-type") {
      parsed.filterType = expectFlagValue(rest, ++i, "--filter-type");
      continue;
    }
    if (arg === "--status") {
      const raw = expectFlagValue(rest, ++i, "--status");
      const normalized = raw.toLowerCase();
      if (normalized !== "ok" && normalized !== "error") {
        throw new Error(`--status must be "ok" or "error" (received: ${raw})`);
      }
      parsed.taskStatus = normalized === "ok" ? "ok" : "error";
      continue;
    }
    if (arg === "--value") {
      parsed.valuePath = expectFlagValue(rest, ++i, "--value");
      continue;
    }
    if (arg === "--error") {
      parsed.errorPath = expectFlagValue(rest, ++i, "--error");
      continue;
    }
    if (arg === "--stdout-ref") {
      parsed.stdoutRef = expectFlagValue(rest, ++i, "--stdout-ref");
      continue;
    }
    if (arg === "--stderr-ref") {
      parsed.stderrRef = expectFlagValue(rest, ++i, "--stderr-ref");
      continue;
    }
    if (arg === "--stdout-file") {
      parsed.stdoutFile = expectFlagValue(rest, ++i, "--stdout-file");
      continue;
    }
    if (arg === "--stderr-file") {
      parsed.stderrFile = expectFlagValue(rest, ++i, "--stderr-file");
      continue;
    }
    if (arg === "--started-at") {
      parsed.startedAt = expectFlagValue(rest, ++i, "--started-at");
      continue;
    }
    if (arg === "--finished-at") {
      parsed.finishedAt = expectFlagValue(rest, ++i, "--finished-at");
      continue;
    }
    if (arg === "--metadata") {
      parsed.metadataPath = expectFlagValue(rest, ++i, "--metadata");
      continue;
    }
    if (arg === "--invocation-key") {
      parsed.invocationKey = expectFlagValue(rest, ++i, "--invocation-key");
      continue;
    }
    if (arg === "--process-id") {
      parsed.processId = expectFlagValue(rest, ++i, "--process-id");
      continue;
    }
    if (arg === "--entry") {
      parsed.entrySpecifier = expectFlagValue(rest, ++i, "--entry");
      continue;
    }
    if (arg === "--inputs") {
      parsed.inputsPath = expectFlagValue(rest, ++i, "--inputs");
      continue;
    }
    if (arg === "--run-id") {
      parsed.runIdOverride = expectFlagValue(rest, ++i, "--run-id");
      continue;
    }
    if (arg === "--process-revision") {
      parsed.processRevision = expectFlagValue(rest, ++i, "--process-revision");
      continue;
    }
    if (arg === "--request") {
      parsed.requestId = expectFlagValue(rest, ++i, "--request");
      continue;
    }
    positionals.push(arg);
  }
  if (parsed.command === "task:post") {
    [parsed.runDirArg, parsed.effectId] = positionals;
  } else if (parsed.command === "task:list") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "task:show") {
    [parsed.runDirArg, parsed.effectId] = positionals;
  } else if (parsed.command === "run:status") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:iterate") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:events") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:rebuild-state") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:repair-journal") {
    [parsed.runDirArg] = positionals;
  }
  return parsed;
}

function resolveRunDir(baseDir: string, runDirArg?: string): string {
  if (!runDirArg) throw new Error("Run directory argument is required.");
  return path.resolve(baseDir, runDirArg);
}

function expectFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parsePositiveInteger(raw: string, flag: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return Math.floor(parsed);
}

function summarizeActions(actions: EffectAction[]): ActionSummary[] {
  return actions.map((action) => ({
    effectId: action.effectId,
    kind: action.kind,
    label: action.label,
  }));
}


function logPendingActions(
  actions: EffectAction[],
  options: { command?: string; includeHeader?: boolean; metadataParts?: string[] } = {}
): ActionSummary[] {
  const summaries = summarizeActions(actions);
  if (options.command && options.includeHeader !== false) {
    const headerParts = [
      `[${options.command}] status=waiting`,
      `pending=${summaries.length}`,
      ...(options.metadataParts ?? []),
    ];
    console.error(headerParts.join(" "));
  }
  for (const summary of summaries) {
    const label = summary.label ? ` ${summary.label}` : "";
    console.error(`- ${summary.effectId} [${summary.kind}]${label}`);
  }
  return summaries;
}

function countActionsByKind(actions: EffectAction[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const action of actions) {
    counts.set(action.kind, (counts.get(action.kind) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function enrichIterationMetadata(
  metadata: IterationMetadata | undefined,
  pendingActions?: EffectAction[]
): IterationMetadata | undefined {
  if (!pendingActions?.length) {
    return metadata;
  }
  if (metadata?.pendingEffectsByKind) {
    return metadata;
  }
  return {
    ...(metadata ?? {}),
    pendingEffectsByKind: countActionsByKind(pendingActions),
  };
}

function logSleepHints(command: string, actions: EffectAction[]) {
  for (const action of actions) {
    const sleepMs = action.schedulerHints?.sleepUntilEpochMs;
    if (typeof sleepMs !== "number") continue;
    const iso = new Date(sleepMs).toISOString();
    const label = action.label ? ` ${action.label}` : "";
    const pendingInfo =
      typeof action.schedulerHints?.pendingCount === "number"
        ? ` pendingCount=${action.schedulerHints.pendingCount}`
        : "";
    console.error(`[${command}] sleep-until=${iso} effect=${action.effectId}${label}${pendingInfo}`);
  }
}



function formatResolvedEntrypoint(importPath: string, exportName?: string) {
  return `${importPath}${exportName ? `#${exportName}` : ""}`;
}

function formatVerboseValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function allowSecretLogs(parsed: ParsedArgs): boolean {
  if (!parsed.json || !parsed.verbose) {
    return false;
  }
  const raw = process.env.BABYSITTER_ALLOW_SECRET_LOGS;
  if (!raw) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

function logVerbose(command: string, parsed: ParsedArgs, details: Record<string, unknown>) {
  if (!parsed.verbose) return;
  const formatted = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatVerboseValue(value)}`)
    .join(" ");
  console.error(`[${command}] verbose ${formatted}`);
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRunRelativePosix(runDir: string, absolutePath?: string): string | undefined {
  if (!absolutePath) return undefined;
  return path.relative(runDir, absolutePath).replace(/\\/g, "/");
}

function normalizeArtifactRef(runDir: string, ref?: string | null): string | null {
  const absolute = resolveArtifactAbsolutePath(runDir, ref);
  if (!absolute) return null;
  const relative = toRunRelativePosix(runDir, absolute);
  return relative ?? null;
}

function resolveArtifactAbsolutePath(runDir: string, ref?: string | null): string | null {
  if (!ref) return null;
  const normalized = ref.trim();
  if (!normalized) return null;
  const absoluteRunDir = path.resolve(runDir);
  if (path.isAbsolute(normalized) || /^[A-Za-z]:[\\/]/.test(normalized)) {
    return path.normalize(normalized);
  }

  const candidates = collectArtifactCandidates(absoluteRunDir, normalized);
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (a.outsideRun !== b.outsideRun) return a.outsideRun ? 1 : -1;
      return a.relative.length - b.relative.length;
    });
    return candidates[0].absolute;
  }

  return path.join(absoluteRunDir, normalized);
}

type ArtifactCandidate = { absolute: string; relative: string; outsideRun: boolean };

function collectArtifactCandidates(runDir: string, ref: string): ArtifactCandidate[] {
  const seen = new Map<string, ArtifactCandidate>();
  const pushCandidate = (absolute: string) => {
    const normalizedAbs = path.normalize(absolute);
    const relative = path.relative(runDir, normalizedAbs).replace(/\\/g, "/");
    const outsideRun = relative.startsWith("..");
    seen.set(normalizedAbs, { absolute: normalizedAbs, relative, outsideRun });
  };

  pushCandidate(path.join(runDir, ref));
  pushCandidate(path.resolve(ref));

  return Array.from(seen.values());
}

function defaultResultRef(effectId: string): string {
  return `tasks/${effectId}/result.json`;
}

function formatEntrypointSpecifier(entrypoint: { importPath: string; exportName: string }): string {
  return `${entrypoint.importPath}#${entrypoint.exportName}`;
}

function parseEntrypointSpecifier(specifier: string): { importPath: string; exportName?: string } {
  if (!specifier) {
    throw new Error("Entrypoint must be provided as <path>#<export>");
  }
  const hashIndex = specifier.lastIndexOf("#");
  if (hashIndex === 0) {
    throw new Error("Entrypoint must include a module path before '#'");
  }
  if (hashIndex === -1) {
    return { importPath: specifier };
  }
  const importPath = specifier.slice(0, hashIndex);
  if (!importPath) {
    throw new Error("Entrypoint must include a module path before '#'");
  }
  const exportName = specifier.slice(hashIndex + 1) || undefined;
  return { importPath, exportName };
}

type ModuleExports = Record<string, unknown>;

// Use an indirect dynamic import so TypeScript does not downlevel to require() in CommonJS builds.
// Vitest executes modules inside a VM context that requires direct import() support.
const dynamicImportModule: (specifier: string) => Promise<ModuleExports> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<ModuleExports>;
})();

function listModuleExports(mod: ModuleExports): string {
  const keys = Object.keys(mod);
  return keys.length > 0 ? keys.join(", ") : "(none)";
}

async function validateProcessEntrypoint(importPath: string, exportName?: string): Promise<void> {
  const resolvedPath = path.isAbsolute(importPath) ? importPath : path.resolve(importPath);
  try {
    await fs.access(resolvedPath);
  } catch (error) {
    throw new Error(
      `Process entry file not found: ${resolvedPath}. ` +
        `Ensure the path is correct and points to a valid JS/TS module.`
    );
  }

  const moduleUrl = pathToFileURL(resolvedPath).href;
  let mod: ModuleExports;
  try {
    mod = await dynamicImportModule(moduleUrl);
  } catch (error) {
    throw new Error(
      `Failed to load process module at ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const resolvedExportName = exportName ?? "process";
  const candidate =
    (resolvedExportName && mod[resolvedExportName]) ??
    mod.process ??
    mod.default;

  if (typeof candidate !== "function") {
    const available = listModuleExports(mod);
    if (resolvedExportName && !(resolvedExportName in mod) && mod.default) {
      throw new Error(
        `Process module ${resolvedPath} does not export '${resolvedExportName}'. ` +
          `Available exports: ${available}. ` +
          `If you intended a default export, pass --entry ${importPath}#default.`
      );
    }
    throw new Error(
      `Process module ${resolvedPath} does not export a valid process function. ` +
        `Expected '${resolvedExportName}' (function) or default export. ` +
        `Available exports: ${available}.`
    );
  }
}

async function readInputsFile(filePath: string): Promise<unknown> {
  const absolute = path.resolve(filePath);
  let contents: string;
  try {
    contents = await fs.readFile(absolute, "utf8");
  } catch (error) {
    throw new Error(`Failed to read inputs file ${absolute}: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    return JSON.parse(contents) as unknown;
  } catch (error) {
    throw new Error(
      `Failed to parse inputs file ${absolute} as JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleRunCreate(parsed: ParsedArgs): Promise<number> {
  if (!parsed.processId) {
    console.error("--process-id is required for run:create");
    console.error(USAGE);
    return 1;
  }
  if (!parsed.entrySpecifier) {
    console.error("--entry is required for run:create");
    console.error(USAGE);
    return 1;
  }
  let entrypoint;
  try {
    entrypoint = parseEntrypointSpecifier(parsed.entrySpecifier);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const runsDir = path.resolve(parsed.runsDir);
  const absoluteImportPath = path.resolve(entrypoint.importPath);
  const resolvedEntry = formatResolvedEntrypoint(absoluteImportPath, entrypoint.exportName);
  logVerbose("run:create", parsed, {
    runsDir,
    processId: parsed.processId,
    entry: resolvedEntry,
    dryRun: parsed.dryRun,
    json: parsed.json,
    request: parsed.requestId,
    processRevision: parsed.processRevision,
    runId: parsed.runIdOverride,
    inputsPath: parsed.inputsPath ? path.resolve(parsed.inputsPath) : undefined,
  });
  let inputs: unknown = undefined;
  if (parsed.inputsPath) {
    try {
      inputs = await readInputsFile(parsed.inputsPath);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
  if (parsed.dryRun) {
    const summary = {
      dryRun: true,
      runsDir,
      processId: parsed.processId,
      entry: resolvedEntry,
      runId: parsed.runIdOverride ?? null,
      request: parsed.requestId ?? null,
      processRevision: parsed.processRevision ?? null,
      inputsPath: parsed.inputsPath ? path.resolve(parsed.inputsPath) : null,
    };
    if (parsed.json) {
      console.log(JSON.stringify(summary));
    } else {
      const parts = [
        "[run:create] dry-run",
        `runsDir=${runsDir}`,
        `processId=${parsed.processId}`,
        `entry=${resolvedEntry}`,
        `runId=${summary.runId ?? "auto"}`,
      ];
      if (parsed.requestId) parts.push(`request=${parsed.requestId}`);
      if (parsed.processRevision) parts.push(`processRevision=${parsed.processRevision}`);
      if (summary.inputsPath) parts.push(`inputs=${summary.inputsPath}`);
      console.log(parts.join(" "));
    }
    return 0;
  }
  try {
    await validateProcessEntrypoint(absoluteImportPath, entrypoint.exportName);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const result = await createRun({
    runsDir,
    runId: parsed.runIdOverride,
    request: parsed.requestId,
    processRevision: parsed.processRevision,
    process: {
      processId: parsed.processId,
      importPath: absoluteImportPath,
      exportName: entrypoint.exportName,
    },
    inputs,
  });
  const entrySpec = formatEntrypointSpecifier(result.metadata.entrypoint);
  if (parsed.json) {
    console.log(JSON.stringify({ runId: result.runId, runDir: result.runDir, entry: entrySpec }));
  } else {
    console.log(`[run:create] runId=${result.runId} runDir=${result.runDir} entry=${entrySpec}`);
  }
  return 0;
}

type RunLifecycleState = "created" | "waiting" | "completed" | "failed";

async function handleRunStatus(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:status", parsed, {
    runDir,
    json: parsed.json,
  });
  const metadata = await readRunMetadataSafe(runDir, "run:status");
  if (!metadata) return 1;
  const journal = await loadJournalSafe(runDir, "run:status");
  if (!journal) return 1;
  const index = await buildEffectIndexSafe(runDir, "run:status", journal);
  if (!index) return 1;

  const pendingRecords = index.listPendingEffects();
  const pendingByKind = countPendingByKind(pendingRecords);
  const pendingTotal = pendingRecords.length;
  const stateSnapshot = await readStateCacheSafe(runDir, "run:status");
  const mergedMetadata = mergeMetadataSources(
    {
      pendingEffectsByKind: pendingByKind,
    },
    { snapshot: stateSnapshot, pendingByKind }
  );
  const formattedMetadata = formatIterationMetadata(mergedMetadata);
  const lastEvent = journal.at(-1);
  const lastLifecycleEvent = findLastLifecycleEvent(journal);
  const state = deriveRunState(lastLifecycleEvent?.type, pendingTotal);
  const lastSummary = formatLastEventSummary(lastEvent);
  if (parsed.json) {
    const completionSecret = state === "completed" ? resolveCompletionSecret(metadata) : null;
    console.log(
      JSON.stringify({
        state,
        lastEvent: lastEvent ? serializeJournalEvent(lastEvent, runDir) : null,
        pendingByKind,
        metadata: formattedMetadata.jsonMetadata ?? null,
        completionSecret,
      })
    );
    return 0;
  }
  const suffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  const completionSecret = state === "completed" ? resolveCompletionSecret(metadata) : undefined;
  const secretSuffix = completionSecret ? ` completionSecret=${completionSecret}` : "";
  console.log(`[run:status] state=${state} last=${lastSummary}${suffix}${secretSuffix}`);
  return 0;
}

async function handleRunIterate(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:iterate", parsed, {
    runDir,
    iteration: parsed.iteration,
    json: parsed.json,
    verbose: parsed.verbose,
  });

  try {
    const result = await runIterate({
      runDir,
      iteration: parsed.iteration,
      verbose: parsed.verbose,
      json: parsed.json,
    });

    if (parsed.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const countInfo = result.count ? ` count=${result.count}` : "";
      const actionInfo = result.action ? ` action=${result.action}` : "";
      console.log(`[run:iterate] iteration=${result.iteration} status=${result.status}${actionInfo}${countInfo} reason=${result.reason}`);
      if (result.status === "completed" && result.completionSecret) {
        console.log(`[run:iterate] completionSecret=${result.completionSecret}`);
      }

      if (result.status === "waiting" && result.until) {
        console.log(`[run:iterate] Waiting until: ${new Date(result.until).toISOString()}`);
      }
    }

    return 0;
  } catch (error) {
    console.error(`[run:iterate] Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function handleRunEvents(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:events", parsed, {
    runDir,
    json: parsed.json,
    limit: parsed.limit,
    reverse: parsed.reverseOrder,
    filterType: parsed.filterType,
  });
  if (!(await readRunMetadataSafe(runDir, "run:events"))) return 1;
  const stateSnapshot = await readStateCacheSafe(runDir, "run:events");
  const journal = await loadJournalSafe(runDir, "run:events");
  if (!journal) return 1;

  const filterType = parsed.filterType ? parsed.filterType.toUpperCase() : undefined;
  const filtered = filterType ? journal.filter((event) => event.type.toUpperCase() === filterType) : journal;
  const orderedBase = filtered.slice();
  const ordered = parsed.reverseOrder ? orderedBase.reverse() : orderedBase;
  const limited = parsed.limit !== undefined ? ordered.slice(0, parsed.limit) : ordered;

  const metadata = mergeMetadataSources(undefined, { snapshot: stateSnapshot });
  const formattedMetadata = formatIterationMetadata(metadata);
  if (parsed.json) {
    console.log(
      JSON.stringify({
        events: limited.map((event) => serializeJournalEvent(event, runDir)),
        metadata: formattedMetadata.jsonMetadata ?? null,
      })
    );
    return 0;
  }

  const headerParts = [
    `total=${journal.length}`,
    `matching=${filtered.length}`,
    `showing=${limited.length}`,
  ];
  if (filterType) headerParts.push(`filter=${filterType}`);
  if (parsed.limit) headerParts.push(`limit=${parsed.limit}`);
  if (parsed.reverseOrder) headerParts.push("order=desc");
  const metadataSuffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  console.log(`[run:events] ${headerParts.join(" ")}${metadataSuffix}`);
  for (const event of limited) {
    console.log(`- ${formatEventLine(event)}`);
  }
  return 0;
}

async function handleRunRebuildState(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:rebuild-state", parsed, {
    runDir,
    dryRun: parsed.dryRun,
    json: parsed.json,
  });
  if (!(await readRunMetadataSafe(runDir, "run:rebuild-state"))) return 1;
  if (parsed.dryRun) {
    const plan = { dryRun: true, runDir, plan: "rebuild_state_cache", reason: "cli_manual" };
    if (parsed.json) {
      console.log(JSON.stringify(plan));
    } else {
      console.log(`[run:rebuild-state] dry-run runDir=${runDir} plan=${plan.plan} reason=${plan.reason}`);
    }
    return 0;
  }
  const snapshot = await rebuildStateCache(runDir, { reason: "cli_manual" });
  const metadata: IterationMetadata = {
    pendingEffectsByKind: snapshot.pendingEffectsByKind,
    stateVersion: snapshot.stateVersion,
    journalHead: snapshot.journalHead ?? null,
    stateRebuilt: true,
    stateRebuildReason: snapshot.rebuildReason ?? undefined,
  };
  const formatted = formatIterationMetadata(metadata);
  if (parsed.json) {
    console.log(JSON.stringify({ runDir, metadata: formatted.jsonMetadata ?? null }));
    return 0;
  }
  const suffix = formatted.textParts.length ? ` ${formatted.textParts.join(" ")}` : "";
  console.log(`[run:rebuild-state] runDir=${runDir}${suffix}`);
  return 0;
}

async function handleRunRepairJournal(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:repair-journal", parsed, {
    runDir,
    dryRun: parsed.dryRun,
    json: parsed.json,
  });
  if (!(await readRunMetadataSafe(runDir, "run:repair-journal"))) return 1;

  const journalDir = path.join(runDir, "journal");
  const files = (await fs.readdir(journalDir)).filter((name) => name.endsWith(".json")).sort();
  const rawEvents: Array<{ filename: string; payload: { type?: unknown; recordedAt?: unknown; data?: unknown } }> = [];
  for (const filename of files) {
    const fullPath = path.join(journalDir, filename);
    const payload = JSON.parse(await fs.readFile(fullPath, "utf8")) as { type?: unknown; recordedAt?: unknown; data?: unknown };
    rawEvents.push({ filename, payload });
  }

  const seenInvocation = new Set<string>();
  const keptEffectIds = new Set<string>();
  const droppedEffectIds = new Set<string>();
  const kept: Array<{ type: string; recordedAt?: string; data: JsonRecord }> = [];
  let droppedRequested = 0;
  let droppedResolved = 0;

  for (const entry of rawEvents) {
    const type = typeof entry.payload.type === "string" ? entry.payload.type : "UNKNOWN";
    const recordedAt = typeof entry.payload.recordedAt === "string" ? entry.payload.recordedAt : undefined;
    const data = isJsonRecord(entry.payload.data) ? entry.payload.data : {};

    if (type === "EFFECT_REQUESTED") {
      const invocationKey = typeof data.invocationKey === "string" ? data.invocationKey : "";
      const effectId = typeof data.effectId === "string" ? data.effectId : "";
      if (invocationKey && seenInvocation.has(invocationKey)) {
        droppedRequested += 1;
        if (effectId) droppedEffectIds.add(effectId);
        continue;
      }
      if (invocationKey) seenInvocation.add(invocationKey);
      if (effectId) keptEffectIds.add(effectId);
      kept.push({ type, recordedAt, data });
      continue;
    }

    if (type === "EFFECT_RESOLVED") {
      const effectId = typeof data.effectId === "string" ? data.effectId : "";
      if (effectId && droppedEffectIds.has(effectId) && !keptEffectIds.has(effectId)) {
        droppedResolved += 1;
        continue;
      }
      kept.push({ type, recordedAt, data });
      continue;
    }

    // Keep all other events.
    kept.push({ type, recordedAt, data });
  }

  const summary = {
    runDir,
    journal: {
      originalFiles: files.length,
      keptEvents: kept.length,
      droppedRequested,
      droppedResolved,
    },
  };

  if (parsed.dryRun) {
    if (parsed.json) {
      console.log(JSON.stringify({ dryRun: true, ...summary }));
    } else {
      console.log(
        `[run:repair-journal] dry-run originalFiles=${files.length} keptEvents=${kept.length} droppedRequested=${droppedRequested} droppedResolved=${droppedResolved}`
      );
    }
    return 0;
  }

  const stamp = Date.now();
  const repairedDir = path.join(runDir, `journal.repaired.${stamp}`);
  await fs.mkdir(repairedDir, { recursive: true });

  for (let i = 0; i < kept.length; i += 1) {
    const seq = String(i + 1).padStart(6, "0");
    const ulid = nextUlid();
    const filename = `${seq}.${ulid}.json`;
    const eventPayload: JsonRecord = {
      type: kept[i].type,
      recordedAt: kept[i].recordedAt ?? new Date().toISOString(),
      data: kept[i].data,
    };
    const contents = JSON.stringify(eventPayload, null, 2) + "\n";
    const checksum = crypto.createHash("sha256").update(contents).digest("hex");
    const withChecksum = JSON.stringify({ ...eventPayload, checksum }, null, 2) + "\n";
    await fs.writeFile(path.join(repairedDir, filename), withChecksum, "utf8");
  }

  const backupDir = path.join(runDir, `journal.bak.${stamp}`);
  await fs.rename(journalDir, backupDir);
  await fs.rename(repairedDir, journalDir);

  if (parsed.json) {
    console.log(JSON.stringify({ ...summary, backupDir, repaired: true }));
  } else {
    console.log(
      `[run:repair-journal] repaired originalFiles=${files.length} keptEvents=${kept.length} droppedRequested=${droppedRequested} droppedResolved=${droppedResolved} backupDir=${backupDir}`
    );
  }
  return 0;
}

async function handleTaskPost(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  if (!parsed.taskStatus) {
    console.error(`[task:post] missing required --status <ok|error>`);
    return 1;
  }
  if (parsed.stdoutRef && parsed.stdoutFile) {
    console.error(`[task:post] cannot combine --stdout-ref with --stdout-file`);
    return 1;
  }
  if (parsed.stderrRef && parsed.stderrFile) {
    console.error(`[task:post] cannot combine --stderr-ref with --stderr-file`);
    return 1;
  }

  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  const secretLogsAllowed = allowSecretLogs(parsed);
  logVerbose("task:post", parsed, {
    runDir,
    effectId: parsed.effectId,
    status: parsed.taskStatus,
    dryRun: parsed.dryRun,
    json: parsed.json,
    secretLogsAllowed,
  });

  const index = await buildEffectIndexSafe(runDir, "task:post");
  if (!index) return 1;
  const record = index.getByEffectId(parsed.effectId);
  if (!record) {
    console.error(`[task:post] effect ${parsed.effectId} not found at ${runDir}`);
    return 1;
  }
  if (record.status !== "requested") {
    console.error(`[task:post] effect ${parsed.effectId} is not requested (status=${record.status ?? "unknown"})`);
    return 1;
  }

  const nowIso = new Date().toISOString();
  const startedAt = parsed.startedAt ?? nowIso;
  const finishedAt = parsed.finishedAt ?? nowIso;

  const resolveMaybeRunRelative = (candidate?: string) => {
    if (!candidate) return undefined;
    if (candidate === "-") return candidate;
    if (path.isAbsolute(candidate) || /^[A-Za-z]:[\\/]/.test(candidate)) {
      return candidate;
    }
    return path.join(runDir, candidate);
  };

  const readJsonFile = async (_label: string, filename?: string): Promise<unknown | undefined> => {
    if (!filename) return undefined;
    if (filename === "-") {
      const raw = await readStdinUtf8();
      const trimmed = raw.trim();
      return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
    }
    const absolute = resolveMaybeRunRelative(filename)!;
    const raw = await fs.readFile(absolute, "utf8");
    const trimmed = raw.trim();
    return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
  };

  const readTextFile = async (_label: string, filename?: string): Promise<string | undefined> => {
    if (!filename) return undefined;
    if (filename === "-") {
      return await readStdinUtf8();
    }
    const absolute = resolveMaybeRunRelative(filename)!;
    return await fs.readFile(absolute, "utf8");
  };

  const metadataRaw = await readJsonFile("metadata", parsed.metadataPath);
  const metadata: JsonRecord | undefined = isJsonRecord(metadataRaw) ? metadataRaw : undefined;
  const stdout = parsed.stdoutFile ? await readTextFile("stdout", parsed.stdoutFile) : undefined;
  const stderr = parsed.stderrFile ? await readTextFile("stderr", parsed.stderrFile) : undefined;

  let value: unknown = undefined;
  let errorPayload: unknown = undefined;
  if (parsed.taskStatus === "ok") {
    value = await readJsonFile("value", parsed.valuePath);
  } else {
    errorPayload =
      (await readJsonFile("error", parsed.errorPath)) ??
      ({
        name: "Error",
        message: "Task reported failure",
      } as const);
  }

  const invocationKey = parsed.invocationKey ?? record.invocationKey;

  const plan = {
    runDir: toRunRelativePosix(runDir, runDir) ?? runDir,
    effectId: parsed.effectId,
    status: parsed.taskStatus,
    valueProvided: parsed.valuePath ? true : false,
    errorProvided: parsed.errorPath ? true : false,
    stdoutRef: parsed.stdoutRef ?? null,
    stderrRef: parsed.stderrRef ?? null,
    stdoutFile: parsed.stdoutFile ?? null,
    stderrFile: parsed.stderrFile ?? null,
  };

  if (parsed.dryRun) {
    if (parsed.json) {
      console.log(JSON.stringify({ status: "skipped", dryRun: true, plan }));
    } else {
      console.log(`[task:post] status=skipped`);
      console.error(`[task:post] dry-run plan ${JSON.stringify(plan)}`);
    }
    return 0;
  }

  const committed = await commitEffectResult({
    runDir,
    effectId: parsed.effectId,
    invocationKey,
    result:
      parsed.taskStatus === "ok"
        ? {
            status: "ok",
            value,
            stdout,
            stderr,
            stdoutRef: parsed.stdoutRef,
            stderrRef: parsed.stderrRef,
            startedAt,
            finishedAt,
            metadata,
          }
        : {
            status: "error",
            error: errorPayload,
            stdout,
            stderr,
            stdoutRef: parsed.stdoutRef,
            stderrRef: parsed.stderrRef,
            startedAt,
            finishedAt,
            metadata,
          },
  });

  const stdoutRef = normalizeArtifactRef(runDir, committed.stdoutRef) ?? null;
  const stderrRef = normalizeArtifactRef(runDir, committed.stderrRef) ?? null;
  const resultRef = normalizeArtifactRef(runDir, committed.resultRef) ?? null;

  if (parsed.json) {
    console.log(
      JSON.stringify({
        status: parsed.taskStatus,
        committed,
        stdoutRef,
        stderrRef,
        resultRef,
      })
    );
  } else {
    const parts = [`[task:post] status=${parsed.taskStatus}`];
    if (stdoutRef) parts.push(`stdoutRef=${stdoutRef}`);
    if (stderrRef) parts.push(`stderrRef=${stderrRef}`);
    if (resultRef) parts.push(`resultRef=${resultRef}`);
    console.log(parts.join(" "));
  }
  return parsed.taskStatus === "ok" ? 0 : 1;
}

async function handleTaskList(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("task:list", parsed, {
    runDir,
    json: parsed.json,
    pending: parsed.pendingOnly,
    kind: parsed.kindFilter,
  });
  const index = await buildEffectIndexSafe(runDir, "task:list");
  if (!index) return 1;

  const rawRecords = parsed.pendingOnly ? index.listPendingEffects() : index.listEffects();
  const records = rawRecords
    .filter((record) =>
      parsed.kindFilter ? record.kind?.toLowerCase() === parsed.kindFilter.toLowerCase() : true
    )
    .sort((a, b) => a.effectId.localeCompare(b.effectId));
  const entries = records.map((record) => toTaskListEntry(record, runDir));

  if (parsed.json) {
    console.log(JSON.stringify({ tasks: entries }));
    return 0;
  }

  const scope = parsed.pendingOnly ? "pending" : "total";
  console.log(`[task:list] ${scope}=${entries.length}`);
  for (const entry of entries) {
    const label = entry.label ? ` ${entry.label}` : "";
    console.log(`- ${entry.effectId} [${entry.kind ?? "unknown"} ${entry.status}]${label} (taskId=${entry.taskId ?? "n/a"})`);
  }
  return 0;
}

async function handleTaskShow(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  const secretLogsAllowed = allowSecretLogs(parsed);
  logVerbose("task:show", parsed, {
    runDir,
    effectId: parsed.effectId,
    json: parsed.json,
    secretLogsAllowed,
  });
  const index = await buildEffectIndexSafe(runDir, "task:show");
  if (!index) return 1;

  const record = index.getByEffectId(parsed.effectId);
  if (!record) {
    console.error(`[task:show] effect ${parsed.effectId} not found in ${runDir}`);
    return 1;
  }

  const taskDef = await readTaskDefinition(runDir, parsed.effectId);
  if (!taskDef) {
    console.error(`[task:show] task definition missing for effect ${parsed.effectId}`);
    return 1;
  }
  const preview = await loadTaskResultPreview(runDir, parsed.effectId, record);
  const entry = toTaskListEntry(record, runDir);
  const inlineResult = preview.large ? null : preview.result ?? null;
  const largeResultRef = preview.large ? entry.resultRef ?? defaultResultRef(record.effectId) : null;

  if (parsed.json) {
    console.log(
      JSON.stringify({
        effect: entry,
        task: secretLogsAllowed ? taskDef : null,
        result: secretLogsAllowed ? inlineResult : null,
        largeResult: largeResultRef,
      })
    );
    return 0;
  }

  console.log(
    `[task:show] ${entry.effectId} [${entry.kind ?? "unknown"} ${entry.status}] ${entry.label ?? "(no label)"} (taskId=${
      entry.taskId
    })`
  );
  console.log(`  stepId=${entry.stepId} requestedAt=${entry.requestedAt ?? "n/a"} resolvedAt=${entry.resolvedAt ?? "n/a"}`);
  console.log(`  taskDefRef=${entry.taskDefRef ?? "n/a"}`);
  console.log(`  inputsRef=${entry.inputsRef ?? "n/a"}`);
  console.log(`  resultRef=${entry.resultRef ?? "n/a"}`);
  console.log(`  stdoutRef=${entry.stdoutRef ?? "n/a"}`);
  console.log(`  stderrRef=${entry.stderrRef ?? "n/a"}`);
  if (!secretLogsAllowed) {
    console.log(
      "  payloads: redacted (set BABYSITTER_ALLOW_SECRET_LOGS=true and rerun with --json --verbose to view task/result blobs)"
    );
    if (!inlineResult && !preview.large) {
      console.log("  result: (not yet written)");
    }
    return 0;
  }
  console.log("  taskDef:", JSON.stringify(taskDef, null, 2));
  if (preview.large) {
    console.log(`  result: see ${largeResultRef ?? entry.resultRef ?? defaultResultRef(record.effectId)}`);
  } else if (inlineResult) {
    console.log("  result:", JSON.stringify(inlineResult, null, 2));
  } else {
    console.log("  result: (not yet written)");
  }
  return 0;
}

function toTaskListEntry(record: EffectRecord, runDir: string): TaskListEntry {
  return {
    effectId: record.effectId,
    taskId: record.taskId ?? "unknown",
    stepId: record.stepId ?? "unknown",
    status: record.status ?? "unknown",
    kind: record.kind,
    label: record.label,
    labels: record.labels,
    taskDefRef: normalizeArtifactRef(runDir, record.taskDefRef ?? `tasks/${record.effectId}/task.json`),
    inputsRef: normalizeArtifactRef(runDir, record.inputsRef),
    resultRef: normalizeArtifactRef(runDir, record.resultRef),
    stdoutRef: normalizeArtifactRef(runDir, record.stdoutRef),
    stderrRef: normalizeArtifactRef(runDir, record.stderrRef),
    requestedAt: record.requestedAt,
    resolvedAt: record.resolvedAt,
  };
}

async function buildEffectIndexSafe(runDir: string, command: string, events?: JournalEvent[]) {
  try {
    return await buildEffectIndex({ runDir, events });
  } catch (error) {
    console.error(
      `[${command}] unable to read run at ${runDir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function readRunMetadataSafe(runDir: string, command: string): Promise<RunMetadata | null> {
  try {
    return await readRunMetadata(runDir);
  } catch (error) {
    console.error(
      `[${command}] unable to read run metadata at ${runDir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function loadJournalSafe(runDir: string, command: string): Promise<JournalEvent[] | null> {
  try {
    return await loadJournal(runDir);
  } catch (error) {
    console.error(
      `[${command}] unable to read journal at ${runDir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function readStateCacheSafe(runDir: string, command: string): Promise<StateCacheSnapshot | null> {
  try {
    const snapshot = await readStateCache(runDir);
    if (!snapshot) {
      console.warn(`[${command}] state cache snapshot missing at ${runDir} (continuing without metadata)`);
      return null;
    }
    return snapshot;
  } catch (error) {
    console.warn(
      `[${command}] unable to read state cache at ${runDir}: ${
        error instanceof Error ? error.message : String(error)
      } (continuing without metadata)`
    );
    return null;
  }
}

const RUN_LIFECYCLE_TYPES: ReadonlySet<JournalEvent["type"]> = new Set([
  "RUN_CREATED",
  "RUN_COMPLETED",
  "RUN_FAILED",
]);

function findLastLifecycleEvent(events: JournalEvent[]): JournalEvent | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (RUN_LIFECYCLE_TYPES.has(event.type)) {
      return event;
    }
  }
  return undefined;
}

function countPendingByKind(records: EffectRecord[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.kind ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

async function loadTaskResultPreview(
  runDir: string,
  effectId: string,
  record: EffectRecord
): Promise<{ result?: StoredTaskResult; large: boolean }> {
  const absolutePath = resolveArtifactAbsolutePath(runDir, record.resultRef ?? defaultResultRef(effectId));
  if (!absolutePath) return { result: undefined, large: false };
  try {
    const stats = await fs.stat(absolutePath);
    if (stats.size > LARGE_RESULT_PREVIEW_LIMIT) {
      return { result: undefined, large: true };
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return { result: undefined, large: false };
    }
    throw error;
  }
  const data = await readTaskResult(runDir, effectId, record.resultRef);
  return { result: data ?? undefined, large: false };
}

async function readStdinUtf8(): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

function deriveRunState(
  lastLifecycleEventType: JournalEvent["type"] | undefined,
  pendingTotal: number
): RunLifecycleState {
  if (lastLifecycleEventType === "RUN_COMPLETED") return "completed";
  if (lastLifecycleEventType === "RUN_FAILED") return "failed";
  if (pendingTotal > 0) return "waiting";
  return "created";
}

function formatLastEventSummary(event?: JournalEvent): string {
  if (!event) return "none";
  return `${event.type}#${formatSeq(event.seq)} ${event.recordedAt}`;
}

function mergeMetadataSources(
  metadata: IterationMetadata | undefined,
  options: { snapshot?: StateCacheSnapshot | null; pendingByKind?: Record<string, number> }
): IterationMetadata | undefined {
  const snapshot = options.snapshot ?? null;
  const hasPendingOverride = options.pendingByKind !== undefined;
  const snapshotHasInfo = Boolean(snapshot);
  if (!metadata && !hasPendingOverride && !snapshotHasInfo) {
    return undefined;
  }
  const next: IterationMetadata = { ...(metadata ?? {}) };
  if (hasPendingOverride) {
    next.pendingEffectsByKind = { ...(options.pendingByKind ?? {}) };
  } else if (!next.pendingEffectsByKind && snapshot) {
    next.pendingEffectsByKind = { ...snapshot.pendingEffectsByKind };
  }
  if (snapshot) {
    if (next.stateVersion === undefined) {
      next.stateVersion = snapshot.stateVersion;
    }
    if (next.journalHead === undefined) {
      next.journalHead = snapshot.journalHead ?? null;
    }
    if (snapshot.rebuildReason) {
      next.stateRebuilt = true;
      if (!next.stateRebuildReason) {
        next.stateRebuildReason = snapshot.rebuildReason;
      }
    }
  }
  if (
    next.stateVersion === undefined &&
    next.stateRebuilt === undefined &&
    next.pendingEffectsByKind === undefined &&
    next.journalHead === undefined
  ) {
    return undefined;
  }
  return next;
}

function formatIterationMetadata(
  metadata?: IterationMetadata
): { textParts: string[]; jsonMetadata?: IterationMetadata } {
  const textParts: string[] = [];
  if (!metadata) {
    return { textParts, jsonMetadata: undefined };
  }
  if (metadata.stateVersion !== undefined) {
    textParts.push(`stateVersion=${metadata.stateVersion}`);
  }
  if (metadata.journalHead && typeof metadata.journalHead.seq === "number") {
    const seq = formatSeq(metadata.journalHead.seq);
    textParts.push(`journalHead=#${seq}`);
    if (metadata.journalHead.ulid) {
      textParts.push(`journalHead.ulid=${metadata.journalHead.ulid}`);
    }
    if (metadata.journalHead.checksum) {
      textParts.push(`journalHead.checksum=${metadata.journalHead.checksum}`);
    }
  }
  if (metadata.stateRebuilt) {
    const reasonSuffix = metadata.stateRebuildReason ? `(${metadata.stateRebuildReason})` : "";
    textParts.push(`stateRebuilt=true${reasonSuffix}`);
  }
  if (metadata.pendingEffectsByKind) {
    const pendingEntries = Object.entries(metadata.pendingEffectsByKind).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const pendingTotal = pendingEntries.reduce((sum, [, count]) => sum + count, 0);
    textParts.push(`pending[total]=${pendingTotal}`);
    for (const [kind, count] of pendingEntries) {
      textParts.push(`pending[${kind}]=${count}`);
    }
  }
  return { textParts, jsonMetadata: metadata };
}

function serializeJournalEvent(event: JournalEvent, runDir: string) {
  const data = ensureIterationMetadata(event.data);
  return {
    seq: event.seq,
    ulid: event.ulid,
    type: event.type,
    recordedAt: event.recordedAt,
    filename: event.filename,
    path: toRunRelativePosix(runDir, event.path),
    data,
  };
}

function ensureIterationMetadata(data: Record<string, unknown>): Record<string, unknown> {
  const iteration = data.iteration;
  if (!iteration || typeof iteration !== "object" || Array.isArray(iteration)) {
    return data;
  }
  const iterationRecord = iteration as Record<string, unknown>;
  const metadata = iterationRecord.metadata;
  return {
    ...data,
    iteration: {
      ...iterationRecord,
      metadata: metadata === undefined ? null : metadata,
    },
  };
}

function formatEventLine(event: JournalEvent): string {
  return `#${formatSeq(event.seq)} ${event.type} ${event.recordedAt}`;
}

function formatSeq(seq: number): string {
  return seq.toString().padStart(6, "0");
}

async function readCliVersion(): Promise<string> {
  const packagePath = path.join(__dirname, "..", "..", "package.json");
  const raw = await fs.readFile(packagePath, "utf8");
  const parsed = JSON.parse(raw) as { version?: string };
  return parsed.version ?? "unknown";
}

export function createBabysitterCli() {
  return {
    async run(argv: string[] = process.argv.slice(2)): Promise<number> {
      try {
        const parsed = parseArgs(argv);
        if (parsed.command === "version") {
          console.log(await readCliVersion());
          return 0;
        }
        if (!parsed.command || parsed.helpRequested) {
          console.log(USAGE);
          return 0;
        }
        if (parsed.command === "run:create") {
          return await handleRunCreate(parsed);
        }
        if (parsed.command === "run:rebuild-state") {
          return await handleRunRebuildState(parsed);
        }
        if (parsed.command === "run:repair-journal") {
          return await handleRunRepairJournal(parsed);
        }
        if (parsed.command === "run:status") {
          return await handleRunStatus(parsed);
        }
        if (parsed.command === "run:iterate") {
          return await handleRunIterate(parsed);
        }
        if (parsed.command === "run:events") {
          return await handleRunEvents(parsed);
        }
        if (parsed.command === "task:post") {
          return await handleTaskPost(parsed);
        }
        if (parsed.command === "task:list") {
          return await handleTaskList(parsed);
        }
        if (parsed.command === "task:show") {
          return await handleTaskShow(parsed);
        }
        console.error(USAGE);
        return 1;
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
      }
    },
    formatHelp(): string {
      return USAGE;
    },
  };
}

if (require.main === module) {
  void createBabysitterCli().run();
}
