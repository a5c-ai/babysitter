import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  agent: string;
  pluginId: string;
  enabled: boolean;
  error?: string;
  scope?: string;
  command?: string;
}

function McpView({ client, active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useInput(
    (input) => {
      if (input === 'R') setRefreshTick((t) => t + 1);
    },
    { isActive: active },
  );

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const all: Row[] = [];
        for (const a of client.adapters.list()) {
          try {
            const list = await client.plugins.list(a.agent);
            for (const p of list) {
              const rec = p as { pluginId: string; enabled: boolean; format?: string; scope?: string; command?: string; args?: string[] };
              if (rec.format === 'mcp-server' || !rec.format) {
                const cmdStr = [rec.command, ...(rec.args || [])].filter(Boolean).join(' ');
                all.push({ agent: a.agent, pluginId: rec.pluginId, enabled: rec.enabled, scope: rec.scope, command: cmdStr });
              }
            }
          } catch (e) {
            // adapter might not support plugin list
          }
        }
        setRows(all);
      } catch (e) {
        setError(String((e as Error).message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [active, client, refreshTick]);

  if (loading && rows.length === 0) return <Text dimColor>Loading MCP servers…</Text>;
  if (error) return <Text color="red">{error}</Text>;
  if (rows.length === 0)
    return (
      <Box flexDirection="column">
        <Text dimColor>No MCP servers installed.</Text>
        <Text dimColor>Install via: amux mcp install &lt;agent&gt; &lt;server&gt;</Text>
      </Box>
    );
  return (
    <Box flexDirection="column">
      <Text bold>MCP servers per agent</Text>
      {rows.slice(0, 40).map((r, i) => (
        <Text key={r.agent + ':' + r.pluginId + ':' + i}>
          <Text color="cyan">{r.agent.padEnd(14)}</Text>{' '}
          <Text>{r.pluginId}</Text>
          {r.enabled ? <Text color="green"> ✓</Text> : <Text dimColor> (disabled)</Text>}
          {r.scope ? <Text dimColor> [{r.scope}]</Text> : null}
          {r.command ? <Text dimColor> {r.command}</Text> : null}
          {r.error ? <Text color="red"> {r.error}</Text> : null}
        </Text>
      ))}
      {rows.length > 40 ? <Text dimColor>… {rows.length - 40} more</Text> : null}
      <Text dimColor>R: refresh · manage via: amux mcp list|install|uninstall &lt;agent&gt; [server]</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:mcp-view',
  register(ctx) {
    ctx.registerView({
      id: 'mcp',
      title: 'MCP',
      hotkey: '0',
      component: McpView,
    });
  },
});
