/**
 * Snapshot cache with:
 *  - Per-org storage (multiple orgs cached simultaneously)
 *  - stale-while-revalidate: return stale data immediately, refresh in background
 *  - Configurable TTL via KRATE_SNAPSHOT_CACHE_TTL_MS
 */

export const CACHE_TTL_MS = Number(process.env.KRATE_SNAPSHOT_CACHE_TTL_MS || 30_000);

/**
 * Per-org cache map.  Key = org string (or '' for no-org).
 * Value = { data, timestamp, revalidating: boolean }
 */
const orgCacheMap = new Map();

// Legacy single-org cache kept for backward compatibility with controller-client.js
let snapshotCache = { data: null, timestamp: 0, org: null };

export function getSnapshotCache() {
  return snapshotCache;
}

export function setSnapshotCache(data, org) {
  snapshotCache = { data, timestamp: Date.now(), org };
  // Also update per-org map
  const key = org ?? '';
  const entry = orgCacheMap.get(key) || {};
  orgCacheMap.set(key, { ...entry, data, timestamp: Date.now(), revalidating: false });
}

export function clearSnapshotCache() {
  snapshotCache = { data: null, timestamp: 0, org: null };
  orgCacheMap.clear();
}

// ---------------------------------------------------------------------------
// Per-org cache API
// ---------------------------------------------------------------------------

/**
 * Get the cached snapshot for a specific org.
 * Returns null when nothing is cached or when the TTL has expired.
 *
 * @param {string|null} org
 * @returns {{ data: object, timestamp: number, revalidating: boolean } | null}
 */
export function getOrgCache(org) {
  const key = org ?? '';
  const entry = orgCacheMap.get(key);
  if (!entry || !entry.data) return null;
  return entry;
}

/**
 * Store a snapshot for a specific org.
 *
 * @param {object} data
 * @param {string|null} org
 */
export function setOrgCache(data, org) {
  const key = org ?? '';
  orgCacheMap.set(key, { data, timestamp: Date.now(), revalidating: false });
  // Keep legacy cache in sync for the most recently written org
  snapshotCache = { data, timestamp: Date.now(), org };
}

/**
 * Clear the cache entry for a specific org only.
 *
 * @param {string|null} org
 */
export function clearOrgCache(org) {
  orgCacheMap.delete(org ?? '');
  if (snapshotCache.org === org) {
    snapshotCache = { data: null, timestamp: 0, org: null };
  }
}

/**
 * Return all orgs currently in the cache (for introspection / debugging).
 *
 * @returns {string[]}
 */
export function cachedOrgs() {
  return [...orgCacheMap.keys()];
}

// ---------------------------------------------------------------------------
// stale-while-revalidate helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the cache entry for the given org is fresh.
 *
 * @param {string|null} org
 * @param {number} [ttlMs] - defaults to CACHE_TTL_MS
 * @returns {boolean}
 */
export function isCacheFresh(org, ttlMs = CACHE_TTL_MS) {
  const entry = getOrgCache(org);
  if (!entry) return false;
  return (Date.now() - entry.timestamp) < ttlMs;
}

/**
 * stale-while-revalidate: return stale data immediately if available, then
 * trigger revalidateFn() in the background to refresh the cache entry.
 *
 * @param {string|null} org - Organization key for the cache
 * @param {Function} revalidateFn - Async function that returns fresh data
 * @param {object} [swrOptions]
 * @param {number} [swrOptions.ttlMs] - Fresh TTL in ms (default: CACHE_TTL_MS)
 * @param {number} [swrOptions.staleMs] - Max staleness before we block on revalidate (default: 5 × ttlMs)
 * @returns {Promise<object>} Either the stale cached value or the freshly fetched one
 */
export async function staleWhileRevalidate(org, revalidateFn, swrOptions = {}) {
  const ttlMs = swrOptions.ttlMs ?? CACHE_TTL_MS;
  const staleMs = swrOptions.staleMs ?? ttlMs * 5;
  const key = org ?? '';
  const entry = orgCacheMap.get(key);
  const now = Date.now();

  const isFresh = entry && entry.data && (now - entry.timestamp) < ttlMs;
  const isStale = entry && entry.data && (now - entry.timestamp) < staleMs;

  if (isFresh) {
    // Cache is fresh: return immediately
    return entry.data;
  }

  if (isStale && !entry.revalidating) {
    // Stale but still usable: return immediately and revalidate in background
    orgCacheMap.set(key, { ...entry, revalidating: true });
    Promise.resolve().then(async () => {
      try {
        const fresh = await revalidateFn();
        setOrgCache(fresh, org);
      } catch {
        // On background refresh error, clear the revalidating flag so a future
        // request can try again
        const current = orgCacheMap.get(key);
        if (current) orgCacheMap.set(key, { ...current, revalidating: false });
      }
    });
    return entry.data;
  }

  if (isStale && entry.revalidating) {
    // Another caller is already refreshing: return stale data now
    return entry.data;
  }

  // No usable cache: block on the revalidation
  const fresh = await revalidateFn();
  setOrgCache(fresh, org);
  return fresh;
}
