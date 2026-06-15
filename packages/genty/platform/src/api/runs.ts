/**
 * GAP-JSON-001: Programmatic API for run lifecycle.
 *
 * Thin typed wrappers over existing runtime functions with validation,
 * error handling, and ApiResult envelopes.  These functions never throw.
 */

import { promises as fs } from "fs";
import * as path from "path";
// SDK-owned: orchestration iteration loop is the core SDK runtime engine
import {
  orchestrateIteration,
} from "@a5c-ai/babysitter-sdk";
import { getGlobalRegistry, loadJournalEvents } from "../orchestration/global";
import { readRunMetadata } from "../storage/runFiles";
import type {
  EffectAction,
  IterationResult,
  JournalEvent,
  JsonRecord,
} from "../types";

// ── Result envelope ─────────────────────────────────────────────────────────

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail<T>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

// ── Input / output types ────────────────────────────────────────────────────

export interface ApiCreateRunInput {
  processId: string;
  entrypoint: string;
  runsDir?: string;
  inputs?: unknown;
  prompt?: string;
  harness?: string;
}

export interface ApiIterateOutput {
  status: IterationResult["status"];
  output?: unknown;
  error?: unknown;
  nextActions?: EffectAction[];
  metadata?: unknown;
}

export interface RunStatusOutput {
  state: "created" | "running" | "waiting" | "completed" | "failed";
  processId: string;
  runId: string;
  pendingEffects: Array<{ effectId: string; kind?: string }>;
}

