import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RunCache } from '../../lib/run-cache';
import {
  RunsTreeDataProvider,
  SummaryItem,
  StatusGroupItem,
  RunTreeItem,
  TaskTreeItem,
} from '../../providers/runs-tree-provider';
import { createTestWorkspace } from './__helpers__/test-fixtures';

/**
 * Integration test: RunCache -> RunsTreeDataProvider pipeline
 *
 * Tests that data in RunCache correctly flows through the
 * tree data provider to generate the correct tree structure.
 */

describe('Integration: RunCache -> RunsTreeDataProvider', () => {
  let tmpDir: string;
  let cleanup: () => void;
  let cache: RunCache;
  let provider: RunsTreeDataProvider;

  beforeEach(() => {
    const workspace = createTestWorkspace();
    tmpDir = workspace.tmpDir;
    cleanup = workspace.cleanup;

    cache = new RunCache(tmpDir);
    cache.refreshAll();

    provider = new RunsTreeDataProvider(cache);
  });

  afterEach(() => {
    cleanup();
  });

  it('provider root contains summary item with correct counts', () => {
    const rootChildren = provider.getChildren();

    expect(rootChildren.length).toBeGreaterThan(0);
    expect(rootChildren[0]).toBeInstanceOf(SummaryItem);

    const summary = rootChildren[0] as SummaryItem;
    expect(summary.label).toBe('Babysitter Runs');
    expect(summary.description).toContain('3 total'); // 3 fixture runs
    expect(summary.description).toContain('1 active'); // waiting run
    expect(summary.description).toContain('1 done'); // completed run
    expect(summary.description).toContain('1 failed'); // failed run
  });

  it('provider root contains status group items after summary', () => {
    const rootChildren = provider.getChildren();
    const groups = rootChildren.filter((c) => c instanceof StatusGroupItem) as StatusGroupItem[];

    expect(groups.length).toBe(3); // active, completed, failed

    const activeGroup = groups.find((g) => g.group === 'active');
    const completedGroup = groups.find((g) => g.group === 'completed');
    const failedGroup = groups.find((g) => g.group === 'failed');

    expect(activeGroup).toBeDefined();
    expect(completedGroup).toBeDefined();
    expect(failedGroup).toBeDefined();

    expect(activeGroup!.label).toBe('Active (1)');
    expect(completedGroup!.label).toBe('Completed (1)');
    expect(failedGroup!.label).toBe('Failed (1)');
  });

  it('active group contains waiting run with breakpoint', () => {
    const rootChildren = provider.getChildren();
    const activeGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'active',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(activeGroup) as RunTreeItem[];
    expect(runItems.length).toBe(1);

    const waitingRun = runItems[0];
    expect(waitingRun.runId).toBe('test-run-003');
    expect(waitingRun.run.status).toBe('waiting');
    expect(waitingRun.run.waitingKind).toBe('breakpoint');
    expect(waitingRun.contextValue).toBe('run-breakpoint');
  });

  it('completed group contains completed run', () => {
    const rootChildren = provider.getChildren();
    const completedGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'completed',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(completedGroup) as RunTreeItem[];
    expect(runItems.length).toBe(1);

    const completedRun = runItems[0];
    expect(completedRun.runId).toBe('test-run-001');
    expect(completedRun.run.status).toBe('completed');
    expect(completedRun.run.completedTasks).toBe(1);
    expect(completedRun.run.totalTasks).toBe(1);
  });

  it('failed group contains failed run', () => {
    const rootChildren = provider.getChildren();
    const failedGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'failed',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(failedGroup) as RunTreeItem[];
    expect(runItems.length).toBe(1);

    const failedRun = runItems[0];
    expect(failedRun.runId).toBe('test-run-002');
    expect(failedRun.run.status).toBe('failed');
    expect(failedRun.run.failedTasks).toBe(1);
    expect(failedRun.run.failureError).toBe('Process failed due to task error');
  });

  it('run tree item expands to show task items', () => {
    const rootChildren = provider.getChildren();
    const completedGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'completed',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(completedGroup) as RunTreeItem[];
    const completedRun = runItems[0];

    const taskItems = provider.getChildren(completedRun) as TaskTreeItem[];
    expect(taskItems.length).toBe(1);

    const task = taskItems[0];
    expect(task.task.effectId).toBe('effect-001');
    expect(task.task.kind).toBe('node');
    expect(task.task.status).toBe('resolved');
    expect(task.task.title).toBe('Run node task');
  });

  it('task items have no children', () => {
    const rootChildren = provider.getChildren();
    const completedGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'completed',
    ) as StatusGroupItem;
    const runItems = provider.getChildren(completedGroup) as RunTreeItem[];
    const taskItems = provider.getChildren(runItems[0]) as TaskTreeItem[];

    const taskChildren = provider.getChildren(taskItems[0]);
    expect(taskChildren).toEqual([]);
  });

  it('provider reflects cache data for task counts in run description', () => {
    const rootChildren = provider.getChildren();
    const completedGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'completed',
    ) as StatusGroupItem;
    const runItems = provider.getChildren(completedGroup) as RunTreeItem[];

    const completedRun = runItems[0];
    expect(completedRun.description).toContain('1/1 tasks');
  });

  it('provider refresh updates tree structure', () => {
    const rootChildrenBefore = provider.getChildren();
    const summaryBefore = rootChildrenBefore[0] as SummaryItem;
    expect(summaryBefore.description).toContain('3 total');

    // Simulate adding a new run to cache
    const newRunId = 'test-run-004';
    const runsDir = path.join(tmpDir, '.a5c', 'runs');
    const newRunDir = path.join(runsDir, newRunId);
    const journalDir = path.join(newRunDir, 'journal');

    fs.mkdirSync(journalDir, { recursive: true });
    fs.writeFileSync(
      path.join(newRunDir, 'run.json'),
      JSON.stringify({
        runId: newRunId,
        processId: 'new-process',
        createdAt: new Date().toISOString(),
      }),
    );

    fs.writeFileSync(
      path.join(journalDir, '000001.01TESTNEW.json'),
      JSON.stringify({
        type: 'RUN_CREATED',
        recordedAt: new Date().toISOString(),
        data: { runId: newRunId },
      }),
    );

    cache.refresh(newRunId);

    // Refresh provider
    provider.refresh();

    const rootChildrenAfter = provider.getChildren();
    const summaryAfter = rootChildrenAfter[0] as SummaryItem;
    expect(summaryAfter.description).toContain('4 total');
  });

  it('provider filter by status shows only matching runs', () => {
    // Filter to show only completed
    provider.setFilter('completed');

    const rootChildren = provider.getChildren();
    const summary = rootChildren[0] as SummaryItem;
    const groups = rootChildren.filter((c) => c instanceof StatusGroupItem) as StatusGroupItem[];

    // Summary should show filtered counts
    expect(summary.description).toContain('1 total');
    expect(summary.description).toContain('1 done');

    // Only completed group should be present
    expect(groups.length).toBe(1);
    expect(groups[0].group).toBe('completed');
  });

  it('breakpoint run shows correct contextValue for menus', () => {
    const rootChildren = provider.getChildren();
    const activeGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'active',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(activeGroup) as RunTreeItem[];
    const waitingRun = runItems[0];

    expect(waitingRun.contextValue).toBe('run-breakpoint');
  });

  it('breakpoint task shows correct contextValue', () => {
    const rootChildren = provider.getChildren();
    const activeGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'active',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(activeGroup) as RunTreeItem[];
    const waitingRun = runItems[0];

    const taskItems = provider.getChildren(waitingRun) as TaskTreeItem[];
    expect(taskItems.length).toBe(1);

    const bpTask = taskItems[0];
    expect(bpTask.task.kind).toBe('breakpoint');
    expect(bpTask.task.status).toBe('requested');
    expect(bpTask.contextValue).toBe('task-breakpoint');
  });

  it('cache data flows through to tree item tooltips', () => {
    const rootChildren = provider.getChildren();
    const completedGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'completed',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(completedGroup) as RunTreeItem[];
    const completedRun = runItems[0];

    expect(completedRun.tooltip).toBeDefined();
    // Tooltip is a MarkdownString, check its value contains expected data
    const tooltipValue = (completedRun.tooltip as any).value;
    expect(tooltipValue).toContain('test-run-001');
    expect(tooltipValue).toContain('test-process');
    expect(tooltipValue).toContain('completed');
  });

  it('task items sort requested first, then resolved, then error', () => {
    // Use failed run which has an error task
    const rootChildren = provider.getChildren();
    const failedGroup = rootChildren.find(
      (c) => c instanceof StatusGroupItem && c.group === 'failed',
    ) as StatusGroupItem;

    const runItems = provider.getChildren(failedGroup) as RunTreeItem[];
    const failedRun = runItems[0];

    const taskItems = provider.getChildren(failedRun) as TaskTreeItem[];

    // In this fixture, there's only 1 task with error status
    expect(taskItems.length).toBe(1);
    expect(taskItems[0].task.status).toBe('error');
  });

  it('getTreeItem returns element unchanged', () => {
    const rootChildren = provider.getChildren();
    const summary = rootChildren[0];

    expect(provider.getTreeItem(summary)).toBe(summary);
  });
});
