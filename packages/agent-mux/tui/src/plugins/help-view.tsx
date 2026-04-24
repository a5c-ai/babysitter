import React from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '../plugin.js';

const GLOBAL_KEYS: { key: string; desc: string }[] = [
  { key: 'p', desc: 'open prompt input' },
  { key: '/', desc: 'set global event filter (substring or `type:<prefix>`)' },
  { key: ':', desc: 'open command palette (also Ctrl-K)' },
  { key: 'l', desc: 'open logs / observability view (`e` exports full buffered stream)' },
  { key: 'm', desc: 'pick model for next run' },
  { key: 'N', desc: 'pick active agent (harness) for next run' },
  { key: 'P', desc: 'pick run-options profile' },
  { key: 'i', desc: 'interrupt current run' },
  { key: 'y / n', desc: 'approve / deny pending tool request' },
  { key: '1-7, 9', desc: 'switch to numeric view (1 chat, 2 sessions, 3 cost, 4 adapters, 5 models, 6 profiles, 7 plugins, 9 help)' },
  { key: 'C', desc: 'config view' },
  { key: 'A', desc: 'auth view' },
  { key: 'K', desc: 'skills view (a: add · d: delete · r: refresh)' },
  { key: 'G', desc: 'agents (sub-agents) view (a: add · d: delete · r: refresh)' },
  { key: 'H', desc: 'hooks view (a: add · d: remove · r: refresh)' },
  { key: '0', desc: 'mcp view' },
  { key: '-', desc: 'doctor view' },
  { key: 'q / Ctrl-C', desc: 'quit' },
];

function HelpView({ client }: TuiViewProps) {
  let agentList: string[] = [];
  try {
    agentList = client.adapters.list().map((a: { agent: string }) => a.agent);
  } catch {
    agentList = [];
  }
  return (
    <Box flexDirection="column">
      <Text bold>Keybindings</Text>
      {GLOBAL_KEYS.map((k) => (
        <Text key={k.key}>
          <Text color="cyan">{k.key.padEnd(12)}</Text> {k.desc}
        </Text>
      ))}
      <Text> </Text>
      <Text bold>Discovered agents</Text>
      {agentList.length === 0 ? (
        <Text dimColor>(none)</Text>
      ) : (
        agentList.map((a) => <Text key={a}>· {a}</Text>)
      )}
      <Text> </Text>
      <Text bold>Tips</Text>
      <Text dimColor>· Filter syntax: `type:tool` matches all events whose type contains "tool".</Text>
      <Text dimColor>· In Sessions view, press `d` to inspect a session and export it.</Text>
      <Text dimColor>· In Logs, metrics summarize the full buffered stream; the filter only narrows visible rows.</Text>
      <Text dimColor>· Set AMUX_TUI_COST_ALERT=&quot;1,5,10&quot; to get cost crossing alerts.</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:help-view',
  register(ctx) {
    ctx.registerView({
      id: 'help',
      title: 'Help',
      hotkey: '9',
      component: HelpView,
    });
  },
});
