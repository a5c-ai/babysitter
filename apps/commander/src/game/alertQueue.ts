/**
 * Alert queue ordering + cycling (SPEC §4/§5, AC6).
 *
 * The AlertBanner shows ONE alert at a time — the most urgent (earliest
 * approval deadline) by default — with a "+N more" count for the rest.
 * Clicking the banner cycles through the queue in urgency order; Approve/
 * Deny act on the shown alert only. Pure helpers, unit-tested.
 */

import type { AlertEntry } from './store';

/** Urgency order: earliest deadline first; hookRequestId tiebreak (stable). */
export function sortAlertsByUrgency(alerts: readonly AlertEntry[]): AlertEntry[] {
  return [...alerts].sort(
    (a, b) => a.deadlineTs - b.deadlineTs || a.hookRequestId.localeCompare(b.hookRequestId),
  );
}

/**
 * Resolve which alert the banner shows: the remembered one when it is still
 * pending, otherwise the most urgent. Undefined when the queue is empty.
 */
export function resolveShownAlert(
  alerts: readonly AlertEntry[],
  shownId: string | null,
): AlertEntry | undefined {
  if (alerts.length === 0) return undefined;
  const sorted = sortAlertsByUrgency(alerts);
  if (shownId !== null) {
    const remembered = sorted.find((a) => a.hookRequestId === shownId);
    if (remembered !== undefined) return remembered;
  }
  return sorted[0];
}

/** The alert after `shownId` in urgency order (wraps around). */
export function nextAlert(
  alerts: readonly AlertEntry[],
  shownId: string | null,
): AlertEntry | undefined {
  if (alerts.length === 0) return undefined;
  const sorted = sortAlertsByUrgency(alerts);
  const index = shownId === null ? -1 : sorted.findIndex((a) => a.hookRequestId === shownId);
  return sorted[(index + 1) % sorted.length];
}
