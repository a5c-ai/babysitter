import { describe, it, expect, beforeEach } from 'vitest';
import { EffectRouter, evaluateCondition, type RoutingRule } from '../effectRouting';

// ---------------------------------------------------------------------------
// evaluateCondition
// ---------------------------------------------------------------------------

describe('evaluateCondition', () => {
  it('evaluates equality', () => {
    expect(evaluateCondition('env == production', { env: 'production' })).toBe(true);
    expect(evaluateCondition('env == staging', { env: 'production' })).toBe(false);
  });

  it('evaluates inequality', () => {
    expect(evaluateCondition('env != production', { env: 'staging' })).toBe(true);
    expect(evaluateCondition('env != production', { env: 'production' })).toBe(false);
  });

  it('evaluates truthy check', () => {
    expect(evaluateCondition('debug', { debug: true })).toBe(true);
    expect(evaluateCondition('debug', { debug: false })).toBe(false);
    expect(evaluateCondition('debug', {})).toBe(false);
  });

  it('evaluates falsy check with !', () => {
    expect(evaluateCondition('!debug', {})).toBe(true);
    expect(evaluateCondition('!debug', { debug: true })).toBe(false);
  });

  it('coerces values to strings for comparison', () => {
    expect(evaluateCondition('count == 5', { count: 5 })).toBe(true);
    expect(evaluateCondition('count == 5', { count: '5' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EffectRouter
// ---------------------------------------------------------------------------

describe('EffectRouter', () => {
  let router: EffectRouter;

  beforeEach(() => {
    router = new EffectRouter();
  });

  // -----------------------------------------------------------------------
  // Rule management
  // -----------------------------------------------------------------------

  it('starts with no rules', () => {
    expect(router.listRules()).toEqual([]);
  });

  it('adds and lists rules sorted by priority', () => {
    const low: RoutingRule = { id: 'low', pattern: '*', target: 'default', priority: 0 };
    const high: RoutingRule = { id: 'high', pattern: '*', target: 'premium', priority: 10 };
    router.addRule(low);
    router.addRule(high);
    const rules = router.listRules();
    expect(rules[0].id).toBe('high');
    expect(rules[1].id).toBe('low');
  });

  it('removes a rule by id', () => {
    router.addRule({ id: 'r1', pattern: '*', target: 't', priority: 0 });
    expect(router.removeRule('r1')).toBe(true);
    expect(router.listRules()).toHaveLength(0);
  });

  it('removeRule returns false for nonexistent id', () => {
    expect(router.removeRule('nope')).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Routing — pattern matching
  // -----------------------------------------------------------------------

  it('matches exact kind', () => {
    router.addRule({ id: 'r1', pattern: 'shell', target: 'bash', priority: 0 });
    const result = router.route('shell');
    expect(result).toBeDefined();
    expect(result!.target).toBe('bash');
  });

  it('matches kind with wildcard label', () => {
    router.addRule({ id: 'r1', pattern: 'agent:*', target: 'agent-pool', priority: 0 });
    expect(router.route('agent:deploy')).toBeDefined();
    expect(router.route('agent:test')).toBeDefined();
    expect(router.route('shell:lint')).toBeUndefined();
  });

  it('matches double-star glob across colons', () => {
    router.addRule({ id: 'r1', pattern: '**', target: 'catch-all', priority: 0 });
    expect(router.route('agent:deploy:prod')).toBeDefined();
    expect(router.route('shell')).toBeDefined();
  });

  it('returns undefined when no rule matches', () => {
    router.addRule({ id: 'r1', pattern: 'shell', target: 'bash', priority: 0 });
    expect(router.route('agent')).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Routing — priority (first match wins)
  // -----------------------------------------------------------------------

  it('uses highest-priority matching rule', () => {
    router.addRule({ id: 'default', pattern: '*', target: 'generic', priority: 0 });
    router.addRule({ id: 'special', pattern: 'shell', target: 'secure-shell', priority: 10 });
    const result = router.route('shell');
    expect(result!.target).toBe('secure-shell');
  });

  it('falls through to lower priority if high-priority does not match', () => {
    router.addRule({ id: 'default', pattern: '**', target: 'generic', priority: 0 });
    router.addRule({ id: 'special', pattern: 'agent:*', target: 'agent-pool', priority: 10 });
    const result = router.route('shell');
    expect(result!.target).toBe('generic');
  });

  // -----------------------------------------------------------------------
  // Routing — conditions
  // -----------------------------------------------------------------------

  it('evaluates condition against context', () => {
    router.addRule({
      id: 'prod',
      pattern: 'shell',
      target: 'prod-shell',
      priority: 10,
      condition: 'env == production',
    });
    router.addRule({ id: 'default', pattern: 'shell', target: 'dev-shell', priority: 0 });

    expect(router.route('shell', { env: 'production' })!.target).toBe('prod-shell');
    expect(router.route('shell', { env: 'staging' })!.target).toBe('dev-shell');
  });

  it('skips conditional rule when no context is provided', () => {
    router.addRule({
      id: 'conditional',
      pattern: 'shell',
      target: 'guarded',
      priority: 10,
      condition: 'env == production',
    });
    router.addRule({ id: 'default', pattern: 'shell', target: 'open', priority: 0 });

    expect(router.route('shell')!.target).toBe('open');
  });
});
