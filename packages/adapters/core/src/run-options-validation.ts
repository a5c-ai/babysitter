/**
 * Internal validation primitives shared between `validateRunOptions` and
 * `validateProfileData`. The constants and the profile-specific validator
 * are kept here so `run-options.ts` remains focused on the public
 * interface plus the primary `validateRunOptions` entry point.
 *
 * Pure structural extraction — no behavior change.
 */

import type { ErrorCode, ValidationFieldError } from './types.js';
import { ValidationError } from './errors.js';

/** Valid ErrorCode values for retryOn validation. */
export const VALID_ERROR_CODES = new Set<ErrorCode>([
  'CAPABILITY_ERROR', 'VALIDATION_ERROR', 'AUTH_ERROR',
  'AGENT_NOT_FOUND', 'AGENT_NOT_INSTALLED', 'AGENT_CRASH',
  'SPAWN_ERROR', 'TIMEOUT', 'INACTIVITY_TIMEOUT',
  'PARSE_ERROR', 'CONFIG_ERROR', 'CONFIG_LOCK_ERROR',
  'SESSION_NOT_FOUND', 'PROFILE_NOT_FOUND', 'PLUGIN_ERROR',
  'RATE_LIMITED', 'CONTEXT_EXCEEDED', 'ABORTED',
  'RUN_NOT_ACTIVE', 'STDIN_NOT_AVAILABLE', 'NO_PENDING_INTERACTION',
  'INTERACTION_NOT_FOUND', 'INVALID_STATE_TRANSITION', 'PTY_NOT_AVAILABLE', 'UNKNOWN_AGENT', 'INTERNAL',
]);

/** Profile name pattern: 1-64 alphanumeric, underscore, or hyphen characters. */
export const PROFILE_NAME_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** MCP server name pattern. */
export const MCP_NAME_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** ULID pattern: 26 Crockford base32 characters. */
export const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// ---------------------------------------------------------------------------
// Profile field restrictions (§10)
// ---------------------------------------------------------------------------

export const PROHIBITED_PROFILE_FIELDS: ReadonlySet<string> = new Set([
  'prompt',
  'onInputRequired',
  'onApprovalRequest',
  'env',
  'cwd',
  'sessionId',
  'forkSessionId',
  'noSession',
  'attachments',
  'runId',
  'projectId',
  'profile',
  'agentsDoc',
]);

/**
 * Validate profile data, ensuring no prohibited fields are present
 * and all included fields pass RunOptions-level validation.
 */
