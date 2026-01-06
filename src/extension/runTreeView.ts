import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import type { Run } from '../core/run';
import { discoverRuns } from '../core/runDiscovery';
import { formatRunStatus, runStatusThemeIconId } from '../core/runPresentation';

type RunTreeItemOrRun = RunTreeItem | Run;

function isRunTreeItem(value: unknown): value is RunTreeItem {
  return typeof value === 'object' && value !== null && 'run' in value;
}

function toRun(value: unknown): Run | undefined {
  if (!value) return undefined;
  if (isRunTreeItem(value)) return value.run;
  if (typeof value === 'object' && value !== null && 'id' in value && 'paths' in value)
    return value as Run;
  return undefined;
}

class RunTreeItem extends vscode.TreeItem {
  public readonly run: Run;

  constructor(run: Run) {
    super(run.id, vscode.TreeItemCollapsibleState.None);
    this.run = run;
    this.description = formatRunStatus(run.status);
    this.tooltip = `${run.id}\n${formatRunStatus(run.status)}\n${run.paths.runRoot}`;
    this.iconPath = new vscode.ThemeIcon(runStatusThemeIconId(run.status));
    this.contextValue = 'babysitterRun';
    this.resourceUri = vscode.Uri.file(run.paths.runRoot);
    this.command = {
      command: 'babysitter.openRunDetails',
      title: 'Open Run Details',
      arguments: [this],
    };
  }
}

class MessageTreeItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'babysitterMessage';
  }
}

class RunsTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData: vscode.Event<void> = this.onDidChangeTreeDataEmitter.event;

  private runsRootPath: string | undefined;
  private runs: Run[] = [];

  public setRunsRootPath(runsRootPath: string | undefined): void {
    this.runsRootPath = runsRootPath;
    this.refresh();
  }

  public getRunsSnapshot(): Run[] {
    return this.runs.slice();
  }

  public refresh(): void {
    if (!this.runsRootPath) {
      this.runs = [];
      this.onDidChangeTreeDataEmitter.fire();
      return;
    }

    this.runs = discoverRuns(this.runsRootPath);
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element) return [];

    if (!this.runsRootPath) {
      return [new MessageTreeItem('Babysitter: configure runs root to see runs')];
    }

    if (!fs.existsSync(this.runsRootPath)) {
      return [new MessageTreeItem(`Runs root not found: ${this.runsRootPath}`)];
    }

    if (this.runs.length === 0) {
      return [new MessageTreeItem('No runs found')];
    }

    return this.runs.map((r) => new RunTreeItem(r));
  }
}

async function pickRun(runs: Run[]): Promise<Run | undefined> {
  if (runs.length === 0) {
    await vscode.window.showInformationMessage('Babysitter: no runs found.');
    return undefined;
  }

  const pick = await vscode.window.showQuickPick(
    runs.map((r) => ({
      label: r.id,
      description: formatRunStatus(r.status),
      run: r,
    })),
    { title: 'Select a run' },
  );
  return pick?.run;
}

async function openStateJson(run: Run): Promise<void> {
  const uri = vscode.Uri.file(run.paths.stateJson);
  try {
    await vscode.window.showTextDocument(uri, { preview: true });
  } catch {
    await vscode.window.showWarningMessage(`Babysitter: could not open ${run.paths.stateJson}`);
  }
}

function getRunsArchiveRootFromRun(run: Run): string {
  const runsRoot = path.dirname(run.paths.runRoot);
  return path.join(path.dirname(runsRoot), 'runs_archive');
}

