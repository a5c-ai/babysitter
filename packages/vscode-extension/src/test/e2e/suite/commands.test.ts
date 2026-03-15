import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Commands E2E Tests', () => {
  let extension: vscode.Extension<unknown> | undefined;

  suiteSetup(async () => {
    extension = vscode.extensions.getExtension('a5c-ai.babysitter-observer');
    assert.ok(extension, 'Extension should be installed');
    await extension.activate();

    // Give extension time to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test('All commands should be registered', async () => {
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

  test('babysitter.refresh executes without error', async () => {
    await vscode.commands.executeCommand('babysitter.refresh');
    assert.ok(true, 'Refresh command executed successfully');
  });

  test('babysitter.filterRuns opens quick pick', async () => {
    const commandPromise = vscode.commands.executeCommand('babysitter.filterRuns');

    // Give time for quick pick to show
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Close the quick pick
    await vscode.commands.executeCommand('workbench.action.closeQuickOpen');

    // Wait for command completion
    await commandPromise;

    assert.ok(true, 'Filter runs command executed');
  });

  test('babysitter.copyRunId works with valid run ID', async () => {
    const testRunId = 'test-e2e-run';

    // Execute copy command
    await vscode.commands.executeCommand('babysitter.copyRunId', testRunId);

    // Read clipboard
    const clipboardContent = await vscode.env.clipboard.readText();

    assert.strictEqual(
      clipboardContent,
      testRunId,
      'Run ID should be copied to clipboard'
    );
  });

  test('babysitter.copyRunId handles empty run ID gracefully', async () => {
    // Should not throw error when called with undefined/empty
    await vscode.commands.executeCommand('babysitter.copyRunId', '');
    assert.ok(true, 'Copy command handles empty ID gracefully');

    await vscode.commands.executeCommand('babysitter.copyRunId', undefined);
    assert.ok(true, 'Copy command handles undefined ID gracefully');
  });

  test('babysitter.openRunDir executes with valid run ID', async () => {
    const testRunId = 'test-e2e-run';

    // This will attempt to open the directory in the OS file explorer
    // We just verify it doesn't throw
    await vscode.commands.executeCommand('babysitter.openRunDir', testRunId);

    assert.ok(true, 'Open run directory command executed');
  });

  test('babysitter.openRun command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('babysitter.openRun'),
      'Open run command should be registered'
    );
  });

  test('babysitter.approveBreakpoint command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('babysitter.approveBreakpoint'),
      'Approve breakpoint command should be registered'
    );
  });

  test('Multiple command executions should work', async () => {
    // Execute multiple different commands in sequence
    await vscode.commands.executeCommand('babysitter.refresh');
    await new Promise((resolve) => setTimeout(resolve, 300));

    await vscode.commands.executeCommand('babysitter.copyRunId', 'test-123');
    await new Promise((resolve) => setTimeout(resolve, 300));

    await vscode.commands.executeCommand('babysitter.refresh');
    await new Promise((resolve) => setTimeout(resolve, 300));

    assert.ok(true, 'Multiple command executions completed successfully');
  });

  test('Commands execute when extension is fully activated', async () => {
    assert.ok(extension);
    assert.strictEqual(extension.isActive, true, 'Extension must be active');

    // All commands should work when extension is active
    await vscode.commands.executeCommand('babysitter.refresh');

    const commands = await vscode.commands.getCommands(true);
    const babysitterCommands = commands.filter(cmd => cmd.startsWith('babysitter.'));

    assert.ok(
      babysitterCommands.length >= 6,
      'All babysitter commands should be registered'
    );
  });
});
