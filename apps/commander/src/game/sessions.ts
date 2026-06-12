/**
 * Session-forensics pure helpers (SPEC-V5 §V5-2/§V5-4).
 *
 * - Default-tab policy: the Sessions tab is the DEFAULT for agent-less cards
 *   in ai-review / human-review / approved / merged / in-production (ahead of
 *   Process); backlog / do cards keep the v3 Process default.
 * - Card-supported tab set: cards offer every tab except the live Transcript
 *   (which needs an attending agent).
 * - List shaping: a card's session list includes its CHILD cards' sessions
 *   (stack parents nest child workers under the coordination session);
 *   grouping is by attempt with nesting by `parentSessionId` (§V5-1 links).
 * - Tab-internal routing: list ⇄ read-only transcript view (back link,
 *   reviewed-chip / parent-chip navigation).
 *
 * All functions are pure (unit-tested in __tests__/sessions.test.ts).
 */

import type { SimSessionView } from '../backend/mock/simulation';
import type { InspectorTab } from './store';

// ---------------------------------------------------------------------------
// Default-tab policy (§V5-2)
// ---------------------------------------------------------------------------

/** Columns whose agent-less cards open the Inspector on Sessions (§V5-2). */
export const SESSIONS_DEFAULT_COLUMNS: ReadonlySet<string> = new Set([
  'ai-review',
  'human-review',
  'approved',
  'merged',
  'in-production',
]);

/** Tabs a CARD-mode Inspector supports (no live Transcript without an agent). */
export const CARD_SUPPORTED_TABS: ReadonlySet<InspectorTab> = new Set<InspectorTab>([
  'sessions',
  'process',
  'workspace',
  'memory',
  'terminal',
]);

/**
 * The default Inspector tab when opening a CARD (§V5-2): Sessions for
 * agent-less cards in the review-and-beyond columns, else Process (V3 rule).
 * Unknown cards (no committed view) keep the Process default.
 */
export function defaultInspectorCardTab(
  column: string | undefined,
  activeAgentCount: number,
): InspectorTab {
  if (activeAgentCount === 0 && column !== undefined && SESSIONS_DEFAULT_COLUMNS.has(column)) {
    return 'sessions';
  }
  return 'process';
}

// ---------------------------------------------------------------------------
// List shaping: card scope + attempt grouping + subsession nesting (§V5-2)
// ---------------------------------------------------------------------------

/**
 * The sessions a card's Sessions tab lists: the card's own sessions plus its
 * CHILD cards' sessions (stack parents show child workers nested under the
 * per-attempt coordination session, §V5-1 (a)). Preserves the newest-first
 * input order.
 */
export function sessionsForCard(
  all: readonly SimSessionView[],
  taskId: string,
  childIds: readonly string[],
): SimSessionView[] {
  const scope = new Set<string>([taskId, ...childIds]);
  return all.filter((s) => scope.has(s.taskId));
}

/** One rendered session row (children render nested, §V5-2). */
export interface SessionRowNode {
  session: SimSessionView;
  children: SessionRowNode[];
}

/** One etched attempt section: divider "ATTEMPT N" + its top-level rows. */
export interface SessionAttemptGroup {
  attempt: number;
  rows: SessionRowNode[];
}

/**
 * Group sessions by attempt (etched dividers) and nest rows whose
 * `parentSessionId` matches a LISTED session beneath their parent (§V5-2).
 * Nested rows live with their parent's group regardless of their own attempt
 * (child cards count attempts independently). Input order (newest first) is
 * preserved for groups, top-level rows and children alike.
 */
export function groupSessionsByAttempt(
  sessions: readonly SimSessionView[],
): SessionAttemptGroup[] {
  const nodes = new Map<string, SessionRowNode>();
  for (const session of sessions) {
    nodes.set(session.sessionId, { session, children: [] });
  }
  const groups: SessionAttemptGroup[] = [];
  const byAttempt = new Map<number, SessionAttemptGroup>();
  for (const session of sessions) {
    const node = nodes.get(session.sessionId)!;
    const parentId = session.parentSessionId;
    const parent =
      parentId !== null && parentId !== session.sessionId ? nodes.get(parentId) : undefined;
    if (parent !== undefined) {
      parent.children.push(node);
      continue;
    }
    let group = byAttempt.get(session.attempt);
    if (group === undefined) {
      group = { attempt: session.attempt, rows: [] };
      byAttempt.set(session.attempt, group);
      groups.push(group);
    }
    group.rows.push(node);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Tab-internal routing (list ⇄ transcript view, §V5-2)
// ---------------------------------------------------------------------------

/** The Sessions tab's internal view state. */
export type SessionsTabView =
  | { mode: 'list' }
  | { mode: 'transcript'; sessionId: string };

/** The initial (and back-link target) view: the grouped list. */
export const SESSIONS_LIST_VIEW: SessionsTabView = { mode: 'list' };

/**
 * Open a session's read-only transcript (row click, reviewed-chip and
 * parent-chip navigation all route through here, §V5-2).
 */
export function openSessionTranscript(sessionId: string): SessionsTabView {
  return { mode: 'transcript', sessionId };
}

/** The back link: return to the grouped list (§V5-2). */
export function backToSessionList(): SessionsTabView {
  return SESSIONS_LIST_VIEW;
}
