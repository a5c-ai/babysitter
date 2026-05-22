import React, { useEffect, useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import fs from 'node:fs';
import path from 'node:path';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin, type TuiViewProps } from '../plugin.js';

export interface ObservabilityMetrics {
  tokens: number;
  input: number;
  output: number;
  cost: number;
  latency: number;
  errors: number;
  tools: number;
}

export function summarizeObservabilityEvents(events: readonly AgentEvent[]): ObservabilityMetrics {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;
  let startTime: number | null = null;
  let endTime: number | null = null;
  let errorCount = 0;
  let toolCallCount = 0;

  for (const ev of events) {
    if (typeof ev.timestamp === 'number') {
      startTime = startTime === null ? ev.timestamp : Math.min(startTime, ev.timestamp);
      endTime = endTime === null ? ev.timestamp : Math.max(endTime, ev.timestamp);
    }

    if (ev.type === 'cost') {
      totalCost += Number(ev.cost.totalUsd ?? 0);
      continue;
    }

    if (ev.type === 'token_usage') {
      totalInputTokens += Number(ev.inputTokens ?? 0);
      totalOutputTokens += Number(ev.outputTokens ?? 0);
      continue;
    }

    if (ev.type === 'tool_call_start' || ev.type === 'mcp_tool_call_start') {
      toolCallCount++;
      continue;
    }

    if (ev.type === 'error' || ev.type.endsWith('_error')) {
      errorCount++;
    }
  }

  return {
    tokens: totalInputTokens + totalOutputTokens,
    input: totalInputTokens,
    output: totalOutputTokens,
    cost: totalCost,
    latency: startTime === null || endTime === null ? 0 : endTime - startTime,
    errors: errorCount,
    tools: toolCallCount,
  };
}

export function filterObservabilityEvents(events: readonly AgentEvent[], filter?: string): AgentEvent[] {
  if (!filter) {
    return [...events];
  }
  const normalized = filter.toLowerCase();
  if (normalized.startsWith('type:')) {
    const typeFilter = normalized.slice(5);
    return events.filter((ev) => ev.type.toLowerCase().includes(typeFilter));
  }
  return events.filter((ev) => JSON.stringify(ev).toLowerCase().includes(normalized));
}

export function exportObservabilityEvents(
  events: readonly AgentEvent[],
  options: {
    cwd?: string;
    now?: () => number;
    writeFileSync?: typeof fs.writeFileSync;
  } = {},
): string {
  const fileName = `session-log-${(options.now ?? Date.now)()}.json`;
  const fullPath = path.resolve(options.cwd ?? process.cwd(), fileName);
  (options.writeFileSync ?? fs.writeFileSync)(fullPath, JSON.stringify(events, null, 2), 'utf8');
  return fullPath;
}

export function ObservabilityView({ eventStream, filter }: TuiViewProps) {
  const [events, setEvents] = useState<AgentEvent[]>(() => [...eventStream.snapshot()]);
  const [exportPath, setExportPath] = useState<string | null>(null);

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

  useInput((input) => {
    if (input === 'e') {
      const fullPath = exportObservabilityEvents(events);
      setExportPath(fullPath);
      setTimeout(() => setExportPath(null), 5000);
    }
  });

  const metrics = useMemo(() => summarizeObservabilityEvents(events), [events]);

  const filteredLogs = useMemo(() => filterObservabilityEvents(events, filter), [events, filter]);

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Metrics Header */}
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={1} marginBottom={1}>
        <Box justifyContent="space-between">
          <Text bold color="cyan">SESSION METRICS</Text>
          <Text dimColor>{events.length} events</Text>
        </Box>
        <Box marginTop={1}>
          <Box flexDirection="column" marginRight={4}>
            <Text>Tokens: <Text color="yellow">{metrics.tokens}</Text> (<Text color="gray">{metrics.input}</Text> in / <Text color="gray">{metrics.output}</Text> out)</Text>
            <Text>Cost:   <Text color="green">${metrics.cost.toFixed(4)}</Text></Text>
          </Box>
          <Box flexDirection="column">
            <Text>Latency: <Text color="blue">{(metrics.latency / 1000).toFixed(2)}s</Text></Text>
            <Text>Status:  <Text color={metrics.errors > 0 ? 'red' : 'green'}>{metrics.errors} errors</Text> / {metrics.tools} tool calls</Text>
          </Box>
        </Box>
      </Box>

      {/* Log Stream */}
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold underline>LOG STREAM</Text>
        </Box>
        {filteredLogs.length === 0 && filter ? (
          <Text dimColor>No events match filter `{filter}`.</Text>
        ) : null}
        {filteredLogs.slice(-50).map((ev, i) => (
          <Box key={i}>
            <Text dimColor>[{new Date(ev.timestamp).toISOString().split('T')[1].split('Z')[0]}] </Text>
            <Text color="magenta">{ev.type.padEnd(15)} </Text>
            <Text wrap="truncate">
              {ev.type === 'log' ? (ev as any).message : 
               ev.type === 'debug' ? (ev as any).message :
               JSON.stringify((ev as any).data || ev).slice(0, 100)}
            </Text>
          </Box>
        ))}
      </Box>
      
      {filteredLogs.length > 50 && (
        <Text dimColor italic>... {filteredLogs.length - 50} more events (press 'e' to export full log)</Text>
      )}

      {exportPath && (
        <Box marginTop={1} paddingX={1} borderStyle="single" borderColor="yellow">
          <Text color="yellow">Log exported to: {exportPath}</Text>
        </Box>
      )}
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:observability-view',
  register(ctx) {
    ctx.registerView({
      id: 'logs',
      title: 'Logs',
      hotkey: 'l',
      component: (props) => <ObservabilityView {...props} />,
    });
  },
});
