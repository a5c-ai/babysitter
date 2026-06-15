/**
 * GAP-HADAPT-002: Model Selection Per Task.
 *
 * Bridges task-level model preferences with harness capability routing.
 * Uses selectHarness from capabilityRouter to find the best harness
 * for a task's model requirement.
 */

import {
  selectHarness,
  buildTaskRequirements,
  type HarnessCandidate,
} from "./capabilityRouter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal task definition shape for model selection. */
export interface TaskDefInput {
  kind?: string;
  execution?: {
    harness?: string;
    model?: string;
    permissions?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ModelSelectionResult {
  /** Name of the selected harness, or null if none available. */
  selectedHarness: string | null;
  /** Model that will be used (from task preference or harness default). */
  selectedModel: string | undefined;
  /** Whether a fallback harness was selected (model not matched exactly). */
  fallback: boolean;
  /** Human-readable reason for the selection. */
  reason: string;
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Resolve which harness and model to use for a given task definition.
 *
 * Delegates to selectHarness for scoring, then interprets the result
 * to determine if the model was matched or a fallback was used.
 */
export function resolveModelForTask(
  taskDef: TaskDefInput,
  candidates: HarnessCandidate[],
): ModelSelectionResult {
  if (candidates.length === 0) {
    return {
      selectedHarness: null,
      selectedModel: undefined,
      fallback: false,
      reason: "No harness candidates available",
    };
  }

  const requirements = buildTaskRequirements(taskDef);
  const routingResult = selectHarness(requirements, candidates);

  if (!routingResult) {
    return {
      selectedHarness: null,
      selectedModel: undefined,
      fallback: false,
      reason: "No harness met minimum score threshold",
    };
  }

  const preferredModel = requirements.preferredModel;
  const selectedCandidate = routingResult.selected;

  // Check if the selected harness actually has the preferred model
  const hasExactModel = preferredModel
    ? selectedCandidate?.supportedModels?.includes(preferredModel) ?? false
    : false;

  const hasFamilyMatch = preferredModel && !hasExactModel
    ? selectedCandidate?.supportedModels?.some((m) =>
        modelFamilyMatch(m, preferredModel),
      ) ?? false
    : false;

  const modelMatched = hasExactModel || hasFamilyMatch;
  const isFallback = typeof preferredModel === "string" && !modelMatched;

  let reason: string;
  if (!preferredModel) {
    reason = `Selected ${routingResult.selected.name} (no model preference)`;
  } else if (hasExactModel) {
    reason = `Selected ${routingResult.selected.name} — exact model match for ${preferredModel}`;
  } else if (hasFamilyMatch) {
    reason = `Selected ${routingResult.selected.name} — model family match for ${preferredModel}`;
  } else {
    reason = `Selected ${routingResult.selected.name} as fallback — preferred model ${preferredModel} not available`;
  }

  return {
    selectedHarness: routingResult.selected.name,
    selectedModel: preferredModel,
    fallback: isFallback,
    reason,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if two model names share the same family (e.g., "claude-sonnet-4" and "claude-sonnet-4-latest").
 */
function modelFamilyMatch(available: string, preferred: string): boolean {
  const familyA = available.split("-").slice(0, -1).join("-");
  const familyB = preferred.split("-").slice(0, -1).join("-");
  return familyA.length > 0 && familyA === familyB;
}
