/**
 * Exit code constants and ErrorCode-to-exit-code mapping.
 *
 * @see docs/10-cli-reference.md Section 4
 */

import type { ErrorCode } from '@a5c-ai/agent-mux-core';

/** CLI exit code constants. */
export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  USAGE_ERROR: 2,
  AGENT_NOT_FOUND: 3,
  AGENT_NOT_INSTALLED: 4,
  AUTH_ERROR: 5,
  CAPABILITY_ERROR: 6,
  CONFIG_ERROR: 7,
  SESSION_NOT_FOUND: 8,
  PROFILE_NOT_FOUND: 9,
  PLUGIN_ERROR: 10,
  TIMEOUT: 11,
  AGENT_CRASHED: 12,
  ABORTED: 13,
  RATE_LIMITED: 14,
  CONTEXT_EXCEEDED: 15,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Map an ErrorCode to an exit code.
 *
 * @see docs/10-cli-reference.md Section 4.1
 */
export function errorCodeToExitCode(code: ErrorCode): ExitCodeValue {
  switch (code) {
    case 'VALIDATION_ERROR':
      return ExitCode.USAGE_ERROR;
    case 'AGENT_NOT_FOUND':
    case 'UNKNOWN_AGENT':
      return ExitCode.AGENT_NOT_FOUND;
    case 'AGENT_NOT_INSTALLED':
      return ExitCode.AGENT_NOT_INSTALLED;
    case 'AUTH_ERROR':
      return ExitCode.AUTH_ERROR;
    case 'CAPABILITY_ERROR':
      return ExitCode.CAPABILITY_ERROR;
    case 'CONFIG_ERROR':
    case 'CONFIG_LOCK_ERROR':
      return ExitCode.CONFIG_ERROR;
    case 'SESSION_NOT_FOUND':
      return ExitCode.SESSION_NOT_FOUND;
    case 'PROFILE_NOT_FOUND':
      return ExitCode.PROFILE_NOT_FOUND;
    case 'PLUGIN_ERROR':
      return ExitCode.PLUGIN_ERROR;
    case 'TIMEOUT':
    case 'INACTIVITY_TIMEOUT':
      return ExitCode.TIMEOUT;
    case 'AGENT_CRASH':
      return ExitCode.AGENT_CRASHED;
    case 'ABORTED':
      return ExitCode.ABORTED;
    case 'RATE_LIMITED':
      return ExitCode.RATE_LIMITED;
    case 'CONTEXT_EXCEEDED':
      return ExitCode.CONTEXT_EXCEEDED;
    // General error: SPAWN_ERROR, INTERNAL, PARSE_ERROR, and everything else
    default:
      return ExitCode.GENERAL_ERROR;
  }
}
