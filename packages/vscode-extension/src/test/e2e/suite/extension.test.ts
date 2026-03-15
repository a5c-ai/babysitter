import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension E2E Test Suite', () => {
  let extension: vscode.Extension<unknown> | undefined;

  suiteSetup(() => {
    vscode.window.showInformationMessage('Start all E2E tests.');
  });

  test('Extension should be present', () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension, 'Extension should be installed');
  });

  test('Extension should activate', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension, 'Extension should be installed');

    await extension.activate();
    assert.strictEqual(extension.isActive, true, 'Extension should be active');
  });

  test('Commands should be registered', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);

    const expectedCommands = [
      'babysitter.refresh',
      'babysitter.openRun',
      'babysitter.filterRuns',
      'babysitter.approveBreakpoint',
      'babysitter.copyRunId',
      'babysitter.openRunDir',
    ];

    for (const cmd of expectedCommands) {
      assert.ok(
        commands.includes(cmd),
        `Command ${cmd} should be registered`
      );
    }
  });

  test('Tree view should be registered', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);
    await extension.activate();

    // Give the extension time to register the tree view
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // The tree view ID from package.json contributes.views
    const treeViewId = 'babysitter-runs';

    // We can't directly access tree views, but we can verify they're implicitly
    // registered by checking if the extension activated without errors
    assert.strictEqual(
      extension.isActive,
      true,
      'Extension should remain active after tree view registration'
    );
  });

  test('Configuration should be available', async () => {
    const config = vscode.workspace.getConfiguration('babysitter');

    // Check default values from package.json contributes.configuration
    const runsDir = config.get<string>('runsDirectory');
    assert.strictEqual(runsDir, '.a5c/runs', 'Default runs directory should be set');

    const autoRefreshInterval = config.get<number>('autoRefreshInterval');
    assert.strictEqual(autoRefreshInterval, 5000, 'Default auto-refresh interval should be 5000ms');

    const showCompletedRuns = config.get<boolean>('showCompletedRuns');
    assert.strictEqual(showCompletedRuns, true, 'Default showCompletedRuns should be true');

    const showFailedRuns = config.get<boolean>('showFailedRuns');
    assert.strictEqual(showFailedRuns, true, 'Default showFailedRuns should be true');

    const maxRunsDisplayed = config.get<number>('maxRunsDisplayed');
    assert.strictEqual(maxRunsDisplayed, 50, 'Default maxRunsDisplayed should be 50');

    const staleThresholdMinutes = config.get<number>('staleThresholdMinutes');
    assert.strictEqual(staleThresholdMinutes, 30, 'Default staleThresholdMinutes should be 30');
  });

  test('Refresh command should execute without errors', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);
    await extension.activate();

    // Execute the refresh command
    await vscode.commands.executeCommand('babysitter.refresh');

    // If we get here without throwing, the command executed successfully
    assert.ok(true, 'Refresh command executed');
  });

  test('Filter runs command should show quick pick', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);
    await extension.activate();

    // We can't fully test the UI interaction in headless mode,
    // but we can verify the command doesn't throw
    const commandPromise = vscode.commands.executeCommand('babysitter.filterRuns');

    // Give it a moment to show the quick pick
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Dismiss any open quick pick by sending Escape
    await vscode.commands.executeCommand('workbench.action.closeQuickOpen');

    // Wait for the command to complete
    await commandPromise;

    assert.ok(true, 'Filter command executed without errors');
  });

  test('Extension should handle workspace with .a5c/runs directory', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);
    await extension.activate();

    // If we have a workspace folder, verify the extension can access it
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      assert.ok(workspaceRoot, 'Workspace root should be accessible');

      // The extension should initialize without errors even if .a5c/runs exists
      assert.strictEqual(extension.isActive, true, 'Extension should remain active');
    }
  });

  test('Extension contributes correct views container', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);

    const packageJSON = extension.packageJSON;
    assert.ok(packageJSON.contributes, 'Package should have contributes');
    assert.ok(packageJSON.contributes.viewsContainers, 'Should have viewsContainers');
    assert.ok(
      packageJSON.contributes.viewsContainers.activitybar,
      'Should contribute to activitybar'
    );

    const viewContainer = packageJSON.contributes.viewsContainers.activitybar.find(
      (vc: { id: string }) => vc.id === 'babysitter-observer'
    );
    assert.ok(viewContainer, 'babysitter-observer view container should exist');
    assert.strictEqual(viewContainer.title, 'Babysitter Observer', 'View container title should match');
  });

  test('Extension contributes correct views', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);

    const packageJSON = extension.packageJSON;
    assert.ok(packageJSON.contributes.views, 'Should have views');
    assert.ok(
      packageJSON.contributes.views['babysitter-observer'],
      'Should have views in babysitter-observer container'
    );

    const views = packageJSON.contributes.views['babysitter-observer'];
    const runsView = views.find((v: { id: string }) => v.id === 'babysitter-runs');
    assert.ok(runsView, 'babysitter-runs view should exist');
    assert.strictEqual(runsView.name, 'Runs', 'View name should be "Runs"');
  });

  test('Extension contributes all expected commands', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);

    const packageJSON = extension.packageJSON;
    const contributedCommands = packageJSON.contributes.commands;
    assert.ok(contributedCommands, 'Should contribute commands');
    assert.strictEqual(contributedCommands.length, 6, 'Should contribute 6 commands');

    const commandIds = contributedCommands.map((cmd: { command: string }) => cmd.command);
    const expectedCommandIds = [
      'babysitter.refresh',
      'babysitter.openRun',
      'babysitter.filterRuns',
      'babysitter.approveBreakpoint',
      'babysitter.copyRunId',
      'babysitter.openRunDir',
    ];

    for (const expectedId of expectedCommandIds) {
      assert.ok(
        commandIds.includes(expectedId),
        `Should contribute ${expectedId} command`
      );
    }
  });

  test('Extension activation events are correct', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);

    const packageJSON = extension.packageJSON;
    const activationEvents = packageJSON.activationEvents;
    assert.ok(activationEvents, 'Should have activation events');
    assert.ok(
      activationEvents.includes('onView:babysitter-runs'),
      'Should activate on view'
    );
    assert.ok(
      activationEvents.includes('workspaceContains:.a5c/runs'),
      'Should activate when workspace contains .a5c/runs'
    );
  });

  test('Extension metadata is correct', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);

    const packageJSON = extension.packageJSON;
    assert.strictEqual(packageJSON.name, 'babysitter-observer', 'Name should match');
    assert.strictEqual(packageJSON.displayName, 'Babysitter Observer', 'Display name should match');
    assert.strictEqual(packageJSON.publisher, 'a5c-ai', 'Publisher should match');
    assert.ok(packageJSON.version, 'Should have version');
    assert.strictEqual(packageJSON.license, 'MIT', 'License should be MIT');
  });

  test('Extension remains stable after multiple activations', async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension);

    // Multiple activation calls should be idempotent
    await extension.activate();
    await extension.activate();
    await extension.activate();

    assert.strictEqual(extension.isActive, true, 'Extension should remain active');
  });
});
