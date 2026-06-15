import type {
  PolicyRule,
  PolicyCondition,
  PolicyEvaluationContext,
  PolicyDecision,
  PolicyEngine,
} from "./types";
import { isStatefulRule } from "./types";

function resolveField(context: PolicyEvaluationContext, fieldPath: string): unknown {
  const parts = fieldPath.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function matchCondition(condition: PolicyCondition, context: PolicyEvaluationContext): boolean {
  const fieldValue = resolveField(context, condition.field);

  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  switch (condition.op) {
    case "eq":
      return String(fieldValue) === condition.value;
    case "neq":
      return String(fieldValue) !== condition.value;
    case "gt":
      return typeof fieldValue === "number" && fieldValue > Number(condition.value);
    case "lt":
      return typeof fieldValue === "number" && fieldValue < Number(condition.value);
    case "gte":
      return typeof fieldValue === "number" && fieldValue >= Number(condition.value);
    case "lte":
      return typeof fieldValue === "number" && fieldValue <= Number(condition.value);
    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return String(fieldValue).includes(condition.value);
    case "matches":
      try {
        return new RegExp(condition.value).test(String(fieldValue));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

function ruleMatches(rule: PolicyRule, context: PolicyEvaluationContext): boolean {
  if (isStatefulRule(rule)) {
    return rule.shouldMatch(context);
  }
  return matchCondition(rule.condition, context);
}

export function createPolicyEngine(rules: PolicyRule[]): PolicyEngine {
  const denyRules = rules.filter((rule) => rule.action === "deny").sort((a, b) => b.priority - a.priority);
  const warnRules = rules.filter((rule) => rule.action === "warn").sort((a, b) => b.priority - a.priority);
  const allowRules = rules.filter((rule) => rule.action === "allow").sort((a, b) => b.priority - a.priority);

  return {
    rules: Object.freeze([...rules]),
    evaluate(context: PolicyEvaluationContext): PolicyDecision {
      const warnings: string[] = [];

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

      for (const rule of warnRules) {
        if (ruleMatches(rule, context)) {
          warnings.push(`Warning from rule ${rule.id}: ${rule.metadata?.reason ?? rule.kind}`);
        }
      }

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

      return {
        allowed: true,
        reason: "Allowed by default policy",
        warnings,
      };
    },
  };
}
