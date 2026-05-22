/**
 * babysitter-governance-plugin -- Shows governance/permission decisions in agent-mux TUI.
 *
 * Registers:
 * - A "Governance" view showing breakpoint approval history and auto-approval rules
 * - Event renderers for babysitter breakpoint/approval events in the chat stream
 *
 * Ported from babysitter-harness dashboard's BreakpointPanel and governance-related
 * helpers.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import { definePlugin, type TuiViewProps } from '@a5c-ai/agent-mux-tui/plugin';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import {
  scanRuns,
  loadRunJournal,
  extractGovernanceDecisions,
  resolveRunsDir,
} from './data.js';
import type { GovernanceDecision } from './types.js';

// ---------------------------------------------------------------------------
// Helpers (ported from babysitter-harness BreakpointPanel helpers)
// ---------------------------------------------------------------------------

function approvalIcon(approved: boolean | null): string {
  if (approved === true) return '\u2714';
  if (approved === false) return '\u2718';
  return '\u25CB';
}

function approvalColor(approved: boolean | null): string {
  if (approved === true) return 'green';
  if (approved === false) return 'red';
  return 'yellow';
}

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Decision Detail
// ---------------------------------------------------------------------------

interface DecisionDetailProps {
  decision: GovernanceDecision;
}

function DecisionDetail({ decision }: DecisionDetailProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={approvalColor(decision.approved)}
      paddingX={1}
      marginBottom={1}
    >
      <Box flexDirection="row">
        <Text color={approvalColor(decision.approved)}>
          {approvalIcon(decision.approved)}{' '}
        </Text>
        <Text bold>{decision.title}</Text>
      </Box>

      <Text dimColor>ID: {decision.breakpointId}</Text>

      {decision.approved !== null ? (
        <Text>
          Decision:{' '}
          <Text color={approvalColor(decision.approved)}>
            {decision.approved ? 'APPROVED' : 'REJECTED'}
          </Text>
        </Text>
      ) : (
        <Text color="yellow">PENDING</Text>
      )}

      {decision.response ? (
        <Text>
          Response: <Text dimColor>{decision.response}</Text>
        </Text>
      ) : null}

      {decision.feedback ? (
        <Text>
          Feedback: <Text dimColor>{decision.feedback}</Text>
        </Text>
      ) : null}

      {decision.expert ? (
        <Text>
          Expert:{' '}
          <Text color="blue">
            {Array.isArray(decision.expert)
              ? decision.expert.join(', ')
              : decision.expert}
          </Text>
        </Text>
      ) : null}

      {decision.tags && decision.tags.length > 0 ? (
        <Text>
          Tags:{' '}
          <Text dimColor>{decision.tags.join(', ')}</Text>
        </Text>
      ) : null}

      {decision.autoApproval ? (
        <Text>
          Auto-approval:{' '}
          <Text color={decision.autoApproval.recommended ? 'green' : 'yellow'}>
            {decision.autoApproval.recommended ? 'recommended' : 'not recommended'}
          </Text>
          <Text dimColor> ({decision.autoApproval.reason})</Text>
        </Text>
      ) : null}

      {decision.timestamp ? (
        <Text dimColor>Time: {formatTimestamp(decision.timestamp)}</Text>
      ) : null}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Governance View
// ---------------------------------------------------------------------------

function BabysitterGovernanceView({ active }: TuiViewProps) {
  const [decisions, setDecisions] = useState<
    Array<GovernanceDecision & { runId: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runsDir = resolveRunsDir();

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const runs = await scanRuns(runsDir);
        const allDecisions: Array<GovernanceDecision & { runId: string }> = [];

        for (const run of runs.slice(0, 20)) {
          try {
            const journal = await loadRunJournal(run.runDir);
            const runDecisions = extractGovernanceDecisions(journal);
            for (const d of runDecisions) {
              allDecisions.push({ ...d, runId: run.runId });
            }
          } catch {
            // skip runs with journal errors
          }
        }

        // Sort by timestamp descending
        allDecisions.sort((a, b) =>
          (b.timestamp ?? '').localeCompare(a.timestamp ?? ''),
        );

        if (!cancelled) {
          setDecisions(allDecisions);
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

  const stats = useMemo(() => {
    const approved = decisions.filter((d) => d.approved === true).length;
    const rejected = decisions.filter((d) => d.approved === false).length;
    const pending = decisions.filter((d) => d.approved === null).length;
    const autoApproved = decisions.filter(
      (d) => d.autoApproval?.recommended === true && d.approved === true,
    ).length;
    return { approved, rejected, pending, autoApproved, total: decisions.length };
  }, [decisions]);

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Summary Header */}
      <Box
        borderStyle="round"
        borderColor="cyan"
        flexDirection="column"
        paddingX={1}
        marginBottom={1}
      >
        <Text bold color="cyan">
          BABYSITTER GOVERNANCE
        </Text>
        <Box marginTop={1}>
          <Box flexDirection="column" marginRight={4}>
            <Text>
              Total: <Text bold>{stats.total}</Text> breakpoints
            </Text>
            <Text>
              Auto-approved:{' '}
              <Text color="blue">{stats.autoApproved}</Text>
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text>
              <Text color="green">{stats.approved} approved</Text>
              {' / '}
              <Text color="red">{stats.rejected} rejected</Text>
              {' / '}
              <Text color="yellow">{stats.pending} pending</Text>
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Decisions List */}
      {loading ? (
        <Text dimColor>Scanning governance decisions...</Text>
      ) : error ? (
        <Text color="red">Error: {error}</Text>
      ) : decisions.length === 0 ? (
        <Text dimColor>No governance decisions found.</Text>
      ) : (
        <Box flexDirection="column">
          {decisions.slice(0, 15).map((decision, i) => (
            <DecisionDetail
              key={`${decision.breakpointId}-${decision.timestamp ?? i}`}
              decision={decision}
            />
          ))}
          {decisions.length > 15 ? (
            <Text dimColor>
              ... and {decisions.length - 15} more decisions
            </Text>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Event Renderers for babysitter-specific approval events
// ---------------------------------------------------------------------------

function BabysitterBreakpointRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'approval_request') return null;
  // Enhance approval_request events that come from babysitter orchestration
  const detail = event.detail ?? '';
  const isBabysitter =
    detail.includes('breakpoint') || detail.includes('babysitter');
  if (!isBabysitter) return null;

  return (
    <Box flexDirection="column">
      <Text color="yellow">
        {'\u23F8'} babysitter breakpoint [{event.riskLevel}] {event.action}
      </Text>
      <Text dimColor>{event.detail}</Text>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export const babysitterGovernancePlugin = definePlugin({
  name: 'babysitter:governance',
  version: '5.0.0',
  register(ctx) {
    ctx.registerView({
      id: 'babysitter-governance',
      title: 'BS Gov',
      component: BabysitterGovernanceView,
    });

    ctx.registerEventRenderer({
      id: 'babysitter-breakpoint',
      match: (ev) => {
        if (ev.type !== 'approval_request') return false;
        const detail = ev.detail ?? '';
        return detail.includes('breakpoint') || detail.includes('babysitter');
      },
      component: BabysitterBreakpointRenderer,
    });
  },
});

export default babysitterGovernancePlugin;
