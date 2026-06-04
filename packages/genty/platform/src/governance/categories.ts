/**
 * GAP-SEC: Deterministic Policy Categories.
 *
 * Categorizes policy rules into A/B/C/D tiers with distinct enforcement
 * behaviors and wraps the base policy engine with category-aware evaluation.
 */

import { createPolicyEngine } from './engine';
import type { PolicyRule, PolicyEvaluationContext, PolicyDecision } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Policy category identifiers. */
export type PolicyCategory = 'A' | 'B' | 'C' | 'D';

/** A PolicyRule annotated with a category. */
export interface CategorizedPolicyRule extends PolicyRule {
  category?: PolicyCategory;
}

/** Enforcement behavior per category. */
export interface CategoryEnforcementBehavior {
  category: PolicyCategory;
  description: string;
  immutable: boolean;
  requiresClassification: boolean;
  isFallback: boolean;
}

/** Extended decision with category metadata. */
export interface CategorizedPolicyDecision extends PolicyDecision {
  requiresClassification?: boolean;
  usedFallback?: boolean;
}

/** Categorized engine interface. */
export interface CategorizedPolicyEngine {
  readonly rules: readonly CategorizedPolicyRule[];
  evaluate(context: PolicyEvaluationContext): CategorizedPolicyDecision;
}

// ---------------------------------------------------------------------------
// Category behaviours
// ---------------------------------------------------------------------------

const _CATEGORY_BEHAVIORS: Record<PolicyCategory, CategoryEnforcementBehavior> = {
  A: { category: 'A', description: 'Immutable critical rules', immutable: true, requiresClassification: false, isFallback: false },
  B: { category: 'B', description: 'Advisory rules', immutable: false, requiresClassification: false, isFallback: false },
  C: { category: 'C', description: 'Classification-required rules', immutable: false, requiresClassification: true, isFallback: false },
  D: { category: 'D', description: 'Fallback posture-based rules', immutable: false, requiresClassification: false, isFallback: true },
};

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Wrap a plain PolicyRule with a category annotation.
 */
export function categorizePolicyRule(rule: PolicyRule, category: PolicyCategory): CategorizedPolicyRule {
  return { ...rule, category };
}

/**
 * Infer a category for a rule that lacks one.
 *
 * Heuristic:
 * - rate-limit + deny -> A (critical)
 * - permission + deny -> C (needs classification)
 * - trust-level       -> D (fallback)
 * - everything else   -> B (advisory)
 */
export function inferPolicyCategory(rule: PolicyRule): PolicyCategory {
  if (rule.kind === 'rate-limit' && rule.action === 'deny') return 'A';
  if (rule.kind === 'permission' && rule.action === 'deny') return 'C';
  if (rule.kind === 'trust-level') return 'D';
  return 'B';
}

/**
 * Create a categorized policy engine that evaluates rules with
 * category-aware precedence:
 *
 * 1. Category A (immutable) - evaluated first, cannot be overridden
 * 2. Category B (advisory)  - warnings / normal evaluation
 * 3. Category C (classification-required) - denials flagged
 * 4. Category D (fallback)  - posture-based fallback
 *
 * Accepts CategorizedPolicyRule[] (rules without a category are auto-inferred).
 */
export function createCategorizedEngine(rules: CategorizedPolicyRule[]): CategorizedPolicyEngine {
  // Ensure every rule has a category
  const categorized: CategorizedPolicyRule[] = rules.map(r =>
    r.category ? r : { ...r, category: inferPolicyCategory(r) },
  );

  // Partition by category
  const byCategory: Record<PolicyCategory, CategorizedPolicyRule[]> = { A: [], B: [], C: [], D: [] };
  for (const rule of categorized) {
    byCategory[rule.category!].push(rule);
  }

  // Build per-category engines
  const engineA = createPolicyEngine(byCategory.A);
  const engineB = createPolicyEngine(byCategory.B);
  const engineC = createPolicyEngine(byCategory.C);
  const engineD = createPolicyEngine(byCategory.D);

  return {
    rules: Object.freeze([...categorized]),

    evaluate(context: PolicyEvaluationContext): CategorizedPolicyDecision {
      const allWarnings: string[] = [];

      // 1. Category A - immutable, first match wins
      if (byCategory.A.length > 0) {
        const decisionA = engineA.evaluate(context);
        allWarnings.push(...decisionA.warnings);
        if (!decisionA.allowed) {
          return { ...decisionA, warnings: allWarnings };
        }
        // If A explicitly allows, still continue to collect warnings from B
        // but A deny is final.
      }

      // 2. Category B - advisory (collect warnings)
      if (byCategory.B.length > 0) {
        const decisionB = engineB.evaluate(context);
        allWarnings.push(...decisionB.warnings);
        // B deny/allow also applies if no A deny
        if (!decisionB.allowed) {
          return { ...decisionB, warnings: allWarnings };
        }
      }

      // 3. Category C - requires classification
      if (byCategory.C.length > 0) {
        const decisionC = engineC.evaluate(context);
        allWarnings.push(...decisionC.warnings);
        if (!decisionC.allowed) {
          return { ...decisionC, warnings: allWarnings, requiresClassification: true };
        }
      }

      // 4. Category D - fallback
      if (byCategory.D.length > 0) {
        const decisionD = engineD.evaluate(context);
        allWarnings.push(...decisionD.warnings);
        if (decisionD.rule) {
          return { ...decisionD, warnings: allWarnings, usedFallback: true };
        }
      }

      // Default allow
      return {
        allowed: true,
        reason: 'Allowed by default policy',
        warnings: allWarnings,
      };
    },
  };
}
