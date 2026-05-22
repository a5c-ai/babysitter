import type { UnifiedHookResult } from '../types/result';
import type { UnifiedHookEvent } from '../types/event';
import { HookOutputParseError } from './errors';

// ---------------------------------------------------------------------------
// Required-field definitions
// ---------------------------------------------------------------------------

const REQUIRED_EVENT_FIELDS: readonly (keyof UnifiedHookEvent)[] = [
  'version',
  'adapter',
  'phase',
  'rawEventName',
  'supportLevel',
  'execution',
  'payload',
  'env',
];

// UnifiedHookResult has no strictly required fields — all are optional.

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse the JSON output from a5c-hooks-mux invoke stdout.
 * Used by SDK harness adapters to consume hooks-mux results.
 *
 * @throws {HookOutputParseError} on malformed JSON or missing required fields.
 */
export function parseHookResult(stdout: string): UnifiedHookResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new HookOutputParseError(
      'Failed to parse hook result: invalid JSON',
      stdout,
      'INVALID_JSON',
    );
  }

  if (!validateHookResult(parsed)) {
    throw new HookOutputParseError(
      'Parsed value is not a valid UnifiedHookResult object',
      stdout,
      'INVALID_RESULT',
    );
  }

  return parsed;
}

/**
 * Parse a hooks-mux normalized event (e.g., from a file or pipe).
 *
 * @throws {HookOutputParseError} on malformed JSON or missing required fields.
 */
export function parseHookEvent(json: string): UnifiedHookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new HookOutputParseError(
      'Failed to parse hook event: invalid JSON',
      json,
      'INVALID_JSON',
    );
  }

  if (!validateHookEvent(parsed)) {
    throw new HookOutputParseError(
      'Parsed value is not a valid UnifiedHookEvent object',
      json,
      'INVALID_EVENT',
    );
  }

  return parsed;
}

/**
 * Validate a parsed result against the UnifiedHookResult schema.
 * Extra fields are silently ignored.
 */
export function validateHookResult(result: unknown): result is UnifiedHookResult {
  if (!isRecord(result)) return false;

  // decision must be one of the known values if present
  if (result.decision !== undefined) {
    const validDecisions = ['allow', 'deny', 'ask', 'continue', 'noop'];
    if (typeof result.decision !== 'string' || !validDecisions.includes(result.decision)) {
      return false;
    }
  }

  // Optional string fields
  for (const field of ['reason', 'systemMessage', 'additionalContext', 'followUpMessage', 'stopReason'] as const) {
    if (result[field] !== undefined && typeof result[field] !== 'string') return false;
  }

  // Optional boolean fields
  for (const field of ['continueSession', 'suppressOutput'] as const) {
    if (result[field] !== undefined && typeof result[field] !== 'boolean') return false;
  }

  // toolMutation
  if (result.toolMutation !== undefined) {
    if (!isRecord(result.toolMutation)) return false;
    const tm = result.toolMutation;
    if (tm.mode !== 'replace' && tm.mode !== 'patch') return false;
  }

  // Record<string, string> fields
  for (const field of ['persistEnv', 'contextVars'] as const) {
    if (result[field] !== undefined) {
      if (!isRecord(result[field])) return false;
    }
  }

  // unsetEnv
  if (result.unsetEnv !== undefined) {
    if (!Array.isArray(result.unsetEnv)) return false;
  }

  // metadata
  if (result.metadata !== undefined) {
    if (!isRecord(result.metadata)) return false;
  }

  return true;
}

/**
 * Validate a parsed value against the UnifiedHookEvent schema.
 * Extra fields are silently ignored.
 */
export function validateHookEvent(event: unknown): event is UnifiedHookEvent {
  if (!isRecord(event)) return false;

  // Check all required fields exist
  for (const field of REQUIRED_EVENT_FIELDS) {
    if (event[field] === undefined) return false;
  }

  // version must match
  if (event.version !== 'a5c.hooks.v1') return false;

  // String fields
  for (const field of ['adapter', 'phase', 'rawEventName'] as const) {
    if (typeof event[field] !== 'string') return false;
  }

  // supportLevel
  const validLevels = ['native', 'emulated', 'lossy', 'unsupported'];
  if (typeof event.supportLevel !== 'string' || !validLevels.includes(event.supportLevel)) {
    return false;
  }

  // execution must be an object
  if (!isRecord(event.execution)) return false;

  // payload must be an object
  if (!isRecord(event.payload)) return false;

  // env must be an object with input and persisted
  if (!isRecord(event.env)) return false;

  return true;
}
