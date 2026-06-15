/**
 * Card editor (SPEC-V4 §V4-5): a parchment form dialog
 * (data-testid="card-editor") opened by the `Edit Card` contextual command or
 * the SelectionPanel edit affordance. Fields: title, kind (the full §V2-2
 * list), description, yolo, parent task (legal only while in BACKLOG),
 * workspace and agent stack (seeded + custom, name + adapter). Save applies
 * ONLY the changed fields via `orders.updateTask` (sim verb, `task_updated`
 * event); Cancel/Esc discards (top of the Esc cascade, §V4-13).
 */

import { useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import { TASK_KINDS, type TaskKind } from '../../backend/mock/scenario';
import type { BoardCardEntity, CommanderStore, Orders } from '../../game/store';
import type { SimViews } from '../../game/views';
import {
  buildCardPatch,
  draftFromCard,
  legalParentIds,
  parentEditable,
  patchIsEmpty,
  workspaceOptions,
} from '../../game/cardEditor';

export interface CardEditorProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
}

interface DialogProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
  card: BoardCardEntity;
}

function CardEditorDialog({ store, orders, views, card }: DialogProps): React.JSX.Element {
  const cards = useStore(store, (s) => s.board.cards);
  const cardIds = useStore(store, (s) => s.board.cardIds);
  const [draft, setDraft] = useState(() => draftFromCard(card.view));

  const allViews = cardIds
    .map((id) => cards[id]?.view)
    .filter((v): v is NonNullable<typeof v> => v !== undefined);
  const parentIds = legalParentIds(card.id, allViews);
  const workspaces = workspaceOptions(allViews);
  const stacks = views.listStacks();
  const canReparent = parentEditable(card.view);

  const close = (): void => store.getState().closeCardEditor();
  const save = (): void => {
    const patch = buildCardPatch(card.view, draft);
    if (!patchIsEmpty(patch)) orders.updateTask(card.id, patch);
    close();
  };

  return (
    <div
      className="wr-modal-backdrop"
      data-testid="card-editor"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          close();
        }
      }}
    >
      <div className="wr-modal wr-foundry wr-card-editor" role="dialog" aria-label="Card editor">
        <div className="wr-panel-title">CARD EDITOR — {card.id.toUpperCase()}</div>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">title</span>
          <input
            className="wr-foundry-input"
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">task kind</span>
          <select
            className="wr-foundry-input"
            value={draft.taskKind}
            onChange={(e) => setDraft({ ...draft, taskKind: e.target.value as TaskKind })}
          >
            {TASK_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">description</span>
          <textarea
            className="wr-foundry-input wr-card-editor-desc"
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>
        <div className="wr-foundry-field">
          <span className="wr-foundry-label">yolo posture</span>
          {/* v4-r0: a real brass lever control (same draft wiring) */}
          <button
            type="button"
            role="switch"
            aria-checked={draft.yolo}
            className={clsx('wr-card-editor-yolo', draft.yolo && 'is-on')}
            onClick={() => setDraft({ ...draft, yolo: !draft.yolo })}
          >
            <span className="wr-yolo-lever" aria-hidden>
              <span className="wr-yolo-lever-knob" />
            </span>
            <span className="wr-yolo-caption">
              yolo {draft.yolo ? 'engaged — auto-approve on review pass' : 'off — human review stands'}
            </span>
          </button>
        </div>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">
            parent task{canReparent ? '' : ' (locked — backlog only)'}
          </span>
          <select
            className="wr-foundry-input"
            value={draft.parentId}
            disabled={!canReparent}
            onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}
          >
            <option value="">— none —</option>
            {parentIds.map((id) => (
              <option key={id} value={id}>
                {cards[id]?.view.title ?? id}
              </option>
            ))}
          </select>
        </label>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">workspace</span>
          <select
            className="wr-foundry-input"
            value={draft.workspaceId}
            onChange={(e) => setDraft({ ...draft, workspaceId: e.target.value })}
          >
            {workspaces.map((ws) => (
              <option key={ws} value={ws}>
                {ws}
              </option>
            ))}
          </select>
        </label>
        <label className="wr-foundry-field">
          <span className="wr-foundry-label">agent stack</span>
          <select
            className="wr-foundry-input"
            value={draft.stackRef}
            onChange={(e) => setDraft({ ...draft, stackRef: e.target.value })}
          >
            {stacks.map((s) => (
              <option key={s.stackRef} value={s.stackRef}>
                {s.name} — {s.stack.spec.adapter}
                {s.custom ? ` (${s.stackRef})` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="wr-modal-hint">saves only the changed fields · Esc to discard</div>
        <div className="wr-modal-actions">
          <button type="button" className="wr-alert-btn" onClick={close}>
            Cancel
          </button>
          <button type="button" className="wr-alert-btn wr-alert-btn--approve" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardEditor({ store, orders, views }: CardEditorProps): React.JSX.Element | null {
  const taskId = useStore(store, (s) => s.meta.cardEditorTaskId);
  const card = useStore(store, (s) =>
    s.meta.cardEditorTaskId !== null ? s.board.cards[s.meta.cardEditorTaskId] : undefined,
  );
  if (taskId === null || card === undefined) return null;
  // key resets the draft whenever the editor retargets a different card.
  return <CardEditorDialog key={taskId} store={store} orders={orders} views={views} card={card} />;
}
