import * as path from 'path';
import * as fs from 'fs';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

    // The path to the extension test script
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Create a temporary workspace directory with fixture data
    const workspaceDir = path.resolve(__dirname, '../../../.vscode-test-workspace');

    // Clean up existing workspace if it exists
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }

    // Create workspace structure
    fs.mkdirSync(workspaceDir, { recursive: true });

    // Copy fixtures to workspace
    const fixturesPath = path.resolve(__dirname, 'fixtures');
    const targetA5cDir = path.join(workspaceDir, '.a5c');

    if (fs.existsSync(fixturesPath)) {
      copyDir(fixturesPath, targetA5cDir);
    }

    // Download VS Code, unzip it and run the integration test
    const exitCode = await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        workspaceDir,
        '--disable-extensions', // Disable all other extensions
        '--disable-workspace-trust', // Don't prompt for workspace trust
      ],
    });

    // Clean up workspace after tests
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }

    process.exit(exitCode);
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

void main();
