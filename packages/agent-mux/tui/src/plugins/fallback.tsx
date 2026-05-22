import React from 'react';
import { Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function FallbackRenderer({ event }: { event: AgentEvent }) {
  return (
    <Text dimColor>
      · {event.type}
    </Text>
  );
}

export default definePlugin({
  name: 'builtin:fallback',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'fallback',
      match: () => true,
      component: FallbackRenderer,
    });
  },
});
