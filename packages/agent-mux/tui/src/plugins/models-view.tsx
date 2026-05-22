import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  agent: string;
  modelId: string;
  provider: string;
  protocol: string;
  source: string;
  isDefault: boolean;
}

function ModelsView({ client, active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!active) return;
    try {
      const all: Row[] = [];
      for (const a of client.adapters.list()) {
        for (const m of client.models.catalog(a.agent)) {
          all.push({
            agent: a.agent,
            modelId: m.modelId,
            provider: m.provider ?? '--',
            protocol: m.protocol ?? '--',
            source: m.source,
            isDefault: m.isDefault,
          });
        }
      }
      setRows(all);
    } catch {
      // ignore
    }
  }, [active, client]);
  if (rows.length === 0) return <Text dimColor>No models discovered.</Text>;
  return (
    <Box flexDirection="column">
      <Text bold>Models per agent</Text>
      {rows.slice(0, 40).map((r, i) => (
        <Text key={r.agent + ':' + r.modelId + ':' + i}>
          <Text color="cyan">{r.agent.padEnd(14)}</Text>{' '}
          <Text>{r.modelId}</Text>
          <Text dimColor>{`  ${r.provider}/${r.protocol}/${r.source}`}</Text>
          {r.isDefault ? <Text color="green"> (default)</Text> : null}
        </Text>
      ))}
      {rows.length > 40 ? <Text dimColor>… {rows.length - 40} more</Text> : null}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:models-view',
  register(ctx) {
    ctx.registerView({
      id: 'models',
      title: 'Models',
      hotkey: '5',
      component: ModelsView,
    });
  },
});
