/**
 * Seeded PRNG for the deterministic mock simulation (SPEC §7).
 *
 * mulberry32: tiny, fast, good-enough 32-bit generator. The `Prng` wrapper
 * counts draws so simulation snapshots can assert two engines consumed the
 * exact same random stream (a stronger determinism check than state equality
 * alone). Framework-free; no Date.now(), no Math.random().
 */

/** A function returning a float in [0, 1). */
export type Rng = () => number;

/** Raw mulberry32 generator over a 32-bit seed. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stateful seeded PRNG with helpers and a draw counter. */
export class Prng {
  readonly seed: number;
  private readonly rng: Rng;
  private drawCount = 0;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.rng = mulberry32(this.seed);
  }

  /** Number of draws consumed so far (determinism diagnostic). */
  get draws(): number {
    return this.drawCount;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.drawCount += 1;
    return this.rng();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    if (max < min) {
      throw new Error(`Prng.int: max (${max}) < min (${min})`);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Bernoulli trial with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Pick one element of a non-empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Prng.pick: empty array');
    }
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Fisher-Yates shuffle (returns a new array; input untouched). */
  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      const a = out[i] as T;
      out[i] = out[j] as T;
      out[j] = a;
    }
    return out;
  }
}

/**
 * Deterministic 32-bit FNV-1a hash of a string — used to derive stable
 * sub-seeds (e.g. per-entity) from the master seed without consuming draws.
 */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Parse `?seed=` from a query string (e.g. `window.location.search`). Default 42. */
export function seedFromSearch(search: string, defaultSeed = 42): number {
  const params = new URLSearchParams(search);
  const raw = params.get('seed');
  if (raw === null) return defaultSeed;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed >>> 0 : defaultSeed;
}
