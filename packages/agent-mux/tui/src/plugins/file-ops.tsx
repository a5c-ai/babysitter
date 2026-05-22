import React from 'react';
import { Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function FileReadRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'file_read') return null;
  return (
    <Text>
      <Text color="blue">📖 read </Text>
      <Text dimColor>{event.path}</Text>
    </Text>
  );
}

export function FileWriteRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'file_write') return null;
  return (
    <Text>
      <Text color="yellow">✎ write </Text>
      <Text>{event.path}</Text>
      <Text dimColor> ({event.byteCount}B)</Text>
    </Text>
  );
}

export function FileCreateRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'file_create') return null;
  return (
    <Text>
      <Text color="green">+ create </Text>
      <Text>{event.path}</Text>
      <Text dimColor> ({event.byteCount}B)</Text>
    </Text>
  );
}

export function FileDeleteRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'file_delete') return null;
  return (
    <Text>
      <Text color="red">- delete </Text>
      <Text>{event.path}</Text>
    </Text>
  );
}

export default definePlugin({
  name: 'builtin:file-ops',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'file-read',
      match: (ev) => ev.type === 'file_read',
      component: FileReadRenderer,
    });
    ctx.registerEventRenderer({
      id: 'file-write',
      match: (ev) => ev.type === 'file_write',
      component: FileWriteRenderer,
    });
    ctx.registerEventRenderer({
      id: 'file-create',
      match: (ev) => ev.type === 'file_create',
      component: FileCreateRenderer,
    });
    ctx.registerEventRenderer({
      id: 'file-delete',
      match: (ev) => ev.type === 'file_delete',
      component: FileDeleteRenderer,
    });
  },
});
