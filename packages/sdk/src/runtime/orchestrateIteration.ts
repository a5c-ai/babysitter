import path from "path";
import { pathToFileURL } from "url";
import { appendEvent } from "../storage/journal";
import { writeRunOutput } from "../storage/runFiles";
import { createReplayEngine, type ReplayEngine } from "./replay/createReplayEngine";
import { withProcessContext } from "./processContext";
import {
  EffectPendingError,
  EffectRequestedError,
  ParallelPendingError,
  RunFailedError,
} from "./exceptions";
import {
  IterationMetadata,
  IterationResult,
  OrchestrateOptions,
  EffectAction,
  EffectSchedulerHints,
} from "./types";
import { serializeUnknownError } from "./errorUtils";
import { emitRuntimeMetric } from "./instrumentation";
import { callRuntimeHook } from "./hooks/runtime";

type ProcessFunction = (inputs: unknown, ctx: any, extra?: unknown) => unknown | Promise<unknown>;
// Use an indirect dynamic import so TypeScript does not downlevel to require() in CommonJS builds.
const dynamicImportModule = new Function(
  "specifier",
  "return import(specifier);"
) as (specifier: string) => Promise<Record<string, unknown>>;

export async function orchestrateIteration(options: OrchestrateOptions): Promise<IterationResult> {
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
    const outputRef = await writeRunOutput(options.runDir, output);
    await appendEvent({
      runDir: options.runDir,
      eventType: "RUN_COMPLETED",
      event: {
        outputRef,
      },
    });

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
    await appendEvent({
      runDir: options.runDir,
      eventType: "RUN_FAILED",
      event: { error: failure },
    });

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
      error: serializeUnknownError(error),
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

function asWaitingResult(error: unknown): WaitingIterationResult | null {
  if (error instanceof ParallelPendingError) {
    return { status: "waiting", nextActions: error.batch.actions };
  }
  if (error instanceof EffectRequestedError || error instanceof EffectPendingError) {
    return { status: "waiting", nextActions: [error.action] };
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
