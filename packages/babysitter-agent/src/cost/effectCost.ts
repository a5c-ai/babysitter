/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * Per-effect cost aggregation (GAP-SUBOBS-003).
 */
import type { EffectIndex } from "@a5c-ai/babysitter-sdk";

export interface EffectCostSummary {
  effectId: string;
  taskId: string;
  kind: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  costUsd: number;
  model?: string;
}

export interface EffectCostResult {
  effects: EffectCostSummary[];
  totalCostUsd: number;
}

export function computeEffectCosts(index: EffectIndex): EffectCostResult {
  const effects: EffectCostSummary[] = [];
  let totalCostUsd = 0;

  for (const record of index.listEffects()) {
    if (record.costUsd === undefined && record.inputTokens === undefined && record.outputTokens === undefined) {
      continue; // No cost data for this effect
    }
    const summary: EffectCostSummary = {
      effectId: record.effectId,
      taskId: record.taskId,
      kind: record.kind ?? "unknown",
      inputTokens: record.inputTokens ?? 0,
      outputTokens: record.outputTokens ?? 0,
      cacheCreationInputTokens: record.cacheCreationInputTokens ?? 0,
      cacheReadInputTokens: record.cacheReadInputTokens ?? 0,
      costUsd: record.costUsd ?? 0,
      model: record.costModel,
    };
    effects.push(summary);
    totalCostUsd += summary.costUsd;
  }

  return { effects, totalCostUsd };
}
