import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';
import { truncateMiddle, visibleWindow } from '../layout.js';

interface Row {
  sessionId: string;
  agent: string;
}

function SessionsView({ client, active, emit, activeSessions, pluginEpoch, viewport }: TuiViewProps) {
  const [sessions, setSessions] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number>(0);

  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setCursor(0);
        setSessions([]);
        const agents = client.adapters.list();
        const rowsByAgent = new Map<string, Row[]>();
        const mergeRows = () =>
          agents.flatMap((ad) => rowsByAgent.get(ad.agent) ?? []).slice(0, 50);

        await Promise.all(
          agents.map(async (ad) => {
            try {
              const list = await client.sessions.list(ad.agent, { limit: 20 });
              rowsByAgent.set(
                ad.agent,
                list.map((s) => ({ sessionId: s.sessionId, agent: ad.agent })),
              );
              if (!cancelled) {
                setSessions(mergeRows());
              }
            } catch {
              // ignore per-agent listing errors (e.g. adapter without sessions)
            }
          }),
        );
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, client, pluginEpoch, refreshTick]);

  useInput(
    (input, key) => {
      const isSubmitKey = key.return || input === '\r' || input === '\n';
      if (sessions.length === 0) return;
      if (key.downArrow) setCursor((c) => Math.min(c + 1, sessions.length - 1));
      else if (key.upArrow) setCursor((c) => Math.max(c - 1, 0));
      else if (isSubmitKey) {
        const sel = sessions[cursor];
        if (!sel) return;
        emit({ type: 'session:select', agent: sel.agent, sessionId: sel.sessionId });
        emit({ type: 'view:switch', id: 'chat' });
      } else if (input === 'd') {
        const sel = sessions[cursor];
        if (!sel) return;
        emit({ type: 'session:detail', agent: sel.agent, sessionId: sel.sessionId });
        emit({ type: 'view:switch', id: 'session-detail' });
      } else if (input === 'D') {
        const sel = sessions[cursor];
        if (!sel) return;
        emit({ type: 'session:diff', agent: sel.agent, sessionId: sel.sessionId });
      } else if (input === 'R') {
        setRefreshTick((t) => t + 1);
      }
    },
    { isActive: active },
  );

  if (error) return <Text color="red">{error}</Text>;
  if (sessions.length === 0) return <Text dimColor>No sessions found.</Text>;
  const visibleCount = Math.max(3, viewport?.listRowLimit ?? 12);
  const { start, end } = visibleWindow(cursor, sessions.length, visibleCount);
  const visibleSessions = sessions.slice(start, end);
  const compact = Boolean(viewport?.isNarrow);
  const rowWidth = Math.max(12, (viewport?.contentWidth ?? 76) - 8);
  const headerHint = compact
    ? 'Enter resume · d details · D diff · R refresh'
    : '↑/↓ navigate · Enter: resume · d: details · D: mark/diff · R: refresh';
  return (
    <Box flexDirection="column">
      {start > 0 ? <Text dimColor>… {start} earlier</Text> : null}
      {visibleSessions.map((s, i) => {
        const absoluteIndex = start + i;
        const selected = absoluteIndex === cursor;
        const isActive = activeSessions?.has(`${s.agent}:${s.sessionId}`) ?? false;
        const sessionText = compact
          ? truncateMiddle(s.sessionId, Math.max(8, rowWidth - s.agent.length - 3))
          : s.sessionId;
        return (
          <Text key={s.agent + ':' + s.sessionId} color={selected ? 'green' : undefined}>
            {selected ? '> ' : '  '}
            {isActive ? <Text color="yellow">● </Text> : <Text>  </Text>}
            <Text color="cyan">{s.agent}</Text> {sessionText}
          </Text>
        );
      })}
      {end < sessions.length ? <Text dimColor>… {sessions.length - end} more</Text> : null}
      <Text dimColor>{headerHint}</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:sessions-view',
  register(ctx) {
    ctx.registerView({
      id: 'sessions',
      title: 'Sessions',
      hotkey: '2',
      component: SessionsView,
    });
  },
});
