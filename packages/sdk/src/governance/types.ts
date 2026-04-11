/**
 * Governance Policy Layer types (GAP-SEC-001).
 * Centralized, declarative policy evaluation for effect dispatch and task execution.
 */

/** Policy rule kinds. */
export type PolicyRuleKind = 'rate-limit' | 'permission' | 'resource-limit' | 'trust-level';

/** Condition operators for rule evaluation. */
export type PolicyConditionOp = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'matches';

/** Policy actions. */
export type PolicyAction = 'allow' | 'deny' | 'warn';

/**
 * A condition that a policy rule checks against the evaluation context.
 * Supports dot-notation for nested fields (e.g., "metadata.env").
 */
export interface PolicyCondition {
  /** Field path to evaluate (e.g., "effectKind", "iteration", "labels", "metadata.env") */
  field: string;
  /** Comparison operator */
  op: PolicyConditionOp;
  /** Value to compare against (stringified for numeric ops) */
  value: string;
}

/**
 * A declarative policy rule evaluated by the PolicyEngine.
 */
export interface PolicyRule {
  /** Unique rule identifier */
  id: string;
  /** Rule category */
  kind: PolicyRuleKind;
  /** Condition to evaluate */
  condition: PolicyCondition;
  /** Action to take when condition matches */
  action: PolicyAction;
  /** Higher priority rules are evaluated first within their action group */
  priority: number;
  /** Optional metadata for audit/display */
  metadata?: Record<string, string>;
}

/**
 * A policy rule with stateful evaluation logic (e.g., rate limiting).
 * The shouldMatch callback is invoked instead of matchCondition when present.
 */
export interface StatefulPolicyRule extends PolicyRule {
  /** Custom evaluation function that may carry internal state (e.g., counters). */
  shouldMatch(context: PolicyEvaluationContext): boolean;
}

/**
 * Type guard for stateful rules.
 */
export function isStatefulRule(rule: PolicyRule): rule is StatefulPolicyRule {
  return typeof (rule as StatefulPolicyRule).shouldMatch === 'function';
}

/**
 * Context provided to the policy engine for evaluation.
 */
export interface PolicyEvaluationContext {
  /** The kind of effect being dispatched */
  effectKind: string;
  /** Task identifier (if applicable) */
  taskId?: string;
  /** Process identifier */
  processId?: string;
  /** Run identifier */
  runId?: string;
  /** Task labels */
  labels?: string[];
  /** Arbitrary metadata */
  metadata?: Readonly<Record<string, string>>;
  /** Current iteration number */
  iteration?: number;
}

/**
 * Result of evaluating policies against a context.
 */
export interface PolicyDecision {
  /** Whether the action is allowed */
  allowed: boolean;
  /** The rule that determined the decision (if any) */
  rule?: PolicyRule;
  /** Human-readable reason */
  reason: string;
  /** Warnings collected from warn-action rules */
  warnings: string[];
}

/**
 * Audit log entry for a policy decision.
 */
export interface PolicyDecisionLog {
  /** ISO timestamp */
  timestamp: string;
  /** Evaluation context snapshot */
  context: PolicyEvaluationContext;
  /** The decision made */
  decision: PolicyDecision;
  /** Rule ID that triggered the decision (if any) */
  ruleId?: string;
}

/**
 * The policy engine interface.
 */
export interface PolicyEngine {
  /** The rules loaded into this engine */
  readonly rules: readonly PolicyRule[];
  /** Evaluate policies against a context */
  evaluate(context: PolicyEvaluationContext): PolicyDecision;
}
