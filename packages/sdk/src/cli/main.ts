import { promises as fs } from "node:fs";
import * as path from "node:path";
import { runNodeTaskFromCli } from "./nodeTaskRunner";
import type { CliRunNodeTaskResult } from "./nodeTaskRunner";
import { orchestrateIteration } from "../runtime/orchestrateIteration";
import { createRun } from "../runtime/createRun";
import { buildEffectIndex } from "../runtime/replay/effectIndex";
import { readStateCache, rebuildStateCache } from "../runtime/replay/stateCache";
import type { StateCacheSnapshot } from "../runtime/replay/stateCache";
import { EffectAction, EffectRecord, IterationMetadata } from "../runtime/types";
import { readTaskDefinition, readTaskResult } from "../storage/tasks";
import { loadJournal } from "../storage/journal";
import { readRunMetadata } from "../storage/runFiles";
import type { JournalEvent, RunMetadata } from "../storage/types";

const USAGE = `Usage:
  babysitter run:create --process-id <id> --entry <path#export> [--runs-dir <dir>] [--inputs <file>] [--run-id <id>] [--process-revision <rev>] [--request <id>] [--json] [--dry-run]
  babysitter run:status <runDir> [--runs-dir <dir>] [--json]
  babysitter run:events <runDir> [--runs-dir <dir>] [--json] [--limit <n>] [--reverse] [--filter-type <type>]
  babysitter run:rebuild-state <runDir> [--runs-dir <dir>] [--json] [--dry-run]
  babysitter task:run <runDir> <effectId> [--runs-dir <dir>] [--json] [--dry-run]
  babysitter run:step <runDir> [--runs-dir <dir>] [--json] [--now <iso8601>]
  babysitter run:continue <runDir> [--runs-dir <dir>] [--json] [--dry-run] [--auto-node-tasks]
  babysitter task:list <runDir> [--runs-dir <dir>] [--pending] [--kind <kind>] [--json]
  babysitter task:show <runDir> <effectId> [--runs-dir <dir>] [--json]

Global flags:
  --runs-dir <dir>   Override the runs directory (defaults to current working directory).
  --json             Emit JSON output when supported by the command.
  --dry-run          Describe planned mutations without changing on-disk state.
  --verbose          Log resolved paths and options to stderr for debugging.
  --help, -h         Show this help text.`;

interface ParsedArgs {
  command?: string;
  runsDir: string;
  json: boolean;
  dryRun: boolean;
  verbose: boolean;
  helpRequested: boolean;
  autoNodeTasks: boolean;
  pendingOnly: boolean;
  kindFilter?: string;
  limit?: number;
  reverseOrder: boolean;
  filterType?: string;
  runDirArg?: string;
  effectId?: string;
  processId?: string;
  entrySpecifier?: string;
  inputsPath?: string;
  runIdOverride?: string;
  processRevision?: string;
  requestId?: string;
  nowOverride?: string;
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
  taskDefRef?: string;
  inputsRef?: string;
  resultRef?: string;
  stdoutRef?: string;
  stderrRef?: string;
  requestedAt?: string;
  resolvedAt?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [initialCommand, ...rest] = argv;
  const parsed: ParsedArgs = {
    command: initialCommand,
    runsDir: ".",
    json: false,
    dryRun: false,
    verbose: false,
    helpRequested: false,
    autoNodeTasks: false,
    pendingOnly: false,
    reverseOrder: false,
  };
  if (parsed.command === "--help" || parsed.command === "-h") {
    parsed.command = undefined;
    parsed.helpRequested = true;
  }
  const positionals: string[] = [];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--help" || arg === "-h") {
      parsed.helpRequested = true;
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
    if (arg === "--auto-node-tasks") {
      parsed.autoNodeTasks = true;
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
      const parsedLimit = Number(raw);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        throw new Error("--limit must be a positive integer");
      }
      parsed.limit = Math.floor(parsedLimit);
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
    if (arg === "--now") {
      parsed.nowOverride = expectFlagValue(rest, ++i, "--now");
      continue;
    }
    positionals.push(arg);
  }
  if (parsed.command === "task:run") {
    [parsed.runDirArg, parsed.effectId] = positionals;
  } else if (parsed.command === "run:continue") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "task:list") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "task:show") {
    [parsed.runDirArg, parsed.effectId] = positionals;
  } else if (parsed.command === "run:status") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:events") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:rebuild-state") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:step") {
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

