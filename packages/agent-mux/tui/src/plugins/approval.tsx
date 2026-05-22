import React from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function ApprovalRequestRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'approval_request') return null;
  const color =
    event.riskLevel === 'high' ? 'red' : event.riskLevel === 'medium' ? 'yellow' : 'cyan';
  return (
    <Box flexDirection="column">
      <Text color={color}>
        ⚠ approval_request [{event.riskLevel}] {event.action}
        {event.toolName ? <Text dimColor> ({event.toolName})</Text> : null}
      </Text>
      <Text dimColor>{event.detail}</Text>
    </Box>
  );
}

export function ApprovalGrantedRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'approval_granted') return null;
  return (
    <Text color="green">✓ approved <Text dimColor>[{event.interactionId}]</Text></Text>
  );
}

export function ApprovalDeniedRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'approval_denied') return null;
  return (
    <Text color="red">
      ✗ denied <Text dimColor>[{event.interactionId}]</Text>
      {event.reason ? <Text>: {event.reason}</Text> : null}
    </Text>
  );
}

export function InputRequiredRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'input_required') return null;
  return (
    <Box flexDirection="column">
      <Text color="yellow">
        ? input_required <Text dimColor>[{event.source}]</Text>
      </Text>
      <Text>{event.question}</Text>
      {event.context ? <Text dimColor>{event.context}</Text> : null}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:approval',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'approval-request',
      match: (ev) => ev.type === 'approval_request',
      component: ApprovalRequestRenderer,
    });
    ctx.registerEventRenderer({
      id: 'approval-granted',
      match: (ev) => ev.type === 'approval_granted',
      component: ApprovalGrantedRenderer,
    });
    ctx.registerEventRenderer({
      id: 'approval-denied',
      match: (ev) => ev.type === 'approval_denied',
      component: ApprovalDeniedRenderer,
    });
    ctx.registerEventRenderer({
      id: 'input-required',
      match: (ev) => ev.type === 'input_required',
      component: InputRequiredRenderer,
    });
  },
});
