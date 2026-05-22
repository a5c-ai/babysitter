import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  agent: string;
  pluginName: string;
  enabled?: boolean;
  version?: string;
  scope?: string;
}

function PluginsView({ client, active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    (async () => {
      try {
        const all: Row[] = [];
        for (const a of client.adapters.list()) {
          try {
            const list = await client.plugins.list(a.agent);
            for (const p of list) {
              const rec = p as { name?: string; pluginName?: string; pluginId?: string; enabled?: boolean; version?: string; scope?: string };
              all.push({
                agent: a.agent,
                pluginName: rec.name ?? rec.pluginName ?? rec.pluginId ?? '(unknown)',
                enabled: rec.enabled,
                version: rec.version,
                scope: rec.scope,
              });
            }
          } catch {
            // adapter may not support plugin listing — skip
          }
        }
        setRows(all);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [active, client]);
  if (error) return <Text color="red">{error}</Text>;
  if (rows.length === 0) return <Text dimColor>No agent-native plugins discovered.</Text>;
  return (
    <Box flexDirection="column">
      <Text bold>Agent-native plugins</Text>
      <Text dimColor>(see also: amux plugin / amux mcp)</Text>
      {rows.slice(0, 40).map((r, i) => (
        <Text key={r.agent + ':' + r.pluginName + ':' + i}>
          <Text color="cyan">{r.agent.padEnd(14)}</Text>{' '}
          <Text>{r.pluginName}</Text>
          {r.version ? <Text dimColor> v{r.version}</Text> : null}
          {r.enabled === false ? <Text color="gray"> (disabled)</Text> : null}
          {r.scope ? <Text dimColor> [{r.scope}]</Text> : null}
        </Text>
      ))}
      {rows.length > 40 ? <Text dimColor>… {rows.length - 40} more</Text> : null}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:plugins-view',
  register(ctx) {
    ctx.registerView({
      id: 'plugins',
      title: 'Plugins',
      hotkey: '7',
      component: PluginsView,
    });
  },
});