function logRunContinueStatus(
  iterationStatus: "completed" | "failed" | "waiting",
  executedCount: number,
  metadataParts: string[],
  options: { dryRun: boolean }
) {
  const parts = [`[run:continue] status=${iterationStatus}`];
  if (options.dryRun) {
    parts.push("dryRun=true");
  }
  if (executedCount > 0) {
    parts.push(`autoNode=${executedCount}`);
  }
  parts.push(...metadataParts);
  console.error(parts.join(" "));
}

function logAutoRunPlan(nodeSummaries: ActionSummary[]) {
  console.error(`[run:continue] dry-run auto-node tasks count=${nodeSummaries.length}`);
  if (!nodeSummaries.length) {
    return;
  }
  for (const summary of nodeSummaries) {
    const label = summary.label ? ` ${summary.label}` : "";
    console.error(`  - ${summary.effectId} [${summary.kind}]${label}`);
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

function logVerbose(command: string, parsed: ParsedArgs, details: Record<string, unknown>) {
  if (!parsed.verbose) return;
  const formatted = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatVerboseValue(value)}`)
    .join(" ");
  console.error(`[${command}] verbose ${formatted}`);
}

function determineTaskStatus(result: CliRunNodeTaskResult): string {
  if (result.timedOut) return "timeout";
  if (result.exitCode == null) return "skipped";
  return result.exitCode === 0 ? "ok" : "error";
}

function toRunRelativePosix(runDir: string, absolutePath?: string): string | undefined {
  if (!absolutePath) return undefined;
  return path.relative(runDir, absolutePath).replace(/\\/g, "/");
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

async function readInputsFile(filePath: string): Promise<unknown> {
  const absolute = path.resolve(filePath);
  let contents: string;
  try {
    contents = await fs.readFile(absolute, "utf8");
  } catch (error) {
    throw new Error(`Failed to read inputs file ${absolute}: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    return JSON.parse(contents);
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
  let inputs: unknown | undefined;
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
  const iterationMetadata: IterationMetadata = {
    pendingEffectsByKind: pendingByKind,
  };
  if (stateSnapshot) {
    iterationMetadata.stateVersion = stateSnapshot.stateVersion;
    iterationMetadata.journalHead = stateSnapshot.journalHead ?? null;
    if (stateSnapshot.rebuildReason) {
      iterationMetadata.stateRebuilt = true;
      iterationMetadata.stateRebuildReason = stateSnapshot.rebuildReason;
    }
  }
  const formattedMetadata = formatIterationMetadata(iterationMetadata);
  const lastEvent = journal.at(-1);
  const lastLifecycleEvent = findLastLifecycleEvent(journal);
  const state = deriveRunState(lastLifecycleEvent?.type, pendingTotal);
  const lastSummary = formatLastEventSummary(lastEvent);
  if (parsed.json) {
    console.log(
      JSON.stringify({
        state,
        lastEvent: lastEvent ? serializeJournalEvent(lastEvent, runDir) : null,
        pendingByKind,
        metadata: formattedMetadata.jsonMetadata ?? null,
      })
    );
    return 0;
  }
  const suffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  console.log(`[run:status] state=${state} last=${lastSummary}${suffix}`);
  return 0;
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
  const journal = await loadJournalSafe(runDir, "run:events");
  if (!journal) return 1;

  const filterType = parsed.filterType ? parsed.filterType.toUpperCase() : undefined;
  const filtered = filterType ? journal.filter((event) => event.type.toUpperCase() === filterType) : journal;
  const orderedBase = filtered.slice();
  const ordered = parsed.reverseOrder ? orderedBase.reverse() : orderedBase;
  const limited = parsed.limit !== undefined ? ordered.slice(0, parsed.limit) : ordered;

  if (parsed.json) {
    console.log(JSON.stringify({ events: limited.map((event) => serializeJournalEvent(event, runDir)) }));
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
  console.log(`[run:events] ${headerParts.join(" ")}`);
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

async function handleTaskRun(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("task:run", parsed, {
    runDir,
    effectId: parsed.effectId,
    dryRun: parsed.dryRun,
    json: parsed.json,
  });
  const result = await runNodeTaskFromCli({
    runDir,
    effectId: parsed.effectId,
    dryRun: parsed.dryRun,
  });
  const status = determineTaskStatus(result);
  const stdoutRef = toRunRelativePosix(runDir, result.io.stdoutPath);
  const stderrRef = toRunRelativePosix(runDir, result.io.stderrPath);
  const outputRef = toRunRelativePosix(runDir, result.io.outputJsonPath);
  if (parsed.json) {
    console.log(
      JSON.stringify({
        status,
        committed: result.committed ?? null,
        stdoutRef,
        stderrRef,
        resultRef: outputRef,
      })
    );
  } else {
    console.log(`[task:run] status=${status}`);
    if (stdoutRef) console.log(`stdoutRef=${stdoutRef}`);
    if (stderrRef) console.log(`stderrRef=${stderrRef}`);
    if (outputRef) console.log(`resultRef=${outputRef}`);
  }
  return 0;
}

async function autoRunNodeTasks(
  runDir: string,
  actions: EffectAction[],
  parsed: ParsedArgs,
  executed: ActionSummary[]
) {
  for (const action of actions) {
    const summary: ActionSummary = {
      effectId: action.effectId,
      kind: action.kind,
      label: action.label,
    };
    executed.push(summary);
    const label = summary.label ? ` ${summary.label}` : "";
    console.error(`[auto-run] ${summary.effectId} [${summary.kind}]${label}`);
    await runNodeTaskFromCli({
      runDir,
      effectId: action.effectId,
      task: action.taskDef,
      invocationKey: action.invocationKey,
      dryRun: parsed.dryRun,
    });
  }
}

function emitJsonResult(
  iteration:
    | { status: "completed"; output: unknown }
    | { status: "failed"; error: unknown }
    | { status: "waiting" },
  context: {
    executed: ActionSummary[];
    pending: ActionSummary[];
    autoPending: ActionSummary[];
    metadata?: IterationMetadata | null;
    error?: unknown;
    output?: unknown;
  }
) {
  const payload: Record<string, unknown> = {
    status: iteration.status,
    autoRun: { executed: context.executed, pending: context.autoPending },
    metadata: context.metadata ?? null,
  };
  if (iteration.status === "completed") {
    payload.output = context.output;
  } else if (iteration.status === "failed") {
    payload.error = context.error ?? null;
  } else {
    payload.pending = context.pending;
  }
  console.log(JSON.stringify(payload));
}

async function handleRunContinue(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  if (parsed.nowOverride) {
    console.error("[run:continue] --now is not supported; use run:step for single iterations");
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:continue", parsed, {
    runDir,
    dryRun: parsed.dryRun,
    json: parsed.json,
    autoNodeTasks: parsed.autoNodeTasks,
  });
  if (!(await readRunMetadataSafe(runDir, "run:continue"))) return 1;
  const executed: ActionSummary[] = [];

  while (true) {
    const iteration = await orchestrateIteration({ runDir });
    const pendingActions = iteration.status === "waiting" ? iteration.nextActions : undefined;
    const metadata = enrichIterationMetadata(iteration.metadata, pendingActions);
    const formattedMetadata = formatIterationMetadata(metadata);
    logRunContinueStatus(iteration.status, executed.length, formattedMetadata.textParts, {
      dryRun: parsed.dryRun,
    });

    if (iteration.status === "waiting") {
      const pending = logPendingActions(iteration.nextActions, {
        command: "run:continue",
        includeHeader: false,
      });
      logSleepHints("run:continue", iteration.nextActions);
      const nodeActions = iteration.nextActions.filter((action) => action.kind === "node");
      const nodeSummaries = summarizeActions(nodeActions);
      if (parsed.autoNodeTasks && nodeActions.length > 0) {
        if (parsed.dryRun) {
          logAutoRunPlan(nodeSummaries);
          if (parsed.json) {
            emitJsonResult(
              { status: "waiting" },
              {
                executed,
                pending,
                autoPending: nodeSummaries,
                metadata: formattedMetadata.jsonMetadata ?? null,
              }
            );
          }
          return 0;
        }
        await autoRunNodeTasks(runDir, nodeActions, parsed, executed);
        continue;
      }
      if (parsed.json) {
        emitJsonResult(
          { status: "waiting" },
          {
            executed,
            pending,
            autoPending: nodeSummaries,
            metadata: formattedMetadata.jsonMetadata ?? null,
          }
        );
      }
      return 0;
    }

    if (iteration.status === "completed") {
      if (parsed.json) {
        emitJsonResult(
          { status: "completed" },
          {
            executed,
            pending: [],
            autoPending: [],
            metadata: formattedMetadata.jsonMetadata ?? null,
            output: iteration.output,
          }
        );
      }
      return 0;
    }

    if (parsed.json) {
      emitJsonResult(
        { status: "failed" },
        {
          executed,
          pending: [],
          autoPending: [],
          metadata: formattedMetadata.jsonMetadata ?? null,
          error: iteration.error ?? null,
        }
      );
    } else if (iteration.error !== undefined) {
      console.error(iteration.error);
    }
    return 1;
  }
}

function parseNowOverride(nowOverride?: string): Date | null {
  if (!nowOverride) return null;
  const parsed = new Date(nowOverride);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`--now must be a valid ISO 8601 timestamp (received: ${nowOverride})`);
  }
  return parsed;
}

