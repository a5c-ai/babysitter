import { colors, colorize } from "../ansi";
import type { JournalEvent } from "./types";
import { renderStatusBadge } from "../statusBadge";

export function renderProcessRuntimeErrorMessage(event: JournalEvent): string {
  const data = event.data ?? {};
  const error = data.error as { message?: unknown; name?: unknown } | undefined;
  const lastEffect = data.lastEffect as { effectId?: unknown; taskId?: unknown } | undefined;
  const message = typeof error?.message === "string" ? error.message : "Process runtime error";
  const name = typeof error?.name === "string" ? error.name : "Error";
  const effectSuffix = typeof lastEffect?.effectId === "string"
    ? `\n  lastEffect=${lastEffect.effectId}${typeof lastEffect.taskId === "string" ? ` task=${lastEffect.taskId}` : ""}`
    : "";
  return [
    `${renderStatusBadge("failed")}  ${colorize("PROCESS_RUNTIME_ERROR", colors.bold, colors.red)}`,
    `  ${colorize(event.recordedAt, colors.dim)}`,
    `  ${name}: ${message}`,
    `  recoverable=${data.recoverable === true}`,
    effectSuffix,
  ].join("\n");
}
