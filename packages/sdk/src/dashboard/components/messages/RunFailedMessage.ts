import { colors, colorize } from "../../colors";
import { renderStatusBadge } from "../StatusBadge";
import type { JournalEvent } from "./types";

export function renderRunFailedMessage(event: JournalEvent): string {
  const { error } = event.data as {
    error?: { message?: string; name?: string; stack?: string };
  };
  const lines: string[] = [];
  lines.push(`${renderStatusBadge("failed")}  ${colorize("RUN_FAILED", colors.bold, colors.red)}`);
  lines.push(colorize(`  ${event.recordedAt}`, colors.dim));
  if (error?.name) lines.push(`  Error: ${colorize(String(error.name), colors.red)}`);
  if (error?.message) lines.push(`  ${String(error.message)}`);
  if (error?.stack) {
    lines.push(colorize("  Stack trace:", colors.dim));
    const stackLines = String(error.stack).split("\n").slice(0, 5);
    for (const sl of stackLines) {
      lines.push(colorize(`    ${sl.trim()}`, colors.dim));
    }
  }
  return lines.join("\n");
}
