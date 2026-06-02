/**
 * Type definitions for the effects API.
 * Extracted from effects.ts for max-lines compliance.
 */

import type { JsonRecord } from "@a5c-ai/babysitter-sdk";

export type EffectStatusFilter = "requested" | "resolved" | "cancelled";
export type EffectStatusOutput = "requested" | "resolved_ok" | "resolved_error" | "cancelled";

export interface ListEffectsInput {
  runDir: string;
  filter?: { kind?: string | string[]; status?: EffectStatusFilter };
}

export interface EffectSummary {
  effectId: string;
  kind?: string;
  status: EffectStatusOutput;
  taskId?: string;
  labels?: string[];
  requestedAt?: string;
  resolvedAt?: string;
}

export interface ListEffectsOutput { effects: EffectSummary[] }

export interface ShowEffectInput { runDir: string; effectId: string }

export interface ShowEffectOutput {
  effectId: string;
  kind?: string;
  status: EffectStatusOutput;
  taskId?: string;
  labels?: string[];
  requestedAt?: string;
  resolvedAt?: string;
  taskDefinition?: JsonRecord;
  result?: unknown;
  autoApproval?: unknown;
}

export interface CancelEffectInput { runDir: string; effectId: string; reason?: string }
export interface CancelEffectOutput { resultRef: string }

export interface BatchCommitEffectEntry {
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
}

export interface BatchCommitEffectsInput { runDir: string; effects: BatchCommitEffectEntry[] }
export interface BatchCommitEffectResult { effectId: string; ok: boolean; resultRef?: string; error?: string }
export interface BatchCommitEffectsOutput { results: BatchCommitEffectResult[] }
