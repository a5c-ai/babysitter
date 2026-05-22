import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useConnection, useGateway } from '@a5c-ai/agent-mux-ui';
import { Button } from '@a5c-ai/compendium';
import { Command, PlayCircle } from 'lucide-react';

import { titleForPath } from './navigation.js';

function topBarMeta(pathname: string): { label: string; subtitle?: string } {
  if (pathname.startsWith('/sessions/pending/')) {
    return {
      label: 'Dispatch handoff',
      subtitle: 'Promoting this dispatch into a durable chat.',
    };
  }
  if (/^\/(?:dispatches|runs)\/[^/]+$/.test(pathname)) {
    return {
      label: 'Dispatch handoff',
      subtitle: 'Opening the bound session chat for this dispatch.',
    };
  }
  if (pathname.startsWith('/sessions/')) {
    return {
      label: 'Chat',
    };
  }
  if (pathname === '/sessions') {
    return {
      label: 'Directory',
    };
  }
  if (pathname.startsWith('/workspaces')) {
    return {
      label: 'Workspace',
    };
  }
  if (pathname.startsWith('/projects/')) {
    return {
      label: 'Board',
    };
  }
  if (pathname.startsWith('/dispatches') || pathname.startsWith('/runs')) {
    return {
      label: 'Dispatch queue',
    };
  }
  if (pathname === '/inbox') {
    return {
      label: 'Attention',
    };
  }
  return {
    label: 'Workspace',
  };
}

export function TopBar(props: { pathname: string; onOpenPalette(): void }): JSX.Element {
  const navigate = useNavigate();
  const connection = useConnection();
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const runs = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const meta = useMemo(() => topBarMeta(props.pathname), [props.pathname]);
  const compactTopBar = !meta.subtitle;
  const activeSessions = useMemo(
    () => sessions.filter((session) => session.status === 'active').length,
    [sessions],
  );
  const runningRuns = useMemo(
    () => runs.filter((run) => run.status === 'running').length,
    [runs],
  );

  return (
    <header className={`app-topbar${compactTopBar ? ' app-topbar--compact' : ''}`}>
      <div className="app-topbar__copy">
        <div className="app-topbar__title-row">
          <h2>{titleForPath(props.pathname)}</h2>
          <span className="connection-pill app-topbar__chip app-topbar__chip--route">{meta.label}</span>
          <span
            className={`connection-pill connection-${connection.status}`}
            data-testid="topbar-connection-status"
          >
            {connection.status}
          </span>
        </div>
        {meta.subtitle ? <p className="app-topbar__subtitle">{meta.subtitle}</p> : null}
      </div>

      <div className="app-topbar__actions">
        <div className="app-topbar__chips">
          <span className="connection-pill app-topbar__chip">
            {activeSessions} active
          </span>
          <span className="connection-pill app-topbar__chip">
            {runningRuns} dispatching
          </span>
        </div>

        <details className="app-topbar__details" data-testid="topbar-tools-details">
          <summary className="app-topbar__details-summary">
            Tools
          </summary>
          <div className="app-topbar__details-body">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => window.dispatchEvent(new Event('open-shortcuts-help'))}
            >
              Shortcuts
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={props.onOpenPalette}>
              <Command className="h-4 w-4" />
              Command palette
            </Button>
          </div>
        </details>
        <div className="app-topbar__buttons">
          <Button type="button" size="sm" onClick={() => navigate('/sessions/new')}>
            <PlayCircle className="h-4 w-4" />
            New session
          </Button>
        </div>
      </div>
    </header>
  );
}
