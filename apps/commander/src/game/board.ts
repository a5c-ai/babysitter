/**
 * Pure board logic (SPEC-V3 §V3-1): column composition, user-drag legality
 * and drop planning. Kept free of DOM/React so the drag-verb mapping and
 * stack/ordering rules are unit-testable in isolation.
 */

import type { ColumnId, SimCardView } from '../backend/mock/simulation';
import { COLUMNS } from '../backend/mock/simulation';

export { COLUMNS };
export type { ColumnId };

/** Lane display headers (etched small-caps, §V3-1). */
export const COLUMN_TITLES: Record<ColumnId, string> = {
  backlog: 'Backlog',
  do: 'Do',
  'ai-review': 'AI Review',
  'human-review': 'Human Review',
  approved: 'Approved',
  merged: 'Merged',
  'in-production': 'In Production',
};

/**
 * SPEC-V3 §V3-1 legal USER moves: backlog → do, backlog reorder,
 * human-review → do | ai-review | approved. Everything else is automatic.
 */
export function legalUserMove(from: ColumnId, to: ColumnId): boolean {
  if (from === 'backlog') return to === 'do' || to === 'backlog';
  if (from === 'human-review') return to === 'do' || to === 'ai-review' || to === 'approved';
  return false;
}

/** A card is user-draggable only when a legal move exists from its column. */
export function isDraggable(card: Pick<SimCardView, 'column' | 'parentId' | 'merged'>): boolean {
  if (card.parentId !== null || card.merged) return false;
  return card.column === 'backlog' || card.column === 'human-review';
}

export interface DropPlan {
  taskId: string;
  column: ColumnId;
}

/**
 * Drag-verb mapping (§V3-1): a finished drag either yields a `moveCard` plan
 * or null (snap-back). Stack children and merged cards never drag.
 */
export function planDrop(
  card: Pick<SimCardView, 'taskId' | 'column' | 'parentId' | 'merged'>,
  target: ColumnId | null,
): DropPlan | null {
  if (target === null || !isDraggable(card)) return null;
  if (!legalUserMove(card.column, target)) return null;
  return { taskId: card.taskId, column: target };
}

/**
 * Top-level cards of one column in render order: backlog by `order` then id;
 * other lanes by id; APPROVED puts merged cards last (compact seal rows,
 * §V3-2). Deterministic for a given card set.
 */
export function cardsForColumn(cards: readonly SimCardView[], column: ColumnId): SimCardView[] {
  const lane = cards.filter((c) => c.parentId === null && c.column === column);
  lane.sort((a, b) => {
    if (column === 'approved' && a.merged !== b.merged) return a.merged ? 1 : -1;
    if (column === 'backlog' && a.order !== b.order) return a.order - b.order;
    return a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : 0;
  });
  return lane;
}

/** Stack children of a parent, deterministic order. */
export function childrenOf(cards: readonly SimCardView[], parent: SimCardView): SimCardView[] {
  const byId = new Map(cards.map((c) => [c.taskId, c]));
  return parent.childIds
    .map((id) => byId.get(id))
    .filter((c): c is SimCardView => c !== undefined);
}

/** Resolve the kanban column under a DOM point (elementFromPoint hit). */
export function columnFromElement(el: Element | null): ColumnId | null {
  const lane = el?.closest('[data-testid^="kanban-col-"]');
  const id = lane?.getAttribute('data-testid')?.slice('kanban-col-'.length) ?? '';
  return (COLUMNS as readonly string[]).includes(id) ? (id as ColumnId) : null;
}

/**
 * Structural slice of Element used by the drop-resolution helpers — keeps the
 * §V4-2 ghost-skipping logic unit-testable without a DOM environment.
 */
export interface HitLike {
  closest(selectors: string): HitLike | null;
  getAttribute(name: string): string | null;
}

/**
 * SPEC-V4 §V4-2 drop resolution over an `elementsFromPoint` stack: the drag
 * ghost rides topmost (so AC36's probe hits it), so lane resolution takes the
 * FIRST hit that is NOT inside the ghost layer and resolves its lane. Only
 * that first non-ghost hit decides — matching the old single-elementFromPoint
 * semantics with the ghost layered above.
 */
export function laneFromHits(hits: ReadonlyArray<HitLike>): ColumnId | null {
  for (const hit of hits) {
    if (hit.closest('[data-drag-ghost]') !== null) continue;
    const lane = hit.closest('[data-testid^="kanban-col-"]');
    const id = lane?.getAttribute('data-testid')?.slice('kanban-col-'.length) ?? '';
    return (COLUMNS as readonly string[]).includes(id) ? (id as ColumnId) : null;
  }
  return null;
}

/**
 * §V4-2 drag ghost markup: a static visual snapshot of the lifted card. Every
 * data-testid is stripped so the ghost never collides with the frozen
 * selector contract (`card-*`, `card-agent-*`, `card-yolo-*` stay unique in
 * the lanes); the AC36 probe identifies the ghost via the layer's
 * `data-drag-ghost` attribute instead.
 */
export function sanitizeGhostMarkup(outerHtml: string): string {
  return outerHtml.replace(/\s+data-testid="[^"]*"/g, '');
}