export function validateProfileData(data: Record<string, unknown>): void {
  const errors: ValidationFieldError[] = [];

  for (const key of Object.keys(data)) {
    if (PROHIBITED_PROFILE_FIELDS.has(key)) {
      errors.push({
        field: key,
        message: 'is not allowed in profile data',
        received: data[key],
        expected: 'field not present',
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  const allowedErrors: ValidationFieldError[] = [];

  if (data['temperature'] !== undefined) {
    const v = data['temperature'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 2) {
      allowedErrors.push({ field: 'temperature', message: 'must be a number in [0, 2]', received: v, expected: '[0, 2]' });
    }
  }
  if (data['topP'] !== undefined) {
    const v = data['topP'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) {
      allowedErrors.push({ field: 'topP', message: 'must be a number in [0, 1]', received: v, expected: '[0, 1]' });
    }
  }
  if (data['topK'] !== undefined) {
    const v = data['topK'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'topK', message: 'must be an integer >= 1', received: v, expected: '>= 1 (integer)' });
    }
  }
  if (data['maxTokens'] !== undefined) {
    const v = data['maxTokens'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'maxTokens', message: 'must be an integer >= 1', received: v, expected: '>= 1 (integer)' });
    }
  }
  if (data['maxOutputTokens'] !== undefined) {
    const v = data['maxOutputTokens'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'maxOutputTokens', message: 'must be an integer >= 1', received: v, expected: '>= 1 (integer)' });
    }
  }
  if (data['thinkingBudgetTokens'] !== undefined) {
    const v = data['thinkingBudgetTokens'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1024 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'thinkingBudgetTokens', message: 'must be an integer >= 1024', received: v, expected: '>= 1024 (integer)' });
    }
  }
  if (data['timeout'] !== undefined) {
    const v = data['timeout'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'timeout', message: 'must be a non-negative integer', received: v, expected: '>= 0 (integer, ms)' });
    }
  }
  if (data['inactivityTimeout'] !== undefined) {
    const v = data['inactivityTimeout'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'inactivityTimeout', message: 'must be a non-negative integer', received: v, expected: '>= 0 (integer, ms)' });
    }
  }
  if (data['maxTurns'] !== undefined) {
    const v = data['maxTurns'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'maxTurns', message: 'must be an integer >= 1', received: v, expected: '>= 1 (integer)' });
    }
  }
  if (data['approvalMode'] !== undefined) {
    const valid = ['yolo', 'prompt', 'deny'];
    if (!valid.includes(data['approvalMode'] as string)) {
      allowedErrors.push({ field: 'approvalMode', message: 'must be one of: yolo, prompt, deny', received: data['approvalMode'], expected: "'yolo' | 'prompt' | 'deny'" });
    }
  }
  if (data['thinkingEffort'] !== undefined) {
    const valid = ['low', 'medium', 'high', 'max'];
    if (!valid.includes(data['thinkingEffort'] as string)) {
      allowedErrors.push({ field: 'thinkingEffort', message: 'must be one of: low, medium, high, max', received: data['thinkingEffort'], expected: "'low' | 'medium' | 'high' | 'max'" });
    }
  }
  if (data['stream'] !== undefined) {
    const v = data['stream'];
    if (v !== true && v !== false && v !== 'auto') {
      allowedErrors.push({ field: 'stream', message: "must be true, false, or 'auto'", received: v, expected: "boolean | 'auto'" });
    }
  }
  if (data['outputFormat'] !== undefined) {
    const valid = ['text', 'json', 'jsonl'];
    if (!valid.includes(data['outputFormat'] as string)) {
      allowedErrors.push({ field: 'outputFormat', message: 'must be one of: text, json, jsonl', received: data['outputFormat'], expected: "'text' | 'json' | 'jsonl'" });
    }
  }
  if (data['systemPromptMode'] !== undefined) {
    const valid = ['prepend', 'append', 'replace'];
    if (!valid.includes(data['systemPromptMode'] as string)) {
      allowedErrors.push({ field: 'systemPromptMode', message: 'must be one of: prepend, append, replace', received: data['systemPromptMode'], expected: "'prepend' | 'append' | 'replace'" });
    }
  }
  if (data['gracePeriodMs'] !== undefined) {
    const v = data['gracePeriodMs'];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
      allowedErrors.push({ field: 'gracePeriodMs', message: 'must be a non-negative integer', received: v, expected: '>= 0 (integer, ms)' });
    }
  }

  if (data['retryPolicy'] !== undefined) {
    const rp = data['retryPolicy'] as Record<string, unknown>;
    if (typeof rp !== 'object' || rp === null || Array.isArray(rp)) {
      allowedErrors.push({ field: 'retryPolicy', message: 'must be an object', received: rp, expected: 'RetryPolicy' });
    } else {
      if (rp['maxAttempts'] !== undefined && (typeof rp['maxAttempts'] !== 'number' || !Number.isFinite(rp['maxAttempts'] as number) || (rp['maxAttempts'] as number) < 1 || !Number.isInteger(rp['maxAttempts']))) {
        allowedErrors.push({ field: 'retryPolicy.maxAttempts', message: 'must be an integer >= 1', received: rp['maxAttempts'], expected: '>= 1 (integer)' });
      }
      if (rp['baseDelayMs'] !== undefined && (typeof rp['baseDelayMs'] !== 'number' || !Number.isFinite(rp['baseDelayMs'] as number) || (rp['baseDelayMs'] as number) < 0 || !Number.isInteger(rp['baseDelayMs']))) {
        allowedErrors.push({ field: 'retryPolicy.baseDelayMs', message: 'must be a non-negative integer', received: rp['baseDelayMs'], expected: '>= 0 (integer)' });
      }
      if (rp['maxDelayMs'] !== undefined && (typeof rp['maxDelayMs'] !== 'number' || !Number.isFinite(rp['maxDelayMs'] as number) || (rp['maxDelayMs'] as number) < 0 || !Number.isInteger(rp['maxDelayMs']))) {
        allowedErrors.push({ field: 'retryPolicy.maxDelayMs', message: 'must be a non-negative integer', received: rp['maxDelayMs'], expected: '>= 0 (integer)' });
      }
      if (rp['jitterFactor'] !== undefined && (typeof rp['jitterFactor'] !== 'number' || !Number.isFinite(rp['jitterFactor'] as number) || (rp['jitterFactor'] as number) < 0 || (rp['jitterFactor'] as number) > 1)) {
        allowedErrors.push({ field: 'retryPolicy.jitterFactor', message: 'must be between 0.0 and 1.0', received: rp['jitterFactor'], expected: '[0.0, 1.0]' });
      }
      if (rp['retryOn'] !== undefined) {
        if (!Array.isArray(rp['retryOn'])) {
          allowedErrors.push({ field: 'retryPolicy.retryOn', message: 'must be an array of ErrorCode strings', received: rp['retryOn'], expected: 'ErrorCode[]' });
        } else {
          for (const code of rp['retryOn'] as unknown[]) {
            if (!VALID_ERROR_CODES.has(code as ErrorCode)) {
              allowedErrors.push({ field: 'retryPolicy.retryOn', message: `invalid error code: ${String(code)}`, received: code, expected: 'ErrorCode' });
            }
          }
        }
      }
      {
        const effectiveBase = (typeof rp['baseDelayMs'] === 'number' && Number.isFinite(rp['baseDelayMs'])) ? rp['baseDelayMs'] as number : 1000;
        const effectiveMax = (typeof rp['maxDelayMs'] === 'number' && Number.isFinite(rp['maxDelayMs'])) ? rp['maxDelayMs'] as number : 30_000;
        if (effectiveMax < effectiveBase) {
          allowedErrors.push({ field: 'retryPolicy.maxDelayMs', message: 'must be >= baseDelayMs', received: rp['maxDelayMs'] ?? effectiveMax, expected: `>= ${effectiveBase}` });
        }
      }
    }
  }

  if (data['mcpServers'] !== undefined) {
    if (!Array.isArray(data['mcpServers'])) {
      allowedErrors.push({ field: 'mcpServers', message: 'must be an array', received: data['mcpServers'], expected: 'McpServerConfig[]' });
    } else {
      for (let i = 0; i < (data['mcpServers'] as unknown[]).length; i++) {
        const srv = (data['mcpServers'] as Record<string, unknown>[])[i]!;
        const prefix = `mcpServers[${i}]`;
        if (!MCP_NAME_RE.test(srv['name'] as string ?? '')) {
          allowedErrors.push({ field: `${prefix}.name`, message: 'must match ^[a-zA-Z0-9_-]{1,64}$', received: srv['name'], expected: '^[a-zA-Z0-9_-]{1,64}$' });
        }
        const validTransports = ['stdio', 'sse', 'streamable-http'];
        if (!validTransports.includes(srv['transport'] as string)) {
          allowedErrors.push({ field: `${prefix}.transport`, message: 'must be one of: stdio, sse, streamable-http', received: srv['transport'], expected: "'stdio' | 'sse' | 'streamable-http'" });
        }
        if (srv['transport'] === 'stdio' && !srv['command']) {
          allowedErrors.push({ field: `${prefix}.command`, message: 'is required for stdio transport', received: srv['command'], expected: 'string' });
        }
        if ((srv['transport'] === 'sse' || srv['transport'] === 'streamable-http') && !srv['url']) {
          allowedErrors.push({ field: `${prefix}.url`, message: `is required for ${srv['transport'] as string} transport`, received: srv['url'], expected: 'string (URL)' });
        }
        if (srv['env'] !== undefined) {
          if (typeof srv['env'] !== 'object' || srv['env'] === null || Array.isArray(srv['env'])) {
            allowedErrors.push({ field: `${prefix}.env`, message: 'must be an object', received: srv['env'], expected: 'Record<string, string>' });
          } else {
            for (const [key, val] of Object.entries(srv['env'] as Record<string, unknown>)) {
              if (typeof val !== 'string') {
                allowedErrors.push({ field: `${prefix}.env.${key}`, message: 'values must be strings', received: val, expected: 'string' });
              }
            }
          }
        }
      }
    }
  }

  if (allowedErrors.length > 0) {
    throw new ValidationError(allowedErrors);
  }
}
