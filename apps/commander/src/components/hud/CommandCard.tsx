/**
 * CommandCard (SPEC §4/§8): 3x4 grid of contextual commands produced by the
 * microagent for the current selection. Hotkeys Q/W/E/R/A/S/D/F/Z/X/C/V map
 * positionally onto the grid (row-major, mirroring the keyboard); activation
 * is wired through the mode arbiter in `game/commands.ts` + `game/input.ts`,
 * and this card shares the exact same `executeIntent` path so mouse and
 * keyboard behave identically. Hint keycaps render in each cell corner;
 * empty cells still show their (inert) keycap so the grid reads as a
 * keyboard. Severity styling: danger → red tint, urgent → pulsing
 * (SPEC §10 restraint). data-testid="cmd-<commandId>" (SPEC §9).
 */

import { useStore } from 'zustand';
import clsx from 'clsx';

import {
  COMMAND_HOTKEYS,
  executeIntent,
  getCommandSpecs,
  GRID_CELLS,
} from '../../game/commands';
import type { CommanderStore, Orders } from '../../game/store';
import type { CommandSpec } from '../../microagent/types';

export interface CommandCardProps {
  store: CommanderStore;
  orders: Orders;
}

export function CommandCard({ store, orders }: CommandCardProps): React.JSX.Element {
  const world = useStore(store, (s) => s.world);
  const board = useStore(store, (s) => s.board);
  const selection = useStore(store, (s) => s.selection);
  const alerts = useStore(store, (s) => s.alerts);
  const meta = useStore(store, (s) => s.meta);

  const specs = getCommandSpecs({ world, board, selection, alerts, meta });
  const empties = Math.max(0, GRID_CELLS - specs.length);

  const onRun = (spec: CommandSpec): void => {
    if (!spec.enabled) return;
    executeIntent(spec.intent, store, orders);
  };

  return (
    <section className="wr-panel wr-commands" data-testid="command-card" aria-label="Commands">
      <div className="wr-panel-title">ORDERS</div>
      <div className="wr-cmd-grid">
        {specs.map((spec) => (
          <button
            key={spec.id}
            type="button"
            data-testid={`cmd-${spec.id}`}
            className={clsx(
              'wr-cmd',
              spec.severity === 'danger' && 'wr-cmd--danger',
              spec.severity === 'urgent' && 'wr-cmd--urgent',
            )}
            disabled={!spec.enabled}
            title={`${spec.tooltip}${spec.hotkey !== undefined ? ` [${spec.hotkey}]` : ''}`}
            onClick={() => onRun(spec)}
          >
            <span className="wr-cmd-icon" dangerouslySetInnerHTML={{ __html: spec.icon.svg }} />
            <span className="wr-cmd-label">{spec.label}</span>
            {/* word-boundary separator: keeps innerText "Abort F", not "AbortF" */}
            {spec.hotkey !== undefined && <span className="wr-cmd-sep" aria-hidden>{' '}</span>}
            {spec.hotkey !== undefined && <kbd className="wr-cmd-hotkey">{spec.hotkey}</kbd>}
          </button>
        ))}
        {Array.from({ length: empties }, (_, i) => (
          <span key={`empty-${i}`} className="wr-cmd wr-cmd--empty" aria-hidden>
            <kbd className="wr-cmd-hotkey">{COMMAND_HOTKEYS[specs.length + i]}</kbd>
          </span>
        ))}
      </div>
    </section>
  );
}
