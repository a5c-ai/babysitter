/**
 * SteerModal (SPEC §8): prompt input for the `Steer…` command — sends a
 * `session.message` frame to every selected working unit. Textarea with
 * Ctrl+Enter (or Cmd+Enter) to send; Esc closes WITHOUT clearing the
 * selection (the store Esc cascade puts the modal first: modal → inspector →
 * selection). Cancel keeps the draft for the next steer attempt.
 */

import { useState } from 'react';
import { useStore } from 'zustand';

import { getSelectedEntities } from '../../game/selectors';
import type { CommanderStore, Orders } from '../../game/store';

export interface SteerModalProps {
  store: CommanderStore;
  orders: Orders;
}

export function SteerModal({ store, orders }: SteerModalProps): React.JSX.Element | null {
  const open = useStore(store, (s) => s.meta.steerOpen);
  const world = useStore(store, (s) => s.world);
  const selection = useStore(store, (s) => s.selection);
  const [prompt, setPrompt] = useState('');
  if (!open) return null;

  const { units } = getSelectedEntities({ world, selection });

  const submit = (): void => {
    const text = prompt.trim();
    const state = store.getState();
    if (text !== '' && units.length > 0) {
      orders.steer(
        units.map((u) => u.id),
        text,
      );
      state.pushEvent(`Steering ${units.length} unit(s): ${text}`, 'info', units[0]?.id);
      setPrompt('');
    }
    state.closeSteer();
  };

  return (
    <div className="wr-modal-backdrop" data-testid="steer-modal">
      <div className="wr-modal" role="dialog" aria-label="Steer units">
        <div className="wr-panel-title">STEER SELECTED UNITS</div>
        <div className="wr-modal-targets">
          {units.length === 0 ? (
            <span className="wr-modal-target wr-modal-target--none">no units selected</span>
          ) : (
            units.map((u) => (
              <span key={u.id} className="wr-modal-target">
                {u.view.title}
              </span>
            ))
          )}
        </div>
        <textarea
          // eslint-disable-next-line jsx-a11y/no-autofocus -- command-driven modal
          autoFocus
          className="wr-modal-input"
          rows={3}
          value={prompt}
          placeholder="new orders for the selection…"
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
            if (e.key === 'Escape') store.getState().closeSteer();
          }}
        />
        <div className="wr-modal-hint">Ctrl+Enter to transmit · Esc to close</div>
        <div className="wr-modal-actions">
          <button type="button" className="wr-alert-btn" onClick={() => store.getState().closeSteer()}>
            Cancel
          </button>
          <button
            type="button"
            className="wr-alert-btn wr-alert-btn--approve"
            disabled={units.length === 0 || prompt.trim() === ''}
            onClick={submit}
          >
            Transmit
          </button>
        </div>
      </div>
    </div>
  );
}
