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
  /** GAP-SEC-005: True when posture enforcement (not a rule) caused the block. */
  blockedByPosture?: boolean;
  /** GAP-SEC-005: The resolved action category used for posture evaluation. */
  effectiveCategory?: ActionCategory;
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

/**
 * GAP-SEC-003: Interaction kind for breakpoint semantic classification.
 * Enables UX routing and audit differentiation between interaction types.
 */
export type InteractionKind =
  | 'clarification'  // Agent needs more info; no security implication
  | 'approval'       // Agent requests permission for a consequential action
  | 'intervention'   // Unexpected state; human must decide recovery
  | 'notification'   // Informational only; no decision required
  | 'handoff';       // Process completion or transfer of control

/**
 * GAP-SEC-005: Action category for posture-based approval enforcement.
 */
export type ActionCategory =
  | 'read'     // Non-mutating observation
  | 'write'    // Creates or modifies state
  | 'execute'  // Runs code or commands
  | 'destroy'  // Permanently deletes or overwrites state
  | 'network'  // Initiates network communication
  | 'auth';    // Accesses or modifies credentials/tokens/secrets

/**
 * GAP-SEC-005: Approval posture defining enforcement behavior per action category.
 */
export interface ApprovalPosture {
  /** Human-readable posture name */
  name: string;
  /** Whether actions in this category may be auto-approved */
  allowAutoApprove: boolean;
  /** Minimum consecutive approvals before autoApproveAfterN kicks in. -1 = disabled */
  minConsecutiveApprovalsForAutoN: number;
  /** When true, requires an explicit auto-approve rule to allow auto-approval */
  requireExplicitRule: boolean;
  /** Tags required on breakpoint for auto-approval (empty = no requirement) */
  requiredTags?: string[];
  /** Approver level required: 'any' | 'owner' | custom expert group */
  requiredApproverLevel?: string;
}
