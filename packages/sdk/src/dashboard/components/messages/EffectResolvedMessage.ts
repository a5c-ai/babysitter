import { colors, colorize } from "../../colors";
import { renderStatusBadge } from "../StatusBadge";
import type { JournalEvent } from "./types";

export function renderEffectResolvedMessage(event: JournalEvent): string {
  const { effectId, status, duration } = event.data as {
    effectId?: string; status?: string; duration?: number;
  };
  const isOk = status === "ok" || status === "completed";
  const badge = isOk ? renderStatusBadge("completed") : renderStatusBadge("failed");
  const lines: string[] = [];
  lines.push(`${badge}  ${colorize("EFFECT_RESOLVED", colors.bold)}`);
  lines.push(colorize(`  ${event.recordedAt}`, colors.dim));
  if (effectId) lines.push(`  Effect:   ${colorize(String(effectId), colors.cyan)}`);
  if (status) lines.push(`  Status:   ${colorize(String(status), isOk ? colors.green : colors.red)}`);
  if (duration !== undefined) lines.push(`  Duration: ${duration}ms`);
  return lines.join("\n");
}
