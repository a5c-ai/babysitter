/**
 * Run status and inspection APIs (GAP-OBS-001, GAP-UX-005, GAP-UX-006).
 *
 * - getRunHealthSnapshot: wraps computeRunHealthFromEvents with journal loading
 * - getOrchestrationStatus: structured status view combining metadata, health, effects
 * - getPendingWorkItems: detailed inspection of pending effects
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { loadJournal, readRunMetadata, type JsonRecord } from "@a5c-ai/babysitter-sdk";
import { computeRunHealthFromEvents } from "./health";
import type { RunHealthSnapshot } from "./types";

// ---------------------------------------------------------------------------
// GAP-OBS-001: Run Health Snapshot
// ---------------------------------------------------------------------------

/**
 * Compute a health snapshot for a run by loading its journal.
 */
export async function getRunHealthSnapshot(
  runDir: string,
): Promise<RunHealthSnapshot> {
  const events = await loadJournal(runDir);
  return computeRunHealthFromEvents(events);
}

// ---------------------------------------------------------------------------
// GAP-UX-005: Structured Orchestration Status
// ---------------------------------------------------------------------------

export type OrchestrationPhase =
  | "created"
  | "running"
  | "waiting"
  | "completed"
  | "failed";

export interface OrchestrationStatus {
  runId: string;
  processId: string;
  phase: OrchestrationPhase;
  iterationCount: number;
  totalEffects: number;
  pendingEffects: number;
  resolvedEffects: number;
  failedEffects: number;
  health: RunHealthSnapshot;
  createdAt: string;
  lastActivityAt: string | null;
}

/**
 * Get structured orchestration status for a run.
 */
export async function getOrchestrationStatus(
  runDir: string,
): Promise<OrchestrationStatus> {
  const [metadata, events] = await Promise.all([
    readRunMetadata(runDir),
    loadJournal(runDir),
  ]);

  const health = computeRunHealthFromEvents(events);

  // Determine phase from events
  let phase: OrchestrationPhase = "created";
  const hasCompleted = events.some((e) => e.type === "RUN_COMPLETED");
  const hasFailed = events.some((e) => e.type === "RUN_FAILED");
  const hasPending = health.metrics.pendingCount > 0;

  if (hasFailed) {
    phase = "failed";
  } else if (hasCompleted) {
    phase = "completed";
  } else if (hasPending) {
    phase = "waiting";
  } else if (events.length > 1) {
    phase = "running";
  }

  return {
    runId: metadata.runId,
    processId: metadata.processId,
    phase,
    iterationCount: health.metrics.iterationCount,
    totalEffects: health.metrics.totalEffects,
    pendingEffects: health.metrics.pendingCount,
    resolvedEffects: health.metrics.resolvedEffects,
    failedEffects: health.metrics.failedEffects,
    health,
    createdAt: metadata.createdAt,
    lastActivityAt: health.metrics.lastActivityAt,
  };
}

// ---------------------------------------------------------------------------
// GAP-UX-006: Pending Work Inspector
// ---------------------------------------------------------------------------

export interface PendingWorkItem {
  effectId: string;
  taskId?: string;
  kind?: string;
  title?: string;
  requestedAt: string;
  ageMs: number;
  labels?: string[];
}

/**
 * List pending (unresolved) effects with rich detail.
 */
export async function getPendingWorkItems(
  runDir: string,
): Promise<PendingWorkItem[]> {
  const events = await loadJournal(runDir);
  const now = Date.now();

  // Track requested and resolved effect IDs
  const requested = new Map<
    string,
    { effectId: string; requestedAt: string; data: Record<string, unknown> }
  >();
  const resolved = new Set<string>();

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const effectId = typeof event.data.effectId === "string"
        ? event.data.effectId
        : undefined;
      if (effectId) {
        requested.set(effectId, {
          effectId,
          requestedAt: event.recordedAt,
          data: event.data,
        });
      }
    }
    if (event.type === "EFFECT_RESOLVED") {
      const effectId = typeof event.data.effectId === "string"
        ? event.data.effectId
        : undefined;
      if (effectId) {
        resolved.add(effectId);
      }
    }
  }

  // Build pending items
  const items: PendingWorkItem[] = [];
  for (const [effectId, req] of requested) {
    if (resolved.has(effectId)) continue;

    const reqTs = new Date(req.requestedAt).getTime();

    // Try to read task definition for richer details
    let title: string | undefined;
    let kind: string | undefined;
    let taskId: string | undefined;
    let labels: string[] | undefined;

    try {
      const taskPath = path.join(runDir, "tasks", effectId, "task.json");
      const raw = await fs.readFile(taskPath, "utf-8");
      const taskDef = JSON.parse(raw) as JsonRecord;
      title = typeof taskDef.title === "string" ? taskDef.title : undefined;
      kind = typeof taskDef.kind === "string" ? taskDef.kind : undefined;
      taskId = typeof taskDef.taskId === "string" ? taskDef.taskId : undefined;
      labels = Array.isArray(taskDef.labels) ? (taskDef.labels as string[]) : undefined;
    } catch {
      // Task def may not exist for all effect types
      kind = typeof req.data.kind === "string" ? req.data.kind : undefined;
      taskId = typeof req.data.taskId === "string" ? req.data.taskId : undefined;
    }

    items.push({
      effectId,
      taskId,
      kind,
      title,
      requestedAt: req.requestedAt,
      ageMs: now - reqTs,
      labels,
    });
  }

  // Sort by age descending (oldest first)
  items.sort((a, b) => b.ageMs - a.ageMs);

  return items;
}
