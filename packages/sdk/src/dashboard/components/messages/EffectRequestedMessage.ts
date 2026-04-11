import { colors, colorize } from "../../colors";
import { renderStatusBadge } from "../StatusBadge";
import type { JournalEvent } from "./types";

export function renderEffectRequestedMessage(event: JournalEvent): string {
  const { effectId, kind, title, labels } = event.data as {
    effectId?: string; kind?: string; title?: string; labels?: string[];
  };
  const lines: string[] = [];
  lines.push(`${renderStatusBadge("pending")}  ${colorize("EFFECT_REQUESTED", colors.bold)}`);
  lines.push(colorize(`  ${event.recordedAt}`, colors.dim));
  if (effectId) lines.push(`  Effect: ${colorize(String(effectId), colors.cyan)}`);
  if (kind) lines.push(`  Kind:   ${colorize(String(kind), colors.yellow)}`);
  if (title) lines.push(`  Title:  ${String(title)}`);
  if (labels && labels.length > 0) {
    lines.push(`  Labels: ${labels.map((l) => colorize(`[${l}]`, colors.dim)).join(" ")}`);
  }
  return lines.join("\n");
}
