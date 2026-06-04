/**
 * Status: Integrated with agent-platform breakpoint governance.
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-SEC-005: Approval Posture Model
 *
 * Defines the canonical safety ladder for action categories and provides
 * posture resolution from breakpoint IDs.
 *
 * @module breakpoints/postures
 */

import type { ActionCategory, ApprovalPosture } from '@a5c-ai/babysitter-sdk';

/**
 * Default postures per action category.
 * The canonical safety ladder: read (permissive) -> write/network -> execute -> destroy/auth (locked).
 */
export const DEFAULT_POSTURES: Record<ActionCategory, ApprovalPosture> = {
  read: {
    name: 'permissive',
    allowAutoApprove: true,
    minConsecutiveApprovalsForAutoN: 0,
    requireExplicitRule: false,
    requiredApproverLevel: 'any',
  },
  write: {
    name: 'cautious',
    allowAutoApprove: true,
    minConsecutiveApprovalsForAutoN: 3,
    requireExplicitRule: false,
    requiredApproverLevel: 'any',
  },
  execute: {
    name: 'guarded',
    allowAutoApprove: true,
    minConsecutiveApprovalsForAutoN: 5,
    requireExplicitRule: true,
    requiredApproverLevel: 'any',
  },
  destroy: {
    name: 'locked',
    allowAutoApprove: false,
    minConsecutiveApprovalsForAutoN: -1,
    requireExplicitRule: true,
    requiredApproverLevel: 'owner',
  },
  network: {
    name: 'cautious',
    allowAutoApprove: true,
    minConsecutiveApprovalsForAutoN: 3,
    requireExplicitRule: false,
    requiredApproverLevel: 'any',
  },
  auth: {
    name: 'locked',
    allowAutoApprove: false,
    minConsecutiveApprovalsForAutoN: -1,
    requireExplicitRule: true,
    requiredApproverLevel: 'owner',
  },
};

/**
 * Get the posture for a category, optionally merged with overrides.
 */
export function getPostureForCategory(
  category: ActionCategory,
  overrides?: Partial<ApprovalPosture>,
): ApprovalPosture {
  const base = DEFAULT_POSTURES[category];
  if (!overrides) return base;
  return { ...base, ...overrides };
}

/**
 * Prefix-to-category mapping for breakpoint ID namespace convention.
 */
const PREFIX_TO_CATEGORY: Record<string, ActionCategory> = {
  'read': 'read',
  'write': 'write',
  'exec': 'execute',
  'execute': 'execute',
  'destroy': 'destroy',
  'delete': 'destroy',
  'net': 'network',
  'network': 'network',
  'auth': 'auth',
  'cred': 'auth',
};

/**
 * Resolve an action category from a breakpoint ID's namespace prefix.
 * Returns undefined for unknown prefixes (no posture enforcement applied).
 *
 * Convention: breakpointId format is `prefix.name` (e.g., `destroy.important-files`).
 */
export function resolvePostureFromBreakpointId(breakpointId: string): ActionCategory | undefined {
  const dotIndex = breakpointId.indexOf('.');
  if (dotIndex === -1) return undefined;
  const prefix = breakpointId.substring(0, dotIndex);
  return PREFIX_TO_CATEGORY[prefix];
}
