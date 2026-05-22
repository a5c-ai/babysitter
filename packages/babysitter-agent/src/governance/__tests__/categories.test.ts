import { describe, it, expect } from 'vitest';
import {
  categorizePolicyRule,
  createCategorizedEngine,
  inferPolicyCategory,
  type CategorizedPolicyRule,
  type PolicyCategory,
} from '../categories';
import type { PolicyRule, PolicyEvaluationContext } from '../types';

describe('Deterministic policy categories', () => {
  const makeDenyRule = (id: string, kind: PolicyRule['kind'], field = 'effectKind', value = 'shell'): PolicyRule => ({
    id,
    kind,
    condition: { field, op: 'eq', value },
    action: 'deny',
    priority: 100,
  });

  const makeAllowRule = (id: string, kind: PolicyRule['kind'], field = 'effectKind', value = 'node'): PolicyRule => ({
    id,
    kind,
    condition: { field, op: 'eq', value },
    action: 'allow',
    priority: 50,
  });

  describe('categorizePolicyRule', () => {
    it('wraps an existing rule with category A metadata', () => {
      const rule = makeDenyRule('critical-deny', 'rate-limit');
      const categorized = categorizePolicyRule(rule, 'A');

      expect(categorized.id).toBe(rule.id);
      expect(categorized.category).toBe('A');
      expect(categorized.action).toBe('deny');
      expect(categorized.condition).toEqual(rule.condition);
    });

    it('wraps a rule with category B metadata', () => {
      const rule = makeAllowRule('advisory-allow', 'permission');
      const categorized = categorizePolicyRule(rule, 'B');

      expect(categorized.category).toBe('B');
    });

    it('preserves original rule metadata', () => {
      const rule: PolicyRule = {
        ...makeDenyRule('meta-rule', 'permission'),
        metadata: { reason: 'Security policy', owner: 'sec-team' },
      };
      const categorized = categorizePolicyRule(rule, 'C');

      expect(categorized.metadata).toEqual(rule.metadata);
    });

    it('supports all four categories', () => {
      const categories: PolicyCategory[] = ['A', 'B', 'C', 'D'];
      for (const cat of categories) {
        const rule = makeDenyRule(`rule-${cat}`, 'permission');
        const categorized = categorizePolicyRule(rule, cat);
        expect(categorized.category).toBe(cat);
      }
    });
  });

  describe('createCategorizedEngine', () => {
    it('category A rules are immutable (cannot be overridden by allow)', () => {
      const denyRule = categorizePolicyRule(
        makeDenyRule('immutable-deny', 'rate-limit', 'effectKind', 'shell'),
        'A',
      );
      const allowRule = categorizePolicyRule(
        makeAllowRule('allow-shell', 'permission', 'effectKind', 'shell'),
        'B',
      );

      const engine = createCategorizedEngine([denyRule, allowRule]);
      const ctx: PolicyEvaluationContext = { effectKind: 'shell' };
      const decision = engine.evaluate(ctx);

      expect(decision.allowed).toBe(false);
      expect(decision.rule?.id).toBe('immutable-deny');
    });

    it('category B emits advisory warning', () => {
      const warnRule = categorizePolicyRule(
        {
          id: 'advisory-warn',
          kind: 'resource-limit',
          condition: { field: 'effectKind', op: 'eq', value: 'agent' },
          action: 'warn',
          priority: 50,
        },
        'B',
      );

      const engine = createCategorizedEngine([warnRule]);
      const ctx: PolicyEvaluationContext = { effectKind: 'agent' };
      const decision = engine.evaluate(ctx);

      expect(decision.allowed).toBe(true);
      expect(decision.warnings.length).toBeGreaterThan(0);
      expect(decision.warnings[0]).toContain('advisory-warn');
    });

    it('category C requires classification before evaluation', () => {
      const classificationRule = categorizePolicyRule(
        makeDenyRule('needs-classification', 'permission', 'effectKind', 'unknown'),
        'C',
      );

      const engine = createCategorizedEngine([classificationRule]);
      const ctx: PolicyEvaluationContext = { effectKind: 'unknown' };
      const decision = engine.evaluate(ctx);

      // Category C with deny should still deny but include classification metadata
      expect(decision.allowed).toBe(false);
      expect(decision.requiresClassification).toBe(true);
    });

    it('category D uses fallback posture-based policy', () => {
      const fallbackRule = categorizePolicyRule(
        makeAllowRule('fallback-allow', 'trust-level', 'effectKind', 'node'),
        'D',
      );

      const engine = createCategorizedEngine([fallbackRule]);
      const ctx: PolicyEvaluationContext = { effectKind: 'node' };
      const decision = engine.evaluate(ctx);

      expect(decision.allowed).toBe(true);
      expect(decision.usedFallback).toBe(true);
    });
  });

  describe('inferPolicyCategory', () => {
    it('rate-limit + deny infers category A', () => {
      const rule = makeDenyRule('rate-deny', 'rate-limit');
      const category = inferPolicyCategory(rule);
      expect(category).toBe('A');
    });

    it('permission + deny infers category C', () => {
      const rule = makeDenyRule('perm-deny', 'permission');
      const category = inferPolicyCategory(rule);
      expect(category).toBe('C');
    });

    it('trust-level kind infers category D', () => {
      const rule: PolicyRule = {
        id: 'trust-rule',
        kind: 'trust-level',
        condition: { field: 'metadata.trust', op: 'eq', value: 'low' },
        action: 'allow',
        priority: 10,
      };
      const category = inferPolicyCategory(rule);
      expect(category).toBe('D');
    });

    it('default inference is category B', () => {
      const rule: PolicyRule = {
        id: 'generic-rule',
        kind: 'resource-limit',
        condition: { field: 'effectKind', op: 'eq', value: 'any' },
        action: 'warn',
        priority: 10,
      };
      const category = inferPolicyCategory(rule);
      expect(category).toBe('B');
    });
  });

  describe('backward compatibility', () => {
    it('fallbackRules work with categorized engine', () => {
      // Plain uncategorized PolicyRule[] should work as fallback
      const plainRules: PolicyRule[] = [
        makeDenyRule('legacy-deny', 'permission'),
        makeAllowRule('legacy-allow', 'permission'),
      ];

      // createCategorizedEngine should accept plain rules and auto-categorize
      const engine = createCategorizedEngine(plainRules as CategorizedPolicyRule[]);
      const ctx: PolicyEvaluationContext = { effectKind: 'shell' };
      const decision = engine.evaluate(ctx);

      // Should still function correctly
      expect(decision.allowed).toBeDefined();
      expect(typeof decision.reason).toBe('string');
    });

    it('mixed categorized and uncategorized rules coexist', () => {
      const categorized = categorizePolicyRule(
        makeDenyRule('cat-deny', 'rate-limit', 'effectKind', 'dangerous'),
        'A',
      );
      const uncategorized = makeAllowRule('plain-allow', 'permission', 'effectKind', 'safe');

      const engine = createCategorizedEngine([categorized, uncategorized as CategorizedPolicyRule]);
      const safeCtx: PolicyEvaluationContext = { effectKind: 'safe' };
      const dangerousCtx: PolicyEvaluationContext = { effectKind: 'dangerous' };

      expect(engine.evaluate(safeCtx).allowed).toBe(true);
      expect(engine.evaluate(dangerousCtx).allowed).toBe(false);
    });
  });
});
