import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

function ConfigView({ client, active }: TuiViewProps) {
  const [agents, setAgents] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [config, setConfig] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    setAgents(client.adapters.list().map((a) => a.agent));
  }, [active, client]);

  useEffect(() => {
    if (!active || agents.length === 0) return;
    const agent = agents[cursor];
    if (!agent) return;
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const c = await client.config.get(agent as never);
        if (!cancelled) setConfig(c);
      } catch (e) {
        if (!cancelled) {
          setConfig(null);
          setError((e as Error).message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, agents, cursor, client]);

  useInput(
    (_input, key) => {
      if (agents.length === 0) return;
      if (key.downArrow) setCursor((c) => Math.min(c + 1, agents.length - 1));
      else if (key.upArrow) setCursor((c) => Math.max(c - 1, 0));
    },
    { isActive: active },
  );

  const selected = agents[cursor];
  const pretty = config ? JSON.stringify(config, null, 2).split('\n').slice(0, 30) : [];

  return (
    <Box flexDirection="column">
      <Text bold>Per-agent configuration</Text>
      <Box>
        <Box flexDirection="column" width={18}>
          {agents.map((a, i) => (
            <Text key={a} color={i === cursor ? 'cyan' : undefined} bold={i === cursor}>
              {i === cursor ? '› ' : '  '}
              {a}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <Text dimColor>config for: {selected ?? '-'}</Text>
          {error ? (
            <Text color="red">{error}</Text>
          ) : pretty.length === 0 ? (
            <Text dimColor>(empty)</Text>
          ) : (
            pretty.map((line, i) => <Text key={i}>{line}</Text>)
          )}
        </Box>
      </Box>
      <Text dimColor>↑/↓: select agent · use `amux config set &lt;agent&gt; &lt;field&gt; &lt;value&gt;` to edit</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:config-view',
  register(ctx) {
    ctx.registerView({
      id: 'config',
      title: 'Config',
      hotkey: 'C',
      component: ConfigView,
    });
  },
});
