/**
 * RED tests for the permission event propagation system.
 * These tests MUST FAIL — the permissionEvents module does not exist yet.
 */

import { describe, it, expect } from 'vitest';
import {
  createPermissionEvent,
  aggregateChainEvents,
  filterEvents,
  type PermissionEvent,
  type PermissionEventSource,
} from '../permissionEvents';

describe('createPermissionEvent', () => {
  it('creates event with kind, operation, decision, timestamp, source', () => {
    const event = createPermissionEvent({
      kind: 'fs.write',
      operation: { kind: 'fs.write', target: '/tmp/foo.txt' },
      decision: { action: 'allow', reason: 'matched rule' },
      timestamp: '2026-04-12T00:00:00.000Z',
      source: 'sandbox',
    });

    expect(event.kind).toBe('fs.write');
    expect(event.operation.kind).toBe('fs.write');
    expect(event.operation.target).toBe('/tmp/foo.txt');
    expect(event.decision.action).toBe('allow');
    expect(event.decision.reason).toBe('matched rule');
    expect(event.timestamp).toBe('2026-04-12T00:00:00.000Z');
    expect(event.source).toBe('sandbox');
  });

  it('auto-generates timestamp if not provided', () => {
    const before = new Date().toISOString();
    const event = createPermissionEvent({
      kind: 'exec.shell',
      operation: { kind: 'exec.shell', target: 'ls -la' },
      decision: { action: 'block', reason: 'denied by policy' },
      source: 'policy-engine',
    });
    const after = new Date().toISOString();

    expect(event.timestamp).toBeDefined();
    expect(typeof event.timestamp).toBe('string');
    expect(event.timestamp >= before).toBe(true);
    expect(event.timestamp <= after).toBe(true);
  });

  it('supports all source types', () => {
    const sources: PermissionEventSource[] = ['harness', 'subagent', 'sandbox', 'policy-engine'];

    for (const source of sources) {
      const event = createPermissionEvent({
        kind: 'net.outbound',
        operation: { kind: 'net.outbound', target: 'https://example.com' },
        decision: { action: 'allow', reason: 'ok' },
        source,
      });
      expect(event.source).toBe(source);
    }
  });

  it('includes optional mandateId and chainId', () => {
    const event = createPermissionEvent({
      kind: 'fs.read',
      operation: { kind: 'fs.read', target: '/etc/passwd' },
      decision: { action: 'block', reason: 'sensitive file' },
      source: 'sandbox',
      mandateId: 'mandate-001',
      chainId: 'chain-abc',
    });

    expect(event.mandateId).toBe('mandate-001');
    expect(event.chainId).toBe('chain-abc');
  });
});

describe('aggregateChainEvents', () => {
  const makeEvent = (
    kind: string,
    timestamp: string,
    chainId: string,
  ): PermissionEvent =>
    createPermissionEvent({
      kind,
      operation: { kind: kind as 'fs.read', target: '/test' },
      decision: { action: 'allow', reason: 'test' },
      source: 'sandbox',
      timestamp,
      chainId,
    });

  it('collects events across parent and child runs', () => {
    const parentEvents = [makeEvent('fs.read', '2026-04-12T01:00:00Z', 'chain-1')];
    const childEvents = [makeEvent('fs.write', '2026-04-12T02:00:00Z', 'chain-1')];

    const aggregated = aggregateChainEvents('chain-1', [parentEvents, childEvents]);

    expect(aggregated).toHaveLength(2);
    expect(aggregated[0].kind).toBe('fs.read');
    expect(aggregated[1].kind).toBe('fs.write');
  });

  it('preserves chronological order', () => {
    const events1 = [makeEvent('fs.write', '2026-04-12T03:00:00Z', 'chain-2')];
    const events2 = [makeEvent('fs.read', '2026-04-12T01:00:00Z', 'chain-2')];
    const events3 = [makeEvent('exec.shell', '2026-04-12T02:00:00Z', 'chain-2')];

    const aggregated = aggregateChainEvents('chain-2', [events1, events2, events3]);

    expect(aggregated[0].kind).toBe('fs.read');
    expect(aggregated[1].kind).toBe('exec.shell');
    expect(aggregated[2].kind).toBe('fs.write');
  });

  it('empty chain returns empty array', () => {
    const aggregated = aggregateChainEvents('chain-empty', []);
    expect(aggregated).toEqual([]);
  });
});

describe('filterEvents', () => {
  const events: PermissionEvent[] = [
    createPermissionEvent({
      kind: 'fs.read',
      operation: { kind: 'fs.read', target: '/tmp/a' },
      decision: { action: 'allow', reason: 'ok' },
      source: 'sandbox',
      timestamp: '2026-04-12T01:00:00Z',
    }),
    createPermissionEvent({
      kind: 'fs.write',
      operation: { kind: 'fs.write', target: '/tmp/b' },
      decision: { action: 'block', reason: 'denied' },
      source: 'harness',
      timestamp: '2026-04-12T02:00:00Z',
    }),
    createPermissionEvent({
      kind: 'exec.shell',
      operation: { kind: 'exec.shell', target: 'rm -rf /' },
      decision: { action: 'prompt', reason: 'dangerous' },
      source: 'policy-engine',
      timestamp: '2026-04-12T03:00:00Z',
    }),
    createPermissionEvent({
      kind: 'net.outbound',
      operation: { kind: 'net.outbound', target: 'https://api.example.com' },
      decision: { action: 'allow', reason: 'trusted domain' },
      source: 'sandbox',
      timestamp: '2026-04-12T04:00:00Z',
    }),
  ];

  it('by source: returns only matching source', () => {
    const filtered = filterEvents(events, { source: 'sandbox' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(e => e.source === 'sandbox')).toBe(true);
  });

  it('by decision action: returns only allow/block/prompt', () => {
    const blocked = filterEvents(events, { action: 'block' });
    expect(blocked).toHaveLength(1);
    expect(blocked[0].decision.action).toBe('block');
  });

  it('by kind: filters by operation kind', () => {
    const shellEvents = filterEvents(events, { kind: 'exec.shell' });
    expect(shellEvents).toHaveLength(1);
    expect(shellEvents[0].kind).toBe('exec.shell');
  });

  it('with multiple criteria: combines filters with AND logic', () => {
    const filtered = filterEvents(events, { source: 'sandbox', action: 'allow' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(e => e.source === 'sandbox' && e.decision.action === 'allow')).toBe(true);
  });

  it('with no criteria: returns all events', () => {
    const filtered = filterEvents(events, {});
    expect(filtered).toHaveLength(4);
  });
});
