import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuditController, createEventPoller } from '../src/audit-controller.js';

// ─── createAuditController shape ─────────────────────────────────────────────

test('createAuditController returns controller with log, query, getStream, getMetrics methods', () => {
  const controller = createAuditController();
  assert.ok(typeof controller.log === 'function', 'has log method');
  assert.ok(typeof controller.query === 'function', 'has query method');
  assert.ok(typeof controller.getStream === 'function', 'has getStream method');
  assert.ok(typeof controller.getMetrics === 'function', 'has getMetrics method');
});

// ─── log ─────────────────────────────────────────────────────────────────────

test('log records an audit event with org, actor, action, resource, timestamp', () => {
  const controller = createAuditController();
  const event = controller.log({
    org: 'acme',
    actor: 'alice',
    action: 'repository.create',
    resource: { kind: 'Repository', name: 'my-repo' },
  });
  assert.equal(event.org, 'acme');
  assert.equal(event.actor, 'alice');
  assert.equal(event.action, 'repository.create');
  assert.deepEqual(event.resource, { kind: 'Repository', name: 'my-repo' });
  assert.ok(typeof event.timestamp === 'string', 'timestamp is a string');
  assert.ok(new Date(event.timestamp).getTime() > 0, 'timestamp is a valid ISO date');
});

test('log generates sequential event IDs', () => {
  const controller = createAuditController();
  const e1 = controller.log({ org: 'acme', actor: 'alice', action: 'repo.create', resource: {} });
  const e2 = controller.log({ org: 'acme', actor: 'alice', action: 'repo.delete', resource: {} });
  const e3 = controller.log({ org: 'acme', actor: 'bob',   action: 'user.create', resource: {} });
  assert.ok(typeof e1.id === 'number', 'id is numeric');
  assert.ok(e2.id > e1.id, 'e2.id > e1.id');
  assert.ok(e3.id > e2.id, 'e3.id > e2.id');
  assert.equal(e2.id - e1.id, 1, 'IDs are strictly sequential');
  assert.equal(e3.id - e2.id, 1, 'IDs are strictly sequential');
});

test('log rejects missing org', () => {
  const controller = createAuditController();
  assert.throws(
    () => controller.log({ actor: 'alice', action: 'repo.create', resource: {} }),
    /org/i,
    'throws when org is missing'
  );
});

test('log rejects missing action', () => {
  const controller = createAuditController();
  assert.throws(
    () => controller.log({ org: 'acme', actor: 'alice', resource: {} }),
    /action/i,
    'throws when action is missing'
  );
});

// ─── query ────────────────────────────────────────────────────────────────────

test('query returns events filtered by org', () => {
  const controller = createAuditController();
  controller.log({ org: 'acme', actor: 'alice', action: 'repo.create', resource: {} });
  controller.log({ org: 'globex', actor: 'bob', action: 'repo.create', resource: {} });
  controller.log({ org: 'acme', actor: 'carol', action: 'user.invite', resource: {} });

  const result = controller.query({ org: 'acme' });
  assert.equal(result.events.length, 2, 'returns only acme events');
  assert.ok(result.events.every(e => e.org === 'acme'), 'all events belong to acme');
});

test('query returns events filtered by action', () => {
  const controller = createAuditController();
  controller.log({ org: 'acme', actor: 'alice', action: 'repo.create', resource: {} });
  controller.log({ org: 'acme', actor: 'bob',   action: 'user.invite', resource: {} });
  controller.log({ org: 'acme', actor: 'carol', action: 'repo.create', resource: {} });

  const result = controller.query({ org: 'acme', action: 'repo.create' });
  assert.equal(result.events.length, 2, 'returns only repo.create events');
  assert.ok(result.events.every(e => e.action === 'repo.create'), 'all events have action repo.create');
});

