import React from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function DiffRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'file_patch') return null;
  const lines = event.diff.split('\n');
  let adds = 0;
  let dels = 0;
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) adds++;
    else if (line.startsWith('-') && !line.startsWith('---')) dels++;
  }
  return (
    <Box flexDirection="column" marginY={0}>
      <Text>
        <Text color="magenta">◆ {event.path}</Text>{' '}
        <Text color="green">+{adds}</Text>{' '}
        <Text color="red">-{dels}</Text>
      </Text>
      {lines.map((line: string, i: number) => {
        if (line.startsWith('+++') || line.startsWith('---')) {
          return <Text key={i} dimColor>{line}</Text>;
        }
        if (line.startsWith('@@')) {
          return <Text key={i} color="cyan">{line}</Text>;
        }
        if (line.startsWith('+')) {
          return <Text key={i} color="green">{line}</Text>;
        }
        if (line.startsWith('-')) {
          return <Text key={i} color="red">{line}</Text>;
        }
        return <Text key={i}>{line}</Text>;
      })}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:diff',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'file-patch',
      match: (ev) => ev.type === 'file_patch',
      component: DiffRenderer,
    });
  },
});
