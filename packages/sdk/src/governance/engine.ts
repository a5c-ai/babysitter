/**
 * Governance Policy Engine (GAP-SEC-001).
 * Evaluates declarative policy rules with precedence: deny > warn > allow > default-allow.
 */

import type {
  PolicyRule,
  PolicyCondition,
  PolicyEvaluationContext,
  PolicyDecision,
  PolicyEngine,
} from './types';
import { isStatefulRule } from './types';

/**
 * Resolve a dot-notation field path against the evaluation context.
 * Returns undefined if any segment is missing.
 */
function resolveField(context: PolicyEvaluationContext, fieldPath: string): unknown {
  const parts = fieldPath.split('.');
  let current: unknown = context;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Evaluate a single condition against the evaluation context.
 */
export function matchCondition(condition: PolicyCondition, context: PolicyEvaluationContext): boolean {
  const fieldValue = resolveField(context, condition.field);

  if (fieldValue === undefined || fieldValue === null) return false;

  switch (condition.op) {
    case 'eq':
      return String(fieldValue) === condition.value;

    case 'neq':
      return String(fieldValue) !== condition.value;

    case 'gt':
      return typeof fieldValue === 'number' && fieldValue > Number(condition.value);

    case 'lt':
      return typeof fieldValue === 'number' && fieldValue < Number(condition.value);

    case 'gte':
      return typeof fieldValue === 'number' && fieldValue >= Number(condition.value);

    case 'lte':
      return typeof fieldValue === 'number' && fieldValue <= Number(condition.value);

    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return String(fieldValue).includes(condition.value);

    case 'matches':
      try {
        return new RegExp(condition.value).test(String(fieldValue));
      } catch {
        return false;
      }

    default:
      return false;
  }
}

/**
 * Check whether a rule matches the given context.
 * Uses the stateful shouldMatch callback if present, otherwise declarative matchCondition.
 */
function ruleMatches(rule: PolicyRule, context: PolicyEvaluationContext): boolean {
  if (isStatefulRule(rule)) {
    return rule.shouldMatch(context);
  }
  return matchCondition(rule.condition, context);
}

/**
 * Create a policy engine from a set of rules.
 *
 * Evaluation precedence:
 * 1. Deny rules (sorted by priority desc) — first match blocks
 * 2. Warn rules (all matching collected as warnings)
 * 3. Allow rules (sorted by priority desc) — first match allows explicitly
 * 4. Default: allow
 */
export function createPolicyEngine(rules: PolicyRule[]): PolicyEngine {
  // Pre-sort rules by action group, then priority descending
  const denyRules = rules.filter(r => r.action === 'deny').sort((a, b) => b.priority - a.priority);
  const warnRules = rules.filter(r => r.action === 'warn').sort((a, b) => b.priority - a.priority);
  const allowRules = rules.filter(r => r.action === 'allow').sort((a, b) => b.priority - a.priority);

  return {
    rules: Object.freeze([...rules]),

    evaluate(context: PolicyEvaluationContext): PolicyDecision {
      const warnings: string[] = [];

      // 1. Deny rules — first match blocks
      for (const rule of denyRules) {
        if (ruleMatches(rule, context)) {
          return {
            allowed: false,
            rule,
            reason: `Denied by rule ${rule.id}`,
            warnings,
          };
        }
      }

      // 2. Warn rules — collect all matching
      for (const rule of warnRules) {
        if (ruleMatches(rule, context)) {
          warnings.push(`Warning from rule ${rule.id}: ${rule.metadata?.reason ?? rule.kind}`);
        }
      }

      // 3. Allow rules — first match allows explicitly
      for (const rule of allowRules) {
        if (ruleMatches(rule, context)) {
          return {
            allowed: true,
            rule,
            reason: `Allowed by rule ${rule.id}`,
            warnings,
          };
        }
      }

      // 4. Default: allow
      return {
        allowed: true,
        reason: 'Allowed by default policy',
        warnings,
      };
    },
  };
}
