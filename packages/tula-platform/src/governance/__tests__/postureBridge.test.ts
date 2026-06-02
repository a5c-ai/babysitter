import { describe, it, expect } from 'vitest';
import {
  postureToPolicyRules,
  allPosturesToPolicies,
} from '../postureBridge';
import type { PolicyRule } from '../types';
import type { ActionCategory, ApprovalPosture } from "@a5c-ai/babysitter-sdk";
import { DEFAULT_POSTURES } from "../../breakpoints/postures";

describe('Posture-to-policy bridge', () => {
  describe('postureToPolicyRules', () => {
    it('locked posture generates deny rules', () => {
      const lockedPosture: ApprovalPosture = DEFAULT_POSTURES.destroy;
      const rules = postureToPolicyRules('destroy', lockedPosture);

      expect(rules.length).toBeGreaterThan(0);
      const denyRules = rules.filter((r: PolicyRule) => r.action === 'deny');
      expect(denyRules.length).toBeGreaterThan(0);

      // All deny rules should reference the category in their condition or metadata
      denyRules.forEach((r: PolicyRule) => {
        expect(r.id).toContain('destroy');
      });
    });

    it('cautious posture generates conditional allow rules', () => {
      const cautiousPosture: ApprovalPosture = DEFAULT_POSTURES.write;
      const rules = postureToPolicyRules('write', cautiousPosture);

      expect(rules.length).toBeGreaterThan(0);
      // Cautious should allow but with conditions/warnings
      const hasAllowOrWarn = rules.some(
        (r: PolicyRule) => r.action === 'allow' || r.action === 'warn'
      );
      expect(hasAllowOrWarn).toBe(true);
    });

    it('permissive posture generates allow rules', () => {
      const permissivePosture: ApprovalPosture = DEFAULT_POSTURES.read;
      const rules = postureToPolicyRules('read', permissivePosture);

      expect(rules.length).toBeGreaterThan(0);
      const allowRules = rules.filter((r: PolicyRule) => r.action === 'allow');
      expect(allowRules.length).toBeGreaterThan(0);
    });

    it('guarded posture requires explicit rule', () => {
      const guardedPosture: ApprovalPosture = DEFAULT_POSTURES.execute;
      const rules = postureToPolicyRules('execute', guardedPosture);

      expect(rules.length).toBeGreaterThan(0);
      // Guarded postures should have rules that enforce explicit approval
      const hasGuardedRule = rules.some(
        (r: PolicyRule) => r.metadata?.requireExplicitRule === 'true'
      );
      expect(hasGuardedRule).toBe(true);
    });

    it('locked posture rules have highest priority', () => {
      const lockedRules = postureToPolicyRules('auth', DEFAULT_POSTURES.auth);
      const cautiousRules = postureToPolicyRules('network', DEFAULT_POSTURES.network);

      const maxLockedPriority = Math.max(...lockedRules.map((r: PolicyRule) => r.priority));
      const maxCautiousPriority = Math.max(...cautiousRules.map((r: PolicyRule) => r.priority));

      expect(maxLockedPriority).toBeGreaterThan(maxCautiousPriority);
    });

    it('includes minConsecutiveApprovalsForAutoN in rule metadata', () => {
      const rules = postureToPolicyRules('write', DEFAULT_POSTURES.write);

      const ruleWithThreshold = rules.find(
        (r: PolicyRule) => r.metadata?.minConsecutiveApprovals !== undefined
      );
      expect(ruleWithThreshold).toBeDefined();
      expect(ruleWithThreshold!.metadata!.minConsecutiveApprovals).toBe(
        String(DEFAULT_POSTURES.write.minConsecutiveApprovalsForAutoN)
      );
    });
  });

  describe('allPosturesToPolicies', () => {
    it('generates rules for all 6 action categories', () => {
      const rules = allPosturesToPolicies();
      const categories: ActionCategory[] = ['read', 'write', 'execute', 'destroy', 'network', 'auth'];

      for (const category of categories) {
        const categoryRules = rules.filter((r: PolicyRule) =>
          r.id.includes(category) || r.metadata?.category === category
        );
        expect(categoryRules.length).toBeGreaterThan(0);
      }
    });

    it('applies overrides to specific categories', () => {
      const overrides: Partial<Record<ActionCategory, Partial<ApprovalPosture>>> = {
        read: { allowAutoApprove: false },  // make read locked
      };

      const rules = allPosturesToPolicies(overrides);
      const readRules = rules.filter((r: PolicyRule) =>
        r.id.includes('read') || r.metadata?.category === 'read'
      );

      // With overrides, read should have deny/restrictive rules
      const hasDenyOrWarn = readRules.some(
        (r: PolicyRule) => r.action === 'deny' || r.action === 'warn'
      );
      expect(hasDenyOrWarn).toBe(true);
    });

    it('returns rules sorted by priority descending', () => {
      const rules = allPosturesToPolicies();
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i - 1].priority).toBeGreaterThanOrEqual(rules[i].priority);
      }
    });

    it('all generated rules have unique IDs', () => {
      const rules = allPosturesToPolicies();
      const ids = rules.map((r: PolicyRule) => r.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('generates valid PolicyRule objects', () => {
      const rules = allPosturesToPolicies();

      rules.forEach((rule: PolicyRule) => {
        expect(rule.id).toBeDefined();
        expect(typeof rule.id).toBe('string');
        expect(rule.kind).toBeDefined();
        expect(['rate-limit', 'permission', 'resource-limit', 'trust-level']).toContain(rule.kind);
        expect(rule.condition).toBeDefined();
        expect(rule.condition.field).toBeDefined();
        expect(rule.condition.op).toBeDefined();
        expect(rule.condition.value).toBeDefined();
        expect(['allow', 'deny', 'warn']).toContain(rule.action);
        expect(typeof rule.priority).toBe('number');
      });
    });

    it('without overrides uses DEFAULT_POSTURES', () => {
      const defaultRules = allPosturesToPolicies();
      const explicitRules = allPosturesToPolicies({});

      // Should produce identical output
      expect(defaultRules.length).toBe(explicitRules.length);
      expect(defaultRules.map((r: PolicyRule) => r.id)).toEqual(
        explicitRules.map((r: PolicyRule) => r.id)
      );
    });
  });
});
