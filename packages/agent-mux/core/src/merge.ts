/**
 * Deep merge utilities for @a5c-ai/agent-mux.
 *
 * Used to layer RunOptions from multiple sources (global defaults,
 * profile, client defaults, explicit options) into a single resolved
 * configuration.
 */

// ---------------------------------------------------------------------------
// stripUndefined
// ---------------------------------------------------------------------------

/**
 * Return a shallow copy of `obj` with all keys whose value is `undefined` removed.
 * Returns `{}` for null/undefined input.
 */
export function stripUndefined<T extends Record<string, unknown>>(
  obj: T | null | undefined,
): Partial<T> {
  if (obj == null) return {} as Partial<T>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}

// ---------------------------------------------------------------------------
// deepMerge
// ---------------------------------------------------------------------------

/**
 * Check if a value is a plain object (not an array, null, Date, RegExp, etc).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Deep merge two objects according to agent-mux merge semantics:
 *
 * - Scalars: override replaces base.
 * - Arrays: override replaces base (no concatenation).
 * - Plain objects: shallow-merge one level deep.
 * - `undefined` values in override are skipped (base value preserved).
 * - `null` in override replaces base (explicit clear).
 *
 * @param base - The base layer.
 * @param override - The override layer.
 * @returns A new merged object (neither input is mutated).
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T> | undefined | null,
): T {
  if (override == null) return { ...base };

  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(override)) {
    const overrideVal = (override as Record<string, unknown>)[key];

    // undefined in override means "not specified" — skip
    if (overrideVal === undefined) continue;

    const baseVal = result[key];

    // If both are plain objects, shallow-merge one level
    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      const merged: Record<string, unknown> = { ...baseVal };
      for (const subKey of Object.keys(overrideVal)) {
        if ((overrideVal as Record<string, unknown>)[subKey] !== undefined) {
          merged[subKey] = (overrideVal as Record<string, unknown>)[subKey];
        }
      }
      result[key] = merged;
    } else {
      // Scalars, arrays, null — override replaces
      result[key] = overrideVal;
    }
  }

  return result as T;
}

// ---------------------------------------------------------------------------
// resolveRunOptions
// ---------------------------------------------------------------------------

/**
 * Resolve run options by merging multiple layers in order.
 *
 * Layers are applied left to right; later layers override earlier ones.
 * Uses the same merge semantics as `deepMerge`, making it the canonical
 * helper for layering run-option-like objects and defaults.
 *
 * @param layers - Ordered list of option layers to merge.
 * @returns The merged result.
 */
export function resolveRunOptions<T extends Record<string, unknown>>(
  ...layers: Array<Partial<T> | undefined | null>
): T {
  let result: Record<string, unknown> = {};
  for (const layer of layers) {
    if (layer != null) {
      result = deepMerge(result as T, layer);
    }
  }
  return result as T;
}