test('query returns events filtered by time range (since/until)', () => {
  const controller = createAuditController();

  const t0 = new Date('2026-01-01T00:00:00Z');
  const t1 = new Date('2026-01-02T00:00:00Z');
  const t2 = new Date('2026-01-03T00:00:00Z');
  const t3 = new Date('2026-01-04T00:00:00Z');

  controller.log({ org: 'acme', actor: 'alice', action: 'a', resource: {}, timestamp: t0.toISOString() });
  controller.log({ org: 'acme', actor: 'alice', action: 'b', resource: {}, timestamp: t1.toISOString() });
  controller.log({ org: 'acme', actor: 'alice', action: 'c', resource: {}, timestamp: t2.toISOString() });
  controller.log({ org: 'acme', actor: 'alice', action: 'd', resource: {}, timestamp: t3.toISOString() });

  const result = controller.query({ org: 'acme', since: t1.toISOString(), until: t2.toISOString() });
  assert.equal(result.events.length, 2, 'returns events within [since, until] inclusive');
  assert.ok(result.events.some(e => e.action === 'b'), 'includes event at since boundary');
  assert.ok(result.events.some(e => e.action === 'c'), 'includes event at until boundary');
});

test('query supports pagination (limit, offset)', () => {
  const controller = createAuditController();
  for (let i = 0; i < 10; i++) {
    controller.log({ org: 'acme', actor: 'alice', action: `action-${i}`, resource: {} });
  }
  const page1 = controller.query({ org: 'acme', limit: 3, offset: 0 });
  const page2 = controller.query({ org: 'acme', limit: 3, offset: 3 });

  assert.equal(page1.events.length, 3, 'page1 has 3 events');
  assert.equal(page2.events.length, 3, 'page2 has 3 events');
  // IDs should be different between pages
  const page1Ids = new Set(page1.events.map(e => e.id));
  const page2Ids = new Set(page2.events.map(e => e.id));
  for (const id of page2Ids) assert.ok(!page1Ids.has(id), 'page2 events are distinct from page1');
});

test('query returns events in reverse chronological order', () => {
  const controller = createAuditController();
  controller.log({ org: 'acme', actor: 'alice', action: 'a', resource: {}, timestamp: '2026-01-01T00:00:00Z' });
  controller.log({ org: 'acme', actor: 'alice', action: 'b', resource: {}, timestamp: '2026-01-02T00:00:00Z' });
  controller.log({ org: 'acme', actor: 'alice', action: 'c', resource: {}, timestamp: '2026-01-03T00:00:00Z' });

  const result = controller.query({ org: 'acme' });
  const timestamps = result.events.map(e => new Date(e.timestamp).getTime());
  for (let i = 1; i < timestamps.length; i++) {
    assert.ok(timestamps[i - 1] >= timestamps[i], `event[${i - 1}] should be >= event[${i}] (desc order)`);
  }
});

// ─── getStream ────────────────────────────────────────────────────────────────

test('getStream returns events after a sequence number (for replay)', () => {
  const controller = createAuditController();
  const e1 = controller.log({ org: 'acme', actor: 'alice', action: 'a', resource: {} });
  const e2 = controller.log({ org: 'acme', actor: 'alice', action: 'b', resource: {} });
  const e3 = controller.log({ org: 'acme', actor: 'alice', action: 'c', resource: {} });

  const stream = controller.getStream({ org: 'acme', afterSeq: e1.id });
  assert.ok(Array.isArray(stream.events), 'returns array of events');
  assert.equal(stream.events.length, 2, 'returns 2 events after seq e1');
  assert.ok(stream.events.every(e => e.id > e1.id), 'all returned events have id > afterSeq');
  assert.ok(stream.events.some(e => e.id === e2.id), 'includes e2');
  assert.ok(stream.events.some(e => e.id === e3.id), 'includes e3');
});

test('getStream returns empty array when no new events', () => {
  const controller = createAuditController();
  const e1 = controller.log({ org: 'acme', actor: 'alice', action: 'a', resource: {} });

  const stream = controller.getStream({ org: 'acme', afterSeq: e1.id });
  assert.equal(stream.events.length, 0, 'returns empty array when no new events');
  assert.ok(Array.isArray(stream.events), 'events is still an array');
});

