/**
 * AlertBanner (SPEC §4/§5, AC6): top-center "base under attack" banner shown
 * while approvals pend. Queue UI: shows the MOST URGENT alert (earliest
 * deadline) plus a "+N more" count; clicking the banner cycles through the
 * queue; Approve/Deny act on the shown alert only. Space (handled in
 * input.ts) still jumps the camera to the latest alert. Hidden (not
 * rendered) when no alerts exist — the e2e suite asserts visibility both
 * ways. Urgent pulse kept restrained per SPEC §10.
 */

import { useState } from 'react';
import { useStore } from 'zustand';

import { nextAlert, resolveShownAlert } from '../../game/alertQueue';
import type { CommanderStore, Orders } from '../../game/store';
import { generateIcon } from '../../microagent/mock/iconGen';

export interface AlertBannerProps {
  store: CommanderStore;
  orders: Orders;
}

export function AlertBanner({ store, orders }: AlertBannerProps): React.JSX.Element | null {
  const alerts = useStore(store, (s) => s.alerts);
  const units = useStore(store, (s) => s.world.units);
  const [shownId, setShownId] = useState<string | null>(null);

  const shown = resolveShownAlert(alerts, shownId);
  if (shown === undefined) return null;

  const unit = units[shown.unitId];
  const unitTitle = unit?.view.title ?? shown.unitId;
  // Portrait of the requesting unit (SPEC §8: icons render everywhere).
  const portrait = generateIcon({
    entityId: shown.unitId,
    kind: 'unit',
    ...(unit !== undefined ? { adapter: unit.view.agent } : {}),
  });
  const action = typeof shown.payload['action'] === 'string' ? shown.payload['action'] : shown.kind;
  const detail = typeof shown.payload['detail'] === 'string' ? shown.payload['detail'] : null;
  /** Full command for hover tooltips — the visible detail may clamp at two lines. */
  const fullCommand = `${unitTitle} wants to ${action}${detail !== null ? ` — ${detail}` : ''}`;
  const more = alerts.length - 1;

  const cycle = (): void => {
    if (alerts.length < 2) return;
    const next = nextAlert(alerts, shown.hookRequestId);
    if (next !== undefined) setShownId(next.hookRequestId);
  };

  const decide = (decision: 'allow' | 'deny') => (e: React.MouseEvent): void => {
    e.stopPropagation(); // the banner body click cycles — buttons must not
    orders.decide(shown.hookRequestId, decision);
  };

  return (
    <div
      className="wr-alert-banner"
      data-testid="alert-banner"
      role="alert"
      onClick={cycle}
      title={more > 0 ? 'Click to cycle through pending alerts' : fullCommand}
    >
      <span className="wr-alert-count" aria-label={`${alerts.length} pending approvals`}>
        {alerts.length}
      </span>
      <span className="wr-alert-portrait" aria-hidden dangerouslySetInnerHTML={{ __html: portrait.svg }} />
      <span className="wr-alert-text" title={fullCommand}>
        <strong>{unitTitle}</strong> wants to {action}
        {detail !== null && <em className="wr-alert-detail">{detail}</em>}
      </span>
      {more > 0 && (
        <button
          type="button"
          className="wr-alert-more"
          onClick={(e) => {
            e.stopPropagation(); // banner body also cycles — don't double-step
            cycle();
          }}
          title="Show the next pending alert"
        >
          +{more} more
        </button>
      )}
      <span className="wr-alert-actions">
        <button
          type="button"
          className="wr-alert-btn wr-alert-btn--approve"
          onClick={decide('allow')}
        >
          Approve
        </button>
        <button
          type="button"
          className="wr-alert-btn wr-alert-btn--deny"
          onClick={decide('deny')}
        >
          Deny
        </button>
      </span>
    </div>
  );
}
