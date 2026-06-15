import { colors, colorize } from "../ansi";
import { renderStatusBadge } from "../statusBadge";
import type { JournalEvent } from "./types";

export function renderRunCompletedMessage(event: JournalEvent): string {
  const { outputRef, costStats } = event.data as {
    outputRef?: string;
    costStats?: { totalCostUsd?: number };
  };
  const lines = [
    `${renderStatusBadge("completed")}  ${colorize("RUN_COMPLETED", colors.bold, colors.green)}`,
    colorize(`  ${event.recordedAt}`, colors.dim),
  ];
  if (outputRef) lines.push(`  Output: ${String(outputRef)}`);
  if (costStats?.totalCostUsd !== undefined) {
    lines.push(`  Cost:   $${costStats.totalCostUsd.toFixed(4)}`);
  }
  return lines.join("\n");
}
