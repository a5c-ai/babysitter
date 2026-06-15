/**
 * Merge synthesis strategy.
 *
 * Deep-merges all input values into a single output.
 * - Objects: keys are merged recursively; later inputs take priority on conflicts.
 * - Arrays: concatenated in input order, optionally deduplicated.
 * - Primitives: last input wins.
 */

import type {
  MergeSynthesisStrategy,
  SynthesisInput,
  SynthesisOutput,
} from "../types";

/**
 * Deep-merge two values.
 *
 * - If both are plain objects, merge keys recursively.
 * - If both are arrays, concatenate.
 * - Otherwise the right value wins.
 */
function deepMerge(left: unknown, right: unknown): unknown {
  if (Array.isArray(left) && Array.isArray(right)) {
    return [...left, ...right];
  }

  if (
    isPlainObject(left) &&
    isPlainObject(right)
  ) {
    const merged: Record<string, unknown> = { ...(left as Record<string, unknown>) };
    const rightObj = right as Record<string, unknown>;
    for (const key of Object.keys(rightObj)) {
      merged[key] =
        key in merged
          ? deepMerge(merged[key], rightObj[key])
          : rightObj[key];
    }
    return merged;
  }

  // Primitives / incompatible types: right wins.
  return right;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Deduplicate an array by JSON-stringified identity.
 */
function deduplicateArray(arr: unknown[]): unknown[] {
  const seen = new Set<string>();
  const result: unknown[] = [];
  for (const item of arr) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Recursively deduplicate all arrays in a value.
 */
function deduplicateDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return deduplicateArray(value.map(deduplicateDeep));
  }
  if (isPlainObject(value)) {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = deduplicateDeep(obj[key]);
    }
    return result;
  }
  return value;
}

/**
 * Apply the merge synthesis strategy to the given inputs.
 *
 * @param inputs   - The inputs to merge. Must contain at least one entry.
 * @param strategy - Merge strategy configuration.
 * @returns The merged synthesis output.
 */
export function applyMergeSynthesis<T>(
  inputs: readonly SynthesisInput<T>[],
  strategy: MergeSynthesisStrategy,
): SynthesisOutput<T> {
  if (inputs.length === 0) {
    throw new Error("MergeSynthesis requires at least one input");
  }

  // Deep-merge all values left-to-right; later inputs take priority.
  let merged: unknown = inputs[0].value;
  for (let i = 1; i < inputs.length; i++) {
    merged = deepMerge(merged, inputs[i].value);
  }

  // Optionally deduplicate.
  if (strategy.deduplicate) {
    merged = deduplicateDeep(merged);
  }

  // Average confidence across all inputs.
  const totalConfidence = inputs.reduce(
    (sum, input) => sum + (input.confidence ?? 1),
    0,
  );
  const confidence = totalConfidence / inputs.length;

  return {
    value: merged as T,
    strategy: "merge",
    confidence,
    contributingSources: inputs.map((i) => i.sourceId),
  };
}
