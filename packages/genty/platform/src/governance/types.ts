export type {
  PolicyRuleKind,
  PolicyConditionOp,
  PolicyAction,
  PolicyCondition,
  PolicyRule,
  StatefulPolicyRule,
  PolicyEvaluationContext,
  PolicyDecision,
  PolicyDecisionLog,
  PolicyEngine,
} from "../types";

/**
 * Type guard for stateful policy rules (rules with a shouldMatch method).
 * Ported from @a5c-ai/babysitter-sdk/runtime/policy/types.
 */
export function isStatefulRule(
  rule: import("../types").PolicyRule,
): rule is import("../types").StatefulPolicyRule {
  return typeof (rule as import("../types").StatefulPolicyRule).shouldMatch === "function";
}
