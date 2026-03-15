import * as vscode from 'vscode';
import { RunCache } from '../lib/run-cache';
import { Run, RunStatus, TaskEffect } from '../types';
import {
  getStatusIcon,
  getKindIcon,
  formatDuration,
  formatRelativeTime,
  formatTimestamp,
  truncate,
} from '../lib/utils';

// ---------------------------------------------------------------------------
// Tree element types
// ---------------------------------------------------------------------------

export type TreeElement = SummaryItem | StatusGroupItem | RunTreeItem | TaskTreeItem;

// ---------------------------------------------------------------------------
// SummaryItem — top-level KPI banner
// ---------------------------------------------------------------------------

export class SummaryItem extends vscode.TreeItem {
  readonly kind = 'summary' as const;

  constructor(summary: { total: number; active: number; completed: number; failed: number; breakpoints: number }) {
    super('Babysitter Runs', vscode.TreeItemCollapsibleState.None);

    const parts: string[] = [
      `${summary.total} total`,
      `${summary.active} active`,
      `${summary.completed} done`,
      `${summary.failed} failed`,
    ];
    if (summary.breakpoints > 0) {
      parts.push(`${summary.breakpoints} breakpoint(s)`);
    }
    this.description = parts.join(' | ');
    this.iconPath = new vscode.ThemeIcon('dashboard');
    this.contextValue = 'summary';
  }
}

// ---------------------------------------------------------------------------
// StatusGroupItem — collapsible group header for a status category
// ---------------------------------------------------------------------------

export type StatusGroup = 'active' | 'completed' | 'failed';

export class StatusGroupItem extends vscode.TreeItem {
  readonly kind = 'statusGroup' as const;
  readonly group: StatusGroup;
  readonly runs: Run[];

  constructor(group: StatusGroup, runs: Run[]) {
    const label = StatusGroupItem._groupLabel(group, runs.length);
    const collapsed = group === 'active'
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.Collapsed;

    super(label, collapsed);

    this.group = group;
    this.runs = runs;
    this.iconPath = StatusGroupItem._groupIcon(group);
    this.contextValue = `statusGroup-${group}`;
  }

  private static _groupLabel(group: StatusGroup, count: number): string {
    switch (group) {
      case 'active':
        return `Active (${count})`;
      case 'completed':
        return `Completed (${count})`;
      case 'failed':
        return `Failed (${count})`;
    }
  }

  private static _groupIcon(group: StatusGroup): vscode.ThemeIcon {
    switch (group) {
      case 'active':
        return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.blue'));
      case 'completed':
        return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      case 'failed':
        return new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
    }
  }
}

// ---------------------------------------------------------------------------
// RunTreeItem — a single run
// ---------------------------------------------------------------------------

export class RunTreeItem extends vscode.TreeItem {
  readonly kind = 'run' as const;
  readonly runId: string;
  readonly run: Run;

  constructor(run: Run) {
    const label = run.processId !== 'unknown' ? run.processId : truncate(run.runId, 12);
    super(label, vscode.TreeItemCollapsibleState.Collapsed);

    this.runId = run.runId;
    this.run = run;

    // Description: task progress + relative time
    const progressPart = run.totalTasks > 0 ? `${run.completedTasks}/${run.totalTasks} tasks` : 'no tasks';
    const timePart = formatRelativeTime(run.updatedAt);
    this.description = `${progressPart} | ${timePart}`;

    // Icon
    this.iconPath = RunTreeItem._statusIcon(run);

    // Tooltip (markdown)
    this.tooltip = RunTreeItem._buildTooltip(run);

    // Context value for menus
    const hasPendingBreakpoint = run.waitingKind === 'breakpoint';
    this.contextValue = hasPendingBreakpoint ? 'run-breakpoint' : 'run';

    // Click command
    this.command = {
      command: 'babysitter.openRun',
      title: 'Open Run',
      arguments: [run.runId],
    };

    // Unique id for stable tree identity
    this.id = `run-${run.runId}`;
  }

  private static _statusIcon(run: Run): vscode.ThemeIcon {
    const iconId = getStatusIcon(run.status, run.waitingKind);
    switch (run.status) {
      case 'pending':
        return run.isStale
          ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('list.warningForeground'))
          : new vscode.ThemeIcon(iconId, new vscode.ThemeColor('charts.blue'));
      case 'waiting':
        return run.waitingKind === 'breakpoint'
          ? new vscode.ThemeIcon(iconId, new vscode.ThemeColor('debugIcon.pauseForeground'))
          : new vscode.ThemeIcon(iconId, new vscode.ThemeColor('charts.yellow'));
      case 'completed':
        return new vscode.ThemeIcon(iconId, new vscode.ThemeColor('testing.iconPassed'));
      case 'failed':
        return new vscode.ThemeIcon(iconId, new vscode.ThemeColor('testing.iconFailed'));
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }

