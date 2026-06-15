/**
 * Streaming parallelism — merge and fan-out async streams (GAP-PAR-006).
 *
 * StreamMerger: merges multiple async iterables into a single ordered-by-arrival
 *               async generator.
 * StreamFanout: pushes items to multiple consumers concurrently.
 */

// ---------------------------------------------------------------------------
// StreamMerger
// ---------------------------------------------------------------------------

interface TaggedItem<T> {
  streamId: string;
  value: T;
}

/**
 * Merges multiple async iterables into a single async generator that yields
 * items as they arrive from any source.
 */
export class StreamMerger<T> {
  private streams = new Map<string, AsyncIterable<T>>();

  /** Register an async iterable source with a unique id. */
  addStream(id: string, iterable: AsyncIterable<T>): void {
    this.streams.set(id, iterable);
  }

  /**
   * Async generator that yields `{ streamId, value }` tuples from all
   * registered streams, in order of arrival.
   */
  async *merged(): AsyncGenerator<TaggedItem<T>> {
    if (this.streams.size === 0) return;

    // We use a shared queue + resolvers pattern to merge multiple iterators
    const queue: TaggedItem<T>[] = [];
    let done = 0;
    const total = this.streams.size;
    let resolve: (() => void) | null = null;
    let finished = false;

    function enqueue(item: TaggedItem<T>): void {
      queue.push(item);
      if (resolve) {
        const r = resolve;
        resolve = null;
        r();
      }
    }

    function signalDone(): void {
      done++;
      if (done >= total) {
        finished = true;
        if (resolve) {
          const r = resolve;
          resolve = null;
          r();
        }
      }
    }

    // Start consuming each stream
    const consumers: Promise<void>[] = [];
    for (const [id, iterable] of this.streams.entries()) {
      consumers.push(
        (async () => {
          try {
            for await (const value of iterable) {
              enqueue({ streamId: id, value });
            }
          } finally {
            signalDone();
          }
        })(),
      );
    }

    // Yield items as they arrive
    while (!finished || queue.length > 0) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else if (!finished) {
        await new Promise<void>((r) => {
          resolve = r;
        });
      }
    }

    // Wait for all consumer promises to settle
    await Promise.allSettled(consumers);
  }
}

// ---------------------------------------------------------------------------
// StreamFanout
// ---------------------------------------------------------------------------

export type FanoutCallback<T> = (item: T) => void | Promise<void>;

/**
 * Forwards each pushed item to all registered consumers.
 */
export class StreamFanout<T> {
  private consumers = new Map<string, FanoutCallback<T>>();

  /** Register a consumer callback with a unique id. */
  addConsumer(id: string, callback: FanoutCallback<T>): void {
    this.consumers.set(id, callback);
  }

  /** Remove a consumer by id. Returns true if it existed. */
  removeConsumer(id: string): boolean {
    return this.consumers.delete(id);
  }

  /**
   * Push an item to all consumers. If any consumer returns a Promise,
   * push waits for all of them to settle.
   */
  async push(item: T): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const cb of this.consumers.values()) {
      const result = cb(item);
      if (result && typeof result === 'object' && 'then' in result) {
        promises.push(result as Promise<void>);
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
}
