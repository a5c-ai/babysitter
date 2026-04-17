import type { ThemeColors } from "../types.js";
import { formatTimestamp } from "./core.js";

export interface ViewportState {
  readonly visible: boolean;
  readonly focused: boolean;
}

export function shouldAnimateTick(state: ViewportState): boolean {
  return state.visible;
}

export function computeFrameIndex(
  elapsedMs: number,
  intervalMs: number,
  frameCount: number,
): number {
  if (intervalMs <= 0 || frameCount <= 0 || elapsedMs <= 0) return 0;
  return Math.floor(elapsedMs / intervalMs) % frameCount;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  RUN_CREATED: "Run Created",
  EFFECT_REQUESTED: "Effect Requested",
  EFFECT_RESOLVED: "Effect Resolved",
  RUN_COMPLETED: "Run Completed",
  RUN_FAILED: "Run Failed",
};

export function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

const EVENT_ICONS: Record<string, string> = {
  RUN_CREATED: "\u25B6",
  EFFECT_REQUESTED: "\u25CB",
  EFFECT_RESOLVED: "\u25CF",
  RUN_COMPLETED: "\u2713",
  RUN_FAILED: "\u2717",
};

export function getEventIcon(type: string): string {
  return EVENT_ICONS[type] ?? "\u00B7";
}

export function getEventColor(type: string, colors: ThemeColors): string {
  switch (type) {
    case "RUN_CREATED":
      return colors.primary;
    case "EFFECT_REQUESTED":
      return colors.warning;
    case "EFFECT_RESOLVED":
      return colors.success;
    case "RUN_COMPLETED":
      return colors.success;
    case "RUN_FAILED":
      return colors.error;
    default:
      return colors.muted;
  }
}

export function formatEventTimeline(
  events: ReadonlyArray<{ type: string; recordedAt: string; seq: number }>,
): string[] {
  return events.map((e) => {
    const label = formatEventType(e.type);
    const icon = getEventIcon(e.type);
    const time = formatTimestamp(e.recordedAt);
    return `#${String(e.seq)}  ${time}  ${icon} ${label}`;
  });
}

const KEYBOARD_HELP: Record<string, ReadonlyArray<readonly [string, string]>> = {
  "run-detail": [
    ["Esc", "Go back to dashboard"],
    ["s", "Open session for this run"],
    ["r", "Refresh run data"],
    ["\u2191/\u2193", "Scroll events up/down"],
    ["PgUp/PgDn", "Scroll one page"],
    ["g/G", "Jump to top/bottom"],
    ["?", "Toggle this help"],
  ],
  session: [
    ["Esc", "Go back to dashboard (when not typing)"],
    ["Ctrl+F", "Toggle search bar"],
    ["Enter", "Submit message"],
    ["\u2191/\u2193", "Scroll messages / navigate history"],
    ["PgUp/PgDn", "Scroll one page"],
    ["g/G", "Jump to top/bottom of messages"],
    ["Tab", "Complete slash command"],
    ["/help", "Show available slash commands"],
    ["/effects", "Toggle effects panel"],
    ["/search", "Search messages"],
    ["/verbosity", "Cycle verbosity level"],
    ["?", "Toggle this help"],
  ],
};

export function formatKeyboardHelp(view: string): string[] {
  const shortcuts = KEYBOARD_HELP[view];
  if (!shortcuts) return [];
  return shortcuts.map(([key, desc]) => `  ${key.padEnd(12)} ${desc}`);
}

export function computeViewportSize(terminalRows?: number, reservedRows = 8): number {
  const rows = terminalRows ?? 24;
  return Math.max(5, rows - reservedRows);
}

export function computeVisibleRows(terminalRows?: number, reservedRows = 6): number {
  const rows = terminalRows ?? 24;
  return Math.max(3, rows - reservedRows);
}

export function formatHarnessBadge(harness: string | undefined): string {
  if (!harness) return "-";
  return harness;
}

export function formatStreamLine(line: string, source?: "stdout" | "stderr"): string {
  if (!line || source !== "stderr") return line;
  if (line.startsWith("[stderr]")) return line;
  return `[stderr] ${line}`;
}
