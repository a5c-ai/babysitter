import React from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function ShellStartRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'shell_start') return null;
  return (
    <Box>
      <Text color="yellow">$ </Text>
      <Text bold>{event.command}</Text>
      <Text dimColor> ({event.cwd})</Text>
    </Box>
  );
}

export function ShellStdoutRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'shell_stdout_delta') return null;
  return (
    <Box>
      <Text dimColor>│ </Text>
      <Text>{event.delta}</Text>
    </Box>
  );
}

export function ShellStderrRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'shell_stderr_delta') return null;
  return (
    <Box>
      <Text color="red">│ </Text>
      <Text color="red">{event.delta}</Text>
    </Box>
  );
}

export function ShellExitRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'shell_exit') return null;
  const ok = event.exitCode === 0;
  return (
    <Box>
      <Text color={ok ? 'green' : 'red'}>
        ↳ exit {event.exitCode}
      </Text>
      <Text dimColor> ({event.durationMs}ms)</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:shell',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'shell-start',
      match: (ev) => ev.type === 'shell_start',
      component: ShellStartRenderer,
    });
    ctx.registerEventRenderer({
      id: 'shell-stdout',
      match: (ev) => ev.type === 'shell_stdout_delta',
      component: ShellStdoutRenderer,
    });
    ctx.registerEventRenderer({
      id: 'shell-stderr',
      match: (ev) => ev.type === 'shell_stderr_delta',
      component: ShellStderrRenderer,
    });
    ctx.registerEventRenderer({
      id: 'shell-exit',
      match: (ev) => ev.type === 'shell_exit',
      component: ShellExitRenderer,
    });
  },
});
