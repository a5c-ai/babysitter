/**
 * Rendering utilities for babysitter terminal UI.
 *
 * The dashboard components output plain ANSI strings and don't require Ink
 * at the component level. Ink is available as an optional runtime dependency
 * for interactive dashboard sessions (loaded dynamically).
 */

/**
 * Check if stdout is a TTY (supports interactive rendering).
 */
export function isTTY(): boolean {
  return Boolean(process.stdout.isTTY);
}

/**
 * Write output to stderr (for status lines during CLI output on stdout).
 */
export function writeStatus(line: string): void {
  process.stderr.write(`\r${line}\x1b[K`);
}

/**
 * Clear the status line.
 */
export function clearStatus(): void {
  process.stderr.write("\r\x1b[K");
}
