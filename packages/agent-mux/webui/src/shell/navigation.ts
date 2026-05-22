export function titleForPath(pathname: string): string {
  if (pathname === '/') return 'Projects';
  if (pathname === '/projects') return 'Projects';
  if (/^\/projects\/[^/]+\/board$/.test(pathname)) return 'Project Board';
  if (/^\/projects\/[^/]+\/list$/.test(pathname)) return 'Project List';
  if (/^\/projects\/[^/]+\/issues\/new$/.test(pathname)) return 'New Issue';
  if (/^\/projects\/[^/]+\/issues\/[^/]+$/.test(pathname)) return 'Issue Detail';
  if (/^\/projects\/[^/]+\/workspaces\/new$/.test(pathname)) return 'New Workspace';
  if (/^\/projects\/[^/]+\/issues\/[^/]+\/workspace\/new$/.test(pathname)) return 'Provision Workspace';
  if (pathname === '/dispatches' || pathname === '/runs') return 'Dispatches';
  if (/^\/(?:dispatches|runs)\/[^/]+$/.test(pathname)) return 'Dispatch Detail';
  if (pathname === '/automations') return 'Automations';
  if (pathname === '/sessions') return 'Sessions';
  if (pathname === '/sessions/new') return 'New Session';
  if (pathname.startsWith('/sessions/pending/')) return 'Creating Session';
  if (pathname.startsWith('/sessions/')) return 'Session Chat';
  if (pathname === '/workspaces/new') return 'New Workspace';
  if (/^\/issues\/[^/]+$/.test(pathname)) return 'Issue Detail';
  if (pathname.startsWith('/projects/')) return 'Project';
  if (pathname === '/agents') return 'Agents';
  if (pathname === '/inbox') return 'Hook Inbox';
  if (pathname === '/pair-device') return 'Pair Device';
  if (pathname === '/workspaces') return 'Workspaces';
  if (pathname === '/settings') return 'Settings';
  return pathname;
}

type SessionPaletteRecord = {
  sessionId?: unknown;
  title?: unknown;
  agent?: unknown;
  updatedAt?: unknown;
};

export type SessionPaletteAction = {
  id: string;
  label: string;
  to: string;
};

export function buildRecentSessionActions(
  sessions: SessionPaletteRecord[],
  limit = 8,
): SessionPaletteAction[] {
  return [...sessions]
    .filter(
      (session): session is SessionPaletteRecord & { sessionId: string } =>
        typeof session.sessionId === 'string' && session.sessionId.length > 0,
    )
    .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0))
    .slice(0, limit)
    .map((session) => {
      const sessionId = session.sessionId;
      const title =
        typeof session.title === 'string' && session.title.trim().length > 0
          ? session.title.trim()
          : sessionId;
      const agent =
        typeof session.agent === 'string' && session.agent.length > 0
          ? ` · ${session.agent}`
          : '';

      return {
        id: `session:${sessionId}`,
        label: `Open session ${title}${agent}`,
        to: `/sessions/${sessionId}`,
      };
    });
}
