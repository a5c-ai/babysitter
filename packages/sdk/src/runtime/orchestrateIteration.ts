import path from "path";
import { pathToFileURL } from "url";
import { appendEvent, loadJournal } from "../storage/journal";
import { writeRunOutput } from "../storage/runFiles";
import { extractCostEvents, computeRunCostStats } from "../cost/journal";
import { withRunLock } from "../storage/lock";
import { createReplayEngine, type ReplayEngine } from "./replay/createReplayEngine";
import { rebuildStateCache } from "./replay/stateCache";
import { withProcessContext } from "./processContext";
import {
  EffectPendingError,
  EffectRequestedError,
  ParallelPendingError,
  RunFailedError,
} from "./exceptions";
import { validateAgainstSchema } from "./schemaValidator";
import {
  IterationMetadata,
  IterationResult,
  OrchestrateOptions,
  EffectAction,
  EffectSchedulerHints,
  ProcessContext,
} from "./types";
import { serializeUnknownError } from "./errorUtils";
import { emitRuntimeMetric } from "./instrumentation";
import { callRuntimeHook } from "./hooks/runtime";

type ProcessFunction = (inputs: unknown, ctx: ProcessContext, extra?: unknown) => Promise<unknown>;
// Use an indirect dynamic import so TypeScript does not downlevel to require() in CommonJS builds.
// Vitest executes modules inside a VM context that requires direct import() support.
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
    const processFn = await loadProcessFunction(options, defaultEntrypoint, options.runDir);
    const inputs = options.inputs ?? engine.inputs;
    let finalStatus: IterationResult["status"] = "failed";
    const logger = engine.internalContext.logger ?? options.logger;

    // Compute project root for hook calls (parent of .a5c dir where plugins/ is located)
    // runDir is like: /path/to/project/.a5c/runs/<runId>
    // So we need 3 levels up: runs -> .a5c -> project
    const projectRoot = path.dirname(path.dirname(path.dirname(options.runDir)));

    // Call on-iteration-start hook
    await callRuntimeHook(
      "on-iteration-start",
      {
        runId: engine.runId,
        iteration: engine.replayCursor.value,
      },
      {
        cwd: projectRoot,
        logger,
      }
    );

    try {
      const output = await withProcessContext(engine.internalContext, () =>
        processFn(inputs, engine.context, options.context)
      );
      // Validate output against outputSchema if present (warn only, don't throw)
      const runMeta = engine.metadata as Record<string, unknown> | undefined;
      const outputSchema = runMeta?.outputSchema as Record<string, unknown> | undefined;
      if (outputSchema) {
        const validation = validateAgainstSchema(output, outputSchema);
        if (!validation.valid) {
          console.warn(
            `[babysitter] Output schema validation warning: ${validation.errors.join("; ")}`,
          );
        }
      }
      const outputRef = await writeRunOutput(options.runDir, output);

      // Compute cost stats for run completion
      let costStats: unknown = undefined;
      try {
        const journalEvents = await loadJournal(options.runDir);
        const costEvents = extractCostEvents(journalEvents);
        if (costEvents.length > 0) {
          costStats = computeRunCostStats(engine.runId, journalEvents);
        }
      } catch {
        // Cost stats are optional - don't fail the run
      }

      await appendEvent({
        runDir: options.runDir,
        eventType: "RUN_COMPLETED",
        event: {
          outputRef,
          costStats,
        },
      });

      // Rebuild state cache so it includes the terminal event.
      // Without this, the cache's journalHead would be 1 behind for completed runs
      // since there's no subsequent iteration to trigger an automatic rebuild.
      await rebuildStateCache(options.runDir, { reason: "post_completion" });

      // Call on-run-complete hook
      await callRuntimeHook(
        "on-run-complete",
        {
          runId: engine.runId,
          status: "completed",
          output,
          duration: Date.now() - iterationStartedAt,
        },
        {
          cwd: projectRoot,
          logger,
        }
      );

      const result: IterationResult = { status: "completed", output, metadata: createIterationMetadata(engine) };
      finalStatus = result.status;
      return result;
    } catch (error) {
      const waiting = asWaitingResult(error);
      if (waiting) {
        finalStatus = waiting.status;
        return {
          status: "waiting",
          nextActions: annotateWaitingActions(waiting.nextActions),
          metadata: createIterationMetadata(engine),
        };
      }

      const failure = serializeUnknownError(error);

      // Distinguish truly fatal errors (RunFailedError — missing module, bad
      // config) from recoverable process-execution errors (TypeError, user-code
      // bugs).  Recoverable errors are returned as "process-error" WITHOUT
      // writing RUN_FAILED to the journal, so the harness can feed the error
      // back to the agent for self-repair and retry the iteration.
      if (!(error instanceof RunFailedError)) {
        const result: IterationResult = {
          status: "process-error",
          error: failure,
          metadata: createIterationMetadata(engine),
        };
        finalStatus = result.status;
        return result;
      }

      await appendEvent({
        runDir: options.runDir,
        eventType: "RUN_FAILED",
        event: { error: failure },
      });

      // Rebuild state cache so it includes the terminal event.
      await rebuildStateCache(options.runDir, { reason: "post_failure" });

      // Call on-run-fail hook
      await callRuntimeHook(
        "on-run-fail",
        {
          runId: engine.runId,
          status: "failed",
          error: failure.message || "Unknown error",
          duration: Date.now() - iterationStartedAt,
        },
        {
          cwd: projectRoot,
          logger,
        }
      );

      const result: IterationResult = {
        status: "failed",
        error: failure,
        metadata: createIterationMetadata(engine),
      };
      finalStatus = result.status;
      return result;
    } finally {
      emitRuntimeMetric(logger, "replay.iteration", {
        duration_ms: Date.now() - iterationStartedAt,
        status: finalStatus,
        runId: engine.runId,
        stepCount: engine.replayCursor.value,
      });

      // Call on-iteration-end hook
      await callRuntimeHook(
        "on-iteration-end",
        {
          runId: engine.runId,
          iteration: engine.replayCursor.value,
          status: finalStatus,
        },
        {
          cwd: projectRoot,
          logger,
        }
      );
    }
  });
}

