/**
 * Built-in governance policy rules (GAP-SEC-001).
 * Ready-to-use policy factories for common constraints.
 */

import type { PolicyRule, StatefulPolicyRule, PolicyEvaluationContext } from './types';

/**
 * Deny effects when the iteration count exceeds a limit.
 */
export function maxIterationsPolicy(limit: number): PolicyRule {
  return {
    id: `builtin:max-iterations:${limit}`,
    kind: 'resource-limit',
    condition: { field: 'iteration', op: 'gt', value: String(limit) },
    action: 'deny',
    priority: 90,
    metadata: { description: `Deny when iteration exceeds ${limit}` },
  };
}

/**
 * Deny effects whose effectKind is not in the allowed list.
 * Implemented as a deny rule that matches effectKinds NOT in the list.
 *
 * Since condition ops are single-value, this creates one deny rule per
 * disallowed kind by using a special "neq" with a runtime check.
 * For simplicity, we use a "matches" regex that rejects non-matching kinds.
 */
export function taskKindPolicy(allowedKinds: string[]): PolicyRule {
  const pattern = `^(?!${allowedKinds.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}$)`;
  return {
    id: `builtin:task-kind:${allowedKinds.join(',')}`,
    kind: 'permission',
    condition: { field: 'effectKind', op: 'matches', value: pattern },
    action: 'deny',
    priority: 80,
    metadata: { description: `Only allow effect kinds: ${allowedKinds.join(', ')}` },
  };
}

/**
 * Deny effects when the rate exceeds maxCount within windowMs.
 * Uses an in-memory sliding window counter via StatefulPolicyRule.
 * Note: counter resets on process restart (in-memory only).
 */
export function rateLimitPolicy(windowMs: number, maxCount: number): StatefulPolicyRule {
  let timestamps: number[] = [];

  return {
    id: `builtin:rate-limit:${maxCount}per${windowMs}ms`,
    kind: 'rate-limit',
    // Declarative condition is a no-op placeholder; shouldMatch does the real work
    condition: { field: '__rate_limit__', op: 'eq', value: '__stateful__' },
    action: 'deny',
    priority: 95,
    metadata: {
      description: `Rate limit: ${maxCount} per ${windowMs}ms`,
    },
    shouldMatch(_context: PolicyEvaluationContext): boolean {
      const now = Date.now();
      // Evict expired timestamps with filter (O(n) but no shift overhead)
      timestamps = timestamps.filter(t => t > now - windowMs);
      timestamps.push(now);
      return timestamps.length > maxCount;
    },
  };
}
