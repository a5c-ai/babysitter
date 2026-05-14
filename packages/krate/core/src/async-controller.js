/**
 * Async controller utilities for event batching, retry policies, delivery queues,
 * and checkpoint persistence.
 */

// ---------------------------------------------------------------------------
// Event batcher
// ---------------------------------------------------------------------------

/**
 * Accumulates events and flushes them in batches either when the batch is full
 * or when the flush interval expires.
 *
 * @param {(events: any[]) => void | Promise<void>} handler - Called with each flushed batch.
 * @param {{ maxBatchSize?: number, flushIntervalMs?: number }} [options]
 * @returns {{ push(event: any): void, flush(): Promise<void>, stop(): void }}
 */
export function createEventBatcher(handler, { maxBatchSize = 50, flushIntervalMs = 1000 } = {}) {
  let batch = [];
  let timer = null;

  function scheduleFlush() {
    if (timer !== null) return;
    timer = setTimeout(async () => {
      timer = null;
      await flushNow();
    }, flushIntervalMs);
  }

  async function flushNow() {
    if (batch.length === 0) return;
    const toFlush = batch;
    batch = [];
    await handler(toFlush);
  }

  return {
    push(event) {
      batch.push(event);
      if (batch.length >= maxBatchSize) {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        // Fire-and-forget the synchronous portion; handler may return a Promise
        const toFlush = batch;
        batch = [];
        Promise.resolve(handler(toFlush)).catch(() => {});
      } else {
        scheduleFlush();
      }
    },
    async flush() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      await flushNow();
    },
    stop() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      batch = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Retry policy
// ---------------------------------------------------------------------------

/**
 * Creates a retry policy with exponential backoff and optional jitter.
 *
 * @param {{ maxRetries?: number, baseDelayMs?: number, maxDelayMs?: number, jitter?: boolean }} [options]
 * @returns {{ shouldRetry(attempt: number, error: any): boolean, getDelay(attempt: number): number }}
 */
export function createRetryPolicy({ maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000, jitter = true } = {}) {
  return {
    /**
     * Returns true if another attempt should be made.
     * @param {number} attempt - 0-based number of the attempt that just failed.
     */
    shouldRetry(attempt, _error) {
      return attempt < maxRetries;
    },
    /**
     * Returns the delay in ms to wait before the next attempt.
     * @param {number} attempt - 0-based number of the attempt that just failed.
     */
    getDelay(attempt) {
      const exponential = baseDelayMs * Math.pow(2, attempt);
      const capped = Math.min(exponential, maxDelayMs);
      if (!jitter) return capped;
      // Full-jitter: random value in [0, capped]
      return Math.floor(Math.random() * (capped + 1));
    },
  };
}

// ---------------------------------------------------------------------------
// Delivery queue
// ---------------------------------------------------------------------------

/**
 * In-memory ordered queue with configurable concurrency and optional retry support.
 *
 * @param {(item: any) => Promise<void>} processor - Called for each dequeued item.
 * @param {{ concurrency?: number, retryPolicy?: ReturnType<typeof createRetryPolicy> }} [options]
 * @returns {{ enqueue(item: any): void, drain(): Promise<void>, size(): number, stop(): void }}
 */
export function createDeliveryQueue(processor, { concurrency = 5, retryPolicy } = {}) {
  const queue = [];
  let active = 0;
  let stopped = false;
  /** @type {Array<() => void>} */
  let drainResolvers = [];

  function checkDrain() {
    if (active === 0 && queue.length === 0) {
      for (const resolve of drainResolvers) resolve();
      drainResolvers = [];
    }
  }

  async function processItem(item) {
    let attempt = 0;
    while (true) {
      try {
        await processor(item);
        return;
      } catch (err) {
        if (retryPolicy && retryPolicy.shouldRetry(attempt, err)) {
          const delay = retryPolicy.getDelay(attempt);
          attempt++;
          if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        } else {
          // Swallow the error; callers can handle via processor rejections externally
          return;
        }
      }
    }
  }

  function tick() {
    while (!stopped && queue.length > 0 && active < concurrency) {
      const item = queue.shift();
      active++;
      processItem(item).finally(() => {
        active--;
        tick();
        checkDrain();
      });
    }
    if (!stopped) checkDrain();
  }

  return {
    enqueue(item) {
      if (stopped) return;
      queue.push(item);
      tick();
    },
    drain() {
      if (active === 0 && queue.length === 0) return Promise.resolve();
      return new Promise((resolve) => drainResolvers.push(resolve));
    },
    size() {
      return queue.length + active;
    },
    stop() {
      stopped = true;
      queue.length = 0;
      for (const resolve of drainResolvers) resolve();
      drainResolvers = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Checkpointer
// ---------------------------------------------------------------------------

/**
 * Simple key-value checkpoint persistence backed by any Map-like storage.
 *
 * @param {Map<string, any>} [storage]
 * @returns {{ save(key: string, value: any): void, load(key: string): any, clear(key: string): void, listKeys(): string[] }}
 */
export function createCheckpointer(storage = new Map()) {
  return {
    save(key, value) {
      storage.set(key, value);
    },
    load(key) {
      return storage.has(key) ? storage.get(key) : undefined;
    },
    clear(key) {
      storage.delete(key);
    },
    listKeys() {
      return Array.from(storage.keys());
    },
  };
}
