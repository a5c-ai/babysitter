import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { RunDetailPanel } from '../panels/run-detail-panel';

// Mock RunCache, RunWatcher, RunsTreeDataProvider, StatusBarController
vi.mock('../lib/run-cache', () => ({
  RunCache: vi.fn().mockImplementation((_workspaceRoot: string) => ({
    getAll: vi.fn(() => []),
    getById: vi.fn(),
    refresh: vi.fn(),
    refreshAll: vi.fn(),
    getSummary: vi.fn(() => ({ total: 0, active: 0, completed: 0, failed: 0, breakpoints: 0 })),
    getDigests: vi.fn(() => []),
  })),
}));

vi.mock('../lib/watcher', () => ({
  RunWatcher: vi.fn().mockImplementation((_workspaceRoot: string) => ({
    onDidChange: vi.fn(() => new vscode.Disposable(() => {})),
    start: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('../providers/runs-tree-provider', () => ({
  RunsTreeDataProvider: vi.fn().mockImplementation(() => ({
    refresh: vi.fn(),
    setFilter: vi.fn(),
    onDidChangeTreeData: vi.fn(() => new vscode.Disposable(() => {})),
    getChildren: vi.fn(() => []),
    getTreeItem: vi.fn(),
  })),
}));

vi.mock('../status-bar', () => ({
  StatusBarController: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('../panels/breakpoint-handler', () => ({
  approveBreakpoint: vi.fn(() => Promise.resolve(true)),
}));

// Import after mocks are set up
import { activate, deactivate } from '../extension';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockContext(): vscode.ExtensionContext {
  const subscriptions: vscode.Disposable[] = [];
  return {
    subscriptions,
    extensionUri: vscode.Uri.file('/mock/extension'),
    extensionPath: '/mock/extension',
    globalState: { get: vi.fn(), update: vi.fn(), keys: vi.fn(() => []), setKeysForSync: vi.fn() },
    workspaceState: { get: vi.fn(), update: vi.fn(), keys: vi.fn(() => []) },
    secrets: { get: vi.fn(), store: vi.fn(), delete: vi.fn(), onDidChange: vi.fn() },
    globalStorageUri: vscode.Uri.file('/mock/global'),
    storageUri: vscode.Uri.file('/mock/storage'),
    logUri: vscode.Uri.file('/mock/log'),
    extensionMode: 1,
    environmentVariableCollection: {} as unknown as vscode.ExtensionContext['environmentVariableCollection'],
    storagePath: '/mock/storage',
    globalStoragePath: '/mock/global',
    logPath: '/mock/log',
    asAbsolutePath: vi.fn((p: string) => `/mock/extension/${p}`),
    extension: {} as unknown as vscode.ExtensionContext['extension'],
    languageModelAccessInformation: {} as unknown as vscode.ExtensionContext['languageModelAccessInformation'],
  } as unknown as vscode.ExtensionContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('extension activate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RunDetailPanel.currentPanels.clear();
  });

  afterEach(() => {
    RunDetailPanel.currentPanels.clear();
  });

  it('shows message when no workspace folders', () => {
    const originalFolders = vscode.workspace.workspaceFolders;
    // Temporarily set to undefined
    (vscode.workspace as Record<string, unknown>).workspaceFolders = undefined;

    const ctx = createMockContext();
    activate(ctx);

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Open a workspace'),
    );

    // Restore
    (vscode.workspace as Record<string, unknown>).workspaceFolders = originalFolders;
  });

  it('registers all 6 commands', () => {
    const ctx = createMockContext();
    activate(ctx);

    const registerCommand = vi.mocked(vscode.commands.registerCommand);
    const registeredCommands = registerCommand.mock.calls.map((call) => call[0]);

    expect(registeredCommands).toContain('babysitter.refresh');
    expect(registeredCommands).toContain('babysitter.openRun');
    expect(registeredCommands).toContain('babysitter.filterRuns');
    expect(registeredCommands).toContain('babysitter.approveBreakpoint');
    expect(registeredCommands).toContain('babysitter.copyRunId');
    expect(registeredCommands).toContain('babysitter.openRunDir');
  });

  it('creates tree view', () => {
    const ctx = createMockContext();
    activate(ctx);

    expect(vscode.window.createTreeView).toHaveBeenCalledWith(
      'babysitter-runs',
      expect.objectContaining({ showCollapseAll: true }),
    );
  });

  it('creates status bar (StatusBarController constructed)', async () => {
    const ctx = createMockContext();
    activate(ctx);

    const mod = await import('../status-bar');
    expect(mod.StatusBarController).toHaveBeenCalled();
  });

  it('adds subscriptions to context', () => {
    const ctx = createMockContext();
    activate(ctx);

    // Should have: 6 commands + treeView + watcher + statusBar + outputChannel = 10
    expect(ctx.subscriptions.length).toBeGreaterThanOrEqual(9);
  });

  it('creates an output channel', () => {
    const ctx = createMockContext();
    activate(ctx);

    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Babysitter Observer');
  });

  it('creates file watcher (RunWatcher constructed)', async () => {
    const ctx = createMockContext();
    activate(ctx);

    const mod = await import('../lib/watcher');
    expect(mod.RunWatcher).toHaveBeenCalled();
  });
});

describe('extension deactivate', () => {
  it('cleans up panels', () => {
    // Add some mock panels
    const mockPanel = {
      dispose: vi.fn(),
    } as unknown as RunDetailPanel;
    RunDetailPanel.currentPanels.set('run-1', mockPanel);
    RunDetailPanel.currentPanels.set('run-2', mockPanel);

    deactivate();

    expect(mockPanel.dispose).toHaveBeenCalledTimes(2);
    expect(RunDetailPanel.currentPanels.size).toBe(0);
  });
});
