import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  agent: string;
  displayName: string;
  cliCommand: string;
  source: string;
}

function AdaptersView({ client, active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!active) return;
    try {
      const list = client.adapters.list();
      setRows(
        list.map((a) => ({
          agent: a.agent,
          displayName: a.displayName,
          cliCommand: a.cliCommand,
          source: a.source,
        })),
      );
    } catch {
      // ignore
    }
  }, [active, client]);
  if (rows.length === 0) return <Text dimColor>No adapters registered.</Text>;
  return (
    <Box flexDirection="column">
      <Text bold>Registered adapters</Text>
      {rows.map((r) => (
        <Text key={r.agent}>
          <Text color="cyan">{r.agent.padEnd(14)}</Text>{' '}
          {r.displayName.padEnd(20)}{' '}
          <Text dimColor>{r.cliCommand}</Text>{' '}
          <Text color={r.source === 'built-in' ? 'green' : 'magenta'}>[{r.source}]</Text>
        </Text>
      ))}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:adapters-view',
  register(ctx) {
    ctx.registerView({
      id: 'adapters',
      title: 'Adapters',
      hotkey: '4',
      component: AdaptersView,
    });
  },
});