  private static _buildTooltip(run: Run): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown(`**Run:** \`${run.runId}\`\n\n`);
    md.appendMarkdown(`**Process:** ${run.processId}\n\n`);
    md.appendMarkdown(`**Status:** ${run.status}${run.isStale ? ' (STALE)' : ''}\n\n`);
    md.appendMarkdown(`**Tasks:** ${run.completedTasks}/${run.totalTasks} completed`);
    if (run.failedTasks > 0) {
      md.appendMarkdown(`, ${run.failedTasks} failed`);
    }
    md.appendMarkdown('\n\n');
    md.appendMarkdown(`**Created:** ${formatTimestamp(run.createdAt)}\n\n`);

    if (run.duration !== undefined) {
      md.appendMarkdown(`**Duration:** ${formatDuration(run.duration)}\n\n`);
    }

    if (run.prompt) {
      md.appendMarkdown(`**Prompt:** ${truncate(run.prompt, 200)}\n\n`);
    }

    if (run.breakpointQuestion) {
      md.appendMarkdown(`**Breakpoint:** ${run.breakpointQuestion}\n\n`);
    }

    if (run.failureError) {
      md.appendMarkdown(`**Error:** ${truncate(run.failureError, 200)}\n\n`);
    }

    return md;
  }
}

// ---------------------------------------------------------------------------
// TaskTreeItem — a single task within a run
// ---------------------------------------------------------------------------

export class TaskTreeItem extends vscode.TreeItem {
  readonly kind = 'task' as const;
  readonly runId: string;
  readonly task: TaskEffect;

  constructor(task: TaskEffect, runId: string) {
    const label = task.title || task.taskId || task.effectId;
    super(label, vscode.TreeItemCollapsibleState.None);

    this.runId = runId;
    this.task = task;

    // Description: [kind] status | duration
    const parts: string[] = [`[${task.kind}]`, task.status];
    if (task.duration !== undefined) {
      parts.push(formatDuration(task.duration));
    }
    this.description = parts.join(' ');

    // Icon
    this.iconPath = TaskTreeItem._taskIcon(task);

    // Tooltip
    this.tooltip = TaskTreeItem._buildTooltip(task);

    // Context value
    const isBreakpointPending = task.kind === 'breakpoint' && task.status === 'requested';
    this.contextValue = isBreakpointPending ? 'task-breakpoint' : 'task';

    // Unique id
    this.id = `task-${runId}-${task.effectId}`;
  }

  private static _taskIcon(task: TaskEffect): vscode.ThemeIcon {
    switch (task.status) {
      case 'resolved':
        return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      case 'error':
        return new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      case 'requested': {
        const iconId = getKindIcon(task.kind);
        if (task.kind === 'breakpoint') {
          return new vscode.ThemeIcon(iconId, new vscode.ThemeColor('debugIcon.pauseForeground'));
        }
        return new vscode.ThemeIcon('loading~spin', new vscode.ThemeColor('charts.blue'));
      }
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }

  private static _buildTooltip(task: TaskEffect): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown(`**Kind:** ${task.kind}\n\n`);
    md.appendMarkdown(`**Status:** ${task.status}\n\n`);
    md.appendMarkdown(`**Effect ID:** \`${task.effectId}\`\n\n`);

    if (task.taskId) {
      md.appendMarkdown(`**Task ID:** ${task.taskId}\n\n`);
    }

    if (task.label) {
      md.appendMarkdown(`**Label:** ${task.label}\n\n`);
    }

    if (task.requestedAt) {
      md.appendMarkdown(`**Requested:** ${formatTimestamp(task.requestedAt)}\n\n`);
    }

    if (task.resolvedAt) {
      md.appendMarkdown(`**Resolved:** ${formatTimestamp(task.resolvedAt)}\n\n`);
    }

    if (task.duration !== undefined) {
      md.appendMarkdown(`**Duration:** ${formatDuration(task.duration)}\n\n`);
    }

    if (task.breakpointQuestion) {
      md.appendMarkdown(`**Question:** ${task.breakpointQuestion}\n\n`);
    }

    if (task.error) {
      md.appendMarkdown(`**Error:** ${task.error}\n\n`);
    }

    if (task.agent) {
      md.appendMarkdown(`**Agent:** ${task.agent.name}\n\n`);
    }

    return md;
  }
}

