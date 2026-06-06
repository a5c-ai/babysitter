import { colors, colorize } from "../ansi";
import type { JournalEvent } from "./types";

export function renderProcessAssignedMessage(event: JournalEvent): string {
  const { processId, entrypoint, previousEntrypoint, force } = event.data as {
    processId?: string;
    entrypoint?: { importPath?: string; exportName?: string };
    previousEntrypoint?: { importPath?: string };
    force?: boolean;
  };
  const lines = [
    `${colorize("✔ assigned", colors.green)}  ${colorize("PROCESS_ASSIGNED", colors.bold)}`,
    colorize(`  ${event.recordedAt}`, colors.dim),
  ];
  if (processId) lines.push(`  Process: ${String(processId)}`);
  if (entrypoint?.importPath) {
    const entry = entrypoint.exportName ? `${entrypoint.importPath}#${entrypoint.exportName}` : entrypoint.importPath;
    lines.push(`  Entry:   ${colorize(entry, colors.cyan)}`);
  }
  if (previousEntrypoint?.importPath) lines.push(`  Previous: ${String(previousEntrypoint.importPath)}`);
  if (force) lines.push(`  Force:   ${colorize("true", colors.yellow)}`);
  return lines.join("\n");
}
