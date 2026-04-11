/**
 * Breakpoint auto-approval types.
 */

export type BreakpointRuleAction = "auto-approve" | "never-auto-approve";

export interface BreakpointRule {
  /** Unique rule identifier (UUID or slug). */
  id: string;
  /** Pattern to match breakpointIds. Supports glob with attribute predicates. */
  pattern: string;
  /** Action to take when pattern matches. */
  action: BreakpointRuleAction;
  /** ISO timestamp when rule was created. */
  createdAt: string;
  /** Who created the rule (e.g., "user", "agent", "analyze-history"). */
  createdBy: string;
  /** Source context (e.g., "cli", "process:xyz"). */
  source?: string;
  /** Human-readable note about why this rule exists. */
  note?: string;
}

export interface BreakpointRulesFile {
  schemaVersion: string;
  rules: BreakpointRule[];
}

export interface AutoApprovalResult {
  /** Whether auto-approval is recommended. */
  recommended: boolean;
  /** Human-readable reason for the recommendation. */
  reason: string;
  /** ID of the matched rule, if any. */
  matchedRule?: string;
  /** Number of consecutive approvals for this breakpointId. */
  consecutiveApprovals?: number;
}

export interface BreakpointPattern {
  /** The id-glob portion (e.g., "confirm.*", "gate.prerequisites"). */
  idGlob: string;
  /** Attribute predicates (e.g., [{ attr: "tags", op: "contains", value: "design" }]). */
  predicates: AttributePredicate[];
}

export type PredicateOp = "contains" | "=";

export interface AttributePredicate {
  attr: string;
  op: PredicateOp;
  value: string;
}

export const BREAKPOINT_RULES_SCHEMA_VERSION = "2026.01.breakpoint-rules-v1";
