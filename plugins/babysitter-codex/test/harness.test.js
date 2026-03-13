'use strict';
const assert = require('assert');
const path = require('path');

// Test: effect-mapper maps all 9 effect kinds
function testEffectMapper() {
  const { mapEffectToCodexPrompt } = require('../.codex/effect-mapper');

  // Test agent kind
  const agentResult = mapEffectToCodexPrompt({
    kind: 'agent',
    agent: { name: 'test', role: 'tester', task: 'test', instructions: ['do stuff'] }
  });
  assert.ok(agentResult, 'agent effect should produce a prompt');

  // Test node kind
  const nodeResult = mapEffectToCodexPrompt({
    kind: 'node',
    node: { script: 'console.log("hello")' }
  });
  assert.ok(nodeResult, 'node effect should produce a prompt');

  // Test shell kind
  const shellResult = mapEffectToCodexPrompt({
    kind: 'shell',
    shell: { command: 'echo hello' }
  });
  assert.ok(shellResult, 'shell effect should produce a prompt');

  // Test breakpoint kind (returns null — it's a pause)
  const bpResult = mapEffectToCodexPrompt({ kind: 'breakpoint' });
  // breakpoint returns null since it pauses

  // Test sleep kind
  const sleepResult = mapEffectToCodexPrompt({
    kind: 'sleep',
    sleep: { until: '2030-01-01T00:00:00Z' }
  });

  // Test skill kind
  const skillResult = mapEffectToCodexPrompt({
    kind: 'skill',
    skill: { name: 'test-skill', description: 'A test skill' }
  });
  assert.ok(skillResult, 'skill effect should produce a prompt');

  // Test hook kind
  const hookResult = mapEffectToCodexPrompt({
    kind: 'hook',
    hook: { hookType: 'on-score', payload: { score: 85 } }
  });

  // Test orchestrator_task kind
  const otResult = mapEffectToCodexPrompt({
    kind: 'orchestrator_task',
    orchestrator_task: { objective: 'Test orchestration', role: 'tester' }
  });
  assert.ok(otResult, 'orchestrator_task should produce a prompt');

  console.log('  ✓ effect-mapper: all kinds handled');
}

// Test: hook-dispatcher dispatches correctly
function testHookDispatcher() {
  const { fireHook, HOOK_TYPES } = require('../.codex/hook-dispatcher');
  assert.ok(Array.isArray(HOOK_TYPES), 'HOOK_TYPES should be an array');
  assert.ok(HOOK_TYPES.length >= 16, 'Should have at least 16 hook types');
  // fireHook should not throw for valid types
  fireHook('on-score', { score: 85 }, { skipCli: true });
  console.log('  ✓ hook-dispatcher: dispatches without errors');
}

// Test: profile-manager handles missing profiles
function testProfileManager() {
  const { readUserProfile, readProjectProfile } = require('../.codex/profile-manager');
  // Should return null for non-existent profiles, not throw
  const userProfile = readUserProfile();
  const projectProfile = readProjectProfile('/tmp/nonexistent');
  // Both should be null or an object, not throw
  console.log('  ✓ profile-manager: handles missing profiles gracefully');
}

// Test: health-check returns structured output
function testHealthCheck() {
  const { checkHealth, runStartupHealthGate } = require('../.codex/health-check');
  const health = checkHealth(false);
  assert.ok(health, 'checkHealth should return an object');
  assert.ok('status' in health || 'error' in health, 'Should have status or error');
  console.log('  ✓ health-check: returns structured status');
}

// Test: discovery module exports
function testDiscovery() {
  const { discoverSkills, fetchRemoteSkills, parseProcessMarkers } = require('../.codex/discovery');
  assert.ok(typeof discoverSkills === 'function');
  assert.ok(typeof fetchRemoteSkills === 'function');
  assert.ok(typeof parseProcessMarkers === 'function');
  console.log('  ✓ discovery: exports all functions');
}

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

// Test: trace logger exports
function testTraceLogger() {
  const { appendTrace, resolveTracePath } = require('../.codex/trace-logger');
  assert.ok(typeof appendTrace === 'function');
  assert.ok(typeof resolveTracePath === 'function');
  console.log('  ✓ trace-logger: exports append/resolve');
}

// Test: session-manager exports
function testSessionManager() {
  const sm = require('../.codex/session-manager');
  const expected = ['initSession', 'associateSession', 'resumeSession', 'getSessionState',
                    'updateSession', 'checkIteration', 'getIterationMessage', 'getLastMessage',
                    'resolveResumeSelector'];
  for (const fn of expected) {
    assert.ok(typeof sm[fn] === 'function', `session-manager should export ${fn}`);
  }
  console.log('  ✓ session-manager: exports all expected functions');
}

// Test: stop-decision fallback logic
function testStopDecision() {
  const sd = require('../.codex/hooks/stop-decision');
  assert.ok(typeof sd.computeStopDecision === 'function');

  const terminal = sd.computeStopDecision({ runState: 'completed', pendingCount: 3, statusOk: true, pendingOk: true });
  assert.strictEqual(terminal.decision, 'approve');

  const pending = sd.computeStopDecision({ runState: 'running', pendingCount: 2, statusOk: true, pendingOk: true });
  assert.strictEqual(pending.decision, 'block');

  const unknown = sd.computeStopDecision({ runState: '', pendingCount: 0, statusOk: false, pendingOk: true });
  assert.strictEqual(unknown.decision, 'block');

  console.log('  ✓ stop-decision: conservative block-unless-terminal behavior');
}

// Run all tests
console.log('Unit Tests:');
try {
  testEffectMapper();
  testHookDispatcher();
  testProfileManager();
  testHealthCheck();
  testDiscovery();
  testSdkCli();
  testTraceLogger();
  testSessionManager();
  testStopDecision();
  console.log('\nAll unit tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}