// ─── createEventPoller ────────────────────────────────────────────────────────

test('createEventPoller returns poller with poll method and backoff state', () => {
  const controller = createAuditController();
  const poller = createEventPoller({ controller, org: 'acme' });
  assert.ok(typeof poller.poll === 'function', 'has poll method');
  assert.ok(typeof poller.getBackoff === 'function', 'has getBackoff method');
  assert.ok(typeof poller.reset === 'function', 'has reset method');
});

test('poll increases backoff interval when no new events (1s, 2s, 4s... max 30s)', () => {
  const controller = createAuditController();
  const poller = createEventPoller({ controller, org: 'acme', initialBackoff: 1000, maxBackoff: 30000 });

  // No events exist — each poll should grow backoff
  assert.equal(poller.getBackoff(), 1000, 'initial backoff is 1s');
  poller.poll();
  assert.equal(poller.getBackoff(), 2000, 'after 1 empty poll: 2s');
  poller.poll();
  assert.equal(poller.getBackoff(), 4000, 'after 2 empty polls: 4s');
  poller.poll();
  assert.equal(poller.getBackoff(), 8000, 'after 3 empty polls: 8s');
  poller.poll();
  assert.equal(poller.getBackoff(), 16000, 'after 4 empty polls: 16s');
  poller.poll();
  assert.equal(poller.getBackoff(), 30000, 'capped at maxBackoff 30s');
  poller.poll();
  assert.equal(poller.getBackoff(), 30000, 'stays at maxBackoff');
});

test('poll resets backoff when new events arrive', () => {
  const controller = createAuditController();
  const poller = createEventPoller({ controller, org: 'acme', initialBackoff: 1000, maxBackoff: 30000 });

  // First poll: no events — backoff grows
  poller.poll();
  assert.equal(poller.getBackoff(), 2000, 'backoff grew to 2s');

  // Add a new event
  controller.log({ org: 'acme', actor: 'alice', action: 'repo.create', resource: {} });

  // Poll again — should see the event and reset backoff
  const result = poller.poll();
  assert.ok(result.events.length > 0, 'poll returns new events');
  assert.equal(poller.getBackoff(), 1000, 'backoff resets to initial after receiving events');
});

// ─── getMetrics ───────────────────────────────────────────────────────────────

test('getMetrics returns aggregate counts (events by action, by org, by hour)', () => {
  const controller = createAuditController();
  controller.log({ org: 'acme',   actor: 'alice', action: 'repo.create', resource: {}, timestamp: '2026-05-13T10:00:00Z' });
  controller.log({ org: 'acme',   actor: 'alice', action: 'repo.create', resource: {}, timestamp: '2026-05-13T10:30:00Z' });
  controller.log({ org: 'acme',   actor: 'bob',   action: 'user.invite',  resource: {}, timestamp: '2026-05-13T11:00:00Z' });
  controller.log({ org: 'globex', actor: 'carol', action: 'repo.create', resource: {}, timestamp: '2026-05-13T10:15:00Z' });

  const metrics = controller.getMetrics({ org: 'acme' });

  assert.ok(typeof metrics.byAction === 'object', 'has byAction');
  assert.ok(typeof metrics.byOrg === 'object', 'has byOrg');
  assert.ok(typeof metrics.byHour === 'object', 'has byHour');
  assert.equal(metrics.byAction['repo.create'], 2, 'acme has 2 repo.create events');
  assert.equal(metrics.byAction['user.invite'], 1, 'acme has 1 user.invite event');
  assert.equal(metrics.byOrg['acme'], 3, 'acme org total is 3');
  // byHour keys are ISO hour strings (e.g. "2026-05-13T10")
  assert.ok(metrics.byHour['2026-05-13T10'] >= 2, 'at least 2 events in 2026-05-13T10 hour');
  assert.ok(metrics.byHour['2026-05-13T11'] >= 1, 'at least 1 event in 2026-05-13T11 hour');
});
