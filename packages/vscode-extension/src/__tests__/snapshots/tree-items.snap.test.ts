import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  SummaryItem,
  StatusGroupItem,
  RunTreeItem,
  TaskTreeItem,
} from '../../providers/runs-tree-provider';
import { Run, TaskEffect } from '../../types';
import { TreeItemCollapsibleState, ThemeIcon, ThemeColor } from 'vscode';

// Mock current time to make relative time formatting deterministic
// Set to 2026-03-10T12:00:00Z for all tests
const MOCK_NOW = new Date('2026-03-10T12:00:00Z').getTime();

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<TaskEffect> = {}): TaskEffect {
  return {
    effectId: 'eff-001',
    kind: 'node',
    title: 'Build project',
    status: 'resolved',
    requestedAt: '2026-03-10T10:00:00Z',
    resolvedAt: '2026-03-10T10:01:00Z',
    duration: 60000,
    ...overrides,
  };
}

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    runId: 'run-abc123',
    processId: 'my-process',
    status: 'pending',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-10T10:05:00Z',
    tasks: [],
    events: [],
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    isStale: false,
    ...overrides,
  };
}

// Helper to serialize tree items for snapshot
function serializeTreeItem(item: SummaryItem | StatusGroupItem | RunTreeItem | TaskTreeItem) {
  const base = {
    label: item.label,
    description: item.description,
    contextValue: item.contextValue,
    collapsibleState: item.collapsibleState,
    id: item.id,
  };

  const iconPath = item.iconPath;
  let icon = null;
  if (iconPath instanceof ThemeIcon) {
    icon = {
      type: 'ThemeIcon',
      id: iconPath.id,
      color: iconPath.color instanceof ThemeColor ? iconPath.color.id : undefined,
    };
  }

  const tooltip = item.tooltip;
  let tooltipText = null;
  if (tooltip && typeof tooltip === 'object' && 'value' in tooltip) {
    tooltipText = tooltip.value;
  } else if (typeof tooltip === 'string') {
    tooltipText = tooltip;
  }

  const command = item.command;

  return {
    ...base,
    iconPath: icon,
    tooltip: tooltipText,
    command: command ? {
      command: command.command,
      title: command.title,
      arguments: command.arguments,
    } : undefined,
  };
}

// ---------------------------------------------------------------------------
// Snapshot Tests
// ---------------------------------------------------------------------------

describe('SummaryItem - snapshots', () => {
  it('snapshots summary with zero runs', () => {
    const item = new SummaryItem({
      total: 0,
      active: 0,
      completed: 0,
      failed: 0,
      breakpoints: 0,
    });
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots summary with all run types', () => {
    const item = new SummaryItem({
      total: 15,
      active: 5,
      completed: 8,
      failed: 2,
      breakpoints: 0,
    });
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots summary with breakpoints', () => {
    const item = new SummaryItem({
      total: 10,
      active: 3,
      completed: 5,
      failed: 2,
      breakpoints: 3,
    });
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots summary with high counts', () => {
    const item = new SummaryItem({
      total: 1000,
      active: 250,
      completed: 700,
      failed: 50,
      breakpoints: 15,
    });
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });
});

describe('StatusGroupItem - snapshots', () => {
  it('snapshots active group', () => {
    const runs = [
      makeRun({ status: 'pending' }),
      makeRun({ status: 'waiting', waitingKind: 'breakpoint' }),
    ];
    const item = new StatusGroupItem('active', runs);
    const serialized = serializeTreeItem(item);
    expect(serialized).toMatchSnapshot();
    expect(serialized.collapsibleState).toBe(TreeItemCollapsibleState.Expanded);
  });

  it('snapshots completed group', () => {
    const runs = [
      makeRun({ status: 'completed' }),
      makeRun({ status: 'completed' }),
      makeRun({ status: 'completed' }),
    ];
    const item = new StatusGroupItem('completed', runs);
    const serialized = serializeTreeItem(item);
    expect(serialized).toMatchSnapshot();
    expect(serialized.collapsibleState).toBe(TreeItemCollapsibleState.Collapsed);
  });

  it('snapshots failed group', () => {
    const runs = [
      makeRun({ status: 'failed' }),
    ];
    const item = new StatusGroupItem('failed', runs);
    const serialized = serializeTreeItem(item);
    expect(serialized).toMatchSnapshot();
    expect(serialized.collapsibleState).toBe(TreeItemCollapsibleState.Collapsed);
  });

  it('snapshots empty group', () => {
    const item = new StatusGroupItem('active', []);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });
});

