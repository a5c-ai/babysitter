import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin, type EventRenderer, type TuiViewProps } from '../plugin.js';

interface ChatViewInnerProps extends TuiViewProps {
  renderers: EventRenderer[];
}

function ChatViewInner({ eventStream, renderers, filter }: ChatViewInnerProps) {
  const [events, setEvents] = useState<AgentEvent[]>(() => [...eventStream.snapshot()]);
  useEffect(() => {
    const offPush = eventStream.subscribe((ev) => {
      setEvents((prev) => [...prev, ev]);
    });
    const offReset = eventStream.onReset(() => {
      setEvents([...eventStream.snapshot()]);
    });
    return () => {
      offPush();
      offReset();
    };
  }, [eventStream]);

  const NOISE_TYPES = new Set([
    'log',
    'debug',
    'raw',
    'heartbeat',
    'tool_input_delta',
    'message_start',
    'message_stop',
    'turn_start',
    'turn_end',
    'step_start',
    'step_end',
    'thinking_start',
    'thinking_stop',
  ]);
  const filtered = (filter
    ? events.filter((ev) => {
        const f = filter.toLowerCase();
        if (f.startsWith('type:')) return ev.type.includes(f.slice(5));
        return JSON.stringify(ev).toLowerCase().includes(f);
      })
    : events
  ).filter((ev) => !NOISE_TYPES.has(ev.type));

  if (filtered.length === 0 && filter) {
    return (
      <Box flexDirection="column">
        <Text dimColor>No events match filter `{filter}`.</Text>
      </Box>
    );
  }
  if (events.length === 0) {
    return (
      <Box flexDirection="column">
        <Text dimColor>No messages yet. Press `p` to run a prompt.</Text>
      </Box>
    );
  }

  const specific = renderers.filter((r) => r.id !== 'fallback');
  const fallback = renderers.find((r) => r.id === 'fallback');

  return (
    <Box flexDirection="column">
      {filtered.slice(-200).map((ev, i) => {
        const r = specific.find((x) => x.match(ev)) ?? fallback;
        const Comp = r?.component;
        return Comp ? <Comp key={i} event={ev} /> : null;
      })}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:chat-view',
  register(ctx) {
    ctx.registerView({
      id: 'chat',
      title: 'Chat',
      hotkey: '1',
      component: (props) => {
        const renderers = (props as unknown as { renderers?: EventRenderer[] }).renderers ?? [];
        return <ChatViewInner {...props} renderers={renderers} />;
      },
    });
  },
});

export { ChatViewInner };
