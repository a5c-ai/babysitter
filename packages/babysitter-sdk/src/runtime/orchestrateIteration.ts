import path from "path";
import { promises as fs } from "fs";
import { pathToFileURL } from "url";
import { appendEvent, loadJournal } from "../storage/journal";
import { readTaskDefinition } from "../storage/tasks";
import { writeRunOutput } from "../storage/runFiles";
import { extractCostEvents, computeRunCostStats } from "../cost/journal";
import { withRunLock } from "../storage/lock";
import { createReplayEngine, type ReplayEngine } from "./replay/createReplayEngine";
import { rebuildStateCache } from "./replay/stateCache";
import { flushProcessCleanup, withProcessContext } from "./processContext";
import { RunFailedError, RunHaltedError } from "./exceptions";
import { validateAgainstSchema } from "./schemaValidator";
import type {
  IterationResult,
  OrchestrateOptions,
  EffectAction,
  EffectRecord,
  ProcessContext,
} from "./types";
import type { JournalEvent } from "../storage/types";
import { serializeUnknownError } from "./errorUtils";
import { emitRuntimeMetric } from "./instrumentation";
import { callRuntimeHook } from "./hooks/runtime";
import { getNewEffectRequestCount, resetNewEffectRequestCount } from "./intrinsics/task";
import { resolveProjectRootForRun } from "../config";
import {
  asWaitingResult,
  resolveNow,
  annotateWaitingActions,
  createIterationMetadata,
} from "./orchestrateHelpers";
import { checkRunWorkDirLeak } from "./workDirLeak";

// Re-export for backward compatibility
export { asWaitingResult } from "./orchestrateHelpers";

