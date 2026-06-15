/**
 * EventTicker (SPEC §4/§14): bottom-left clickable event stream. The DOM
 * keeps the ring buffer in append order (oldest → newest — the frozen v3/v4
 * suites index `ticker-item` slices by previous length), while the list
 * displays newest-first via `column-reverse`.
 * Severity-colored with a per-family glyph (paths only — never
 * <line>/<polyline>, frozen link-layer contract). Hovering pauses the list
 * (entries stop reflowing under the cursor); clicking an entry that
 * references an entity selects it, centers the camera (AC10) and drops a
 * minimap focus ping. Raw text_delta spam never reaches the ticker — the
 * store routes only per-turn/lifecycle events (noise control, SPEC §14).
 * data-testid="ticker-item" (SPEC §9).
 */

import { useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import { formatClock } from '../../game/selectors';
import type { CommanderStore, TickerEntry, TickerSeverity } from '../../game/store';

/** Path-only severity glyphs (SPEC §10: procedural icons, no icon libs). */
const SEVERITY_GLYPHS: Record<TickerSeverity, string> = {
  info: '<path d="M7 1.8 A5.2 5.2 0 1 0 7 12.2 A5.2 5.2 0 1 0 7 1.8 Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M7 6.4 V10 M7 4 V4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  success: '<path d="M2.4 7.4 L5.6 10.6 L11.6 3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  warn: '<path d="M7 1.8 L13 12 H1 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5.4 V8.4 M7 10 V10.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  alert: '<path d="M7 1.4 L12.6 7 L7 12.6 L1.4 7 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M4.8 4.8 L9.2 9.2 M9.2 4.8 L4.8 9.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
};

function glyphSvg(severity: TickerSeverity): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="100%" height="100%" aria-hidden="true">' +
    SEVERITY_GLYPHS[severity] +
    '</svg>'
  );
}

export interface EventTickerProps {
  store: CommanderStore;
}

export function EventTicker({ store }: EventTickerProps): React.JSX.Element {
  const events = useStore(store, (s) => s.events);
  const simStartMs = useStore(store, (s) => s.meta.simStartMs);
  // Hover pause: freeze the rendered list while the cursor is over it so
  // entries do not shift away mid-click (SPEC §4 "clickable" stream).
  const [frozen, setFrozen] = useState<TickerEntry[] | null>(null);
  // Append-order DOM (frozen ticker-slice contract); CSS flips the view.
  const live = events;
  const visible = frozen ?? live;

  const onActivate = (entry: TickerEntry): void => {
    // Click an entity-linked entry → select that card/agent (the board
    // highlights the selection; the v1 camera jump is retired with the map).
    if (entry.entityId === undefined) return;
    store.getState().clickSelect(entry.entityId, false);
  };

  return (
    <section className="wr-panel wr-ticker" data-testid="event-ticker" aria-label="Event stream">
      <div className="wr-panel-title">
        COMMS
        {frozen !== null && <span className="wr-ticker-hold">HOLD</span>}
      </div>
      <ol
        className="wr-ticker-list"
        onMouseEnter={() => setFrozen(live)}
        onMouseLeave={() => setFrozen(null)}
      >
        {visible.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              data-testid="ticker-item"
              className={clsx(
                'wr-ticker-item',
                `wr-ticker-item--${entry.severity}`,
                entry.entityId !== undefined && 'wr-ticker-item--linked',
              )}
              onClick={() => onActivate(entry)}
            >
              <span
                className="wr-ticker-glyph"
                dangerouslySetInnerHTML={{ __html: glyphSvg(entry.severity) }}
              />
              <span className="wr-ticker-ts">{formatClock(entry.ts, simStartMs)}</span>
              <span className="wr-ticker-text">{entry.text}</span>
            </button>
          </li>
        ))}
        {visible.length === 0 && <li className="wr-ticker-empty">awaiting fleet activity…</li>}
      </ol>
    </section>
  );
}
