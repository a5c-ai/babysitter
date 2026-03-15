import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RunsTreeDataProvider,
  SummaryItem,
  StatusGroupItem,
  RunTreeItem,
  TaskTreeItem,
} from '../runs-tree-provider';
import { RunCache } from '../../lib/run-cache';
import { Run, TaskEffect } from '../../types';
import { TreeItemCollapsibleState, ThemeIcon, ThemeColor } from 'vscode';

// ---------------------------------------------------------------------------
// Helpers: build fixture data
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

function createMockCache(runs: Run[]): RunCache {
  const cache = {
    getAll: vi.fn(() => runs),
    getById: vi.fn((id: string) => runs.find((r) => r.runId === id) ?? undefined),
    getByStatus: vi.fn(),
    refresh: vi.fn(),
    refreshAll: vi.fn(),
    getDigests: vi.fn(),
    getSummary: vi.fn(),
  } as unknown as RunCache;
  return cache;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SummaryItem', () => {
  it('has label "Babysitter Runs"', () => {
    const item = new SummaryItem({ total: 5, active: 2, completed: 2, failed: 1, breakpoints: 0 });
    expect(item.label).toBe('Babysitter Runs');
  });

  it('has correct description without breakpoints', () => {
    const item = new SummaryItem({ total: 5, active: 2, completed: 2, failed: 1, breakpoints: 0 });
    expect(item.description).toBe('5 total | 2 active | 2 done | 1 failed');
  });

  it('includes breakpoint count in description when > 0', () => {
    const item = new SummaryItem({ total: 5, active: 2, completed: 2, failed: 1, breakpoints: 3 });
    expect(item.description).toContain('3 breakpoint(s)');
  });

  it('has dashboard icon', () => {
    const item = new SummaryItem({ total: 1, active: 0, completed: 1, failed: 0, breakpoints: 0 });
    expect(item.iconPath).toBeInstanceOf(ThemeIcon);
    expect((item.iconPath as ThemeIcon).id).toBe('dashboard');
  });

  it('has contextValue "summary"', () => {
    const item = new SummaryItem({ total: 0, active: 0, completed: 0, failed: 0, breakpoints: 0 });
    expect(item.contextValue).toBe('summary');
  });

  it('has kind "summary"', () => {
    const item = new SummaryItem({ total: 0, active: 0, completed: 0, failed: 0, breakpoints: 0 });
    expect(item.kind).toBe('summary');
  });
});

describe('StatusGroupItem', () => {
  it('displays "Active" label with count', () => {
    const runs = [makeRun({ status: 'pending' })];
    const item = new StatusGroupItem('active', runs);
    expect(item.label).toBe('Active (1)');
  });

  it('active group is expanded by default', () => {
    const item = new StatusGroupItem('active', []);
    expect(item.collapsibleState).toBe(TreeItemCollapsibleState.Expanded);
  });

  it('completed group is collapsed by default', () => {
    const item = new StatusGroupItem('completed', []);
    expect(item.collapsibleState).toBe(TreeItemCollapsibleState.Collapsed);
  });

  it('failed group is collapsed by default', () => {
    const item = new StatusGroupItem('failed', []);
    expect(item.collapsibleState).toBe(TreeItemCollapsibleState.Collapsed);
  });

  it('stores the group property', () => {
    const item = new StatusGroupItem('failed', []);
    expect(item.group).toBe('failed');
  });

  it('stores runs array', () => {
    const runs = [makeRun(), makeRun({ runId: 'run-2' })];
    const item = new StatusGroupItem('active', runs);
    expect(item.runs).toHaveLength(2);
  });
});

