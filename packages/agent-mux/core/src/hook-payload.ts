/**
 * Generic payload parser/formatter used by `amux hooks handle <agent> <hookType>`.
 *
 * Each harness emits a hook payload as JSON on stdin. The default
 * implementation accepts any JSON object and normalizes a few commonly
 * used fields (tool_name, tool_input, tool_output, prompt, message,
 * session_id) into `payload.data`, preserving the full original payload
 * under `payload.raw` for adapter-specific round-tripping.
 */

import type { AgentName } from './types.js';
import type { UnifiedHookPayload, UnifiedHookResult } from './hooks.js';

const NORMALIZED_FIELDS = [
  'tool_name',
  'tool_input',
  'tool_output',
  'prompt',
  'message',
  'response',
  'cwd',
  'transcript_path',
];

export function parseHookPayload(
  agent: AgentName | string,
  hookType: string,
  raw: unknown,
): UnifiedHookPayload {
  const obj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  const data: Record<string, unknown> = {};
  for (const k of NORMALIZED_FIELDS) {
    if (k in obj) data[k] = obj[k];
  }
  const sessionId =
    typeof obj['session_id'] === 'string' ? (obj['session_id'] as string)
    : typeof obj['sessionId'] === 'string' ? (obj['sessionId'] as string)
    : undefined;
  return {
    agent: agent as AgentName,
    hookType,
    sessionId,
    timestamp: new Date().toISOString(),
    data,
    raw: obj,
  };
}

/**
 * Format a unified hook result back into the shape most harnesses expect:
 * a JSON object written to stdout, plus an exit code.
 *
 * Convention:
 *   { decision, message?, modifiedInput? }
 * harnesses that treat exit 2 as "block" will honor the deny path.
 */
export function formatHookResult(
  _agent: AgentName | string,
  _hookType: string,
  result: UnifiedHookResult,
): { stdout: string; exitCode: number } {
  const body: Record<string, unknown> = {};
  if (result.decision) body['decision'] = result.decision;
  if (result.message) body['message'] = result.message;
  if (result.modifiedInput) body['modifiedInput'] = result.modifiedInput;
  const extra = result.stdout ? result.stdout : '';
  const exit = result.decision === 'deny' ? 2 : (result.exitCode ?? 0);
  return {
    stdout: (Object.keys(body).length > 0 ? JSON.stringify(body) + '\n' : '') + extra,
    exitCode: exit,
  };
}
