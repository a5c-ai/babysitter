import { DefinedTask, TaskInvokeOptions } from "../types";
import { EffectPendingError, InvalidSleepTargetError } from "../exceptions";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";

interface SleepArgs {
  targetEpochMs: number;
  iso: string;
}

const SLEEP_TASK_ID = "__sdk.sleep";

const sleepTask: DefinedTask<SleepArgs, void> = {
  id: SLEEP_TASK_ID,
  build(args) {
    return {
      kind: "sleep",
      title: `sleep:${args.iso}`,
      sleep: {
        iso: args.iso,
        targetEpochMs: args.targetEpochMs,
      },
      metadata: {
        targetEpochMs: args.targetEpochMs,
        iso: args.iso,
      },
    };
  },
};

export async function runSleepIntrinsic(
  target: string | number,
  context: TaskIntrinsicContext,
  options?: TaskInvokeOptions
) {
  const epoch = normalizeSleepTarget(target);
  if (!Number.isFinite(epoch) || epoch < 0) {
    throw new InvalidSleepTargetError(target);
  }
  const nowMs = context.now().getTime();
  if (epoch <= nowMs) {
    return;
  }
  const iso = new Date(epoch).toISOString();
  const label = options?.label ?? `sleep:${iso}`;
  const invokeOptions = { ...options, label };

  try {
    await runTaskIntrinsic({
      task: sleepTask,
      args: { targetEpochMs: epoch, iso },
      invokeOptions,
      context,
    });
  } catch (error) {
    if (shouldShortCircuitPending(error, nowMs)) {
      return;
    }
    throw error;
  }
}

function normalizeSleepTarget(target: string | number): number {
  if (typeof target === "number") {
    return target;
  }
  if (typeof target === "string") {
    const parsed = Date.parse(target);
    return Number.isNaN(parsed) ? NaN : parsed;
  }
  return NaN;
}

function shouldShortCircuitPending(error: unknown, nowMs: number): boolean {
  if (!(error instanceof EffectPendingError)) {
    return false;
  }
  const metadata = error.action.taskDef?.metadata as { targetEpochMs?: number } | undefined;
  if (typeof metadata?.targetEpochMs !== "number") {
    return false;
  }
  return metadata.targetEpochMs <= nowMs;
}
