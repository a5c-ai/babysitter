import { describe, it, expect, vi } from 'vitest';
import { StreamMerger, StreamFanout } from '../streamingParallelism';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function* fromArray<T>(items: T[], delayMs = 0): AsyncGenerator<T> {
  for (const item of items) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    yield item;
  }
}

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of gen) {
    items.push(item);
  }
  return items;
}

// ---------------------------------------------------------------------------
// StreamMerger
// ---------------------------------------------------------------------------

describe('StreamMerger', () => {
  it('merges a single stream', async () => {
    const merger = new StreamMerger<number>();
    merger.addStream('a', fromArray([1, 2, 3]));
    const items = await collect(merger.merged());
    expect(items.map((i) => i.value)).toEqual([1, 2, 3]);
    expect(items.every((i) => i.streamId === 'a')).toBe(true);
  });

  it('merges multiple streams', async () => {
    const merger = new StreamMerger<string>();
    merger.addStream('x', fromArray(['x1', 'x2']));
    merger.addStream('y', fromArray(['y1', 'y2']));

    const items = await collect(merger.merged());
    expect(items).toHaveLength(4);

    const values = items.map((i) => i.value);
    expect(values).toContain('x1');
    expect(values).toContain('x2');
    expect(values).toContain('y1');
    expect(values).toContain('y2');
  });

  it('tags items with their stream id', async () => {
    const merger = new StreamMerger<number>();
    merger.addStream('alpha', fromArray([10]));
    merger.addStream('beta', fromArray([20]));

    const items = await collect(merger.merged());
    const alphaItems = items.filter((i) => i.streamId === 'alpha');
    const betaItems = items.filter((i) => i.streamId === 'beta');
    expect(alphaItems).toHaveLength(1);
    expect(alphaItems[0].value).toBe(10);
    expect(betaItems).toHaveLength(1);
    expect(betaItems[0].value).toBe(20);
  });

  it('yields nothing from empty merger', async () => {
    const merger = new StreamMerger<number>();
    const items = await collect(merger.merged());
    expect(items).toEqual([]);
  });

  it('handles empty streams', async () => {
    const merger = new StreamMerger<number>();
    merger.addStream('empty', fromArray([]));
    merger.addStream('full', fromArray([1]));

    const items = await collect(merger.merged());
    expect(items).toHaveLength(1);
    expect(items[0].value).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// StreamFanout
// ---------------------------------------------------------------------------

describe('StreamFanout', () => {
  it('delivers items to all consumers', async () => {
    const fanout = new StreamFanout<number>();
    const received1: number[] = [];
    const received2: number[] = [];

    fanout.addConsumer('c1', (item) => { received1.push(item); });
    fanout.addConsumer('c2', (item) => { received2.push(item); });

    await fanout.push(42);
    expect(received1).toEqual([42]);
    expect(received2).toEqual([42]);
  });

  it('handles async consumers', async () => {
    const fanout = new StreamFanout<string>();
    const received: string[] = [];

    fanout.addConsumer('async', async (item) => {
      await new Promise((r) => setTimeout(r, 1));
      received.push(item);
    });

    await fanout.push('hello');
    expect(received).toEqual(['hello']);
  });

  it('removes consumers', async () => {
    const fanout = new StreamFanout<number>();
    const received: number[] = [];

    fanout.addConsumer('temp', (item) => { received.push(item); });
    await fanout.push(1);
    expect(received).toEqual([1]);

    expect(fanout.removeConsumer('temp')).toBe(true);
    await fanout.push(2);
    expect(received).toEqual([1]); // not received
  });

  it('removeConsumer returns false for unknown id', () => {
    const fanout = new StreamFanout<number>();
    expect(fanout.removeConsumer('nope')).toBe(false);
  });

  it('push does nothing with no consumers', async () => {
    const fanout = new StreamFanout<number>();
    await expect(fanout.push(99)).resolves.toBeUndefined();
  });

  it('delivers multiple items in order', async () => {
    const fanout = new StreamFanout<number>();
    const received: number[] = [];
    fanout.addConsumer('c', (item) => { received.push(item); });

    await fanout.push(1);
    await fanout.push(2);
    await fanout.push(3);
    expect(received).toEqual([1, 2, 3]);
  });
});
