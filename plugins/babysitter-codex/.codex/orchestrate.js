#!/usr/bin/env node
'use strict';

/**
 * orchestrate.js — Main Node.js wrapper script for babysitter orchestration with Codex CLI.
 *
 * Usage:
 *   node .codex/orchestrate.js \
 *     [--runs-dir <path>]         default: .a5c/runs
 *     [--max-iterations <n>]      default: 10
 *     [--process-id <id>]
 *     [--entry <entry>]
 *     [--prompt <prompt>]
 *     [--plugin-root <path>]
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { mapEffectToCodexPrompt, parseCodexOutput, mapCodexError, buildCodexArgs } = require('./effect-mapper.js');
const { postTaskResult, postTaskError } = require('./result-poster.js');
const { runAllGuards } = require('./iteration-guard.js');
const { fireHook } = require('./hook-dispatcher');
const { readUserProfile, readProjectProfile } = require('./profile-manager');
const { discoverSkills } = require('./discovery');
const { initSession, associateSession } = require('./session-manager');
const { runStartupHealthGate } = require('./health-check');
const { runJson, supports, getCompatibilityReport } = require('./sdk-cli');
const { appendTrace, resolveTracePath } = require('./trace-logger');

// ---------------------------------------------------------------------------
// 1. Parse CLI arguments
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    runsDir:       '.a5c/runs',
    maxIterations: 10,
    processId:     null,
    entry:         null,
    prompt:        null,
    pluginRoot:    null,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--runs-dir':
        args.runsDir = argv[++i];
        break;
      case '--max-iterations':
        args.maxIterations = parseInt(argv[++i], 10);
        break;
      case '--process-id':
        args.processId = argv[++i];
        break;
      case '--entry':
        args.entry = argv[++i];
        break;
      case '--prompt':
        args.prompt = argv[++i];
        break;
      case '--plugin-root':
        args.pluginRoot = argv[++i];
        break;
      default:
        console.warn(`[orchestrate] Unknown argument: ${argv[i]}`);
    }
  }

  return args;
}

// ---------------------------------------------------------------------------
// Helper: run babysitter SDK command and return parsed JSON output
// ---------------------------------------------------------------------------

function babysitter(subArgs, opts = {}) {
  const res = runJson(subArgs, opts);
  if (!res.ok) {
    const msg = res.stderr || res.stdout || `babysitter command failed: ${subArgs.join(' ')}`;
    throw new Error(msg);
  }
  return res.parsed || {};
}

// ---------------------------------------------------------------------------
// Helper: run a single codex exec call for an agent task
// ---------------------------------------------------------------------------

function runCodexExec(agentPrompt, workdir, taskDef) {
  console.log(`[orchestrate] Running codex exec --full-auto …`);

  const codexArgs = buildCodexArgs(taskDef || {}, { fullAuto: true, workdir });
  const execArgs = ['exec', ...codexArgs, agentPrompt];

  const result = spawnSync(
    'codex',
    execArgs,
    {
      cwd:      workdir || process.cwd(),
      encoding: 'utf8',
      stdio:    ['pipe', 'pipe', 'pipe'],
      env:      { ...process.env },
    }
  );

  const stdout = (result.stdout || '').toString();
  const stderr = (result.stderr || '').toString();

  if (result.error) {
    console.error(`[orchestrate] codex exec spawn error: ${result.error.message}`);
    return { success: false, error: result.error.message, stdout, stderr, exitCode: -1 };
  }

  if (result.status !== 0) {
    console.warn(`[orchestrate] codex exec exited with code ${result.status}`);
    console.warn(`[orchestrate] stderr: ${stderr.slice(0, 500)}`);
  }

  // Attempt to parse JSONL / JSON from codex output
  let parsedOutput = null;
  const lines = stdout.split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj && (obj.result !== undefined || obj.output !== undefined || obj.success !== undefined)) {
        parsedOutput = obj;
        break;
      }
    } catch (_) {
      // not JSON, skip
    }
  }

  return {
    success:  result.status === 0,
    exitCode: result.status,
    stdout,
    stderr,
    parsed:   parsedOutput,
  };
}

// ---------------------------------------------------------------------------
// Helper: wait for stdin input (breakpoint tasks)
// ---------------------------------------------------------------------------

async function waitForStdinInput(question) {
  const readline = require('readline');
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ---------------------------------------------------------------------------
// PID-based run lock
// ---------------------------------------------------------------------------

let lockFile = null;

function acquireLock() {
  // Check for stale lock from a crashed process
  if (lockFile && fs.existsSync(lockFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      let isAlive = false;
      try { process.kill(existing.pid, 0); isAlive = true; } catch { /* process not running */ }
      if (isAlive) {
        console.error(`[orchestrate] Run is locked by PID ${existing.pid} (acquired at ${existing.acquiredAt}). Aborting.`);
        process.exit(1);
      }
      console.warn(`[orchestrate] Stale lock detected from PID ${existing.pid}. Overwriting.`);
    } catch { /* corrupt lock file, safe to overwrite */ }
  }
  const lockData = JSON.stringify({ pid: process.pid, owner: 'orchestrate.js', acquiredAt: new Date().toISOString() });
  fs.writeFileSync(lockFile, lockData);
}

