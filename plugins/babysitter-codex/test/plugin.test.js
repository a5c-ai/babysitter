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
// skill-loader.js tests
// ============================================================================

console.log('\nSkill Loader:');

const sl = require('../.codex/skill-loader');

test('loadPlugin returns valid manifest', () => {
  const plugin = sl.loadPlugin();
  assert.ok(plugin.name === 'babysitter');
  assert.ok(plugin.version === '4.0.143');
  assert.ok(Array.isArray(plugin.commands));
  assert.strictEqual(plugin.commands.length, 11);
});

test('resolveCommandName resolves canonical names', () => {
  assert.strictEqual(sl.resolveCommandName('babysitter:call'), 'babysitter:call');
  assert.strictEqual(sl.resolveCommandName('babysitter:yolo'), 'babysitter:yolo');
  assert.strictEqual(sl.resolveCommandName('babysitter:doctor'), 'babysitter:doctor');
});

test('resolveCommandName resolves short names', () => {
  assert.strictEqual(sl.resolveCommandName('call'), 'babysitter:call');
  assert.strictEqual(sl.resolveCommandName('yolo'), 'babysitter:yolo');
  assert.strictEqual(sl.resolveCommandName('resume'), 'babysitter:resume');
});

test('resolveCommandName resolves aliases', () => {
  assert.strictEqual(sl.resolveCommandName('babysitter:babysit'), 'babysitter:call');
  assert.strictEqual(sl.resolveCommandName('babysitter'), 'babysitter:call');
});

test('resolveCommandName strips leading slash', () => {
  assert.strictEqual(sl.resolveCommandName('/babysitter:call'), 'babysitter:call');
  assert.strictEqual(sl.resolveCommandName('/yolo'), 'babysitter:yolo');
});

test('resolveCommandName returns null for unknown', () => {
  assert.strictEqual(sl.resolveCommandName('nonexistent'), null);
  assert.strictEqual(sl.resolveCommandName('babysitter:fake'), null);
});

test('getSkillPath returns valid file paths', () => {
  const skillPath = sl.getSkillPath('babysitter:call');
  assert.ok(skillPath);
  assert.ok(fs.existsSync(skillPath), `Skill file should exist: ${skillPath}`);
});

test('getSkillPath returns null for unknown command', () => {
  assert.strictEqual(sl.getSkillPath('nonexistent'), null);
});

test('loadSkill returns skill content', () => {
  const skill = sl.loadSkill('babysitter:help');
  assert.ok(skill);
  assert.strictEqual(skill.name, 'babysitter:help');
  assert.ok(skill.content.length > 0);
  assert.ok(skill.path.endsWith('SKILL.md'));
});

test('loadSkill returns null for unknown', () => {
  assert.strictEqual(sl.loadSkill('nonexistent'), null);
});

test('getSkillContent returns markdown content', () => {
  const content = sl.getSkillContent('babysitter:doctor');
  assert.ok(content);
  assert.ok(content.includes('#') || content.length > 10);
});

test('listCommands returns all 11 commands', () => {
  const commands = sl.listCommands();
  assert.strictEqual(commands.length, 11);
  const names = commands.map(c => c.name);
  assert.ok(names.includes('babysitter:call'));
  assert.ok(names.includes('babysitter:yolo'));
  assert.ok(names.includes('babysitter:resume'));
  assert.ok(names.includes('babysitter:plan'));
  assert.ok(names.includes('babysitter:forever'));
  assert.ok(names.includes('babysitter:doctor'));
  assert.ok(names.includes('babysitter:observe'));
  assert.ok(names.includes('babysitter:help'));
  assert.ok(names.includes('babysitter:project-install'));
  assert.ok(names.includes('babysitter:user-install'));
  assert.ok(names.includes('babysitter:assimilate'));
});

test('suggestCommand suggests close matches', () => {
  const suggestion = sl.suggestCommand('babysitter:cal');
  assert.strictEqual(suggestion, 'babysitter:call');
});

test('suggestCommand returns null for very different input', () => {
  const suggestion = sl.suggestCommand('babysitter:zzzzzzzzz');
  assert.strictEqual(suggestion, null);
});

// ============================================================================
// command-dispatcher.js tests
// ============================================================================

console.log('\nCommand Dispatcher:');

const cd = require('../.codex/command-dispatcher');