// ---------------------------------------------------------------------------
// RunsTreeDataProvider — main TreeDataProvider implementation
// ---------------------------------------------------------------------------

export class RunsTreeDataProvider implements vscode.TreeDataProvider<TreeElement> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeElement | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private statusFilter: RunStatus | null = null;

  constructor(private cache: RunCache) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  setFilter(status: RunStatus | null): void {
    this.statusFilter = status;
    this.refresh();
  }

  getTreeItem(element: TreeElement): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeElement): TreeElement[] {
    if (!element) {
      return this._getRootChildren();
    }

    if (element instanceof StatusGroupItem) {
      return this._getRunItems(element);
    }

    if (element instanceof RunTreeItem) {
      return this._getTaskItems(element);
    }

    return [];
  }

  // -------------------------------------------------------------------------
  // Root level: [SummaryItem, StatusGroupItem(Active), StatusGroupItem(Completed), StatusGroupItem(Failed)]
  // -------------------------------------------------------------------------

  private _getRootChildren(): TreeElement[] {
    const allRuns = this._getFilteredRuns();
    const summary = this._computeSummary(allRuns);

    const items: TreeElement[] = [];

    // Summary banner
    items.push(new SummaryItem(summary));

    // Group runs by status category
    const activeRuns = allRuns.filter((r) => r.status === 'pending' || r.status === 'waiting');
    const completedRuns = allRuns.filter((r) => r.status === 'completed');
    const failedRuns = allRuns.filter((r) => r.status === 'failed');

    // Sort within groups: breakpoint-waiting first, then by updatedAt desc
    activeRuns.sort((a, b) => {
      // Breakpoint runs first
      if (a.waitingKind === 'breakpoint' && b.waitingKind !== 'breakpoint') { return -1; }
      if (b.waitingKind === 'breakpoint' && a.waitingKind !== 'breakpoint') { return 1; }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    completedRuns.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    failedRuns.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Only add groups that have runs (or always add active for visibility)
    if (activeRuns.length > 0) {
      items.push(new StatusGroupItem('active', activeRuns));
    }
    if (completedRuns.length > 0) {
      items.push(new StatusGroupItem('completed', completedRuns));
    }
    if (failedRuns.length > 0) {
      items.push(new StatusGroupItem('failed', failedRuns));
    }

    return items;
  }

  // -------------------------------------------------------------------------
  // StatusGroup children: RunTreeItem[]
  // -------------------------------------------------------------------------

  private _getRunItems(group: StatusGroupItem): TreeElement[] {
    return group.runs.map((run) => new RunTreeItem(run));
  }

  // -------------------------------------------------------------------------
  // Run children: TaskTreeItem[]
  // -------------------------------------------------------------------------

  private _getTaskItems(runItem: RunTreeItem): TreeElement[] {
    const run = this.cache.getById(runItem.runId);
    if (!run) {
      return [];
    }

    // Sort tasks: requested first, then resolved, then error; within same status by requestedAt
    const sorted = [...run.tasks].sort((a, b) => {
      const statusOrder: Record<string, number> = { requested: 0, resolved: 1, error: 2 };
      const orderA = statusOrder[a.status] ?? 9;
      const orderB = statusOrder[b.status] ?? 9;
      if (orderA !== orderB) { return orderA - orderB; }
      if (a.requestedAt && b.requestedAt) {
        return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      }
      return 0;
    });

    return sorted.map((task) => new TaskTreeItem(task, runItem.runId));
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _getFilteredRuns(): Run[] {
    let runs = this.cache.getAll();

    if (this.statusFilter) {
      runs = runs.filter((r) => r.status === this.statusFilter);
    }

    return runs;
  }

  private _computeSummary(runs: Run[]): { total: number; active: number; completed: number; failed: number; breakpoints: number } {
    return {
      total: runs.length,
      active: runs.filter((r) => r.status === 'pending' || r.status === 'waiting').length,
      completed: runs.filter((r) => r.status === 'completed').length,
      failed: runs.filter((r) => r.status === 'failed').length,
      breakpoints: runs.filter((r) => r.waitingKind === 'breakpoint').length,
    };
  }
}