async function archiveRun(run: Run): Promise<void> {
  const choice = await vscode.window.showWarningMessage(
    `Archive run ${run.id}? It will be moved to runs_archive and hidden from the runs list.`,
    { modal: true },
    'Archive',
  );
  if (choice !== 'Archive') return;

  const archiveRoot = getRunsArchiveRootFromRun(run);
  const dest = path.join(archiveRoot, run.id);
  try {
    fs.mkdirSync(archiveRoot, { recursive: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await vscode.window.showWarningMessage(
      `Babysitter: could not create runs_archive (${message})`,
    );
    return;
  }

  if (fs.existsSync(dest)) {
    await vscode.window.showWarningMessage(
      `Babysitter: archive destination already exists: ${dest}`,
    );
    return;
  }

  try {
    fs.renameSync(run.paths.runRoot, dest);
    vscode.window.setStatusBarMessage(`Babysitter: archived ${run.id}`, 2500);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await vscode.window.showWarningMessage(`Babysitter: could not archive run (${message})`);
  }
}

async function markRunComplete(run: Run): Promise<void> {
  const choice = await vscode.window.showWarningMessage(
    `Mark run ${run.id} as completed? This edits state.json.`,
    { modal: true },
    'Mark Completed',
  );
  if (choice !== 'Mark Completed') return;

  let raw = '';
  try {
    raw = fs.readFileSync(run.paths.stateJson, 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await vscode.window.showWarningMessage(`Babysitter: could not read state.json (${message})`);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await vscode.window.showWarningMessage(`Babysitter: state.json is not valid JSON (${message})`);
    return;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    await vscode.window.showWarningMessage('Babysitter: state.json must be a JSON object.');
    return;
  }

  (parsed as Record<string, unknown>)['status'] = 'completed';
  try {
    fs.writeFileSync(run.paths.stateJson, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
    vscode.window.setStatusBarMessage(`Babysitter: marked ${run.id} completed`, 2500);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await vscode.window.showWarningMessage(`Babysitter: could not write state.json (${message})`);
  }
}

export function registerRunsTreeView(context: vscode.ExtensionContext): {
  setRunsRootPath: (runsRootPath: string | undefined) => void;
  refresh: () => void;
  getRunsSnapshot: () => Run[];
  setOpenRunDetailsHandler: (handler: ((run: Run) => Promise<void>) | undefined) => void;
  setOpenRunLogsHandler: (handler: ((run: Run) => Promise<void>) | undefined) => void;
} {
  const provider = new RunsTreeDataProvider();
  context.subscriptions.push(vscode.window.registerTreeDataProvider('babysitter.runs', provider));

  const refreshDisposable = vscode.commands.registerCommand('babysitter.runs.refresh', () => {
    provider.refresh();
  });

  const defaultOpenRunDetails = async (run: Run): Promise<void> => openStateJson(run);
  let openRunDetailsHandler: (run: Run) => Promise<void> = defaultOpenRunDetails;

  const defaultOpenRunLogs = async (run: Run): Promise<void> => {
    const uri = vscode.Uri.file(run.paths.journalJsonl);
    try {
      await vscode.window.showTextDocument(uri, { preview: true });
    } catch {
      await vscode.window.showWarningMessage(
        `Babysitter: could not open ${run.paths.journalJsonl}`,
      );
    }
  };
  let openRunLogsHandler: (run: Run) => Promise<void> = defaultOpenRunLogs;

  const openRunDetailsDisposable = vscode.commands.registerCommand(
    'babysitter.openRunDetails',
    async (target?: RunTreeItemOrRun) => {
      const fromArg = toRun(target);
      const run = fromArg ?? (await pickRun(provider.getRunsSnapshot()));
      if (!run) return;
      await openRunDetailsHandler(run);
    },
  );

  const openRunLogsDisposable = vscode.commands.registerCommand(
    'babysitter.openRunLogs',
    async (target?: RunTreeItemOrRun) => {
      const fromArg = toRun(target);
      const run = fromArg ?? (await pickRun(provider.getRunsSnapshot()));
      if (!run) return;
      await openRunLogsHandler(run);
    },
  );

  const revealRunFolderDisposable = vscode.commands.registerCommand(
    'babysitter.revealRunFolder',
    async (target?: RunTreeItemOrRun) => {
      const fromArg = toRun(target);
      const run = fromArg ?? (await pickRun(provider.getRunsSnapshot()));
      if (!run) return;
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(run.paths.runRoot));
      } catch {
        await vscode.window.showWarningMessage(
          'Babysitter: could not reveal run folder (path not found)',
        );
        return;
      }
      try {
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(run.paths.runRoot));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await vscode.window.showWarningMessage(
          `Babysitter: could not reveal run folder (${message})`,
        );
      }
    },
  );

  const archiveRunDisposable = vscode.commands.registerCommand(
    'babysitter.archiveRun',
    async (target?: RunTreeItemOrRun) => {
      const fromArg = toRun(target);
      const run = fromArg ?? (await pickRun(provider.getRunsSnapshot()));
      if (!run) return;
      await archiveRun(run);
      provider.refresh();
    },
  );

  const markCompleteDisposable = vscode.commands.registerCommand(
    'babysitter.markRunComplete',
    async (target?: RunTreeItemOrRun) => {
      const fromArg = toRun(target);
      const run = fromArg ?? (await pickRun(provider.getRunsSnapshot()));
      if (!run) return;
      await markRunComplete(run);
      provider.refresh();
    },
  );

  context.subscriptions.push(
    refreshDisposable,
    openRunDetailsDisposable,
    openRunLogsDisposable,
    revealRunFolderDisposable,
    archiveRunDisposable,
    markCompleteDisposable,
  );

  return {
    setRunsRootPath: (runsRootPath: string | undefined) => provider.setRunsRootPath(runsRootPath),
    refresh: () => provider.refresh(),
    getRunsSnapshot: () => provider.getRunsSnapshot(),
    setOpenRunDetailsHandler: (handler) => {
      openRunDetailsHandler = handler ?? defaultOpenRunDetails;
    },
    setOpenRunLogsHandler: (handler) => {
      openRunLogsHandler = handler ?? defaultOpenRunLogs;
    },
  };
}
