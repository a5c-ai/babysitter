/**
 * WarRoom (SPEC §4 as amended by SPEC-V3): the single full-viewport screen.
 *
 *   TopBar (brass, top) — resources + memory/create buttons + sim clock
 *   THE COGITATOR BOARD (fills everything) — five kanban lanes (§V3-1)
 *   Inquiry Dock (bottom-left above the ticker, §V3-5 — replaced AlertBanner)
 *   Bottom HUD row: EventTicker | SelectionPanel | CommandCard
 *   Inspector (right slide-over, tabbed §V2-5/§V2-7) + Human Review panel
 *   (§V3-4) + SteerModal + Foundry + Archive overlay
 *   Narrow-viewport gate (<1100px, SPEC §15)
 *
 * The map canvas, minimap, marquee, link/ping layers and camera are RETIRED
 * (SPEC-V3 header). Keyboard grammar attaches window-scoped via attachInput.
 */

import { useEffect } from 'react';

import { attachInput } from '../game/input';
import type { CommanderStore, Orders } from '../game/store';
import type { SimViews } from '../game/views';
import { KanbanBoard } from './board/KanbanBoard';
import { ChatDock } from './hud/ChatDock';
import { CommandCard } from './hud/CommandCard';
import { EventTicker } from './hud/EventTicker';
import { SelectionPanel } from './hud/SelectionPanel';
import { TopBar } from './hud/TopBar';
import { CardEditor } from './panels/CardEditor';
import { Foundry } from './panels/Foundry';
import { IdeOverlay } from './panels/IdeOverlay';
import { Inspector } from './panels/Inspector';
import { MemoryOverlay } from './panels/MemoryOverlay';
import { ReviewPanel } from './panels/ReviewPanel';
import { RunsOverlay } from './panels/RunsOverlay';
import { SteerModal } from './panels/SteerModal';

export interface WarRoomProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
}

export function WarRoom({ store, orders, views }: WarRoomProps): React.JSX.Element {
  useEffect(() => attachInput({ store, orders }), [store, orders]);

  return (
    <div className="wr-root" data-testid="war-room">
      <TopBar store={store} orders={orders} />
      <KanbanBoard store={store} orders={orders} />
      <ChatDock store={store} orders={orders} />
      <div className="wr-bottom-row">
        <EventTicker store={store} />
        <SelectionPanel store={store} views={views} />
        <CommandCard store={store} orders={orders} />
      </div>
      <Inspector store={store} orders={orders} views={views} />
      <ReviewPanel store={store} orders={orders} views={views} />
      <SteerModal store={store} orders={orders} />
      <Foundry store={store} orders={orders} views={views} />
      <CardEditor store={store} orders={orders} views={views} />
      <MemoryOverlay store={store} />
      <RunsOverlay store={store} orders={orders} views={views} />
      <IdeOverlay store={store} orders={orders} views={views} />
      <div className="wr-narrow-gate" role="note">
        <div className="wr-narrow-gate-card">
          <h1>A5C Commander</h1>
          <p>the cogitator requires a wider plate — widen the window to at least 1100px.</p>
        </div>
      </div>
    </div>
  );
}
