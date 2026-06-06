import * as crypto from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { createRun } from "../../runtime/createRun";
import { loadJournal } from "../../storage/journal";
import { writeFileAtomic } from "../../storage/atomic";
import { rebuildStateCache } from "../../runtime/replay/stateCache";
import type { IterationMetadata } from "../../runtime/types";
import type { JournalEvent, JsonRecord } from "../../storage/types";
import { nextUlid } from "../../storage/ulids";
import {
  getAdapter,
  getAdapterByName,
  getSessionResolutionDetails,
  HarnessCapability,
  type HarnessAdapter,
} from "../../harness";
import { discoverFromProcessFile, discoverSkillsInternal } from "../commands/skill";
import { runIterate, type RunIterateResult } from "../commands/runIterate";
import { getActiveProcessLibraryPath } from "../../processLibrary/active";
import { collapseDoubledA5cRuns, resolveRunDir } from "./args";
import {
  formatEntrypointSpecifier,
  formatResolvedEntrypoint,
  isJsonRecord,
  logVerbose,
  parseEntrypointSpecifier,
  readInputsFile,
  validateProcessEntrypoint,
} from "./runSupport";
import { formatIterationMetadata, readRunMetadataSafe } from "./runState";
import type { ParsedArgs } from "./types";
import { USAGE } from "./usage";

