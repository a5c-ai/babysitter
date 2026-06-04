import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

interface Row {
  agent: string;
  caps: Record<string, boolean | string | number>;
}

const FLAGS: { key: string; label: string }[] = [
  { key: 'supportsMultiTurn', label: 'multi-turn' },
  { key: 'supportsMCP', label: 'mcp' },
  { key: 'supportsPlugins', label: 'plugins' },
  { key: 'supportsSkills', label: 'skills' },
  { key: 'supportsThinking', label: 'thinking' },
  { key: 'supportsImageInput', label: 'image-in' },
  { key: 'supportsTextStreaming', label: 'text-stream' },
  { key: 'supportsToolCallStreaming', label: 'tool-stream' },
];

function DoctorView({ client, active }: TuiViewProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    try {
      const all: Row[] = [];
      for (const a of client.adapters.list()) {
        const caps = client.adapters.capabilities(a.agent) as unknown as Record<string, unknown>;
        const trimmed: Record<string, boolean | string | number> = {};
        for (const f of FLAGS) {
          const v = caps[f.key];
          trimmed[f.key] = typeof v === 'boolean' ? v : false;
        }
        all.push({ agent: a.agent, caps: trimmed });
      }
      setRows(all);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  }, [active, client]);

  if (error) return <Text color="red">{error}</Text>;
  if (rows.length === 0) return <Text dimColor>No adapters registered.</Text>;
  return (
    <Box flexDirection="column">
      <Text bold>Adapter capability matrix</Text>
      <Text dimColor>
        {' '.padEnd(14)} {FLAGS.map((f) => f.label.padEnd(11)).join('')}
      </Text>
      {rows.map((r) => (
        <Text key={r.agent}>
          <Text color="cyan">{r.agent.padEnd(14)}</Text>
          {FLAGS.map((f) => {
            const v = r.caps[f.key];
            return (
              <Text key={f.key} color={v ? 'green' : 'gray'}>
                {(v ? '  yes' : '   no').padEnd(11)}
              </Text>
            );
          })}
        </Text>
      ))}
      <Text> </Text>
      <Text dimColor>Use Models view (5) and Profiles view (6) for run-side config.</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:doctor-view',
  register(ctx) {
    ctx.registerView({
      id: 'doctor',
      title: 'Doctor',
      hotkey: '-',
      component: DoctorView,
    });
  },
});
