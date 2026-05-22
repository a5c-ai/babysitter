import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Totals {
  usd: number;
  inputTokens: number;
  outputTokens: number;
}

interface State {
  total: Totals;
  byAgent: Map<string, Totals>;
}

function emptyTotals(): Totals {
  return { usd: 0, inputTokens: 0, outputTokens: 0 };
}

function reduce(state: State, ev: AgentEvent): State {
  const agent = String((ev as { agent?: string }).agent ?? 'unknown');
  const perAgent = state.byAgent.get(agent) ?? emptyTotals();
  let { usd, inputTokens, outputTokens } = state.total;
  if (ev.type === 'cost') {
    const add = ev.cost.totalUsd ?? 0;
    usd += add;
    perAgent.usd += add;
  } else if (ev.type === 'token_usage') {
    inputTokens += ev.inputTokens;
    outputTokens += ev.outputTokens;
    perAgent.inputTokens += ev.inputTokens;
    perAgent.outputTokens += ev.outputTokens;
  } else {
    return state;
  }
  const byAgent = new Map(state.byAgent);
  byAgent.set(agent, perAgent);
  return { total: { usd, inputTokens, outputTokens }, byAgent };
}

function CostView({ eventStream }: TuiViewProps) {
  const [state, setState] = useState<State>(() => {
    let s: State = { total: emptyTotals(), byAgent: new Map() };
    for (const ev of eventStream.snapshot()) s = reduce(s, ev);
    return s;
  });

  useEffect(() => {
    // Re-sync from snapshot in case events arrived between render and subscribe.
    setState(() => {
      let s: State = { total: emptyTotals(), byAgent: new Map() };
      for (const ev of eventStream.snapshot()) s = reduce(s, ev);
      return s;
    });
    return eventStream.subscribe((ev) => {
      setState((prev) => reduce(prev, ev));
    });
  }, [eventStream]);

  const rows = Array.from(state.byAgent.entries()).sort((a, b) => b[1].usd - a[1].usd);

  return (
    <Box flexDirection="column">
      <Text bold>
        Total: <Text color="yellow">${state.total.usd.toFixed(4)}</Text>{' '}
        <Text dimColor>
          (in {state.total.inputTokens} / out {state.total.outputTokens})
        </Text>
      </Text>
      <Text dimColor>─ per agent ─</Text>
      {rows.length === 0 ? (
        <Text dimColor>No cost events observed yet.</Text>
      ) : (
        rows.map(([agent, t]) => (
          <Text key={agent}>
            <Text color="cyan">{agent}</Text>{'  '}
            <Text color="yellow">${t.usd.toFixed(4)}</Text>{'  '}
            <Text dimColor>
              in {t.inputTokens} / out {t.outputTokens}
            </Text>
          </Text>
        ))
      )}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:cost-view',
  register(ctx) {
    ctx.registerView({
      id: 'cost',
      title: 'Cost',
      hotkey: '3',
      component: CostView,
    });
  },
});
