import { promises as fs } from "node:fs";
import path from "node:path";
import { BreakpointResult, BreakpointRoutingOptions, BreakpointStrategy, DefinedTask, TaskInvokeOptions } from "../types";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";
import { InternalProcessContext } from "../processContext";
import { appendEvent } from "../../storage/journal";
import { requiresInteractiveApproval } from "./breakpointPolicy";

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

  // Non-interactive gates are decided here, before task dispatch.
  const ctx = context as Partial<InternalProcessContext>;
  if (ctx.nonInteractive) {
    const protectedGate = requiresInteractiveApproval(options ?? {});
    const refused = protectedGate && ctx.nonInteractiveOwnerGates !== "approve";
    const result: BreakpointResult = refused
      ? { approved: false, deferred: true, response: "Requires interactive approval" }
      : { approved: true, auto: true, response: "Auto-approved (non-interactive mode)" };
    const bpLabel = label === DEFAULT_BREAKPOINT_LABEL
      ? (options?.breakpointId || breakpointId || "unnamed")
      : label;

    let logSeq: number;
    if (ctx.logSeq !== undefined && ctx.recordedLogSeqs !== undefined) {
      logSeq = ++ctx.logSeq;
      if (ctx.recordedLogSeqs.has(logSeq)) {
        return result;
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
        event: {
          logSeq,
          label: refused ? "breakpoint:deferred" : "breakpoint:skipped",
          breakpointLabel: bpLabel,
          breakpointId,
          expert: options?.expert ?? null,
          tags: options?.tags ?? [],
          message: refused
            ? `Breakpoint '${bpLabel}' requires interactive approval`
            : `Breakpoint '${bpLabel}' auto-approved (non-interactive mode)`,
        },
      });
    } catch {
      // Never let logging break orchestration.
    }
    return result;
  }

  // Disambiguate repeated breakpoints within one process run. The breakpoint
  // effect uses an explicit invocation `key`, which bypasses the task
  // intrinsic's per-call cursor (deriveStableTaskKey). Without disambiguation a
  // second ctx.breakpoint() that resolves to the same breakpointId (e.g. the
  // default "breakpoint" when no explicit label/breakpointId is given) collides
  // with the first and silently inherits its resolution — a sign-off prompt
  // gets skipped because it reuses an earlier "approved". Append a per-call
  // counter (sharing the task intrinsic's counter map, so it is deterministic
  // across replay — each iteration re-executes the process from the start in
  // the same order). Keep the first occurrence's bare key for backward
  // compatibility with already-recorded in-flight runs.
  const baseKey = `__sdk.breakpoint.${breakpointId}`;
  const counts = (context.invocationKeyCounts ??= new Map<string, number>());
  const occurrence = counts.get(baseKey) ?? 0;
  counts.set(baseKey, occurrence + 1);
  const invocationKey = occurrence === 0 ? baseKey : `${baseKey}.${occurrence}`;

  const invokeOptions = { ...options, label, key: invocationKey };
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
  if (payload && typeof payload === "object" && "title" in (payload as Record<string, unknown>)) {
    const inferred = (payload as Record<string, unknown>).title;
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
