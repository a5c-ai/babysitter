import { promises as fs } from "node:fs";
import path from "node:path";
import { BreakpointResult, BreakpointRoutingOptions, BreakpointStrategy, DefinedTask, TaskInvokeOptions } from "../types";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";
import { InternalProcessContext } from "../processContext";
import { appendEvent } from "../../storage/journal";

interface BreakpointArgs<T = unknown> {
  payload: T;
  label: string;
  requestedAt: string;
  breakpointId: string;
  expert?: string | string[];
  tags?: string[];
  strategy?: BreakpointStrategy;
  autoApproveAfterN?: number;
  presentAlwaysApprove?: boolean;
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
        breakpointId: args.breakpointId,
        expert: args.expert,
        tags: args.tags,
        strategy: args.strategy,
        autoApproveAfterN: args.autoApproveAfterN,
        presentAlwaysApprove: args.presentAlwaysApprove,
      },
    };
  },
};

export async function runBreakpointIntrinsic<T = unknown>(
  payload: T,
  context: TaskIntrinsicContext,
  options?: TaskInvokeOptions & BreakpointRoutingOptions
): Promise<BreakpointResult> {
  const label = deriveBreakpointLabel(payload, options?.label);
  const breakpointId = options?.breakpointId ?? slugifyBreakpointId(label);

  // In non-interactive mode, auto-approve breakpoints without dispatching a task.
  const ctx = context as Partial<InternalProcessContext>;
  if (ctx.nonInteractive) {
    const bpLabel = options?.label ?? "unnamed";

    let logSeq: number;
    if (ctx.logSeq !== undefined && ctx.recordedLogSeqs !== undefined) {
      logSeq = ++ctx.logSeq;
      if (ctx.recordedLogSeqs.has(logSeq)) {
        return Promise.resolve({ approved: true, response: "Auto-approved (non-interactive mode)" });
      }
      ctx.recordedLogSeqs.add(logSeq);
      void fs.appendFile(
        path.join(context.runDir, "state", "logSeqs.txt"),
        `${logSeq}\n`,
      ).catch(() => {
        // Never let logging break orchestration.
      });
    } else {
      logSeq = -1;
    }

    try {
      await appendEvent({
        runDir: context.runDir,
        eventType: "PROCESS_LOG",
        event: { logSeq, label: "breakpoint:skipped", message: `Breakpoint '${bpLabel}' auto-approved (non-interactive mode)` },
      });
    } catch {
      // Never let logging break orchestration.
    }
    return { approved: true, response: "Auto-approved (non-interactive mode)" };
  }

  const invokeOptions = { ...options, label, key: `__sdk.breakpoint.${breakpointId}` };
  return runTaskIntrinsic({
    task: breakpointTask,
    args: {
      payload,
      label,
      requestedAt: context.now().toISOString(),
      breakpointId,
      expert: options?.expert,
      tags: options?.tags,
      strategy: options?.strategy,
      autoApproveAfterN: options?.autoApproveAfterN,
      presentAlwaysApprove: options?.presentAlwaysApprove,
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

/**
 * Derive a canonical breakpointId from a human-readable title.
 * Lowercase, replace spaces and special characters with hyphens, collapse runs.
 */
export function slugifyBreakpointId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    || "breakpoint";
}
