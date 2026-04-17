import { colors, colorize } from "../ansi";
import { renderStatusBadge } from "../statusBadge";
import type { JournalEvent } from "./types";

export function renderEffectResolvedMessage(event: JournalEvent): string {
  const { effectId, status, duration } = event.data as {
    effectId?: string;
    status?: string;
    duration?: number;
  };
  const ok = status === "ok" || status === "completed";
  const lines = [
    `${renderStatusBadge(ok ? "completed" : "failed")}  ${colorize("EFFECT_RESOLVED", colors.bold)}`,
    colorize(`  ${event.recordedAt}`, colors.dim),
  ];
  if (effectId) lines.push(`  Effect:   ${colorize(String(effectId), colors.cyan)}`);
  if (status) lines.push(`  Status:   ${colorize(String(status), ok ? colors.green : colors.red)}`);
  if (duration !== undefined) lines.push(`  Duration: ${duration}ms`);
  return lines.join("\n");
}
