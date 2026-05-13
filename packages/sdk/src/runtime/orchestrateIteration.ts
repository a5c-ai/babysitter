import path from "path";
import { pathToFileURL } from "url";
import { appendEvent, loadJournal } from "../storage/journal";
import { readTaskDefinition } from "../storage/tasks";
import { writeRunOutput } from "../storage/runFiles";
import { extractCostEvents, computeRunCostStats } from "../cost/journal";
import { withRunLock } from "../storage/lock";
import { createReplayEngine, type ReplayEngine } from "./replay/createReplayEngine";
import { rebuildStateCache } from "./replay/stateCache";
import { withProcessContext } from "./processContext";
import { RunFailedError } from "./exceptions";
import { validateAgainstSchema } from "./schemaValidator";
import type {
  IterationResult,
  OrchestrateOptions,
  EffectAction,
  ProcessContext,
} from "./types";
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
      throw new RunFailedError("Run has no process assigned. Use run:process-assign to attach a process before iterating.");
    }
    const processFn = await loadProcessFunction(options, defaultEntrypoint, options.runDir);
    const inputs = options.inputs ?? engine.inputs;
    let finalStatus: IterationResult["status"] = "failed";
    const logger = engine.internalContext.logger ?? options.logger;
    const projectRoot = resolveProjectRootForRun(options.runDir, engine.metadata.entrypoint?.importPath);

    await callRuntimeHook("on-iteration-start", { runId: engine.runId, iteration: engine.replayCursor.value }, { cwd: projectRoot, logger });

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
      const outputRef = await writeRunOutput(options.runDir, output);

      let costStats: unknown = undefined;
      try { const journalEvents = await loadJournal(options.runDir); const costEvents = extractCostEvents(journalEvents); if (costEvents.length > 0) costStats = computeRunCostStats(engine.runId, journalEvents); }
      catch { /* optional */ }

      await appendEvent({ runDir: options.runDir, eventType: "RUN_COMPLETED", event: { outputRef, costStats } });
      await rebuildStateCache(options.runDir, { reason: "post_completion" });
      await callRuntimeHook("on-run-complete", { runId: engine.runId, status: "completed", output, duration: Date.now() - iterationStartedAt }, { cwd: projectRoot, logger });

      const result: IterationResult = { status: "completed", output, metadata: createIterationMetadata(engine) };
      finalStatus = result.status;
      return result;
    } catch (error) {
      const waiting = asWaitingResult(error);
      if (waiting) { finalStatus = waiting.status; return { status: "waiting", nextActions: annotateWaitingActions(waiting.nextActions), metadata: createIterationMetadata(engine) }; }

      const failure = serializeUnknownError(error);
      if (!(error instanceof RunFailedError)) {
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
  let mod: Record<string, unknown>;
  try { mod = await dynamicImportModule(moduleUrl); }
  catch (error) { throw new RunFailedError(`Failed to load process module at ${resolvedPath}`, { details: { error: serializeUnknownError(error) }, cause: error instanceof Error ? error : undefined }); }
  const candidate = (exportName && mod[exportName]) ?? (!exportName && mod.default) ?? mod.process ?? mod.default;
  if (typeof candidate !== "function") throw new RunFailedError(`Export '${exportName}' was not a function in ${resolvedPath}`);
  return candidate as ProcessFunction;
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
