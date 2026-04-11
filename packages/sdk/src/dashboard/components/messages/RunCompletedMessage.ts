import { colors, colorize } from "../../colors";
import { renderStatusBadge } from "../StatusBadge";
import type { JournalEvent } from "./types";

export function renderRunCompletedMessage(event: JournalEvent): string {
  const { outputRef, costStats } = event.data as {
    outputRef?: string; costStats?: { totalCostUsd?: number };
  };
  const lines: string[] = [];
  lines.push(`${renderStatusBadge("completed")}  ${colorize("RUN_COMPLETED", colors.bold, colors.green)}`);
  lines.push(colorize(`  ${event.recordedAt}`, colors.dim));
  if (outputRef) lines.push(`  Output: ${String(outputRef)}`);
  if (costStats?.totalCostUsd !== undefined) {
    lines.push(`  Cost:   $${costStats.totalCostUsd.toFixed(4)}`);
  }
  return lines.join("\n");
}
