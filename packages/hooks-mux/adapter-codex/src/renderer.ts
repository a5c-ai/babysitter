import type { MergedExecutionResult } from '@a5c-ai/hooks-mux-core';

/**
 * Codex native output fields that are documented/supported per event type.
 *
 * Codex output semantics are limited -- many fields fail open
 * (spec section 17.2). Only emit fields that are documented.
 */

/** Output fields supported on UserPromptSubmit. */
const USER_PROMPT_SUBMIT_FIELDS = new Set([
  'decision',
  'reason',
  'systemMessage',
]);

/** Output fields supported on Stop. */
const STOP_FIELDS = new Set([
  'continueSession',
  'stopReason',
  'reason',
]);

/** Output fields supported on PreToolUse. */
const TOOL_BEFORE_FIELDS = new Set([
  'decision',
  'reason',
]);

/** Output fields supported on PostToolUse. */
const TOOL_AFTER_FIELDS = new Set([
  'suppressOutput',
  'reason',
]);

/** Output fields supported on SessionStart (mostly ignored). */
const SESSION_START_FIELDS = new Set([
  'reason',
]);

/** Output fields supported on SessionEnd (mostly ignored). */
const SESSION_END_FIELDS = new Set([
  'reason',
]);

/** Map native event names to their supported output field sets. */
const SUPPORTED_FIELDS_BY_EVENT: Record<string, Set<string>> = {
  SessionStart: SESSION_START_FIELDS,
  SessionEnd: SESSION_END_FIELDS,
  UserPromptSubmit: USER_PROMPT_SUBMIT_FIELDS,
  Stop: STOP_FIELDS,
  PreToolUse: TOOL_BEFORE_FIELDS,
  PostToolUse: TOOL_AFTER_FIELDS,
};

/**
 * Render a merged execution result into Codex-native output JSON.
 *
 * Only includes fields that are documented for the given native event type.
 * Unsupported fields are silently dropped (fail-open behavior per spec).
 *
 * @param mergedResult - The merged result from multi-hook fan-out
 * @param nativeEventName - The original Codex event name
 * @returns Codex-native output object, and list of dropped fields
 */
export function renderCodexOutput(
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
