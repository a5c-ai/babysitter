import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { activate, deactivate } from '../../extension';
import { RunDetailPanel } from '../../panels/run-detail-panel';

/**
 * Integration test: Extension lifecycle
 *
 * Tests activate/deactivate lifecycle and verifies components
 * are initialized and disposed correctly.
 */

describe('Integration: Extension Lifecycle', () => {
  let context: vscode.ExtensionContext;
  let mockUri: vscode.Uri;

  beforeEach(() => {
    // Create a mock ExtensionContext
    mockUri = vscode.Uri.file('/mock/extension');

    context = {
      subscriptions: [],
      extensionUri: mockUri,
      extensionPath: '/mock/extension',
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
        keys: vi.fn(() => []),
        setKeysForSync: vi.fn(),
      },
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
        keys: vi.fn(() => []),
      },
      secrets: {
        get: vi.fn(),
        store: vi.fn(),
        delete: vi.fn(),
        onDidChange: vi.fn(() => new vscode.Disposable(() => {})),
      },
      extensionMode: 3,
      storageUri: mockUri,
      globalStorageUri: mockUri,
      logUri: mockUri,
      storagePath: '/mock/storage',
      globalStoragePath: '/mock/global-storage',
      logPath: '/mock/log',
      asAbsolutePath: vi.fn((p: string) => `/mock/extension/${p}`),
      environmentVariableCollection: {
        persistent: false,
        description: undefined,
        replace: vi.fn(),
        append: vi.fn(),
        prepend: vi.fn(),
        get: vi.fn(),
        forEach: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        getScoped: vi.fn(),
        [Symbol.iterator]: vi.fn(),
      },
      extension: {
        id: 'test.babysitter-observer',
        extensionUri: mockUri,
        extensionPath: '/mock/extension',
        isActive: true,
        packageJSON: {},
        exports: undefined,
        activate: vi.fn(),
        extensionKind: 1,
      },
    } as unknown as vscode.ExtensionContext;

    // Reset VSCode mocks
    vi.clearAllMocks();

    // Clear any existing panels
    RunDetailPanel.currentPanels.clear();
  });

  afterEach(() => {
    // Clean up subscriptions
    for (const disposable of context.subscriptions) {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose();
      }
    }
    context.subscriptions.length = 0;

    // Clean up panels
    RunDetailPanel.currentPanels.forEach((panel) => panel.dispose());
    RunDetailPanel.currentPanels.clear();
  });

  it('activates successfully with workspace', () => {
    // Mock workspace folders
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      // Verify components were registered
      expect(context.subscriptions.length).toBeGreaterThan(0);

      // Verify tree view was created
      expect(vscode.window.createTreeView).toHaveBeenCalledWith(
        'babysitter-runs',
        expect.objectContaining({
          treeDataProvider: expect.anything(),
          showCollapseAll: true,
        }),
      );

      // Verify status bar was created
      expect(vscode.window.createStatusBarItem).toHaveBeenCalled();

      // Verify output channel was created
      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Babysitter Observer');

      // Verify file system watcher was created
      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalled();
  });

  it('does not activate without workspace', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue(undefined);

    activate(context);

    // Should show info message and not register components
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'Babysitter Observer: Open a workspace to monitor runs.',
    );

    // No subscriptions should be added (no components registered)
    expect(context.subscriptions.length).toBe(0);
  });

  it('registers all expected commands', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

    // Verify commands were registered
    const commandCalls = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls;
    const registeredCommands = commandCalls.map((call) => call[0]);

    expect(registeredCommands).toContain('babysitter.refresh');
    expect(registeredCommands).toContain('babysitter.openRun');
    expect(registeredCommands).toContain('babysitter.filterRuns');
    expect(registeredCommands).toContain('babysitter.approveBreakpoint');
    expect(registeredCommands).toContain('babysitter.copyRunId');
    expect(registeredCommands).toContain('babysitter.openRunDir');
  });

  it('subscribes all components for disposal', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      // Should have multiple subscriptions:
      // - commands (6)
      // - tree view (1)
      // - watcher (1)
      // - status bar (1)
      // - output channel (1)
      expect(context.subscriptions.length).toBeGreaterThan(8);
  });

  it('deactivate cleans up webview panels', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      // Simulate opening a webview panel
      const mockCache = {
        getById: vi.fn(() => ({
          runId: 'test-run',
          processId: 'test',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [],
          events: [],
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          isStale: false,
        })),
      } as any;

      const panel = RunDetailPanel.createOrShow(
        context.extensionUri,
        mockCache,
        'test-run',
        '/mock/workspace',
      );

      expect(RunDetailPanel.currentPanels.size).toBe(1);

      // Deactivate should dispose all panels
      deactivate();

      expect(RunDetailPanel.currentPanels.size).toBe(0);
  });

  it('components are disposed when subscriptions are disposed', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      const subscriptionCount = context.subscriptions.length;
      expect(subscriptionCount).toBeGreaterThan(0);

      // Dispose all subscriptions
      for (const disposable of context.subscriptions) {
        if (disposable && typeof disposable.dispose === 'function') {
          disposable.dispose();
        }
      }

      // All disposables should have been called
      // (We can't directly verify this with mocks, but no errors should occur)
      expect(context.subscriptions.length).toBe(subscriptionCount);
  });

  it('refresh command triggers cache and provider updates', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      // Find the refresh command callback
      const commandCalls = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls;
      const refreshCall = commandCalls.find((call) => call[0] === 'babysitter.refresh');
      expect(refreshCall).toBeDefined();

      const refreshCallback = refreshCall![1] as () => void;

      // Execute the refresh command (should not throw)
      expect(() => refreshCallback()).not.toThrow();
  });

  it('openRun command creates webview panel', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      // Find the openRun command callback
      const commandCalls = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls;
      const openRunCall = commandCalls.find((call) => call[0] === 'babysitter.openRun');
      expect(openRunCall).toBeDefined();

      const openRunCallback = openRunCall![1] as (runId: string) => void;

      // Execute the command (should create a webview panel)
      // Note: This will fail if the run doesn't exist in cache, but shouldn't crash
      expect(() => openRunCallback('test-run-id')).not.toThrow();
  });

  it('filterRuns command shows quick pick', async () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      // Find the filterRuns command callback
      const commandCalls = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls;
      const filterCall = commandCalls.find((call) => call[0] === 'babysitter.filterRuns');
      expect(filterCall).toBeDefined();

      const filterCallback = filterCall![1] as () => Promise<void>;

      // Execute the command
      await filterCallback();

      // Verify quick pick was shown
      expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
        expect.arrayContaining(['All', 'Pending', 'Waiting', 'Completed', 'Failed']),
        expect.objectContaining({
          placeHolder: 'Filter runs by status',
        }),
      );
  });

  it('copyRunId command copies to clipboard', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      const commandCalls = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls;
      const copyCall = commandCalls.find((call) => call[0] === 'babysitter.copyRunId');
      expect(copyCall).toBeDefined();

      const copyCallback = copyCall![1] as (runId: string) => void;

      copyCallback('test-run-123');

      expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('test-run-123');
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Copied: test-run-123');
  });

  it('openRunDir command reveals run directory', () => {
    vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
      {
        uri: vscode.Uri.file('/mock/workspace'),
        name: 'test-workspace',
        index: 0,
      },
    ]);

    activate(context);

      const commandCalls = (vscode.commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls;
      const openDirCall = commandCalls.find((call) => call[0] === 'babysitter.openRunDir');
      expect(openDirCall).toBeDefined();

      const openDirCallback = openDirCall![1] as (runId: string) => void;

      openDirCallback('test-run-456');

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'revealFileInOS',
        expect.any(vscode.Uri),
      );
  });
});
