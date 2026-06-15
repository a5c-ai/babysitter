import { describe, expect, it } from 'vitest';
import {
  buildSubagentView,
  formatSubagentSummary,
  formatSubagentDetail,
} from '../SubagentDrillDown.js';
import type { ProgressTracker, SubagentView } from '../SubagentDrillDown.js';

describe('SubagentDrillDown', () => {
  const sampleTracker: ProgressTracker = {
    agents: [
      {
        id: 'agent-1',
        status: 'completed',
        model: 'claude-sonnet-4-20250514',
        tokenUsage: { input: 1500, output: 800 },
        effects: [
          { id: 'e1', kind: 'file', title: 'Write index.ts', status: 'completed' },
          { id: 'e2', kind: 'shell', title: 'npm test', status: 'completed' },
        ],
        startedAt: 1000,
        completedAt: 31000,
      },
      {
        id: 'agent-2',
        status: 'running',
        model: 'claude-opus-4-20250514',
        tokenUsage: { input: 500, output: 200 },
        effects: [],
        startedAt: 5000,
      },
      {
        id: 'agent-3',
        status: 'error',
        model: 'claude-haiku-4-20250514',
        effects: [
          { id: 'e3', kind: 'task', title: 'Analyze codebase', status: 'failed' },
        ],
        startedAt: 2000,
        completedAt: 12000,
      },
    ],
  };

  describe('buildSubagentView', () => {
    it('constructs view data from a progress tracker', () => {
      const data = buildSubagentView(sampleTracker);
      expect(data.agents).toHaveLength(3);
      expect(data.selectedAgentId).toBeUndefined();
      expect(data.expandedEffects).toBeInstanceOf(Set);
      expect(data.expandedEffects.size).toBe(0);
    });

    it('normalizes statuses correctly', () => {
      const data = buildSubagentView(sampleTracker);
      expect(data.agents[0].status).toBe('completed');
      expect(data.agents[1].status).toBe('running');
      expect(data.agents[2].status).toBe('failed'); // "error" -> "failed"
    });

    it('computes duration from startedAt and completedAt', () => {
      const data = buildSubagentView(sampleTracker);
      expect(data.agents[0].duration).toBe(30000);
      expect(data.agents[2].duration).toBe(10000);
    });

    it('handles missing tokenUsage gracefully', () => {
      const tracker: ProgressTracker = {
        agents: [{ id: 'a', status: 'idle' }],
      };
      const data = buildSubagentView(tracker);
      expect(data.agents[0].tokenUsage).toEqual({ input: 0, output: 0 });
      expect(data.agents[0].model).toBe('unknown');
      expect(data.agents[0].duration).toBe(0);
    });
  });

  describe('formatSubagentSummary', () => {
    it('renders a compact one-line summary', () => {
      const view: SubagentView = {
        agentId: 'agent-1',
        status: 'completed',
        tokenUsage: { input: 1500, output: 800 },
        effects: [
          { id: 'e1', kind: 'file', title: 'Write', status: 'completed' },
          { id: 'e2', kind: 'shell', title: 'Test', status: 'completed' },
        ],
        duration: 30000,
        model: 'claude-sonnet-4-20250514',
      };
      const summary = formatSubagentSummary(view);

      expect(summary).toContain('agent-1');
      expect(summary).toContain('claude-sonnet-4-20250514');
      expect(summary).toContain('completed');
      expect(summary).toContain('30s');
      expect(summary).toContain('2 effects');
    });

    it('uses singular "effect" for 1 effect', () => {
      const view: SubagentView = {
        agentId: 'single',
        status: 'running',
        tokenUsage: { input: 100, output: 50 },
        effects: [{ id: 'e1', kind: 'task', title: 'Do', status: 'running' }],
        duration: 5000,
        model: 'test-model',
      };
      const summary = formatSubagentSummary(view);
      expect(summary).toContain('1 effect');
      expect(summary).not.toContain('1 effects');
    });
  });

  describe('formatSubagentDetail', () => {
    it('renders expanded detail with effects', () => {
      const view: SubagentView = {
        agentId: 'agent-1',
        status: 'completed',
        tokenUsage: { input: 1500, output: 800 },
        effects: [
          { id: 'e1', kind: 'file', title: 'Write index.ts', status: 'completed' },
          { id: 'e2', kind: 'shell', title: 'npm test', status: 'completed' },
        ],
        duration: 30000,
        model: 'claude-sonnet-4-20250514',
      };
      const detail = formatSubagentDetail(view);

      expect(detail).toContain('Agent: agent-1');
      expect(detail).toContain('Model:    claude-sonnet-4-20250514');
      expect(detail).toContain('Status:   completed');
      expect(detail).toContain('Duration: 30s');
      expect(detail).toContain('Effects (2)');
      expect(detail).toContain('[file] Write index.ts');
      expect(detail).toContain('[shell] npm test');
    });

    it('shows "(none)" when no effects', () => {
      const view: SubagentView = {
        agentId: 'empty',
        status: 'idle',
        tokenUsage: { input: 0, output: 0 },
        effects: [],
        duration: 0,
        model: 'unknown',
      };
      const detail = formatSubagentDetail(view);
      expect(detail).toContain('(none)');
    });
  });
});
