import { colors, colorize } from "../ansi";
import { renderEffectRequestedMessage } from "./effectRequested";
import { renderEffectResolvedMessage } from "./effectResolved";
import { renderProcessAssignedMessage } from "./processAssigned";
import { renderRunCompletedMessage } from "./runCompleted";
import { renderRunCreatedMessage } from "./runCreated";
import { renderRunFailedMessage } from "./runFailed";
import type { JournalEvent } from "./types";

const EVENT_RENDERERS: Record<string, (event: JournalEvent) => string> = {
  RUN_CREATED: renderRunCreatedMessage,
  PROCESS_ASSIGNED: renderProcessAssignedMessage,
  EFFECT_REQUESTED: renderEffectRequestedMessage,
  EFFECT_RESOLVED: renderEffectResolvedMessage,
  RUN_COMPLETED: renderRunCompletedMessage,
  RUN_FAILED: renderRunFailedMessage,
};

export type { JournalEvent } from "./types";

export function renderEventMessage(event: JournalEvent): string {
  const renderer = EVENT_RENDERERS[event.type];
  if (renderer) {
    return renderer(event);
  }
  return `${colorize(event.type, colors.bold)}  ${colorize(event.recordedAt, colors.dim)}\n  ${JSON.stringify(event.data).slice(0, 200)}`;
}
