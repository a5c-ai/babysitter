import { BreakpointResult, BreakpointRoutingOptions, BreakpointStrategy, DefinedTask, TaskInvokeOptions } from "../types";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";
import { InternalProcessContext } from "../processContext";
import { appendEvent } from "../../storage/journal";

interface BreakpointArgs<T = unknown> {
  payload: T;
  label: string;
  requestedAt: string;
  expert?: string | string[];
  tags?: string[];
  strategy?: BreakpointStrategy;
}

const BREAKPOINT_TASK_ID = "__sdk.breakpoint";
const DEFAULT_BREAKPOINT_LABEL = "breakpoint";

const breakpointTask: DefinedTask<BreakpointArgs, BreakpointResult> = {
  id: BREAKPOINT_TASK_ID,
  build(args) {
    return {
      kind: "breakpoint",
      title: args.label,
      metadata: {
        payload: args?.payload,
        requestedAt: args.requestedAt,
        label: args.label,
        expert: args.expert,
        tags: args.tags,
        strategy: args.strategy,
      },
    };
  },
};

export function runBreakpointIntrinsic<T = unknown>(
  payload: T,
  context: TaskIntrinsicContext,
  options?: TaskInvokeOptions & BreakpointRoutingOptions
): Promise<BreakpointResult> {
  const label = deriveBreakpointLabel(payload, options?.label);

  // In non-interactive mode, auto-approve breakpoints without dispatching a task.
  const ctx = context as Partial<InternalProcessContext>;
  if (ctx.nonInteractive) {
    const bpLabel = options?.label ?? "unnamed";
    void appendEvent({
      runDir: context.runDir,
      eventType: "PROCESS_LOG",
      event: { logSeq: -1, label: "breakpoint:skipped", message: `Breakpoint '${bpLabel}' auto-approved (non-interactive mode)` },
    }).catch(() => {
      // Never let logging break orchestration.
    });
    return Promise.resolve({ approved: true, response: "Auto-approved (non-interactive mode)" });
  }

  const invokeOptions = { ...options, label };
  return runTaskIntrinsic({
    task: breakpointTask,
    args: {
      payload,
      label,
      requestedAt: context.now().toISOString(),
      expert: options?.expert,
      tags: options?.tags,
      strategy: options?.strategy,
    },
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
