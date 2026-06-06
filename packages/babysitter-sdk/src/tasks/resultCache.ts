/**
 * Effect result caching and deduplication — avoid redundant effect
 * execution by caching resolved results with TTL support (GAP-ROUTE-003).
 */

import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CachedResult<T = unknown> {
  value: T;
  cachedAt: number;
  expiresAt: number;
}

export interface EffectActionLike {
  kind: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Cache key generation
// ---------------------------------------------------------------------------

/**
 * Produce a deterministic cache key from an effect action by hashing
 * the kind and a sorted JSON representation of all params.
 */
export function createCacheKey(action: EffectActionLike): string {
  const hash = createHash('sha256');
  hash.update(action.kind);
  hash.update('|');

  // Sort keys for determinism, exclude 'kind' since already added
  const entries = Object.entries(action)
    .filter(([k]) => k !== 'kind')
    .sort(([a], [b]) => a.localeCompare(b));

  hash.update(JSON.stringify(entries));
  return hash.digest('hex').slice(0, 32);
}

// ---------------------------------------------------------------------------
// EffectResultCache
// ---------------------------------------------------------------------------

export class EffectResultCache {
  private readonly store = new Map<string, CachedResult>();

  /** Retrieve a cached result, or undefined if missing or expired. */
  get<T = unknown>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  /** Store a result with a TTL in milliseconds. */
  set(key: string, result: unknown, ttlMs: number): void {
    const now = Date.now();
    this.store.set(key, {
      value: result,
      cachedAt: now,
      expiresAt: now + ttlMs,
    });
  }

  /** Check whether a non-expired entry exists for the key. */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /** Remove a specific key from the cache. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Clear the entire cache. */
  clear(): void {
    this.store.clear();
  }

  /**
   * Check whether an identical effect action was already resolved
   * (i.e. its cache key exists and has not expired).
   */
  isDuplicate(action: EffectActionLike): boolean {
    const key = createCacheKey(action);
    return this.has(key);
  }
}
