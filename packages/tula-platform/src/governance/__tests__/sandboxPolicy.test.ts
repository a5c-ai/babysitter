import { describe, it, expect } from 'vitest';
import {
  evaluateSandboxAccess,
  composeSandboxPolicies,
  attenuateSandboxPolicy,
  matchesPattern,
  type SandboxPolicy,
  type SandboxRule,
  type SandboxDecision,
  type SandboxOperation,
  type SandboxOperationKind,
} from '../sandboxPolicy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePolicy(rules: SandboxRule[], defaultAction: 'allow' | 'block' = 'block'): SandboxPolicy {
  return { rules, defaultAction };
}

function makeRule(
  overrides: Partial<SandboxRule> & Pick<SandboxRule, 'kind' | 'pattern' | 'action'>,
): SandboxRule {
  return { priority: 100, ...overrides };
}

function makeOp(kind: SandboxOperationKind, target: string): SandboxOperation {
  return { kind, target };
}

// ---------------------------------------------------------------------------
// evaluateSandboxAccess
// ---------------------------------------------------------------------------

describe('evaluateSandboxAccess', () => {
  it('returns allow for fs.read on an allowed path', () => {
    const policy = makePolicy([
      makeRule({ kind: 'fs.read', pattern: '/tmp/*', action: 'allow' }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('fs.read', '/tmp/data.txt'));
    expect(decision.action).toBe('allow');
  });

  it('returns block for fs.write on a blocked path', () => {
    const policy = makePolicy([
      makeRule({ kind: 'fs.write', pattern: '/etc/*', action: 'block' }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('fs.write', '/etc/passwd'));
    expect(decision.action).toBe('block');
  });

  it('returns prompt for fs.delete with a prompt rule', () => {
    const policy = makePolicy([
      makeRule({ kind: 'fs.delete', pattern: '/home/**/*', action: 'prompt' }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('fs.delete', '/home/user/file.txt'));
    expect(decision.action).toBe('prompt');
  });

  it('returns defaultAction (block) when no rule matches', () => {
    const policy = makePolicy([], 'block');
    const decision = evaluateSandboxAccess(policy, makeOp('fs.read', '/some/random/path'));
    expect(decision.action).toBe('block');
  });

  it('allows net.outbound when domain is in the allowlist', () => {
    const policy = makePolicy([
      makeRule({ kind: 'net.outbound', pattern: '*.github.com', action: 'allow' }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('net.outbound', 'api.github.com'));
    expect(decision.action).toBe('allow');
  });

  it('blocks net.outbound to a blocked domain', () => {
    const policy = makePolicy([
      makeRule({ kind: 'net.outbound', pattern: '*.evil.com', action: 'block' }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('net.outbound', 'phish.evil.com'));
    expect(decision.action).toBe('block');
  });

  it('allows exec.shell with a command in the allowlist', () => {
    const policy = makePolicy([
      makeRule({ kind: 'exec.shell', pattern: 'npm *', action: 'allow' }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('exec.shell', 'npm install'));
    expect(decision.action).toBe('allow');
  });

  it('blocks exec.shell with a blocked command', () => {
    const policy = makePolicy([
      makeRule({ kind: 'exec.shell', pattern: 'rm -rf *', action: 'block' }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('exec.shell', 'rm -rf /'));
    expect(decision.action).toBe('block');
  });

  it('higher priority rule wins over lower priority', () => {
    const policy = makePolicy([
      makeRule({ kind: 'fs.write', pattern: '/tmp/*', action: 'block', priority: 50 }),
      makeRule({ kind: 'fs.write', pattern: '/tmp/*', action: 'allow', priority: 200 }),
    ]);
    const decision = evaluateSandboxAccess(policy, makeOp('fs.write', '/tmp/test.txt'));
    expect(decision.action).toBe('allow');
  });
});

// ---------------------------------------------------------------------------
// matchesPattern
// ---------------------------------------------------------------------------

describe('matchesPattern', () => {
  it('matches glob patterns for file paths', () => {
    expect(matchesPattern('*.ts', 'index.ts')).toBe(true);
    expect(matchesPattern('src/**/*', 'src/foo/bar.ts')).toBe(true);
    expect(matchesPattern('/tmp/*', '/tmp/file.txt')).toBe(true);
    expect(matchesPattern('/tmp/*', '/var/file.txt')).toBe(false);
  });

  it('matches domain patterns', () => {
    expect(matchesPattern('*.example.com', 'api.example.com')).toBe(true);
    expect(matchesPattern('example.com', 'example.com')).toBe(true);
    expect(matchesPattern('*.example.com', 'evil.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// composeSandboxPolicies
// ---------------------------------------------------------------------------

describe('composeSandboxPolicies', () => {
  it('merges policies with deny-overrides (block wins over allow)', () => {
    const p1 = makePolicy([
      makeRule({ kind: 'fs.read', pattern: '/tmp/*', action: 'allow' }),
    ]);
    const p2 = makePolicy([
      makeRule({ kind: 'fs.read', pattern: '/tmp/*', action: 'block' }),
    ]);
    const merged = composeSandboxPolicies([p1, p2]);
    const decision = evaluateSandboxAccess(merged, makeOp('fs.read', '/tmp/test.txt'));
    expect(decision.action).toBe('block');
  });

  it('returns a default-deny policy for empty policies array', () => {
    const merged = composeSandboxPolicies([]);
    expect(merged.defaultAction).toBe('block');
    expect(merged.rules).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// attenuateSandboxPolicy
// ---------------------------------------------------------------------------

describe('attenuateSandboxPolicy', () => {
  it('child policy can only narrow parent (block additions ok, allow removals ok)', () => {
    const parent = makePolicy([
      makeRule({ kind: 'fs.read', pattern: '/tmp/*', action: 'allow' }),
      makeRule({ kind: 'fs.write', pattern: '/tmp/*', action: 'allow' }),
    ]);
    // Child removes fs.write allow and adds a new block
    const child = makePolicy([
      makeRule({ kind: 'fs.read', pattern: '/tmp/*', action: 'allow' }),
      makeRule({ kind: 'fs.write', pattern: '/tmp/*', action: 'block' }),
    ]);
    const attenuated = attenuateSandboxPolicy(parent, child);
    const writeDecision = evaluateSandboxAccess(attenuated, makeOp('fs.write', '/tmp/data'));
    expect(writeDecision.action).toBe('block');
  });

  it('child cannot add allow rules for paths the parent blocks', () => {
    const parent = makePolicy([
      makeRule({ kind: 'fs.write', pattern: '/etc/*', action: 'block' }),
    ]);
    const child = makePolicy([
      makeRule({ kind: 'fs.write', pattern: '/etc/*', action: 'allow' }),
    ]);
    const attenuated = attenuateSandboxPolicy(parent, child);
    const decision = evaluateSandboxAccess(attenuated, makeOp('fs.write', '/etc/passwd'));
    expect(decision.action).toBe('block');
  });
});
