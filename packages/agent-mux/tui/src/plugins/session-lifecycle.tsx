import React from 'react';
import { Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function SessionLifecycleRenderer({ event }: { event: AgentEvent }) {
  switch (event.type) {
    case 'session_start':
      return (
        <Text>
          <Text color="green">▶ session_start </Text>
          <Text dimColor>{event.sessionId}</Text>
          {event.resumed ? <Text color="yellow"> (resumed)</Text> : null}
          {event.forkedFrom ? (
            <Text dimColor> forked from {event.forkedFrom}</Text>
          ) : null}
        </Text>
      );
    case 'session_resume':
      return (
        <Text>
          <Text color="yellow">↻ session_resume </Text>
          <Text dimColor>{event.sessionId}</Text>
          <Text dimColor> ({event.priorTurnCount} prior turns)</Text>
        </Text>
      );
    case 'session_fork':
      return (
        <Text>
          <Text color="magenta">⑂ session_fork </Text>
          <Text dimColor>{event.sessionId}</Text>
          <Text dimColor> from {event.forkedFrom}</Text>
        </Text>
      );
    case 'session_checkpoint':
      return (
        <Text>
          <Text color="cyan">◎ checkpoint </Text>
          <Text dimColor>{event.checkpointId}</Text>
        </Text>
      );
    case 'session_end':
      return (
        <Text>
          <Text color="gray">■ session_end </Text>
          <Text dimColor>{event.sessionId}</Text>
          <Text dimColor> ({event.turnCount} turns)</Text>
        </Text>
      );
    default:
      return null;
  }
}

const LIFECYCLE = new Set([
  'session_start',
  'session_resume',
  'session_fork',
  'session_checkpoint',
  'session_end',
]);

export default definePlugin({
  name: 'builtin:session-lifecycle',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'session-lifecycle',
      match: (ev) => LIFECYCLE.has(ev.type),
      component: SessionLifecycleRenderer,
    });
  },
});