interface EntrypointDefaults {
  importPath?: string;
  exportName?: string;
}

async function loadProcessFunction(
  options: OrchestrateOptions,
  defaults: EntrypointDefaults,
  runDir: string
): Promise<ProcessFunction> {
  const importPath = options.process?.importPath ?? defaults.importPath;
  if (!importPath) {
    throw new RunFailedError("Process import path is missing");
  }
  const exportName = options.process?.exportName ?? defaults.exportName ?? "process";
  const resolvedPath = path.isAbsolute(importPath) ? importPath : path.resolve(runDir, importPath);
  const moduleUrl = pathToFileURL(resolvedPath).href;
  let mod: Record<string, unknown>;
  try {
    mod = await dynamicImportModule(moduleUrl);
  } catch (error) {
    throw new RunFailedError(`Failed to load process module at ${resolvedPath}`, {
      details: {
        error: serializeUnknownError(error),
      },
      cause: error instanceof Error ? error : undefined,
    });
  }

  const candidate =
    (exportName && mod[exportName]) ??
    (!exportName && mod.default) ??
    mod.process ??
    mod.default;

  if (typeof candidate !== "function") {
    throw new RunFailedError(`Export '${exportName}' was not a function in ${resolvedPath}`);
  }

  return candidate as ProcessFunction;
}

type WaitingIterationResult = Extract<IterationResult, { status: "waiting" }>;

/** @internal Exported for testing only. */
export function asWaitingResult(error: unknown): WaitingIterationResult | null {
  // Primary path: direct instanceof checks (same SDK copy).
  if (error instanceof ParallelPendingError) {
    return { status: "waiting", nextActions: error.batch.actions };
  }
  if (error instanceof EffectRequestedError || error instanceof EffectPendingError) {
    return { status: "waiting", nextActions: [error.action] };
  }

  // Fallback: duck-type detection for cross-package instanceof failures.
  // When the globally-installed SDK orchestrates a process that imports a
  // workspace-local SDK copy, the two EffectRequestedError classes are
  // different constructors and instanceof returns false.  We recover by
  // checking the error shape (name + action property).
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if (
      (err.name === "ParallelPendingError" || err.name === "ParallelPendingError") &&
      err.batch && typeof err.batch === "object" &&
      Array.isArray((err.batch as Record<string, unknown>).actions)
    ) {
      return { status: "waiting", nextActions: (err.batch as { actions: EffectAction[] }).actions };
    }
    if (
      (err.name === "EffectRequestedError" || err.name === "EffectPendingError") &&
      err.action && typeof err.action === "object" &&
      typeof (err.action as Record<string, unknown>).effectId === "string"
    ) {
      return { status: "waiting", nextActions: [err.action as EffectAction] };
    }
  }

  return null;
}

