import { describe, it, expect } from 'vitest';
import {
  createAuthorityChain,
  validateAuthorityChain,
  attenuateScope,
  traceAuthorityToHuman,
  type AuthorityPrincipal,
  type AuthorityGrant,
  type AuthorityChain,
} from '../authority';
import type { MandateScope } from '../mandate';

describe('AuthorityChain system', () => {
  const humanPrincipal: AuthorityPrincipal = {
    kind: 'human',
    id: 'user:alice',
    displayName: 'Alice',
  };

  const agentPrincipal: AuthorityPrincipal = {
    kind: 'agent',
    id: 'agent:orchestrator-1',
    displayName: 'Orchestrator',
  };

  const subAgentPrincipal: AuthorityPrincipal = {
    kind: 'agent',
    id: 'agent:worker-1',
    displayName: 'Worker',
  };

  const fullScope: MandateScope = {
    allowedEffectKinds: ['node', 'breakpoint', 'orchestrator_task'],
    maxIterations: 20,
    maxConcurrentTasks: 5,
    timeoutMs: 120_000,
  };

  const restrictedScope: MandateScope = {
    allowedEffectKinds: ['node', 'breakpoint'],
    maxIterations: 10,
    maxConcurrentTasks: 3,
    timeoutMs: 60_000,
  };

  describe('createAuthorityChain', () => {
    it('creates a valid chain from a single human grant', () => {
      const grant: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
      };

      const chain = createAuthorityChain([grant]);

      expect(chain.grants).toHaveLength(1);
      expect(chain.rootPrincipal).toEqual(humanPrincipal);
      expect(chain.effectiveScope).toEqual(fullScope);
    });

    it('creates a multi-hop chain with intersected scope', () => {
      const grant1: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
      };
      const grant2: AuthorityGrant = {
        from: agentPrincipal,
        to: subAgentPrincipal,
        scope: restrictedScope,
        grantedAt: new Date().toISOString(),
      };

      const chain = createAuthorityChain([grant1, grant2]);

      expect(chain.grants).toHaveLength(2);
      // Effective scope is intersection (restricted scope)
      expect(chain.effectiveScope.allowedEffectKinds).toEqual(['node', 'breakpoint']);
      expect(chain.effectiveScope.maxIterations).toBe(10);
      expect(chain.effectiveScope.maxConcurrentTasks).toBe(3);
    });

    it('rejects an empty grants array', () => {
      expect(() => createAuthorityChain([])).toThrow();
    });
  });

  describe('validateAuthorityChain', () => {
    it('validates a well-formed chain', () => {
      const grant: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
      };
      const chain = createAuthorityChain([grant]);

      const result = validateAuthorityChain(chain);
      expect(result.valid).toBe(true);
    });

    it('rejects a chain with a revoked link', () => {
      const grant: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
        revokedAt: new Date().toISOString(),
      };
      const chain = createAuthorityChain([grant]);

      const result = validateAuthorityChain(chain);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('revoked');
    });

    it('rejects a chain with an expired link', () => {
      const pastDate = new Date(Date.now() - 86_400_000).toISOString(); // 24h ago
      const grant: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: pastDate,
        expiresAt: pastDate, // already expired
      };
      const chain = createAuthorityChain([grant]);

      const result = validateAuthorityChain(chain);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('rejects scope expansion in delegation chain', () => {
      const grant1: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: restrictedScope,
        grantedAt: new Date().toISOString(),
      };
      const grant2: AuthorityGrant = {
        from: agentPrincipal,
        to: subAgentPrincipal,
        scope: fullScope, // expands beyond parent
        grantedAt: new Date().toISOString(),
      };
      const chain = createAuthorityChain([grant1, grant2]);

      const result = validateAuthorityChain(chain);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('scope');
    });

    it('rejects a chain without a human root', () => {
      const grant: AuthorityGrant = {
        from: agentPrincipal, // agent, not human
        to: subAgentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
      };
      const chain = createAuthorityChain([grant]);

      const result = validateAuthorityChain(chain);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('human');
    });
  });

  describe('attenuateScope', () => {
    it('intersects allowedEffectKinds', () => {
      const parent: MandateScope = {
        allowedEffectKinds: ['node', 'breakpoint', 'orchestrator_task'],
        maxIterations: 20,
        maxConcurrentTasks: 5,
        timeoutMs: 120_000,
      };
      const child: MandateScope = {
        allowedEffectKinds: ['node', 'sleep'],
        maxIterations: 10,
        maxConcurrentTasks: 3,
        timeoutMs: 60_000,
      };

      const result = attenuateScope(parent, child);
      expect(result.allowedEffectKinds).toEqual(['node']); // intersection
    });

    it('wildcard parent + restricted child yields child', () => {
      const parent: MandateScope = {
        allowedEffectKinds: ['*'],
        maxIterations: 100,
        maxConcurrentTasks: 10,
        timeoutMs: 300_000,
      };
      const child: MandateScope = {
        allowedEffectKinds: ['node', 'breakpoint'],
        maxIterations: 5,
        maxConcurrentTasks: 2,
        timeoutMs: 30_000,
      };

      const result = attenuateScope(parent, child);
      expect(result.allowedEffectKinds).toEqual(['node', 'breakpoint']);
    });

    it('takes numeric minimums for limits', () => {
      const parent: MandateScope = {
        allowedEffectKinds: ['node'],
        maxIterations: 20,
        maxConcurrentTasks: 5,
        timeoutMs: 120_000,
      };
      const child: MandateScope = {
        allowedEffectKinds: ['node'],
        maxIterations: 50, // higher than parent
        maxConcurrentTasks: 2, // lower than parent
        timeoutMs: 200_000, // higher than parent
      };

      const result = attenuateScope(parent, child);
      expect(result.maxIterations).toBe(20);        // min(20, 50)
      expect(result.maxConcurrentTasks).toBe(2);     // min(5, 2)
      expect(result.timeoutMs).toBe(120_000);        // min(120k, 200k)
    });
  });

  describe('traceAuthorityToHuman', () => {
    it('returns root human principal and hop count for single-hop', () => {
      const grant: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
      };
      const chain = createAuthorityChain([grant]);

      const trace = traceAuthorityToHuman(chain);
      expect(trace.humanPrincipal).toEqual(humanPrincipal);
      expect(trace.hopCount).toBe(1);
    });

    it('returns root human principal and hop count for multi-hop', () => {
      const grant1: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
      };
      const grant2: AuthorityGrant = {
        from: agentPrincipal,
        to: subAgentPrincipal,
        scope: restrictedScope,
        grantedAt: new Date().toISOString(),
      };
      const chain = createAuthorityChain([grant1, grant2]);

      const trace = traceAuthorityToHuman(chain);
      expect(trace.humanPrincipal).toEqual(humanPrincipal);
      expect(trace.hopCount).toBe(2);
    });

    it('includes the full principal path', () => {
      const grant1: AuthorityGrant = {
        from: humanPrincipal,
        to: agentPrincipal,
        scope: fullScope,
        grantedAt: new Date().toISOString(),
      };
      const grant2: AuthorityGrant = {
        from: agentPrincipal,
        to: subAgentPrincipal,
        scope: restrictedScope,
        grantedAt: new Date().toISOString(),
      };
      const chain = createAuthorityChain([grant1, grant2]);

      const trace = traceAuthorityToHuman(chain);
      expect(trace.principalPath).toEqual([
        humanPrincipal.id,
        agentPrincipal.id,
        subAgentPrincipal.id,
      ]);
    });
  });
});
