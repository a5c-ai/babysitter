// SubagentDrillDown.ts — Subagent drill-down view construction and rendering (GAP-SUBOBS-005)
// Pure TypeScript: builds subagent views and renders summary/detail strings.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubagentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface SubagentEffect {
  id: string;
  kind: string;
  title: string;
  status: string;
}

export interface SubagentView {
  agentId: string;
  status: SubagentStatus;
  tokenUsage: { input: number; output: number };
  effects: SubagentEffect[];
  duration: number;   // ms
  model: string;
}

export interface SubagentDrillDownData {
  agents: SubagentView[];
  selectedAgentId?: string;
  expandedEffects: Set<string>;
}

// ---------------------------------------------------------------------------
// Progress tracker interface (minimal shape needed)
// ---------------------------------------------------------------------------

export interface ProgressAgent {
  id: string;
  status?: string;
  model?: string;
  tokenUsage?: { input?: number; output?: number };
  effects?: Array<{ id: string; kind: string; title: string; status: string }>;
  startedAt?: number;
  completedAt?: number;
}

export interface ProgressTracker {
  agents: ProgressAgent[];
}

// ---------------------------------------------------------------------------
// View construction
// ---------------------------------------------------------------------------

export function buildSubagentView(tracker: ProgressTracker): SubagentDrillDownData {
  const agents: SubagentView[] = tracker.agents.map((agent) => ({
    agentId: agent.id,
    status: normalizeStatus(agent.status),
    tokenUsage: {
      input: agent.tokenUsage?.input ?? 0,
      output: agent.tokenUsage?.output ?? 0,
    },
    effects: (agent.effects ?? []).map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      status: e.status,
    })),
    duration: computeDuration(agent.startedAt, agent.completedAt),
    model: agent.model ?? 'unknown',
  }));

  return {
    agents,
    selectedAgentId: undefined,
    expandedEffects: new Set(),
  };
}

function normalizeStatus(status: string | undefined): SubagentStatus {
  const s = (status ?? '').toLowerCase();
  if (s === 'idle' || s === 'running' || s === 'completed' || s === 'failed' || s === 'cancelled') {
    return s;
  }
  if (s === 'error') return 'failed';
  if (s === 'done' || s === 'success') return 'completed';
  return 'idle';
}

function computeDuration(startedAt?: number, completedAt?: number): number {
  if (startedAt == null) return 0;
  const end = completedAt ?? Date.now();
  return Math.max(end - startedAt, 0);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatTokens(usage: { input: number; output: number }): string {
  return `${usage.input.toLocaleString()}in/${usage.output.toLocaleString()}out`;
}

const STATUS_ICON: Record<SubagentStatus, string> = {
  idle: '○',       // ○
  running: '◔',    // ◔
  completed: '✔',  // ✔
  failed: '✘',     // ✘
  cancelled: '–',  // –
};

// ---------------------------------------------------------------------------
// Summary rendering (one-line per agent)
// ---------------------------------------------------------------------------

export function formatSubagentSummary(view: SubagentView): string {
  const icon = STATUS_ICON[view.status] ?? '?';
  const dur = formatDuration(view.duration);
  const tokens = formatTokens(view.tokenUsage);
  const effectCount = view.effects.length;
  return `${icon} ${view.agentId} [${view.model}] ${view.status} | ${dur} | ${tokens} | ${effectCount} effect${effectCount !== 1 ? 's' : ''}`;
}

// ---------------------------------------------------------------------------
// Detail rendering (expanded with effects)
// ---------------------------------------------------------------------------

export function formatSubagentDetail(view: SubagentView): string {
  const lines: string[] = [];
  const icon = STATUS_ICON[view.status] ?? '?';

  lines.push(`${icon} Agent: ${view.agentId}`);
  lines.push(`  Model:    ${view.model}`);
  lines.push(`  Status:   ${view.status}`);
  lines.push(`  Duration: ${formatDuration(view.duration)}`);
  lines.push(`  Tokens:   ${formatTokens(view.tokenUsage)}`);

  if (view.effects.length > 0) {
    lines.push(`  Effects (${view.effects.length}):`);
    for (const effect of view.effects) {
      lines.push(`    │ [${effect.kind}] ${effect.title} (${effect.status})`);
    }
  } else {
    lines.push('  Effects: (none)');
  }

  return lines.join('\n');
}
