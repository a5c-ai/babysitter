/**
 * RED tests for permission propagation formatting and config.
 * These tests MUST FAIL — the permissionPropagation module does not exist yet.
 */

import { describe, it, expect } from 'vitest';
import {
  formatPermissionForTui,
  formatPermissionForJsonStream,
  formatPermissionForCli,
  createPropagationConfig,
  shouldPropagate,
  type PropagationTarget,
  type PropagationConfig,
} from '../permissionPropagation';
import type { PermissionEvent } from '../permissionEvents';

function makeEvent(overrides: Partial<PermissionEvent> = {}): PermissionEvent {
  return {
    kind: 'fs.write',
    operation: { kind: 'fs.write', target: '/tmp/test.txt' },
    decision: { action: 'allow', reason: 'matched rule' },
    timestamp: '2026-04-12T12:00:00.000Z',
    source: 'sandbox',
    ...overrides,
  } as PermissionEvent;
}

describe('formatPermissionForTui', () => {
  it('block decision uses red ANSI color', () => {
    const event = makeEvent({
      decision: { action: 'block', reason: 'blocked by policy' },
    });
    const output = formatPermissionForTui(event);
    // Red ANSI escape: \x1b[31m
    expect(output).toContain('\x1b[31m');
  });

  it('allow decision uses green ANSI color', () => {
    const event = makeEvent({
      decision: { action: 'allow', reason: 'ok' },
    });
    const output = formatPermissionForTui(event);
    // Green ANSI escape: \x1b[32m
    expect(output).toContain('\x1b[32m');
  });

  it('prompt decision uses yellow ANSI color', () => {
    const event = makeEvent({
      decision: { action: 'prompt', reason: 'needs approval' },
    });
    const output = formatPermissionForTui(event);
    // Yellow ANSI escape: \x1b[33m
    expect(output).toContain('\x1b[33m');
  });

  it('includes operation target in output', () => {
    const event = makeEvent({
      operation: { kind: 'fs.write', target: '/home/user/secret.key' },
    });
    const output = formatPermissionForTui(event);
    expect(output).toContain('/home/user/secret.key');
  });
});

describe('formatPermissionForJsonStream', () => {
  it('returns valid JSON-serializable object', () => {
    const event = makeEvent();
    const result = formatPermissionForJsonStream(event);
    // Should not throw
    const serialized = JSON.stringify(result);
    const parsed = JSON.parse(serialized);
    expect(parsed).toBeDefined();
  });

  it('includes all event fields', () => {
    const event = makeEvent({
      kind: 'net.outbound',
      operation: { kind: 'net.outbound', target: 'https://api.test.com' },
      decision: { action: 'block', reason: 'untrusted' },
      mandateId: 'mandate-xyz',
    });
    const result = formatPermissionForJsonStream(event);

    expect(result.kind).toBe('net.outbound');
    expect(result.operation.kind).toBe('net.outbound');
    expect(result.operation.target).toBe('https://api.test.com');
    expect(result.decision.action).toBe('block');
    expect(result.decision.reason).toBe('untrusted');
    expect(result.mandateId).toBe('mandate-xyz');
  });

  it('includes source and timestamp', () => {
    const event = makeEvent({
      source: 'harness',
      timestamp: '2026-04-12T15:30:00.000Z',
    });
    const result = formatPermissionForJsonStream(event);

    expect(result.source).toBe('harness');
    expect(result.timestamp).toBe('2026-04-12T15:30:00.000Z');
  });
});

describe('formatPermissionForCli', () => {
  it('returns single-line human-readable string', () => {
    const event = makeEvent();
    const output = formatPermissionForCli(event);
    expect(typeof output).toBe('string');
    expect(output).not.toContain('\n');
  });

  it('includes action, kind, and target', () => {
    const event = makeEvent({
      kind: 'exec.shell',
      operation: { kind: 'exec.shell', target: 'npm install' },
      decision: { action: 'allow', reason: 'trusted command' },
    });
    const output = formatPermissionForCli(event);
    expect(output).toContain('allow');
    expect(output).toContain('exec.shell');
    expect(output).toContain('npm install');
  });
});

describe('createPropagationConfig', () => {
  it('creates config with target-to-event-kind mapping', () => {
    const targets: PropagationTarget[] = [
      { name: 'tui', kinds: ['fs.read', 'fs.write'] },
      { name: 'json-stream', kinds: ['exec.shell'] },
    ];

    const config = createPropagationConfig(targets);

    expect(config).toBeDefined();
    expect(config.targets).toHaveLength(2);
    expect(config.targets[0].name).toBe('tui');
    expect(config.targets[0].kinds).toEqual(['fs.read', 'fs.write']);
    expect(config.targets[1].name).toBe('json-stream');
    expect(config.targets[1].kinds).toEqual(['exec.shell']);
  });
});

describe('shouldPropagate', () => {
  const config: PropagationConfig = createPropagationConfig([
    { name: 'tui', kinds: ['fs.read', 'fs.write', 'exec.shell'] },
    { name: 'json-stream', kinds: ['net.outbound'] },
  ]);

  it('returns true when event kind matches target config', () => {
    const event = makeEvent({ kind: 'fs.write' });
    expect(shouldPropagate(event, 'tui', config)).toBe(true);
  });

  it('returns false when event kind not in target config', () => {
    const event = makeEvent({ kind: 'net.outbound' });
    expect(shouldPropagate(event, 'tui', config)).toBe(false);
  });
});
