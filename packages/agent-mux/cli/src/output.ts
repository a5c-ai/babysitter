/**
 * Output formatting utilities for the amux CLI.
 *
 * Supports human-readable tables/text and JSON output modes.
 * Color is supported via ANSI codes, gated by --no-color / NO_COLOR / TTY detection.
 */

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
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

function c(code: string, text: string): string {
  return isColorEnabled() ? `${code}${text}${RESET}` : text;
}

export const color = {
  bold: (text: string) => c(BOLD, text),
  dim: (text: string) => c(DIM, text),
  red: (text: string) => c(RED, text),
  green: (text: string) => c(GREEN, text),
  yellow: (text: string) => c(YELLOW, text),
  cyan: (text: string) => c(CYAN, text),
};

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
 * Convert a typed object (possibly with a sealed index signature) into a plain
 * `Record<string, unknown>` suitable for serialization / column-extraction
 * helpers. Uses JSON round-trip so it drops undefined and functions and loses
 * prototype — appropriate for the CLI's read-only render paths.
 */
export function toPlain<T>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function toPlainArray<T>(values: readonly T[]): Record<string, unknown>[] {
  return values.map((v) => toPlain(v));
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

/**
 * Print a warning message to stderr.
 */
export function printWarning(message: string): void {
  process.stderr.write(c(YELLOW, 'Warning: ') + message + '\n');
}

/**
 * Print an info message to stderr.
 */
export function printInfo(message: string): void {
  process.stderr.write(c(CYAN, 'Info: ') + message + '\n');
}
