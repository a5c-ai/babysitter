/**
 * GAP-JSON-002: Effect Dispatch and Response Protocol.
 *
 * Typed API wrappers for listing, showing, cancelling, and batch-committing
 * effects.  All functions return ApiResult envelopes and never throw.
 */

import {
  appendEvent,
  loadJournal,
  readTaskDefinition,
  readTaskResult,
  serializeAndWriteTaskResult,
  withRunLock,
} from "@a5c-ai/babysitter-sdk";
import { ok, fail, pathExists, buildBaseEffectMap } from "./utils";
import type { ApiResult } from "./runs";
import type { JournalEvent, JsonRecord } from "@a5c-ai/babysitter-sdk";
import type { BaseEffectInfo } from "./utils";
import type {
  EffectStatusFilter, EffectStatusOutput, ListEffectsInput, ListEffectsOutput,
  ShowEffectInput, ShowEffectOutput, CancelEffectInput, CancelEffectOutput,
  BatchCommitEffectsInput, BatchCommitEffectResult, BatchCommitEffectsOutput,
} from "./effectsTypes";

// Re-export types for backward compatibility
export type {
  EffectStatusFilter, EffectStatusOutput, ListEffectsInput, ListEffectsOutput,
  ShowEffectInput, ShowEffectOutput, CancelEffectInput, CancelEffectOutput,
  BatchCommitEffectsInput, BatchCommitEffectResult, BatchCommitEffectsOutput,
} from "./effectsTypes";

// ── Internal: derive effect status from journal events ─────────────────────

interface EffectInfo {
  effectId: string;
  kind?: string;
  taskId?: string;
  labels?: string[];
  status: EffectStatusOutput;
  requestedAt?: string;
  resolvedAt?: string;
}

function toEffectStatus(base: BaseEffectInfo): EffectStatusOutput {
  if (base.lifecycle === "cancelled") return "cancelled";
  if (base.lifecycle === "resolved") {
    return base.resolvedStatus === "error" ? "resolved_error" : "resolved_ok";
  }
  return "requested";
}

function buildEffectInfoMap(events: JournalEvent[]): Map<string, EffectInfo> {
  const baseMap = buildBaseEffectMap(events);
  const effects = new Map<string, EffectInfo>();
  for (const [id, base] of baseMap) {
    effects.set(id, {
      effectId: base.effectId,
      kind: base.kind,
      taskId: base.taskId,
      labels: base.labels,
      status: toEffectStatus(base),
      requestedAt: base.requestedAt,
      resolvedAt: base.resolvedAt,
    });
  }
  return effects;
}

// ── API functions ──────────────────────────────────────────────────────────

