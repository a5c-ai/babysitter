import { orchestrateIteration } from "../runtime/orchestrateIteration";
import { commitEffectResult } from "../runtime/commitEffectResult";
import type {
  EffectAction,
  IterationMetadata,
  IterationResult,
  ProcessLogger,
} from "../runtime/types";
import type { JsonRecord } from "../storage/types";

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
}

const DEFAULT_MAX_ITERATIONS = 100;

export async function runToCompletionWithFakeRunner(
  options: RunToCompletionWithFakeRunnerOptions
): Promise<RunToCompletionResult> {
  const { runDir, resolve, logger, onIteration } = options;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  if (maxIterations <= 0 || !Number.isFinite(maxIterations)) {
    throw new Error("maxIterations must be a positive finite number");
  }
  const executed: ExecutedFakeAction[] = [];
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations += 1;
    const iteration = await orchestrateIteration({ runDir, logger });
    await onIteration?.(iteration);

    if (iteration.status === "completed") {
      return {
        status: "completed",
        output: iteration.output,
        metadata: iteration.metadata ?? null,
        executed,
        iterations,
      };
    }

    if (iteration.status === "failed") {
      return {
        status: "failed",
        error: iteration.error,
        metadata: iteration.metadata ?? null,
        executed,
        iterations,
      };
    }

    const pendingActions = iteration.nextActions;
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
      executed.push({ action, resolution });
    }

    if (!handled) {
      return {
        status: "waiting",
        pending: pendingActions,
        metadata: iteration.metadata ?? null,
        executed,
        iterations,
      };
    }
  }

  throw new Error(`runToCompletionWithFakeRunner exceeded maxIterations=${maxIterations}`);
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
