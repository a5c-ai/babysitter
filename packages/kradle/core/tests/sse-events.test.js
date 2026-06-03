import assert from 'node:assert/strict';
import test from 'node:test';
import { createEventBus } from '../src/event-bus.js';

// ─── createEventBus shape ─────────────────────────────────────────────────────

test('createEventBus returns bus with subscribe, unsubscribe, emit', () => {
  const bus = createEventBus();
  assert.ok(typeof bus.subscribe === 'function', 'has subscribe method');
  assert.ok(typeof bus.unsubscribe === 'function', 'has unsubscribe method');
  assert.ok(typeof bus.emit === 'function', 'has emit method');
});

// ─── subscribe ────────────────────────────────────────────────────────────────

test('subscribe adds a listener that receives emitted events', () => {
  const bus = createEventBus();
  const received = [];
  bus.subscribe((event) => received.push(event));
  bus.emit({ type: 'test', value: 42 });
  assert.equal(received.length, 1, 'listener received one event');
  assert.deepEqual(received[0], { type: 'test', value: 42 });
});

// ─── unsubscribe ──────────────────────────────────────────────────────────────

test('unsubscribe removes a listener', () => {
  const bus = createEventBus();
  const received = [];
  const listener = (event) => received.push(event);
  bus.subscribe(listener);
  bus.emit({ type: 'first' });
  bus.unsubscribe(listener);
  bus.emit({ type: 'second' });
  assert.equal(received.length, 1, 'listener only received event before unsubscribe');
  assert.equal(received[0].type, 'first');
});

// ─── emit ─────────────────────────────────────────────────────────────────────

test('emit sends events to all subscribers', () => {
  const bus = createEventBus();
  const receivedA = [];
  const receivedB = [];
  bus.subscribe((e) => receivedA.push(e));
  bus.subscribe((e) => receivedB.push(e));
  bus.emit({ type: 'broadcast' });
  assert.equal(receivedA.length, 1, 'subscriber A received the event');
  assert.equal(receivedB.length, 1, 'subscriber B received the event');
  assert.equal(receivedA[0].type, 'broadcast');
  assert.equal(receivedB[0].type, 'broadcast');
});

test('emit with no subscribers does not throw', () => {
  const bus = createEventBus();
  assert.doesNotThrow(() => bus.emit({ type: 'lonely' }), 'emit with no subscribers is safe');
});

// ─── emitResourceChange ───────────────────────────────────────────────────────

test('emitResourceChange sends event with kind, name, operation, timestamp', () => {
  const bus = createEventBus();
  const received = [];
  bus.subscribe((event) => received.push(event));
  bus.emitResourceChange('Repository', 'my-repo', 'apply');
  assert.equal(received.length, 1, 'listener received one event');
  const event = received[0];
  assert.equal(event.type, 'resource-change', 'type is resource-change');
  assert.equal(event.kind, 'Repository', 'kind is correct');
  assert.equal(event.name, 'my-repo', 'name is correct');
  assert.equal(event.operation, 'apply', 'operation is correct');
  assert.ok(typeof event.timestamp === 'string', 'timestamp is a string');
  assert.ok(new Date(event.timestamp).getTime() > 0, 'timestamp is a valid ISO date');
});

// ─── multiple subscribers ─────────────────────────────────────────────────────

test('multiple subscribers all receive the same event', () => {
  const bus = createEventBus();
  const listeners = Array.from({ length: 5 }, () => []);
  listeners.forEach((arr) => bus.subscribe((e) => arr.push(e)));
  bus.emit({ type: 'multi', id: 99 });
  for (const arr of listeners) {
    assert.equal(arr.length, 1, 'each listener received exactly one event');
    assert.equal(arr[0].id, 99, 'each listener got the same event id');
  }
});

// ─── unsubscribed listener stops receiving ────────────────────────────────────

test('unsubscribed listener stops receiving events', () => {
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
  bus.emit({ type: 'third' });
  assert.equal(eventsA.length, 1, 'unsubscribed listener only got the first event');
  assert.equal(eventsB.length, 3, 'still-subscribed listener got all three events');
  assert.equal(eventsA[0].type, 'first');
  assert.equal(eventsB[2].type, 'third');
});
