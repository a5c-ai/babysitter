/**
 * GAP-OBS-004: Policy Decision Trail.
 *
 * Audit trail for governance policy decisions. Records which policies
 * were evaluated, their results, and the final decision for each
 * effect dispatch.
 */

import type { PolicyRule, PolicyDecision } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Record of a single policy's evaluation against an effect. */
export interface PolicyEvalRecord {
  ruleId: string;
  ruleKind: string;
  action: string;
  matched: boolean;
  priority: number;
}

/** Full audit entry for one effect dispatch decision. */
export interface DecisionTrailEntry {
  effectId: string;
  effectKind: string;
  evaluatedAt: string;
  policies: PolicyEvalRecord[];
  finalOutcome: "allow" | "deny";
  decidingRuleId: string | undefined;
  reason: string;
  warnings: string[];
  runId?: string;
  stepId?: string;
}

/** Options to build a decision trail entry. */
export interface DecisionTrailOptions {
  effectId: string;
  effectKind: string;
  rulesEvaluated: PolicyRule[];
  finalDecision: PolicyDecision;
  matchedRuleId?: string;
  runId?: string;
  stepId?: string;
}

/** Summary statistics for a set of decision trail entries. */
export interface DecisionTrailSummary {
  totalEffects: number;
  allowCount: number;
  denyCount: number;
  topDecidingRules: Array<{ ruleId: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Build a DecisionTrailEntry from evaluation options.
 * Pure function — no I/O.
 */
export function buildDecisionTrailEntry(
  options: DecisionTrailOptions,
): DecisionTrailEntry {
  const policies: PolicyEvalRecord[] = options.rulesEvaluated.map((rule) => ({
    ruleId: rule.id,
    ruleKind: rule.kind,
    action: rule.action,
    matched: rule.id === options.matchedRuleId,
    priority: rule.priority,
  }));

  return {
    effectId: options.effectId,
    effectKind: options.effectKind,
    evaluatedAt: new Date().toISOString(),
    policies,
    finalOutcome: options.finalDecision.allowed ? "allow" : "deny",
    decidingRuleId: options.matchedRuleId,
    reason: options.finalDecision.reason,
    warnings: options.finalDecision.warnings,
    runId: options.runId,
    stepId: options.stepId,
  };
}

/**
 * Summarize a collection of decision trail entries.
 * Pure function — no I/O.
 */
export function summarizeDecisionTrail(
  entries: DecisionTrailEntry[],
): DecisionTrailSummary {
  let allowCount = 0;
  let denyCount = 0;
  const ruleFreq = new Map<string, number>();

  for (const entry of entries) {
    if (entry.finalOutcome === "allow") {
      allowCount++;
    } else {
      denyCount++;
    }

    if (entry.decidingRuleId) {
      ruleFreq.set(
        entry.decidingRuleId,
        (ruleFreq.get(entry.decidingRuleId) ?? 0) + 1,
      );
    }
  }

  const topDecidingRules = [...ruleFreq.entries()]
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEffects: entries.length,
    allowCount,
    denyCount,
    topDecidingRules,
  };
}
