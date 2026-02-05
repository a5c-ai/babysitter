import { orchestrateIteration } from "../runtime/orchestrateIteration";
import { commitEffectResult } from "../runtime/commitEffectResult";
import type { EffectAction, IterationMetadata, IterationResult, ProcessLogger, EffectSchedulerHints } from "../runtime/types";
import type { JsonRecord } from "../storage/types";
import type { DeterministicUlidHandle, FixedClockHandle } from "./deterministic";
import { DEFAULTS as _DEFAULTS } from "../config/defaults";

export interface FakeActionSuccess {
  status: "ok";
  value?: unknown;
  stdout?: string;
  stderr?: string;
  metadata?: JsonRecord;
  startedAt?: string;
  finishedAt?: string;
}

export interface FakeActionError {
  status: "error";
  error: unknown;
  stdout?: string;
  stderr?: string;
  metadata?: JsonRecord;
  startedAt?: string;
  finishedAt?: string;
}

export type FakeActionResolution = FakeActionSuccess | FakeActionError;

export type FakeActionResolver =
  | ((action: EffectAction) => FakeActionResolution | undefined | Promise<FakeActionResolution | undefined>);

export interface RunToCompletionWithFakeRunnerOptions {
  runDir: string;
  resolve: FakeActionResolver;
  maxIterations?: number;
  logger?: ProcessLogger;
  onIteration?: (iteration: IterationResult) => void | Promise<void>;
  now?: Date | (() => Date);
  clock?: FixedClockHandle;
  ulids?: DeterministicUlidHandle;
}

export interface ExecutedFakeAction {
  action: EffectAction;
  resolution: FakeActionResolution;
}

export interface RunToCompletionResult {
  status: "completed" | "failed" | "waiting";
  output?: unknown;
  error?: unknown;
  pending?: EffectAction[];
  metadata: IterationMetadata | null;
  iterations: number;
  executed: ExecutedFakeAction[];
  executionLog: HarnessIterationLogEntry[];
}

export interface HarnessIterationLogEntry {
  iteration: number;
  status: IterationResult["status"];
  metadata: IterationMetadata | null;
  pending: HarnessActionSnapshot[];
  executed: HarnessActionSnapshot[];
}

export interface HarnessActionSnapshot {
  effectId: string;
  invocationKey: string;
  taskId?: string;
  stepId?: string;
  kind?: string;
  schedulerHints?: EffectSchedulerHints;
}

/**
 * Default max iterations for the run harness.
 * Uses a lower value than DEFAULTS.maxIterations for testing efficiency.
 */
const DEFAULT_MAX_ITERATIONS = 100; // Note: Testing default, see DEFAULTS.maxIterations for production

export async function runToCompletionWithFakeRunner(
  options: RunToCompletionWithFakeRunnerOptions
): Promise<RunToCompletionResult> {
  const { runDir, resolve, logger, onIteration } = options;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  if (maxIterations <= 0 || !Number.isFinite(maxIterations)) {
    throw new Error("maxIterations must be a positive finite number");
  }
  const cleanupProviders = applyDeterministicProviders(options.clock, options.ulids);
  const executed: ExecutedFakeAction[] = [];
  const executionLog: HarnessIterationLogEntry[] = [];
  let iterations = 0;

  try {
    while (iterations < maxIterations) {
      iterations += 1;
    const clockHandle = options.clock;
    const deterministicNow = clockHandle ? () => clockHandle.now() : undefined;
    const iteration = await orchestrateIteration({
      runDir,
      logger,
      now: resolveNowOption(options.now ?? deterministicNow),
    });
      await onIteration?.(iteration);

      const iterationLog: HarnessIterationLogEntry = {
        iteration: iterations,
        status: iteration.status,
        metadata: iteration.metadata ?? null,
        pending: iteration.status === "waiting" ? iteration.nextActions.map(snapshotAction) : [],
        executed: [],
      };

      if (iteration.status === "completed") {
        executionLog.push(iterationLog);
        return {
          status: "completed",
          output: iteration.output,
          metadata: iteration.metadata ?? null,
          executed,
          iterations,
          executionLog,
        };
      }

      if (iteration.status === "failed") {
        executionLog.push(iterationLog);
        return {
          status: "failed",
          error: iteration.error,
          metadata: iteration.metadata ?? null,
          executed,
          iterations,
          executionLog,
        };
      }

    if (iteration.status !== "waiting") {
      executionLog.push(iterationLog);
      throw new Error("Unexpected iteration status");
    }

    const pendingActions = iteration.nextActions;
    const executedThisIteration: ExecutedFakeAction[] = [];
    let handled = false;
    for (const action of pendingActions) {
      const resolution = await resolve(action);
      if (!resolution) {
        continue;
      }
      handled = true;
      await commitEffectResult({
        runDir,
        effectId: action.effectId,
        invocationKey: action.invocationKey,
        result: toCommitResult(resolution),
      });
      const entry = { action, resolution };
      executedThisIteration.push(entry);
      executed.push(entry);
    }
    iterationLog.executed = executedThisIteration.map(({ action }) => snapshotAction(action));
    executionLog.push(iterationLog);

    if (!handled) {
      return {
        status: "waiting",
        pending: pendingActions,
        metadata: iteration.metadata ?? null,
        executed,
        iterations,
        executionLog,
      };
    }
    }

    throw new Error(`runToCompletionWithFakeRunner exceeded maxIterations=${maxIterations}`);
  } finally {
    cleanupProviders();
  }
}

function toCommitResult(resolution: FakeActionResolution) {
  const base = {
    stdout: resolution.stdout,
    stderr: resolution.stderr,
    startedAt: resolution.startedAt,
    finishedAt: resolution.finishedAt,
    metadata: resolution.metadata,
  };
  if (resolution.status === "ok") {
    return {
      status: "ok" as const,
      value: resolution.value,
      ...base,
    };
  }
  if (resolution.error === undefined) {
    throw new Error("FakeActionResolution.status='error' requires an error payload");
  }
  return {
    status: "error" as const,
    error: resolution.error,
    ...base,
  };
}

function snapshotAction(action: EffectAction): HarnessActionSnapshot {
  return {
    effectId: action.effectId,
    invocationKey: action.invocationKey,
    taskId: action.taskId,
    stepId: action.stepId,
    kind: action.kind,
    schedulerHints: action.schedulerHints,
  };
}

function resolveNowOption(now?: Date | (() => Date)) {
  if (!now) return () => new Date();
  if (typeof now === "function") {
    return now as () => Date;
  }
  const fixed = now;
  return () => fixed;
}

function applyDeterministicProviders(clock?: FixedClockHandle, ulids?: DeterministicUlidHandle) {
  const restoreFns: Array<() => void> = [];
  if (clock) {
    restoreFns.push(clock.apply());
  }
  if (ulids) {
    restoreFns.push(ulids.apply());
  }
  return () => {
    while (restoreFns.length > 0) {
      const restore = restoreFns.pop();
      try {
        restore?.();
      } catch {
        // ignore cleanup errors
      }
    }
  };
}
