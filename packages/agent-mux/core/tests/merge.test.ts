import { describe, it, expect } from 'vitest';
import { deepMerge, stripUndefined, resolveRunOptions } from '../src/index.js';

describe('stripUndefined', () => {
  it('removes undefined keys', () => {
    const result = stripUndefined({ a: 1, b: undefined, c: 'hello' });
    expect(result).toEqual({ a: 1, c: 'hello' });
    expect('b' in result).toBe(false);
  });

  it('preserves null values', () => {
    const result = stripUndefined({ a: null, b: 1 });
    expect(result).toEqual({ a: null, b: 1 });
  });

  it('returns empty object for null input', () => {
    expect(stripUndefined(null)).toEqual({});
  });

  it('returns empty object for undefined input', () => {
    expect(stripUndefined(undefined)).toEqual({});
  });

  it('returns copy when no undefined keys', () => {
    const orig = { a: 1, b: 2 };
    const result = stripUndefined(orig);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(orig);
  });
});

describe('deepMerge', () => {
  it('scalars: override replaces base', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result.a).toBe(2);
  });

  it('arrays: override replaces base', () => {
    const result = deepMerge({ tags: ['a', 'b'] }, { tags: ['c'] });
    expect(result.tags).toEqual(['c']);
  });

  it('objects: shallow-merge one level deep', () => {
    const result = deepMerge(
      { env: { A: '1', B: '2' } },
      { env: { B: '3', C: '4' } },
    );
    expect(result.env).toEqual({ A: '1', B: '3', C: '4' });
  });

  it('undefined values in override are skipped', () => {
    const result = deepMerge({ a: 1, b: 2 }, { a: undefined, b: 3 });
    expect(result.a).toBe(1);
    expect(result.b).toBe(3);
  });

  it('null in override replaces base', () => {
    const result = deepMerge({ a: 1 }, { a: null });
    expect(result.a).toBeNull();
  });

  it('new keys in override are added', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('returns copy of base when override is null', () => {
    const base = { a: 1 };
    const result = deepMerge(base, null);
    expect(result).toEqual({ a: 1 });
    expect(result).not.toBe(base);
  });

  it('returns copy of base when override is undefined', () => {
    const base = { a: 1 };
    const result = deepMerge(base, undefined);
    expect(result).toEqual({ a: 1 });
    expect(result).not.toBe(base);
  });

  it('does not mutate base or override', () => {
    const base = { a: 1, env: { X: '1' } };
    const override = { b: 2, env: { Y: '2' } };
    deepMerge(base, override);
    expect(base).toEqual({ a: 1, env: { X: '1' } });
    expect(override).toEqual({ b: 2, env: { Y: '2' } });
  });

  it('nested object: undefined sub-keys in override are skipped', () => {
    const result = deepMerge(
      { env: { A: '1', B: '2' } },
      { env: { A: undefined, B: '3' } },
    );
    expect(result.env).toEqual({ A: '1', B: '3' });
  });
});

describe('resolveRunOptions', () => {
  it('merges multiple layers left to right', () => {
    const result = resolveRunOptions(
      { agent: 'claude', timeout: 1000 },
      { timeout: 2000, model: 'sonnet' },
      { model: 'opus' },
    );
    expect(result).toEqual({ agent: 'claude', timeout: 2000, model: 'opus' });
  });

  it('skips null/undefined layers', () => {
    const result = resolveRunOptions(
      { a: 1 },
      null,
      undefined,
      { b: 2 },
    );
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('returns empty object for no layers', () => {
    const result = resolveRunOptions();
    expect(result).toEqual({});
  });
});
