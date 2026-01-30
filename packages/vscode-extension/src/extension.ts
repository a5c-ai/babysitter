import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import {
  resolveBabysitterConfig,
  type BabysitterRawSettings,
  type ConfigIssue,
} from './core/config';
import { dispatchNewRunViaSdk, resumeExistingRunViaSdk } from './core/sdkDispatch';
import { isRunId } from './core/runId';
import { sanitizeTerminalOutput } from './core/terminalSanitize';
import type { Run } from './core/run';
import { createRunFileWatchers } from './extension/runFileWatchers';
import {
  createRunDetailsViewManager,
  type RunInteractionController,
} from './extension/runDetailsView';
import { createRunLogsViewManager } from './extension/runLogsView';
import { registerRunsTreeView } from './extension/runTreeView';

export const OUTPUT_CHANNEL_NAME = 'Babysitter';

type BabysitterApi = {
  outputChannelName: string;
};

function readRawSettings(): BabysitterRawSettings {
  const cfg = vscode.workspace.getConfiguration('babysitter');
  return {
    sdkBinaryPath: cfg.get<string>('sdk.binaryPath') ?? '',
    runsRoot: cfg.get<string>('runsRoot') ?? '',
    breakpointsApiUrl: cfg.get<string>('breakpoints.apiUrl') ?? 'http://localhost:3185',
    breakpointsEnabled: cfg.get<boolean>('breakpoints.enabled') ?? true,
  };
}

function formatIssues(issues: ConfigIssue[]): string[] {
  return issues.map((issue) => {
    const detail = issue.detail ? ` (${issue.detail})` : '';
    return `- [${issue.code}] ${issue.message}${detail}`;
  });
}

function toRunFromCommandArg(value: unknown): Run | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && value !== null && 'run' in value) {
    const candidate = (value as { run?: unknown }).run;
    if (candidate && typeof candidate === 'object' && 'id' in candidate && 'paths' in candidate)
      return candidate as Run;
  }
  if (typeof value === 'object' && value !== null && 'id' in value && 'paths' in value)
    return value as Run;
  return undefined;
}

function sanitizeForOutputChannel(text: string): string {
  return sanitizeTerminalOutput(text).trimEnd();
}

function toUriFromExplorerArg(value: unknown): vscode.Uri | undefined {
  if (!value) return undefined;
  if (value instanceof vscode.Uri) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const uri = toUriFromExplorerArg(entry);
      if (uri) return uri;
    }
    return undefined;
  }
  if (typeof value === 'object' && value !== null) {
    if ('resourceUri' in value && value.resourceUri instanceof vscode.Uri) {
      return value.resourceUri;
    }
    if ('uri' in value && value.uri instanceof vscode.Uri) {
      return value.uri;
    }
  }
  return undefined;
}

