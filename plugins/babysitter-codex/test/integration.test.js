'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CODEX_DIR = path.join(PROJECT_ROOT, '.codex');

// Test: All JS files pass node --check
function testSyntax() {
  const jsFiles = [];
  // Collect all JS files
  function collectJs(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') collectJs(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) jsFiles.push(full);
    }
  }
  collectJs(CODEX_DIR);

  let passed = 0;
  for (const file of jsFiles) {
    try {
      execFileSync('node', ['--check', file], { encoding: 'utf8' });
      passed++;
    } catch (err) {
      console.error(`  ✗ Syntax error in ${path.relative(PROJECT_ROOT, file)}`);
      throw err;
    }
  }
  console.log(`  ✓ syntax: ${passed} JS files pass node --check`);
}

// Test: All CommonJS modules can be required
function testRequire() {
  const modules = [
    '.codex/effect-mapper.js',
    '.codex/result-poster.js',
    '.codex/iteration-guard.js',
    '.codex/hook-dispatcher.js',
    '.codex/profile-manager.js',
    '.codex/discovery.js',
    '.codex/session-manager.js',
    '.codex/health-check.js',
    '.codex/sdk-cli.js',
    '.codex/sdk-package.js',
    '.codex/trace-logger.js',
    '.codex/codex-mapping.js',
    '.codex/process-library.js',
    '.codex/process-index.js',
    '.codex/process-mining.js',
    '.codex/rules-resolver.js',
    '.codex/mode-handlers.js',
    '.codex/prompt-shrinker.js',
    '.codex/hooks/utils.js',
    '.codex/hooks/read-json.js',
    '.codex/hooks/write-json.js',
    '.codex/hooks/build-task-payload.js',
  ];

  // CLI scripts that call process.exit() at top level when invoked without
  // arguments must be loaded in a subprocess to avoid terminating the test runner.
  const cliScripts = new Set([
    '.codex/hooks/read-json.js',
    '.codex/hooks/write-json.js',
  ]);

  for (const mod of modules) {
    const full = path.join(PROJECT_ROOT, mod);
    if (!fs.existsSync(full)) {
      console.warn(`  ⚠ ${mod} not found, skipping`);
      continue;
    }

    if (cliScripts.has(mod)) {
      // Load in a subprocess: check only that MODULE_NOT_FOUND doesn't occur.
      // A non-zero exit due to missing CLI args is acceptable.
      try {
        execFileSync('node', ['-e', `require(${JSON.stringify(full)})`], {
          encoding: 'utf8',
          env: { ...process.env },
        });
      } catch (err) {
        // Exit code 1 from missing args is expected for CLI scripts; only
        // fail on MODULE_NOT_FOUND which appears in stderr.
        const stderr = (err.stderr || '').toString();
        if (stderr.includes('MODULE_NOT_FOUND')) {
          throw new Error(`MODULE_NOT_FOUND in ${mod}: ${stderr}`);
        }
      }
      continue;
    }

    try {
      require(full);
    } catch (err) {
      // orchestrate.js has main guard, skip execution errors
      if (err.code === 'MODULE_NOT_FOUND') throw err;
    }
  }
  console.log(`  ✓ require: all modules load without MODULE_NOT_FOUND errors`);
}

// Test: loop-control.sh syntax
function testShellSyntax() {
  const shellFile = path.join(CODEX_DIR, 'hooks', 'loop-control.sh');
  try {
    execFileSync('sh', ['-n', shellFile], { encoding: 'utf8' });
    console.log('  ✓ shell: loop-control.sh passes sh -n');
  } catch (err) {
    console.error('  ✗ loop-control.sh has syntax errors');
    throw err;
  }
}

console.log('Integration Tests:');
try {
  testSyntax();
  testRequire();
  testShellSyntax();
  console.log('\nAll integration tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}