test('dispatch recognizes valid slash commands', () => {
  const result = cd.dispatch('/babysitter:help');
  assert.ok(result.dispatched);
  assert.strictEqual(result.command, 'babysitter:help');
  assert.ok(result.instructions);
});

test('dispatch extracts arguments', () => {
  const result = cd.dispatch('/babysitter:yolo build a REST API');
  assert.ok(result.dispatched);
  assert.strictEqual(result.command, 'babysitter:yolo');
  assert.strictEqual(result.args, 'build a REST API');
});

test('dispatch returns dispatched:false for non-commands', () => {
  const result = cd.dispatch('hello world');
  assert.strictEqual(result.dispatched, false);
  assert.ok(!result.error);
});

test('dispatch returns error for unknown babysitter commands', () => {
  const result = cd.dispatch('/babysitter:nonexistent');
  assert.strictEqual(result.dispatched, false);
  assert.ok(result.error);
});

test('dispatch suggests typo corrections', () => {
  const result = cd.dispatch('/babysitter:cal');
  assert.strictEqual(result.dispatched, false);
  assert.ok(result.error.includes('babysitter:call'));
});

test('isBabysitterCommand detects babysitter commands', () => {
  assert.ok(cd.isBabysitterCommand('/babysitter:call'));
  assert.ok(cd.isBabysitterCommand('/babysitter:yolo build stuff'));
  assert.ok(!cd.isBabysitterCommand('/git commit'));
  assert.ok(!cd.isBabysitterCommand('babysitter:call'));
});

test('helpSummary includes all commands', () => {
  const help = cd.helpSummary();
  assert.ok(help.includes('babysitter:call'));
  assert.ok(help.includes('babysitter:yolo'));
  assert.ok(help.includes('babysitter:help'));
  assert.ok(help.includes('Available Commands'));
});

// ============================================================================
// effect-mapper.js deep tests
// ============================================================================

console.log('\nEffect Mapper (detailed):');

const em = require('../.codex/effect-mapper');

test('mapEffectToCodexPrompt builds agent prompt with all fields', () => {
  const prompt = em.mapEffectToCodexPrompt({
    kind: 'agent',
    agent: {
      role: 'QA engineer',
      task: 'Score results 0-100',
      context: { scope: 'test' },
      instructions: ['Review', 'Score'],
      outputFormat: 'JSON',
    }
  });
  assert.ok(prompt.includes('QA engineer'));
  assert.ok(prompt.includes('Score results 0-100'));
  assert.ok(prompt.includes('"scope"'));
  assert.ok(prompt.includes('1. Review'));
  assert.ok(prompt.includes('2. Score'));
  assert.ok(prompt.includes('JSON'));
});

test('mapEffectToCodexPrompt handles nested effect structure', () => {
  const prompt = em.mapEffectToCodexPrompt({
    effect: { kind: 'agent', agent: { role: 'dev', task: 'code' } }
  });
  assert.ok(prompt.includes('dev'));
  assert.ok(prompt.includes('code'));
});

test('mapEffectToCodexPrompt handles node effect', () => {
  const prompt = em.mapEffectToCodexPrompt({
    kind: 'node',
    node: { script: 'build.js', args: ['--prod', '--minify'] }
  });
  assert.strictEqual(prompt, 'node build.js --prod --minify');
});

test('mapEffectToCodexPrompt handles shell effect', () => {
  const prompt = em.mapEffectToCodexPrompt({
    kind: 'shell',
    shell: { command: 'npm run build' }
  });
  assert.strictEqual(prompt, 'npm run build');
});

test('mapEffectToCodexPrompt handles skill effect', () => {
  const prompt = em.mapEffectToCodexPrompt({
    kind: 'skill',
    skill: { name: 'analyzer', description: 'Analyze code', input: { target: 'src' } }
  });
  assert.ok(prompt.includes('analyzer'));
  assert.ok(prompt.includes('Analyze code'));
  assert.ok(prompt.includes('"target"'));
});

test('mapEffectToCodexPrompt returns null for breakpoint', () => {
  const result = em.mapEffectToCodexPrompt({ kind: 'breakpoint' });
  assert.strictEqual(result, null);
});

test('mapEffectToCodexPrompt returns null for sleep', () => {
  const result = em.mapEffectToCodexPrompt({ kind: 'sleep' });
  assert.strictEqual(result, null);
});

