/**
 * Auto-approval evaluator.
 *
 * Precedence (highest wins):
 *   0. [GAP-SEC-005] Posture: allowAutoApprove === false (category block)
 *   0b.[GAP-SEC-005] Posture: requireExplicitRule with no matching rule
 *   1. never-auto-approve rule match
 *   2. alwaysBreakOn profile tags
 *   3. auto-approve rule match
 *   4. autoApproveAfterN threshold (clamped by posture minConsecutiveApprovalsForAutoN)
 *   5. prompt (default — no auto-approval)
 */

import type { BreakpointRule, AutoApprovalResult, ActionCategory, ApprovalPosture } from "./types";
import type { BreakpointConfig } from "../profiles/types";
import { parsePattern, matchPattern } from "./patterns";

// ---------------------------------------------------------------------------
// Inlined posture helpers (canonical implementation moved to babysitter-agent)
// ---------------------------------------------------------------------------

const DEFAULT_POSTURES: Record<ActionCategory, ApprovalPosture> = {
  read: { name: 'permissive', allowAutoApprove: true, minConsecutiveApprovalsForAutoN: 0, requireExplicitRule: false, requiredApproverLevel: 'any' },
  write: { name: 'cautious', allowAutoApprove: true, minConsecutiveApprovalsForAutoN: 3, requireExplicitRule: false, requiredApproverLevel: 'any' },
  execute: { name: 'guarded', allowAutoApprove: true, minConsecutiveApprovalsForAutoN: 5, requireExplicitRule: true, requiredApproverLevel: 'any' },
  destroy: { name: 'locked', allowAutoApprove: false, minConsecutiveApprovalsForAutoN: -1, requireExplicitRule: true, requiredApproverLevel: 'owner' },
  network: { name: 'cautious', allowAutoApprove: true, minConsecutiveApprovalsForAutoN: 3, requireExplicitRule: false, requiredApproverLevel: 'any' },
  auth: { name: 'locked', allowAutoApprove: false, minConsecutiveApprovalsForAutoN: -1, requireExplicitRule: true, requiredApproverLevel: 'owner' },
};

const PREFIX_TO_CATEGORY: Record<string, ActionCategory> = {
  'read': 'read', 'write': 'write', 'exec': 'execute', 'execute': 'execute',
  'destroy': 'destroy', 'delete': 'destroy', 'net': 'network', 'network': 'network',
  'auth': 'auth', 'cred': 'auth',
};

function getPostureForCategory(category: ActionCategory, overrides?: Partial<ApprovalPosture>): ApprovalPosture {
  const base = DEFAULT_POSTURES[category];
  if (!overrides) return base;
  return { ...base, ...overrides };
}

function resolvePostureFromBreakpointId(breakpointId: string): ActionCategory | undefined {
  const dotIndex = breakpointId.indexOf('.');
  if (dotIndex === -1) return undefined;
  const prefix = breakpointId.substring(0, dotIndex);
  return PREFIX_TO_CATEGORY[prefix];
}

export interface EvaluateAutoApprovalOptions {
  breakpointId: string;
  tags?: string[];
  expert?: string;
  rules: BreakpointRule[];
  profileConfig?: BreakpointConfig;
  /** Number of consecutive past approvals for this breakpointId. */
  consecutiveApprovals?: number;
  /** autoApproveAfterN from breakpoint definition (-1 = disabled). */
  autoApproveAfterN?: number;
  /** GAP-SEC-005: Explicit action category. Overrides prefix-derived category. */
  actionCategory?: ActionCategory;
  /** GAP-SEC-005: Override posture for this evaluation (skips DEFAULT_POSTURES lookup). */
  postureOverride?: ApprovalPosture;
  /** GAP-SEC-005: When true, posture enforcement is skipped entirely. */
  skipPostureEnforcement?: boolean;
}

