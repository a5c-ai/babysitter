import React from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function McpStartRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'mcp_tool_call_start') return null;
  return (
    <Box>
      <Text color="blue">◇ mcp </Text>
      <Text color="cyan">{event.server}</Text>
      <Text>/</Text>
      <Text bold>{event.toolName}</Text>
    </Box>
  );
}

export function McpResultRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'mcp_tool_result') return null;
  return (
    <Box>
      <Text color="green">✓ mcp </Text>
      <Text color="cyan">{event.server}</Text>
      <Text>/</Text>
      <Text>{event.toolName}</Text>
    </Box>
  );
}

export function McpErrorRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'mcp_tool_error') return null;
  return (
    <Box>
      <Text color="red">✗ mcp {event.server}/{event.toolName}: {event.error}</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:mcp',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'mcp-start',
      match: (ev) => ev.type === 'mcp_tool_call_start',
      component: McpStartRenderer,
    });
    ctx.registerEventRenderer({
      id: 'mcp-result',
      match: (ev) => ev.type === 'mcp_tool_result',
      component: McpResultRenderer,
    });
    ctx.registerEventRenderer({
      id: 'mcp-error',
      match: (ev) => ev.type === 'mcp_tool_error',
      component: McpErrorRenderer,
    });
  },
});
