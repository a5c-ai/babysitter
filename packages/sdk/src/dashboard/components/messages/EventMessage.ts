/**
 * EventMessage — dispatcher that routes journal events to type-specific renderers (GAP-UX-001d).
 */
import { colors, colorize } from "../../colors";
import type { JournalEvent } from "./types";
import { renderRunCreatedMessage } from "./RunCreatedMessage";
import { renderEffectRequestedMessage } from "./EffectRequestedMessage";
import { renderEffectResolvedMessage } from "./EffectResolvedMessage";
import { renderRunCompletedMessage } from "./RunCompletedMessage";
import { renderRunFailedMessage } from "./RunFailedMessage";

const EVENT_RENDERERS: Record<string, (event: JournalEvent) => string> = {
  RUN_CREATED: renderRunCreatedMessage,
  EFFECT_REQUESTED: renderEffectRequestedMessage,
  EFFECT_RESOLVED: renderEffectResolvedMessage,
  RUN_COMPLETED: renderRunCompletedMessage,
  RUN_FAILED: renderRunFailedMessage,
};

export function renderEventMessage(event: JournalEvent): string {
  const renderer = EVENT_RENDERERS[event.type];
  if (renderer) {
    return renderer(event);
  }
  // Fallback for unknown event types
  return `${colorize(event.type, colors.bold)}  ${colorize(event.recordedAt, colors.dim)}\n  ${JSON.stringify(event.data).slice(0, 200)}`;
}
