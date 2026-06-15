/**
 * Lightweight CLI helper utilities extracted from adapters-cli.
 *
 * These are self-contained copies of the flag-parsing helpers, exit codes,
 * and output helpers that the launch module needs, avoiding a circular
 * dependency back to the CLI package.
 */

// Re-export types so launch.ts can import them from a single module
export type { ParsedArgs, FlagDef } from './types.js';

// ---------------------------------------------------------------------------
// Exit codes
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Flag helpers
// ---------------------------------------------------------------------------

/**
 * Get a flag value as a string, or undefined.
 */
export function flagStr(flags: Record<string, string | boolean | string[]>, name: string): string | undefined {
  const val = flags[name];
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.length > 0) return val[val.length - 1];
  return undefined;
}

/**
 * Get a flag value as a number, or undefined.
 */
export function flagNum(flags: Record<string, string | boolean | string[]>, name: string): number | undefined {
  const s = flagStr(flags, name);
  if (s === undefined) return undefined;
  const n = Number(s);
  if (Number.isNaN(n)) return undefined;
  return n;
}

/**
 * Get a flag value as a boolean.
 */
export function flagBool(flags: Record<string, string | boolean | string[]>, name: string): boolean | undefined {
  const val = flags[name];
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}

/**
 * Get a flag value as a string array (for repeatable flags).
 */
export function flagArr(flags: Record<string, string | boolean | string[]>, name: string): string[] {
  const val = flags[name];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return [val];
  return [];
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

/**
 * Print a JSON-wrapped error response to stdout.
 */
export function printJsonError(code: string, message: string, recoverable: boolean = false): void {
  process.stdout.write(JSON.stringify({ ok: false, error: { code, message, recoverable } }, null, 2) + '\n');
}

/**
 * Print an error message to stderr.
 */
export function printError(message: string): void {
  process.stderr.write('Error: ' + message + '\n');
}
