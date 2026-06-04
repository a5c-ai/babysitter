/**
 * Sandbox policy evaluation for tool/operation sandboxing (GAP-SEC-002).
 * Provides glob-based rule matching, policy composition with deny-overrides,
 * and policy attenuation for child scopes.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SandboxOperationKind =
  | 'fs.read'
  | 'fs.write'
  | 'fs.delete'
  | 'net.outbound'
  | 'net.inbound'
  | 'exec.shell'
  | 'exec.process';

export interface SandboxRule {
  kind: SandboxOperationKind;
  pattern: string;
  action: 'allow' | 'block' | 'prompt';
  priority: number;
}

export interface SandboxPolicy {
  rules: SandboxRule[];
  defaultAction: 'allow' | 'block' | 'prompt';
}

export interface SandboxDecision {
  action: 'allow' | 'block' | 'prompt';
  matchedRule?: SandboxRule;
  reason: string;
}

export interface SandboxOperation {
  kind: SandboxOperationKind;
  target: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Pattern matching
// ---------------------------------------------------------------------------

/**
 * Simple glob matching supporting:
 * - `*` matches any characters within a single path segment (no `/`)
 * - `**` matches any characters including `/` (recursive)
 * - Exact match
 */
export function matchesPattern(pattern: string, target: string): boolean {
  // Convert glob pattern to regex
  let regex = '';
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === '*' && pattern[i + 1] === '*') {
      // ** matches everything including path separators
      regex += '.*';
      i += 2;
      // Skip trailing slash after **
      if (pattern[i] === '/') {
        i++;
      }
    } else if (pattern[i] === '*') {
      // * matches anything except path separator
      regex += '[^/]*';
      i++;
    } else if (pattern[i] === '?') {
      regex += '[^/]';
      i++;
    } else if ('.+^${}()|[]\\'.includes(pattern[i])) {
      regex += '\\' + pattern[i];
      i++;
    } else {
      regex += pattern[i];
      i++;
    }
  }

  return new RegExp('^' + regex + '$').test(target);
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a sandbox operation against a policy.
 * Matches rules by operation kind, selects highest-priority match,
 * falls back to defaultAction.
 */
export function evaluateSandboxAccess(
  policy: SandboxPolicy,
  operation: SandboxOperation,
): SandboxDecision {
  const matching: SandboxRule[] = [];

  for (const rule of policy.rules) {
    if (rule.kind === operation.kind && matchesPattern(rule.pattern, operation.target)) {
      matching.push(rule);
    }
  }

  if (matching.length === 0) {
    return {
      action: policy.defaultAction,
      reason: `No matching rule; default action: ${policy.defaultAction}`,
    };
  }

  // Highest priority wins
  matching.sort((a, b) => b.priority - a.priority);
  const winner = matching[0];

  return {
    action: winner.action,
    matchedRule: winner,
    reason: `Matched rule: ${winner.kind} ${winner.pattern} → ${winner.action} (priority ${winner.priority})`,
  };
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

/**
 * Compose multiple sandbox policies with deny-overrides semantics.
 * Block rules from any policy take precedence. Empty input yields default-deny.
 */
export function composeSandboxPolicies(policies: SandboxPolicy[]): SandboxPolicy {
  if (policies.length === 0) {
    return { rules: [], defaultAction: 'block' };
  }

  const allRules: SandboxRule[] = [];
  for (const policy of policies) {
    allRules.push(...policy.rules);
  }

  // Deny-overrides: for rules with the same kind+pattern, if any is 'block', elevate block priority
  const ruleKey = (r: SandboxRule) => `${r.kind}::${r.pattern}`;
  const grouped = new Map<string, SandboxRule[]>();
  for (const rule of allRules) {
    const key = ruleKey(rule);
    const group = grouped.get(key) ?? [];
    group.push(rule);
    grouped.set(key, group);
  }

  const mergedRules: SandboxRule[] = [];
  for (const [_key, group] of grouped) {
    const hasBlock = group.some(r => r.action === 'block');
    if (hasBlock) {
      // Find highest-priority block rule, or promote one
      const blockRules = group.filter(r => r.action === 'block');
      const maxPriority = Math.max(...group.map(r => r.priority));
      const bestBlock = blockRules.sort((a, b) => b.priority - a.priority)[0];
      mergedRules.push({ ...bestBlock, priority: Math.max(bestBlock.priority, maxPriority) });
    } else {
      // No block — keep highest priority rule
      const best = group.sort((a, b) => b.priority - a.priority)[0];
      mergedRules.push(best);
    }
  }

  // Default action: most restrictive wins
  let defaultAction: 'allow' | 'block' | 'prompt' = 'allow';
  for (const policy of policies) {
    if (policy.defaultAction === 'block') {
      defaultAction = 'block';
      break;
    }
    if (policy.defaultAction === 'prompt') {
      defaultAction = 'prompt';
    }
  }

  return { rules: mergedRules, defaultAction };
}

// ---------------------------------------------------------------------------
// Attenuation
// ---------------------------------------------------------------------------

/**
 * Attenuate a parent policy with child constraints.
 * The child can only narrow permissions: block additions are kept,
 * allow rules that conflict with parent blocks are dropped.
 */
export function attenuateSandboxPolicy(
  parent: SandboxPolicy,
  childConstraints: SandboxPolicy,
): SandboxPolicy {
  const ruleKey = (r: SandboxRule) => `${r.kind}::${r.pattern}`;

  // Index parent blocks
  const parentBlocks = new Set<string>();
  for (const rule of parent.rules) {
    if (rule.action === 'block') {
      parentBlocks.add(ruleKey(rule));
    }
  }

  // Start with all parent rules
  const resultRules: SandboxRule[] = [...parent.rules];

  for (const childRule of childConstraints.rules) {
    const key = ruleKey(childRule);

    if (childRule.action === 'allow' && parentBlocks.has(key)) {
      // Child cannot expand parent blocks to allows — skip
      continue;
    }

    if (childRule.action === 'block') {
      // Child can always add or strengthen blocks
      // Check if parent already has this block
      const existing = resultRules.find(r => ruleKey(r) === key && r.action === 'block');
      if (!existing) {
        resultRules.push(childRule);
      } else if (childRule.priority > existing.priority) {
        existing.priority = childRule.priority;
      }
    }
  }

  // Apply deny-overrides on the combined set
  return composeSandboxPolicies([{ rules: resultRules, defaultAction: parent.defaultAction }]);
}