describe('RunTreeItem', () => {
  it('uses processId as label', () => {
    const item = new RunTreeItem(makeRun({ processId: 'deploy-prod' }));
    expect(item.label).toBe('deploy-prod');
  });

  it('uses truncated runId when processId is unknown', () => {
    const item = new RunTreeItem(makeRun({ processId: 'unknown', runId: 'abcdefghijklmnop' }));
    // truncate(runId, 12) => 'abcdefghi...' (12 chars with ellipsis)
    expect(item.label).toBe('abcdefghi...');
  });

  it('shows task progress in description', () => {
    const item = new RunTreeItem(makeRun({ totalTasks: 10, completedTasks: 5 }));
    expect(item.description).toContain('5/10 tasks');
  });

  it('shows "no tasks" when totalTasks is 0', () => {
    const item = new RunTreeItem(makeRun({ totalTasks: 0 }));
    expect(item.description).toContain('no tasks');
  });

  it('has command to open run', () => {
    const run = makeRun({ runId: 'my-run' });
    const item = new RunTreeItem(run);
    expect(item.command?.command).toBe('babysitter.openRun');
    expect(item.command?.arguments).toEqual(['my-run']);
  });

  it('has contextValue "run-breakpoint" when waiting on breakpoint', () => {
    const item = new RunTreeItem(makeRun({ status: 'waiting', waitingKind: 'breakpoint' }));
    expect(item.contextValue).toBe('run-breakpoint');
  });

  it('has contextValue "run" for non-breakpoint runs', () => {
    const item = new RunTreeItem(makeRun({ status: 'pending' }));
    expect(item.contextValue).toBe('run');
  });

  it('completed run has check icon', () => {
    const item = new RunTreeItem(makeRun({ status: 'completed' }));
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('check');
    expect(icon.color).toBeInstanceOf(ThemeColor);
  });

  it('failed run has error icon', () => {
    const item = new RunTreeItem(makeRun({ status: 'failed' }));
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('error');
  });

  it('stale pending run has warning icon', () => {
    const item = new RunTreeItem(makeRun({ status: 'pending', isStale: true }));
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('warning');
  });

  it('waiting breakpoint run has hand icon', () => {
    const item = new RunTreeItem(makeRun({ status: 'waiting', waitingKind: 'breakpoint' }));
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('hand');
  });
});

describe('TaskTreeItem', () => {
  it('uses task title as label', () => {
    const task = makeTask({ title: 'Lint code' });
    const item = new TaskTreeItem(task, 'run-1');
    expect(item.label).toBe('Lint code');
  });

  it('falls back to taskId then effectId for label', () => {
    const task = makeTask({ title: '', taskId: 'task-abc', effectId: 'eff-xyz' });
    const item = new TaskTreeItem(task, 'run-1');
    // empty string is falsy, so it tries taskId
    expect(item.label).toBe('task-abc');
  });

  it('falls back to effectId when title and taskId are absent', () => {
    const task = makeTask({ title: '', taskId: undefined, effectId: 'eff-xyz' });
    const item = new TaskTreeItem(task, 'run-1');
    expect(item.label).toBe('eff-xyz');
  });

  it('description contains kind and status', () => {
    const task = makeTask({ kind: 'node', status: 'resolved', duration: 5000 });
    const item = new TaskTreeItem(task, 'run-1');
    expect(item.description).toContain('[node]');
    expect(item.description).toContain('resolved');
    expect(item.description).toContain('5s');
  });

  it('resolved task has check icon', () => {
    const item = new TaskTreeItem(makeTask({ status: 'resolved' }), 'run-1');
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('check');
  });

  it('error task has error icon', () => {
    const item = new TaskTreeItem(makeTask({ status: 'error' }), 'run-1');
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('error');
  });

  it('requested breakpoint task has hand icon', () => {
    const item = new TaskTreeItem(makeTask({ kind: 'breakpoint', status: 'requested' }), 'run-1');
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('hand');
  });

  it('requested non-breakpoint task has loading icon', () => {
    const item = new TaskTreeItem(makeTask({ kind: 'node', status: 'requested' }), 'run-1');
    const icon = item.iconPath as ThemeIcon;
    expect(icon.id).toBe('loading~spin');
  });

  it('contextValue is "task-breakpoint" for pending breakpoints', () => {
    const item = new TaskTreeItem(makeTask({ kind: 'breakpoint', status: 'requested' }), 'run-1');
    expect(item.contextValue).toBe('task-breakpoint');
  });

  it('contextValue is "task" for regular tasks', () => {
    const item = new TaskTreeItem(makeTask({ kind: 'node', status: 'resolved' }), 'run-1');
    expect(item.contextValue).toBe('task');
  });
});

