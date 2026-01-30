import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as vscode from 'vscode';

import { discoverRuns } from '../../core/runDiscovery';
import { EXTENSION_ID } from './constants';

function createOBinaryShim(tempDir: string, argsOutputPath: string): string {
  const shimScriptPath = path.join(tempDir, 'o-shim.js');

  fs.writeFileSync(
    shimScriptPath,
    [
      "const fs = require('fs');",
      "const path = require('path');",
      '',
      `const argsOutputPath = ${JSON.stringify(argsOutputPath)};`,
      'const argv = process.argv.slice(2);',
      'fs.writeFileSync(argsOutputPath, JSON.stringify({ argv }, null, 2));',
      '',
      '// Parse run:continue command arguments',
      "// argv[0] should be 'run:continue', argv[1] should be the runId",
      'const runId = argv[1];',
      "const runsRootIndex = argv.indexOf('--runs-dir');",
      "const runsRoot = runsRootIndex >= 0 ? argv[runsRootIndex + 1] : path.join(process.cwd(), '.a5c', 'runs');",
      'const runRoot = path.join(runsRoot, runId);',
      'fs.mkdirSync(runRoot, { recursive: true });',
      '',
      "fs.writeFileSync(path.join(runRoot, 'state.json'), JSON.stringify({ runId, status: 'running' }, null, 2));",
      "fs.appendFileSync(path.join(runRoot, 'journal.jsonl'), JSON.stringify({ type: 'resume', ts: Date.now() }) + '\\n');",
      '',
      'console.log(`resumed run ${runId}`);',
      'console.log(`runRoot=${runRoot}`);',
      "const isJson = argv.includes('--json');",
      'if (isJson) {',
      '  console.log(JSON.stringify({ runId }));',
      '}',
      'process.exit(0);',
      '',
    ].join('\n'),
    'utf8',
  );

  if (process.platform === 'win32') {
    const shimCmdPath = path.join(tempDir, 'o.cmd');
    fs.writeFileSync(shimCmdPath, `@echo off\r\nnode "${shimScriptPath}" %*\r\n`, 'utf8');
    return shimCmdPath;
  }

  const shimShPath = path.join(tempDir, 'o');
  fs.writeFileSync(shimShPath, `#!/usr/bin/env bash\nnode '${shimScriptPath}' "$@"\n`, 'utf8');
  fs.chmodSync(shimShPath, 0o755);
  return shimShPath;
}

suite('Resume', () => {
  test('resumes via configured `o` binary with run id + prompt', async function () {
    this.timeout(10000); // Increase timeout to 10s for integration test
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, 'extension not found');
    await ext.activate();

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(workspaceRoot, 'test workspace not opened');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-o-shim-'));
    const argsOutputPath = path.join(tempDir, 'args.json');
    const shimPath = createOBinaryShim(tempDir, argsOutputPath);

    const cfg = vscode.workspace.getConfiguration('babysitter');
    await cfg.update('sdk.binaryPath', shimPath, vscode.ConfigurationTarget.Workspace);
    await cfg.update('runsRoot', '.a5c/runs', vscode.ConfigurationTarget.Workspace);

    const runId = 'run-20990101-000000';
    const prompt = 'resume integration test prompt';
    const result = await vscode.commands.executeCommand<{
      runId: string;
      runRootPath: string;
      stdout: string;
      stderr: string;
    }>('babysitter.resumeRun', { runId, prompt });

    assert.strictEqual(result.runId, runId);
    assert.ok(result.runRootPath.includes(runId));
    assert.ok(result.stdout.includes('runRoot='));
    assert.ok(result.stdout.includes('resumed run'));

    const argsJson = JSON.parse(fs.readFileSync(argsOutputPath, 'utf8')) as {
      argv?: string[];
    };
    assert.ok(
      argsJson.argv?.includes('run:continue'),
      'expected run:continue command to be called',
    );
    assert.strictEqual(argsJson.argv?.[1], runId, 'expected runId to be passed as second argument');
    assert.ok(argsJson.argv?.includes('--json'), 'expected --json flag to be passed');

    const runsRoot = path.join(workspaceRoot, '.a5c', 'runs');
    const runs = discoverRuns(runsRoot);
    const resumed = runs.find((r) => r.id === runId);
    assert.ok(resumed, 'expected resumed run to exist');
    assert.strictEqual(resumed.status, 'running');
    assert.ok(fs.existsSync(path.join(resumed.paths.runRoot, 'journal.jsonl')));
  });
});
