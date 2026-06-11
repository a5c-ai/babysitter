/**
 * TopBar (SPEC §4): wordmark left · resources (units/busy · tokens · tasks ·
 * alerts) · sim toggle · sim clock. Counters render in the mono accent with a
 * subtle count-tick animation on change (the value remounts via `key`, so
 * text content stays deterministic — AC13). The alerts counter pulses when
 * non-zero (AC6). data-testids: topbar-units, topbar-tokens, topbar-tasks,
 * topbar-alerts, topbar-sim-toggle, topbar-clock (SPEC §9; tokens/tasks/
 * alerts testids self-identify for AC6/AC14).
 */

import { useStore } from 'zustand';

import { formatClock, formatInt } from '../../game/selectors';
import type { CommanderStore, Orders } from '../../game/store';

export interface TopBarProps {
  store: CommanderStore;
  orders: Orders;
}

/** Remounts on value change → CSS count-tick animation; text stays plain. */
function Num({ text }: { text: string }): React.JSX.Element {
  return (
    <span key={text} className="wr-stat-num">
      {text}
    </span>
  );
}

export function TopBar({ store, orders }: TopBarProps): React.JSX.Element {
  const meta = useStore(store, (s) => s.meta);
  const r = meta.resources;
  return (
    <header className="wr-topbar" data-testid="topbar">
      <div className="wr-topbar-logo">
        A5C <span>Commander</span>
        <em className="wr-topbar-cogitator">The Aegis Cogitator</em>
      </div>
      <div className="wr-topbar-stats">
        <div className="wr-stat" data-testid="topbar-units" title="Active units / busy units">
          <span className="wr-stat-label">UNITS</span>
          <span className="wr-stat-value">
            <Num text={formatInt(r.unitCount)} />
            <em>
              /<Num text={formatInt(r.busyCount)} /> busy
            </em>
          </span>
        </div>
        <div className="wr-stat" data-testid="topbar-tokens" title="Total tokens burned by the fleet">
          <span className="wr-stat-label">TOKENS</span>
          <span className="wr-stat-value">
            <Num text={formatInt(r.tokensBurned)} />
          </span>
        </div>
        <div className="wr-stat" data-testid="topbar-tasks" title="Objectives done / total">
          <span className="wr-stat-label">OBJECTIVES</span>
          <span className="wr-stat-value">
            <Num text={formatInt(r.tasksDone)} />/<Num text={formatInt(r.tasksTotal)} />
          </span>
        </div>
        <div
          className={`wr-stat${r.alertCount > 0 ? ' wr-stat--alert' : ''}`}
          data-testid="topbar-alerts"
          title="Pending approvals"
        >
          <span className="wr-stat-label">ALERTS</span>
          <span className="wr-stat-value">
            <Num text={formatInt(r.alertCount)} />
          </span>
        </div>
      </div>
      <button
        type="button"
        className={`wr-sim-toggle${meta.paused ? ' wr-sim-toggle--paused' : ''}`}
        data-testid="topbar-sim-toggle"
        title={meta.paused ? 'Resume the simulation clock' : 'Pause the simulation clock'}
        onClick={() => orders.toggleSim()}
      >
        {meta.paused ? 'RESUME' : 'PAUSE'}
      </button>
      <div className="wr-topbar-clock" data-testid="topbar-clock" title="Sim clock">
        {formatClock(meta.simTimeMs, meta.simStartMs)}
        {meta.paused && <span className="wr-clock-paused">PAUSED</span>}
      </div>
    </header>
  );
}
