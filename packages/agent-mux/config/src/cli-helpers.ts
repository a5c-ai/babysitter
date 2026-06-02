/**
 * Lightweight CLI helper utilities extracted from agent-mux-cli.
 *
 * These are self-contained copies of the flag-parsing helpers, exit codes,
 * and output helpers that the config module needs, avoiding a circular
 * dependency back to the CLI package.
 */

import type { ErrorCode } from '@a5c-ai/agent-mux-comm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parsed CLI arguments. */
export interface ParsedArgs {
  /** The command (e.g., 'run', 'adapters'). */
  command: string | undefined;

  /** The subcommand (e.g., 'list', 'show'). */
  subcommand: string | undefined;

  /** Remaining positional arguments after command/subcommand. */
  positionals: string[];

  /** Named flags. Boolean flags are true/false. String/number flags are strings. */
  flags: Record<string, string | boolean | string[]>;
}

/** Known flag definition for the parser. */
export interface FlagDef {
  /** Short alias (single character). */
  short?: string;

  /** Flag type. */
  type: 'boolean' | 'string' | 'number';

  /** Whether the flag can be specified multiple times. */
  repeatable?: boolean;
}

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

/**
 * Map an ErrorCode to an exit code.
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
 * Get a flag value as a boolean.
 */
export function flagBool(flags: Record<string, string | boolean | string[]>, name: string): boolean | undefined {
  const val = flags[name];
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

/** Whether color output is enabled. */
let colorEnabled: boolean | undefined;

export function setColorEnabled(enabled: boolean): void {
  colorEnabled = enabled;
}

function isColorEnabled(): boolean {
  if (colorEnabled !== undefined) return colorEnabled;
  if (process.env['NO_COLOR']) return false;
  if (!process.stdout.isTTY) return false;
  return true;
}

// ANSI codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';

function c(code: string, text: string): string {
  return isColorEnabled() ? `${code}${text}${RESET}` : text;
}

/**
 * Print a table in human-readable format.
 */
export function printTable(headers: string[], rows: string[][]): void {
  if (rows.length === 0) {
    process.stdout.write('(no results)\n');
    return;
  }

  // Calculate column widths
  const widths = headers.map((h, i) => {
    let max = h.length;
    for (const row of rows) {
      const cell = row[i] ?? '';
      if (cell.length > max) max = cell.length;
    }
    return max;
  });

  // Print header
  const headerLine = headers.map((h, i) => h.padEnd(widths[i]!)).join('  ');
  process.stdout.write(c(BOLD, headerLine) + '\n');

  // Print separator
  const sep = widths.map((w) => '-'.repeat(w)).join('  ');
  process.stdout.write(c(DIM, sep) + '\n');

  // Print rows
  for (const row of rows) {
    const line = row.map((cell, i) => (cell ?? '').padEnd(widths[i]!)).join('  ');
    process.stdout.write(line + '\n');
  }
}

/**
 * Print key-value pairs in human-readable format.
 */
export function printKeyValue(pairs: [string, string][]): void {
  if (pairs.length === 0) return;

  const maxKeyLen = Math.max(...pairs.map(([k]) => k.length));

  for (const [key, value] of pairs) {
    process.stdout.write(
      `${c(BOLD, key.padEnd(maxKeyLen))}  ${value}\n`,
    );
  }
}

/**
 * Convert a typed object into a plain Record<string, unknown>.
 */
export function toPlain<T>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

/**
 * Print JSON output.
 */
export function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/**
 * Print a JSON-wrapped success response.
 */
export function printJsonOk(data: unknown): void {
  printJson({ ok: true, data });
}

/**
 * Print a JSON-wrapped error response.
 */
export function printJsonError(code: string, message: string, recoverable: boolean = false): void {
  printJson({ ok: false, error: { code, message, recoverable } });
}

/**
 * Print an error message to stderr.
 */
export function printError(message: string): void {
  process.stderr.write(c(RED, 'Error: ') + message + '\n');
}
