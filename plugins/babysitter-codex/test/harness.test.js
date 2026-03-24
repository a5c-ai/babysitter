'use strict';
const assert = require('assert');
const path = require('path');

// Test: sdk-cli compatibility helpers
function testSdkCli() {
  const { runJson, supports, getSupportedCommands, getCompatibilityReport } = require('../.codex/sdk-cli');
  assert.ok(typeof runJson === 'function');
  assert.ok(typeof supports === 'function');
  assert.ok(typeof getSupportedCommands === 'function');
  assert.ok(typeof getCompatibilityReport === 'function');
  const report = getCompatibilityReport();
  assert.ok(report && typeof report.mode === 'string');
  assert.ok(Array.isArray(report.available));
  console.log('  ✓ sdk-cli: compatibility report available');
}

// Test: sdk-package resolves SDK package specifier
function testSdkPackage() {
  const sdkPkg = require('../.codex/sdk-package');
  assert.ok(typeof sdkPkg.resolveSdkPackage === 'function',
    'sdk-package should export resolveSdkPackage');
  const resolved = sdkPkg.resolveSdkPackage();
  assert.ok(resolved.includes('@a5c-ai/babysitter-sdk'), 'should resolve to SDK package');
  console.log('  ✓ sdk-package: resolves SDK package specifier');
}

// Test: state-index exports session management
function testStateIndex() {
  const si = require('../.codex/state-index');
  assert.ok(typeof si.registerSession === 'function');
  assert.ok(typeof si.findSession === 'function');
  assert.ok(typeof si.listSessions === 'function');
  console.log('  ✓ state-index: exports session management functions');
}

// Test: turn-controller exports core functions
function testTurnController() {
  const tc = require('../.codex/turn-controller');
  assert.ok(typeof tc.resolveExplicitSessionId === 'function');
  assert.ok(typeof tc.writeCurrentRun === 'function');
  assert.ok(typeof tc.currentRun === 'function');
  assert.ok(typeof tc.resolveRunHandle === 'function');
  assert.ok(typeof tc.summarizeTask === 'function');
  assert.ok(typeof tc.buildAction === 'function');
  console.log('  ✓ turn-controller: exports core orchestration functions');
}

// Test: process-mining exports
function testProcessMining() {
  const pm = require('../.codex/process-mining');
  assert.ok(typeof pm.mineProcess === 'function');
  console.log('  ✓ process-mining: exports mineProcess');
}

// Run all tests
console.log('Unit Tests:');
try {
  testSdkCli();
  testSdkPackage();
  testStateIndex();
  testTurnController();
  testProcessMining();
  console.log('\nAll unit tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}
