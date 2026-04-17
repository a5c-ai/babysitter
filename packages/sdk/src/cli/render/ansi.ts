const ESC = "\x1b[";
const ANSI_SGR_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

export const colors = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  cyan: `${ESC}36m`,
} as const;

export function colorize(text: string, ...codes: string[]): string {
  if (codes.length === 0) return text;
  return `${codes.join("")}${text}${colors.reset}`;
}

export function stripAnsi(text: string): string {
  return text.replace(ANSI_SGR_PATTERN, "");
}
