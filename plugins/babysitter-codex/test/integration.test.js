'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CODEX_DIR = path.join(PROJECT_ROOT, '.codex');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');

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
  if (fs.existsSync(BIN_DIR)) collectJs(BIN_DIR);

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

// Test: Live CommonJS modules can be required
function testRequire() {
  const modules = [
    '.codex/sdk-cli.js',
    '.codex/sdk-package.js',
    '.codex/state-index.js',
    '.codex/turn-controller.js',
    '.codex/process-mining.js',
  ];

  for (const mod of modules) {
    const full = path.join(PROJECT_ROOT, mod);
    if (!fs.existsSync(full)) {
      throw new Error(`Expected live module not found: ${mod}`);
    }

    try {
      require(full);
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') throw err;
    }
  }
  console.log(`  ✓ require: all live modules load without MODULE_NOT_FOUND errors`);
}

// Test: Shell hook scripts have valid syntax
function testShellSyntax() {
  const shellScripts = [
    'hooks/babysitter-session-start.sh',
    'hooks/babysitter-stop-hook.sh',
    'hooks/user-prompt-submit.sh',
  ];

  for (const script of shellScripts) {
    const shellFile = path.join(CODEX_DIR, script);
    if (!fs.existsSync(shellFile)) {
      throw new Error(`Expected shell script not found: ${script}`);
    }
    try {
      execFileSync('sh', ['-n', shellFile], { encoding: 'utf8' });
      console.log(`  ✓ shell: ${script} passes sh -n`);
    } catch (err) {
      console.error(`  ✗ ${script} has syntax errors`);
      throw err;
    }
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
