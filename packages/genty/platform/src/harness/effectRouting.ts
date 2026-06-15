/**
 * Effect routing — pattern-matched routing of effects to harness/model
 * targets with priority-based cascading rules (GAP-AGENT-003).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoutingRule {
  id: string;
  /** Glob-like pattern matching effect kind and/or labels (e.g. "shell:*", "agent:deploy*"). */
  pattern: string;
  /** Target harness or model identifier to route to. */
  target: string;
  /** Higher priority rules are evaluated first (descending). Default: 0. */
  priority: number;
  /** Optional condition expression for context-aware routing. */
  condition?: string;
}

export interface RoutingResult {
  rule: RoutingRule;
  target: string;
}

export type RoutingContext = Record<string, string | number | boolean>;

// ---------------------------------------------------------------------------
// Glob-like pattern matching
// ---------------------------------------------------------------------------

/**
 * Convert a simple glob pattern to a RegExp.
 * Supports `*` (match any chars except `:`) and `**` (match anything including `:`).
 */
function globToRegex(pattern: string): RegExp {
  let re = '';
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === '*' && pattern[i + 1] === '*') {
      re += '.*';
      i += 2;
    } else if (pattern[i] === '*') {
      re += '[^:]*';
      i++;
    } else if (pattern[i] === '?') {
      re += '[^:]';
      i++;
    } else {
      re += pattern[i].replace(/[.+^${}()|[\]\\]/g, '\\$&');
      i++;
    }
  }
  return new RegExp(`^${re}$`);
}

// ---------------------------------------------------------------------------
// Condition evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate a simple condition expression against a context.
 *
 * Supported forms:
 *  - `key == value`
 *  - `key != value`
 *  - `key`            (truthy check)
 *  - `!key`           (falsy check)
 *
 * Values are compared as strings. Numeric values are coerced.
 */
export function evaluateCondition(condition: string, context: RoutingContext): boolean {
  const trimmed = condition.trim();

  // key != value
  const neq = trimmed.match(/^(\w+)\s*!=\s*(.+)$/);
  if (neq) {
    const key = neq[1];
    const expected = neq[2].trim();
    return String(context[key] ?? '') !== expected;
  }

  // key == value
  const eq = trimmed.match(/^(\w+)\s*==\s*(.+)$/);
  if (eq) {
    const key = eq[1];
    const expected = eq[2].trim();
    return String(context[key] ?? '') === expected;
  }

  // !key (falsy)
  if (trimmed.startsWith('!')) {
    const key = trimmed.slice(1).trim();
    return !context[key];
  }

  // key (truthy)
  return !!context[trimmed];
}

// ---------------------------------------------------------------------------
// EffectRouter
// ---------------------------------------------------------------------------

export class EffectRouter {
  private rules: RoutingRule[] = [];

  /**
   * Add a routing rule. Rules are kept sorted by descending priority.
   */
  addRule(rule: RoutingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a routing rule by id. Returns true if it existed.
   */
  removeRule(id: string): boolean {
    const before = this.rules.length;
    this.rules = this.rules.filter((r) => r.id !== id);
    return this.rules.length < before;
  }

  /**
   * List all registered rules (ordered by descending priority).
   */
  listRules(): readonly RoutingRule[] {
    return this.rules;
  }

  /**
   * Route an effect descriptor (e.g. "shell:lint") to the best matching
   * rule. Uses first-match-wins semantics (highest priority first).
   *
   * @param effectDescriptor - A string like "kind:label" or just "kind".
   * @param context - Optional context for condition evaluation.
   * @returns The matching routing result, or undefined if no rule matches.
   */
  route(effectDescriptor: string, context?: RoutingContext): RoutingResult | undefined {
    for (const rule of this.rules) {
      const regex = globToRegex(rule.pattern);
      if (!regex.test(effectDescriptor)) continue;

      // Check condition if present
      if (rule.condition && context) {
        if (!evaluateCondition(rule.condition, context)) continue;
      } else if (rule.condition && !context) {
        // Condition present but no context — skip this rule
        continue;
      }

      return { rule, target: rule.target };
    }

    return undefined;
  }
}
