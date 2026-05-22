/**
 * Helper functions for task intrinsic.
 * Extracted from task.ts for max-lines compliance.
 */

import { promises as fs } from "fs";
import path from "path";
import { readTaskResult } from "../../storage/tasks";
import type { StoredTaskResult } from "../../storage/types";
import { RunFailedError, rehydrateSerializedError } from "../exceptions";
import type { EffectAction, EffectRecord, EffectSchedulerHints, TaskBuildContext, TaskDef } from "../types";
import { collapseDoubledA5cRuns } from "../../cli/resolveInputPath";

export function normalizeRef(runDir: string, ref: string): string {
  return path.isAbsolute(ref) ? ref : collapseDoubledA5cRuns(path.join(runDir, ref));
}

export function buildEffectAction(record: EffectRecord, taskDef: TaskDef): EffectAction {
  const schedulerHints = deriveSchedulerHints(taskDef);
  return {
    effectId: record.effectId,
    invocationKey: record.invocationKey,
    kind: record.kind ?? taskDef.kind,
    label: record.label ?? record.labels?.[0] ?? taskDef.title,
    labels: record.labels ?? taskDef.labels,
    taskDef,
    taskId: record.taskId,
    stepId: record.stepId,
    taskDefRef: record.taskDefRef,
    inputsRef: record.inputsRef,
    requestedAt: record.requestedAt,
    schedulerHints,
  };
}

function deriveSchedulerHints(taskDef: TaskDef): EffectSchedulerHints | undefined {
  const hints: EffectSchedulerHints = {};
  const sleepHint = extractSleepTarget(taskDef);
  if (typeof sleepHint === "number" && Number.isFinite(sleepHint)) {
    hints.sleepUntilEpochMs = sleepHint;
  }
  return Object.keys(hints).length ? hints : undefined;
}

function extractSleepTarget(taskDef: TaskDef): number | undefined {
  if (typeof taskDef.sleep?.targetEpochMs === "number") {
    return taskDef.sleep.targetEpochMs;
  }
  const metadataTarget = (taskDef.metadata as { targetEpochMs?: number } | undefined)?.targetEpochMs;
  return typeof metadataTarget === "number" ? metadataTarget : undefined;
}

export async function resolveStoredResultValue(runDir: string, stored: StoredTaskResult): Promise<unknown> {
  if (stored.result !== undefined) return stored.result;
  if (stored.value !== undefined) return stored.value;
  if (stored.resultRef) {
    const absolute = normalizeRef(runDir, stored.resultRef);
    const raw = await fs.readFile(absolute, "utf8");
    return JSON.parse(raw) as unknown;
  }
  return null;
}

export async function coerceStoredShellFailureResult(runDir: string, stored: StoredTaskResult): Promise<{
  success: false; exitCode: number; stdout: string; stderr: string; error: string;
}> {
  const errorData = isJsonRecord(stored.error?.data) ? stored.error.data : undefined;
  const stdout = await resolveStoredTextArtifact(runDir, stored.stdoutRef)
    ?? readStringField(errorData, "stdout") ?? "";
  const stderr = await resolveStoredTextArtifact(runDir, stored.stderrRef)
    ?? readStringField(errorData, "stderr") ?? "";
  const exitCode = readNumberField(errorData, "exitCode") ?? 1;
  const errorMessage = readStringField(errorData, "error")
    ?? stored.error?.message ?? `Shell command exited with code ${exitCode}`;
  return { success: false, exitCode, stdout, stderr, error: errorMessage };
}

export async function handleResolvedRecord(runDir: string, record: EffectRecord): Promise<unknown> {
  if (record.status === "resolved_error") {
    if (record.kind === "shell") {
      const storedShellResult = await readTaskResult(
        runDir, record.effectId,
        record.resultRef ? normalizeRef(runDir, record.resultRef) : undefined
      );
      if (!storedShellResult) {
        throw new RunFailedError(`Result for effect ${record.effectId} is missing from disk`, { effectId: record.effectId });
      }
      return await coerceStoredShellFailureResult(runDir, storedShellResult);
    }
    const error = record.error ? rehydrateSerializedError(record.error) : new Error("Task failed");
    throw error;
  }

  const stored: StoredTaskResult | undefined = await readTaskResult(
    runDir, record.effectId,
    record.resultRef ? normalizeRef(runDir, record.resultRef) : undefined
  );
  if (!stored) {
    throw new RunFailedError(`Result for effect ${record.effectId} is missing from disk`, { effectId: record.effectId });
  }
  if (stored.status !== "ok") {
    const err = stored.error ? rehydrateSerializedError(stored.error) : new Error("Task reported failure");
    throw err;
  }
  return await resolveStoredResultValue(runDir, stored);
}

async function resolveStoredTextArtifact(runDir: string, ref?: string): Promise<string | undefined> {
  if (!ref) return undefined;
  try { const absolute = normalizeRef(runDir, ref); return await fs.readFile(absolute, "utf8"); }
  catch { return undefined; }
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringField(value: Record<string, unknown> | undefined, key: string): string | undefined {
  const candidate = value?.[key];
  return typeof candidate === "string" ? candidate : undefined;
}

function readNumberField(value: Record<string, unknown> | undefined, key: string): number | undefined {
  const candidate = value?.[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : undefined;
}

export function collectInvocationLabels(ctx: TaskBuildContext, taskDef: TaskDef): string[] {
  const combined: string[] = [];
  const addLabels = (values?: string[]) => { if (Array.isArray(values)) combined.push(...values); };
  addLabels(ctx.labels);
  addLabels(taskDef.labels);
  return dedupeLabels(combined);
}

function dedupeLabels(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

export function deriveEffectLabel(ctx: TaskBuildContext, taskDef: TaskDef, labels: string[], fallbackTaskId: string): string {
  return ctx.label ?? labels[0] ?? taskDef.title ?? fallbackTaskId;
}