async function handleRunStep(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:step", parsed, {
    runDir,
    now: parsed.nowOverride ?? "auto",
    json: parsed.json,
  });
  if (!(await readRunMetadataSafe(runDir, "run:step"))) return 1;

  let now: Date;
  try {
    now = parseNowOverride(parsed.nowOverride) ?? new Date();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const iteration = await orchestrateIteration({ runDir, now });
  const pendingActions = iteration.status === "waiting" ? iteration.nextActions : undefined;
  const metadata = enrichIterationMetadata(iteration.metadata, pendingActions);
  const formattedMetadata = formatIterationMetadata(metadata);
  if (parsed.json) {
    console.log(JSON.stringify({ ...iteration, metadata: formattedMetadata.jsonMetadata ?? null }));
    return iteration.status === "failed" ? 1 : 0;
  }

  if (iteration.status === "completed") {
    const output = JSON.stringify(iteration.output ?? null);
    const suffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
    console.error(`[run:step] status=completed output=${output}${suffix}`);
    return 0;
  }

  if (iteration.status === "waiting") {
    logPendingActions(iteration.nextActions, {
      command: "run:step",
      metadataParts: formattedMetadata.textParts,
    });
    logSleepHints("run:step", iteration.nextActions);
    return 0;
  }

  const suffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  console.error(`[run:step] status=failed${suffix}`);
  if (iteration.error !== undefined) {
    console.error(iteration.error);
  }
  return 1;
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
    console.log(`- ${entry.effectId} [${entry.kind ?? "unknown"} ${entry.status}]${label} (taskId=${entry.taskId})`);
  }
  return 0;
}