test('mapEffectToCodexPrompt returns null for unknown kind', () => {
  const result = em.mapEffectToCodexPrompt({ kind: 'unknown_kind_xyz' });
  assert.strictEqual(result, null);
});

test('mapEffectToCodexPrompt handles parallel effects', () => {
  const prompt = em.mapEffectToCodexPrompt({
    kind: 'parallel',
    parallel: {
      effects: [
        { kind: 'shell', shell: { command: 'echo a' } },
        { kind: 'shell', shell: { command: 'echo b' } },
      ]
    }
  });
  assert.ok(prompt.includes('echo a'));
  assert.ok(prompt.includes('echo b'));
  assert.ok(prompt.includes('---'));
});

test('mapEffectToCodexPrompt handles orchestrator_task', () => {
  const prompt = em.mapEffectToCodexPrompt({
    kind: 'orchestrator_task',
    orchestrator_task: {
      objective: 'Deploy',
      role: 'ops',
      subtasks: ['build', 'test', 'deploy'],
      constraints: ['no downtime'],
    }
  });
  assert.ok(prompt.includes('Deploy'));
  assert.ok(prompt.includes('ops'));
  assert.ok(prompt.includes('build'));
  assert.ok(prompt.includes('no downtime'));
});

test('parseCodexOutput extracts JSON from structured output', () => {
  const result = em.parseCodexOutput('{"score": 85}', { outputSchema: { score: 0 } });
  assert.strictEqual(result.kind, 'structured');
  assert.strictEqual(result.data.score, 85);
});

test('parseCodexOutput handles plain text', () => {
  const result = em.parseCodexOutput('All tests passed!', {});
  assert.strictEqual(result.kind, 'text');
  assert.strictEqual(result.data, 'All tests passed!');
});

test('parseCodexOutput extracts JSON from markdown fences', () => {
  const raw = 'Here is the result:\n```json\n{"value": 42}\n```\nDone.';
  const result = em.parseCodexOutput(raw, { outputSchema: { value: 0 } });
  assert.strictEqual(result.kind, 'structured');
  assert.strictEqual(result.data.value, 42);
});

test('mapCodexError maps known exit codes', () => {
  const result = em.mapCodexError(127, 'command not found');
  assert.strictEqual(result.errorCategory, 'command_not_found');
  assert.strictEqual(result.exitCode, 127);
});

test('mapCodexError handles unknown exit codes', () => {
  const result = em.mapCodexError(99, 'something weird');
  assert.strictEqual(result.errorCategory, 'unknown_error');
});

test('buildCodexArgs includes --full-auto by default', () => {
  const args = em.buildCodexArgs({});
  assert.ok(args.includes('--full-auto'));
});

test('buildCodexArgs omits --full-auto when disabled', () => {
  const args = em.buildCodexArgs({}, { fullAuto: false });
  assert.ok(!args.includes('--full-auto'));
});

test('buildCodexArgs includes --json for tasks with outputSchema', () => {
  const args = em.buildCodexArgs({ outputSchema: { score: 0 } });
  assert.ok(args.includes('--json'));
});

test('buildCodexArgs includes model when specified', () => {
  const args = em.buildCodexArgs({ model: 'gpt-4o' });
  assert.ok(args.includes('--model'));
  assert.ok(args.includes('gpt-4o'));
});

test('batchEffects groups independent effects', () => {
  const batches = em.batchEffects([
    { id: 'a' },
    { id: 'b' },
    { id: 'c', dependsOn: ['a'] },
  ]);
  assert.strictEqual(batches.length, 2);
  assert.strictEqual(batches[0].length, 2); // a, b
  assert.strictEqual(batches[1].length, 1); // c
});

test('batchEffects handles empty input', () => {
  assert.deepStrictEqual(em.batchEffects([]), []);
  assert.deepStrictEqual(em.batchEffects(null), []);
});

test('batchEffects handles chain dependencies', () => {
  const batches = em.batchEffects([
    { id: 'a' },
    { id: 'b', dependsOn: ['a'] },
    { id: 'c', dependsOn: ['b'] },
  ]);
  assert.strictEqual(batches.length, 3);
});

// ============================================================================
// result-poster.js tests (unit, no CLI calls)
// ============================================================================

