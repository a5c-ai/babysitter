import type { MergedExecutionResult } from '@a5c-ai/hooks-mux-core';

/**
 * Oh-My-Pi native output fields that are supported per event type.
 *
 * Oh-My-Pi is an in-process adapter. Output is returned directly
 * to the Pi extension runtime, not written to stdout. Only emit
 * fields that are meaningful for the Pi extension API to process.
 *
 * Spec section 17.7: Oh-My-Pi does not support tool input mutation,
 * so toolMutation fields are never emitted.
 */

/** Output fields supported on session_start. */
const SESSION_START_FIELDS = new Set([
  'reason',
  'additionalContext',
]);

/** Output fields supported on session_end (observer-only). */
const SESSION_END_FIELDS = new Set([
  'reason',
]);

/** Output fields supported on prompt. */
const PROMPT_FIELDS = new Set([
  'reason',
  'additionalContext',
]);

/** Output fields supported on tool_call (no mutation). */
const TOOL_CALL_FIELDS = new Set([
  'reason',
]);

/** Output fields supported on tool_result. */
const TOOL_RESULT_FIELDS = new Set([
  'reason',
]);

/** Output fields supported on error. */
const ERROR_FIELDS = new Set([
  'reason',
]);

/** Output fields supported on context. */
const CONTEXT_FIELDS = new Set([
  'reason',
  'additionalContext',
]);

/** Output fields supported on before_provider_request. */
const BEFORE_PROVIDER_REQUEST_FIELDS = new Set([
  'reason',
  'additionalContext',
  'systemMessage',
]);

/** Map native event names to their supported output field sets. */
const SUPPORTED_FIELDS_BY_EVENT: Record<string, Set<string>> = {
  session_start: SESSION_START_FIELDS,
  session_end: SESSION_END_FIELDS,
  prompt: PROMPT_FIELDS,
  tool_call: TOOL_CALL_FIELDS,
  tool_result: TOOL_RESULT_FIELDS,
  error: ERROR_FIELDS,
  context: CONTEXT_FIELDS,
  before_provider_request: BEFORE_PROVIDER_REQUEST_FIELDS,
};

/**
 * Render a merged execution result into Oh-My-Pi native output.
 *
 * Only includes fields that are meaningful for the given native event
 * type. Unsupported fields are silently dropped. Tool input mutation
 * is never emitted (explicit Oh-My-Pi limitation).
 *
 * @param mergedResult - The merged result from multi-hook fan-out
 * @param nativeEventName - The original Oh-My-Pi event name
 * @returns Oh-My-Pi native output object, and list of dropped fields
 */
export function renderOhMyPiOutput(
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
    { key: 'additionalContext', value: mergedResult.additionalContext, isEmpty: !mergedResult.additionalContext },
    { key: 'systemMessage', value: mergedResult.systemMessage, isEmpty: !mergedResult.systemMessage },
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
