import React from 'react';
import { Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function ImageOutputRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'image_output') return null;
  const size = event.base64 ? Math.round((event.base64.length * 3) / 4) : undefined;
  return (
    <Text>
      <Text color="magenta">🖼 image_output </Text>
      <Text dimColor>{event.mimeType}</Text>
      {event.filePath ? <Text> {event.filePath}</Text> : null}
      {size !== undefined ? <Text dimColor> (~{size}B)</Text> : null}
    </Text>
  );
}

export function ImageInputAckRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'image_input_ack') return null;
  return (
    <Text dimColor>
      🖼 image_input_ack {event.mimeType}
    </Text>
  );
}

export default definePlugin({
  name: 'builtin:image',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'image-output',
      match: (ev) => ev.type === 'image_output',
      component: ImageOutputRenderer,
    });
    ctx.registerEventRenderer({
      id: 'image-input-ack',
      match: (ev) => ev.type === 'image_input_ack',
      component: ImageInputAckRenderer,
    });
  },
});
