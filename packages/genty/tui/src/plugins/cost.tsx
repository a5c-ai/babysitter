import React from 'react';
import { Text } from 'ink';
import { definePlugin } from '../plugin.js';

export default definePlugin({
  name: 'builtin:cost',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'cost',
      match: (ev) => ev.type === 'cost',
      component: ({ event }) =>
        event.type === 'cost' ? (
          <Text color="yellow">
            $
            {event.cost.totalUsd !== undefined
              ? event.cost.totalUsd.toFixed(4)
              : '?'}
          </Text>
        ) : null,
    });
  },
});
