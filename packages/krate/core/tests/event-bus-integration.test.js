/**
 * Event bus integration tests
 *
 * Exercises the event bus pub/sub mechanism with multiple subscribers,
 * emitResourceChange field validation, unsubscribe isolation, and the
 * globalEventBus singleton.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createEventBus, globalEventBus } from '../src/event-bus.js';

// ---------------------------------------------------------------------------
// globalEventBus.emit notifies all subscribers
// ---------------------------------------------------------------------------

test('globalEventBus.emit notifies all subscribers', () => {
  // Use a local bus to avoid cross-test pollution from the module singleton
  const bus = createEventBus();
  const receivedA = [];
  const receivedB = [];

  bus.subscribe((e) => receivedA.push(e));
  bus.subscribe((e) => receivedB.push(e));

  bus.emit({ type: 'integration-test', value: 'ping' });

  assert.equal(receivedA.length, 1);
  assert.equal(receivedB.length, 1);
  assert.equal(receivedA[0].value, 'ping');
  assert.equal(receivedB[0].value, 'ping');
});

test('globalEventBus is a shared singleton — same object across imports', async () => {
  // Re-import to confirm it's the same singleton reference
  const { globalEventBus: bus2 } = await import('../src/event-bus.js');
  assert.strictEqual(globalEventBus, bus2, 'globalEventBus must be a module-level singleton');
});

// ---------------------------------------------------------------------------
// emitResourceChange includes correct fields
// ---------------------------------------------------------------------------

test('emitResourceChange includes kind, name, operation, type, and timestamp fields', () => {
  const bus = createEventBus();
  const events = [];
  bus.subscribe((e) => events.push(e));

  bus.emitResourceChange('Repository', 'my-repo', 'apply');

  assert.equal(events.length, 1);
  const ev = events[0];
  assert.equal(ev.type, 'resource-change');
  assert.equal(ev.kind, 'Repository');
  assert.equal(ev.name, 'my-repo');
  assert.equal(ev.operation, 'apply');
  assert.ok(typeof ev.timestamp === 'string', 'timestamp must be a string');
  assert.ok(new Date(ev.timestamp).getTime() > 0, 'timestamp must be a valid ISO date');
});

test('emitResourceChange for delete operation includes operation: delete', () => {
  const bus = createEventBus();
  const events = [];
  bus.subscribe((e) => events.push(e));

  bus.emitResourceChange('AgentStack', 'review-bot', 'delete');

  const ev = events[0];
  assert.equal(ev.operation, 'delete');
  assert.equal(ev.kind, 'AgentStack');
  assert.equal(ev.name, 'review-bot');
});

test('emitResourceChange broadcasts to all currently subscribed listeners', () => {
  const bus = createEventBus();
  const counts = [0, 0, 0];
  bus.subscribe(() => counts[0]++);
  bus.subscribe(() => counts[1]++);
  bus.subscribe(() => counts[2]++);

  bus.emitResourceChange('Pipeline', 'ci-pipeline', 'apply');

  assert.deepEqual(counts, [1, 1, 1]);
});

// ---------------------------------------------------------------------------
// unsubscribe stops notifications
// ---------------------------------------------------------------------------

test('unsubscribe stops further notifications to the removed listener', () => {
  const bus = createEventBus();
  const events = [];
  const listener = (e) => events.push(e);

  bus.subscribe(listener);
  bus.emit({ type: 'before-unsub' });

  bus.unsubscribe(listener);
  bus.emit({ type: 'after-unsub' });

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'before-unsub');
});

test('unsubscribing one listener does not affect other listeners', () => {
  const bus = createEventBus();
  const eventsA = [];
  const eventsB = [];
  const listenerA = (e) => eventsA.push(e);
  const listenerB = (e) => eventsB.push(e);

  bus.subscribe(listenerA);
  bus.subscribe(listenerB);

  bus.emit({ type: 'first' });
  bus.unsubscribe(listenerA);
  bus.emit({ type: 'second' });

  assert.equal(eventsA.length, 1, 'listenerA should only have received the first event');
  assert.equal(eventsB.length, 2, 'listenerB should have received both events');
  assert.equal(eventsB[1].type, 'second');
});

test('unsubscribing a listener that was never subscribed is a no-op', () => {
  const bus = createEventBus();
  const listener = () => {};
  // Should not throw
  assert.doesNotThrow(() => bus.unsubscribe(listener));
});

// ---------------------------------------------------------------------------
// Multiple subscribers receive same event
// ---------------------------------------------------------------------------

test('five subscribers all receive the same emitted event object', () => {
  const bus = createEventBus();
  const buckets = Array.from({ length: 5 }, () => []);
  buckets.forEach((bucket) => bus.subscribe((e) => bucket.push(e)));

  const event = { type: 'multi-fan-out', id: 'event-xyz' };
  bus.emit(event);

  for (const bucket of buckets) {
    assert.equal(bucket.length, 1, 'each subscriber should receive exactly one event');
    assert.strictEqual(bucket[0], event, 'each subscriber should receive the same event reference');
  }
});

test('emit with zero subscribers does not throw and is a no-op', () => {
  const bus = createEventBus();
  assert.doesNotThrow(() => bus.emit({ type: 'nobody-home' }));
});

test('subscribers added after an emit do not receive previous events', () => {
  const bus = createEventBus();
  const events = [];

  bus.emit({ type: 'before-subscribe' });
  bus.subscribe((e) => events.push(e));

  assert.equal(events.length, 0, 'late subscriber must not receive past events');
});

// ---------------------------------------------------------------------------
// Sequential emit ordering
// ---------------------------------------------------------------------------

test('emit delivers events to subscribers in subscription order', () => {
  const bus = createEventBus();
  const order = [];

  bus.subscribe(() => order.push('first'));
  bus.subscribe(() => order.push('second'));
  bus.subscribe(() => order.push('third'));

  bus.emit({ type: 'ordering-test' });

  assert.deepEqual(order, ['first', 'second', 'third']);
});

test('multiple emits are each delivered to all subscribers independently', () => {
  const bus = createEventBus();
  const events = [];
  bus.subscribe((e) => events.push(e.id));

  bus.emit({ id: 1 });
  bus.emit({ id: 2 });
  bus.emit({ id: 3 });

  assert.deepEqual(events, [1, 2, 3]);
});
