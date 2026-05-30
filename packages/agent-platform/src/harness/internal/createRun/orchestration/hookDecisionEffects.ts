import { createPermissionEvent } from "../../../../governance/permissionEvents";
import type { ResolveEffectResult } from "../utils";

export type HookDecisionVerb = "deny" | "block" | "retry" | "ask" | "allow" | "defer" | "continue" | "noop";

export interface HookDecisionResult {
  decision?: HookDecisionVerb;
  reason?: string;
  continueSession?: boolean;
  stopReason?: string;
  toolMutation?: { mode: "replace" | "patch"; value: unknown };
  updatedInput?: unknown;
  metadata?: Record<string, unknown>;
}

export interface HookDecisionResolutionOptions {
  attempt?: number;
  maxRetries?: number;
}

interface HookDecisionAction {
  kind: string;
  effectId?: string;
  taskId?: string;
  taskDef?: {
    title?: string;
    metadata?: Record<string, unknown>;
    hookResult?: unknown;
  } & Record<string, unknown>;
}

export function getHookDecisionResult(action: HookDecisionAction): HookDecisionResult | null {
  const taskDef = action.taskDef as Record<string, unknown> | undefined;
  const metadata = taskDef?.metadata as Record<string, unknown> | undefined;
  const candidate = metadata?.hookResult ?? taskDef?.hookResult;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  const result = candidate as HookDecisionResult;
  return typeof result.decision === "string" || result.continueSession === false ? result : null;
}

export function resolveHookDecisionResult(
  action: HookDecisionAction,
  hookResult: HookDecisionResult,
  options: HookDecisionResolutionOptions = {},
): ResolveEffectResult | null {
  const reason = hookResult.reason ?? hookResult.stopReason ?? "Hook decision";
  const operation = {
    kind: action.kind,
    target: action.taskDef?.title ?? action.taskId ?? action.effectId ?? "effect",
    effectId: action.effectId,
    taskId: action.taskId,
  };

  if (hookResult.decision === "block" || hookResult.decision === "deny") {
    const auditEvent = createPermissionEvent({
      kind: "hook-decision",
      operation,
      decision: {
        action: "block",
        reason,
        hookDecision: hookResult.decision,
      },
      source: "harness",
    });
    return {
      status: "error",
      error: new Error(reason),
      value: { blocked: true, reason, auditEvent },
      stderr: reason,
    };
  }

  if (hookResult.decision === "retry") {
    const attempt = options.attempt ?? 0;
    const maxRetries = options.maxRetries ?? 0;
    const exhausted = attempt >= maxRetries;
    const auditEvent = createPermissionEvent({
      kind: "hook-decision",
      operation,
      decision: {
        action: "retry",
        reason,
        hookDecision: "retry",
        attempt,
        maxRetries,
        exhausted,
      },
      source: "harness",
    });
    return {
      status: exhausted ? "error" : "ok",
      value: { retry: !exhausted, exhausted, reason, attempt, maxRetries, auditEvent },
      error: exhausted ? new Error(reason) : undefined,
      stderr: exhausted ? reason : undefined,
    };
  }

  if (hookResult.continueSession === false) {
    const stopReason = hookResult.stopReason ?? reason;
    return {
      status: "error",
      error: new Error(stopReason),
      value: { aborted: true, stopReason },
      stderr: stopReason,
    };
  }

  return null;
}
