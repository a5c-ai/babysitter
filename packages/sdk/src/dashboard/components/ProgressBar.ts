/**
 * ProgressBar — terminal progress bar for effect progress display (GAP-SUBOBS-002).
 */
import { colors, colorize } from "../colors";

export interface ProgressBarOptions {
  width?: number;
  showPercent?: boolean;
}

const FILLED = "\u2588";  // █
const EMPTY = "\u2591";   // ░

export function renderProgressBar(
  percent: number,
  options: ProgressBarOptions = {},
): string {
  const { width = 20, showPercent = true } = options;
  const clamped = Math.max(0, Math.min(100, percent));
  const filledCount = Math.round((clamped / 100) * width);
  const emptyCount = width - filledCount;

  const bar = FILLED.repeat(filledCount) + EMPTY.repeat(emptyCount);

  const barColor = clamped >= 100
    ? colors.green
    : clamped >= 50
      ? colors.cyan
      : colors.yellow;

  const percentStr = showPercent ? ` ${Math.round(clamped)}%` : "";
  return `${colorize(bar, barColor)}${percentStr}`;
}

export function renderProgressLabel(
  label: string,
  percent?: number,
): string {
  const parts: string[] = [];
  if (percent !== undefined) {
    parts.push(renderProgressBar(percent, { width: 10 }));
  }
  if (label) {
    parts.push(colorize(label, colors.dim));
  }
  return parts.join(" ");
}
