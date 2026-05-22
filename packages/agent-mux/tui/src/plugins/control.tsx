import React from 'react';
import { Box, Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

const CONTROL_TYPES = new Set<string>([
  'rate_limited',
  'context_limit_warning',
  'context_compacted',
  'retry',
  'interrupted',
  'aborted',
  'paused',
  'resumed',
  'timeout',
  'turn_limit',
  'stream_fallback',
  'auth_error',
  'rate_limit_error',
  'context_exceeded',
  'crash',
  'error',
]);

export function ControlRenderer({ event }: { event: AgentEvent }) {
  switch (event.type) {
    case 'rate_limited':
      return (
        <Text color="yellow">
          ⏳ rate_limited
          {event.retryAfterMs !== undefined ? <Text dimColor> retry in {event.retryAfterMs}ms</Text> : null}
        </Text>
      );
    case 'context_limit_warning':
      return (
        <Text color="yellow">
          ▲ context_limit_warning {event.usedTokens}/{event.maxTokens} ({event.pctUsed}%)
        </Text>
      );
    case 'context_compacted':
      return (
        <Box flexDirection="column">
          <Text color="cyan">
            ◆ context_compacted <Text dimColor>(saved {event.tokensSaved} tokens)</Text>
          </Text>
          <Text dimColor>{event.summary}</Text>
        </Box>
      );
    case 'retry':
      return (
        <Text color="yellow">
          ↻ retry {event.attempt}/{event.maxAttempts} in {event.delayMs}ms — {event.reason}
        </Text>
      );
    case 'interrupted':
      return <Text color="yellow">⏹ interrupted</Text>;
    case 'aborted':
      return <Text color="red">⏹ aborted</Text>;
    case 'paused':
      return <Text color="yellow">⏸ paused</Text>;
    case 'resumed':
      return <Text color="green">▶ resumed</Text>;
    case 'timeout':
      return <Text color="red">⏱ timeout ({event.kind})</Text>;
    case 'turn_limit':
      return <Text color="red">⏹ turn_limit reached (max {event.maxTurns})</Text>;
    case 'stream_fallback':
      return (
        <Text color="yellow">
          ▽ stream_fallback {event.capability}: {event.reason}
        </Text>
      );
    case 'auth_error':
      return (
        <Box flexDirection="column">
          <Text color="red">🔒 auth_error: {event.message}</Text>
          <Text dimColor>{event.guidance}</Text>
        </Box>
      );
    case 'rate_limit_error':
      return (
        <Text color="red">
          🔒 rate_limit_error: {event.message}
          {event.retryAfterMs !== undefined ? <Text dimColor> (retry in {event.retryAfterMs}ms)</Text> : null}
        </Text>
      );
    case 'context_exceeded':
      return (
        <Text color="red">
          ▲ context_exceeded {event.usedTokens}/{event.maxTokens}
        </Text>
      );
    case 'crash':
      return (
        <Box flexDirection="column">
          <Text color="red">💥 crash exit={event.exitCode}</Text>
          <Text dimColor>{event.stderr}</Text>
        </Box>
      );
    case 'error':
      return (
        <Text color="red">
          ✗ error [{event.code}] {event.message}
          {event.recoverable ? <Text dimColor> (recoverable)</Text> : null}
        </Text>
      );
    default:
      return null;
  }
}

export default definePlugin({
  name: 'builtin:control',
  register(ctx) {
    ctx.registerEventRenderer({
      id: 'control',
      match: (ev) => CONTROL_TYPES.has(ev.type),
      component: ControlRenderer,
    });
  },
});
