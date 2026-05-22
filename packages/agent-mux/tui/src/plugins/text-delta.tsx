import React from 'react';
import { Text } from 'ink';
import { definePlugin } from '../plugin.js';

export default definePlugin({
  name: 'builtin:text-delta',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'text-delta',
      match: (ev) => ev.type === 'text_delta',
      component: ({ event }) =>
        event.type === 'text_delta' ? <Text>{event.delta}</Text> : null,
    });
    ctx.registerEventRenderer({
      id: 'thinking-delta',
      match: (ev) => ev.type === 'thinking_delta',
      component: ({ event }) =>
        event.type === 'thinking_delta' ? (
          <Text dimColor italic>
            {event.delta}
          </Text>
        ) : null,
    });
  },
});
