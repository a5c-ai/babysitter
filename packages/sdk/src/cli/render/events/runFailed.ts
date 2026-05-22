import { colors, colorize } from "../ansi";
import { renderStatusBadge } from "../statusBadge";
import type { JournalEvent } from "./types";

export function renderRunFailedMessage(event: JournalEvent): string {
  const { error } = event.data as {
    error?: { message?: string; name?: string; stack?: string };
  };
  const lines = [
    `${renderStatusBadge("failed")}  ${colorize("RUN_FAILED", colors.bold, colors.red)}`,
    colorize(`  ${event.recordedAt}`, colors.dim),
  ];
  if (error?.name) lines.push(`  Error: ${colorize(String(error.name), colors.red)}`);
  if (error?.message) lines.push(`  ${String(error.message)}`);
  if (error?.stack) {
    lines.push(colorize("  Stack trace:", colors.dim));
    for (const stackLine of String(error.stack).split("\n").slice(0, 5)) {
      lines.push(colorize(`    ${stackLine.trim()}`, colors.dim));
    }
  }
  return lines.join("\n");
}