describe('RunTreeItem - snapshots', () => {
  it('snapshots completed run', () => {
    const run = makeRun({
      runId: 'run-completed-001',
      processId: 'deploy-service',
      status: 'completed',
      totalTasks: 10,
      completedTasks: 10,
      failedTasks: 0,
      duration: 300000,
      createdAt: '2026-03-10T10:00:00Z',
      updatedAt: '2026-03-10T11:00:00Z', // 1h before MOCK_NOW
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots failed run', () => {
    const run = makeRun({
      runId: 'run-failed-002',
      processId: 'ci-pipeline',
      status: 'failed',
      totalTasks: 5,
      completedTasks: 3,
      failedTasks: 2,
      duration: 120000,
      failureError: 'Build failed with exit code 1',
      createdAt: '2026-03-10T11:00:00Z',
      updatedAt: '2026-03-10T11:40:00Z', // 20m before MOCK_NOW
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots pending run', () => {
    const run = makeRun({
      runId: 'run-pending-003',
      processId: 'build-app',
      status: 'pending',
      totalTasks: 8,
      completedTasks: 4,
      failedTasks: 0,
      createdAt: '2026-03-10T11:30:00Z',
      updatedAt: '2026-03-10T11:55:00Z', // 5m before MOCK_NOW
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots stale pending run', () => {
    const run = makeRun({
      runId: 'run-stale-004',
      processId: 'stale-process',
      status: 'pending',
      isStale: true,
      totalTasks: 3,
      completedTasks: 1,
      failedTasks: 0,
      createdAt: '2026-03-09T10:00:00Z',
      updatedAt: '2026-03-09T10:05:00Z',
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots waiting run with breakpoint', () => {
    const run = makeRun({
      runId: 'run-bp-005',
      processId: 'deploy-production',
      status: 'waiting',
      waitingKind: 'breakpoint',
      totalTasks: 5,
      completedTasks: 3,
      failedTasks: 0,
      breakpointQuestion: 'Deploy to production?',
      breakpointEffectId: 'bp-001',
      createdAt: '2026-03-10T13:00:00Z',
      updatedAt: '2026-03-10T13:03:00Z',
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots waiting run with task', () => {
    const run = makeRun({
      runId: 'run-waiting-006',
      processId: 'data-processing',
      status: 'waiting',
      waitingKind: 'task',
      totalTasks: 7,
      completedTasks: 5,
      failedTasks: 0,
      createdAt: '2026-03-10T14:00:00Z',
      updatedAt: '2026-03-10T14:05:00Z',
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots run with unknown processId', () => {
    const run = makeRun({
      runId: 'run-very-long-id-that-needs-truncation-abc123def456',
      processId: 'unknown',
      status: 'pending',
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      createdAt: '2026-03-10T15:00:00Z',
      updatedAt: '2026-03-10T15:00:00Z',
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots run with no tasks', () => {
    const run = makeRun({
      runId: 'run-empty-007',
      processId: 'empty-process',
      status: 'pending',
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      createdAt: '2026-03-10T16:00:00Z',
      updatedAt: '2026-03-10T16:00:00Z',
    });
    const item = new RunTreeItem(run);
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });
});

describe('TaskTreeItem - snapshots', () => {
  it('snapshots node task - resolved', () => {
    const task = makeTask({
      effectId: 'task-node-001',
      kind: 'node',
      title: 'Build application',
      status: 'resolved',
      duration: 60000,
      taskId: 'build-task',
      label: 'production',
    });
    const item = new TaskTreeItem(task, 'run-123');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots agent task - resolved', () => {
    const task = makeTask({
      effectId: 'task-agent-002',
      kind: 'agent',
      title: 'Code review',
      status: 'resolved',
      duration: 120000,
      agent: {
        name: 'code-reviewer',
        prompt: { context: 'review-pr' },
      },
    });
    const item = new TaskTreeItem(task, 'run-456');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots skill task - requested', () => {
    const task = makeTask({
      effectId: 'task-skill-003',
      kind: 'skill',
      title: 'Deploy infrastructure',
      status: 'requested',
      requestedAt: '2026-03-10T10:00:00Z',
    });
    const item = new TaskTreeItem(task, 'run-789');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots breakpoint task - requested', () => {
    const task = makeTask({
      effectId: 'task-bp-004',
      kind: 'breakpoint',
      title: 'Approval gate',
      status: 'requested',
      breakpointQuestion: 'Proceed with deployment?',
      requestedAt: '2026-03-10T10:00:00Z',
    });
    const item = new TaskTreeItem(task, 'run-012');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots breakpoint task - resolved', () => {
    const task = makeTask({
      effectId: 'task-bp-005',
      kind: 'breakpoint',
      title: 'Approval gate',
      status: 'resolved',
      breakpointQuestion: 'Proceed with deployment?',
      requestedAt: '2026-03-10T10:00:00Z',
      resolvedAt: '2026-03-10T10:05:00Z',
      duration: 300000,
    });
    const item = new TaskTreeItem(task, 'run-013');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots shell task - error', () => {
    const task = makeTask({
      effectId: 'task-shell-006',
      kind: 'shell',
      title: 'Run migration',
      status: 'error',
      error: 'Migration failed: table already exists',
      duration: 5000,
      requestedAt: '2026-03-10T10:00:00Z',
      resolvedAt: '2026-03-10T10:00:05Z',
    });
    const item = new TaskTreeItem(task, 'run-345');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots sleep task - resolved', () => {
    const task = makeTask({
      effectId: 'task-sleep-007',
      kind: 'sleep',
      title: 'Wait for service startup',
      status: 'resolved',
      duration: 30000,
    });
    const item = new TaskTreeItem(task, 'run-678');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots task with no title (uses taskId)', () => {
    const task = makeTask({
      effectId: 'task-no-title-008',
      kind: 'node',
      title: '',
      taskId: 'fallback-task-id',
      status: 'resolved',
    });
    const item = new TaskTreeItem(task, 'run-901');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots task with no title or taskId (uses effectId)', () => {
    const task = makeTask({
      effectId: 'eff-fallback-009',
      kind: 'node',
      title: '',
      taskId: undefined,
      status: 'resolved',
    });
    const item = new TaskTreeItem(task, 'run-902');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots task with all metadata fields', () => {
    const task = makeTask({
      effectId: 'task-full-010',
      kind: 'agent',
      title: 'Complex task with all fields',
      label: 'priority-high',
      status: 'resolved',
      invocationKey: 'inv-key-abc123',
      stepId: 'S000042',
      taskId: 'complex-task',
      requestedAt: '2026-03-10T10:00:00Z',
      resolvedAt: '2026-03-10T10:10:00Z',
      duration: 600000,
      agent: {
        name: 'orchestrator',
        prompt: { task: 'complex', depth: 3 },
      },
    });
    const item = new TaskTreeItem(task, 'run-full');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots task with very short duration', () => {
    const task = makeTask({
      effectId: 'task-fast-011',
      kind: 'node',
      title: 'Quick check',
      status: 'resolved',
      duration: 500,
    });
    const item = new TaskTreeItem(task, 'run-fast');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });

  it('snapshots task with no duration', () => {
    const task = makeTask({
      effectId: 'task-no-dur-012',
      kind: 'node',
      title: 'Pending task',
      status: 'requested',
      duration: undefined,
    });
    const item = new TaskTreeItem(task, 'run-pending');
    expect(serializeTreeItem(item)).toMatchSnapshot();
  });
});
