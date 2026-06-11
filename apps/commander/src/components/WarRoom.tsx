/**
 * WarRoom (SPEC §4): the single full-viewport screen.
 *
 *   TopBar (glass, top) — resources + sim clock
 *   MAP VIEWPORT (fills everything) — world, units, tasks, links, pings
 *   AlertBanner (top-center, only while approvals pend)
 *   Minimap (fixed top-right overlay)
 *   Bottom HUD row: EventTicker | SelectionPanel | CommandCard
 *   Inspector (right slide-over) + SteerModal
 *   Narrow-viewport gate (<1100px, SPEC §15)
 *
 * All HUD chrome floats over the map as glass panels (pointer-events pass
 * through the row container so the map stays clickable between panels).
 */

import type { CommanderStore, Orders } from '../game/store';
import { MapViewport } from './map/MapViewport';
import { AlertBanner } from './hud/AlertBanner';
import { CommandCard } from './hud/CommandCard';
import { EventTicker } from './hud/EventTicker';
import { Minimap } from './hud/Minimap';
import { SelectionPanel } from './hud/SelectionPanel';
import { TopBar } from './hud/TopBar';
import { Inspector } from './panels/Inspector';
import { SteerModal } from './panels/SteerModal';

export interface WarRoomProps {
  store: CommanderStore;
  orders: Orders;
}

export function WarRoom({ store, orders }: WarRoomProps): React.JSX.Element {
  return (
    <div className="wr-root" data-testid="war-room">
      <MapViewport store={store} orders={orders} />
      <TopBar store={store} orders={orders} />
      <AlertBanner store={store} orders={orders} />
      <Minimap store={store} />
      <div className="wr-bottom-row">
        <EventTicker store={store} />
        <SelectionPanel store={store} />
        <CommandCard store={store} orders={orders} />
      </div>
      <Inspector store={store} />
      <SteerModal store={store} orders={orders} />
      <div className="wr-narrow-gate" role="note">
        <div className="wr-narrow-gate-card">
          <h1>A5C Commander</h1>
          <p>the cogitator requires a wider plate — widen the window to at least 1100px.</p>
        </div>
      </div>
    </div>
  );
}