function releaseLock() {
  try { if (lockFile) fs.unlinkSync(lockFile); } catch {}
}

// ---------------------------------------------------------------------------
// Main orchestration loop
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  console.log('[orchestrate] Starting babysitter orchestration');
  console.log('[orchestrate] Config:', JSON.stringify(args, null, 2));

  const projectDir = process.cwd();
  const repoRoot   = projectDir;
  const stateDir = path.join(args.pluginRoot || repoRoot, '.a5c');

  // Run startup health gate before anything else
  if (!runStartupHealthGate(true)) { process.exit(1); }

  const compat = getCompatibilityReport();
  console.log(`[orchestrate] SDK compatibility mode: ${compat.mode}`);
  if (compat.missingCore.length > 0) {
    console.error(`[orchestrate] Missing required core commands: ${compat.missingCore.join(', ')}`);
    process.exit(1);
  }
  if (compat.missingAdvanced.length > 0) {
    console.log(`[orchestrate] Missing advanced commands (compat-core): ${compat.missingAdvanced.join(', ')}`);
  }

  // Read user and project profiles
  const userProfile    = readUserProfile();
  const projectProfile = readProjectProfile(repoRoot);

  // Resolve runs directory (may be relative to projectDir)
  const runsDir = path.isAbsolute(args.runsDir)
    ? args.runsDir
    : path.join(projectDir, args.runsDir);

  fs.mkdirSync(runsDir, { recursive: true });

  // -------------------------------------------------------------------------
  // 2. session:init — obtain session ID
  // -------------------------------------------------------------------------

  console.log('\n[orchestrate] === session:init ===');
  let sessionData = {};
  if (supports('session:init')) {
    try {
      sessionData = initSession({
        sessionId: process.env.CODEX_SESSION_ID || `codex-${Date.now()}`,
        stateDir,
      }) || {};
    } catch (e) {
      console.warn(`[orchestrate] session:init failed, continuing in compat mode: ${e.message}`);
      sessionData = {};
    }
  } else {
    console.log('[orchestrate] session:init not supported by SDK; continuing in compat mode.');
  }
  const sessionId = sessionData.sessionId || sessionData.id || null;
  console.log(`[orchestrate] Session ID: ${sessionId}`);

  // -------------------------------------------------------------------------
  // 3. run:create — start a run
  // -------------------------------------------------------------------------

  console.log('\n[orchestrate] === run:create ===');
  const runCreateArgs = ['run:create', '--json'];
  if (args.processId) runCreateArgs.push('--process-id', args.processId);
  if (args.entry)     runCreateArgs.push('--entry',      args.entry);
  if (args.prompt)    runCreateArgs.push('--prompt',     args.prompt);

  let runData;
  try {
    runData = babysitter(runCreateArgs);
  } catch (_) {
    runData = {};
  }

  const runId  = runData.runId  || runData.id  || null;
  const runDir = runData.runDir || (runId ? path.join(runsDir, runId) : null);

  console.log(`[orchestrate] Run ID:  ${runId}`);
  console.log(`[orchestrate] Run Dir: ${runDir}`);

  if (!runDir) {
    console.warn('[orchestrate] No runDir returned by run:create; orchestration cannot continue without a run directory.');
    console.warn('[orchestrate] Exiting.');
    process.exit(1);
  }

  console.log(`[orchestrate] Trace log: ${resolveTracePath(runDir)}`);
  appendTrace(runDir, {
    type: 'run.start',
    runId,
    processId: args.processId,
    compatibilityMode: compat.mode,
    missingAdvanced: compat.missingAdvanced,
  });

  // Associate session with this run
  if (supports('session:associate')) {
    try {
      associateSession(runId, { sessionId, stateDir, repoRoot });
    } catch (e) {
      console.warn('[orchestrate] session:associate failed:', e.message);
    }
  }

  // Discover available skills
  const discovered = discoverSkills({ pluginRoot: args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT || path.join(repoRoot, '.codex') });

  // Fire on-run-start hook
  fireHook('on-run-start', { runId, processId: args.processId });

  // -------------------------------------------------------------------------
  // 4. Main iteration loop
  // -------------------------------------------------------------------------

  let iteration       = 0;
  let completionProof = null;
  let finalStatus     = 'running';

  // Set up and acquire PID-based run lock (inside try so releaseLock runs in finally)
  lockFile = path.join(runDir, 'run.lock');

  try {
  acquireLock();

  while (iteration < args.maxIterations) {
    iteration++;
    console.log(`\n[orchestrate] === Iteration ${iteration} / ${args.maxIterations} ===`);
    appendTrace(runDir, { type: 'iteration.start', runId, iteration });

    // Fire on-iteration-start hook
    fireHook('on-iteration-start', { iteration, runId });

    // Run iteration guards from the standalone module
    if (runDir) {
      try {
        const guardResult = await runAllGuards(runDir, { maxIterations: args.maxIterations });
        if (!guardResult.allowed) {
          console.warn(`[orchestrate] Guard blocked iteration: ${guardResult.warnings.join('; ')}`);
          appendTrace(runDir, {
            type: 'iteration.blocked',
            runId,
            iteration,
            reason: 'guard',
            warnings: guardResult.warnings || [],
          });
          finalStatus = 'guard_halt';
          break;
        }
        if (guardResult.warnings.length > 0) {
          guardResult.warnings.forEach(w => console.warn(`[orchestrate] Guard warning: ${w}`));
        }
      } catch (guardErr) {
        console.warn(`[orchestrate] Guard check failed (non-fatal): ${guardErr.message}`);
      }
    }

    // 4a. run:iterate
    const iterateArgs = ['run:iterate', runDir, '--json', '--iteration', String(iteration)];
    if (args.pluginRoot) iterateArgs.push('--plugin-root', args.pluginRoot);

    let iterateResult;
    try {
      iterateResult = babysitter(iterateArgs);
    } catch (err) {
      console.error(`[orchestrate] run:iterate failed on iteration ${iteration}: ${err.message}`);
      appendTrace(runDir, {
        type: 'iteration.error',
        runId,
        iteration,
        op: 'run:iterate',
        error: err.message,
      });
      finalStatus = 'error';
      break;
    }

    console.log(`[orchestrate] iterate result keys: ${Object.keys(iterateResult).join(', ')}`);

    // 4h. Check for completionProof
    if (iterateResult.completionProof) {
      completionProof = iterateResult.completionProof;
      console.log('[orchestrate] CompletionProof received — run is complete.');
      appendTrace(runDir, { type: 'run.complete', runId, iteration, via: 'completionProof' });
      finalStatus = 'complete';
      break;
    }

    // Check for explicit done/finished status
    if (
      iterateResult.status === 'done' ||
      iterateResult.status === 'finished' ||
      iterateResult.status === 'completed' ||
      iterateResult.done === true
    ) {
      console.log('[orchestrate] Run marked as done by iterate.');
      appendTrace(runDir, { type: 'run.complete', runId, iteration, via: 'status' });
      finalStatus = 'complete';
      break;
    }

    // 4b. Parse pending actions (nextActions array)
    const nextActions = iterateResult.nextActions || iterateResult.actions || iterateResult.tasks || [];

    if (nextActions.length === 0) {
      console.log('[orchestrate] No pending actions returned; waiting for next iterate.');
      appendTrace(runDir, { type: 'iteration.idle', runId, iteration });
      continue;
    }

    console.log(`[orchestrate] Processing ${nextActions.length} pending action(s).`);

    // 4c–4g. Process each action
    for (const task of nextActions) {
      const effectId = task.effectId || task.id || task.taskId || null;
      const kind     = task.kind || 'agent';

      console.log(`\n[orchestrate]  -- Task ${effectId} (kind=${kind})`);
      appendTrace(runDir, {
        type: 'task.requested',
        runId,
        iteration,
        effectId,
        kind,
        taskId: task.taskId || null,
      });

      // -----------------------------------------------------------------------
      // 5. Breakpoint tasks — prompt user via stdin
      // -----------------------------------------------------------------------
      if (kind === 'breakpoint') {
        const question = (task.breakpoint && task.breakpoint.question)
          || task.question
          || '[orchestrate] Breakpoint reached. Press Enter to continue…';
        console.log(`\n[orchestrate] BREAKPOINT: ${question}`);
        const answer = await waitForStdinInput(`${question}\n> `);

        if (!effectId) continue;

        const taskOutputDir = path.join(runDir, 'tasks', effectId);
        fs.mkdirSync(taskOutputDir, { recursive: true });
        const outputPath = path.join(taskOutputDir, 'output.json');
        const outputRef = `tasks/${effectId}/output.json`;
        const outputPayload = { success: true, answer, completedAt: new Date().toISOString() };
        fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2));

        try {
          babysitter(['task:post', runDir, effectId, '--status', 'ok', '--value', outputRef, '--json']);
          appendTrace(runDir, { type: 'task.posted', runId, iteration, effectId, kind, status: 'ok', mode: 'breakpoint' });
        } catch (postErr) {
          console.error(`[orchestrate] task:post failed for breakpoint ${effectId}: ${postErr.message}`);
          appendTrace(runDir, { type: 'task.post.failed', runId, iteration, effectId, kind, error: postErr.message });
        }
        continue;
      }

      // -----------------------------------------------------------------------
      // Agent tasks
      // -----------------------------------------------------------------------
      if (kind !== 'agent') {
        console.warn(`[orchestrate] Unknown task kind "${kind}" — skipping.`);
        appendTrace(runDir, { type: 'task.skipped', runId, iteration, effectId, kind, reason: 'unsupported_kind' });
        continue;
      }

      // 4c. Build codex exec prompt using effect-mapper
      const agentPrompt = mapEffectToCodexPrompt(task)
        || (task.agent && task.agent.prompt)
        || task.prompt
        || `Complete task ${effectId}`;

      console.log(`[orchestrate] Agent prompt (truncated): ${agentPrompt.slice(0, 120)}`);

      // Fire on-task-start hook before executing the effect
      fireHook('on-task-start', { effectId: task.effectId, kind });

      // 4d–4e. Spawn codex exec and parse output (uses buildCodexArgs via runCodexExec)
      const codexResult = runCodexExec(agentPrompt, projectDir, task);
      appendTrace(runDir, {
        type: 'task.executed',
        runId,
        iteration,
        effectId,
        kind,
        exitCode: codexResult.exitCode,
        success: codexResult.success,
      });

      // 4f. Write result and post via result-poster
      if (!effectId) {
        console.warn('[orchestrate] Task has no effectId; cannot write output.');
        appendTrace(runDir, { type: 'task.skipped', runId, iteration, kind, reason: 'missing_effectId' });
        continue;
      }

      try {
        if (codexResult.success) {
          const parsedResult = parseCodexOutput(codexResult.stdout, task);
          const outputPayload = {
            success:     true,
            exitCode:    codexResult.exitCode,
            completedAt: new Date().toISOString(),
            result:      parsedResult.data || codexResult.parsed || { stdout: codexResult.stdout, stderr: codexResult.stderr },
          };
          await postTaskResult(runDir, effectId, outputPayload);
          console.log(`[orchestrate] task:post (ok) succeeded for ${effectId}`);
          appendTrace(runDir, { type: 'task.posted', runId, iteration, effectId, kind, status: 'ok' });
          // Fire on-task-complete hook after posting result
          fireHook('on-task-complete', { effectId: task.effectId, kind, status: 'ok' });
        } else {
          const errorResult = mapCodexError(codexResult.exitCode, codexResult.stderr);
          await postTaskError(runDir, effectId, {
            message: errorResult.message,
            code:    'CODEX_NONZERO_EXIT',
            details: codexResult.stderr,
          });
          console.log(`[orchestrate] task:post (error) succeeded for ${effectId}`);
          appendTrace(runDir, { type: 'task.posted', runId, iteration, effectId, kind, status: 'error' });
          // Fire on-task-complete hook after posting error result
          fireHook('on-task-complete', { effectId: task.effectId, kind, status: 'error' });
        }
      } catch (postErr) {
        console.error(`[orchestrate] task:post failed for ${effectId}: ${postErr.message}`);
        appendTrace(runDir, { type: 'task.post.failed', runId, iteration, effectId, kind, error: postErr.message });
      }
    }

    // Fire on-iteration-end hook at end of each iteration
    fireHook('on-iteration-end', { iteration, runId, status: iterateResult.status });
    appendTrace(runDir, { type: 'iteration.end', runId, iteration, status: iterateResult.status || 'unknown' });
  }

  // -------------------------------------------------------------------------
  // 6. Report final status
  // -------------------------------------------------------------------------

    if (finalStatus === 'running') {
      finalStatus = 'max-iterations-reached';
      console.warn(`\n[orchestrate] WARNING: Reached max iterations (${args.maxIterations}) without completion.`);
    }

    console.log(`\n[orchestrate] === Orchestration finished ===`);
    console.log(`[orchestrate] Status:          ${finalStatus}`);
    console.log(`[orchestrate] Iterations run:  ${iteration}`);
    if (completionProof) {
      console.log(`[orchestrate] CompletionProof: ${JSON.stringify(completionProof)}`);
    }

    if (finalStatus === 'complete') {
      fireHook('on-run-complete', { runId, output: completionProof });
    } else {
      fireHook('on-run-fail', { runId, error: finalStatus });
    }
    appendTrace(runDir, { type: 'run.end', runId, finalStatus, iterations: iteration });

    process.exit(finalStatus === 'complete' ? 0 : 1);
  } catch (err) {
    fireHook('on-run-fail', { runId, error: err.message });
    if (runDir) appendTrace(runDir, { type: 'run.fatal', runId, error: err.message });
    throw err;
  } finally {
    releaseLock();
  }
}

// Only run main() when executed directly (not when require()'d)
if (require.main === module) {
  main().catch((err) => {
    console.error('[orchestrate] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { parseArgs, main };
