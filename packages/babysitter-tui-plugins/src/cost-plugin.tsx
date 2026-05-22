/**
 * babysitter-cost-plugin -- Shows babysitter cost tracking in agent-mux TUI.
 *
 * Registers:
 * - A "Babysitter Cost" view showing aggregated cost across runs
 * - An event renderer that highlights cost events from babysitter orchestration
 *
 * Ported from babysitter-harness dashboard's StatusBar cost display and
 * the cost-tracking helpers.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '@a5c-ai/agent-mux-tui/plugin';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { scanRuns, scanRunCosts, resolveRunsDir } from './data.js';
import type { RunSummary } from './types.js';

// ---------------------------------------------------------------------------
// Helpers (ported from babysitter-harness StatusBar.formatCost / formatTokenCount)
// ---------------------------------------------------------------------------

function formatCost(cost: number): string {
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokenCount(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 1_000_000) {
    const k = count / 1000;
    return `${k.toFixed(1)}k`;
  }
  const m = count / 1_000_000;
  return `${m.toFixed(1)}M`;
}

// ---------------------------------------------------------------------------
// Per-run cost state
// ---------------------------------------------------------------------------

interface RunCostEntry {
  runId: string;
  processId: string;
  state: string;
  totalUsd: number;
  inputTokens: number;
  outputTokens: number;
}

// ---------------------------------------------------------------------------
// Cost View
// ---------------------------------------------------------------------------

function BabysitterCostView({ active, eventStream }: TuiViewProps) {
  const [runCosts, setRunCosts] = useState<RunCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionCostUsd, setSessionCostUsd] = useState(0);
  const [sessionInputTokens, setSessionInputTokens] = useState(0);
  const [sessionOutputTokens, setSessionOutputTokens] = useState(0);

  const runsDir = resolveRunsDir();

  // Track cost events from the live agent-mux event stream
  useEffect(() => {
    // Replay existing events
    for (const ev of eventStream.snapshot()) {
      if (ev.type === 'cost') {
        setSessionCostUsd((prev) => prev + (ev.cost.totalUsd ?? 0));
      } else if (ev.type === 'token_usage') {
        setSessionInputTokens((prev) => prev + ev.inputTokens);
        setSessionOutputTokens((prev) => prev + ev.outputTokens);
      }
    }

    return eventStream.subscribe((ev) => {
      if (ev.type === 'cost') {
        setSessionCostUsd((prev) => prev + (ev.cost.totalUsd ?? 0));
      } else if (ev.type === 'token_usage') {
        setSessionInputTokens((prev) => prev + ev.inputTokens);
        setSessionOutputTokens((prev) => prev + ev.outputTokens);
      }
    });
  }, [eventStream]);

  // Scan babysitter runs for cost data
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const runs = await scanRuns(runsDir);
        const costs: RunCostEntry[] = [];

        for (const run of runs.slice(0, 20)) {
          try {
            const costData = await scanRunCosts(run.runDir);
            costs.push({
              runId: run.runId,
              processId: run.processId,
              state: run.state,
              totalUsd: costData.totalUsd,
              inputTokens: costData.inputTokens,
              outputTokens: costData.outputTokens,
            });
          } catch {
            // skip runs with no cost data
          }
        }

        if (!cancelled) {
          setRunCosts(costs);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [active, runsDir]);

  const totalRunCost = useMemo(
    () => runCosts.reduce((sum, r) => sum + r.totalUsd, 0),
    [runCosts],
  );
  const totalRunInputTokens = useMemo(
    () => runCosts.reduce((sum, r) => sum + r.inputTokens, 0),
    [runCosts],
  );
  const totalRunOutputTokens = useMemo(
    () => runCosts.reduce((sum, r) => sum + r.outputTokens, 0),
    [runCosts],
  );

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Session Cost Header */}
      <Box
        borderStyle="round"
        borderColor="green"
        flexDirection="column"
        paddingX={1}
        marginBottom={1}
      >
        <Text bold color="green">
          CURRENT SESSION COST
        </Text>
        <Box marginTop={1}>
          <Box flexDirection="column" marginRight={4}>
            <Text>
              Cost: <Text color="yellow">{formatCost(sessionCostUsd)}</Text>
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text>
              Tokens:{' '}
              <Text color="gray">
                {formatTokenCount(sessionInputTokens)} in /{' '}
                {formatTokenCount(sessionOutputTokens)} out
              </Text>
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Babysitter Run Costs */}
      <Box
        borderStyle="round"
        borderColor="cyan"
        flexDirection="column"
        paddingX={1}
      >
        <Box justifyContent="space-between">
          <Text bold color="cyan">
            BABYSITTER RUN COSTS
          </Text>
          <Text dimColor>
            Total: <Text color="yellow">{formatCost(totalRunCost)}</Text>
          </Text>
        </Box>
        <Text dimColor>
          Tokens: {formatTokenCount(totalRunInputTokens)} in /{' '}
          {formatTokenCount(totalRunOutputTokens)} out
        </Text>

        {loading ? (
          <Text dimColor>Scanning run costs...</Text>
        ) : error ? (
          <Text color="red">Error: {error}</Text>
        ) : runCosts.length === 0 ? (
          <Text dimColor>No cost data found in runs.</Text>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {runCosts
              .filter((r) => r.totalUsd > 0 || r.inputTokens > 0)
              .slice(0, 15)
              .map((r) => (
                <Text key={r.runId}>
                  <Text color="cyan">
                    {r.runId.length > 8
                      ? r.runId.slice(0, 8) + '..'
                      : r.runId}
                  </Text>
                  {'  '}
                  <Text color="yellow">{formatCost(r.totalUsd)}</Text>
                  {'  '}
                  <Text dimColor>
                    {formatTokenCount(r.inputTokens)} in /{' '}
                    {formatTokenCount(r.outputTokens)} out
                  </Text>
                  {'  '}
                  <Text dimColor>{r.processId.slice(0, 25)}</Text>
                </Text>
              ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export const babysitterCostPlugin = definePlugin({
  name: 'babysitter:cost',
  version: '5.0.0',
  register(ctx) {
    ctx.registerView({
      id: 'babysitter-cost',
      title: 'BS Cost',
      component: BabysitterCostView,
    });
  },
});

export default babysitterCostPlugin;