type ProcessFunction = (inputs: unknown, ctx: ProcessContext, extra?: unknown) => Promise<unknown>;
const dynamicImportModule: (specifier: string) => Promise<Record<string, unknown>> = (() => {
  if (process.env.VITEST) {
    return (specifier) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<Record<string, unknown>>;
})();

export async function orchestrateIteration(options: OrchestrateOptions): Promise<IterationResult> {
  return await withRunLock(options.runDir, "runtime:orchestrateIteration", async () => {
    const iterationStartedAt = Date.now();
    const nowFn = resolveNow(options.now);
    const engine = await initializeReplayEngine(options, nowFn, iterationStartedAt);
    const defaultEntrypoint = {
      importPath: engine.metadata.entrypoint?.importPath ?? engine.metadata.processPath,
      exportName: engine.metadata.entrypoint?.exportName,
    };
    if (defaultEntrypoint.importPath === "bare-run") {
      throw new RunFailedError("Run has no process assigned. Use run:assign-process to attach a process before iterating.");
    }
    const inputs = options.inputs ?? engine.inputs;
    let finalStatus: IterationResult["status"] = "failed";
    const logger = engine.internalContext.logger ?? options.logger;
    const projectRoot = resolveProjectRootForRun(options.runDir, engine.metadata.entrypoint?.importPath);

    await callRuntimeHook("on-iteration-start", { runId: engine.runId, iteration: engine.replayCursor.value }, { cwd: projectRoot, logger });
    const terminalResult = await getTerminalReplayResult(options.runDir, engine);
    if (terminalResult) {
      finalStatus = terminalResult.status;
      await checkRunWorkDirLeak(options.runDir, logger, "terminal-replay");
      emitRuntimeMetric(logger, "replay.iteration", {
        duration_ms: Date.now() - iterationStartedAt,
        status: finalStatus,
        runId: engine.runId,
        stepCount: engine.replayCursor.value,
      });
      await callRuntimeHook(
        "on-iteration-end",
        { runId: engine.runId, iteration: engine.replayCursor.value, status: finalStatus },
        { cwd: projectRoot, logger },
      );
      return terminalResult;
    }

    const processFn = await loadProcessFunction(options, defaultEntrypoint, options.runDir);

    let capturedStrayEffect: unknown = null;
    const strayEffectHandler = (reason: unknown) => { if (asWaitingResult(reason)) capturedStrayEffect = reason; };
    process.on("unhandledRejection", strayEffectHandler);
    const preExecJournalHead = engine.effectIndex.getJournalHead()?.seq ?? 0;
    resetNewEffectRequestCount();

    try {
      const output = await withProcessContext(engine.internalContext, () => processFn(inputs, engine.context, options.context));

      const strayRequestCount = getNewEffectRequestCount();
      if (strayRequestCount > 0) {
        for (let i = 0; i < 4; i++) await new Promise<void>((resolve) => setImmediate(resolve));
        if (capturedStrayEffect) {
          const waiting = asWaitingResult(capturedStrayEffect);
          if (waiting) {
            console.warn("[babysitter] Process completed but had an un-awaited ctx.task() call. Treating as waiting.");
            finalStatus = waiting.status;
            return { status: "waiting", nextActions: annotateWaitingActions(waiting.nextActions), metadata: createIterationMetadata(engine) };
          }
        }
        await new Promise<void>((resolve) => setTimeout(resolve, 250));
        const strayEffectEvents = await detectStrayEffectEvents(options.runDir, preExecJournalHead);
        if (strayEffectEvents.length > 0) {
          console.warn(`[babysitter] Process completed but journal contains ${strayEffectEvents.length} stray EFFECT_REQUESTED event(s). Treating as waiting.`);
          const strayActions: EffectAction[] = [];
          for (const e of strayEffectEvents) {
            const data = e.data as Record<string, unknown>;
            const effectId = data.effectId as string;
            const storedDef = await readTaskDefinition(options.runDir, effectId).catch(() => null);
            const taskDef = (storedDef ?? { kind: (data.kind as string) ?? "unknown" }) as EffectAction["taskDef"];
            strayActions.push({
              effectId, invocationKey: (data.invocationKey as string) ?? "", kind: (data.kind as string) ?? "unknown",
              label: data.label as string | undefined, labels: data.labels as string[] | undefined, taskDef,
              taskId: data.taskId as string | undefined, stepId: data.stepId as string | undefined,
              taskDefRef: data.taskDefRef as string | undefined, inputsRef: data.inputsRef as string | undefined,
            });
          }
          finalStatus = "waiting";
          return { status: "waiting", nextActions: annotateWaitingActions(strayActions), metadata: createIterationMetadata(engine) };
        }
      }

      const runMeta = engine.metadata as Record<string, unknown> | undefined;
      const outputSchema = runMeta?.outputSchema as Record<string, unknown> | undefined;
      if (outputSchema) {
        const validation = validateAgainstSchema(output, outputSchema);
        if (!validation.valid) console.warn(`[babysitter] Output schema validation warning: ${validation.errors.join("; ")}`);
      }
      const legacyHalt = normalizeLegacyHalt(output);
      if (legacyHalt) {
        console.warn("[babysitter] Deprecated process return { halt: true }; use return ctx.halt(reason, payload?) instead.");
        const result = await appendRunHalted({
          runDir: options.runDir,
          engine,
          projectRoot,
          logger,
          reason: legacyHalt.reason,
          payload: legacyHalt.payload,
          iterationStartedAt,
        });
        finalStatus = result.status;
        return result;
      }
      const outputRef = await writeRunOutput(options.runDir, output);

      let costStats: unknown = undefined;
      let costError: string | undefined;
      try { const journalEvents = await loadJournal(options.runDir); const costEvents = extractCostEvents(journalEvents); if (costEvents.length > 0) costStats = computeRunCostStats(engine.runId, journalEvents); }
      catch (e) { costError = e instanceof Error ? e.message : String(e); process.stderr.write(`[babysitter] cost computation failed: ${costError}\n`); }

      await appendEvent({ runDir: options.runDir, eventType: "RUN_COMPLETED", event: { outputRef, costStats, ...(costError ? { costError } : {}) } });
      await rebuildStateCache(options.runDir, { reason: "post_completion" });
      await callRuntimeHook("on-run-complete", { runId: engine.runId, status: "completed", output, duration: Date.now() - iterationStartedAt }, { cwd: projectRoot, logger });

      const result: IterationResult = { status: "completed", output, metadata: createIterationMetadata(engine) };
      finalStatus = result.status;
      return result;
    } catch (error) {
      const waiting = asWaitingResult(error);
      if (waiting) { finalStatus = waiting.status; return { status: "waiting", nextActions: annotateWaitingActions(waiting.nextActions), metadata: createIterationMetadata(engine) }; }

      if (error instanceof RunHaltedError) {
        const result = await appendRunHalted({
          runDir: options.runDir,
          engine,
          projectRoot,
          logger,
          reason: error.reason,
          payload: error.payload,
          iterationStartedAt,
        });
        finalStatus = result.status;
        return result;
      }

      const failure = serializeUnknownError(error);
      if (!(error instanceof RunFailedError)) {
        const lastEffect = findLastEffectContext(engine.effectIndex.listEffects());
        if (lastEffect?.status !== "resolved_error") {
          await appendEvent({
            runDir: options.runDir,
            eventType: "PROCESS_RUNTIME_ERROR",
            event: {
              error: failure,
              iteration: engine.replayCursor.value,
              runId: engine.runId,
              processId: engine.metadata.processId,
              journalHead: engine.effectIndex.getJournalHead() ?? null,
              lastEffect,
              recovery: {
                command: "run:recover-process-error",
                recoverable: true,
              },
            },
          });
          await rebuildStateCache(options.runDir, { reason: "post_process_runtime_error" });
        }
        const result: IterationResult = { status: "process-error", error: failure, metadata: createIterationMetadata(engine) };
        finalStatus = result.status;
        return result;
      }

      await appendEvent({ runDir: options.runDir, eventType: "RUN_FAILED", event: { error: failure } });
      await rebuildStateCache(options.runDir, { reason: "post_failure" });
      await callRuntimeHook("on-run-fail", { runId: engine.runId, status: "failed", error: failure.message || "Unknown error", duration: Date.now() - iterationStartedAt }, { cwd: projectRoot, logger });

      const result: IterationResult = { status: "failed", error: failure, metadata: createIterationMetadata(engine) };
      finalStatus = result.status;
      return result;
    } finally {
      process.removeListener("unhandledRejection", strayEffectHandler);
      if (finalStatus !== "waiting") {
        await flushProcessCleanup(engine.internalContext, finalStatus);
        await checkRunWorkDirLeak(options.runDir, logger, `terminal-${finalStatus}`);
      }
      emitRuntimeMetric(logger, "replay.iteration", { duration_ms: Date.now() - iterationStartedAt, status: finalStatus, runId: engine.runId, stepCount: engine.replayCursor.value });
      await callRuntimeHook("on-iteration-end", { runId: engine.runId, iteration: engine.replayCursor.value, status: finalStatus }, { cwd: projectRoot, logger });
    }
  });
}

interface EntrypointDefaults { importPath?: string; exportName?: string; }

async function detectStrayEffectEvents(runDir: string, afterSeq: number) {
  const postExecJournal = await loadJournal(runDir);
  return postExecJournal.filter((e) => e.seq > afterSeq && e.type === "EFFECT_REQUESTED");
}

async function loadProcessFunction(options: OrchestrateOptions, defaults: EntrypointDefaults, runDir: string): Promise<ProcessFunction> {
  const importPath = options.process?.importPath ?? defaults.importPath;
  if (!importPath) throw new RunFailedError("Process import path is missing");
  const exportName = options.process?.exportName ?? defaults.exportName ?? "process";
  const resolvedPath = path.isAbsolute(importPath) ? importPath : path.resolve(runDir, importPath);
  const moduleUrl = pathToFileURL(resolvedPath).href;
  // Ensure NODE_PATH includes the workspace node_modules so ESM import() can
  // resolve bare specifiers like '@a5c-ai/babysitter-sdk' from process files.
  if (!process.env['NODE_PATH']?.includes('node_modules')) {
    const cwd = process.cwd();
    const sep = process.platform === 'win32' ? ';' : ':';
    process.env['NODE_PATH'] = [path.join(cwd, 'node_modules'), process.env['NODE_PATH']].filter(Boolean).join(sep);
    try { (require('module') as { _initPaths?: () => void })._initPaths?.(); } catch (e) { process.stderr.write(`[babysitter] NODE_PATH _initPaths failed: ${e instanceof Error ? e.message : String(e)}\n`); }
  }
  let mod: Record<string, unknown>;
  try { mod = await dynamicImportModule(moduleUrl); }
  catch {
    // ESM import may fail on some Node/CJS configurations. Fall back to require().
    try { delete require.cache[require.resolve(resolvedPath)]; } catch (e) { process.stderr.write(`[babysitter] require.cache clear failed for ${resolvedPath}: ${e instanceof Error ? e.message : String(e)}\n`); }
    try { mod = require(resolvedPath) as Record<string, unknown>; }
    catch (error) { throw new RunFailedError(`Failed to load process module at ${resolvedPath}`, { details: { error: serializeUnknownError(error) }, cause: error instanceof Error ? error : undefined }); }
  }
  const candidate = (exportName && mod[exportName]) ?? (!exportName && mod.default) ?? mod.process ?? mod.default;
  if (typeof candidate !== "function") throw new RunFailedError(`Export '${exportName}' was not a function in ${resolvedPath}`);
  return candidate as ProcessFunction;
}

async function getTerminalReplayResult(runDir: string, engine: ReplayEngine): Promise<IterationResult | null> {
  if (engine.effectIndex.listPendingEffects().length > 0) return null;

  const journal = await loadJournal(runDir);
  const terminalEvent = findLastTerminalEvent(journal);
  if (!terminalEvent) return null;

  const metadata = createIterationMetadata(engine);
  if (terminalEvent.type === "RUN_COMPLETED") {
    const outputRef = readStringField(terminalEvent.data, "outputRef");
    if (!outputRef) {
      throw new RunFailedError("Completed run is missing outputRef", { runDir });
    }
    const outputPath = path.resolve(runDir, outputRef);
    const output = JSON.parse(await fs.readFile(outputPath, "utf8")) as unknown;
    return { status: "completed", output, metadata };
  }

  if (terminalEvent.type === "PROCESS_RUNTIME_ERROR") {
    return {
      status: "process-error",
      error: readObjectField(terminalEvent.data, "error") ?? { message: "Process runtime error" },
      metadata,
    };
  }

  if (terminalEvent.type === "RUN_HALTED") {
    const reason = readStringField(terminalEvent.data, "reason") ?? "halted";
    return {
      status: "halted",
      reason,
      payload: readObjectField(terminalEvent.data, "payload"),
      metadata,
    };
  }

  return {
    status: "failed",
    error: readObjectField(terminalEvent.data, "error") ?? { message: "Run failed" },
    metadata,
  };
}

function findLastTerminalEvent(events: JournalEvent[]): JournalEvent | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type === "RUN_COMPLETED" || event.type === "RUN_HALTED" || event.type === "RUN_FAILED" || event.type === "PROCESS_RUNTIME_ERROR") return event;
  }
  return undefined;
}