export function evaluateAutoApproval(options: EvaluateAutoApprovalOptions): AutoApprovalResult {
  const {
    breakpointId,
    tags,
    expert,
    rules,
    profileConfig,
    consecutiveApprovals = 0,
    skipPostureEnforcement = false,
  } = options;
  let { autoApproveAfterN = -1 } = options;

  const attributes = { tags, expert };

  // Resolve posture
  const effectiveCategory = options.actionCategory ?? resolvePostureFromBreakpointId(breakpointId);
  let posture: ApprovalPosture | undefined;

  if (!skipPostureEnforcement && effectiveCategory) {
    const profileOverrides = profileConfig?.postureOverrides?.[effectiveCategory];
    posture = options.postureOverride ?? getPostureForCategory(effectiveCategory, profileOverrides);
  }

  // Check if profile disables posture enforcement globally
  if (profileConfig?.disablePostureEnforcement) {
    posture = undefined;
  }

  // 0. Posture: allowAutoApprove === false (category block)
  if (posture && !posture.allowAutoApprove) {
    return {
      recommended: false,
      reason: `Category '${effectiveCategory}' requires explicit human approval (posture: ${posture.name})`,
      consecutiveApprovals,
      blockedByPosture: true,
      effectiveCategory,
    };
  }

  // 0b. Posture: requireExplicitRule with no matching auto-approve rule
  if (posture && posture.requireExplicitRule) {
    const hasExplicitRule = rules.some(rule => {
      if (rule.action !== "auto-approve") return false;
      const pattern = parsePattern(rule.pattern);
      return matchPattern(pattern, breakpointId, attributes);
    });
    if (!hasExplicitRule) {
      return {
        recommended: false,
        reason: `Category '${effectiveCategory}' requires an explicit auto-approve rule (posture: ${posture.name})`,
        consecutiveApprovals,
        blockedByPosture: true,
        effectiveCategory,
      };
    }
  }

  // 1. Check never-auto-approve rules (highest explicit rule precedence)
  for (const rule of rules) {
    if (rule.action !== "never-auto-approve") continue;
    const pattern = parsePattern(rule.pattern);
    if (matchPattern(pattern, breakpointId, attributes)) {
      return {
        recommended: false,
        reason: `Blocked by never-auto-approve rule: ${rule.id}`,
        matchedRule: rule.id,
        consecutiveApprovals,
        effectiveCategory,
      };
    }
  }

  // 2. Check alwaysBreakOn profile tags
  if (profileConfig?.alwaysBreakOn && tags) {
    for (const alwaysTag of profileConfig.alwaysBreakOn) {
      if (tags.includes(alwaysTag)) {
        return {
          recommended: false,
          reason: `Blocked by alwaysBreakOn tag: ${alwaysTag}`,
          consecutiveApprovals,
          effectiveCategory,
        };
      }
    }
  }

  // 3. Check auto-approve rules
  for (const rule of rules) {
    if (rule.action !== "auto-approve") continue;
    const pattern = parsePattern(rule.pattern);
    if (matchPattern(pattern, breakpointId, attributes)) {
      return {
        recommended: true,
        reason: `Matched auto-approve rule: ${rule.id}`,
        matchedRule: rule.id,
        consecutiveApprovals,
        effectiveCategory,
      };
    }
  }

  // 4. Check autoApproveAfterN threshold (clamped by posture)
  if (posture && posture.minConsecutiveApprovalsForAutoN === -1) {
    // Posture disables autoApproveAfterN entirely
    autoApproveAfterN = -1;
  } else if (posture && autoApproveAfterN > 0) {
    // Clamp threshold to at least posture minimum
    autoApproveAfterN = Math.max(autoApproveAfterN, posture.minConsecutiveApprovalsForAutoN);
  }

  if (autoApproveAfterN > 0 && consecutiveApprovals >= autoApproveAfterN) {
    return {
      recommended: true,
      reason: `Auto-approved after ${consecutiveApprovals} consecutive approvals (threshold: ${autoApproveAfterN})`,
      consecutiveApprovals,
      effectiveCategory,
    };
  }

  // 5. Default: prompt (no auto-approval)
  return {
    recommended: false,
    reason: "No matching auto-approval rule",
    consecutiveApprovals,
    effectiveCategory,
  };
}
