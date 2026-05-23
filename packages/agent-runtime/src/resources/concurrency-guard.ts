/**
 * Concurrency guard that limits the number of parallel slots in use.
 *
 * Provides both throwing (`acquire`) and non-throwing (`tryAcquire`)
 * acquisition, as well as an async `waitForSlot` that resolves when a
 * slot becomes available.
 */

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

/** Thrown when `acquire()` is called with no available slots. */
export class ConcurrencyLimitError extends Error {
  readonly limit: number;
  readonly active: number;

  constructor(limit: number, active: number) {
    super(
      `Concurrency limit reached: ${active}/${limit} slots in use`,
    );
    this.name = "ConcurrencyLimitError";
    this.limit = limit;
    this.active = active;
  }
}

// ---------------------------------------------------------------------------
// ConcurrencyGuard
// ---------------------------------------------------------------------------

export class ConcurrencyGuard {
  private readonly _limit: number;
  private _active: number;
  /** Pending waiters, each resolved when a slot is freed. */
  private readonly _waiters: Array<() => void> = [];

  constructor(limit: number) {
    if (limit < 1) {
      throw new RangeError("Concurrency limit must be at least 1");
    }
    this._limit = limit;
    this._active = 0;
  }

  // -- Getters --------------------------------------------------------------

  /** Number of slots currently in use. */
  get active(): number {
    return this._active;
  }

  /** Number of slots available for acquisition. */
  get available(): number {
    return this._limit - this._active;
  }

  /** Maximum number of parallel slots. */
  get limit(): number {
    return this._limit;
  }

  // -- Acquisition ----------------------------------------------------------

  /**
   * Acquire a concurrency slot.
   *
   * @throws {ConcurrencyLimitError} if no slots are available.
   */
  acquire(): void {
    if (this._active >= this._limit) {
      throw new ConcurrencyLimitError(this._limit, this._active);
    }
    this._active++;
  }

  /**
   * Try to acquire a concurrency slot without throwing.
   *
   * @returns `true` if a slot was acquired, `false` otherwise.
   */
  tryAcquire(): boolean {
    if (this._active >= this._limit) {
      return false;
    }
    this._active++;
    return true;
  }

  /**
   * Release a concurrency slot, waking the oldest waiter if any.
   *
   * No-ops if no slots are currently active (defensive).
   */
  release(): void {
    if (this._active <= 0) {
      return;
    }
    this._active--;
    // Wake the first waiter in line.
    const waiter = this._waiters.shift();
    if (waiter) {
      waiter();
    }
  }

  /**
   * Wait asynchronously until a slot becomes available, then acquire it.
   *
   * If a slot is already available, the returned promise resolves
   * immediately (on the microtask queue).
   *
   * @param timeoutMs - Optional timeout in milliseconds. Rejects with a
   *   `ConcurrencyLimitError` if no slot is freed within this duration.
   */
  async waitForSlot(timeoutMs?: number): Promise<void> {
    // Fast path: slot available right now.
    if (this._active < this._limit) {
      this._active++;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const onSlot = (): void => {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        this._active++;
        resolve();
      };

      this._waiters.push(onSlot);

      if (timeoutMs !== undefined && timeoutMs >= 0) {
        timer = setTimeout(() => {
          // Remove this waiter from the queue.
          const idx = this._waiters.indexOf(onSlot);
          if (idx !== -1) {
            this._waiters.splice(idx, 1);
          }
          reject(
            new ConcurrencyLimitError(this._limit, this._active),
          );
        }, timeoutMs);
      }
    });
  }
}
