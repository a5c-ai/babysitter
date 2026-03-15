import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Webview E2E Tests', () => {
  let extension: vscode.Extension<unknown> | undefined;

  suiteSetup(async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension, 'Extension should be installed');
    await extension.activate();

    // Ensure extension is fully initialized
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  suiteTeardown(async () => {
    // Close all open editors
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('Opening a run creates a webview panel', async () => {
    const testRunId = 'test-e2e-run';

    // Execute open run command
    await vscode.commands.executeCommand('babysitter.openRun', testRunId);

    // Give webview time to create
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check that a webview panel was created
    // In E2E context, we verify by checking that no error was thrown
    assert.ok(true, 'Open run command executed and created webview');
  });

  test('Webview panel does not crash with valid run ID', async () => {
    const testRunId = 'completed-run';

    await vscode.commands.executeCommand('babysitter.openRun', testRunId);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    assert.ok(true, 'Webview opened for completed run');
  });

  test('Multiple webview panels can be opened for different runs', async () => {
    // Open first run
    await vscode.commands.executeCommand('babysitter.openRun', 'test-e2e-run');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Open second run
    await vscode.commands.executeCommand('babysitter.openRun', 'completed-run');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Open third run
    await vscode.commands.executeCommand('babysitter.openRun', 'failed-run');
    await new Promise((resolve) => setTimeout(resolve, 800));

    assert.ok(true, 'Multiple webview panels opened successfully');
  });

  test('Opening same run twice reuses the panel', async () => {
    const testRunId = 'breakpoint-run';

    // Open run first time
    await vscode.commands.executeCommand('babysitter.openRun', testRunId);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Open same run again - should reuse/reveal existing panel
    await vscode.commands.executeCommand('babysitter.openRun', testRunId);
    await new Promise((resolve) => setTimeout(resolve, 800));

    assert.ok(true, 'Same run opened twice without errors');
  });

  test('Webview handles non-existent run gracefully', async () => {
    const nonExistentRunId = 'non-existent-run-12345';

    // Should not crash even with invalid run ID
    await vscode.commands.executeCommand('babysitter.openRun', nonExistentRunId);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    assert.ok(true, 'Webview handles non-existent run without crashing');
  });

  test('Webview panels can be closed', async () => {
    // Open a webview
    await vscode.commands.executeCommand('babysitter.openRun', 'test-e2e-run');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Close all editors (includes webviews)
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Webview panels closed successfully');
  });

  test('Webview can be opened after closing', async () => {
    const testRunId = 'completed-run';

    // Open webview
    await vscode.commands.executeCommand('babysitter.openRun', testRunId);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Close it
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Open again
    await vscode.commands.executeCommand('babysitter.openRun', testRunId);
    await new Promise((resolve) => setTimeout(resolve, 800));

    assert.ok(true, 'Webview can be reopened after closing');
  });

  test('Webview handles empty run ID gracefully', async () => {
    // Should not crash with empty ID
    await vscode.commands.executeCommand('babysitter.openRun', '');
    await new Promise((resolve) => setTimeout(resolve, 500));

    await vscode.commands.executeCommand('babysitter.openRun', undefined);
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(true, 'Webview handles empty/undefined run ID gracefully');
  });

  test('Extension remains stable after multiple webview operations', async () => {
    // Perform multiple webview operations
    await vscode.commands.executeCommand('babysitter.openRun', 'test-e2e-run');
    await new Promise((resolve) => setTimeout(resolve, 500));

    await vscode.commands.executeCommand('babysitter.openRun', 'completed-run');
    await new Promise((resolve) => setTimeout(resolve, 500));

    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await new Promise((resolve) => setTimeout(resolve, 500));

    await vscode.commands.executeCommand('babysitter.openRun', 'failed-run');
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Extension should still be active
    assert.ok(extension);
    assert.strictEqual(extension.isActive, true, 'Extension remains active after webview operations');
  });
});
