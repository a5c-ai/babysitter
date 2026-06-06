/**
 * Internal runtime policy evaluation types.
 * Kept runtime-local because the broader governance surface is harness-owned.
 */

export type PolicyRuleKind = "rate-limit" | "permission" | "resource-limit" | "trust-level";
export type PolicyConditionOp = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "matches";
export type PolicyAction = "allow" | "deny" | "warn";

export interface PolicyCondition {
  field: string;
  op: PolicyConditionOp;
  value: string;
}

export interface PolicyRule {
  id: string;
  kind: PolicyRuleKind;
  condition: PolicyCondition;
  action: PolicyAction;
  priority: number;
  metadata?: Record<string, string>;
}

export interface StatefulPolicyRule extends PolicyRule {
  shouldMatch(context: PolicyEvaluationContext): boolean;
}

export function isStatefulRule(rule: PolicyRule): rule is StatefulPolicyRule {
  return typeof (rule as StatefulPolicyRule).shouldMatch === "function";
}

export interface PolicyEvaluationContext {
  effectKind: string;
  taskId?: string;
  processId?: string;
  runId?: string;
  labels?: string[];
  metadata?: Readonly<Record<string, string>>;
  iteration?: number;
}

export interface PolicyDecision {
  allowed: boolean;
  rule?: PolicyRule;
  reason: string;
  warnings: string[];
}

export interface PolicyDecisionLog {
  timestamp: string;
  context: PolicyEvaluationContext;
  decision: PolicyDecision;
  ruleId?: string;
}

export interface PolicyEngine {
  readonly rules: readonly PolicyRule[];
  evaluate(context: PolicyEvaluationContext): PolicyDecision;
}

export type PolicyDecisionReporter = (entry: PolicyDecisionLog) => void | Promise<void>;

export interface RuntimeGovernanceConfig {
  policyRules?: PolicyRule[];
  auditLogDir?: string;
}