async function handleTaskShow(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("task:show", parsed, {
    runDir,
    effectId: parsed.effectId,
    json: parsed.json,
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
  const result = await readTaskResult(runDir, parsed.effectId, record.resultRef);
  const entry = toTaskListEntry(record, runDir);

  if (parsed.json) {
    console.log(
      JSON.stringify({
        effect: entry,
        task: taskDef,
        result: result ?? null,
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
  if (entry.resultRef) console.log(`  resultRef=${entry.resultRef}`);
  if (entry.stdoutRef) console.log(`  stdoutRef=${entry.stdoutRef}`);
  if (entry.stderrRef) console.log(`  stderrRef=${entry.stderrRef}`);
  console.log("  taskDef:", JSON.stringify(taskDef, null, 2));
  if (result) {
    console.log("  result:", JSON.stringify(result, null, 2));
  } else {
    console.log("  result: (not yet written)");
  }
  return 0;
}

function toTaskListEntry(record: EffectRecord, runDir: string): TaskListEntry {
  return {
    effectId: record.effectId,
    taskId: record.taskId,
    stepId: record.stepId,
    status: record.status,
    kind: record.kind,
    label: record.label,
    labels: record.labels,
    taskDefRef: toRunRelativePosix(runDir, record.taskDefRef),
    inputsRef: toRunRelativePosix(runDir, record.inputsRef),
    resultRef: toRunRelativePosix(runDir, record.resultRef),
    stdoutRef: toRunRelativePosix(runDir, record.stdoutRef),
    stderrRef: toRunRelativePosix(runDir, record.stderrRef),
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
  if (metadata.stateRebuilt) {
    const reasonSuffix = metadata.stateRebuildReason ? `(${metadata.stateRebuildReason})` : "";
    textParts.push(`stateRebuilt=true${reasonSuffix}`);
  }
  const pendingEntries = Object.entries(metadata.pendingEffectsByKind ?? {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const pendingTotal = pendingEntries.reduce((sum, [, count]) => sum + count, 0);
  textParts.push(`pending[total]=${pendingTotal}`);
  for (const [kind, count] of pendingEntries) {
    textParts.push(`pending[${kind}]=${count}`);
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

export function createBabysitterCli() {
  return {
    async run(argv: string[] = process.argv.slice(2)): Promise<number> {
      try {
        const parsed = parseArgs(argv);
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
        if (parsed.command === "run:status") {
          return await handleRunStatus(parsed);
        }
        if (parsed.command === "run:events") {
          return await handleRunEvents(parsed);
        }
        if (parsed.command === "task:run") {
          return await handleTaskRun(parsed);
        }
        if (parsed.command === "run:step") {
          return await handleRunStep(parsed);
        }
        if (parsed.command === "run:continue") {
          return await handleRunContinue(parsed);
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

// TODO: add richer flags, docs, and automated tests now that auto-node looping exists.
if (require.main === module) {
  void createBabysitterCli().run();
}
