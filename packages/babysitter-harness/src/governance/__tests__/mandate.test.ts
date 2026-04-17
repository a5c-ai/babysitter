import { describe, it, expect } from 'vitest';
import {
  createMandate,
  activateMandate,
  revokeMandate,
  deriveMandate,
  validateMandateForContext,
  mandateToPolicy,
  type ExecutionMandate,
  type MandateScope,
  type MandateLifecycle,
} from '../mandate';
import type { PolicyRule, PolicyEvaluationContext } from '../types';

describe('ExecutionMandate system', () => {
  const baseScope: MandateScope = {
    allowedEffectKinds: ['node', 'breakpoint'],
    maxIterations: 10,
    maxConcurrentTasks: 3,
    timeoutMs: 60_000,
  };

  describe('createMandate', () => {
    it('generates a unique mandate ID', () => {
      const m1 = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      const m2 = createMandate({ scope: baseScope, grantedBy: 'user:alice' });

      expect(m1.mandateId).toBeDefined();
      expect(m2.mandateId).toBeDefined();
      expect(m1.mandateId).not.toBe(m2.mandateId);
    });

    it('sets lifecycle to created', () => {
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      expect(m.lifecycle).toBe('created');
    });

    it('sets self-referential provenance (rootMandateId === mandateId)', () => {
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      expect(m.provenance.rootMandateId).toBe(m.mandateId);
      expect(m.provenance.derivationChain).toEqual([]);
    });

    it('records grantedBy and createdAt', () => {
      const before = new Date().toISOString();
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      const after = new Date().toISOString();

      expect(m.grantedBy).toBe('user:alice');
      expect(m.createdAt).toBeDefined();
      expect(m.createdAt >= before).toBe(true);
      expect(m.createdAt <= after).toBe(true);
    });

    it('stores the provided scope verbatim', () => {
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      expect(m.scope).toEqual(baseScope);
    });
  });

  describe('activateMandate', () => {
    it('transitions created -> active with activatedAt timestamp', () => {
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      const activated = activateMandate(m);

      expect(activated.lifecycle).toBe('active');
      expect(activated.activatedAt).toBeDefined();
      expect(typeof activated.activatedAt).toBe('string');
    });

    it('throws on double-activate', () => {
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      const activated = activateMandate(m);

      expect(() => activateMandate(activated)).toThrow();
    });

    it('throws when activating a revoked mandate', () => {
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });
      const activated = activateMandate(m);
      const revoked = revokeMandate(activated, { revokedBy: 'user:bob', reason: 'done' });

      expect(() => activateMandate(revoked)).toThrow();
    });
  });

  describe('revokeMandate', () => {
    it('transitions to revoked with revokedAt and revokedBy', () => {
      const m = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const revoked = revokeMandate(m, { revokedBy: 'user:bob', reason: 'security concern' });

      expect(revoked.lifecycle).toBe('revoked');
      expect(revoked.revokedAt).toBeDefined();
      expect(revoked.revokedBy).toBe('user:bob');
    });

    it('throws on already-revoked mandate', () => {
      const m = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const revoked = revokeMandate(m, { revokedBy: 'user:bob', reason: 'done' });

      expect(() => revokeMandate(revoked, { revokedBy: 'user:charlie', reason: 'again' })).toThrow();
    });
  });

  describe('deriveMandate', () => {
    it('attenuates scope (narrower allowedEffectKinds)', () => {
      const parent = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const childScope: MandateScope = {
        allowedEffectKinds: ['node'],  // subset of parent
        maxIterations: 5,             // stricter
        maxConcurrentTasks: 2,        // stricter
        timeoutMs: 30_000,            // stricter
      };
      const child = deriveMandate(parent, { scope: childScope, grantedBy: 'agent:worker-1' });

      expect(child.scope.allowedEffectKinds).toEqual(['node']);
      expect(child.scope.maxIterations).toBe(5);
    });

    it('extends the derivation chain', () => {
      const parent = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const child = deriveMandate(parent, {
        scope: { ...baseScope, maxIterations: 5 },
        grantedBy: 'agent:worker-1',
      });

      expect(child.provenance.rootMandateId).toBe(parent.mandateId);
      expect(child.provenance.derivationChain).toContain(parent.mandateId);
    });

    it('rejects scope expansion beyond parent', () => {
      const parent = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const expandedScope: MandateScope = {
        allowedEffectKinds: ['node', 'breakpoint', 'orchestrator_task'],  // expands beyond parent
        maxIterations: 20,   // exceeds parent
        maxConcurrentTasks: 3,
        timeoutMs: 60_000,
      };

      expect(() => deriveMandate(parent, { scope: expandedScope, grantedBy: 'agent:worker-1' })).toThrow();
    });

    it('rejects derivation from an inactive mandate', () => {
      const m = createMandate({ scope: baseScope, grantedBy: 'user:alice' });  // lifecycle = 'created', not 'active'

      expect(() => deriveMandate(m, { scope: baseScope, grantedBy: 'agent:worker' })).toThrow();
    });
  });

  describe('validateMandateForContext', () => {
    it('allows in-scope effectKind', () => {
      const m = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const ctx: PolicyEvaluationContext = { effectKind: 'node', processId: 'p1', runId: 'r1' };

      const result = validateMandateForContext(m, ctx);
      expect(result.valid).toBe(true);
    });

    it('denies out-of-scope effectKind', () => {
      const m = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const ctx: PolicyEvaluationContext = { effectKind: 'orchestrator_task', processId: 'p1', runId: 'r1' };

      const result = validateMandateForContext(m, ctx);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('orchestrator_task');
    });

    it('rejects expired mandate', () => {
      const shortScope: MandateScope = { ...baseScope, timeoutMs: 0 };
      const m = activateMandate(createMandate({ scope: shortScope, grantedBy: 'user:alice' }));

      const ctx: PolicyEvaluationContext = { effectKind: 'node', processId: 'p1', runId: 'r1' };

      // With timeoutMs=0, any elapsed time >= 0 triggers expiration
      const result = validateMandateForContext(m, ctx);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('rejects revoked mandate', () => {
      const m = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const revoked = revokeMandate(m, { revokedBy: 'user:bob', reason: 'done' });
      const ctx: PolicyEvaluationContext = { effectKind: 'node', processId: 'p1', runId: 'r1' };

      const result = validateMandateForContext(revoked, ctx);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('revoked');
    });
  });

  describe('mandateToPolicy', () => {
    it('generates PolicyRule[] from mandate scope', () => {
      const m = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const rules = mandateToPolicy(m);

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      rules.forEach((rule: PolicyRule) => {
        expect(rule.id).toBeDefined();
        expect(rule.action).toBeDefined();
        expect(rule.priority).toBeDefined();
      });
    });

    it('generates deny rules for out-of-scope effect kinds', () => {
      const m = createMandate({
        scope: { ...baseScope, allowedEffectKinds: ['node'] },
        grantedBy: 'user:alice',
      });
      const activated = activateMandate(m);
      const rules = mandateToPolicy(activated);

      const denyRules = rules.filter((r: PolicyRule) => r.action === 'deny');
      expect(denyRules.length).toBeGreaterThan(0);
    });

    it('generates iteration limit rule from maxIterations', () => {
      const m = activateMandate(createMandate({ scope: baseScope, grantedBy: 'user:alice' }));
      const rules = mandateToPolicy(m);

      const iterationRule = rules.find((r: PolicyRule) =>
        r.condition.field === 'iteration' && r.condition.op === 'gt'
      );
      expect(iterationRule).toBeDefined();
      expect(iterationRule!.condition.value).toBe(String(baseScope.maxIterations));
    });
  });
});
