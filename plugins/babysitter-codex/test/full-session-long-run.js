'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveSdkPackage } = require('../.codex/sdk-package');

const ROOT = path.resolve(__dirname, '..');
const PROCESS_DIR = path.join(ROOT, '.a5c', 'processes');
const RUNS_DIR = path.join(ROOT, '.a5c', 'runs');
const ARTIFACTS_DIR = path.join(ROOT, '.a5c', 'artifacts');
const SDK_PACKAGE = resolveSdkPackage();
const STRICT = process.argv.includes('--strict');

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

function parseJsonish(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    const m = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function runnerCandidates() {
  const localCmd = path.join(
    ROOT,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'babysitter.cmd' : 'babysitter',
  );
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
      const quoted = [c.bin, ...allArgs].map((x) => (/\s/.test(x) ? `"${x}"` : x)).join(' ');
      res = spawnSync('cmd.exe', ['/d', '/s', '/c', quoted], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 120000,
      });
    } else {
      res = spawnSync(c.bin, allArgs, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 120000,
      });
    }
    tried.push({
      cmd: `${c.bin} ${allArgs.join(' ')}`,
      code: res.status,
      error: res.error ? String(res.error.message || res.error) : '',
      stdout: String(res.stdout || '').trim(),
      stderr: String(res.stderr || '').trim(),
    });
    if (res.status === 0) {
      return {
        ok: true,
        stdout: String(res.stdout || ''),
        stderr: String(res.stderr || ''),
      };
    }
  }

  return {
    ok: false,
    stdout: '',
    stderr: `Unable to execute babysitter command. Tried:\n${tried
      .map(
        (t) =>
          `- ${t.cmd}\n  code=${t.code}\n  error=${t.error}\n  stderr=${t.stderr}\n  stdout=${t.stdout}`,
      )
      .join('\n')}`,
  };
}

function runChecked(args) {
  const result = runBabysitter(args);
  if (!result.ok) {
    if (!STRICT && String(result.stderr || '').includes('EPERM')) {
      skip(
        'Command execution is blocked by environment permissions. Re-run with --strict in a less restricted shell.',
        result.stderr,
      );
    }
    fail(`Command failed: babysitter ${args.join(' ')}`, `${result.stderr || ''}\n${result.stdout || ''}`);
  }
  return result;
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
    'retrospect',
    'model',
    'issue',
    'help',
    'project-install',
    'team-install',
    'user-install',
    'assimilate',
  ];
  const missing = expected.filter((name) => !fs.existsSync(path.join(base, name, 'SKILL.md')));
  if (missing.length) {
    fail(`Missing skill docs for commands: ${missing.join(', ')}`);
  }
  return expected.length;
}

