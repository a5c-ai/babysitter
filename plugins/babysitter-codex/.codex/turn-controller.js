#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { runJson, supports } = require('./sdk-cli');
const { findSession, registerSession, updateSessionMetadata } = require('./state-index');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function a5cDir(repoRoot) {
  return path.join(repoRoot, '.a5c');
}

function currentRunPath(repoRoot) {
  return path.join(a5cDir(repoRoot), 'current-run.json');
}

function turnStatePath(repoRoot) {
  return path.join(a5cDir(repoRoot), 'turn-state', 'current.json');
}

function currentRun(repoRoot) {
  return readJsonIfExists(currentRunPath(repoRoot)) || {};
}

function writeCurrentRun(repoRoot, patch) {
  const existing = currentRun(repoRoot);
  const next = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeJson(currentRunPath(repoRoot), next);
  return next;
}

function writeTurnState(repoRoot, state) {
  writeJson(turnStatePath(repoRoot), {
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

function resolveExplicitSessionId(options = {}) {
  return (
    options.sessionId ||
    process.env.BABYSITTER_SESSION_ID ||
    process.env.CODEX_THREAD_ID ||
    process.env.CODEX_SESSION_ID ||
    null
  );
}

function normalizeRunId(runId) {
  return typeof runId === 'string' && /^[A-Za-z0-9-]+$/.test(runId) ? runId : null;
}

function runDirFor(repoRoot, runId) {
  return path.join(a5cDir(repoRoot), 'runs', runId);
}

function existingRunIds(repoRoot) {
  const runsDir = path.join(a5cDir(repoRoot), 'runs');
  if (!fs.existsSync(runsDir)) return [];
  return fs.readdirSync(runsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => normalizeRunId(name));
}

function resolveRunHandle(repoRoot, selector) {
  const token = String(selector || '').trim();
  const current = currentRun(repoRoot);
  const normalizedToken = token.toLowerCase();

  if (!token || normalizedToken === 'current' || normalizedToken === 'latest') {
    if (current.runId && current.runDir) {
      return { runId: current.runId, runDir: current.runDir, source: 'current-run' };
    }
    const recent = existingRunIds(repoRoot)
      .map((runId) => ({ runId, runDir: runDirFor(repoRoot, runId) }))
      .sort((a, b) => fs.statSync(b.runDir).mtimeMs - fs.statSync(a.runDir).mtimeMs)[0];
    return recent ? { ...recent, source: 'recent-run-dir' } : null;
  }

  if (fs.existsSync(token) && path.basename(path.dirname(token)) === 'runs') {
    return { runId: path.basename(token), runDir: token, source: 'run-dir' };
  }

  const directRunId = normalizeRunId(token);
  if (directRunId) {
    const directRunDir = runDirFor(repoRoot, directRunId);
    if (fs.existsSync(directRunDir)) {
      return { runId: directRunId, runDir: directRunDir, source: 'run-id' };
    }
  }

  const indexed = findSession(repoRoot, token);
  if (indexed && indexed.lastRunId) {
    return {
      runId: indexed.lastRunId,
      runDir: runDirFor(repoRoot, indexed.lastRunId),
      source: 'session-index',
      sessionId: indexed.sessionId,
    };
  }

  return null;
}

function runBabysitterJson(args, options = {}) {
  const res = runJson(args, options);
  if (!res.ok) {
    throw new Error(res.stderr || res.stdout || `babysitter ${args.join(' ')} failed`);
  }
  return res.parsed || {};
}

function getRunStatus(runDir) {
  return runBabysitterJson(['run:status', runDir, '--json']);
}

function listPendingTasks(runDir) {
  const result = runBabysitterJson(['task:list', runDir, '--pending', '--json']);
  return Array.isArray(result.tasks) ? result.tasks : [];
}

function taskArtifacts(runDir, effectId) {
  const taskDir = path.join(runDir, 'tasks', effectId);
  return {
    taskDir,
    inputFile: path.join(taskDir, 'input.json'),
    outputFile: path.join(taskDir, 'output.json'),
    errorFile: path.join(taskDir, 'error.json'),
    outputRef: `tasks/${effectId}/output.json`,
    errorRef: `tasks/${effectId}/error.json`,
  };
}

function summarizeTask(runDir, task) {
  const effectId = task.effectId || task.id || task.taskId || null;
  const kind = task.kind || 'agent';
  const artifacts = effectId ? taskArtifacts(runDir, effectId) : null;
  const breakpoint = task.breakpoint || (task.metadata && task.metadata.payload) || {};
  const agent = task.agent || {};
  const shell = task.shell || {};
  const node = task.node || {};
  const skill = task.skill || {};

  return {
    effectId,
    taskId: task.taskId || null,
    title: task.title || null,
    kind,
    labels: Array.isArray(task.labels) ? task.labels : [],
    metadata: task.metadata || null,
    inputFile: artifacts ? artifacts.inputFile : null,
    outputFile: artifacts ? artifacts.outputFile : null,
    errorFile: artifacts ? artifacts.errorFile : null,
    outputRef: artifacts ? artifacts.outputRef : null,
    errorRef: artifacts ? artifacts.errorRef : null,
    breakpoint: kind === 'breakpoint' ? {
      title: breakpoint.title || task.title || null,
      question: breakpoint.question || task.question || null,
      questions: Array.isArray(breakpoint.questions) ? breakpoint.questions : [],
    } : null,
    execution: {
      agentName: agent.name || null,
      prompt: agent.prompt || task.prompt || null,
      shellCommand: shell.command || task.command || null,
      nodeScript: node.script || task.script || null,
      skillName: skill.name || null,
    },
  };
}

function buildAction(runId, runDir, status, tasks) {
  const state = status.state || status.status || null;
  if (state === 'completed' || state === 'done' || state === 'finished') {
    return { action: 'run_completed', runId, runDir, status, tasks: [] };
  }
  if (state === 'failed' || state === 'error' || state === 'cancelled') {
    return { action: 'run_failed', runId, runDir, status, tasks: [] };
  }

  const summaries = tasks.map((task) => summarizeTask(runDir, task));
  if (summaries.length === 0) {
    return { action: 'idle', runId, runDir, status, tasks: [] };
  }
  if (summaries.some((task) => task.kind === 'breakpoint')) {
    return { action: 'yield_to_user', runId, runDir, status, tasks: summaries };
  }
  return { action: 'execute_tasks', runId, runDir, status, tasks: summaries };
}

function nextIterationNumber(pointer, explicitIteration) {
  if (explicitIteration !== null && explicitIteration !== undefined) {
    return Number(explicitIteration);
  }
  const current = Number(pointer.iteration || 0);
  return current + 1;
}

function postBreakpointApproval(runDir, effectId, payload) {
  const artifacts = taskArtifacts(runDir, effectId);
  writeJson(artifacts.outputFile, payload);
  return runBabysitterJson([
    'task:post',
    runDir,
    effectId,
    '--status',
    'ok',
    '--value',
    artifacts.outputRef,
    '--json',
  ]);
}

function maybeAutoApproveBreakpoints(runDir, tasks, options = {}) {
  if (!options.autoApprove) return false;
  const breakpoints = tasks.filter((task) => (task.kind || 'agent') === 'breakpoint');
  if (breakpoints.length === 0) return false;
  for (const task of breakpoints) {
    const effectId = task.effectId || task.id || task.taskId;
    if (!effectId) continue;
    postBreakpointApproval(runDir, effectId, {
      approved: true,
      response: options.response || 'Auto-approved by turn-controller',
      completedAt: new Date().toISOString(),
    });
  }
  return true;
}

function parseArgs(argv) {
  const parsed = {
    command: argv[2] || 'status',
    selector: '',
    processId: null,
    entry: null,
    inputs: null,
    prompt: null,
    sessionId: null,
    iteration: null,
    effectId: null,
    valueFile: null,
    errorFile: null,
    response: null,
    approved: true,
    answersFile: null,
    autoApprove: false,
  };

  const positionals = [];
  for (let i = 3; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--selector':
        parsed.selector = argv[++i] || '';
        break;
      case '--process-id':
        parsed.processId = argv[++i] || null;
        break;
      case '--entry':
        parsed.entry = argv[++i] || null;
        break;
      case '--inputs':
        parsed.inputs = argv[++i] || null;
        break;
      case '--prompt':
        parsed.prompt = argv[++i] || null;
        break;
      case '--session-id':
        parsed.sessionId = argv[++i] || null;
        break;
      case '--iteration':
        parsed.iteration = Number(argv[++i] || '0');
        break;
      case '--effect-id':
        parsed.effectId = argv[++i] || null;
        break;
      case '--value-file':
        parsed.valueFile = argv[++i] || null;
        break;
      case '--error-file':
        parsed.errorFile = argv[++i] || null;
        break;
      case '--answers-file':
        parsed.answersFile = argv[++i] || null;
        break;
      case '--response':
        parsed.response = argv[++i] || null;
        break;
      case '--approved':
        parsed.approved = String(argv[++i] || 'true').toLowerCase() !== 'false';
        break;
      case '--auto-approve':
        parsed.autoApprove = true;
        break;
      default:
        if (!token.startsWith('--')) positionals.push(token);
        break;
    }
  }

  if (!parsed.selector && positionals.length > 0) {
    parsed.selector = positionals[0];
  }

  return parsed;
}

function startRun(repoRoot, options) {
  const args = ['run:create', '--json'];
  if (options.processId) args.push('--process-id', options.processId);
  if (options.entry) args.push('--entry', options.entry);
  if (options.inputs) args.push('--inputs', options.inputs);
  if (options.prompt) args.push('--prompt', options.prompt);
  const sessionId = resolveExplicitSessionId(options);
  if (sessionId) {
    args.push('--harness', 'codex', '--session-id', sessionId, '--state-dir', '.a5c');
  }

  const created = runBabysitterJson(args);
  const runId = created.runId || created.id;
  const runDir = created.runDir || runDirFor(repoRoot, runId);
  const pointer = writeCurrentRun(repoRoot, {
    runId,
    runDir,
    iteration: 0,
    sessionId,
    state: 'created',
  });
  if (sessionId) {
    registerSession(repoRoot, {
      sessionId,
      runId,
    });
  }
  const result = { action: 'run_created', runId, runDir, sessionId, pointer };
  writeTurnState(repoRoot, result);
  return result;
}

function continueRun(repoRoot, options) {
  const handle = resolveRunHandle(repoRoot, options.selector);
  if (!handle) {
    throw new Error(`Could not resolve run from selector "${options.selector || 'current'}"`);
  }

  let pointer = writeCurrentRun(repoRoot, {
    runId: handle.runId,
    runDir: handle.runDir,
    sessionId: handle.sessionId || currentRun(repoRoot).sessionId || null,
  });
  if (pointer.sessionId) {
    updateSessionMetadata(repoRoot, pointer.sessionId, { runId: handle.runId });
  }

  let status = getRunStatus(handle.runDir);
  let tasks = listPendingTasks(handle.runDir);

  if (tasks.length === 0 && status.state !== 'completed' && status.state !== 'failed') {
    const iteration = nextIterationNumber(pointer, options.iteration);
    const iterate = runBabysitterJson(['run:iterate', handle.runDir, '--json', '--iteration', String(iteration)]);
    status = getRunStatus(handle.runDir);
    tasks = listPendingTasks(handle.runDir);
    pointer = writeCurrentRun(repoRoot, {
      ...pointer,
      iteration,
      lastIterateResult: iterate,
      state: status.state || status.status || null,
    });
  }

  if (maybeAutoApproveBreakpoints(handle.runDir, tasks, options)) {
    status = getRunStatus(handle.runDir);
    tasks = listPendingTasks(handle.runDir);
  }

  const action = buildAction(handle.runId, handle.runDir, status, tasks);
  writeCurrentRun(repoRoot, {
    runId: handle.runId,
    runDir: handle.runDir,
    state: action.status.state || action.status.status || null,
    pendingEffectIds: action.tasks.map((task) => task.effectId).filter(Boolean),
    lastAction: action.action,
  });
  writeTurnState(repoRoot, action);
  return action;
}

function postAgentResult(repoRoot, options) {
  const handle = resolveRunHandle(repoRoot, options.selector);
  if (!handle) {
    throw new Error('Could not resolve current run for post command.');
  }
  if (!options.effectId) {
    throw new Error('--effect-id is required');
  }
  if (!options.valueFile && !options.errorFile) {
    throw new Error('Provide --value-file or --error-file');
  }

  const args = ['task:post', handle.runDir, options.effectId];
  if (options.errorFile) {
    args.push('--status', 'error', '--error', options.errorFile, '--json');
  } else {
    args.push('--status', 'ok', '--value', options.valueFile, '--json');
  }
  const posted = runBabysitterJson(args);
  const result = {
    action: 'task_posted',
    runId: handle.runId,
    runDir: handle.runDir,
    effectId: options.effectId,
    posted,
  };
  writeTurnState(repoRoot, result);
  return result;
}

function approveBreakpoint(repoRoot, options) {
  const handle = resolveRunHandle(repoRoot, options.selector);
  if (!handle) {
    throw new Error('Could not resolve current run for approve command.');
  }
  if (!options.effectId) {
    throw new Error('--effect-id is required');
  }

  const answers = options.answersFile ? (readJsonIfExists(options.answersFile) || {}) : {};
  const payload = {
    approved: options.approved,
    response: options.response || null,
    answers,
    completedAt: new Date().toISOString(),
  };
  const posted = postBreakpointApproval(handle.runDir, options.effectId, payload);
  const result = {
    action: 'breakpoint_posted',
    runId: handle.runId,
    runDir: handle.runDir,
    effectId: options.effectId,
    payload,
    posted,
  };
  writeTurnState(repoRoot, result);
  return result;
}

function statusRun(repoRoot, options) {
  const handle = resolveRunHandle(repoRoot, options.selector);
  if (!handle) {
    return { action: 'no_run', runId: null, runDir: null, status: null, tasks: [] };
  }
  const status = getRunStatus(handle.runDir);
  const tasks = listPendingTasks(handle.runDir);
  const result = buildAction(handle.runId, handle.runDir, status, tasks);
  writeTurnState(repoRoot, result);
  return result;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const repoRoot = process.cwd();
  const args = parseArgs(process.argv);

  if (!supports('run:create') || !supports('run:iterate') || !supports('task:list') || !supports('task:post')) {
    throw new Error('Babysitter SDK core commands are not available in this environment.');
  }

  let result;
  switch (args.command) {
    case 'start':
      result = startRun(repoRoot, args);
      break;
    case 'continue':
      result = continueRun(repoRoot, args);
      break;
    case 'post':
      result = postAgentResult(repoRoot, args);
      break;
    case 'approve':
      result = approveBreakpoint(repoRoot, args);
      break;
    case 'status':
      result = statusRun(repoRoot, args);
      break;
    default:
      throw new Error(`Unknown command "${args.command}". Use start|continue|post|approve|status.`);
  }

  printJson(result);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[turn-controller] ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  main,
  currentRun,
  writeCurrentRun,
  writeTurnState,
  resolveExplicitSessionId,
  resolveRunHandle,
  summarizeTask,
  buildAction,
  nextIterationNumber,
};
