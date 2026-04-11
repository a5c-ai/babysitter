/**
 * Auto-approval evaluator.
 *
 * Precedence (highest wins):
 *   1. never-auto-approve rule match
 *   2. alwaysBreakOn profile tags
 *   3. auto-approve rule match
 *   4. autoApproveAfterN threshold (consecutive approvals from journal history)
 *   5. prompt (default — no auto-approval)
 */

import type { BreakpointRule, AutoApprovalResult } from "./types";
import type { BreakpointConfig } from "../profiles/types";
import { parsePattern, matchPattern } from "./patterns";

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
}

export function evaluateAutoApproval(options: EvaluateAutoApprovalOptions): AutoApprovalResult {
  const {
    breakpointId,
    tags,
    expert,
    rules,
    profileConfig,
    consecutiveApprovals = 0,
    autoApproveAfterN = -1,
  } = options;

  const attributes = { tags, expert };

  // 1. Check never-auto-approve rules (highest precedence)
  for (const rule of rules) {
    if (rule.action !== "never-auto-approve") continue;
    const pattern = parsePattern(rule.pattern);
    if (matchPattern(pattern, breakpointId, attributes)) {
      return {
        recommended: false,
        reason: `Blocked by never-auto-approve rule: ${rule.id}`,
        matchedRule: rule.id,
        consecutiveApprovals,
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
      };
    }
  }

  // 4. Check autoApproveAfterN threshold
  if (autoApproveAfterN > 0 && consecutiveApprovals >= autoApproveAfterN) {
    return {
      recommended: true,
      reason: `Auto-approved after ${consecutiveApprovals} consecutive approvals (threshold: ${autoApproveAfterN})`,
      consecutiveApprovals,
    };
  }

  // 5. Default: prompt (no auto-approval)
  return {
    recommended: false,
    reason: "No matching auto-approval rule",
    consecutiveApprovals,
  };
}
