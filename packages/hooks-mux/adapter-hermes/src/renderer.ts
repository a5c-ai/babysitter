import type { MergedExecutionResult } from '@a5c-ai/hooks-mux-core';

/**
 * Hermes native output fields that are supported per event type.
 *
 * Hermes is a non-blocking, post-direction-only adapter with a single
 * `onEvent` hook. Output is minimal -- only the `reason` field is
 * meaningful. Hermes cannot block, deny, mutate, or suppress tool calls.
 *
 * All decision, mutation, and blocking fields are dropped since
 * Hermes has no mechanism to act on them.
 */

/** Output fields supported on the onEvent hook. */
const ON_EVENT_FIELDS = new Set([
  'reason',
]);

/** Map native event names to their supported output field sets. */
const SUPPORTED_FIELDS_BY_EVENT: Record<string, Set<string>> = {
  onEvent: ON_EVENT_FIELDS,
};

/**
 * Render a merged execution result into Hermes-native output JSON.
 *
 * Only includes the `reason` field for the onEvent hook. All other
 * fields are silently dropped since Hermes is non-blocking and cannot
 * act on decisions, mutations, or blocking directives.
 *
 * @param mergedResult - The merged result from multi-hook fan-out
 * @param nativeEventName - The original Hermes event name (always 'onEvent')
 * @returns Hermes-native output object, and list of dropped fields
 */
export function renderHermesOutput(
  mergedResult: MergedExecutionResult,
  nativeEventName: string,
): { output: Record<string, unknown>; droppedFields: string[] } {
  const supportedFields = SUPPORTED_FIELDS_BY_EVENT[nativeEventName] ?? new Set<string>();
  const output: Record<string, unknown> = {};
  const droppedFields: string[] = [];

  // Candidate output fields from the merged result
  const candidates: Array<{ key: string; value: unknown; isEmpty: boolean }> = [
    { key: 'decision', value: mergedResult.decision, isEmpty: mergedResult.decision === 'noop' },
    { key: 'reason', value: mergedResult.reason, isEmpty: !mergedResult.reason },
    { key: 'systemMessage', value: mergedResult.systemMessage, isEmpty: !mergedResult.systemMessage },
    { key: 'continueSession', value: mergedResult.continueSession, isEmpty: mergedResult.continueSession === true },
    { key: 'stopReason', value: mergedResult.stopReason, isEmpty: !mergedResult.stopReason },
    { key: 'suppressOutput', value: mergedResult.suppressOutput, isEmpty: !mergedResult.suppressOutput },
  ];

  for (const candidate of candidates) {
    if (candidate.isEmpty) continue;

    if (supportedFields.has(candidate.key)) {
      output[candidate.key] = candidate.value;
    } else {
      droppedFields.push(candidate.key);
    }
  }

  return { output, droppedFields };
}

/**
 * Check whether a given output field is supported for a native event.
 */
export function isFieldSupportedForEvent(field: string, nativeEventName: string): boolean {
  const supported = SUPPORTED_FIELDS_BY_EVENT[nativeEventName];
  return supported ? supported.has(field) : false;
}