export interface RunEventsOutput {
  events: Array<{
    seq: number;
    type: string;
    recordedAt: string;
    data: JsonRecord;
  }>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseEntrypoint(entrypoint: string): { importPath: string; exportName: string | undefined } {
  const hashIndex = entrypoint.lastIndexOf("#");
  if (hashIndex <= 0) {
    return { importPath: entrypoint, exportName: undefined };
  }
  return {
    importPath: entrypoint.slice(0, hashIndex),
    exportName: entrypoint.slice(hashIndex + 1) || undefined,
  };
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function classifyError(error: unknown): { code: string; message: string } {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.startsWith("Unknown effectId")) {
    return { code: "UNKNOWN_EFFECT", message: msg };
  }

  return { code: "INTERNAL_ERROR", message: msg };
}

// ── API functions ───────────────────────────────────────────────────────────

export async function apiCreateRun(
  input: ApiCreateRunInput,
): Promise<ApiResult<{ runId: string; runDir: string }>> {
  try {
    // Validate inputs
    if (!input.processId || typeof input.processId !== "string") {
      return fail("INVALID_INPUT", "processId must be a non-empty string");
    }
    if (!input.entrypoint || typeof input.entrypoint !== "string") {
      return fail("INVALID_INPUT", "entrypoint must be a non-empty string");
    }
    const { importPath, exportName } = parseEntrypoint(input.entrypoint);

    const orch = getGlobalRegistry().getOrchestration();
    const result = await orch.createRun({
      processId: input.processId,
      entrypoint: input.entrypoint,
      prompt: input.prompt ?? "",
      harness: input.harness,
      inputs: input.inputs as Record<string, unknown> | undefined,
      runsDir: input.runsDir ?? orch.resolveRunsDir(),
    });

    return ok({ runId: result.runId, runDir: result.runDir });
  } catch (error) {
    const classified = classifyError(error);
    return fail(classified.code, classified.message);
  }
}

export async function apiIterate(
  input: { runDir: string },
): Promise<ApiResult<ApiIterateOutput>> {
  try {
    if (!(await pathExists(input.runDir))) {
      return fail("RUN_NOT_FOUND", `Run directory not found: ${input.runDir}`);
    }

    const result = await orchestrateIteration({
      runDir: input.runDir,
      subprocessSupport: "agent-platform",
    });

    const output: ApiIterateOutput = { status: result.status };
    if (result.metadata !== undefined) {
      output.metadata = result.metadata;
    }

    if (result.status === "completed") {
      output.output = result.output;
    } else if (result.status === "waiting") {
      output.nextActions = result.nextActions;
    } else if (result.status === "failed" || result.status === "process-error") {
      output.error = result.error;
    }

    return ok(output);
  } catch (error) {
    const classified = classifyError(error);
    return fail(classified.code, classified.message);
  }
}

export async function apiCommitEffect(
  input: {
    runDir: string;
    effectId: string;
    result: {
      status: "ok" | "error";
      value?: unknown;
      error?: string;
      stdout?: string;
      stderr?: string;
      stdoutRef?: string;
      stderrRef?: string;
      startedAt?: string;
      finishedAt?: string;
      metadata?: JsonRecord;
    };
  },
): Promise<ApiResult<{ resultRef: string }>> {
  try {
    if (input.result.status === "ok" && input.result.value === undefined) {
      return fail("INVALID_INPUT", "value is required when status is 'ok'");
    }
    if (input.result.status === "error" && !input.result.error) {
      return fail("INVALID_INPUT", "error is required when status is 'error'");
    }

    const handle = {
      runId: input.runDir.split(/[\\/]/).pop() ?? "",
      runDir: input.runDir,
      processId: "",
      status: "running" as const,
    };
    await getGlobalRegistry().getOrchestration().postEffectResult(
      handle,
      input.effectId,
      {
        status: input.result.status,
        value: input.result.status === "ok" ? input.result.value : undefined,
        error: input.result.status === "error" ? input.result.error : undefined,
        startedAt: input.result.startedAt,
        finishedAt: input.result.finishedAt,
      },
    );

    return ok({ resultRef: `tasks/${input.effectId}/result.json` });
  } catch (error) {
    const classified = classifyError(error);
    return fail(classified.code, classified.message);
  }
}

export async function apiRunStatus(
  input: { runId: string; runsDir?: string },
): Promise<ApiResult<RunStatusOutput>> {
  try {
    const runDir = path.join(input.runsDir ?? getGlobalRegistry().getOrchestration().resolveRunsDir(), input.runId);

    if (!(await pathExists(runDir))) {
      return fail("RUN_NOT_FOUND", `Run not found: ${input.runId}`);
    }

    const metadata = await readRunMetadata(runDir);
    const events = await loadJournalEvents(runDir);

    const state = deriveRunState(events);
    const pendingEffects = derivePendingEffects(events);

    return ok({
      state,
      processId: metadata.processId,
      runId: metadata.runId,
      pendingEffects,
    });
  } catch (error) {
    const classified = classifyError(error);
    return fail(classified.code, classified.message);
  }
}

export async function apiRunEvents(
  input: { runId: string; runsDir?: string; limit?: number; filterType?: string },
): Promise<ApiResult<RunEventsOutput>> {
  try {
    if (input.limit !== undefined && input.limit < 0) {
      return fail("INVALID_INPUT", "limit must be a non-negative number");
    }

    const runDir = path.join(input.runsDir ?? getGlobalRegistry().getOrchestration().resolveRunsDir(), input.runId);

    if (!(await pathExists(runDir))) {
      return fail("RUN_NOT_FOUND", `Run not found: ${input.runId}`);
    }

    let events = await loadJournalEvents(runDir);

    if (input.filterType) {
      events = events.filter((e) => e.type === input.filterType);
    }

    if (input.limit !== undefined) {
      events = events.slice(0, input.limit);
    }

    return ok({
      events: events.map((e) => ({
        seq: e.seq,
        type: e.type,
        recordedAt: e.recordedAt,
        data: e.data,
      })),
    });
  } catch (error) {
    const classified = classifyError(error);
    return fail(classified.code, classified.message);
  }
}

// ── State derivation helpers ────────────────────────────────────────────────

function deriveRunState(
  events: JournalEvent[],
): "created" | "running" | "waiting" | "completed" | "failed" {
  // Walk events in reverse to find the latest terminal or pending state.
  for (let i = events.length - 1; i >= 0; i--) {
    const type = events[i].type;
    if (type === "RUN_COMPLETED") return "completed";
    if (type === "RUN_FAILED") return "failed";
  }

  // Check if there are any unresolved EFFECT_REQUESTED events.
  const requested = new Set<string>();
  const resolved = new Set<string>();

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const effectId = (event.data as Record<string, unknown>).effectId as string | undefined;
      if (effectId) requested.add(effectId);
    } else if (event.type === "EFFECT_RESOLVED" || event.type === "EFFECT_CANCELLED") {
      const effectId = (event.data as Record<string, unknown>).effectId as string | undefined;
      if (effectId) resolved.add(effectId);
    }
  }

  const pending = [...requested].filter((id) => !resolved.has(id));
  if (pending.length > 0) return "waiting";

  // Has any iteration happened?
  const hasCreated = events.some((e) => e.type === "RUN_CREATED");
  if (hasCreated && resolved.size > 0) return "running";

  return "created";
}

function derivePendingEffects(
  events: JournalEvent[],
): Array<{ effectId: string; kind?: string }> {
  const requested = new Map<string, { effectId: string; kind?: string }>();
  const resolved = new Set<string>();

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const data = event.data as Record<string, unknown>;
      const effectId = data.effectId as string | undefined;
      if (effectId) {
        requested.set(effectId, {
          effectId,
          kind: typeof data.kind === "string" ? data.kind : undefined,
        });
      }
    } else if (event.type === "EFFECT_RESOLVED" || event.type === "EFFECT_CANCELLED") {
      const effectId = (event.data as Record<string, unknown>).effectId as string | undefined;
      if (effectId) resolved.add(effectId);
    }
  }

  return [...requested.entries()]
    .filter(([id]) => !resolved.has(id))
    .map(([, info]) => info);
}
