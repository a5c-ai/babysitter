/**
 * babysitter-status-plugin -- Shows babysitter run status in agent-mux TUI.
 *
 * Registers:
 * - A "Babysitter" view showing run list with state, iteration, pending effects
 * - An event renderer for babysitter-specific status events in the chat stream
 *
 * Ported from babysitter-harness dashboard's DashboardView / StatusBar / RunListTable.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '@a5c-ai/agent-mux-tui/plugin';
import { scanRuns, resolveRunsDir, loadRunJournal, extractEffects } from './data.js';
import type { RunSummary, EffectSummary } from './types.js';

// ---------------------------------------------------------------------------
// Helpers (ported from babysitter-harness StatusLine / StatusBar)
// ---------------------------------------------------------------------------

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stateColor(state: RunSummary['state']): string {
  switch (state) {
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'waiting':
      return 'yellow';
    case 'created':
      return 'cyan';
  }
}

function stateSymbol(state: RunSummary['state']): string {
  switch (state) {
    case 'completed':
      return '\u2714';
    case 'failed':
      return '\u2718';
    case 'waiting':
      return '\u25CB';
    case 'created':
      return '\u25CF';
  }
}

function abbreviateRunId(runId: string): string {
  if (runId.length <= 12) return runId;
  return runId.slice(0, 8) + '..';
}

function effectStatusIcon(status: EffectSummary['status']): string {
  switch (status) {
    case 'pending':
      return '\u25CC';
    case 'resolved':
      return '\u2713';
    case 'failed':
      return '\u2717';
  }
}

function effectStatusColor(status: EffectSummary['status']): string {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'resolved':
      return 'green';
    case 'failed':
      return 'red';
  }
}

// ---------------------------------------------------------------------------
// Run Detail Sub-view
// ---------------------------------------------------------------------------

interface RunDetailProps {
  run: RunSummary;
}

function RunDetail({ run }: RunDetailProps) {
  const [effects, setEffects] = useState<EffectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const journal = await loadRunJournal(run.runDir);
        const extracted = extractEffects(journal);
        if (!cancelled) setEffects(extracted);
      } catch {
        // ignore errors loading journal
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [run.runDir]);

  const pendingEffects = effects.filter((e) => e.status === 'pending');
  const resolvedEffects = effects.filter((e) => e.status === 'resolved');
  const failedEffects = effects.filter((e) => e.status === 'failed');

  return (
    <Box flexDirection="column" marginTop={1} paddingX={1}>
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={1}>
        <Text bold color="cyan">
          RUN DETAIL: {abbreviateRunId(run.runId)}
        </Text>
        <Text>
          Process: <Text color="magenta">{run.processId}</Text>
        </Text>
        <Text>
          State:{' '}
          <Text color={stateColor(run.state)}>
            {stateSymbol(run.state)} {run.state}
          </Text>
        </Text>
        <Text>
          Created: <Text dimColor>{run.createdAt || 'unknown'}</Text>
        </Text>
        {run.prompt ? (
          <Text>
            Prompt: <Text dimColor>{run.prompt.slice(0, 80)}{run.prompt.length > 80 ? '...' : ''}</Text>
          </Text>
        ) : null}
        {run.harness ? (
          <Text>
            Harness: <Text color="blue">{run.harness}</Text>
          </Text>
        ) : null}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>
          Effects ({effects.length} total):{' '}
          <Text color="green">{resolvedEffects.length} resolved</Text>
          {' / '}
          <Text color="yellow">{pendingEffects.length} pending</Text>
          {' / '}
          <Text color="red">{failedEffects.length} failed</Text>
        </Text>

        {loading ? (
          <Text dimColor>Loading effects...</Text>
        ) : effects.length === 0 ? (
          <Text dimColor>No effects recorded.</Text>
        ) : (
          effects.slice(0, 20).map((eff) => (
            <Box key={eff.effectId} flexDirection="row">
              <Text color={effectStatusColor(eff.status)}>
                {effectStatusIcon(eff.status)}{' '}
              </Text>
              <Text>
                <Text dimColor>[{eff.kind}]</Text> {eff.title ?? eff.effectId}
              </Text>
              {eff.elapsedMs !== undefined ? (
                <Text dimColor> ({(eff.elapsedMs / 1000).toFixed(1)}s)</Text>
              ) : null}
              {eff.error ? <Text color="red"> {eff.error}</Text> : null}
            </Box>
          ))
        )}
        {effects.length > 20 ? (
          <Text dimColor>... and {effects.length - 20} more</Text>
        ) : null}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Status View (main view component)
// ---------------------------------------------------------------------------

function BabysitterStatusView({ active }: TuiViewProps) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const runsDir = resolveRunsDir();

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const scanned = await scanRuns(runsDir);
        if (!cancelled) {
          setRuns(scanned);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, runsDir, refreshTick]);

  // Auto-refresh every 5 seconds when active
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [active]);

  const stats = useMemo(() => {
    const completed = runs.filter((r) => r.state === 'completed').length;
    const failed = runs.filter((r) => r.state === 'failed').length;
    const waiting = runs.filter((r) => r.state === 'waiting').length;
    const created = runs.filter((r) => r.state === 'created').length;
    return { completed, failed, waiting, created };
  }, [runs]);

  if (selectedRun) {
    return (
      <Box flexDirection="column">
        <Box paddingX={1}>
          <Text dimColor>Press Escape/Backspace in chat to return to list</Text>
        </Box>
        <RunDetail run={selectedRun} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box
        borderStyle="round"
        borderColor="cyan"
        flexDirection="column"
        paddingX={1}
        marginBottom={1}
      >
        <Box justifyContent="space-between">
          <Text bold color="cyan">
            BABYSITTER RUNS
          </Text>
          <Text dimColor>{runs.length} total</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="green">{stats.completed} done</Text>
          <Text> / </Text>
          <Text color="yellow">{stats.waiting} waiting</Text>
          <Text> / </Text>
          <Text color="red">{stats.failed} failed</Text>
          <Text> / </Text>
          <Text color="cyan">{stats.created} created</Text>
        </Box>
      </Box>

      {/* Content */}
      {loading && runs.length === 0 ? (
        <Text dimColor>Scanning runs directory...</Text>
      ) : error ? (
        <Text color="red">Error: {error}</Text>
      ) : runs.length === 0 ? (
        <Text dimColor>
          No babysitter runs found in {runsDir}
        </Text>
      ) : (
        <Box flexDirection="column">
          {runs.slice(0, 25).map((run) => (
            <Box key={run.runId} flexDirection="row">
              <Text color={stateColor(run.state)}>
                {stateSymbol(run.state)}{' '}
              </Text>
              <Text color="cyan">{abbreviateRunId(run.runId)}</Text>
              <Text> </Text>
              <Text dimColor>{run.processId.slice(0, 30)}</Text>
              <Text> </Text>
              <Text color={stateColor(run.state)}>{run.state}</Text>
              {run.pendingCount > 0 ? (
                <Text color="yellow"> [{run.pendingCount} pending]</Text>
              ) : null}
              <Text dimColor>
                {' '}
                {run.eventCount} events
              </Text>
            </Box>
          ))}
          {runs.length > 25 ? (
            <Text dimColor>... and {runs.length - 25} more runs</Text>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export const babysitterStatusPlugin = definePlugin({
  name: 'babysitter:status',
  version: '5.0.0',
  register(ctx) {
    ctx.registerView({
      id: 'babysitter',
      title: 'Babysitter',
      hotkey: 'b',
      component: BabysitterStatusView,
    });
  },
});

export default babysitterStatusPlugin;
