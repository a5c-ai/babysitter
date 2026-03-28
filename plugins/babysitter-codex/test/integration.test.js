'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills');
const HOOKS_DIR = path.join(PROJECT_ROOT, 'hooks');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

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
  collectJs(SKILLS_DIR);
  if (fs.existsSync(BIN_DIR)) collectJs(BIN_DIR);
  if (fs.existsSync(SCRIPTS_DIR)) collectJs(SCRIPTS_DIR);

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

// Test: Shell hook scripts have valid syntax
function testShellSyntax() {
  const shellScripts = [
    'babysitter-session-start.sh',
    'babysitter-stop-hook.sh',
    'user-prompt-submit.sh',
  ];

  for (const script of shellScripts) {
    const shellFile = path.join(HOOKS_DIR, script);
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
  testShellSyntax();
  console.log('\nAll integration tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}
