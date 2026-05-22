import type { UnifiedHookEvent } from '../types/event';
import type { UnifiedHookResult } from '../types/result';

/**
 * Serialize a UnifiedHookEvent to JSON for stdin.
 */
export function serializeEvent(event: UnifiedHookEvent): string {
  return JSON.stringify(event);
}

/**
 * Serialize a UnifiedHookResult to JSON for stdout.
 */
export function serializeResult(result: UnifiedHookResult): string {
  return JSON.stringify(result);
}
