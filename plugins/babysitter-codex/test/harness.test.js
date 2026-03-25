'use strict';
const assert = require('assert');

function testSdkCli() {
  const { runJson, supports, getSupportedCommands, getCompatibilityReport } = require('../.codex/sdk-cli');
  assert.ok(typeof runJson === 'function');
  assert.ok(typeof supports === 'function');
  assert.ok(typeof getSupportedCommands === 'function');
  assert.ok(typeof getCompatibilityReport === 'function');
  const report = getCompatibilityReport();
  assert.ok(report && typeof report.mode === 'string');
  assert.ok(Array.isArray(report.available));
  console.log('  ok sdk-cli compatibility report available');
}

function testSdkPackage() {
  const sdkPkg = require('../.codex/sdk-package');
  assert.ok(typeof sdkPkg.resolveSdkPackage === 'function',
    'sdk-package should export resolveSdkPackage');
  const resolved = sdkPkg.resolveSdkPackage();
  assert.ok(resolved.includes('@a5c-ai/babysitter-sdk'), 'should resolve to SDK package');
  console.log('  ok sdk-package resolves SDK package specifier');
}

function testStateIndex() {
  const si = require('../.codex/state-index');
  assert.ok(typeof si.registerSession === 'function');
  assert.ok(typeof si.findSession === 'function');
  assert.ok(typeof si.listSessions === 'function');
  console.log('  ok state-index exports session management functions');
}

function testTurnController() {
  const tc = require('../.codex/turn-controller');
  assert.ok(typeof tc.resolveExplicitSessionId === 'function');
  assert.ok(typeof tc.writeCurrentRun === 'function');
  assert.ok(typeof tc.currentRun === 'function');
  assert.ok(typeof tc.resolveRunHandle === 'function');
  assert.ok(typeof tc.summarizeTask === 'function');
  assert.ok(typeof tc.buildAction === 'function');
  console.log('  ok turn-controller exports core orchestration functions');
}

console.log('Unit Tests:');
try {
  testSdkCli();
  testSdkPackage();
  testStateIndex();
  testTurnController();
  console.log('\nAll unit tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}
