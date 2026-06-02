import type { MergedExecutionResult } from '@a5c-ai/agent-mux-hooks-core';

/**
 * Cursor native output fields that are documented/supported per event type.
 *
 * Cursor output semantics are limited and not fully documented.
 * Only emit fields that are known to be processed by the Cursor runtime.
 * Unknown/unsupported fields are silently dropped (fail-open, conservative).
 *
 * Spec section 17.5: "render output conservatively, only emitting fields
 * known to be processed."
 */

/** Output fields supported on stop. */
const STOP_FIELDS = new Set([
  'continueSession',
  'stopReason',
  'reason',
]);

/** Output fields supported on sessionStart (mostly ignored). */
const SESSION_START_FIELDS = new Set([
  'reason',
]);

/** Output fields supported on preToolUse (when available). */
const PRE_TOOL_USE_FIELDS = new Set([
  'decision',
  'reason',
]);

/** Output fields supported on postToolUse (when available). */
const POST_TOOL_USE_FIELDS = new Set([
  'reason',
]);

/** Map native event names to their supported output field sets. */
const SUPPORTED_FIELDS_BY_EVENT: Record<string, Set<string>> = {
  sessionStart: SESSION_START_FIELDS,
  stop: STOP_FIELDS,
  preToolUse: PRE_TOOL_USE_FIELDS,
  postToolUse: POST_TOOL_USE_FIELDS,
};

/**
 * Render a merged execution result into Cursor-native output JSON.
 *
 * Only includes fields that are known to be processed for the given
 * native event type. Unsupported fields are silently dropped.
 *
 * @param mergedResult - The merged result from multi-hook fan-out
 * @param nativeEventName - The original Cursor event name
 * @returns Cursor-native output object, and list of dropped fields
 */
export function renderCursorOutput(
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
    { key: 'continueSession', value: mergedResult.continueSession, isEmpty: mergedResult.continueSession === true },
    { key: 'stopReason', value: mergedResult.stopReason, isEmpty: !mergedResult.stopReason },
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