async function appendRunHalted(args: {
  runDir: string;
  engine: ReplayEngine;
  projectRoot: string;
  logger?: ProcessContext["log"];
  reason: string;
  payload?: Record<string, unknown>;
  iterationStartedAt: number;
}): Promise<IterationResult> {
  const event: Record<string, unknown> = { reason: args.reason };
  if (args.payload !== undefined) event.payload = args.payload;
  await appendEvent({ runDir: args.runDir, eventType: "RUN_HALTED", event });
  await rebuildStateCache(args.runDir, { reason: "post_halt" });
  await callRuntimeHook(
    "on-run-fail",
    {
      runId: args.engine.runId,
      status: "halted",
      error: args.reason,
      reason: args.reason,
      payload: args.payload,
      duration: Date.now() - args.iterationStartedAt,
    },
    { cwd: args.projectRoot, logger: args.logger },
  );
  return {
    status: "halted",
    reason: args.reason,
    payload: args.payload,
    metadata: createIterationMetadata(args.engine),
  };
}

function normalizeLegacyHalt(output: unknown): { reason: string; payload: Record<string, unknown> } | null {
  if (!output || typeof output !== "object" || Array.isArray(output)) return null;
  const record = output as Record<string, unknown>;
  if (record.halt !== true) return null;
  const reasonCandidate = record.reason ?? record.phase;
  const reason = typeof reasonCandidate === "string" && reasonCandidate.trim() ? reasonCandidate.trim() : "legacy-halt";
  return { reason, payload: record };
}

function readStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" && field ? field : undefined;
}

function readObjectField(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const field = (value as Record<string, unknown>)[key];
  return field && typeof field === "object" && !Array.isArray(field) ? field as Record<string, unknown> : undefined;
}

function findLastEffectContext(effects: EffectRecord[]) {
  const resolved = effects
    .filter((effect) => effect.resolvedAt)
    .sort((a, b) => String(a.resolvedAt).localeCompare(String(b.resolvedAt)));
  const effect = resolved.at(-1) ?? effects.at(-1);
  if (!effect) return null;
  return {
    effectId: effect.effectId,
    invocationKey: effect.invocationKey,
    taskId: effect.taskId,
    stepId: effect.stepId,
    kind: effect.kind,
    status: effect.status,
    resultRef: effect.resultRef,
  };
}

async function initializeReplayEngine(options: OrchestrateOptions, nowFn: () => Date, iterationStartedAt: number): Promise<ReplayEngine> {
  try {
    return await createReplayEngine({
      runDir: options.runDir,
      now: nowFn,
      logger: options.logger,
      subprocessSupport: options.subprocessSupport,
    });
  }
  catch (error) {
    emitRuntimeMetric(options.logger, "replay.iteration", { duration_ms: Date.now() - iterationStartedAt, status: "failed", runDir: options.runDir, phase: "initialize", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
