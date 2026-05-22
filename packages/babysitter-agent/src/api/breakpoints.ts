/**
 * GAP-JSON-003: JSON Breakpoint Interaction API.
 *
 * Typed API wrappers for listing, showing, and responding to breakpoint effects,
 * plus auto-approval rule management. All functions return ApiResult envelopes
 * and never throw.
 */

import * as crypto from "node:crypto";
import {
  addRule,
  appendEvent,
  callHook,
  evaluateAutoApproval as evaluateAutoApprovalCore,
  loadJournal,
  readRules,
  readTaskDefinition,
  readTaskResult,
  removeRule,
  serializeAndWriteTaskResult,
  withRunLock,
} from "@a5c-ai/babysitter-sdk";
import { ok, fail, pathExists, buildBaseEffectMap } from "./utils";
import type { BaseEffectInfo } from "./utils";
import type { ApiResult } from "./runs";
import type {
  AutoApprovalResult,
  BreakpointConfig,
  BreakpointRule,
  JsonRecord,
} from "@a5c-ai/babysitter-sdk";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ListBreakpointsOutput {
  breakpoints: BreakpointSummary[];
}

export interface BreakpointSummary {
  effectId: string;
  breakpointId?: string;
  title?: string;
  tags?: string[];
  expert?: string | string[];
  strategy?: string;
  autoApproval?: unknown;
  requestedAt?: string;
}

export interface ShowBreakpointOutput {
  effectId: string;
  status: string;
  breakpointId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  expert?: string | string[];
  strategy?: string;
  previousFeedback?: string;
  attempt?: number;
  options?: unknown;
  autoApproval?: unknown;
  result?: unknown;
  requestedAt?: string;
  resolvedAt?: string;
}

export interface RespondToBreakpointInput {
  runDir: string;
  effectId: string;
  approved: boolean;
  response?: string;
  feedback?: string;
  option?: string;
  respondedBy?: string;
}

export interface AddAutoApprovalRuleInput {
  pattern: string;
  action: "auto-approve" | "never-auto-approve";
  createdBy: string;
  id?: string;
  source?: string;
  note?: string;
  rulesPath?: string;
}

export interface EvaluateAutoApprovalInput {
  breakpointId: string;
  tags?: string[];
  expert?: string;
  rulesPath?: string;
  autoApproveAfterN?: number;
  consecutiveApprovals?: number;
  profileConfig?: BreakpointConfig;
}

// ── Internal helpers ───────────────────────────────────────────────────────

function isBreakpointEffect(info: BaseEffectInfo): boolean {
  return info.kind === "breakpoint" || info.taskId === "__sdk.breakpoint";
}

// ── API functions ──────────────────────────────────────────────────────────

