import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  name: string;
  scope: string;
  agent?: string;
  model?: string;
  corrupt?: boolean;
}

function ProfilesView({ client, active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    (async () => {
      try {
        const list = await client.profiles.list();
        setRows(
          list.map((p) => ({
            name: p.name,
            scope: p.scope,
            agent: p.agent,
            model: p.model,
            corrupt: p.corrupt,
          })),
        );
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [active, client]);
  if (error) return <Text color="red">{error}</Text>;
  if (rows.length === 0) return <Text dimColor>No profiles configured.</Text>;
  return (
    <Box flexDirection="column">
      <Text bold>RunOptions profiles</Text>
      {rows.map((r) => (
        <Text key={r.scope + ':' + r.name}>
          <Text color={r.corrupt ? 'red' : 'cyan'}>{r.name.padEnd(20)}</Text>{' '}
          <Text dimColor>[{r.scope}]</Text>{' '}
          {r.agent ? <Text>{r.agent}</Text> : null}
          {r.model ? <Text dimColor> {r.model}</Text> : null}
          {r.corrupt ? <Text color="red"> (corrupt)</Text> : null}
        </Text>
      ))}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:profiles-view',
  register(ctx) {
    ctx.registerView({
      id: 'profiles',
      title: 'Profiles',
      hotkey: '6',
      component: ProfilesView,
    });
  },
});
