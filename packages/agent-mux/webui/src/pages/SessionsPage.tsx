import React, { useMemo } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Link } from 'react-router-dom-v6';
import { useGateway } from '@a5c-ai/agent-mux-ui';

type SessionCost = {
  totalUsd?: number;
};

type SessionRow = {
  sessionId: string;
  agent: string;
  status: string;
  activeRunId: string | null;
  latestRunId: string | null;
  updatedAt: number;
  title: string | null;
  turnCount: number | null;
  messageCount: number | null;
  costTotalUsd: number | null;
};

function formatUsd(totalUsd: number | null): string | null {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return null;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: totalUsd >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  }).format(totalUsd);
}

export function SessionsPage(): JSX.Element {
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const runs = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const eventBuffers = useStore(store, (state) => state.events.byRunId);

  const rows = useMemo<SessionRow[]>(
    () =>
      sessions
        .map((session) => {
          const sessionId = String(session.sessionId);
          const fallbackCostTotalUsd = runs
            .filter((run) => String(run.sessionId ?? '') === sessionId)
            .reduce((sum, run) => {
              const runId = String(run.runId ?? '');
              const buffer = eventBuffers[runId];
              if (!buffer) {
                return sum;
              }
              return sum + buffer.events.reduce((runSum, event) => {
                if (event.type !== 'cost') {
                  return runSum;
                }
                const cost = event.cost;
                if (!cost || typeof cost !== 'object') {
                  return runSum;
                }
                return runSum + Number((cost as SessionCost).totalUsd ?? 0);
              }, 0);
            }, 0);

          return {
            sessionId,
            agent: String(session.agent ?? 'unknown'),
            status: String(session.status ?? 'inactive'),
            activeRunId: typeof session.activeRunId === 'string' ? session.activeRunId : null,
            latestRunId: typeof session.latestRunId === 'string' ? session.latestRunId : null,
            updatedAt: Number(session.updatedAt ?? 0),
            title: typeof session.title === 'string' ? session.title : null,
            turnCount: typeof session.turnCount === 'number' ? session.turnCount : null,
            messageCount: typeof session.messageCount === 'number' ? session.messageCount : null,
            costTotalUsd:
              session.cost && typeof session.cost === 'object' && typeof (session.cost as SessionCost).totalUsd === 'number'
                ? (session.cost as SessionCost).totalUsd ?? null
                : fallbackCostTotalUsd > 0
                  ? fallbackCostTotalUsd
                  : null,
          };
        })
        .sort((left, right) => right.updatedAt - left.updatedAt),
    [eventBuffers, runs, sessions],
  );

  const activeSessions = rows.filter((session) => session.status === 'active');
  const inactiveSessions = rows.filter((session) => session.status !== 'active');
  const totalCost = rows.reduce((sum, session) => sum + (session.costTotalUsd ?? 0), 0);

  return (
    <section className="flow-grid">
      <article className="panel hero-panel">
        <p className="eyebrow">Sessions</p>
        <h2>Resume conversations, not just runs</h2>
        <p className="lede">
          The browser keeps active and inactive sessions on the same surface so you can continue
          work, inspect cost, and jump back into the live chat without hunting through run ids.
        </p>
        <div className="summary-grid sessions-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Active</span>
            <strong>{activeSessions.length}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Inactive</span>
            <strong>{inactiveSessions.length}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Tracked sessions</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Observed cost</span>
            <strong>{rows.length > 0 ? formatUsd(totalCost) ?? 'unavailable' : 'No usage yet'}</strong>
          </div>
        </div>
      </article>

      <article className="panel">
        <header>
          <div>
            <p className="eyebrow">Sessions</p>
            <h2>Active Sessions</h2>
          </div>
          <Link to="/sessions/new">Start session</Link>
        </header>
        <div className="list-grid">
          {activeSessions.map((session) => (
            <article key={session.sessionId} className="list-card">
              <div className="list-card-main">
                <strong>{session.sessionId}</strong>
                <span className="meta-chip">{session.agent}</span>
                <span className="status-badge status-active">active</span>
              </div>
              <p className="muted-copy">
                {session.title ?? 'Untitled session'}
                {session.messageCount != null ? ` · ${session.messageCount} messages` : ''}
                {session.turnCount != null ? ` · ${session.turnCount} turns` : ''}
                {formatUsd(session.costTotalUsd) ? ` · ${formatUsd(session.costTotalUsd)}` : ''}
              </p>
              <div className="actions">
                <Link className="ghost-link" to={`/sessions/${session.sessionId}`}>
                  Open chat
                </Link>
              </div>
            </article>
          ))}
          {activeSessions.length === 0 ? (
            <div className="empty-card">
              <strong>No active sessions right now.</strong>
              <p className="muted-copy">
                Start a session from here or reopen an inactive conversation when you want to keep
                the same context.
              </p>
              <div className="actions">
                <Link className="ghost-link" to="/sessions/new">
                  Start session
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </article>

      <article className="panel">
        <header>
          <div>
            <p className="eyebrow">Sessions</p>
            <h2>Inactive Sessions</h2>
          </div>
        </header>
        <div className="list-grid">
          {inactiveSessions.map((session) => (
            <article key={session.sessionId} className="list-card">
              <div className="list-card-main">
                <strong>{session.sessionId}</strong>
                <span className="meta-chip">{session.agent}</span>
                <span className="status-badge status-inactive">inactive</span>
              </div>
              <p className="muted-copy">
                {session.title ?? 'Untitled session'}
                {session.messageCount != null ? ` · ${session.messageCount} messages` : ''}
                {session.turnCount != null ? ` · ${session.turnCount} turns` : ''}
                {formatUsd(session.costTotalUsd) ? ` · ${formatUsd(session.costTotalUsd)}` : ''}
              </p>
              <div className="actions">
                <Link className="ghost-link" to={`/sessions/${session.sessionId}`}>
                  Open session
                </Link>
                <Link className="ghost-link" to={`/sessions/${session.sessionId}?compose=1`}>
                  Continue
                </Link>
              </div>
            </article>
          ))}
          {inactiveSessions.length === 0 ? (
            <div className="empty-card">
              <strong>No inactive sessions yet.</strong>
              <p className="muted-copy">
                Completed or paused session threads will stay here so they can be resumed without
                losing their conversation history.
              </p>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
