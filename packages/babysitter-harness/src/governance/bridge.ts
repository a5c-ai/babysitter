/**
 * Bridge from existing breakpoint rules to governance policies (GAP-SEC-001).
 * Converts BreakpointRule[] into PolicyRule[] for unified evaluation.
 */

import type { BreakpointRule } from "@a5c-ai/babysitter-sdk";
import type { PolicyRule } from './types';

/**
 * Convert breakpoint auto-approval rules into governance policy rules.
 *
 * Mapping:
 * - "auto-approve" → allow policy (permission kind)
 * - "never-auto-approve" → deny policy (permission kind)
 *
 * The breakpoint pattern is mapped to a "matches" condition on the taskId field.
 */
export function breakpointRulesToPolicies(rules: BreakpointRule[]): PolicyRule[] {
  return rules.map(rule => ({
    id: `bp-bridge:${rule.id}`,
    kind: 'permission' as const,
    condition: {
      field: 'taskId',
      op: 'matches' as const,
      value: globToRegex(rule.pattern),
    },
    action: rule.action === 'auto-approve' ? 'allow' as const : 'deny' as const,
    priority: rule.action === 'never-auto-approve' ? 100 : 50,
    metadata: {
      source: 'breakpoint-bridge',
      originalPattern: rule.pattern,
      createdBy: rule.createdBy,
      ...(rule.note ? { note: rule.note } : {}),
    },
  }));
}

/**
 * Convert a simple glob pattern to a regex string.
 * Supports * (any chars) and ? (single char).
 */
function globToRegex(glob: string): string {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return `^${escaped}$`;
}