export async function handleRunCreate(parsed: ParsedArgs): Promise<number> {
  // --entry is optional for bare runs (no process attached)
  const isBareRun = !parsed.entrySpecifier;
  if (!parsed.processId && !isBareRun) {
    console.error("--process-id is required for run:create (unless creating a bare run without --entry)");
    console.error(USAGE);
    return 1;
  }

  let entrypoint: { importPath: string; exportName?: string } | undefined;
  if (!isBareRun) {
    try {
      const specifier = parsed.entrySpecifier ?? "";
      entrypoint = parseEntrypointSpecifier(specifier);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  const runsDir = collapseDoubledA5cRuns(path.resolve(parsed.runsDir));
  const absoluteImportPath = entrypoint ? path.resolve(entrypoint.importPath) : undefined;
  const resolvedEntry = absoluteImportPath ? formatResolvedEntrypoint(absoluteImportPath, entrypoint?.exportName) : "bare-run";
  logVerbose("run:create", parsed, {
    runsDir,
    processId: parsed.processId,
    entry: resolvedEntry,
    dryRun: parsed.dryRun,
    json: parsed.json,
    request: parsed.requestId,
    prompt: parsed.prompt,
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
      console.log(JSON.stringify(summary, null, 2));
    } else {
      const parts = ["[run:create] dry-run", `runsDir=${runsDir}`, `processId=${parsed.processId}`, `entry=${resolvedEntry}`, `runId=${summary.runId ?? "auto"}`];
      if (parsed.requestId) parts.push(`request=${parsed.requestId}`);
      if (parsed.processRevision) parts.push(`processRevision=${parsed.processRevision}`);
      if (summary.inputsPath) parts.push(`inputs=${summary.inputsPath}`);
      console.log(parts.join(" "));
    }
    return 0;
  }

  if (!isBareRun && absoluteImportPath) {
    try {
      await validateProcessEntrypoint(absoluteImportPath, entrypoint?.exportName);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  const requestedHarness = parsed.harness ?? (parsed.sessionId ? getAdapter().name : undefined);
  const result = await createRun({
    runsDir,
    runId: parsed.runIdOverride,
    request: parsed.requestId,
    prompt: parsed.prompt,
    harness: requestedHarness,
    processRevision: parsed.processRevision,
    ...(!isBareRun && absoluteImportPath && parsed.processId ? {
      process: {
        processId: parsed.processId,
        importPath: absoluteImportPath,
        exportName: entrypoint?.exportName,
      },
    } : {}),
    inputs,
    ...(parsed.interactive === false ? { metadata: { nonInteractive: true } } : {}),
  });

  const detectedAdapter = parsed.harness ? getAdapterByName(parsed.harness) : getAdapter();
  const shouldBindSession = parsed.sessionId !== undefined || parsed.harness !== undefined || (detectedAdapter && detectedAdapter.name !== "custom");
  const adapter = shouldBindSession ? detectedAdapter : undefined;
  if (parsed.sessionId && adapter?.autoResolvesSessionId?.()) {
    const message = `The "${adapter.name}" harness auto-detects session IDs. Do not pass --session-id explicitly when running inside ${adapter.name}.`;
    if (parsed.json) {
      console.log(JSON.stringify({ error: "SESSION_ID_CONFLICT", message }));
    } else {
      process.stderr.write(`Error: ${message}\n`);
    }
    return 1;
  }

  let sessionBound;
  if (adapter) {
    const sessionId = adapter.resolveSessionId(parsed);
    sessionBound = sessionId
      ? await adapter.bindSession({
          sessionId,
          runId: result.runId,
          runDir: result.runDir,
          pluginRoot: adapter.resolvePluginRoot(parsed),
          stateDir: parsed.stateDir,
          runsDir,
          maxIterations: parsed.maxIterations,
          prompt: parsed.prompt ?? "",
          verbose: parsed.verbose,
          json: parsed.json,
        })
      : {
          harness: parsed.harness ?? adapter.name,
          sessionId: "",
          error: adapter.getMissingSessionIdHint?.() ?? "No session ID provided. Use --session-id or set AGENT_SESSION_ID.",
        };
  } else if (parsed.sessionId !== undefined && parsed.harness) {
    sessionBound = { harness: parsed.harness, sessionId: "", error: `Unsupported harness: ${parsed.harness}` };
  }

  let initialIteration: RunIterateResult | undefined;
  if (await shouldSeedInitialIterationAfterRunCreate({
    isBareRun,
    adapter,
    sessionBound,
    runDir: result.runDir,
  })) {
    initialIteration = await runIterate({
      runDir: result.runDir,
      iteration: 1,
      verbose: parsed.verbose,
      json: parsed.json,
      harnessCapabilities: adapter?.getCapabilities?.(),
    });
  }

  let discoveredSkills: Array<{ name: string; file?: string }> | undefined;
  let discoveredAgents: Array<{ name: string; file?: string }> | undefined;
  const discoverPluginRoot = parsed.pluginRoot ?? adapter?.resolvePluginRoot(parsed);
  if (discoverPluginRoot) {
    try {
      const processDiscovery = absoluteImportPath ? discoverFromProcessFile({ processFilePath: absoluteImportPath, pluginRoot: discoverPluginRoot }) : undefined;
      if (processDiscovery) {
        discoveredSkills = processDiscovery.skills;
        discoveredAgents = processDiscovery.agents;
      } else {
        const libraryPath = await getActiveProcessLibraryPath();
        const discoverResult = await discoverSkillsInternal({
          pluginRoot: discoverPluginRoot,
          libraryPath: libraryPath || undefined,
          runId: result.runId,
          runsDir,
          processPath: absoluteImportPath,
        });
        discoveredSkills = discoverResult.skills.map((skill) => ({ name: skill.name, file: skill.file }));
        discoveredAgents = discoverResult.agents.map((agent) => ({ name: agent.name, file: agent.file }));
      }
    } catch {
      // Discovery is best-effort.
    }
  }

  const entrySpec = formatEntrypointSpecifier(result.metadata.entrypoint);
  if (parsed.json) {
    let sessionOut: unknown = sessionBound ?? undefined;
    if (sessionBound && adapter?.name === "claude-code") {
      const details = getSessionResolutionDetails("claude-code", parsed.sessionId);
      if (details) {
        sessionOut = {
          ...sessionBound,
          resolvedFrom: details.resolvedFrom,
          ancestorPid: details.ancestorPid,
          ancestorAlive: details.ancestorAlive,
        };
      }
    }
    console.log(
      JSON.stringify(
        {
          runId: result.runId,
          runDir: result.runDir,
          entry: entrySpec,
          session: sessionOut,
          ...(initialIteration ? { initialIteration } : {}),
          discoveredSkills: summarizeDiscovery(discoveredSkills, parsed.verbose),
          discoveredAgents: summarizeDiscovery(discoveredAgents, parsed.verbose),
        },
        null,
        2
      )
    );
  } else {
    console.log(`[run:create] runId=${result.runId} runDir=${result.runDir} entry=${entrySpec}`);
    if (sessionBound?.error) {
      console.error(`[run:create] Session binding error: ${sessionBound.error}`);
    } else if (sessionBound) {
      console.log(`[run:create] session=${sessionBound.sessionId} bound via ${sessionBound.harness} stateFile=${sessionBound.stateFile}`);
    }
    if (initialIteration) {
      console.log(`[run:create] initialIteration status=${initialIteration.status} reason=${initialIteration.reason ?? ""}`);
    }
  }
  return sessionBound?.fatal ? 1 : 0;
}

async function shouldSeedInitialIterationAfterRunCreate(args: {
  isBareRun: boolean;
  adapter?: HarnessAdapter | null;
  sessionBound?: { sessionId?: string; error?: string; fatal?: boolean };
  runDir: string;
}): Promise<boolean> {
  if (args.isBareRun) return false;
  if (args.adapter?.name !== "claude-code") return false;
  if (!args.adapter.getCapabilities?.().includes(HarnessCapability.StopHook)) return false;
  if (!args.sessionBound?.sessionId || args.sessionBound.error || args.sessionBound.fatal) return false;

  const journal = await loadJournal(args.runDir);
  return journal.length === 1 && journal[0]?.type === "RUN_CREATED";
}

function summarizeDiscovery(
  entries: Array<{ name: string; file?: string }> | undefined,
  verbose: boolean
) {
  if (verbose || !entries) {
    return entries;
  }
  return { count: entries.length, names: entries.map((entry) => entry.name) };
}

export async function handleRunRebuildState(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:rebuild-state", parsed, { runDir, dryRun: parsed.dryRun, json: parsed.json });
  if (!(await readRunMetadataSafe(runDir, "run:rebuild-state"))) return 1;

  if (parsed.dryRun) {
    const plan = { dryRun: true, runDir, plan: "rebuild_state_cache", reason: "cli_manual" };
    if (parsed.json) {
      console.log(JSON.stringify(plan, null, 2));
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
    console.log(JSON.stringify({ runDir, metadata: formatted.jsonMetadata ?? null }, null, 2));
  } else {
    const suffix = formatted.textParts.length ? ` ${formatted.textParts.join(" ")}` : "";
    console.log(`[run:rebuild-state] runDir=${runDir}${suffix}`);
  }
  return 0;
}

export async function handleRunRepairJournal(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:repair-journal", parsed, { runDir, dryRun: parsed.dryRun, json: parsed.json });
  if (!(await readRunMetadataSafe(runDir, "run:repair-journal"))) return 1;

  const journalDir = path.join(runDir, "journal");
  const files = (await fs.readdir(journalDir)).filter((name) => name.endsWith(".json")).sort();
  const rawEvents: Array<{ payload: { type?: unknown; recordedAt?: unknown; data?: unknown } }> = [];
  let droppedCorrupt = 0;
  for (const filename of files) {
    try {
      rawEvents.push({
        payload: JSON.parse(await fs.readFile(path.join(journalDir, filename), "utf8")) as {
          type?: unknown;
          recordedAt?: unknown;
          data?: unknown;
        },
      });
    } catch {
      droppedCorrupt += 1;
    }
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
    }
    kept.push({ type, recordedAt, data });
  }

  const summary = { runDir, journal: { originalFiles: files.length, keptEvents: kept.length, droppedCorrupt, droppedRequested, droppedResolved } };
  if (parsed.dryRun) {
    if (parsed.json) {
      console.log(JSON.stringify({ dryRun: true, ...summary }, null, 2));
    } else {
      console.log(`[run:repair-journal] dry-run originalFiles=${files.length} keptEvents=${kept.length} droppedCorrupt=${droppedCorrupt} droppedRequested=${droppedRequested} droppedResolved=${droppedResolved}`);
    }
    return 0;
  }

  const stamp = Date.now();
  const repairedDir = path.join(runDir, `journal.repaired.${stamp}`);
  await fs.mkdir(repairedDir, { recursive: true });
  for (let i = 0; i < kept.length; i += 1) {
    const eventPayload: JsonRecord = {
      type: kept[i].type,
      recordedAt: kept[i].recordedAt ?? new Date().toISOString(),
      data: kept[i].data,
    };
    const contents = JSON.stringify(eventPayload, null, 2) + "\n";
    const checksum = crypto.createHash("sha256").update(contents).digest("hex");
    await fs.writeFile(
      path.join(repairedDir, `${String(i + 1).padStart(6, "0")}.${nextUlid()}.json`),
      JSON.stringify({ ...eventPayload, checksum }, null, 2) + "\n",
      "utf8"
    );
  }

  const backupDir = path.join(runDir, `journal.bak.${stamp}`);
  await fs.rename(journalDir, backupDir);
  await fs.rename(repairedDir, journalDir);
  if (parsed.json) {
    console.log(JSON.stringify({ ...summary, backupDir, repaired: true }, null, 2));
  } else {
    console.log(`[run:repair-journal] repaired originalFiles=${files.length} keptEvents=${kept.length} droppedCorrupt=${droppedCorrupt} droppedRequested=${droppedRequested} droppedResolved=${droppedResolved} backupDir=${backupDir}`);
  }
  return 0;
}

export async function handleRunRecoverProcessError(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:recover-process-error", parsed, { runDir, dryRun: parsed.dryRun, json: parsed.json, patchEffect: parsed.patchEffect });
  if (!(await readRunMetadataSafe(runDir, "run:recover-process-error"))) return 1;

  let patch: ParsedPatch | null = null;
  if (parsed.patchEffect) {
    try {
      patch = parsePatchEffect(parsed.patchEffect);
    } catch (error) {
      console.error(`[run:recover-process-error] ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  const journal = await loadJournal(runDir);
  const processError = findLatestProcessRuntimeError(journal);
  if (!processError) {
    console.error("[run:recover-process-error] no PROCESS_RUNTIME_ERROR event found");
    return 1;
  }

  if (patch) {
    const resultPath = path.join(runDir, "tasks", patch.effectId, "result.json");
    try {
      const parsedResult = JSON.parse(await fs.readFile(resultPath, "utf8")) as unknown;
      applyTaskResultPatch(parsedResult, patch.path, patch.value);
    } catch (error) {
      console.error(`[run:recover-process-error] ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }

  const summaryBase = {
    runDir,
    dryRun: parsed.dryRun,
    recovered: !parsed.dryRun,
    processError: {
      type: processError.type,
      seq: processError.seq,
      data: processError.data,
    },
    patchedEffect: patch ? { effectId: patch.effectId, path: patch.path.join(".") } : null,
  };

  if (parsed.dryRun) {
    if (parsed.json) console.log(JSON.stringify(summaryBase, null, 2));
    else console.log(`[run:recover-process-error] dry-run runDir=${runDir} processError=#${String(processError.seq).padStart(6, "0")}`);
    return 0;
  }

  if (patch) {
    const resultPath = path.join(runDir, "tasks", patch.effectId, "result.json");
    const parsedResult = JSON.parse(await fs.readFile(resultPath, "utf8")) as unknown;
    applyTaskResultPatch(parsedResult, patch.path, patch.value);
    await writeFileAtomic(resultPath, JSON.stringify(parsedResult, null, 2) + "\n");
  }

  const backupDir = await rewriteJournalWithoutEvent(runDir, processError);
  const snapshot = await rebuildStateCache(runDir, { reason: "process_error_recovery" });
  const summary = {
    ...summaryBase,
    backupDir,
    metadata: formatIterationMetadata({
      pendingEffectsByKind: snapshot.pendingEffectsByKind,
      stateVersion: snapshot.stateVersion,
      journalHead: snapshot.journalHead ?? null,
      stateRebuilt: true,
      stateRebuildReason: snapshot.rebuildReason ?? undefined,
    }).jsonMetadata ?? null,
  };
  if (parsed.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`[run:recover-process-error] recovered runDir=${runDir} backupDir=${backupDir}`);
  }
  return 0;
}

interface ParsedPatch {
  effectId: string;
  path: string[];
  value: unknown;
}

function findLatestProcessRuntimeError(events: JournalEvent[]): JournalEvent | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index].type === "PROCESS_RUNTIME_ERROR") return events[index];
  }
  return undefined;
}

function parsePatchEffect(raw: string): ParsedPatch {
  const colon = raw.indexOf(":");
  const equals = raw.indexOf("=", colon + 1);
  if (colon <= 0 || equals <= colon + 1) {
    throw new Error("--patch-effect must use <effectId>:<jsonPath>=<json>");
  }
  const effectId = raw.slice(0, colon);
  const pathText = raw.slice(colon + 1, equals);
  const valueText = raw.slice(equals + 1);
  const segments = pathText.split(".").filter(Boolean);
  if (!effectId || segments.length === 0 || segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
    throw new Error("--patch-effect path must contain dot-separated object keys");
  }
  let value: unknown;
  try {
    value = JSON.parse(valueText);
  } catch {
    throw new Error("--patch-effect value must be valid JSON");
  }
  return { effectId, path: segments, value };
}

function applyJsonPath(target: unknown, segments: string[], value: unknown): void {
  if (!isJsonRecord(target)) {
    throw new Error("task result artifact must contain a JSON object");
  }
  let cursor: JsonRecord = target;
  for (const segment of segments.slice(0, -1)) {
    const next = cursor[segment];
    if (next === undefined) {
      cursor[segment] = {};
    } else if (!isJsonRecord(next)) {
      throw new Error(`cannot patch through non-object path segment '${segment}'`);
    }
    cursor = cursor[segment] as JsonRecord;
  }
  cursor[segments.at(-1) as string] = value;
}

function applyTaskResultPatch(target: unknown, segments: string[], value: unknown): void {
  if (!isJsonRecord(target)) {
    throw new Error("task result artifact must contain a JSON object");
  }

  if (isStoredResultValuePatch(target, segments)) {
    const valueKey = isJsonRecord(target.value) ? "value" : "result";
    applyJsonPath(target[valueKey], segments, value);
    return;
  }

  applyJsonPath(target, segments, value);
}

function isStoredResultValuePatch(target: JsonRecord, segments: string[]): boolean {
  const firstSegment = segments[0];
  if (firstSegment === "value" || firstSegment === "result") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(target, firstSegment)) {
    return false;
  }
  return isJsonRecord(target.value) || isJsonRecord(target.result);
}

async function rewriteJournalWithoutEvent(runDir: string, target: JournalEvent): Promise<string> {
  const journalDir = path.join(runDir, "journal");
  const events = (await loadJournal(runDir)).filter((event) => event.path !== target.path);
  const stamp = Date.now();
  const repairedDir = path.join(runDir, `journal.process-error-recovered.${stamp}`);
  await fs.mkdir(repairedDir, { recursive: true });
  for (let i = 0; i < events.length; i += 1) {
    const eventPayload: JsonRecord = {
      type: events[i].type,
      recordedAt: events[i].recordedAt,
      data: events[i].data,
    };
    const contents = JSON.stringify(eventPayload, null, 2) + "\n";
    const checksum = crypto.createHash("sha256").update(contents).digest("hex");
    await fs.writeFile(
      path.join(repairedDir, `${String(i + 1).padStart(6, "0")}.${nextUlid()}.json`),
      JSON.stringify({ ...eventPayload, checksum }, null, 2) + "\n",
      "utf8",
    );
  }
  const backupDir = path.join(runDir, `journal.process-error.bak.${stamp}`);
  await fs.rename(journalDir, backupDir);
  await fs.rename(repairedDir, journalDir);
  return backupDir;
}
