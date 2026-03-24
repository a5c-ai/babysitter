'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \u2717 ${name}: ${err.message}`);
    failed++;
  }
}

// ============================================================================
// hooks/utils.js tests
// ============================================================================

console.log('\nHooks Utils:');

const utils = require('../.codex/hooks/utils');

test('isValidRunId accepts valid ULIDs', () => {
  assert.ok(utils.isValidRunId('01KJXAQWD61XZ5Y3HR38AK5ANV'));
  assert.ok(utils.isValidRunId('abc-123'));
});

test('isValidRunId rejects injection attempts', () => {
  assert.ok(!utils.isValidRunId('test; rm -rf /'));
  assert.ok(!utils.isValidRunId('$(whoami)'));
  assert.ok(!utils.isValidRunId(''));
  assert.ok(!utils.isValidRunId(null));
});

test('readSessionContext returns null for nonexistent path', () => {
  assert.strictEqual(utils.readSessionContext('/tmp/nonexistent-path-xyz'), null);
});

test('getRunId reads from environment', () => {
  const original = process.env.BABYSITTER_RUN_ID;
  process.env.BABYSITTER_RUN_ID = 'test-run-id';
  assert.strictEqual(utils.getRunId(), 'test-run-id');
  if (original) {
    process.env.BABYSITTER_RUN_ID = original;
  } else {
    delete process.env.BABYSITTER_RUN_ID;
  }
});

// ============================================================================
// SKILL.md files existence tests
// ============================================================================

console.log('\nSkill Files:');

const expectedSkills = [
  'call', 'yolo', 'resume', 'plan', 'forever',
  'retrospect', 'model', 'issue',
  'doctor', 'observe', 'help', 'project-install', 'team-install',
  'user-install', 'assimilate'
];

for (const skill of expectedSkills) {
  test(`SKILL.md exists for ${skill}`, () => {
    const skillPath = path.join(PROJECT_ROOT, '.codex', 'skills', 'babysitter', skill, 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), `Missing: ${skillPath}`);
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.length > 50, `SKILL.md for ${skill} is too short (${content.length} chars)`);
  });
}

console.log('\nCommand Docs:');

const expectedCommandDocs = [
  'README.md',
  'call.md',
  'yolo.md',
  'resume.md',
  'plan.md',
  'forever.md',
  'doctor.md',
  'observe.md',
  'retrospect.md',
  'model.md',
  'issue.md',
  'help.md',
  'project-install.md',
  'team-install.md',
  'user-install.md',
  'assimilate.md',
];

for (const doc of expectedCommandDocs) {
  test(`command doc exists: ${doc}`, () => {
    const docPath = path.join(PROJECT_ROOT, 'commands', doc);
    assert.ok(fs.existsSync(docPath), `Missing command doc: ${docPath}`);
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(content.length > 50, `Command doc too short: ${doc}`);
  });
}

// ============================================================================
// Hook scripts existence tests
// ============================================================================

console.log('\nHook Scripts:');

test('babysitter-session-start.sh exists and is non-empty', () => {
  const hookPath = path.join(PROJECT_ROOT, '.codex', 'hooks', 'babysitter-session-start.sh');
  assert.ok(fs.existsSync(hookPath));
  assert.ok(fs.readFileSync(hookPath, 'utf8').length > 10);
});

test('babysitter-stop-hook.sh exists and is non-empty', () => {
  const hookPath = path.join(PROJECT_ROOT, '.codex', 'hooks', 'babysitter-stop-hook.sh');
  assert.ok(fs.existsSync(hookPath));
  assert.ok(fs.readFileSync(hookPath, 'utf8').length > 10);
});

test('hooks.json exists and registers SessionStart/UserPromptSubmit/Stop', () => {
  const hooksPath = path.join(PROJECT_ROOT, '.codex', 'hooks.json');
  assert.ok(fs.existsSync(hooksPath));
  const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  assert.ok(Array.isArray(hooks?.hooks?.SessionStart));
  assert.ok(Array.isArray(hooks?.hooks?.UserPromptSubmit));
  assert.ok(Array.isArray(hooks?.hooks?.Stop));
});

// ============================================================================
// config.toml validation
// ============================================================================

console.log('\nConfig:');

test('config.toml exists and contains required sections', () => {
  const configPath = path.join(PROJECT_ROOT, '.codex', 'config.toml');
  const content = fs.readFileSync(configPath, 'utf8');
  assert.ok(content.includes('sandbox_mode = "workspace-write"'));
  assert.ok(content.includes('approval_policy = "on-request"'));
  assert.ok(content.includes('[features]'));
  assert.ok(content.includes('codex_hooks = true'));
  assert.ok(content.includes('[sandbox_workspace_write]'));
  assert.ok(!content.includes('[plugin]'));
  assert.ok(!content.includes('[hooks]'));
});

// ============================================================================
// Summary
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