export async function apiListEffects(
  input: ListEffectsInput,
): Promise<ApiResult<ListEffectsOutput>> {
  try {
    if (!input.runDir) {
      return fail("INVALID_INPUT", "runDir must be a non-empty string");
    }
    if (!(await pathExists(input.runDir))) {
      return fail("RUN_NOT_FOUND", `Run directory not found: ${input.runDir}`);
    }
    const events = await loadJournal(input.runDir);
    const effectMap = buildEffectInfoMap(events);
    let effects = Array.from(effectMap.values());
    // Apply filters
    if (input.filter) {
      if (input.filter.kind !== undefined) {
        const kinds = Array.isArray(input.filter.kind) ? input.filter.kind : [input.filter.kind];
        effects = effects.filter((e) => e.kind !== undefined && kinds.includes(e.kind));
      }
      if (input.filter.status !== undefined) {
        const statusFilter = input.filter.status;
        const validStatuses: EffectStatusFilter[] = ["requested", "resolved", "cancelled"];
        if (!validStatuses.includes(statusFilter)) {
          return fail("INVALID_INPUT", `Invalid status filter: ${statusFilter}. Must be one of: ${validStatuses.join(", ")}`);
        }
        effects = effects.filter((e) => {
          if (statusFilter === "requested") return e.status === "requested";
          if (statusFilter === "resolved") return e.status === "resolved_ok" || e.status === "resolved_error";
          if (statusFilter === "cancelled") return e.status === "cancelled";
          return true;
        });
      }
    }
    // Sort by effectId ascending
    effects.sort((a, b) => a.effectId.localeCompare(b.effectId));
    return ok({
      effects: effects.map((e) => ({
        effectId: e.effectId,
        kind: e.kind,
        status: e.status,
        taskId: e.taskId,
        labels: e.labels,
        requestedAt: e.requestedAt,
        resolvedAt: e.resolvedAt,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiShowEffect(
  input: ShowEffectInput,
): Promise<ApiResult<ShowEffectOutput>> {
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
    const effectMap = buildEffectInfoMap(events);
    const info = effectMap.get(input.effectId);
    if (!info) {
      return fail("EFFECT_NOT_FOUND", `Effect not found: ${input.effectId}`);
    }
    // Read task definition (may be missing if the task dir hasn't been created yet)
    let taskDef: JsonRecord | undefined = undefined;
    try {
      taskDef = await readTaskDefinition(input.runDir, input.effectId);
    } catch {
      // task.json may not exist yet for freshly-requested effects
    }
    // Read result if resolved
    let resultData: unknown = null;
    if (info.status === "resolved_ok" || info.status === "resolved_error") {
      const storedResult = await readTaskResult(input.runDir, input.effectId);
      resultData = storedResult ?? null;
    }
    const output: ShowEffectOutput = {
      effectId: info.effectId,
      kind: info.kind,
      status: info.status,
      taskId: info.taskId,
      labels: info.labels,
      requestedAt: info.requestedAt,
      resolvedAt: info.resolvedAt,
      taskDefinition: taskDef,
      result: resultData === null ? undefined : resultData,
    };
    // Include autoApproval for breakpoint effects
    if (info.kind === "breakpoint" || info.taskId === "__sdk.breakpoint") {
      if (taskDef && typeof taskDef === "object") {
        const autoApproval = (taskDef as Record<string, unknown>).autoApproval;
        if (autoApproval !== undefined) {
          output.autoApproval = autoApproval;
        }
      }
    }
    return ok(output);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiCancelEffect(
  input: CancelEffectInput,
): Promise<ApiResult<CancelEffectOutput>> {
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
    return await withRunLock(input.runDir, "api:cancelEffect", async () => {
      const events = await loadJournal(input.runDir);
      const effectMap = buildEffectInfoMap(events);
      const info = effectMap.get(input.effectId);
      if (!info) {
        return fail<CancelEffectOutput>("EFFECT_NOT_FOUND", `Effect not found: ${input.effectId}`);
      }
      if (info.status !== "requested") {
        return fail<CancelEffectOutput>("EFFECT_NOT_PENDING", `Effect ${input.effectId} is not pending (status=${info.status})`);
      }
      // Extract taskId and invocationKey from the EFFECT_REQUESTED event
      const requestedEvent = events.find(
        (e) => e.type === "EFFECT_REQUESTED" && (e.data as Record<string, unknown>).effectId === input.effectId,
      );
      const eventData = requestedEvent?.data as Record<string, unknown> | undefined;
      const taskId = (eventData?.taskId as string) ?? `task-${input.effectId}`;
      const invocationKey = (eventData?.invocationKey as string) ?? `key-${input.effectId}`;
      const { resultRef } = await serializeAndWriteTaskResult({
        runDir: input.runDir,
        effectId: input.effectId,
        taskId,
        invocationKey,
        payload: {
          status: "cancelled",
          reason: input.reason,
          error: { name: "EffectCancelledError", message: input.reason ?? "Effect cancelled" },
          metadata: { cancelled: true, reason: input.reason },
        },
      });
      await appendEvent({
        runDir: input.runDir,
        eventType: "EFFECT_CANCELLED",
        event: {
          effectId: input.effectId,
          reason: input.reason,
        },
      });
      return ok({ resultRef });
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function apiBatchCommitEffects(
  input: BatchCommitEffectsInput,
): Promise<ApiResult<BatchCommitEffectsOutput>> {
  try {
    if (!input.runDir) {
      return fail("INVALID_INPUT", "runDir must be a non-empty string");
    }
    if (!Array.isArray(input.effects)) {
      return fail("INVALID_INPUT", "effects must be an array");
    }
    if (input.effects.length === 0) {
      return fail("INVALID_INPUT", "effects array must not be empty");
    }
    if (!(await pathExists(input.runDir))) {
      return fail("RUN_NOT_FOUND", `Run directory not found: ${input.runDir}`);
    }
    // Acquire lock once for the entire batch to ensure atomicity
    return await withRunLock(input.runDir, "api:batchCommitEffects", async () => {
      // Load journal once for the entire batch
      let events = await loadJournal(input.runDir);
      const results: BatchCommitEffectResult[] = [];
      for (const entry of input.effects) {
        try {
          const requestedEvent = events.find(
            (e) => e.type === "EFFECT_REQUESTED" && (e.data as Record<string, unknown>).effectId === entry.effectId,
          );
          if (!requestedEvent) {
            throw new Error(`Unknown effectId ${entry.effectId}`);
          }
          const eventData = requestedEvent.data as Record<string, unknown>;
          const taskId = (eventData.taskId as string) ?? `task-${entry.effectId}`;
          const invocationKey = (eventData.invocationKey as string) ?? `key-${entry.effectId}`;
          // Check if already resolved
          const alreadyResolved = events.some(
            (e) =>
              (e.type === "EFFECT_RESOLVED" || e.type === "EFFECT_CANCELLED") &&
              (e.data as Record<string, unknown>).effectId === entry.effectId,
          );
          if (alreadyResolved) {
            throw new Error(`Effect ${entry.effectId} is already resolved`);
          }
          const resultPayload = entry.result.status === "ok"
            ? {
                status: "ok" as const,
                result: entry.result.value,
                stdout: entry.result.stdout,
                stderr: entry.result.stderr,
                stdoutRef: entry.result.stdoutRef,
                stderrRef: entry.result.stderrRef,
                startedAt: entry.result.startedAt,
                finishedAt: entry.result.finishedAt,
                metadata: entry.result.metadata,
              }
            : {
                status: "error" as const,
                error: { name: "Error", message: entry.result.error ?? "Unknown error" },
                stdout: entry.result.stdout,
                stderr: entry.result.stderr,
                stdoutRef: entry.result.stdoutRef,
                stderrRef: entry.result.stderrRef,
                startedAt: entry.result.startedAt,
                finishedAt: entry.result.finishedAt,
                metadata: entry.result.metadata,
              };
          const { resultRef, stdoutRef, stderrRef } = await serializeAndWriteTaskResult({
            runDir: input.runDir,
            effectId: entry.effectId,
            taskId,
            invocationKey,
            payload: resultPayload,
          });
          await appendEvent({
            runDir: input.runDir,
            eventType: "EFFECT_RESOLVED",
            event: {
              effectId: entry.effectId,
              status: entry.result.status,
              resultRef,
              stdoutRef: stdoutRef ?? undefined,
              stderrRef: stderrRef ?? undefined,
              startedAt: resultPayload.startedAt,
              finishedAt: resultPayload.finishedAt,
            },
          });
          // Reload journal so subsequent effects in the batch see this resolution
          events = await loadJournal(input.runDir);
          results.push({
            effectId: entry.effectId,
            ok: true,
            resultRef,
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          results.push({
            effectId: entry.effectId,
            ok: false,
            error: msg,
          });
        }
      }
      return ok({ results });
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}