console.log('\nResult Poster:');

const rp = require('../.codex/result-poster');

test('validateResult accepts valid result', () => {
  const { valid, errors } = rp.validateResult(
    { score: 85, label: 'good' },
    { score: 0, label: '' }
  );
  assert.ok(valid);
  assert.strictEqual(errors.length, 0);
});

test('validateResult catches missing fields', () => {
  const { valid, errors } = rp.validateResult(
    { score: 85 },
    { score: 0, label: '' }
  );
  assert.ok(!valid);
  assert.ok(errors.some(e => e.includes('label')));
});

test('validateResult catches type mismatches', () => {
  const { valid, errors } = rp.validateResult(
    { score: 'not a number' },
    { score: 0 }
  );
  assert.ok(!valid);
  assert.ok(errors.some(e => e.includes('type')));
});

test('validateResult accepts null schema', () => {
  const { valid } = rp.validateResult({ anything: true }, null);
  assert.ok(valid);
});

test('contentHash produces consistent hashes', () => {
  const h1 = rp.contentHash('test data');
  const h2 = rp.contentHash('test data');
  assert.strictEqual(h1, h2);
  assert.strictEqual(h1.length, 16);
});

test('contentHash produces different hashes for different data', () => {
  const h1 = rp.contentHash('data1');
  const h2 = rp.contentHash('data2');
  assert.notStrictEqual(h1, h2);
});

// ============================================================================
// iteration-guard.js tests
// ============================================================================

console.log('\nIteration Guard:');

const ig = require('../.codex/iteration-guard');

test('checkIterationGuard increments and enforces limit', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-test-'));
  const result = await ig.checkIterationGuard(tmpDir, { maxIterations: 5 });
  assert.ok(result.allowed);
  assert.strictEqual(result.current, 1);
  assert.strictEqual(result.max, 5);

  // Run up to the limit
  for (let i = 0; i < 4; i++) {
    await ig.checkIterationGuard(tmpDir, { maxIterations: 5 });
  }
  const final = await ig.checkIterationGuard(tmpDir, { maxIterations: 5 });
  assert.ok(!final.allowed);
  assert.ok(final.warning.includes('limit'));
  fs.rmSync(tmpDir, { recursive: true });
});

test('checkTimeGuard allows when no start time found', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'time-test-'));
  const result = await ig.checkTimeGuard(tmpDir, { timeout: 60000 });
  assert.ok(result.allowed);
  assert.ok(result.warning && result.warning.includes('start time'));
  fs.rmSync(tmpDir, { recursive: true });
});

test('checkTimeGuard allows within timeout', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'time-test-'));
  const stateDir = path.join(tmpDir, 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'state.json'),
    JSON.stringify({ startedAt: new Date().toISOString() })
  );
  const result = await ig.checkTimeGuard(tmpDir, { timeout: 60000 });
  assert.ok(result.allowed);
  assert.strictEqual(result.warning, null);
  fs.rmSync(tmpDir, { recursive: true });
});

test('checkCostGuard allows when no token data', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cost-test-'));
  const result = await ig.checkCostGuard(tmpDir, { maxCost: 1000 });
  assert.ok(result.allowed);
  assert.strictEqual(result.totalTokens, 0);
  fs.rmSync(tmpDir, { recursive: true });
});

test('checkCostGuard halts when over limit', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cost-test-'));
  const stateDir = path.join(tmpDir, 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'token-usage.json'),
    JSON.stringify([500, 600])
  );
  const result = await ig.checkCostGuard(tmpDir, { maxCost: 1000 });
  assert.ok(!result.allowed);
  assert.strictEqual(result.totalTokens, 1100);
  fs.rmSync(tmpDir, { recursive: true });
});

test('checkStallGuard detects quality plateau', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stall-test-'));
  const stateDir = path.join(tmpDir, 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'quality-scores.json'),
    JSON.stringify([85, 85.2, 85.1])
  );
  const result = await ig.checkStallGuard(tmpDir, { stallWindow: 3, stallDelta: 1.0 });
  assert.ok(!result.allowed);
  assert.ok(result.stalled);
  fs.rmSync(tmpDir, { recursive: true });
});

