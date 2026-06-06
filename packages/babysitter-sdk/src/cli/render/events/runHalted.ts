import { colors, colorize } from "../ansi";
import { renderStatusBadge } from "../statusBadge";
import type { JournalEvent } from "./types";

export function renderRunHaltedMessage(event: JournalEvent): string {
  const { reason } = event.data as { reason?: string };
  const lines = [
    `${renderStatusBadge("halted")}  ${colorize("RUN_HALTED", colors.bold, colors.yellow)}`,
    colorize(`  ${event.recordedAt}`, colors.dim),
  ];
  if (reason) lines.push(`  Reason: ${String(reason)}`);
  return lines.join("\n");
}