function createLongRunProcess() {
  ensureDir(PROCESS_DIR);
  ensureDir(ARTIFACTS_DIR);

  const processId = 'diagnostics/full-session-long-run';
  const processPath = path.join(PROCESS_DIR, 'full-session-long-run-process.js');
  const inputsPath = path.join(PROCESS_DIR, 'full-session-long-run-inputs.json');

  const source = `/**
 * @process diagnostics/full-session-long-run
 * @description Long-session scenario with interview breakpoints and artifact generation.
 */
import { defineTask } from '@a5c-ai/babysitter-sdk';

const interviewPrimary = defineTask('interview-primary', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Interview: primary preferences',
  metadata: {
    label: 'interview-primary',
    payload: {
      title: 'Primary Preferences',
      questions: [
        'What background color do you want?',
        'What accent color do you want?',
        'What heading text should appear?',
        'What CTA button label should appear?'
      ],
      question: 'Answer all 4 fields: backgroundColor, accentColor, headingText, ctaLabel',
    },
  },
  io: {
    inputJsonPath: \`tasks/\${taskCtx.effectId}/input.json\`,
    outputJsonPath: \`tasks/\${taskCtx.effectId}/output.json\`,
  },
  labels: ['interview', 'breakpoint'],
}));

const interviewSecondary = defineTask('interview-secondary', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Interview: style preferences',
  metadata: {
    label: 'interview-secondary',
    payload: {
      title: 'Style Preferences',
      question: 'Choose styleVariant and animationStyle',
    },
  },
  io: {
    inputJsonPath: \`tasks/\${taskCtx.effectId}/input.json\`,
    outputJsonPath: \`tasks/\${taskCtx.effectId}/output.json\`,
  },
  labels: ['interview', 'breakpoint'],
}));

const interviewFinal = defineTask('interview-final', (args, taskCtx) => ({
  kind: 'breakpoint',
  title: 'Interview: final approval',
  metadata: {
    label: 'interview-final',
    payload: {
      title: 'Final Approval',
      question: 'Approve this configuration for generation?',
    },
  },
  io: {
    inputJsonPath: \`tasks/\${taskCtx.effectId}/input.json\`,
    outputJsonPath: \`tasks/\${taskCtx.effectId}/output.json\`,
  },
  labels: ['interview', 'breakpoint'],
}));

const workUnit = defineTask('work-unit', (args, taskCtx) => ({
  kind: 'agent',
  title: \`AI work unit \${args.index}\`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Long-session implementation worker',
      task: \`Simulate one AI implementation unit #\${args.index}\`,
      context: { index: args.index, choices: args.choices },
      instructions: ['Return JSON {status:"ok", index:number, minutes:number, summary:string}'],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: \`tasks/\${taskCtx.effectId}/input.json\`,
    outputJsonPath: \`tasks/\${taskCtx.effectId}/output.json\`,
  },
  labels: ['agent', 'work-unit'],
}));

const buildArtifact = defineTask('build-artifact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build simple themed artifact',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI builder',
      task: 'Generate the simple HTML artifact using selected colors and texts',
      context: { choices: args.choices, outputPath: args.outputPath },
      instructions: ['Return JSON containing outputPath and used choices'],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: \`tasks/\${taskCtx.effectId}/input.json\`,
    outputJsonPath: \`tasks/\${taskCtx.effectId}/output.json\`,
  },
  labels: ['agent', 'artifact'],
}));

export async function process(inputs, ctx) {
  const primary = await ctx.task(interviewPrimary, {});
  const secondary = await ctx.task(interviewSecondary, {});
  const finalApproval = await ctx.task(interviewFinal, {});

  if (!finalApproval?.approved) {
    return { completed: false, reason: 'final approval rejected' };
  }

  const workUnits = Number(inputs.workUnits || 30);
  const choices = {
    backgroundColor: primary?.backgroundColor || '#0f172a',
    accentColor: primary?.accentColor || '#22d3ee',
    headingText: primary?.headingText || 'Scenario Heading',
    ctaLabel: primary?.ctaLabel || 'Run',
    styleVariant: secondary?.styleVariant || 'clean',
    animationStyle: secondary?.animationStyle || 'fade',
  };

  let simulatedAiMinutes = 0;
  for (let i = 1; i <= workUnits; i += 1) {
    const result = await ctx.task(workUnit, { index: i, choices });
    simulatedAiMinutes += Number(result?.minutes || 2);
  }

  const artifact = await ctx.task(buildArtifact, {
    choices,
    outputPath: inputs.outputPath || '.a5c/artifacts/full-session-simple-page.html',
  });

  return {
    completed: true,
    workUnits,
    simulatedAiMinutes,
    choices,
    artifact,
  };
}
`;

  fs.writeFileSync(processPath, source, 'utf8');
  writeJson(inputsPath, {
    workUnits: 30,
    outputPath: '.a5c/artifacts/full-session-simple-page.html',
  });

  return { processId, processPath, inputsPath };
}

