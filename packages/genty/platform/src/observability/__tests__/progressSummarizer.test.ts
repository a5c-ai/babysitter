import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  summarizeProgress,
  formatProgressText,
  formatProgressJson,
  type ProgressSummary,
} from '../progressSummarizer';

describe('summarizeProgress', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'progress-'));
  });
  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty summary for empty run dir', () => {
    const summary = summarizeProgress(tempDir);
    expect(summary.totalSteps).toBe(0);
    expect(summary.completedSteps).toBe(0);
    expect(summary.failedSteps).toBe(0);
    expect(summary.activeAgents).toEqual([]);
    expect(summary.estimatedCompletion).toBeNull();
    expect(summary.highlights).toEqual([]);
  });

  it('counts completed and failed tasks from journal events', () => {
    const events = [
      { taskId: 't1', status: 'running', agent: 'agent-1' },
      { taskId: 't1', status: 'completed', agent: 'agent-1', message: 'Task 1 done' },
      { taskId: 't2', status: 'running', agent: 'agent-2' },
      { taskId: 't2', status: 'failed', agent: 'agent-2', message: 'Task 2 failed' },
      { taskId: 't3', status: 'running', agent: 'agent-3' },
    ];
    writeFileSync(
      join(tempDir, 'journal.jsonl'),
      events.map((e) => JSON.stringify(e)).join('\n'),
      'utf8',
    );

    const summary = summarizeProgress(tempDir);
    expect(summary.totalSteps).toBe(3);
    expect(summary.completedSteps).toBe(1);
    expect(summary.failedSteps).toBe(1);
    expect(summary.activeAgents).toContain('agent-3');
    expect(summary.estimatedCompletion).toBe(33); // 1/3 * 100 rounded
    expect(summary.highlights).toContain('Task 1 done');
    expect(summary.highlights).toContain('Task 2 failed');
  });

  it('reads tasks from state.json', () => {
    const state = {
      tasks: [
        { id: 's1', status: 'completed' },
        { id: 's2', status: 'completed' },
        { id: 's3', status: 'running' },
      ],
    };
    writeFileSync(join(tempDir, 'state.json'), JSON.stringify(state), 'utf8');

    const summary = summarizeProgress(tempDir);
    expect(summary.totalSteps).toBe(3);
    expect(summary.completedSteps).toBe(2);
    expect(summary.estimatedCompletion).toBe(67);
  });

  it('removes agent from active set when terminal event received', () => {
    const events = [
      { taskId: 't1', status: 'running', agent: 'agent-1' },
      { taskId: 't1', status: 'completed', agent: 'agent-1' },
    ];
    writeFileSync(
      join(tempDir, 'journal.jsonl'),
      events.map((e) => JSON.stringify(e)).join('\n'),
      'utf8',
    );

    const summary = summarizeProgress(tempDir);
    expect(summary.activeAgents).not.toContain('agent-1');
  });
});

// ---------------------------------------------------------------------------
// formatProgressText
// ---------------------------------------------------------------------------

describe('formatProgressText', () => {
  it('renders a compact text summary', () => {
    const summary: ProgressSummary = {
      totalSteps: 10,
      completedSteps: 7,
      failedSteps: 1,
      activeAgents: ['agent-1', 'agent-2'],
      estimatedCompletion: 70,
      highlights: ['Built widgets', 'Tests passed'],
    };

    const text = formatProgressText(summary);
    expect(text).toContain('7/10 steps completed (70%)');
    expect(text).toContain('Failed: 1 steps');
    expect(text).toContain('agent-1, agent-2');
    expect(text).toContain('Built widgets');
  });

  it('omits failed line when no failures', () => {
    const summary: ProgressSummary = {
      totalSteps: 5,
      completedSteps: 5,
      failedSteps: 0,
      activeAgents: [],
      estimatedCompletion: 100,
      highlights: [],
    };

    const text = formatProgressText(summary);
    expect(text).not.toContain('Failed');
  });
});

// ---------------------------------------------------------------------------
// formatProgressJson
// ---------------------------------------------------------------------------

describe('formatProgressJson', () => {
  it('returns valid JSON', () => {
    const summary: ProgressSummary = {
      totalSteps: 3,
      completedSteps: 2,
      failedSteps: 0,
      activeAgents: ['a1'],
      estimatedCompletion: 67,
      highlights: [],
    };

    const json = formatProgressJson(summary);
    const parsed = JSON.parse(json);
    expect(parsed.totalSteps).toBe(3);
    expect(parsed.completedSteps).toBe(2);
    expect(parsed.activeAgents).toEqual(['a1']);
  });
});
