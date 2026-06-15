/**
 * Card editor pure logic (SPEC-V4 §V4-5): draft initialization from the live
 * SimCardView, diff-patch building (Save applies ONLY the changed fields via
 * the sim verb `updateTask`), the parent-select legality rule (parent
 * reassignment is legal only while the card sits in BACKLOG, and only other
 * backlog parents/singles qualify), and the workspace option derivation.
 * Unit-tested; the CardEditor dialog component is a thin shell over these.
 */

import type { SimCardView, UpdateTaskPatch } from '../backend/mock/simulation';
import type { TaskKind } from '../backend/mock/scenario';

/** Form-state mirror of the editable card fields ('' = none for parentId). */
export interface CardEditorDraft {
  title: string;
  taskKind: TaskKind;
  description: string;
  yolo: boolean;
  /** '' = no parent (detached single). */
  parentId: string;
  workspaceId: string;
  stackRef: string;
}

/** Initialize the form draft from the card's current view. */
export function draftFromCard(view: SimCardView): CardEditorDraft {
  return {
    title: view.title,
    taskKind: view.taskKind,
    description: view.description,
    yolo: view.yolo,
    parentId: view.parentId ?? '',
    workspaceId: view.workspaceId,
    stackRef: view.stackRef,
  };
}

/** §V4-5 legality: the parent select is enabled only while in BACKLOG. */
export function parentEditable(view: Pick<SimCardView, 'column'>): boolean {
  return view.column === 'backlog';
}

/**
 * Legal parent candidates for `taskId`: OTHER backlog cards that are not
 * themselves children (parents and singles both qualify; the sim rejects
 * nesting under a child).
 */
export function legalParentIds(taskId: string, cards: readonly SimCardView[]): string[] {
  return cards
    .filter((c) => c.taskId !== taskId && c.column === 'backlog' && c.parentId === null)
    .map((c) => c.taskId);
}

/** Distinct workspace ids across the board (stable sorted). */
export function workspaceOptions(cards: readonly SimCardView[]): string[] {
  return [...new Set(cards.map((c) => c.workspaceId))].sort();
}

/**
 * Build the `updateTask` patch carrying ONLY the fields the draft changed
 * (§V4-5: "Save calls orders.updateTask with only changed fields"). The
 * parent field is additionally gated by the backlog legality rule — a
 * non-backlog card never emits `parentId`, even if the draft drifted.
 */
export function buildCardPatch(view: SimCardView, draft: CardEditorDraft): UpdateTaskPatch {
  const patch: UpdateTaskPatch = {};
  const title = draft.title.trim();
  if (title !== '' && title !== view.title) patch.title = title;
  if (draft.taskKind !== view.taskKind) patch.taskKind = draft.taskKind;
  if (draft.description !== view.description) patch.description = draft.description;
  if (draft.yolo !== view.yolo) patch.yolo = draft.yolo;
  const parentId = draft.parentId === '' ? null : draft.parentId;
  if (parentEditable(view) && parentId !== view.parentId) patch.parentId = parentId;
  if (draft.workspaceId !== view.workspaceId) patch.workspaceId = draft.workspaceId;
  if (draft.stackRef !== view.stackRef) patch.stackRef = draft.stackRef;
  return patch;
}

/** True when the draft changes nothing — Save becomes a no-op close. */
export function patchIsEmpty(patch: UpdateTaskPatch): boolean {
  return Object.keys(patch).length === 0;
}