export async function apiListBreakpoints(
  input: { runDir: string },
): Promise<ApiResult<ListBreakpointsOutput>> {
  try {
    if (!input.runDir) {
      return fail("INVALID_INPUT", "runDir must be a non-empty string");
    }
    if (!(await pathExists(input.runDir))) {
      return fail("RUN_NOT_FOUND", `Run directory not found: ${input.runDir}`);
    }
    const events = await loadJournal(input.runDir);
    const effectMap = buildBaseEffectMap(events);
    const breakpoints: BreakpointSummary[] = [];
    for (const info of effectMap.values()) {
      if (!isBreakpointEffect(info)) continue;
      if (info.lifecycle !== "requested") continue;
      // Read task definition to extract breakpoint-specific fields
      let taskDef: JsonRecord | undefined;
      try {
        taskDef = await readTaskDefinition(input.runDir, info.effectId);
      } catch {
        // task.json may not exist
      }
      const td = taskDef as Record<string, unknown> | undefined;
      breakpoints.push({
        effectId: info.effectId,
        breakpointId: td?.breakpointId as string | undefined,
        title: td?.title as string | undefined,
        tags: Array.isArray(td?.tags) ? (td.tags as string[]) : undefined,
        expert: td?.expert as string | string[] | undefined,
        strategy: td?.strategy as string | undefined,
        autoApproval: td?.autoApproval,
        requestedAt: info.requestedAt,
      });
    }
    return ok({ breakpoints });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiShowBreakpoint(
  input: { runDir: string; effectId: string },
): Promise<ApiResult<ShowBreakpointOutput>> {
  try {
    if (!input.runDir) {
      return fail("INVALID_INPUT", "runDir must be a non-empty string");
    }
    if (!input.effectId) {
      return fail("INVALID_INPUT", "effectId must be a non-empty string");
    }
    if (!(await pathExists(input.runDir))) {
      return fail("RUN_NOT_FOUND", `Run directory not found: ${input.runDir}`);
    }
    const events = await loadJournal(input.runDir);
    const effectMap = buildBaseEffectMap(events);
    const info = effectMap.get(input.effectId);
    if (!info) {
      return fail("EFFECT_NOT_FOUND", `Effect not found: ${input.effectId}`);
    }
    if (!isBreakpointEffect(info)) {
      return fail("EFFECT_NOT_BREAKPOINT", `Effect ${input.effectId} is not a breakpoint (kind=${info.kind})`);
    }
    // Read task definition
    let taskDef: JsonRecord | undefined;
    try {
      taskDef = await readTaskDefinition(input.runDir, input.effectId);
    } catch {
      // task.json may not exist
    }
    // Read result if resolved
    let resultData: unknown = undefined;
    if (info.lifecycle === "resolved") {
      try {
        const storedResult = await readTaskResult(input.runDir, input.effectId);
        resultData = storedResult ?? undefined;
      } catch {
        // result.json may be missing/corrupt
      }
    }
    const td = taskDef as Record<string, unknown> | undefined;
    const output: ShowBreakpointOutput = {
      effectId: info.effectId,
      status: info.lifecycle,
      breakpointId: td?.breakpointId as string | undefined,
      title: td?.title as string | undefined,
      description: td?.description as string | undefined,
      tags: Array.isArray(td?.tags) ? (td.tags as string[]) : undefined,
      expert: td?.expert as string | string[] | undefined,
      strategy: td?.strategy as string | undefined,
      previousFeedback: td?.previousFeedback as string | undefined,
      attempt: typeof td?.attempt === "number" ? td.attempt : undefined,
      options: td?.options,
      autoApproval: td?.autoApproval,
      result: resultData,
      requestedAt: info.requestedAt,
      resolvedAt: info.resolvedAt,
    };
    return ok(output);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiRespondToBreakpoint(
  input: RespondToBreakpointInput,
): Promise<ApiResult<{ resultRef: string }>> {
  try {
    // Validate input
    if (!input.runDir) {
      return fail("INVALID_INPUT", "runDir must be a non-empty string");
    }
    if (!input.effectId) {
      return fail("INVALID_INPUT", "effectId must be a non-empty string");
    }
    if (input.approved === false && (!input.feedback || input.feedback.trim() === "")) {
      return fail("INVALID_INPUT", "feedback is required when rejecting a breakpoint (approved=false)");
    }
    if (!(await pathExists(input.runDir))) {
      return fail("RUN_NOT_FOUND", `Run directory not found: ${input.runDir}`);
    }
    return await withRunLock(input.runDir, "api:respondToBreakpoint", async () => {
      const events = await loadJournal(input.runDir);
      const effectMap = buildBaseEffectMap(events);
      const info = effectMap.get(input.effectId);
      if (!info) {
        return fail<{ resultRef: string }>("EFFECT_NOT_FOUND", `Effect not found: ${input.effectId}`);
      }
      if (!isBreakpointEffect(info)) {
        return fail<{ resultRef: string }>("EFFECT_NOT_BREAKPOINT", `Effect ${input.effectId} is not a breakpoint (kind=${info.kind})`);
      }
      if (info.lifecycle !== "requested") {
        return fail<{ resultRef: string }>("EFFECT_NOT_PENDING", `Breakpoint ${input.effectId} is not pending (status=${info.lifecycle})`);
      }
      const taskId = info.taskId ?? `task-${input.effectId}`;
      const invocationKey = info.invocationKey ?? `key-${input.effectId}`;
      // Build breakpoint result value
      const breakpointResult: Record<string, unknown> = {
        approved: input.approved,
      };
      if (input.response !== undefined) breakpointResult.response = input.response;
      if (input.feedback !== undefined) breakpointResult.feedback = input.feedback;
      if (input.option !== undefined) breakpointResult.option = input.option;
      if (input.respondedBy !== undefined) breakpointResult.respondedBy = input.respondedBy;
      const { resultRef } = await serializeAndWriteTaskResult({
        runDir: input.runDir,
        effectId: input.effectId,
        taskId,
        invocationKey,
        payload: {
          status: "ok",
          result: breakpointResult,
        },
      });
      await appendEvent({
        runDir: input.runDir,
        eventType: "EFFECT_RESOLVED",
        event: {
          effectId: input.effectId,
          status: "ok",
          resultRef,
        },
      });
      // GAP-SEC-003: Fire on-permission-denied hook when breakpoint is denied
      if (!input.approved) {
        const td = await readTaskDefinition(input.runDir, input.effectId).catch(() => undefined);
        const bpId = (td as Record<string, unknown> | undefined)?.breakpointId as string | undefined;
        const kind = (td as Record<string, unknown> | undefined)?.kind as string | undefined;
        callHook({
          hookType: "on-permission-denied",
          payload: {
            hookType: "on-permission-denied" as const,
            breakpointId: bpId ?? input.effectId,
            title: (td as Record<string, unknown> | undefined)?.title as string | undefined,
            kind: kind ?? "breakpoint",
            runId: input.runDir.split("/").pop(),
            effectId: input.effectId,
            respondedBy: input.respondedBy,
            feedback: input.feedback,
            timestamp: new Date().toISOString(),
          },
          cwd: input.runDir,
        }).catch(() => { /* fire-and-forget */ });
      }
      return ok({ resultRef });
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiListAutoApprovalRules(
  input?: { rulesPath?: string },
): Promise<ApiResult<{ rules: BreakpointRule[] }>> {
  try {
    const rules = await readRules(input?.rulesPath);
    return ok({ rules });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiAddAutoApprovalRule(
  input: AddAutoApprovalRuleInput,
): Promise<ApiResult<{ rule: BreakpointRule; rules: BreakpointRule[] }>> {
  try {
    if (!input.pattern) {
      return fail("INVALID_INPUT", "pattern must be a non-empty string");
    }
    const validActions = ["auto-approve", "never-auto-approve"];
    if (!validActions.includes(input.action)) {
      return fail("INVALID_INPUT", `action must be one of: ${validActions.join(", ")}`);
    }
    if (!input.createdBy) {
      return fail("INVALID_INPUT", "createdBy must be a non-empty string");
    }
    const rule: BreakpointRule = {
      id: input.id ?? crypto.randomUUID(),
      pattern: input.pattern,
      action: input.action,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      source: input.source,
      note: input.note,
    };
    const rules = await addRule(rule, input.rulesPath);
    return ok({ rule, rules });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiRemoveAutoApprovalRule(
  input: { ruleId: string; rulesPath?: string },
): Promise<ApiResult<{ rules: BreakpointRule[] }>> {
  try {
    if (!input.ruleId) {
      return fail("INVALID_INPUT", "ruleId must be a non-empty string");
    }
    // Check if rule exists before removing
    const existingRules = await readRules(input.rulesPath);
    const ruleExists = existingRules.some((r) => r.id === input.ruleId);
    if (!ruleExists) {
      return fail("RULE_NOT_FOUND", `Rule not found: ${input.ruleId}`);
    }
    const rules = await removeRule(input.ruleId, input.rulesPath);
    return ok({ rules });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiEvaluateAutoApproval(
  input: EvaluateAutoApprovalInput,
): Promise<ApiResult<AutoApprovalResult>> {
  try {
    if (!input.breakpointId) {
      return fail("INVALID_INPUT", "breakpointId must be a non-empty string");
    }
    const rules = await readRules(input.rulesPath);
    const result = evaluateAutoApprovalCore({
      breakpointId: input.breakpointId,
      tags: input.tags,
      expert: input.expert,
      rules,
      profileConfig: input.profileConfig,
      consecutiveApprovals: input.consecutiveApprovals,
      autoApproveAfterN: input.autoApproveAfterN,
    });
    return ok(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}