describe('RunsTreeDataProvider', () => {
  let cache: RunCache;
  let provider: RunsTreeDataProvider;

  beforeEach(() => {
    const runs = [
      makeRun({ runId: 'r1', status: 'pending', updatedAt: '2026-03-10T10:00:00Z' }),
      makeRun({ runId: 'r2', status: 'completed', updatedAt: '2026-03-10T10:01:00Z' }),
      makeRun({ runId: 'r3', status: 'failed', updatedAt: '2026-03-10T10:02:00Z' }),
      makeRun({
        runId: 'r4', status: 'waiting', waitingKind: 'breakpoint',
        updatedAt: '2026-03-10T10:03:00Z',
        tasks: [makeTask({ effectId: 'bp-1', kind: 'breakpoint', status: 'requested' })],
        totalTasks: 1,
      }),
    ];
    cache = createMockCache(runs);
    provider = new RunsTreeDataProvider(cache);
  });

  it('getChildren at root returns SummaryItem first', () => {
    const children = provider.getChildren();
    expect(children[0]).toBeInstanceOf(SummaryItem);
  });

  it('getChildren at root returns StatusGroupItems after summary', () => {
    const children = provider.getChildren();
    // Summary + active + completed + failed = 4
    expect(children.length).toBe(4);
    expect(children[1]).toBeInstanceOf(StatusGroupItem);
    expect(children[2]).toBeInstanceOf(StatusGroupItem);
    expect(children[3]).toBeInstanceOf(StatusGroupItem);
  });

  it('getChildren for StatusGroupItem returns RunTreeItems', () => {
    const rootChildren = provider.getChildren();
    const activeGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'active',
    ) as StatusGroupItem;
    expect(activeGroup).toBeDefined();
    const runItems = provider.getChildren(activeGroup);
    expect(runItems.length).toBeGreaterThan(0);
    expect(runItems[0]).toBeInstanceOf(RunTreeItem);
  });

  it('getChildren for RunTreeItem returns TaskTreeItems', () => {
    const rootChildren = provider.getChildren();
    const activeGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'active',
    ) as StatusGroupItem;
    const runItems = provider.getChildren(activeGroup);
    // Find the run with tasks (r4)
    const runWithTasks = runItems.find(
      (r) => r instanceof RunTreeItem && r.runId === 'r4',
    ) as RunTreeItem;
    expect(runWithTasks).toBeDefined();
    const taskItems = provider.getChildren(runWithTasks);
    expect(taskItems.length).toBe(1);
    expect(taskItems[0]).toBeInstanceOf(TaskTreeItem);
  });

  it('getChildren returns empty array for TaskTreeItem', () => {
    const task = new TaskTreeItem(makeTask(), 'run-1');
    expect(provider.getChildren(task)).toEqual([]);
  });

  it('refresh fires onDidChangeTreeData', () => {
    const listener = vi.fn();
    provider.onDidChangeTreeData(listener);
    provider.refresh();
    expect(listener).toHaveBeenCalled();
  });

  it('setFilter filters runs by status', () => {
    provider.setFilter('completed');
    const children = provider.getChildren();
    // Summary + completed group only
    expect(children.length).toBe(2);
    const group = children[1] as StatusGroupItem;
    expect(group.group).toBe('completed');
  });

  it('setFilter(null) removes filter', () => {
    provider.setFilter('completed');
    provider.setFilter(null);
    const children = provider.getChildren();
    // Summary + 3 groups (active, completed, failed)
    expect(children.length).toBe(4);
  });

  it('getTreeItem returns the element itself', () => {
    const item = new SummaryItem({ total: 0, active: 0, completed: 0, failed: 0, breakpoints: 0 });
    expect(provider.getTreeItem(item)).toBe(item);
  });

  it('empty groups are not shown', () => {
    const emptyCache = createMockCache([]);
    const emptyProvider = new RunsTreeDataProvider(emptyCache);
    const children = emptyProvider.getChildren();
    // Only summary item, no groups
    expect(children.length).toBe(1);
    expect(children[0]).toBeInstanceOf(SummaryItem);
  });
});
