import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  agent: string;
  status: string;
  method: string;
  identity: string;
  error?: string;
}

function statusColor(status: string): 'green' | 'yellow' | 'red' {
  if (status === 'authenticated') return 'green';
  if (status === 'unauthenticated') return 'yellow';
  return 'red';
}

function AuthView({ client, active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [tick, setTick] = useState(0);

  useInput(
    (input) => {
      if (input === 'R') setTick((t) => t + 1);
    },
    { isActive: active },
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const list = client.adapters.list();
    void (async () => {
      const out: Row[] = [];
      for (const a of list) {
        try {
          const state = (await client.auth.check(a.agent as never)) as unknown as Record<string, unknown>;
          out.push({
            agent: a.agent,
            status: String(state['status'] ?? 'unknown'),
            method: String(state['method'] ?? '-'),
            identity: String(state['identity'] ?? ''),
          });
        } catch (e) {
          out.push({
            agent: a.agent,
            status: 'error',
            method: '-',
            identity: '',
            error: (e as Error).message,
          });
        }
      }
      if (!cancelled) setRows(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, client, tick]);

  return (
    <Box flexDirection="column">
      <Text bold>Authentication status</Text>
      {rows.length === 0 ? (
        <Text dimColor>(probing adapters…)</Text>
      ) : (
        rows.map((r) => (
          <Text key={r.agent}>
            <Text color="cyan">{r.agent.padEnd(14)}</Text>{' '}
            <Text color={statusColor(r.status)}>{r.status.padEnd(16)}</Text>{' '}
            <Text dimColor>{r.method.padEnd(14)}</Text>{' '}
            <Text>{r.identity || (r.error ?? '')}</Text>
          </Text>
        ))
      )}
      <Text dimColor>R: refresh · run `amux auth setup &lt;agent&gt;` to configure</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:auth-view',
  register(ctx) {
    ctx.registerView({
      id: 'auth',
      title: 'Auth',
      hotkey: 'A',
      component: AuthView,
    });
  },
});