function resolveNow(now?: Date | (() => Date)): () => Date {
  if (!now) return () => new Date();
  if (typeof now === "function") {
    return now as () => Date;
  }
  const fixed = now;
  return () => fixed;
}

async function initializeReplayEngine(
  options: OrchestrateOptions,
  nowFn: () => Date,
  iterationStartedAt: number
): Promise<ReplayEngine> {
  try {
    return await createReplayEngine({ runDir: options.runDir, now: nowFn, logger: options.logger });
  } catch (error) {
    emitRuntimeMetric(options.logger, "replay.iteration", {
      duration_ms: Date.now() - iterationStartedAt,
      status: "failed",
      runDir: options.runDir,
      phase: "initialize",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function annotateWaitingActions(actions: EffectAction[]): EffectAction[] {
  const pendingCount = actions.length;
  return actions.map((action) => {
    const derivedSleep = deriveSleepHint(action);
    const nextHints = mergeSchedulerHints(action.schedulerHints, {
      pendingCount,
      sleepUntilEpochMs: derivedSleep,
    });
    if (
      nextHints === action.schedulerHints ||
      (nextHints === undefined && action.schedulerHints === undefined)
    ) {
      return action;
    }
    return {
      ...action,
      schedulerHints: nextHints,
    };
  });
}

function deriveSleepHint(action: EffectAction): number | undefined {
  if (typeof action.schedulerHints?.sleepUntilEpochMs === "number") {
    return action.schedulerHints.sleepUntilEpochMs;
  }
  const direct = action.taskDef?.sleep?.targetEpochMs;
  if (typeof direct === "number") {
    return direct;
  }
  const metadataTarget = (action.taskDef?.metadata as { targetEpochMs?: number } | undefined)?.targetEpochMs;
  return typeof metadataTarget === "number" ? metadataTarget : undefined;
}

function mergeSchedulerHints(
  base: EffectSchedulerHints | undefined,
  extra: EffectSchedulerHints
): EffectSchedulerHints | undefined {
  const merged: EffectSchedulerHints = { ...(base ?? {}) };
  let changed = false;

  if (extra.pendingCount !== undefined && merged.pendingCount !== extra.pendingCount) {
    merged.pendingCount = extra.pendingCount;
    changed = true;
  }
  if (
    extra.sleepUntilEpochMs !== undefined &&
    merged.sleepUntilEpochMs !== extra.sleepUntilEpochMs
  ) {
    merged.sleepUntilEpochMs = extra.sleepUntilEpochMs;
    changed = true;
  }
  if (
    extra.parallelGroupId !== undefined &&
    merged.parallelGroupId !== extra.parallelGroupId
  ) {
    merged.parallelGroupId = extra.parallelGroupId;
    changed = true;
  }
  if (
    extra.maxConcurrency !== undefined &&
    merged.maxConcurrency !== extra.maxConcurrency
  ) {
    merged.maxConcurrency = extra.maxConcurrency;
    changed = true;
  }
  if (
    extra.executionStrategy !== undefined &&
    merged.executionStrategy !== extra.executionStrategy
  ) {
    merged.executionStrategy = extra.executionStrategy;
    changed = true;
  }

  if (!changed) {
    return base;
  }
  return merged;
}

function createIterationMetadata(engine: ReplayEngine): IterationMetadata {
  return {
    stateVersion: engine.stateCache?.stateVersion,
    pendingEffectsByKind: engine.stateCache?.pendingEffectsByKind,
    journalHead: engine.stateCache?.journalHead ?? null,
    stateRebuilt: Boolean(engine.stateRebuild),
    stateRebuildReason: engine.stateRebuild?.reason ?? null,
  };
}
