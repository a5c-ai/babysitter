/**
 * Terminal color utilities for dashboard components.
 * ANSI escape code helpers -- no external dependency.
 */

const ESC = "\x1b[";

export const colors = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,

  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  gray: `${ESC}90m`,

  bgRed: `${ESC}41m`,
  bgGreen: `${ESC}42m`,
  bgYellow: `${ESC}43m`,
  bgCyan: `${ESC}46m`,
} as const;

export function colorize(text: string, ...codes: string[]): string {
  if (codes.length === 0) return text;
  return codes.join("") + text + colors.reset;
}

export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}
