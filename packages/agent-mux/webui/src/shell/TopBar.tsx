import React from 'react';
import { useConnection } from '@a5c-ai/agent-mux-ui';
import { Button } from '@a5c-ai/compendium';

function titleForPath(pathname: string): string {
  if (pathname === '/') return 'Sessions';
  if (pathname === '/sessions') return 'Sessions';
  if (pathname === '/sessions/new') return 'New Session';
  if (pathname.startsWith('/sessions/pending/')) return 'Creating Session';
  if (pathname.startsWith('/sessions/')) return 'Session Chat';
  if (pathname === '/agents') return 'Agents';
  if (pathname === '/inbox') return 'Hook Inbox';
  if (pathname === '/pair-device') return 'Pair Device';
  if (pathname === '/settings') return 'Settings';
  return pathname;
}

export function TopBar(props: { pathname: string; onOpenPalette(): void }): JSX.Element {
  const connection = useConnection();
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Gateway</p>
        <h2>{titleForPath(props.pathname)}</h2>
      </div>
      <div className="topbar-actions">
        <span className={`connection-pill connection-${connection.status}`}>{connection.status}</span>
        <Button type="button" size="sm" onClick={props.onOpenPalette}>
          Command palette
        </Button>
      </div>
    </header>
  );
}
