import { colors, colorize } from "../../colors";
import { renderStatusBadge } from "../StatusBadge";
import type { JournalEvent } from "./types";

export function renderRunCreatedMessage(event: JournalEvent): string {
  const { runId, processId, entrypoint } = event.data as {
    runId?: string; processId?: string; entrypoint?: { importPath?: string };
  };
  const lines: string[] = [];
  lines.push(`${renderStatusBadge("created")}  ${colorize("RUN_CREATED", colors.bold)}`);
  lines.push(colorize(`  ${event.recordedAt}`, colors.dim));
  if (runId) lines.push(`  Run:     ${colorize(String(runId), colors.cyan)}`);
  if (processId) lines.push(`  Process: ${String(processId)}`);
  if (entrypoint?.importPath) lines.push(`  Entry:   ${String(entrypoint.importPath)}`);
  return lines.join("\n");
}
