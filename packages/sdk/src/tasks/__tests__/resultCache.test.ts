import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EffectResultCache, createCacheKey } from '../resultCache';

// ---------------------------------------------------------------------------
// createCacheKey
// ---------------------------------------------------------------------------

describe('createCacheKey', () => {
  it('produces a deterministic hex string', () => {
    const key = createCacheKey({ kind: 'shell', cmd: 'echo hi' });
    expect(typeof key).toBe('string');
    expect(key).toHaveLength(32);
  });

  it('produces the same key for same inputs regardless of property order', () => {
    const a = createCacheKey({ kind: 'shell', cmd: 'echo', args: ['1'] });
    const b = createCacheKey({ args: ['1'], kind: 'shell', cmd: 'echo' });
    expect(a).toBe(b);
  });

  it('produces different keys for different kinds', () => {
    const a = createCacheKey({ kind: 'shell', cmd: 'echo' });
    const b = createCacheKey({ kind: 'node', cmd: 'echo' });
    expect(a).not.toBe(b);
  });

  it('produces different keys for different params', () => {
    const a = createCacheKey({ kind: 'shell', cmd: 'echo 1' });
    const b = createCacheKey({ kind: 'shell', cmd: 'echo 2' });
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// EffectResultCache
// ---------------------------------------------------------------------------

describe('EffectResultCache', () => {
  let cache: EffectResultCache;

  beforeEach(() => {
    cache = new EffectResultCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns undefined for unknown keys', () => {
    expect(cache.get('nope')).toBeUndefined();
  });

  it('stores and retrieves a value', () => {
    cache.set('key1', { data: 42 }, 60_000);
    expect(cache.get('key1')).toEqual({ data: 42 });
  });

  it('has() returns true for live entries', () => {
    cache.set('key2', 'val', 60_000);
    expect(cache.has('key2')).toBe(true);
  });

  it('has() returns false for unknown keys', () => {
    expect(cache.has('missing')).toBe(false);
  });

  it('expires entries after TTL', () => {
    cache.set('expiring', 'val', 1000);
    expect(cache.has('expiring')).toBe(true);

    vi.advanceTimersByTime(1001);
    expect(cache.has('expiring')).toBe(false);
    expect(cache.get('expiring')).toBeUndefined();
  });

  it('invalidate() removes a specific key', () => {
    cache.set('removable', 'val', 60_000);
    cache.invalidate('removable');
    expect(cache.has('removable')).toBe(false);
  });

  it('clear() removes all entries', () => {
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.clear();
    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(false);
  });

  it('isDuplicate() returns true for cached actions', () => {
    const action = { kind: 'shell', cmd: 'ls' };
    const key = createCacheKey(action);
    cache.set(key, { ok: true }, 60_000);
    expect(cache.isDuplicate(action)).toBe(true);
  });

  it('isDuplicate() returns false for uncached actions', () => {
    expect(cache.isDuplicate({ kind: 'shell', cmd: 'pwd' })).toBe(false);
  });

  it('isDuplicate() returns false after expiry', () => {
    const action = { kind: 'shell', cmd: 'ls' };
    const key = createCacheKey(action);
    cache.set(key, { ok: true }, 500);

    vi.advanceTimersByTime(501);
    expect(cache.isDuplicate(action)).toBe(false);
  });
});
