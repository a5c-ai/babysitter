import { DefinedTask, TaskInvokeOptions } from "../types";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";

interface BreakpointArgs<T = unknown> {
  payload: T;
  label: string;
  requestedAt: string;
}

const BREAKPOINT_TASK_ID = "__sdk.breakpoint";
const DEFAULT_BREAKPOINT_LABEL = "breakpoint";

const breakpointTask: DefinedTask<BreakpointArgs, void> = {
  id: BREAKPOINT_TASK_ID,
  build(args) {
    return {
      kind: "breakpoint",
      title: args.label,
      metadata: {
        payload: args?.payload,
        requestedAt: args.requestedAt,
        label: args.label,
      },
    };
  },
};

export function runBreakpointIntrinsic<T = unknown>(
  payload: T,
  context: TaskIntrinsicContext,
  options?: TaskInvokeOptions
) {
  const label = deriveBreakpointLabel(payload, options?.label);
  const invokeOptions = { ...options, label };
  return runTaskIntrinsic({
    task: breakpointTask,
    args: { payload, label, requestedAt: context.now().toISOString() },
    invokeOptions,
    context,
  });
}

function deriveBreakpointLabel(payload: unknown, provided?: string): string {
  if (typeof provided === "string" && provided.length) {
    return provided;
  }
  if (payload && typeof payload === "object" && "label" in (payload as Record<string, unknown>)) {
    const inferred = (payload as Record<string, unknown>).label;
    if (typeof inferred === "string" && inferred.length) {
      return inferred;
    }
  }
  return DEFAULT_BREAKPOINT_LABEL;
}
