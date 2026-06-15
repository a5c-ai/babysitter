import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';
import { truncateMiddle } from '../layout.js';

interface DetailState {
  loading: boolean;
  error?: string;
  data?: {
    sessionId: string;
    agent: string;
    turnCount?: number;
    totalCost?: number;
    createdAt?: string;
    updatedAt?: string;
    title?: string;
  };
  exportNote?: string;
}

export function SessionDetailView({
  client,
  active,
  selection,
  emit,
  returnViewId,
  viewport,
}: TuiViewProps) {
  const [state, setState] = useState<DetailState>({ loading: !!selection });

  useEffect(() => {
    if (!selection) {
      setState({ loading: false });
      return;
    }
    setState({ loading: true });
    (async () => {
      try {
        const full = await client.sessions.get(
          selection.agent as never,
          selection.sessionId,
        );
        const f = full as unknown as Record<string, unknown>;
        setState({
          loading: false,
          data: {
            sessionId: selection.sessionId,
            agent: selection.agent,
            turnCount: typeof f.turnCount === 'number' ? f.turnCount : undefined,
            totalCost: typeof f.totalCost === 'number' ? f.totalCost : undefined,
            createdAt: typeof f.createdAt === 'string' ? f.createdAt : undefined,
            updatedAt: typeof f.updatedAt === 'string' ? f.updatedAt : undefined,
            title: typeof f.title === 'string' ? f.title : undefined,
          },
        });
      } catch (e) {
        setState({ loading: false, error: String((e as Error).message ?? e) });
      }
    })();
  }, [selection?.agent, selection?.sessionId, client]);

  async function doExport(format: 'json' | 'markdown') {
    if (!selection) return;
    try {
      const out = await client.sessions.export(
        selection.agent as never,
        selection.sessionId,
        format,
      );
      setState((s) => ({
        ...s,
        exportNote: `exported ${format} (${out.length} chars)`,
      }));
      emit({ type: 'status', message: `Exported ${format} (${out.length} chars)` });
    } catch (e) {
      setState((s) => ({ ...s, exportNote: `export failed: ${(e as Error).message}` }));
    }
  }

  async function doWatch() {
    if (!selection) return;
    setState((s) => ({
      ...s,
      exportNote: 'live watch follows the selected session in chat',
    }));
    emit({ type: 'status', message: `Following ${selection.agent}/${selection.sessionId} in chat…` });
    emit({ type: 'session:select', agent: selection.agent, sessionId: selection.sessionId });
    emit({ type: 'view:switch', id: 'chat' });
  }
  useInput(
    (input, key) => {
      if (!selection) return;
      if (input === 'e') void doExport('json');
      else if (input === 'm') void doExport('markdown');
      else if (input === 'w') void doWatch();
      else if (input === 'r') {
        emit({ type: 'session:select', agent: selection.agent, sessionId: selection.sessionId });
        emit({ type: 'view:switch', id: 'chat' });
      } else if (key.escape || input === 'b') {
        emit({ type: 'view:switch', id: returnViewId ?? 'sessions' });
      }
    },
    { isActive: active },
  );

  if (!selection)
    return <Text dimColor>No session selected. Open the Sessions view and press d.</Text>;
  if (state.loading) return <Text dimColor>Loading session…</Text>;
  if (state.error) return <Text color="red">Error: {state.error}</Text>;
  const d = state.data!;
  const compact = Boolean(viewport?.isNarrow);
  const sessionId = compact
    ? truncateMiddle(d.sessionId, Math.max(12, viewport?.contentWidth ?? 40))
    : d.sessionId;
  const backLabel = returnViewId && returnViewId !== 'sessions' ? `back to ${returnViewId}` : 'back';
  const actionLines = compact
    ? ['e json · m markdown · w follow', `r resume · b/Esc ${backLabel}`]
    : [`e: export json · m: export markdown · w: follow in chat · r: resume · b/Esc: ${backLabel}`];
  return (
    <Box flexDirection="column">
      {compact ? (
        <>
          <Text color="cyan">{d.agent}</Text>
          <Text bold>{sessionId}</Text>
        </>
      ) : (
        <Text>
          <Text color="cyan">{d.agent}</Text> <Text bold>{sessionId}</Text>
        </Text>
      )}
      {d.title ? <Text>title: {d.title}</Text> : null}
      {d.createdAt ? <Text dimColor>created: {d.createdAt}</Text> : null}
      {d.updatedAt ? <Text dimColor>updated: {d.updatedAt}</Text> : null}
      {typeof d.turnCount === 'number' ? <Text>turns: {d.turnCount}</Text> : null}
      {typeof d.totalCost === 'number' ? (
        <Text>cost: ${d.totalCost.toFixed(4)}</Text>
      ) : null}
      {state.exportNote ? <Text color="green">{state.exportNote}</Text> : null}
      {actionLines.map((line) => (
        <Text key={line} dimColor>
          {line}
        </Text>
      ))}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:session-detail-view',
  register(ctx) {
    ctx.registerView({
      id: 'session-detail',
      title: 'Session',
      component: SessionDetailView,
    });
  },
});
