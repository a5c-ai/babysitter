import React from 'react';
import { Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

const TYPES = new Set<string>([
  'message_start',
  'message_stop',
  'thinking_start',
  'thinking_stop',
  'turn_start',
  'turn_end',
  'step_start',
  'step_end',
]);

export function LifecycleRenderer({ event }: { event: AgentEvent }) {
  switch (event.type) {
    case 'message_start':
      return <Text dimColor>▷ message_start</Text>;
    case 'message_stop':
      return <Text dimColor>▶ message_stop</Text>;
    case 'thinking_start':
      return <Text color="gray">◌ thinking…</Text>;
    case 'thinking_stop':
      return <Text color="gray">◯ thinking done</Text>;
    case 'turn_start':
      return <Text color="gray" dimColor>── turn {event.turnIndex} start ──</Text>;
    case 'turn_end':
      return <Text color="gray" dimColor>── turn {event.turnIndex} end ──</Text>;
    case 'step_start':
      return (
        <Text dimColor>
          • step {event.turnIndex}.{event.stepIndex} ({event.stepType})
        </Text>
      );
    case 'step_end':
      return (
        <Text dimColor>
          ◦ step {event.turnIndex}.{event.stepIndex} end
        </Text>
      );
    default:
      return null;
  }
}

export default definePlugin({
  name: 'builtin:lifecycle',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'lifecycle',
      match: (ev) => TYPES.has(ev.type),
      component: LifecycleRenderer,
    });
  },
});