export function activate(context: vscode.ExtensionContext): BabysitterApi {
  const output = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  output.appendLine('Babysitter extension activated.');

  // Simplified interaction controller without PTY process tracking
  const interactionController: RunInteractionController = {
    getAwaitingInput: (_runId) => undefined,
    getPidForRunId: (_runId) => undefined,
    getLabelForRunId: (_runId) => undefined,
    getOutputTailForRunId: (_runId) => undefined,
    sendUserInput: (_runId, _text) => false,
    sendEnter: (_runId) => false,
    sendEsc: (_runId) => false,
    onDidChange: (_handler) => new vscode.Disposable(() => {}),
    onDidOutput: (_handler) => new vscode.Disposable(() => {}),
  };

  const runDetailsView = createRunDetailsViewManager(context, {
    interaction: interactionController,
  });
  const runLogsView = createRunLogsViewManager(context, { output });
  const runsTreeView = registerRunsTreeView(context);
  runsTreeView.setOpenRunDetailsHandler((run) => runDetailsView.open(run));
  runsTreeView.setOpenRunLogsHandler((run) => Promise.resolve(runLogsView.open(run)));

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.command = 'babysitter.showConfigurationErrors';
  status.text = 'Babysitter: Config…';
  status.tooltip = 'Babysitter configuration status';
  status.show();

  let lastNotifiedFingerprint = '';
  let runWatchersDisposable: vscode.Disposable | undefined;

  // No process cleanup needed - SDK manages processes

  const openPromptBuilderDisposable = vscode.commands.registerCommand(
    'babysitter.openPromptBuilder',
    async () => {
      try {
        const mod = await import('./extension/promptBuilderView');
        await mod.openPromptBuilder(context);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`Babysitter: failed to open prompt builder: ${message}`);
        await vscode.window.showErrorMessage(
          'Babysitter: Prompt Builder failed to load. See Output > Babysitter for details.',
        );
      }
    },
  );

  context.subscriptions.push(
    new vscode.Disposable(() => {
      runWatchersDisposable?.dispose();
      runWatchersDisposable = undefined;
    }),
  );

  const refreshConfig = async (notifyOnError: boolean): Promise<void> => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const settings = readRawSettings();

    const resolveOptions: Parameters<typeof resolveBabysitterConfig>[0] = {
      settings,
      platform: process.platform,
    };
    if (workspaceRoot !== undefined) resolveOptions.workspaceRoot = workspaceRoot;
    if (process.env.PATH !== undefined) resolveOptions.envPath = process.env.PATH;
    const result = resolveBabysitterConfig(resolveOptions);

    if (result.issues.length > 0) {
      status.text = `Babysitter: Config error (${result.issues.length})`;
      status.tooltip = result.issues.map((i) => `${i.code}: ${i.message}`).join('\n');
      runWatchersDisposable?.dispose();
      runWatchersDisposable = undefined;
      runsTreeView.setRunsRootPath(undefined);

      const fingerprint = JSON.stringify(
        result.issues.map((i) => ({ code: i.code, message: i.message, detail: i.detail })),
      );
      if (notifyOnError && fingerprint !== lastNotifiedFingerprint) {
        lastNotifiedFingerprint = fingerprint;
        const action = 'Open Settings';
        const choice = await vscode.window.showErrorMessage(
          'Babysitter: configuration error. Run "Babysitter: Show Configuration Errors" for details.',
          action,
        );
        if (choice === action) {
          await vscode.commands.executeCommand('workbench.action.openSettings', 'babysitter');
        }
      }

      return;
    }

    status.text = 'Babysitter: Ready';
    status.tooltip = `Runs root: ${result.config.runsRoot?.path ?? '(unknown)'}`;

    const runsRootPath = result.config.runsRoot?.path;
    if (!runsRootPath) {
      runWatchersDisposable?.dispose();
      runWatchersDisposable = undefined;
      runsTreeView.setRunsRootPath(undefined);
      return;
    }

    runsTreeView.setRunsRootPath(runsRootPath);

    runWatchersDisposable?.dispose();
    runWatchersDisposable = createRunFileWatchers({
      runsRootPath,
      workspaceFolder,
      debounceMs: 250,
      onBatch: (batch) => {
        const summary = batch.runIds
          .map((runId) => {
            const areas = batch.areasByRunId.get(runId);
            const areaList = areas ? Array.from(areas).sort().join(',') : '';
            return `${runId}${areaList ? ` [${areaList}]` : ''}`;
          })
          .join(', ');
        output.appendLine(`Run files changed (${batch.runIds.length}): ${summary}`);
        runsTreeView.refresh();
        runDetailsView.onRunChangeBatch(batch);
        runLogsView.onRunChangeBatch(batch);
      },
    });
  };

  const disposable = vscode.commands.registerCommand('babysitter.activate', () => {
    output.appendLine('Babysitter command executed.');
    output.show(true);
  });

  const dispatchRunDisposable = vscode.commands.registerCommand(
    'babysitter.dispatchRun',
    async (arg?: unknown): Promise<unknown> => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const workspaceRoot = workspaceFolder?.uri.fsPath;
      if (!workspaceRoot) {
        await vscode.window.showErrorMessage(
          'Babysitter: open a workspace folder to dispatch runs.',
        );
        throw new Error('No workspace folder open.');
      }

      const settings = readRawSettings();
      const resolveOptions: Parameters<typeof resolveBabysitterConfig>[0] = {
        settings,
        platform: process.platform,
      };
      resolveOptions.workspaceRoot = workspaceRoot;
      if (process.env.PATH !== undefined) resolveOptions.envPath = process.env.PATH;
      const result = resolveBabysitterConfig(resolveOptions);

      if (result.issues.length > 0 || !result.config.sdkBinary || !result.config.runsRoot) {
        output.show(true);
        output.appendLine('Babysitter: cannot dispatch run due to configuration issues:');
        for (const line of formatIssues(result.issues)) output.appendLine(line);
        await vscode.window.showErrorMessage(
          'Babysitter: configuration error. Run "Babysitter: Show Configuration Errors" for details.',
        );
        throw new Error('Configuration invalid for dispatch.');
      }

      const promptFromArg =
        typeof arg === 'string'
          ? arg
          : typeof arg === 'object' && arg !== null && 'prompt' in arg
            ? (arg as { prompt?: unknown }).prompt
            : undefined;
      const prompt =
        typeof promptFromArg === 'string' && promptFromArg.trim()
          ? promptFromArg.trim()
          : (
              await vscode.window.showInputBox({
                title: 'Dispatch new run',
                prompt: 'Enter a request to dispatch via Babysitter SDK.',
                placeHolder: 'Describe what you want Babysitter to do…',
              })
            )?.trim();
      if (!prompt) return undefined;

      output.show(true);
      output.appendLine(`Dispatching via Babysitter SDK: ${result.config.sdkBinary.path}`);

      try {
        const dispatched = await dispatchNewRunViaSdk({
          sdkBinaryPath: result.config.sdkBinary.path,
          workspaceRoot,
          runsRootPath: result.config.runsRoot.path,
          prompt,
        });

        output.appendLine(`Dispatched run: ${dispatched.runId}`);
        output.appendLine(`Run root: ${dispatched.runRootPath}`);
        if (dispatched.stdout.trim())
          output.appendLine(`SDK stdout:\n${sanitizeForOutputChannel(dispatched.stdout)}`);
        if (dispatched.stderr.trim())
          output.appendLine(`SDK stderr:\n${sanitizeForOutputChannel(dispatched.stderr)}`);

        runsTreeView.refresh();
        return dispatched;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`Dispatch failed: ${sanitizeForOutputChannel(message)}`);
        await vscode.window.showErrorMessage(
          'Babysitter: dispatch failed. See output for details.',
        );
        throw err;
      }
    },
  );

  const dispatchRunFromTaskFileDisposable = vscode.commands.registerCommand(
    'babysitter.dispatchRunFromTaskFile',
    async (arg?: unknown): Promise<void> => {
      const uri = toUriFromExplorerArg(arg);
      if (!uri || uri.scheme !== 'file') {
        await vscode.window.showErrorMessage(
          'Babysitter: select a workspace .task.md file to dispatch.',
        );
        return;
      }
      if (!uri.fsPath.toLowerCase().endsWith('.task.md')) {
        await vscode.window.showErrorMessage(
          'Babysitter: select a file ending in .task.md to dispatch.',
        );
        return;
      }

      let promptText: string;
      try {
        promptText = (await fs.promises.readFile(uri.fsPath, 'utf8')).trim();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(
          `Failed to read task file ${uri.fsPath}: ${sanitizeForOutputChannel(message)}`,
        );
        await vscode.window.showErrorMessage(
          `Babysitter: failed to read ${path.basename(uri.fsPath)}. See output for details.`,
        );
        throw err instanceof Error ? err : new Error(message);
      }

      if (!promptText) {
        await vscode.window.showErrorMessage(
          `Babysitter: ${path.basename(uri.fsPath)} is empty. Add content before dispatching.`,
        );
        return;
      }

      output.show(true);
      output.appendLine(`Dispatching run from task file: ${uri.fsPath}`);

      try {
        await vscode.commands.executeCommand('babysitter.dispatchRun', promptText);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(
          `Dispatch from task file failed (${uri.fsPath}): ${sanitizeForOutputChannel(message)}`,
        );
        await vscode.window.showErrorMessage(
          `Babysitter: dispatch failed for ${path.basename(uri.fsPath)}. See output for details.`,
        );
        throw err;
      }
    },
  );

  const resumeRunDisposable = vscode.commands.registerCommand(
    'babysitter.resumeRun',
    async (arg?: unknown): Promise<unknown> => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const workspaceRoot = workspaceFolder?.uri.fsPath;
      if (!workspaceRoot) {
        await vscode.window.showErrorMessage('Babysitter: open a workspace folder to resume runs.');
        throw new Error('No workspace folder open.');
      }

      const settings = readRawSettings();
      const resolveOptions: Parameters<typeof resolveBabysitterConfig>[0] = {
        settings,
        platform: process.platform,
      };
      resolveOptions.workspaceRoot = workspaceRoot;
      if (process.env.PATH !== undefined) resolveOptions.envPath = process.env.PATH;
      const result = resolveBabysitterConfig(resolveOptions);

      if (result.issues.length > 0 || !result.config.sdkBinary || !result.config.runsRoot) {
        output.show(true);
        output.appendLine('Babysitter: cannot resume run due to configuration issues:');
        for (const line of formatIssues(result.issues)) output.appendLine(line);
        await vscode.window.showErrorMessage(
          'Babysitter: configuration error. Run "Babysitter: Show Configuration Errors" for details.',
        );
        throw new Error('Configuration invalid for resume.');
      }

      const fromRun = toRunFromCommandArg(arg);
      const runIdFromArg =
        typeof arg === 'string'
          ? arg
          : typeof arg === 'object' && arg !== null && 'runId' in arg
            ? (arg as { runId?: unknown }).runId
            : undefined;
      const promptFromArg =
        typeof arg === 'object' && arg !== null && 'prompt' in arg
          ? (arg as { prompt?: unknown }).prompt
          : undefined;

      const runId =
        fromRun?.id ??
        (typeof runIdFromArg === 'string' && runIdFromArg.trim()
          ? runIdFromArg.trim()
          : undefined) ??
        (await (async () => {
          const runs = runsTreeView.getRunsSnapshot();
          if (runs.length === 0) {
            await vscode.window.showInformationMessage('Babysitter: no runs found to resume.');
            return undefined;
          }
          const picked = await vscode.window.showQuickPick(
            runs.map((r) => ({
              label: r.id,
              description: r.status,
              runId: r.id,
            })),
            { title: 'Select a run to resume' },
          );
          return picked?.runId;
        })());
      if (!runId) return undefined;
      if (!isRunId(runId)) {
        await vscode.window.showErrorMessage(`Babysitter: invalid run id: ${runId}`);
        throw new Error(`Invalid run id: ${runId}`);
      }

      const prompt =
        typeof promptFromArg === 'string' && promptFromArg.trim()
          ? promptFromArg.trim()
          : (
              await vscode.window.showInputBox({
                title: `Resume ${runId}`,
                prompt: 'Enter an updated request/prompt to resume this run via Babysitter SDK.',
                placeHolder: 'Describe what you want Babysitter to do next…',
              })
            )?.trim();
      if (!prompt) return undefined;

      output.show(true);
      output.appendLine(`Resuming ${runId} via Babysitter SDK: ${result.config.sdkBinary.path}`);

      try {
        const resumed = await resumeExistingRunViaSdk({
          sdkBinaryPath: result.config.sdkBinary.path,
          workspaceRoot,
          runsRootPath: result.config.runsRoot.path,
          runId,
          prompt,
        });

        output.appendLine(`Resumed run: ${resumed.runId}`);
        output.appendLine(`Run root: ${resumed.runRootPath}`);
        if (resumed.stdout.trim())
          output.appendLine(`SDK stdout:\n${sanitizeForOutputChannel(resumed.stdout)}`);
        if (resumed.stderr.trim())
          output.appendLine(`SDK stderr:\n${sanitizeForOutputChannel(resumed.stderr)}`);

        runsTreeView.refresh();
        return resumed;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`Resume failed: ${sanitizeForOutputChannel(message)}`);
        await vscode.window.showErrorMessage('Babysitter: resume failed. See output for details.');
        throw err;
      }
    },
  );

  // Removed sendEsc and sendEnter commands - SDK manages process interaction

  const showConfigErrorsDisposable = vscode.commands.registerCommand(
    'babysitter.showConfigurationErrors',
    async () => {
      output.show(true);
      output.appendLine('Babysitter configuration:');

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const settings = readRawSettings();
      const resolveOptions: Parameters<typeof resolveBabysitterConfig>[0] = {
        settings,
        platform: process.platform,
      };
      if (workspaceRoot !== undefined) resolveOptions.workspaceRoot = workspaceRoot;
      if (process.env.PATH !== undefined) resolveOptions.envPath = process.env.PATH;
      const result = resolveBabysitterConfig(resolveOptions);

      output.appendLine(`- Workspace root: ${workspaceRoot ?? '(no workspace open)'}`);
      output.appendLine(
        `- Setting (babysitter.sdk.binaryPath): ${settings.sdkBinaryPath?.trim() ? settings.sdkBinaryPath : '(default: npx)'}`,
      );
      output.appendLine(
        `- Setting (babysitter.runsRoot): ${settings.runsRoot?.trim() ? settings.runsRoot : '(default)'}`,
      );
      output.appendLine(
        `- Setting (babysitter.breakpoints.apiUrl): ${settings.breakpointsApiUrl || '(default)'}`,
      );
      output.appendLine(
        `- Setting (babysitter.breakpoints.enabled): ${settings.breakpointsEnabled}`,
      );

      if (result.issues.length === 0) {
        output.appendLine('Result: OK');
        const resolvedSdkBinary = result.config.sdkBinary;
        const resolvedRunsRoot = result.config.runsRoot;
        if (resolvedSdkBinary) {
          output.appendLine(
            `- Resolved SDK: ${resolvedSdkBinary.path} (${resolvedSdkBinary.source})`,
          );
        }
        if (resolvedRunsRoot) {
          output.appendLine(
            `- Resolved runs root: ${resolvedRunsRoot.path} (${resolvedRunsRoot.source})`,
          );
        }
        await vscode.window.showInformationMessage('Babysitter: configuration looks good.');
        return;
      }

      output.appendLine('Result: ERRORS');
      for (const line of formatIssues(result.issues)) output.appendLine(line);

      const action = 'Open Settings';
      const choice = await vscode.window.showErrorMessage(
        `Babysitter: found ${result.issues.length} configuration issue(s). See Babysitter output for details.`,
        action,
      );
      if (choice === action) {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'babysitter');
      }
    },
  );

  // Removed locateOBinary and installOInWorkspace commands - SDK is managed via npm

  void refreshConfig(true);

  context.subscriptions.push(
    output,
    status,
    disposable,
    openPromptBuilderDisposable,
    dispatchRunDisposable,
    dispatchRunFromTaskFileDisposable,
    resumeRunDisposable,
    showConfigErrorsDisposable,
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('babysitter')) void refreshConfig(false);
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void refreshConfig(false);
    }),
  );
  return { outputChannelName: OUTPUT_CHANNEL_NAME };
}

export function deactivate(): void {
  // no-op
}
