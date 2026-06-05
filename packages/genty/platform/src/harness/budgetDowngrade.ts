import { MODEL_PRICING, resolvePricing, type ModelPricing } from '../cost/types';

export interface BudgetDowngradeResult {
  currentModel: string;
  suggestedModel: string;
  reason: string;
  currentCostPerMToken: number;
  suggestedCostPerMToken: number;
  savingsPercent: number;
}

const MODEL_TIERS: string[][] = [
  ['claude-opus-4-6', 'claude-opus-4-5'],
  ['claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-sonnet-4-0'],
  ['claude-haiku-4-5', 'claude-haiku-3-5'],
];

function effectiveCostPerMToken(pricing: ModelPricing): number {
  return pricing.inputPer1M + pricing.outputPer1M;
}

function findCheaperModels(currentModel: string): string[] {
  const currentPricing = resolvePricing(currentModel);
  if (!currentPricing) return [];

  const currentCost = effectiveCostPerMToken(currentPricing);
  const cheaper: Array<{ model: string; cost: number }> = [];

  for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
    const cost = effectiveCostPerMToken(pricing);
    if (cost < currentCost) {
      cheaper.push({ model, cost });
    }
  }

  // Sort by cost descending — prefer the closest cheaper model (least capability loss)
  cheaper.sort((a, b) => b.cost - a.cost);
  return cheaper.map(c => c.model);
}

export function suggestBudgetDowngrade(
  currentModel: string,
  currentCostUsd: number,
  budgetUsd: number,
  budgetThreshold = 0.8,
): BudgetDowngradeResult | undefined {
  if (budgetUsd <= 0) return undefined;
  if (currentCostUsd < budgetUsd * budgetThreshold) return undefined;

  const currentPricing = resolvePricing(currentModel);
  if (!currentPricing) return undefined;

  const cheaper = findCheaperModels(currentModel);
  if (cheaper.length === 0) return undefined;

  const suggestedModel = cheaper[0];
  const suggestedPricing = resolvePricing(suggestedModel);
  if (!suggestedPricing) return undefined;

  const currentCost = effectiveCostPerMToken(currentPricing);
  const suggestedCost = effectiveCostPerMToken(suggestedPricing);
  const savingsPercent = Math.round(((currentCost - suggestedCost) / currentCost) * 100);

  const budgetPercent = Math.round((currentCostUsd / budgetUsd) * 100);

  return {
    currentModel,
    suggestedModel,
    reason: `Session cost at ${budgetPercent}% of budget ($${currentCostUsd.toFixed(2)}/$${budgetUsd.toFixed(2)}). Downgrading from ${currentModel} to ${suggestedModel} saves ~${savingsPercent}% per token.`,
    currentCostPerMToken: currentCost,
    suggestedCostPerMToken: suggestedCost,
    savingsPercent,
  };
}

export function getModelTier(model: string): number {
  for (let i = 0; i < MODEL_TIERS.length; i++) {
    if (MODEL_TIERS[i].some(m => model.startsWith(m))) return i;
  }
  return -1;
}

export function isDowngradeAcceptable(
  currentModel: string,
  suggestedModel: string,
  minTier?: number,
): boolean {
  const suggestedTier = getModelTier(suggestedModel);
  if (minTier !== undefined && suggestedTier > minTier) return false;
  return suggestedTier >= 0;
}
