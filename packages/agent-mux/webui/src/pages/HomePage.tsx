import React, { useMemo } from 'react';
import { Link } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useGateway } from '@a5c-ai/agent-mux-ui';

import { PageHeroGrid, PageSection, PageShell } from '../components/shared/page-shell.js';

function readWorkspacePath(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.currentPath === 'string' && record.currentPath.length > 0) {
    return record.currentPath;
  }
  if (typeof record.workspaceDefaultCwd === 'string' && record.workspaceDefaultCwd.length > 0) {
    return record.workspaceDefaultCwd;
  }
  if (typeof record.workspaceRootPath === 'string' && record.workspaceRootPath.length > 0) {
    return record.workspaceRootPath;
  }
  return null;
}

function formatUpdatedAt(updatedAt: number): string {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) {
    return 'No heartbeat yet';
  }
  return new Date(updatedAt).toLocaleString();
}

function workspaceHref(path: string): string {
  return `/workspaces?workspace=${encodeURIComponent(path)}`;
}

export function HomePage(): JSX.Element {
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const agents = useStore(store, (state) => state.agents.items);

  const orderedSessions = useMemo(
    () =>
      [...sessions]
        .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0))
        .slice(0, 6),
    [sessions],
  );

  const activeCount = sessions.filter((session) => session.status === 'active').length;
  const inactiveCount = sessions.filter((session) => session.status !== 'active').length;
  const workspaceLinkedCount = sessions.filter((session) => {
    if (typeof session.cwd === 'string' && session.cwd.length > 0) {
      return true;
    }
    return readWorkspacePath(session.workspace) != null;
  }).length;

  return (
    <PageShell>
      <PageSection>
        <PageHeroGrid className="session-browser__hero-grid">
          <div className="session-browser__hero-copy">
            <p className="page-kicker">Workbench</p>
            <h1 className="page-title">Plan in projects. Work inside sessions. Ship from workspaces.</h1>
            <p className="page-copy page-copy--wide">
              The web UI works best when planning, conversation, and workspace control stay connected.
              Start from projects, continue in the session chat, and keep the linked workspace beside
              that conversation instead of splitting the workflow across unrelated pages.
            </p>
            <div className="page-actions">
              <Link to="/projects" className="session-browser__action session-browser__action--primary">
                Open projects
              </Link>
              <Link to="/sessions" className="session-browser__action">
                Open sessions
              </Link>
              <Link to="/workspaces" className="session-browser__action">
                Open workspaces
              </Link>
            </div>
          </div>

          <div className="session-browser__hero-kpis">
            <div className="summary-card">
              <span className="summary-label">Live sessions</span>
              <strong>{activeCount}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Paused sessions</span>
              <strong>{inactiveCount}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Workspace-linked</span>
              <strong>{workspaceLinkedCount}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Available agents</span>
              <strong>{agents.length}</strong>
            </div>
          </div>
        </PageHeroGrid>
      </PageSection>

      <PageSection inset>
        <div className="session-browser__section-header">
          <div>
            <p className="page-kicker page-kicker--compact">Focus</p>
            <h2 className="page-title page-title--secondary">The main unit is the conversation, not the dispatch id.</h2>
            <p className="page-copy">
              Projects decide what to work on. Sessions hold the live transcript and next turn.
              Workspaces keep the code, runtime, and review context attached to that same thread.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="summary-card">
            <span className="summary-label">Plan</span>
            <strong>Drive the board from projects</strong>
            <p className="muted-copy">Backlog, workspace creation, and review handoff stay in one project surface.</p>
          </div>
          <div className="summary-card">
            <span className="summary-label">Work</span>
            <strong>Keep the chat visible</strong>
            <p className="muted-copy">Session detail is now a chat-first shell with transcript, flow, and runtime beside it.</p>
          </div>
          <div className="summary-card">
            <span className="summary-label">Ship</span>
            <strong>Operate from the workspace shell</strong>
            <p className="muted-copy">The selected workspace now shows the associated session chat instead of hiding it on another route.</p>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="session-browser__section-header">
          <div>
            <p className="page-kicker page-kicker--compact">Recent</p>
            <h2 className="page-title page-title--secondary">Resume the most recent conversations</h2>
            <p className="page-copy">
              Open the chat directly, or jump into the linked workspace when you need the code and runtime around it.
            </p>
          </div>
          <div className="page-actions">
            <Link to="/sessions" className="session-browser__action">
              View all sessions
            </Link>
          </div>
        </div>

        <div className="session-browser__row-list">
          {orderedSessions.map((session) => {
            const workspacePath =
              typeof session.cwd === 'string' && session.cwd.length > 0
                ? session.cwd
                : readWorkspacePath(session.workspace);
            const runId =
              typeof session.activeRunId === 'string'
                ? session.activeRunId
                : typeof session.latestRunId === 'string'
                  ? session.latestRunId
                  : null;

            return (
              <article key={String(session.sessionId)} className="session-browser__row">
                <div className="session-browser__row-main">
                  <div className="session-browser__row-copy">
                    <div className="session-browser__row-topline">
                      <h3>{String(session.title ?? session.sessionId)}</h3>
                      <span className={`status-badge status-${String(session.status ?? 'inactive')}`}>
                        {String(session.status ?? 'inactive')}
                      </span>
                      <span className="meta-chip">{String(session.agent ?? 'unknown')}</span>
                    </div>
                    <div className="session-browser__meta-row">
                      <span className="page-chip page-chip--muted">{String(session.sessionId)}</span>
                      <span className="page-chip page-chip--muted">Updated {formatUpdatedAt(Number(session.updatedAt ?? 0))}</span>
                    </div>
                    {workspacePath ? (
                      <div className="session-browser__path" title={workspacePath}>
                        {workspacePath}
                      </div>
                    ) : null}
                  </div>

                  <div className="session-browser__actions">
                    <Link to={`/sessions/${session.sessionId}`} className="session-browser__action session-browser__action--primary">
                      Open chat
                    </Link>
                    {workspacePath ? (
                      <Link to={workspaceHref(workspacePath)} className="session-browser__action">
                        Workspace
                      </Link>
                    ) : null}
                    {runId ? (
                      <Link to={`/dispatches/${runId}`} className="session-browser__action">
                        Dispatch handoff
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
          {orderedSessions.length === 0 ? (
            <div className="empty-card">
              <strong>No sessions have been created yet.</strong>
              <p className="muted-copy">Start from projects or create a new session to begin a chat-first workflow.</p>
            </div>
          ) : null}
        </div>
      </PageSection>
    </PageShell>
  );
}
