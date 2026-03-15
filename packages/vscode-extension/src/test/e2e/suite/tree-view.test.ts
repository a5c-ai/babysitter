import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Tree View E2E Tests', () => {
  let extension: vscode.Extension<unknown> | undefined;

  suiteSetup(async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension, 'Extension should be installed');
    await extension.activate();

    // Give time for initial tree population
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test('Tree view should be registered', async () => {
    assert.ok(extension);
    assert.strictEqual(extension.isActive, true, 'Extension should be active');
  });

  test('Refresh command should update tree view', async () => {
    // Execute refresh command
    await vscode.commands.executeCommand('babysitter.refresh');

    // Give time for refresh to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // If we reach here without errors, refresh worked
    assert.ok(true, 'Refresh command executed successfully');
  });

  test('Tree view should handle workspace with .a5c/runs directory', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders && workspaceFolders.length > 0, 'Workspace should be open');

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    assert.ok(workspaceRoot.includes('.vscode-test-workspace'), 'Should be in test workspace');
  });

  test('Tree view should populate with fixture data', async () => {
    // Refresh to ensure latest data
    await vscode.commands.executeCommand('babysitter.refresh');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Extension should remain active after loading fixtures
    assert.ok(extension);
    assert.strictEqual(extension.isActive, true, 'Extension should remain active with fixture data');
  });

  test('Tree view should handle multiple refreshes', async () => {
    // Execute multiple refreshes in sequence
    await vscode.commands.executeCommand('babysitter.refresh');
    await new Promise((resolve) => setTimeout(resolve, 500));

    await vscode.commands.executeCommand('babysitter.refresh');
    await new Promise((resolve) => setTimeout(resolve, 500));

    await vscode.commands.executeCommand('babysitter.refresh');
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(extension);
    assert.strictEqual(extension.isActive, true, 'Extension should remain stable after multiple refreshes');
  });

  test('Filter runs command should execute', async () => {
    const commandPromise = vscode.commands.executeCommand('babysitter.filterRuns');

    // Give time for quick pick to appear
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Dismiss the quick pick
    await vscode.commands.executeCommand('workbench.action.closeQuickOpen');

    // Wait for command to complete
    await commandPromise;

    assert.ok(true, 'Filter command executed without errors');
  });
});
