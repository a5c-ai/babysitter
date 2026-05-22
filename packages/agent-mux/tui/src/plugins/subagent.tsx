import React from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function SubagentSpawnRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'subagent_spawn') return null;
  const preview = event.prompt.length > 60 ? event.prompt.slice(0, 60) + '…' : event.prompt;
  return (
    <Box>
      <Text color="magenta">⊕ subagent </Text>
      <Text color="cyan">{event.agentName}</Text>
      <Text dimColor> [{event.subagentId}]</Text>
      <Text> {preview}</Text>
    </Box>
  );
}

export function SubagentResultRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'subagent_result') return null;
  return (
    <Box>
      <Text color="green">⊖ subagent </Text>
      <Text color="cyan">{event.agentName}</Text>
      <Text dimColor> [{event.subagentId}]</Text>
      <Text> {event.summary}</Text>
    </Box>
  );
}

export function SubagentErrorRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'subagent_error') return null;
  return (
    <Box>
      <Text color="red">
        ⊗ subagent {event.agentName} [{event.subagentId}] failed: {event.error}
      </Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:subagent',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'subagent-spawn',
      match: (ev) => ev.type === 'subagent_spawn',
      component: SubagentSpawnRenderer,
    });
    ctx.registerEventRenderer({
      id: 'subagent-result',
      match: (ev) => ev.type === 'subagent_result',
      component: SubagentResultRenderer,
    });
    ctx.registerEventRenderer({
      id: 'subagent-error',
      match: (ev) => ev.type === 'subagent_error',
      component: SubagentErrorRenderer,
    });
  },
});
