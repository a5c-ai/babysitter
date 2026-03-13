'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { supports, getCompatibilityReport } = require('../.codex/sdk-cli');
const { resolveSdkPackage } = require('../.codex/sdk-package');

const ROOT = path.resolve(__dirname, '..');
const PROCESS_DIR = path.join(ROOT, '.a5c', 'processes');
const RUNS_DIR = path.join(ROOT, '.a5c', 'runs');
const STRICT = process.argv.includes('--strict');
const SDK_PACKAGE = resolveSdkPackage();

function fail(message, details) {
  console.error('[scenario] FAIL:', message);
  if (details) console.error(details);
  process.exit(1);
}

function skip(message, details) {
  console.warn('[scenario] SKIP:', message);
  if (details) console.warn(details);
  process.exit(0);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function runChecked(args) {
  const result = runBabysitter(args);
  if (!result.ok) {
    if (!STRICT && String(result.stderr || '').includes('EPERM')) {
      skip('Command execution is blocked by environment permissions. Re-run with --strict in a less restricted shell.', result.stderr);
    }
    fail(`Command failed: babysitter ${args.join(' ')}`, `${result.stderr || ''}\n${result.stdout || ''}`);
  }
  return result;
}

function runnerCandidates() {
  const localCmd = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'babysitter.cmd' : 'babysitter');
  const candidates = [
    { bin: 'babysitter', baseArgs: [] },
    { bin: localCmd, baseArgs: [] },
  ];
  if (process.platform === 'win32') {
    candidates.push({ bin: 'npx.cmd', baseArgs: ['-y', SDK_PACKAGE] });
  } else {
    candidates.push({ bin: 'npx', baseArgs: ['-y', SDK_PACKAGE] });
  }
  return candidates;
}

function runBabysitter(args) {
  const tried = [];
  for (const c of runnerCandidates()) {
    const allArgs = [...c.baseArgs, ...args];
    let res;
    if (process.platform === 'win32') {
      const quoted = [c.bin, ...allArgs]
        .map((x) => (/\s/.test(x) ? `"${x}"` : x))
        .join(' ');
      res = spawnSync('cmd.exe', ['/d', '/s', '/c', quoted], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000,
      });
    } else {
      res = spawnSync(c.bin, allArgs, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000,
      });
    }
    tried.push({
      cmd: `${c.bin} ${allArgs.join(' ')}`,
      code: res.status,
      error: res.error ? String(res.error.message || res.error) : '',
      stdout: String(res.stdout || '').trim(),
      stderr: String(res.stderr || '').trim(),
    });
    const ok = res.status === 0;
    if (ok) {
      return {
        ok: true,
        stdout: String(res.stdout || ''),
        stderr: String(res.stderr || ''),
        exitCode: res.status,
        runner: c.bin,
      };
    }
  }

  return {
    ok: false,
    stdout: '',
    stderr: `Unable to execute babysitter command. Tried:\n${tried.map((t) => `- ${t.cmd}\n  code=${t.code}\n  error=${t.error}\n  stderr=${t.stderr}\n  stdout=${t.stdout}`).join('\n')}`,
    exitCode: null,
    runner: 'none',
  };
}

function parseOut(result) {
  const text = String(result.stdout || '').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    const m = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!m) return {};
    try {
      return JSON.parse(m[0]);
    } catch {
      return {};
    }
  }
}

function verifySkillLibrary() {
  const base = path.join(ROOT, '.codex', 'skills', 'babysitter');
  const expected = [
    'call',
    'yolo',
    'resume',
    'plan',
    'forever',
    'doctor',
    'observe',
    'model',
    'issue',
    'help',
    'project-install',
    'user-install',
    'assimilate',
  ];
  const missing = expected.filter((name) => !fs.existsSync(path.join(base, name, 'SKILL.md')));
  if (missing.length) {
    fail(`Missing skill docs for commands: ${missing.join(', ')}`);
  }
  return expected.length;
}

