#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = process.env.HOME || '/home/codex';
const WORKSPACE = '/workspace/codex-full-run';
const CODEX_HOME = process.env.CODEX_HOME || path.join(HOME, '.codex');
const SKILL_DIR = path.join(CODEX_HOME, 'skills', 'babysitter-codex');
const ORCHESTRATE = path.join(SKILL_DIR, '.codex', 'orchestrate.js');
const HOOK_SCRIPT = path.join(SKILL_DIR, '.codex', 'hooks', 'on-turn-complete.js');
const PROCESS_PATH = path.join(WORKSPACE, 'ci-codex-process.js');
const AGENTS_PATH = path.join(WORKSPACE, 'AGENTS.md');
const CONFIG_PATH = path.join(WORKSPACE, '.codex', 'config.toml');
const CURRENT_RUN_PATH = path.join(WORKSPACE, '.a5c', 'current-run.json');
const ALPHA_PATH = path.join(WORKSPACE, 'codex-artifacts', 'alpha.txt');
const REPORT_PATH = path.join(WORKSPACE, 'codex-artifacts', 'final-report.json');
const BREAKPOINT_INPUT = 'ci-release-token\nContinue after approval.\ny\n';

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, contents) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, contents, 'utf8');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  });
}

function runChecked(cmd, args, options = {}) {
  const result = run(cmd, args, options);
  if (result.status !== 0) {
    fail(`${cmd} ${args.join(' ')} failed`, {
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }
  return result;
}

function workspaceConfig() {
  return [
    'approval_policy = "never"',
    'sandbox_mode = "workspace-write"',
    `notify = ["node", "${HOOK_SCRIPT.replace(/\\/g, '/')}"]`,
    '',
    '[sandbox_workspace_write]',
    'writable_roots = [".", ".a5c", ".codex"]',
    '',
  ].join('\n');
}

function workspaceAgents() {
  return [
    '# CI instructions',
    '',
    '- Follow the task exactly.',
    '- When asked to create or update a file, do it in the current workspace.',
    '- Keep responses plain text with no markdown unless asked.',
    '',
  ].join('\n');
}

function processSource() {
  return `const createAlphaArtifact = {
  id: 'create-alpha-artifact',
  async build(args) {
    return {
      kind: 'agent',
      title: 'Create alpha artifact',
      agent: {
        role: 'CI filesystem validation agent',
        task: 'Create codex-artifacts/alpha.txt in the current workspace.',
        context: {
          requiredContents: args.contents,
          requiredPath: 'codex-artifacts/alpha.txt',
        },
        instructions: [
          'Create the file if it does not exist.',
          'Write exactly the required contents followed by a trailing newline.',
          'Respond with exactly "created:codex-artifacts/alpha.txt".',
          'Do not wrap the response in markdown.'
        ],
        outputFormat: 'plain text'
      },
      metadata: {
        stage: 'alpha'
      }
    };
  }
};

const approvalGate = {
  id: 'approval-gate',
  async build() {
    return {
      kind: 'breakpoint',
      title: 'Approval gate',
      breakpoint: {
        question: 'Approval required for Codex E2E continuation',
        questions: ['Release token']
      },
      metadata: {
        stage: 'gate'
      }
    };
  }
};

const createFinalReport = {
  id: 'create-final-report',
  async build(args) {
    return {
      kind: 'agent',
      title: 'Create final report',
      agent: {
        role: 'CI integration validation agent',
        task: 'Read codex-artifacts/alpha.txt and create codex-artifacts/final-report.json in the current workspace.',
        context: {
          alphaPath: 'codex-artifacts/alpha.txt',
          reportPath: 'codex-artifacts/final-report.json',
          expectedAlpha: args.expectedAlpha,
          releaseToken: args.releaseToken,
          gateApproved: args.gateApproved
        },
        instructions: [
          'Read the existing alpha artifact.',
          'Write a JSON object with keys alpha, gateApproved, releaseToken, and validatedAt.',
          'Set alpha to the trimmed contents of codex-artifacts/alpha.txt.',
          'Set gateApproved to the provided boolean value.',
          'Set releaseToken to the provided release token.',
          'Respond with exactly "created:codex-artifacts/final-report.json".',
          'Do not wrap the response in markdown.'
        ],
        outputFormat: 'plain text'
      },
      metadata: {
        stage: 'report'
      }
    };
  }
};

export async function process(_inputs, ctx) {
  const alpha = await ctx.task(createAlphaArtifact, { contents: 'alpha-run-ok' });
  const gate = await ctx.task(approvalGate, {});
  const report = await ctx.task(createFinalReport, {
    expectedAlpha: 'alpha-run-ok',
    releaseToken: gate?.answers?.releaseToken || '',
    gateApproved: Boolean(gate?.approved)
  });

  return {
    completed: true,
    alpha,
    gateApproved: Boolean(gate?.approved),
    releaseToken: gate?.answers?.releaseToken || '',
    report
  };
}
`;
}

function parseRunId(stdout) {
  const currentRun = fs.existsSync(CURRENT_RUN_PATH) ? readJson(CURRENT_RUN_PATH) : null;
  if (currentRun && currentRun.runId) return currentRun.runId;
  const match = String(stdout || '').match(/Run ID:\s+([A-Za-z0-9-]+)/);
  return match ? match[1] : null;
}

function collectTaskSummaries(runDir) {
  const tasksDir = path.join(runDir, 'tasks');
  if (!fs.existsSync(tasksDir)) return [];
  return fs.readdirSync(tasksDir).sort().map((effectId) => {
    const taskDir = path.join(tasksDir, effectId);
    const taskDef = fs.existsSync(path.join(taskDir, 'task.json'))
      ? readJson(path.join(taskDir, 'task.json'))
      : {};
    const output = fs.existsSync(path.join(taskDir, 'output.json'))
      ? readJson(path.join(taskDir, 'output.json'))
      : null;
    return {
      effectId,
      kind: taskDef.kind || (taskDef.effect && taskDef.effect.kind) || null,
      title: taskDef.title || (taskDef.effect && taskDef.effect.title) || null,
      output,
    };
  });
}

function main() {
  if (!process.env.OPENAI_API_KEY) {
    fail('OPENAI_API_KEY is required for the Codex Docker E2E test');
  }
  if (!fs.existsSync(ORCHESTRATE)) {
    fail('Installed babysitter-codex skill is missing orchestrate.js', { orchestrate: ORCHESTRATE });
  }

  fs.rmSync(WORKSPACE, { recursive: true, force: true });
  ensureDir(WORKSPACE);
  ensureDir(path.dirname(CONFIG_PATH));
  writeFile(CONFIG_PATH, workspaceConfig());
  writeFile(AGENTS_PATH, workspaceAgents());
  writeFile(PROCESS_PATH, processSource());

  runChecked('git', ['init', '-q'], { cwd: WORKSPACE });
  runChecked('git', ['config', 'user.email', 'ci@example.com'], { cwd: WORKSPACE });
  runChecked('git', ['config', 'user.name', 'CI'], { cwd: WORKSPACE });

  const orchestrate = run('node', [
    ORCHESTRATE,
    '--process-id', 'ci/codex-full-run',
    '--entry', `${PROCESS_PATH}#process`,
    '--max-iterations', '12',
  ], {
    cwd: WORKSPACE,
    env: {
      ...process.env,
      CODEX_HOME,
      REPO_ROOT: WORKSPACE,
      BABYSITTER_NOTIFY_SINKS: 'file',
      BABYSITTER_NOTIFY_DESKTOP: '0',
    },
    input: BREAKPOINT_INPUT,
    timeout: 900_000,
  });

  if (orchestrate.status !== 0) {
    fail('orchestrate.js exited with a non-zero code', {
      exitCode: orchestrate.status,
      stdout: orchestrate.stdout,
      stderr: orchestrate.stderr,
    });
  }

  const runId = parseRunId(orchestrate.stdout);
  if (!runId) {
    fail('Could not resolve runId from orchestration output', {
      stdout: orchestrate.stdout,
      stderr: orchestrate.stderr,
      currentRunPath: CURRENT_RUN_PATH,
    });
  }

  const runDir = path.join(WORKSPACE, '.a5c', 'runs', runId);
  const statusResult = runChecked('babysitter', ['run:status', runDir, '--json'], { cwd: WORKSPACE });
  const status = JSON.parse(statusResult.stdout);

  if (status.state !== 'completed') {
    fail('Babysitter run did not complete', { status, stdout: orchestrate.stdout, stderr: orchestrate.stderr });
  }
  if (!fs.existsSync(ALPHA_PATH)) {
    fail('Codex did not create the alpha artifact', { alphaPath: ALPHA_PATH });
  }
  if (!fs.existsSync(REPORT_PATH)) {
    fail('Codex did not create the final report artifact', { reportPath: REPORT_PATH });
  }

  const alphaContents = fs.readFileSync(ALPHA_PATH, 'utf8').trim();
  const report = readJson(REPORT_PATH);
  const outputPath = path.join(runDir, 'state', 'output.json');
  const output = fs.existsSync(outputPath) ? readJson(outputPath) : null;
  const hookLogPath = path.join(runDir, 'logs', 'turns.jsonl');
  const notificationPath = path.join(WORKSPACE, '.a5c', 'events', 'notifications.jsonl');
  const taskSummaries = collectTaskSummaries(runDir);
  const breakpointTask = taskSummaries.find((task) => task.kind === 'breakpoint');

  if (alphaContents !== 'alpha-run-ok') {
    fail('Alpha artifact contents were not preserved', { alphaContents });
  }
  if (report.alpha !== 'alpha-run-ok' || report.gateApproved !== true || report.releaseToken !== 'ci-release-token') {
    fail('Final report did not contain the expected integrated values', { report });
  }
  if (!output || output.completed !== true || output.gateApproved !== true || output.releaseToken !== 'ci-release-token') {
    fail('Run output.json did not record the completed full-run state', { output, outputPath });
  }
  if (!breakpointTask || !breakpointTask.output || breakpointTask.output.approved !== true) {
    fail('Breakpoint task did not capture an approval result', { breakpointTask, taskSummaries });
  }
  if (!breakpointTask.output.answers || breakpointTask.output.answers.releaseToken !== 'ci-release-token') {
    fail('Breakpoint task did not capture the release token answer', { breakpointTask });
  }
  if (!fs.existsSync(hookLogPath)) {
    fail('Codex notify hook did not emit a turn log', { hookLogPath, stdout: orchestrate.stdout, stderr: orchestrate.stderr });
  }

  const hookLines = fs.readFileSync(hookLogPath, 'utf8').trim().split('\n').filter(Boolean);
  if (hookLines.length === 0) {
    fail('Codex notify hook log was empty', { hookLogPath });
  }

  console.log(JSON.stringify({
    ok: true,
    runId,
    runDir,
    installedSkillDir: SKILL_DIR,
    orchestratePath: ORCHESTRATE,
    alphaPath: ALPHA_PATH,
    reportPath: REPORT_PATH,
    alphaContents,
    report,
    finalStatus: status.state,
    output,
    breakpointTask,
    hookLogPath,
    hookLogEntries: hookLines.length,
    notificationPath,
    taskCount: taskSummaries.length,
    tasks: taskSummaries.map((task) => ({
      effectId: task.effectId,
      kind: task.kind,
      title: task.title,
    })),
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    message: error.message,
    details: error.details || null,
    tmpdir: os.tmpdir(),
  }, null, 2));
  process.exit(1);
}
