import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEventBatcher,
  createRetryPolicy,
  createDeliveryQueue,
  createCheckpointer,
} from '../src/async-controller.js';

// ---------------------------------------------------------------------------
// createEventBatcher
// ---------------------------------------------------------------------------

test('createEventBatcher returns push, flush, and stop methods', () => {
  const batcher = createEventBatcher(() => {});
  assert.ok(typeof batcher.push === 'function', 'has push');
  assert.ok(typeof batcher.flush === 'function', 'has flush');
  assert.ok(typeof batcher.stop === 'function', 'has stop');
});

test('createEventBatcher: manual flush delivers accumulated events', async () => {
  const flushed = [];
  const batcher = createEventBatcher((events) => { flushed.push(...events); }, { flushIntervalMs: 60000 });
  batcher.push('a');
  batcher.push('b');
  batcher.push('c');
  assert.equal(flushed.length, 0, 'not flushed yet');
  await batcher.flush();
  assert.deepEqual(flushed, ['a', 'b', 'c']);
});

test('createEventBatcher: auto-flush when maxBatchSize is reached', async () => {
  const flushed = [];
  const batcher = createEventBatcher((events) => { flushed.push(...events); }, { maxBatchSize: 3, flushIntervalMs: 60000 });
  batcher.push(1);
  batcher.push(2);
  batcher.push(3); // triggers auto-flush synchronously
  // Allow microtasks to settle
  await new Promise((r) => setImmediate(r));
  assert.equal(flushed.length, 3, 'batch of 3 was flushed');
  assert.deepEqual(flushed, [1, 2, 3]);
});

test('createEventBatcher: flush clears the batch (subsequent flush sends nothing)', async () => {
  const calls = [];
  const batcher = createEventBatcher((events) => calls.push(events), { flushIntervalMs: 60000 });
  batcher.push('x');
  await batcher.flush();
  await batcher.flush();
  assert.equal(calls.length, 1, 'only one flush call had data');
});

test('createEventBatcher: stop discards pending events', async () => {
  const flushed = [];
  const batcher = createEventBatcher((events) => flushed.push(...events), { flushIntervalMs: 60000 });
  batcher.push('pending');
  batcher.stop();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(flushed.length, 0, 'stopped batcher should not flush');
});

test('createEventBatcher: handler is called with array of events', async () => {
  let received = null;
  const batcher = createEventBatcher((events) => { received = events; }, { flushIntervalMs: 60000 });
  batcher.push({ id: 1 });
  await batcher.flush();
  assert.ok(Array.isArray(received), 'handler receives an array');
  assert.equal(received.length, 1);
  assert.deepEqual(received[0], { id: 1 });
});

// ---------------------------------------------------------------------------
// createRetryPolicy
// ---------------------------------------------------------------------------

test('createRetryPolicy returns shouldRetry and getDelay methods', () => {
  const policy = createRetryPolicy();
  assert.ok(typeof policy.shouldRetry === 'function', 'has shouldRetry');
  assert.ok(typeof policy.getDelay === 'function', 'has getDelay');
});

test('createRetryPolicy: shouldRetry returns true while under maxRetries', () => {
  const policy = createRetryPolicy({ maxRetries: 3 });
  assert.equal(policy.shouldRetry(0, new Error()), true);
  assert.equal(policy.shouldRetry(1, new Error()), true);
  assert.equal(policy.shouldRetry(2, new Error()), true);
});

test('createRetryPolicy: shouldRetry returns false when maxRetries is reached', () => {
  const policy = createRetryPolicy({ maxRetries: 3 });
  assert.equal(policy.shouldRetry(3, new Error()), false);
  assert.equal(policy.shouldRetry(4, new Error()), false);
});

test('createRetryPolicy: getDelay implements exponential backoff', () => {
  const policy = createRetryPolicy({ baseDelayMs: 100, maxDelayMs: 10000, jitter: false });
  assert.equal(policy.getDelay(0), 100);
  assert.equal(policy.getDelay(1), 200);
  assert.equal(policy.getDelay(2), 400);
  assert.equal(policy.getDelay(3), 800);
});

test('createRetryPolicy: getDelay respects maxDelayMs cap', () => {
  const policy = createRetryPolicy({ baseDelayMs: 1000, maxDelayMs: 3000, jitter: false });
  assert.ok(policy.getDelay(5) <= 3000, 'delay should be capped at maxDelayMs');
  assert.equal(policy.getDelay(10), 3000);
});

test('createRetryPolicy: getDelay with jitter returns non-negative value within cap', () => {
  const policy = createRetryPolicy({ baseDelayMs: 100, maxDelayMs: 1000, jitter: true });
  for (let i = 0; i < 20; i++) {
    const delay = policy.getDelay(2);
    assert.ok(delay >= 0, 'jitter delay must be >= 0');
    assert.ok(delay <= 1000, 'jitter delay must be <= maxDelayMs');
  }
});