function main() {
  console.log('[scenario] Starting full long-run scenario...');

  const skillCount = verifySkillLibrary();
  const { processId, processPath, inputsPath } = createLongRunProcess();

  const created = parseJsonish(
    runChecked([
      'run:create',
      '--process-id',
      processId,
      '--entry',
      `${processPath}#process`,
      '--inputs',
      inputsPath,
      '--json',
    ]).stdout,
  );

  const runId = created && (created.runId || created.id);
  if (!runId) fail('run:create did not return runId');

  const choices = {
    backgroundColor: '#123456',
    accentColor: '#ff7a00',
    headingText: 'Babysitter Long Session Test',
    ctaLabel: 'Launch',
    styleVariant: 'clean-card',
    animationStyle: 'fade-in',
  };

  let breakpointCount = 0;
  let breakpointWith4Questions = false;
  const maxIterations = 400;

  for (let i = 1; i <= maxIterations; i += 1) {
    runChecked(['run:iterate', runId, '--json', '--iteration', String(i)]);

    const status = parseJsonish(runChecked(['run:status', runId, '--json']).stdout) || {};
    if (status.state === 'completed' || status.state === 'failed') break;

    const pending = parseJsonish(runChecked(['task:list', runId, '--pending', '--json']).stdout) || {};
    const tasks = Array.isArray(pending.tasks) ? pending.tasks : [];

    for (const task of tasks) {
      if (!task.effectId) continue;

      const effectId = task.effectId;
      const taskDir = path.join(RUNS_DIR, runId, 'tasks', effectId);
      ensureDir(taskDir);
      const outputPath = path.join(taskDir, 'output.json');
      const outRef = `tasks/${effectId}/output.json`;

      let output = { status: 'ok', minutes: 2, summary: `Completed task ${task.taskId || 'unknown'}` };

      if (task.kind === 'breakpoint') {
        breakpointCount += 1;
        try {
          const taskDef = JSON.parse(fs.readFileSync(path.join(taskDir, 'task.json'), 'utf8'));
          const questions = taskDef && taskDef.metadata && taskDef.metadata.payload && taskDef.metadata.payload.questions;
          if (Array.isArray(questions) && questions.length >= 4) {
            breakpointWith4Questions = true;
          }
        } catch (_) {
          // Best-effort.
        }

        if (task.taskId === 'interview-primary') {
          output = {
            approved: true,
            backgroundColor: choices.backgroundColor,
            accentColor: choices.accentColor,
            headingText: choices.headingText,
            ctaLabel: choices.ctaLabel,
          };
        } else if (task.taskId === 'interview-secondary') {
          output = {
            approved: true,
            styleVariant: choices.styleVariant,
            animationStyle: choices.animationStyle,
          };
        } else {
          output = { approved: true, response: 'Approved by full-session-long-run test' };
        }
      } else if (task.taskId === 'build-artifact') {
        const artifactPath = path.join(ARTIFACTS_DIR, 'full-session-simple-page.html');
        const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Babysitter Long Session Test</title>
  <style>
    body { background: ${choices.backgroundColor}; color: white; font-family: Arial, sans-serif; }
    .card { border: 2px solid ${choices.accentColor}; padding: 20px; max-width: 680px; margin: 60px auto; }
    .btn { background: ${choices.accentColor}; color: #111; padding: 10px 16px; display: inline-block; margin-top: 16px; text-decoration: none; }
  </style>
</head>
<body>
  <main class="card">
    <h1>${choices.headingText}</h1>
    <p>styleVariant: ${choices.styleVariant} | animationStyle: ${choices.animationStyle}</p>
    <a class="btn">${choices.ctaLabel}</a>
  </main>
</body>
</html>`;
        fs.writeFileSync(artifactPath, html, 'utf8');
        output = {
          status: 'ok',
          outputPath: '.a5c/artifacts/full-session-simple-page.html',
          usedChoices: choices,
        };
      }

      writeJson(outputPath, output);
      runChecked(['task:post', runId, effectId, '--status', 'ok', '--value', outRef, '--json']);
    }
  }

  const finalStatus = parseJsonish(runChecked(['run:status', runId, '--json']).stdout) || {};
  if (finalStatus.state !== 'completed') {
    fail(`Run did not complete. Final state: ${finalStatus.state || 'unknown'}`);
  }

  const outputFile = path.join(RUNS_DIR, runId, 'state', 'output.json');
  if (!fs.existsSync(outputFile)) fail(`Missing output.json: ${outputFile}`);
  const stateOutput = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  const artifactFile = path.join(ARTIFACTS_DIR, 'full-session-simple-page.html');
  if (!fs.existsSync(artifactFile)) fail(`Missing artifact file: ${artifactFile}`);
  const artifactText = fs.readFileSync(artifactFile, 'utf8');

  let score = 0;
  const details = [];

  if (finalStatus.state === 'completed') {
    score += 20;
    details.push('20/20 run completed');
  } else {
    details.push('0/20 run completion');
  }

  if (breakpointCount >= 3 && breakpointWith4Questions) {
    score += 20;
    details.push('20/20 breakpoint requirements met');
  } else {
    details.push(`0/20 breakpoints (count=${breakpointCount}, fourQuestions=${breakpointWith4Questions})`);
  }

  const choicesApplied =
    artifactText.includes(choices.backgroundColor) &&
    artifactText.includes(choices.accentColor) &&
    artifactText.includes(choices.headingText) &&
    artifactText.includes(choices.ctaLabel);
  if (choicesApplied) {
    score += 20;
    details.push('20/20 choices applied to artifact');
  } else {
    details.push('0/20 choices not fully reflected');
  }

  const simMinutes =
    Number(stateOutput.simulatedAiMinutes) ||
    Number(stateOutput.value && stateOutput.value.simulatedAiMinutes) ||
    0;
  if (simMinutes >= 60) {
    score += 20;
    details.push(`20/20 long-session target met (${simMinutes} minutes)`);
  } else {
    details.push(`0/20 long-session target failed (${simMinutes} minutes)`);
  }

  if (skillCount === 15 && fs.existsSync(path.join(PROCESS_DIR, 'full-session-long-run-process.js'))) {
    score += 20;
    details.push('20/20 process+skill library checks passed');
  } else {
    details.push('0/20 process+skill library checks failed');
  }

  console.log(`[scenario] Score: ${score}/100`);
  for (const d of details) console.log(` - ${d}`);

  if (score < 100) {
    fail('Scenario score below 100');
  }

  const summary = {
    ok: true,
    score,
    runId,
    simulatedAiMinutes: simMinutes,
    breakpoints: breakpointCount,
    breakpointWith4Questions,
    artifactFile,
    sdkPackage: SDK_PACKAGE,
  };

  console.log('[scenario] PASS');
  console.log(JSON.stringify(summary, null, 2));
}

main();
