import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import {
  resolveBabysitterConfig,
  type BabysitterRawSettings,
  type ConfigIssue,
} from './core/config';
import { dispatchNewRunViaO, resumeExistingRunViaO } from './core/oDispatch';
import {
  findGitBashCandidates,
  firstExistingPath,
  isWslAvailable,
  runOInstaller,
  type OInstallOptions,
  type WindowsInstallerRuntime,
} from './core/oInstaller';
import type { PtyProcess } from './core/ptyProcess';
import { OProcessInteractionTracker } from './core/oProcessInteraction';
import { isRunId } from './core/runId';
import { listRunIds, waitForNewRunId } from './core/runPolling';
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
    oBinaryPath: cfg.get<string>('o.binaryPath') ?? '',
    oPath: cfg.get<string>('oPath') ?? '',
    runsRoot: cfg.get<string>('runsRoot') ?? '',
    globalConfigPath: cfg.get<string>('globalConfigPath') ?? '',
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

  const interactions = new OProcessInteractionTracker();
  const interactionController: RunInteractionController = {
    getAwaitingInput: (runId) => interactions.getAwaitingInputForRunId(runId),
    getPidForRunId: (runId) => interactions.getPidForRunId(runId),
    getLabelForRunId: (runId) => interactions.getLabelForRunId(runId),
    getOutputTailForRunId: (runId) => interactions.getOutputTailForRunId(runId),
    sendUserInput: (runId, text) => {
      const toRun = interactions.sendUserInputToRunId(runId, text);
      return Boolean(toRun);
    },
    sendEnter: (runId) => {
      const toRun = interactions.sendEnterToRunId(runId);
      return Boolean(toRun);
    },
    sendEsc: (runId) => {
      const toRun = interactions.sendEscToRunId(runId);
      return Boolean(toRun);
    },
    onDidChange: (handler) =>
      new vscode.Disposable(
        interactions.onDidChange((change) => {
          if (change.runId) handler(change.runId);
        }),
      ),
    onDidOutput: (handler) =>
      new vscode.Disposable(
        interactions.onDidOutput((evt) => {
          if (!evt.runId) return;
          handler({ runId: evt.runId, chunk: evt.chunk });
        }),
      ),
  };

  const runDetailsView = createRunDetailsViewManager(context, {
    interaction: interactionController,
  });
  const runLogsView = createRunLogsViewManager(context, { interactions, output });
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

  const registerOProcess = (process: PtyProcess, label: string): void => {
    interactions.register(process, label);
    process.onExit(() => {
      // Do not kill running `o` processes on exit; just detach listeners.
      process.detach();
    });
  };

  const isLikelyWindowsNativeBinary = (filePath: string): boolean => {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.exe' || ext === '.com' || ext === '.cmd' || ext === '.bat';
  };

  let cachedWslAvailable: boolean | undefined;
  const getWslAvailable = async (): Promise<boolean> => {
    if (cachedWslAvailable === undefined) cachedWslAvailable = await isWslAvailable();
    return cachedWslAvailable;
  };

  const resolveWindowsInvocationOptions = async (
    folder: vscode.WorkspaceFolder,
    oBinaryPath: string,
  ): Promise<{ windowsRuntime?: 'wsl'; windowsBashPath?: string }> => {
    if (process.platform !== 'win32') return {};
    if (isLikelyWindowsNativeBinary(oBinaryPath)) return {};

    if (await getWslAvailable()) {
      return { windowsRuntime: 'wsl' };
    }

    const cfg = vscode.workspace.getConfiguration('babysitter', folder.uri);
    const configuredBashPath = (cfg.get<string>('o.install.bashPath') ?? '').trim();
    const detectedGitBashPath =
      (configuredBashPath && fs.existsSync(configuredBashPath) ? configuredBashPath : '') ||
      firstExistingPath(findGitBashCandidates());

    if (!detectedGitBashPath) return {};
    return { windowsBashPath: detectedGitBashPath };
  };

  const bashSingleQuote = (value: string): string => `'${value.replace(/'/g, `'"'"'`)}'`;

  const openGitBashTerminalAndSend = (params: {
    name: string;
    bashPath: string;
    workspaceRoot: string;
    command: string;
  }): vscode.Terminal => {
    const terminal = vscode.window.createTerminal({
      name: params.name,
      shellPath: params.bashPath,
      shellArgs: ['-l'],
      cwd: params.workspaceRoot,
    });
    terminal.show(true);
    terminal.sendText(params.command, true);
    return terminal;
  };

  context.subscriptions.push(
    new vscode.Disposable(() => {
      // Do not kill running `o` processes on deactivation; just detach listeners.
      interactions.detachAll();
    }),
  );

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

      if (result.issues.length > 0 || !result.config.oBinary || !result.config.runsRoot) {
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
                prompt: 'Enter a request to dispatch via `o`.',
                placeHolder: 'Describe what you want `o` to do…',
              })
            )?.trim();
      if (!prompt) return undefined;

      output.show(true);
      output.appendLine(`Dispatching via \`o\`: ${result.config.oBinary.path}`);

      try {
        const windowsInvocation = workspaceFolder
          ? await resolveWindowsInvocationOptions(workspaceFolder, result.config.oBinary.path)
          : {};
        if (
          process.platform === 'win32' &&
          !isLikelyWindowsNativeBinary(result.config.oBinary.path)
        ) {
          const runtimeLabel = windowsInvocation.windowsRuntime
            ? 'WSL'
            : windowsInvocation.windowsBashPath
              ? `Git Bash (${windowsInvocation.windowsBashPath})`
              : '(none)';
          output.appendLine(`Windows runtime: ${runtimeLabel}`);
        }
        if (
          process.platform === 'win32' &&
          !isLikelyWindowsNativeBinary(result.config.oBinary.path) &&
          !windowsInvocation.windowsRuntime &&
          !windowsInvocation.windowsBashPath
        ) {
          await vscode.window.showErrorMessage(
            'Babysitter: `o` appears to be a bash script on Windows, but neither WSL nor Git Bash was found. ' +
              'Install WSL2 (recommended) or set `babysitter.o.install.bashPath` to your Git Bash `bash.exe`.',
          );
          throw new Error('No usable Bash runtime found for Windows `o` bash script.');
        }

        if (
          process.platform === 'win32' &&
          !isLikelyWindowsNativeBinary(result.config.oBinary.path) &&
          !windowsInvocation.windowsRuntime &&
          windowsInvocation.windowsBashPath
        ) {
          const baselineIds = new Set(listRunIds(result.config.runsRoot.path));
          const bashCmd = [
            'set -euo pipefail',
            `cd "$(cygpath -u ${bashSingleQuote(workspaceRoot)})"`,
            `"$(cygpath -u ${bashSingleQuote(result.config.oBinary.path)})" ${bashSingleQuote(prompt)}`,
          ].join('; ');

          const dispatchStartMs = Date.now();
          openGitBashTerminalAndSend({
            name: 'o (dispatch)',
            bashPath: windowsInvocation.windowsBashPath,
            workspaceRoot,
            command: bashCmd,
          });

          const runId = await waitForNewRunId({
            runsRootPath: result.config.runsRoot.path,
            baselineIds,
            timeoutMs: 120_000,
            afterTimeMs: dispatchStartMs,
          });
          if (!runId) {
            throw new Error(
              'Timed out waiting for a new run directory to appear under runsRoot. ' +
                'The `o` session is running in the terminal; check its output for errors.',
            );
          }

          const runRootPath = path.join(result.config.runsRoot.path, runId);
          output.appendLine(`Dispatched run (from terminal): ${runId}`);
          output.appendLine(`Run root: ${runRootPath}`);
          runsTreeView.refresh();
          return { runId, runRootPath, stdout: '', stderr: '' };
        }

        const dispatched = await dispatchNewRunViaO({
          oBinaryPath: result.config.oBinary.path,
          workspaceRoot,
          runsRootPath: result.config.runsRoot.path,
          prompt,
          ...(windowsInvocation.windowsRuntime
            ? { windowsRuntime: windowsInvocation.windowsRuntime }
            : {}),
          ...(windowsInvocation.windowsBashPath
            ? { windowsBashPath: windowsInvocation.windowsBashPath }
            : {}),
          onProcess: (process) => {
            registerOProcess(process, 'o (dispatch)');
            output.appendLine(`Started interactive o process (pid ${process.pid}).`);
          },
        });

        if (dispatched.pid !== undefined) {
          interactions.setRunIdForPid(dispatched.pid, dispatched.runId);
          interactions.setLabelForPid(dispatched.pid, `o (dispatch ${dispatched.runId})`);
        }
        output.appendLine(`Dispatched run: ${dispatched.runId}`);
        output.appendLine(`Run root: ${dispatched.runRootPath}`);
        if (dispatched.stdout.trim())
          output.appendLine(`o stdout:\n${sanitizeForOutputChannel(dispatched.stdout)}`);
        if (dispatched.stderr.trim())
          output.appendLine(`o stderr:\n${sanitizeForOutputChannel(dispatched.stderr)}`);

        runsTreeView.refresh();
        return dispatched;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`Dispatch failed: ${sanitizeForOutputChannel(message)}`);
        const capturedStdout =
          typeof (err as { stdout?: unknown }).stdout === 'string'
            ? ((err as { stdout?: string }).stdout ?? '')
            : '';
        const capturedStderr =
          typeof (err as { stderr?: unknown }).stderr === 'string'
            ? ((err as { stderr?: string }).stderr ?? '')
            : '';
        const combined =
          `${capturedStdout}${capturedStderr ? `\n${capturedStderr}` : ''}`.trimEnd();
        if (combined.trim()) {
          const maxChars = 8_000;
          const tail = combined.length > maxChars ? combined.slice(-maxChars) : combined;
          output.appendLine(
            `Captured \`o\` output (tail${combined.length > maxChars ? ', truncated' : ''}):\n${sanitizeForOutputChannel(tail)}`,
          );
        }
        if (process.platform === 'win32' && /error code:\s*193\b/i.test(message)) {
          await vscode.window.showErrorMessage(
            'Babysitter: dispatch failed because the configured `o` path is not runnable on Windows. ' +
              'Point `babysitter.o.binaryPath` at a Windows `o.exe` or ensure `bash` is on PATH if using the bash script.',
          );
          throw err;
        }
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

      if (result.issues.length > 0 || !result.config.oBinary || !result.config.runsRoot) {
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
                prompt: 'Enter an updated request/prompt to resume this run via `o`.',
                placeHolder: 'Describe what you want `o` to do next…',
              })
            )?.trim();
      if (!prompt) return undefined;

      output.show(true);
      output.appendLine(`Resuming ${runId} via \`o\`: ${result.config.oBinary.path}`);

      try {
        const windowsInvocation = workspaceFolder
          ? await resolveWindowsInvocationOptions(workspaceFolder, result.config.oBinary.path)
          : {};
        if (
          process.platform === 'win32' &&
          !isLikelyWindowsNativeBinary(result.config.oBinary.path)
        ) {
          const runtimeLabel = windowsInvocation.windowsRuntime
            ? 'WSL'
            : windowsInvocation.windowsBashPath
              ? `Git Bash (${windowsInvocation.windowsBashPath})`
              : '(none)';
          output.appendLine(`Windows runtime: ${runtimeLabel}`);
        }
        if (
          process.platform === 'win32' &&
          !isLikelyWindowsNativeBinary(result.config.oBinary.path) &&
          !windowsInvocation.windowsRuntime &&
          !windowsInvocation.windowsBashPath
        ) {
          await vscode.window.showErrorMessage(
            'Babysitter: `o` appears to be a bash script on Windows, but neither WSL nor Git Bash was found. ' +
              'Install WSL2 (recommended) or set `babysitter.o.install.bashPath` to your Git Bash `bash.exe`.',
          );
          throw new Error('No usable Bash runtime found for Windows `o` bash script.');
        }

        if (
          process.platform === 'win32' &&
          !isLikelyWindowsNativeBinary(result.config.oBinary.path) &&
          !windowsInvocation.windowsRuntime &&
          windowsInvocation.windowsBashPath
        ) {
          const bashCmd = [
            'set -euo pipefail',
            `cd "$(cygpath -u ${bashSingleQuote(workspaceRoot)})"`,
            `"$(cygpath -u ${bashSingleQuote(result.config.oBinary.path)})" ${bashSingleQuote(runId)} ${bashSingleQuote(prompt)}`,
          ].join('; ');

          openGitBashTerminalAndSend({
            name: `o (resume ${runId})`,
            bashPath: windowsInvocation.windowsBashPath,
            workspaceRoot,
            command: bashCmd,
          });

          const runRootPath = path.join(result.config.runsRoot.path, runId);
          output.appendLine(`Resuming run in terminal: ${runId}`);
          output.appendLine(`Run root: ${runRootPath}`);
          runsTreeView.refresh();
          return { runId, runRootPath, stdout: '', stderr: '' };
        }

        const resumed = await resumeExistingRunViaO({
          oBinaryPath: result.config.oBinary.path,
          workspaceRoot,
          runsRootPath: result.config.runsRoot.path,
          runId,
          prompt,
          ...(windowsInvocation.windowsRuntime
            ? { windowsRuntime: windowsInvocation.windowsRuntime }
            : {}),
          ...(windowsInvocation.windowsBashPath
            ? { windowsBashPath: windowsInvocation.windowsBashPath }
            : {}),
          onProcess: (process) => {
            registerOProcess(process, `o (resume ${runId})`);
            interactions.setRunIdForPid(process.pid, runId);
            output.appendLine(`Started interactive o process (pid ${process.pid}).`);
          },
        });

        if (resumed.pid !== undefined) {
          interactions.setLabelForPid(resumed.pid, `o (resume ${resumed.runId})`);
        }
        output.appendLine(`Resumed run: ${resumed.runId}`);
        output.appendLine(`Run root: ${resumed.runRootPath}`);
        if (resumed.stdout.trim())
          output.appendLine(`o stdout:\n${sanitizeForOutputChannel(resumed.stdout)}`);
        if (resumed.stderr.trim())
          output.appendLine(`o stderr:\n${sanitizeForOutputChannel(resumed.stderr)}`);

        runsTreeView.refresh();
        return resumed;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`Resume failed: ${sanitizeForOutputChannel(message)}`);
        if (process.platform === 'win32' && /error code:\s*193\b/i.test(message)) {
          await vscode.window.showErrorMessage(
            'Babysitter: resume failed because the configured `o` path is not runnable on Windows. ' +
              'Point `babysitter.o.binaryPath` at a Windows `o.exe` or ensure `bash` is on PATH if using the bash script.',
          );
          throw err;
        }
        await vscode.window.showErrorMessage('Babysitter: resume failed. See output for details.');
        throw err;
      }
    },
  );

  const sendEscDisposable = vscode.commands.registerCommand('babysitter.sendEsc', async () => {
    try {
      const sent = interactions.sendEscToActive();
      if (!sent) {
        await vscode.window.showWarningMessage('Babysitter: no active `o` process to send ESC to.');
        return;
      }
      output.appendLine(`Sent ESC to ${sent.label} (pid ${sent.pid}).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      output.appendLine(`Failed to send ESC: ${message}`);
      await vscode.window.showErrorMessage(
        'Babysitter: failed to send ESC. See output for details.',
      );
    }
  });

  const sendEnterDisposable = vscode.commands.registerCommand('babysitter.sendEnter', async () => {
    try {
      const sent = interactions.sendEnterToActive();
      if (!sent) {
        await vscode.window.showWarningMessage(
          'Babysitter: no active `o` process to send Enter to.',
        );
        return;
      }
      output.appendLine(`Sent Enter to ${sent.label} (pid ${sent.pid}).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      output.appendLine(`Failed to send Enter: ${message}`);
      await vscode.window.showErrorMessage(
        'Babysitter: failed to send Enter. See output for details.',
      );
    }
  });

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
        `- Setting (babysitter.o.binaryPath): ${settings.oBinaryPath?.trim() ? settings.oBinaryPath : '(not set)'}`,
      );
      output.appendLine(
        `- Setting (babysitter.oPath, legacy): ${settings.oPath?.trim() ? settings.oPath : '(not set)'}`,
      );
      output.appendLine(
        `- Setting (babysitter.runsRoot): ${settings.runsRoot?.trim() ? settings.runsRoot : '(default)'}`,
      );
      output.appendLine(
        `- Setting (babysitter.globalConfigPath): ${settings.globalConfigPath?.trim() ? settings.globalConfigPath : '(not set)'}`,
      );

      if (result.issues.length === 0) {
        output.appendLine('Result: OK');
        const resolvedOBinary = result.config.oBinary;
        const resolvedRunsRoot = result.config.runsRoot;
        if (resolvedOBinary) {
          output.appendLine(`- Resolved o: ${resolvedOBinary.path} (${resolvedOBinary.source})`);
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

  const locateOBinaryDisposable = vscode.commands.registerCommand(
    'babysitter.locateOBinary',
    async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const settings = readRawSettings();
      const resolveOptions: Parameters<typeof resolveBabysitterConfig>[0] = {
        settings,
        platform: process.platform,
      };
      if (workspaceRoot !== undefined) resolveOptions.workspaceRoot = workspaceRoot;
      if (process.env.PATH !== undefined) resolveOptions.envPath = process.env.PATH;
      const result = resolveBabysitterConfig(resolveOptions);

      output.show(true);
      output.appendLine('Locating `o` binary...');
      output.appendLine(
        `- Setting (babysitter.o.binaryPath): ${settings.oBinaryPath ? settings.oBinaryPath : '(not set)'}`,
      );
      output.appendLine(
        `- Setting (babysitter.oPath, legacy): ${settings.oPath ? settings.oPath : '(not set)'}`,
      );
      output.appendLine(`- Workspace root: ${workspaceRoot ?? '(no workspace open)'}`);

      if (!result.config?.oBinary) {
        output.appendLine('Result: NOT FOUND');
        for (const line of formatIssues(result.issues)) output.appendLine(line);
        await vscode.window.showWarningMessage(
          'Babysitter: could not find the `o` binary. Set `babysitter.o.binaryPath` (or legacy `babysitter.oPath`), place `o` in the workspace root, or add it to PATH.',
        );
        return;
      }

      output.appendLine(
        `Result: FOUND (${result.config.oBinary.source}) -> ${result.config.oBinary.path}`,
      );
      await vscode.window.showInformationMessage(
        `Babysitter: found \`o\` (${result.config.oBinary.source}): ${result.config.oBinary.path}`,
      );
    },
  );

  const installOInWorkspaceDisposable = vscode.commands.registerCommand(
    'babysitter.installOInWorkspace',
    async () => {
      const folder = await vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Select a workspace folder to install/update `o` into',
      });
      if (!folder) {
        await vscode.window.showErrorMessage(
          'Babysitter: open a workspace folder to install/update `o`.',
        );
        return;
      }
      const workspaceRoot = folder.uri.fsPath;

      const consent = await vscode.window.showWarningMessage(
        'Babysitter will download and run the upstream `o` installer (curl | bash) and modify files in this workspace (./o, ./.a5c/*, and possibly ./.gitignore).',
        { modal: true },
        'Continue',
      );
      if (consent !== 'Continue') return;

      const hasExistingO =
        fs.existsSync(path.join(workspaceRoot, 'o')) ||
        fs.existsSync(path.join(workspaceRoot, '.a5c', 'o.md')) ||
        fs.existsSync(path.join(workspaceRoot, '.a5c', 'functions')) ||
        fs.existsSync(path.join(workspaceRoot, '.a5c', 'processes'));

      const forceOptionLabel = 'Overwrite existing files';
      const noGitignoreOptionLabel = 'Do not modify .gitignore';
      const picked = await vscode.window.showQuickPick(
        [
          {
            label: forceOptionLabel,
            description: '--force',
            picked: hasExistingO,
          },
          {
            label: noGitignoreOptionLabel,
            description: '--no-gitignore',
            picked: false,
          },
        ],
        {
          canPickMany: true,
          title: 'Babysitter: Install/Update `o` options',
        },
      );
      if (!picked) return;

      const options: OInstallOptions = {
        force: picked.some((p) => p.label === forceOptionLabel),
        noGitignore: picked.some((p) => p.label === noGitignoreOptionLabel),
      };

      let windowsRuntime: WindowsInstallerRuntime | undefined;
      if (process.platform === 'win32') {
        const wslAvailable = await isWslAvailable();
        const cfg = vscode.workspace.getConfiguration('babysitter', folder.uri);
        const configuredBashPath = (cfg.get<string>('o.install.bashPath') ?? '').trim();
        const detectedGitBashPath =
          (configuredBashPath && fs.existsSync(configuredBashPath) ? configuredBashPath : '') ||
          firstExistingPath(findGitBashCandidates());

        const runtimeChoices: Array<{
          label: string;
          description: string;
          runtime: WindowsInstallerRuntime;
        }> = [];
        if (wslAvailable) {
          runtimeChoices.push({
            label: 'WSL (recommended)',
            description: 'Uses wsl.exe + bash',
            runtime: { kind: 'wsl' },
          });
        }
        if (detectedGitBashPath) {
          runtimeChoices.push({
            label: 'Git Bash',
            description: detectedGitBashPath,
            runtime: { kind: 'git-bash', bashPath: detectedGitBashPath },
          });
        }

        if (runtimeChoices.length === 0) {
          const openSettings = 'Open Settings';
          const choice = await vscode.window.showErrorMessage(
            'Babysitter: cannot install `o` on Windows without WSL or Git Bash. Install WSL2 (recommended) or set `babysitter.o.install.bashPath` to your Git Bash `bash.exe`.',
            openSettings,
          );
          if (choice === openSettings) {
            await vscode.commands.executeCommand(
              'workbench.action.openSettings',
              'babysitter.o.install.bashPath',
            );
          }
          return;
        }

        if (runtimeChoices.length === 1) {
          windowsRuntime = runtimeChoices[0]?.runtime;
        } else {
          const selected = await vscode.window.showQuickPick(runtimeChoices, {
            title: 'Babysitter: Choose a Bash runtime for installing `o`',
          });
          if (!selected) return;
          windowsRuntime = selected.runtime;
        }
      }

      output.show(true);
      output.appendLine(`Installing/updating \`o\` into: ${workspaceRoot}`);
      output.appendLine(
        `Installer flags: ${options.force ? '--force' : '(no --force)'} ${options.noGitignore ? '--no-gitignore' : '(gitignore managed)'}`,
      );
      if (process.platform === 'win32') {
        const runtimeLabel =
          windowsRuntime?.kind === 'wsl'
            ? 'WSL'
            : windowsRuntime?.kind === 'git-bash'
              ? `Git Bash (${windowsRuntime.bashPath})`
              : '(unknown)';
        output.appendLine(`Windows runtime: ${runtimeLabel}`);
      }

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Babysitter: Installing/updating `o` in workspace...',
            cancellable: false,
          },
          async () => {
            const installerParams: Parameters<typeof runOInstaller>[0] = {
              workspaceRoot,
              options,
              platform: process.platform,
              onOutput: (line) => output.appendLine(line),
            };
            if (windowsRuntime) installerParams.windowsRuntime = windowsRuntime;
            await runOInstaller(installerParams);
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        output.appendLine(`Babysitter: install/update failed: ${message}`);
        await vscode.window.showErrorMessage(
          'Babysitter: failed to install/update `o`. See Output > Babysitter for details.',
        );
        return;
      }

      output.appendLine('Babysitter: install/update completed.');
      await vscode.window.showInformationMessage(
        'Babysitter: `o` installed/updated in workspace root.',
      );
      void refreshConfig(false);
    },
  );

  void refreshConfig(true);

  context.subscriptions.push(
    output,
    status,
    disposable,
    openPromptBuilderDisposable,
    dispatchRunDisposable,
    dispatchRunFromTaskFileDisposable,
    resumeRunDisposable,
    sendEscDisposable,
    sendEnterDisposable,
    showConfigErrorsDisposable,
    locateOBinaryDisposable,
    installOInWorkspaceDisposable,
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
