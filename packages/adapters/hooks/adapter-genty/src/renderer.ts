import type { MergedExecutionResult } from '@a5c-ai/hooks-adapter-core';

/**
 * Genty native output rendering.
 *
 * Genty has no native hook system, so the renderer is minimal.
 * Only the `reason` field is meaningful for emulated lifecycle hooks.
 * All decision, mutation, and blocking fields are dropped since
 * genty has no mechanism to act on them.
 */

/** Output fields supported on emulated hooks. */
const EMULATED_FIELDS = new Set([
  'reason',
]);

/** Map native event names to their supported output field sets. */
const SUPPORTED_FIELDS_BY_EVENT: Record<string, Set<string>> = {
  SessionStart: EMULATED_FIELDS,
  Stop: EMULATED_FIELDS,
};

/**
 * Render a merged execution result into genty-native output JSON.
 *
 * Only includes the `reason` field for emulated hooks. All other
 * fields are silently dropped since genty has no native hook system.
 *
 * @param mergedResult - The merged result from multi-hook fan-out
 * @param nativeEventName - The original genty event name
 * @returns Genty-native output object, and list of dropped fields
 */
export function renderGentyOutput(
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