// ---------------------------------------------------------------------------
// createDeliveryQueue
// ---------------------------------------------------------------------------

test('createDeliveryQueue returns enqueue, drain, size, and stop methods', () => {
  const q = createDeliveryQueue(async () => {});
  assert.ok(typeof q.enqueue === 'function', 'has enqueue');
  assert.ok(typeof q.drain === 'function', 'has drain');
  assert.ok(typeof q.size === 'function', 'has size');
  assert.ok(typeof q.stop === 'function', 'has stop');
});

test('createDeliveryQueue: processes enqueued items', async () => {
  const processed = [];
  const q = createDeliveryQueue(async (item) => processed.push(item));
  q.enqueue('alpha');
  q.enqueue('beta');
  await q.drain();
  assert.deepEqual(processed, ['alpha', 'beta']);
});

test('createDeliveryQueue: drain resolves when queue is empty before enqueue', async () => {
  const q = createDeliveryQueue(async () => {});
  await q.drain(); // should resolve immediately
  assert.ok(true, 'drain resolved without hanging');
});

test('createDeliveryQueue: concurrency limit is respected', async () => {
  let concurrent = 0;
  let maxConcurrent = 0;
  const q = createDeliveryQueue(async (_item) => {
    concurrent++;
    if (concurrent > maxConcurrent) maxConcurrent = concurrent;
    await new Promise((r) => setTimeout(r, 10));
    concurrent--;
  }, { concurrency: 2 });

  for (let i = 0; i < 6; i++) q.enqueue(i);
  await q.drain();
  assert.ok(maxConcurrent <= 2, `max concurrent was ${maxConcurrent}, expected <= 2`);
});

test('createDeliveryQueue: retries item on processor failure using retryPolicy', async () => {
  let callCount = 0;
  const retryPolicy = createRetryPolicy({ maxRetries: 2, baseDelayMs: 1, jitter: false });
  const q = createDeliveryQueue(async (_item) => {
    callCount++;
    if (callCount < 3) throw new Error('transient');
  }, { retryPolicy });

  q.enqueue('item');
  await q.drain();
  assert.equal(callCount, 3, 'processor should have been called 3 times (2 retries)');
});

test('createDeliveryQueue: stop empties the queue', async () => {
  const processed = [];
  let resolveBlock;
  const block = new Promise((r) => { resolveBlock = r; });
  const q = createDeliveryQueue(async (item) => {
    await block;
    processed.push(item);
  }, { concurrency: 1 });

  q.enqueue('first');
  q.enqueue('second');
  q.enqueue('third');
  q.stop();
  resolveBlock();
  await new Promise((r) => setTimeout(r, 20));
  // After stop, queue is cleared so 'second' and 'third' should not be processed
  assert.ok(processed.length < 3, 'stopped queue should not process remaining items');
});

// ---------------------------------------------------------------------------
// createCheckpointer
// ---------------------------------------------------------------------------

test('createCheckpointer returns save, load, clear, and listKeys methods', () => {
  const cp = createCheckpointer();
  assert.ok(typeof cp.save === 'function', 'has save');
  assert.ok(typeof cp.load === 'function', 'has load');
  assert.ok(typeof cp.clear === 'function', 'has clear');
  assert.ok(typeof cp.listKeys === 'function', 'has listKeys');
});

test('createCheckpointer: save and load a value', () => {
  const cp = createCheckpointer();
  cp.save('cursor', 42);
  assert.equal(cp.load('cursor'), 42);
});

test('createCheckpointer: load returns undefined for unknown key', () => {
  const cp = createCheckpointer();
  assert.equal(cp.load('missing'), undefined);
});

test('createCheckpointer: clear removes a key', () => {
  const cp = createCheckpointer();
  cp.save('key', 'value');
  cp.clear('key');
  assert.equal(cp.load('key'), undefined);
});

test('createCheckpointer: listKeys returns all saved keys', () => {
  const cp = createCheckpointer();
  cp.save('a', 1);
  cp.save('b', 2);
  cp.save('c', 3);
  const keys = cp.listKeys();
  assert.deepEqual(keys.sort(), ['a', 'b', 'c']);
});

test('createCheckpointer: listKeys excludes cleared keys', () => {
  const cp = createCheckpointer();
  cp.save('keep', 1);
  cp.save('remove', 2);
  cp.clear('remove');
  assert.deepEqual(cp.listKeys(), ['keep']);
});

test('createCheckpointer: save overwrites existing value', () => {
  const cp = createCheckpointer();
  cp.save('seq', 1);
  cp.save('seq', 99);
  assert.equal(cp.load('seq'), 99);
});

test('createCheckpointer: accepts external Map storage', () => {
  const storage = new Map([['existing', 'data']]);
  const cp = createCheckpointer(storage);
  assert.equal(cp.load('existing'), 'data');
  cp.save('new', 'value');
  assert.equal(storage.get('new'), 'value');
});