function createScenarioProcess(processId) {
  ensureDir(PROCESS_DIR);
  const processPath = path.join(PROCESS_DIR, 'full-session-scenario-process.js');
  const inputsPath = path.join(PROCESS_DIR, 'full-session-scenario-inputs.json');

  const processSource = `/**
 * @process ${processId}
 * @description Full session scenario process for babysitter-codex validation.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const agentStep = defineTask('scenario-agent-step', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scenario agent step',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario validator',
      task: 'Return a compact success JSON object',
      context: { cycle: args.cycle },
      instructions: ['Return JSON with status=ok and cycle'],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: \`tasks/\${taskCtx.effectId}/input.json\`,
    outputJsonPath: \`tasks/\${taskCtx.effectId}/output.json\`,
  },
  labels: ['scenario', 'agent'],
}));

const breakpointStep = defineTask('scenario-breakpoint-step', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Scenario breakpoint step',
  metadata: {
    label: 'scenario-breakpoint',
    payload: {
      title: 'Approve scenario cycle',
      question: \`Approve cycle \${args.cycle}?\`,
    },
  },
  io: {
    inputJsonPath: \`tasks/\${taskCtx.effectId}/input.json\`,
    outputJsonPath: \`tasks/\${taskCtx.effectId}/output.json\`,
  },
  labels: ['scenario', 'breakpoint'],
}));

export async function process(inputs, ctx) {
  const cycles = Number(inputs.cycles || 2);
  let approved = 0;
  for (let i = 1; i <= cycles; i += 1) {
    await ctx.task(agentStep, { cycle: i });
    const gate = await ctx.task(breakpointStep, { cycle: i });
    if (gate && gate.approved) approved += 1;
    else return { completed: false, cyclesDone: i, approved };
  }
  return { completed: true, approved, cycles };
}
`;

  writeJson(inputsPath, { cycles: 2 });
  fs.writeFileSync(processPath, processSource, 'utf8');

  return {
    processPath,
    inputsPath,
  };
}

function maybeCheckUpstreamImport() {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--upstream-url');
  if (idx < 0 || !args[idx + 1]) {
    return { checked: false, reachable: null, url: null };
  }

  const url = args[idx + 1];
  const lsRemote = spawnSync('git', ['ls-remote', url], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  return {
    checked: true,
    url,
    reachable: lsRemote.status === 0,
    stderr: String(lsRemote.stderr || '').trim(),
  };
}

function main() {
  console.log('[scenario] Starting full babysitter session scenario...');

  const compat = getCompatibilityReport();
  const required = ['run:create', 'run:iterate', 'run:status', 'task:list', 'task:post'];
  const missing = required.filter((c) => !supports(c));
  if (missing.length) fail(`Missing required SDK commands: ${missing.join(', ')}`);

  const skillCount = verifySkillLibrary();
  const processId = 'diagnostics/full-session-scenario';
  const { processPath, inputsPath } = createScenarioProcess(processId);

  runChecked(['version']);
  const createRes = runChecked([
    'run:create',
    '--process-id', processId,
    '--entry', `${processPath}#process`,
    '--inputs', inputsPath,
    '--json',
  ]);
  const created = parseOut(createRes);
  const runId = created.runId || created.id;
  if (!runId) fail('run:create did not return runId', createRes.stdout);

  let breakpointSeen = 0;
  let breakpointApproved = 0;
  let iterations = 0;
  const maxIterations = 30;

  while (iterations < maxIterations) {
    iterations += 1;
    runChecked(['run:iterate', runId, '--json', '--iteration', String(iterations)]);

    const statusRes = runChecked(['run:status', runId, '--json']);
    const status = parseOut(statusRes);
    if (status.state === 'completed' || status.state === 'failed') break;

    const tasksRes = runChecked(['task:list', runId, '--pending', '--json']);
    const pending = parseOut(tasksRes);
    const tasks = Array.isArray(pending.tasks) ? pending.tasks : [];

    for (const task of tasks) {
      const effectId = task.effectId;
      const kind = task.kind || 'agent';
      if (!effectId) continue;

      const outDir = path.join(RUNS_DIR, runId, 'tasks', effectId);
      ensureDir(outDir);
      const outPath = path.join(outDir, 'output.json');
      const outRef = `tasks/${effectId}/output.json`;

      if (kind === 'breakpoint') {
        breakpointSeen += 1;
        writeJson(outPath, {
          approved: true,
          response: 'Approved by full-session-scenario runner',
          source: 'test/full-session-scenario.js',
        });
        breakpointApproved += 1;
      } else {
        writeJson(outPath, {
          status: 'ok',
          note: `Resolved ${kind} during full session scenario`,
        });
      }

      runChecked(['task:post', runId, effectId, '--status', 'ok', '--value', outRef, '--json']);
    }
  }

  const finalStatus = parseOut(runChecked(['run:status', runId, '--json']));
  if (finalStatus.state !== 'completed') {
    fail(`Run did not complete successfully. Final state: ${finalStatus.state || 'unknown'}`);
  }
  if (breakpointSeen === 0) fail('No breakpoint tasks were observed.');
  if (breakpointApproved === 0) fail('No breakpoint approvals were posted.');

  const outputFile = path.join(RUNS_DIR, runId, 'state', 'output.json');
  const outputRaw = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, 'utf8') : '';

  const upstream = maybeCheckUpstreamImport();

  const summary = {
    ok: true,
    runId,
    iterations,
    compatibilityMode: compat.mode,
    skillLibraryCount: skillCount,
    breakpointSeen,
    breakpointApproved,
    upstreamImportCheck: upstream,
    outputFile,
    outputPreview: outputRaw.slice(0, 500),
  };

  console.log('[scenario] PASS');
  console.log(JSON.stringify(summary, null, 2));
}

main();
