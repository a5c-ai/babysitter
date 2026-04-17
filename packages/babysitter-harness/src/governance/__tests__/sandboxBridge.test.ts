import { describe, it, expect } from 'vitest';
import {
  sandboxDecisionToInteraction,
  buildSandboxEvent,
  inheritSandboxPolicy,
  type SandboxEvent,
} from '../sandboxBridge';
import type { SandboxDecision, SandboxOperation, SandboxPolicy, SandboxRule } from '../sandboxPolicy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDecision(action: 'allow' | 'block' | 'prompt', reason = 'test'): SandboxDecision {
  return { action, reason };
}

function makeOp(kind: 'fs.read' | 'fs.write' | 'net.outbound' | 'exec.shell', target: string): SandboxOperation {
  return { kind, target };
}

function makePolicy(rules: SandboxRule[], defaultAction: 'allow' | 'block' = 'block'): SandboxPolicy {
  return { rules, defaultAction };
}

function makeRule(
  overrides: Partial<SandboxRule> & Pick<SandboxRule, 'kind' | 'pattern' | 'action'>,
): SandboxRule {
  return { priority: 100, ...overrides };
}

// ---------------------------------------------------------------------------
// sandboxDecisionToInteraction
// ---------------------------------------------------------------------------

describe('sandboxDecisionToInteraction', () => {
  it('returns null for a block decision (no interaction needed)', () => {
    const result = sandboxDecisionToInteraction(makeDecision('block'));
    expect(result).toBeNull();
  });

  it('returns null for an allow decision (no interaction needed)', () => {
    const result = sandboxDecisionToInteraction(makeDecision('allow'));
    expect(result).toBeNull();
  });

  it('returns InteractionKind approval for a prompt decision', () => {
    const result = sandboxDecisionToInteraction(makeDecision('prompt'));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('approval');
  });

  it('includes operation details in the interaction for prompt decisions', () => {
    const op = makeOp('fs.write', '/etc/config');
    const result = sandboxDecisionToInteraction(makeDecision('prompt', 'write to sensitive path'), op);
    expect(result).not.toBeNull();
    expect(result!.operationKind).toBe('fs.write');
    expect(result!.operationTarget).toBe('/etc/config');
  });
});

// ---------------------------------------------------------------------------
// buildSandboxEvent
// ---------------------------------------------------------------------------

describe('buildSandboxEvent', () => {
  it('creates event with operation, decision, timestamp, and source', () => {
    const op = makeOp('fs.read', '/tmp/file.txt');
    const decision = makeDecision('allow');
    const event = buildSandboxEvent(op, decision);
    expect(event.operation).toEqual(op);
    expect(event.decision).toEqual(decision);
    expect(typeof event.timestamp).toBe('string');
    expect(event.source).toBe('sandbox');
  });

  it('includes mandate info when provided', () => {
    const op = makeOp('net.outbound', 'api.github.com');
    const decision = makeDecision('allow');
    const event = buildSandboxEvent(op, decision, { mandateId: 'mandate-123' });
    expect(event.mandateId).toBe('mandate-123');
  });

  it('source defaults to sandbox when not specified', () => {
    const op = makeOp('exec.shell', 'ls');
    const decision = makeDecision('allow');
    const event = buildSandboxEvent(op, decision);
    expect(event.source).toBe('sandbox');
  });
});

// ---------------------------------------------------------------------------
// inheritSandboxPolicy
// ---------------------------------------------------------------------------

describe('inheritSandboxPolicy', () => {
  it('derives child policy from parent with mandate scope restrictions', () => {
    const parent = makePolicy([
      makeRule({ kind: 'fs.read', pattern: '/tmp/*', action: 'allow' }),
      makeRule({ kind: 'fs.write', pattern: '/tmp/*', action: 'allow' }),
      makeRule({ kind: 'net.outbound', pattern: '*.github.com', action: 'allow' }),
    ]);
    const mandateScope = { allowedEffectKinds: ['fs.read'], maxIterations: 10, maxConcurrentTasks: 1, timeoutMs: 5000 };
    const child = inheritSandboxPolicy(parent, mandateScope);
    // Child should only retain rules relevant to mandate scope
    expect(child.rules.some((r: SandboxRule) => r.kind === 'fs.read')).toBe(true);
  });

  it('child inherits all parent blocks', () => {
    const parent = makePolicy([
      makeRule({ kind: 'fs.write', pattern: '/etc/*', action: 'block' }),
      makeRule({ kind: 'exec.shell', pattern: 'rm *', action: 'block' }),
    ]);
    const mandateScope = { allowedEffectKinds: ['*'], maxIterations: 100, maxConcurrentTasks: 5, timeoutMs: 60000 };
    const child = inheritSandboxPolicy(parent, mandateScope);
    const blockRules = child.rules.filter((r: SandboxRule) => r.action === 'block');
    expect(blockRules).toHaveLength(2);
  });

  it('child cannot add allows that parent blocks', () => {
    const parent = makePolicy([
      makeRule({ kind: 'fs.write', pattern: '/etc/*', action: 'block' }),
    ]);
    const mandateScope = { allowedEffectKinds: ['*'], maxIterations: 100, maxConcurrentTasks: 5, timeoutMs: 60000 };
    const child = inheritSandboxPolicy(parent, mandateScope);
    // The inherited policy must preserve the parent block
    const etcBlocks = child.rules.filter(
      (r: SandboxRule) => r.kind === 'fs.write' && r.pattern === '/etc/*' && r.action === 'block',
    );
    expect(etcBlocks.length).toBeGreaterThanOrEqual(1);
  });
});