test('checkStallGuard allows when scores are improving', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stall-test-'));
  const stateDir = path.join(tmpDir, 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'quality-scores.json'),
    JSON.stringify([70, 80, 90])
  );
  const result = await ig.checkStallGuard(tmpDir, { stallWindow: 3, stallDelta: 1.0 });
  assert.ok(result.allowed);
  assert.ok(!result.stalled);
  fs.rmSync(tmpDir, { recursive: true });
});

test('checkIterationMetadata detects rebuilt state', () => {
  const result = ig.checkIterationMetadata({ stateRebuilt: true, stateRebuildReason: 'test' });
  assert.ok(result.stateRebuilt);
});

test('checkIterationMetadata returns null for no metadata', () => {
  assert.strictEqual(ig.checkIterationMetadata(null), null);
});

// ============================================================================
// hook-dispatcher.js deep tests
// ============================================================================

console.log('\nHook Dispatcher (detailed):');

const hd = require('../.codex/hook-dispatcher');

test('HOOK_TYPES contains all 13 types', () => {
  const expected = [
    'on-run-start', 'on-run-complete', 'on-run-fail',
    'on-task-start', 'on-task-complete', 'on-step-dispatch',
    'on-iteration-start', 'on-iteration-end',
    'on-breakpoint', 'pre-commit', 'pre-branch',
    'post-planning', 'on-score',
  ];
  for (const type of expected) {
    assert.ok(hd.HOOK_TYPES.includes(type), `Missing hook type: ${type}`);
  }
});

test('fireHook does not throw for all valid types', () => {
  for (const type of hd.HOOK_TYPES) {
    hd.fireHook(type, { test: true }, { skipCli: true });
  }
});

test('fireHook warns but does not throw for unknown types', () => {
  hd.fireHook('nonexistent-type', {}, { skipCli: true, skipHandlers: true });
});

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
// discovery.js tests (parseProcessMarkers only — no CLI calls)
// ============================================================================

console.log('\nDiscovery:');

const disc = require('../.codex/discovery');

test('parseProcessMarkers extracts @skill markers', () => {
  const tmpFile = path.join(os.tmpdir(), 'test-process.js');
  fs.writeFileSync(tmpFile, `
/**
 * @skill frontend-design ./skills/frontend/SKILL.md
 * @agent architect ./agents/architect/AGENT.md
 * @skill visual-diff ./skills/visual-diff/SKILL.md
 */
module.exports = {};
`);
  const result = disc.parseProcessMarkers(tmpFile);
  assert.strictEqual(result.skills.length, 2);
  assert.strictEqual(result.agents.length, 1);
  assert.strictEqual(result.skills[0].name, 'frontend-design');
  assert.strictEqual(result.agents[0].name, 'architect');
  fs.unlinkSync(tmpFile);
});

test('parseProcessMarkers handles missing file', () => {
  const result = disc.parseProcessMarkers('/tmp/nonexistent-file.js');
  assert.deepStrictEqual(result, { skills: [], agents: [] });
});

test('parseProcessMarkers handles null input', () => {
  const result = disc.parseProcessMarkers(null);
  assert.deepStrictEqual(result, { skills: [], agents: [] });
});

// ============================================================================
// SKILL.md files existence tests
// ============================================================================

console.log('\nSkill Files:');

const expectedSkills = [
  'call', 'yolo', 'resume', 'plan', 'forever',
  'doctor', 'observe', 'help', 'project-install',
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

test('loop-control.sh exists and is non-empty', () => {
  const hookPath = path.join(PROJECT_ROOT, '.codex', 'hooks', 'loop-control.sh');
  assert.ok(fs.existsSync(hookPath));
  assert.ok(fs.readFileSync(hookPath, 'utf8').length > 10);
});

// ============================================================================
// config.toml validation
// ============================================================================

console.log('\nConfig:');

test('config.toml exists and contains required sections', () => {
  const configPath = path.join(PROJECT_ROOT, '.codex', 'config.toml');
  const content = fs.readFileSync(configPath, 'utf8');
  assert.ok(content.includes('[sandbox]'));
  assert.ok(content.includes('[plugin]'));
  assert.ok(content.includes('[hooks]'));
  // MCP server section should NOT be present (SDK is CLI-only, not an MCP server)
  assert.ok(!content.includes('[mcp_servers.babysitter]'), 'config.toml should not have MCP server section');
});

// ============================================================================
// Summary
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
