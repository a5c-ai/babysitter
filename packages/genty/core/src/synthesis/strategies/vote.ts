/**
 * Vote synthesis strategy.
 *
 * Compares all inputs by equality (JSON.stringify) and returns the value
 * that appears most frequently (majority vote). On a tie the candidate
 * with the highest cumulative weight (confidence) wins.
 */

import type {
  VoteSynthesisStrategy,
  SynthesisInput,
  SynthesisOutput,
} from "../types";

interface VoteBucket<T> {
  value: T;
  count: number;
  totalWeight: number;
  sourceIds: string[];
}

/**
 * Apply the vote synthesis strategy to the given inputs.
 *
 * @param inputs   - The inputs to vote on. Must contain at least one entry.
 * @param strategy - Vote strategy configuration.
 * @returns The voted synthesis output.
 */
export function applyVoteSynthesis<T>(
  inputs: readonly SynthesisInput<T>[],
  strategy: VoteSynthesisStrategy,
): SynthesisOutput<T> {
  if (inputs.length === 0) {
    throw new Error("VoteSynthesis requires at least one input");
  }

  // Group inputs by serialized value.
  const bucketMap = new Map<string, VoteBucket<T>>();

  for (const input of inputs) {
    const key = JSON.stringify(input.value);
    const existing = bucketMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalWeight += input.confidence ?? 1;
      existing.sourceIds.push(input.sourceId);
    } else {
      bucketMap.set(key, {
        value: input.value,
        count: 1,
        totalWeight: input.confidence ?? 1,
        sourceIds: [input.sourceId],
      });
    }
  }

  // Sort: primary by count descending, secondary by totalWeight descending.
  const buckets = [...bucketMap.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.totalWeight - a.totalWeight;
  });

  const winner = buckets[0];
  const agreementRatio = winner.count / inputs.length;

  // Confidence reflects agreement ratio. If a threshold is set and not met
  // the result is still returned but with the raw agreement ratio, which
  // downstream consumers can treat as low-confidence.
  const confidence = agreementRatio;

  return {
    value: winner.value,
    strategy: "vote",
    confidence,
    contributingSources: winner.sourceIds,
  };
}
