/**
 * Shared API utility functions for result envelope construction, path checks,
 * and journal effect parsing.
 */

import { promises as fs } from "fs";
import type { ApiResult } from "./runs";
import type { JournalEvent } from "@a5c-ai/babysitter-sdk";

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function fail<T>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ── Shared effect journal parsing ─────────────────────────────────────────

export interface BaseEffectInfo {
  effectId: string;
  kind?: string;
  taskId?: string;
  labels?: string[];
  invocationKey?: string;
  requestedAt?: string;
  resolvedAt?: string;
  /** Raw status from resolution event ("ok" | "error" | undefined for requested/cancelled). */
  resolvedStatus?: string;
  /** High-level lifecycle state. */
  lifecycle: "requested" | "resolved" | "cancelled";
}

/**
 * Parse journal events into a map of effect info keyed by effectId.
 * Shared between effects.ts and breakpoints.ts to avoid duplication.
 */
export function buildBaseEffectMap(events: JournalEvent[]): Map<string, BaseEffectInfo> {
  const effects = new Map<string, BaseEffectInfo>();

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const data = event.data as Record<string, unknown>;
      const effectId = data.effectId as string | undefined;
      if (!effectId) continue;
      effects.set(effectId, {
        effectId,
        kind: typeof data.kind === "string" ? data.kind : undefined,
        taskId: typeof data.taskId === "string" ? data.taskId : undefined,
        labels: Array.isArray(data.labels) ? (data.labels as string[]) : undefined,
        invocationKey: typeof data.invocationKey === "string" ? data.invocationKey : undefined,
        lifecycle: "requested",
        requestedAt: event.recordedAt,
      });
    } else if (event.type === "EFFECT_RESOLVED") {
      const data = event.data as Record<string, unknown>;
      const effectId = data.effectId as string | undefined;
      if (!effectId) continue;
      const existing = effects.get(effectId);
      if (existing) {
        existing.lifecycle = "resolved";
        existing.resolvedStatus = typeof data.status === "string" ? data.status : undefined;
        existing.resolvedAt = event.recordedAt;
      }
    } else if (event.type === "EFFECT_CANCELLED") {
      const data = event.data as Record<string, unknown>;
      const effectId = data.effectId as string | undefined;
      if (!effectId) continue;
      const existing = effects.get(effectId);
      if (existing) {
        existing.lifecycle = "cancelled";
        existing.resolvedAt = event.recordedAt;
      }
    }
  }

  return effects;
}
