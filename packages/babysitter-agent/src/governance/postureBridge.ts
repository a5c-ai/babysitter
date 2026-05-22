/**
 * GAP-SEC: Posture-to-Policy Bridge.
 *
 * Converts breakpoint approval postures into governance PolicyRule[] so they
 * can be evaluated by the unified policy engine.
 */

import type { ActionCategory, ApprovalPosture } from "@a5c-ai/babysitter-sdk";
import { DEFAULT_POSTURES } from "../breakpoints/postures";
import type { PolicyRule } from './types';

// ---------------------------------------------------------------------------
// Priority map by posture name
// ---------------------------------------------------------------------------

const POSTURE_PRIORITY: Record<string, number> = {
  locked: 200,
  guarded: 150,
  cautious: 100,
  permissive: 50,
};

function priorityForPosture(posture: ApprovalPosture): number {
  return POSTURE_PRIORITY[posture.name] ?? 75;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Convert a single posture for a given action category into PolicyRule[].
 */
export function postureToPolicyRules(
  category: ActionCategory,
  posture: ApprovalPosture,
): PolicyRule[] {
  const rules: PolicyRule[] = [];
  const basePriority = priorityForPosture(posture);

  if (!posture.allowAutoApprove) {
    // Locked: deny auto-approval entirely
    rules.push({
      id: `posture:${category}:deny-auto-approve`,
      kind: 'permission',
      condition: { field: 'labels', op: 'contains', value: category },
      action: 'deny',
      priority: basePriority,
      metadata: {
        source: 'posture-bridge',
        category,
        postureName: posture.name,
        requiredApproverLevel: posture.requiredApproverLevel ?? 'any',
        minConsecutiveApprovals: String(posture.minConsecutiveApprovalsForAutoN),
      },
    });
  } else if (posture.requireExplicitRule) {
    // Guarded: warn (require explicit rule)
    rules.push({
      id: `posture:${category}:require-explicit-rule`,
      kind: 'permission',
      condition: { field: 'labels', op: 'contains', value: category },
      action: 'warn',
      priority: basePriority,
      metadata: {
        source: 'posture-bridge',
        category,
        postureName: posture.name,
        requireExplicitRule: 'true',
        minConsecutiveApprovals: String(posture.minConsecutiveApprovalsForAutoN),
      },
    });
  } else {
    // Cautious or permissive: allow
    rules.push({
      id: `posture:${category}:allow-auto-approve`,
      kind: 'permission',
      condition: { field: 'labels', op: 'contains', value: category },
      action: 'allow',
      priority: basePriority,
      metadata: {
        source: 'posture-bridge',
        category,
        postureName: posture.name,
        minConsecutiveApprovals: String(posture.minConsecutiveApprovalsForAutoN),
      },
    });
  }

  // If the posture has minConsecutiveApprovalsForAutoN > 0 and allows auto-approve,
  // add an advisory warn rule for the threshold
  if (posture.allowAutoApprove && posture.minConsecutiveApprovalsForAutoN > 0) {
    rules.push({
      id: `posture:${category}:consecutive-threshold`,
      kind: 'resource-limit',
      condition: { field: 'labels', op: 'contains', value: category },
      action: 'warn',
      priority: basePriority - 1,
      metadata: {
        source: 'posture-bridge',
        category,
        postureName: posture.name,
        minConsecutiveApprovals: String(posture.minConsecutiveApprovalsForAutoN),
      },
    });
  }

  return rules;
}

/**
 * Convert all DEFAULT_POSTURES (optionally overridden) into a sorted PolicyRule[].
 */
export function allPosturesToPolicies(
  overrides?: Partial<Record<ActionCategory, Partial<ApprovalPosture>>>,
): PolicyRule[] {
  const categories: ActionCategory[] = ['read', 'write', 'execute', 'destroy', 'network', 'auth'];
  const allRules: PolicyRule[] = [];

  for (const category of categories) {
    const base = DEFAULT_POSTURES[category];
    const categoryOverrides = overrides?.[category];
    const posture: ApprovalPosture = categoryOverrides ? { ...base, ...categoryOverrides } : base;
    allRules.push(...postureToPolicyRules(category, posture));
  }

  // Sort by priority descending
  allRules.sort((a, b) => b.priority - a.priority);

  return allRules;
}
