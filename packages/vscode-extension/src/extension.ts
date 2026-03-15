import * as vscode from 'vscode';
import * as path from 'path';
import { RunCache } from './lib/run-cache';
import { RunWatcher } from './lib/watcher';
import { RunsTreeDataProvider } from './providers/runs-tree-provider';
import { RunDetailPanel } from './panels/run-detail-panel';
import { approveBreakpoint } from './panels/breakpoint-handler';
import { StatusBarController } from './status-bar';
import type { RunStatus } from './types';
import type { WatcherEvent } from './lib/watcher';

let cache: RunCache;
let watcher: RunWatcher;
let treeProvider: RunsTreeDataProvider;
let statusBar: StatusBarController;

export function activate(context: vscode.ExtensionContext): void {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    void vscode.window.showInformationMessage(
      'Babysitter Observer: Open a workspace to monitor runs.',
    );
    return;
  }
  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  // ---------------------------------------------------------------------------
  // Initialize core components
  // ---------------------------------------------------------------------------

  cache = new RunCache(workspaceRoot);
  cache.refreshAll();

  watcher = new RunWatcher(workspaceRoot);

  treeProvider = new RunsTreeDataProvider(cache);
  const treeView = vscode.window.createTreeView('babysitter-runs', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  statusBar = new StatusBarController(cache);

  // ---------------------------------------------------------------------------
  // Wire watcher -> cache -> tree + status bar + webview panels
  // ---------------------------------------------------------------------------

  watcher.onDidChange((event: WatcherEvent) => {
    if (event.type === 'run-changed' || event.type === 'new-run') {
      cache.refresh(event.runId);
    } else {
      cache.refreshAll();
    }
    treeProvider.refresh();
    statusBar.update();

    // Update any open webview panels
    RunDetailPanel.currentPanels.forEach((panel) => {
      panel.update(cache, workspaceRoot);
    });
  });

  watcher.start();

  // ---------------------------------------------------------------------------
  // Register commands
  // ---------------------------------------------------------------------------

  context.subscriptions.push(
    vscode.commands.registerCommand('babysitter.refresh', () => {
      cache.refreshAll();
      treeProvider.refresh();
      statusBar.update();
    }),

    vscode.commands.registerCommand('babysitter.openRun', (runId: string) => {
      if (!runId) { return; }
      RunDetailPanel.createOrShow(context.extensionUri, cache, runId, workspaceRoot);
    }),

    vscode.commands.registerCommand('babysitter.filterRuns', async () => {
      const options: Array<{ label: string; value: RunStatus | null }> = [
        { label: 'All', value: null },
        { label: 'Pending', value: 'pending' },
        { label: 'Waiting', value: 'waiting' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ];
      const picked = await vscode.window.showQuickPick(
        options.map((o) => o.label),
        { placeHolder: 'Filter runs by status' },
      );
      if (picked !== undefined) {
        const selected = options.find((o) => o.label === picked);
        treeProvider.setFilter(selected?.value ?? null);
      }
    }),

    vscode.commands.registerCommand(
      'babysitter.approveBreakpoint',
      async (runId: string, effectId: string) => {
        if (!runId || !effectId) { return; }
        const success = await approveBreakpoint(workspaceRoot, runId, effectId);
        if (success) {
          cache.refresh(runId);
          treeProvider.refresh();
          statusBar.update();
        }
      },
    ),

    vscode.commands.registerCommand('babysitter.copyRunId', (runId: string) => {
      if (runId) {
        void vscode.env.clipboard.writeText(runId);
        void vscode.window.showInformationMessage(`Copied: ${runId}`);
      }
    }),

    vscode.commands.registerCommand('babysitter.openRunDir', (runId: string) => {
      if (runId) {
        const runDir = vscode.Uri.file(
          path.join(workspaceRoot, '.a5c', 'runs', runId),
        );
        void vscode.commands.executeCommand('revealFileInOS', runDir);
      }
    }),

    treeView,
    watcher,
    statusBar,
  );

  // ---------------------------------------------------------------------------
  // Log activation
  // ---------------------------------------------------------------------------

  const outputChannel = vscode.window.createOutputChannel('Babysitter Observer');
  context.subscriptions.push(outputChannel);
  outputChannel.appendLine(
    `Babysitter Observer activated. Watching: ${path.join(workspaceRoot, '.a5c', 'runs')}`,
  );
}

export function deactivate(): void {
  RunDetailPanel.currentPanels.forEach((p) => p.dispose());
  RunDetailPanel.currentPanels.clear();
}
