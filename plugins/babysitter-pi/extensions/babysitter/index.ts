/**
 * Main entry point for the babysitter oh-my-pi extension.
 *
 * This module is the default export consumed by the oh-my-pi extension
 * loader.  It wires every sub-module into the extension API by
 * subscribing to lifecycle events, registering renderers, and setting
 * up the orchestration loop.
 *
 * @module index
 */

import type { ExtensionAPI } from './types';
import { EXTENSION_NAME, EXTENSION_VERSION, ENV_RUNS_DIR } from './constants';
import { initSession, getActiveRun, setActiveRun, clearActiveRun, bindRun } from './session-binder';
import { onAgentEnd, buildContinuationPrompt } from './loop-driver';
import { interceptToolCall } from './task-interceptor';
import { syncTodoState } from './todo-replacement';
import { renderRunWidget } from './tui-widgets';
import { updateStatusLine, clearStatusLine } from './status-line';
import { createToolRenderer } from './tool-renderer';
import { resetDigests, checkGuards } from './guards';
import { registerCustomTools } from './custom-tools';
import { iterate, getRunStatus } from './sdk-bridge';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Activate the babysitter extension.
 *
 * Called by oh-my-pi when the extension is loaded.  Registers all event
 * handlers, message renderers, and slash commands needed to drive
 * babysitter orchestration from within an oh-my-pi session.
 *
 * @param pi - The oh-my-pi {@link ExtensionAPI} handle.
 */
export default function activate(pi: ExtensionAPI): void {
  // Guard appendEntry calls during activation — some harnesses (e.g. oh-my-pi)
  // don't allow action methods until extension loading completes.
  const safeAppend = (entry: { type: string; content: string }) => {
    try { pi.appendEntry(entry); } catch { /* deferred — not yet initialized */ }
  };

  safeAppend({
    type: 'info',
    content: `[${EXTENSION_NAME}] v${EXTENSION_VERSION} activating...`,
  });

  // -- session_start: auto-bind to babysitter --------------------------------
  pi.on('session_start', async (...args: unknown[]) => {
    const sessionId = (args[0] as { sessionId?: string })?.sessionId ?? 'default';
    const runState = initSession(sessionId);

    if (runState) {
      renderRunWidget(runState, pi);
      updateStatusLine(runState, pi);
    }
  });

  // -- agent_end: drive the orchestration loop --------------------------------
  pi.on('agent_end', async (...args: unknown[]) => {
    const event = args[0] as {
      sessionId?: string;
      output?: string;
      text?: string;
    };
    await onAgentEnd(event ?? {}, pi);
  });

  // -- tool_call: intercept task/todo tools during active runs ----------------
  pi.on('tool_call', (...args: unknown[]) => {
    const event = args[0] as {
      toolName?: string;
      params?: Record<string, unknown>;
      sessionId?: string;
    };

    const toolName = event?.toolName ?? '';
    const params = event?.params ?? {};
    const _sessionId = event?.sessionId ?? 'default';
    const result = interceptToolCall(toolName, params, pi);

    if (result?.block) {
      return result; // oh-my-pi will block the tool call
    }

    return undefined; // allow the call to proceed
  });

  // -- context: inject babysitter state into the agent context ----------------
  pi.on('context', (...args: unknown[]) => {
    const event = args[0] as { sessionId?: string };
    const sessionId = event?.sessionId ?? 'default';
    const runState = getActiveRun(sessionId);

    if (!runState) {
      return undefined;
    }

    // Provide babysitter run state as additional context
    return {
      babysitter: {
        runId: runState.runId,
        status: runState.status,
        iteration: runState.iteration,
        processId: runState.processId,
        maxIterations: runState.maxIterations,
        startedAt: runState.startedAt,
      },
    };
  });

  // -- session_shutdown: clean up resources ----------------------------------
  pi.on('session_shutdown', (...args: unknown[]) => {
    const sessionId = (args[0] as { sessionId?: string })?.sessionId ?? 'default';

    clearActiveRun(sessionId);
    resetDigests();
    clearStatusLine(pi);

    pi.appendEntry({
      type: 'info',
      content: `[${EXTENSION_NAME}] Session ${sessionId} cleaned up.`,
    });
  });

  // -- Register custom tools for run inspection and control -------------------
  registerCustomTools(pi);

  // -- Register custom message renderer for babysitter tool results -----------
  pi.registerMessageRenderer('babysitter:tool-result', createToolRenderer());

  // -- Register slash command for manual todo sync ----------------------------
  pi.registerCommand('babysitter:sync', { handler: (...args: unknown[]) => {
    const sessionId = (args[0] as string) ?? 'default';
    const runState = getActiveRun(sessionId);

    if (runState) {
      syncTodoState(runState.runDir, pi);
      renderRunWidget(runState, pi);
      updateStatusLine(runState, pi);
    }
  }});

  // -- babysitter:call handler (shared by aliases) ----------------------------
  const handleBabysitterCall = async (...args: unknown[]) => {
    const prompt = (args[0] as string) ?? '';
    if (!prompt) {
      pi.appendEntry({
        type: 'error',
        content: `[${EXTENSION_NAME}] /babysitter:call requires a prompt argument. Usage: /babysitter:call "build feature X"`,
      });
      return;
    }

    const sessionId = (args[1] as string) ?? 'default';
    const runsDir = process.env[ENV_RUNS_DIR] ?? path.resolve('.a5c', 'runs');

    // If a run is already active, warn and replace it
    const existingRun = getActiveRun(sessionId);
    if (existingRun) {
      pi.appendEntry({
        type: 'warning',
        content: `[${EXTENSION_NAME}] Replacing active run ${existingRun.runId} for session ${sessionId}.`,
      });
      clearActiveRun(sessionId);
    }

    try {
      const run = await bindRun(sessionId, {
        processId: 'babysitter:call',
        importPath: 'babysitter/process',
        prompt,
        runsDir,
      });

      pi.appendEntry({
        type: 'info',
        content: `[${EXTENSION_NAME}] Run ${run.runId} created and bound to session ${sessionId}. Starting iteration...`,
      });

      // Kick off the first iteration
      const iterResult = await iterate(run.runDir);
      run.iteration += 1;
      run.iterationTimes.push(0);
      setActiveRun(run);

      if (iterResult.status === 'waiting') {
        const continuationPrompt = buildContinuationPrompt(iterResult, {
          runId: run.runId,
          iteration: run.iteration,
        });
        pi.sendUserMessage({ role: 'user', content: continuationPrompt });
      } else if (iterResult.status === 'completed') {
        pi.appendEntry({
          type: 'info',
          content: `[${EXTENSION_NAME}] Run ${run.runId} completed immediately.`,
        });
        run.status = 'completed';
        setActiveRun(run);
      } else if (iterResult.status === 'failed') {
        const errMsg = iterResult.error instanceof Error
          ? iterResult.error.message
          : String(iterResult.error ?? 'unknown error');
        pi.appendEntry({
          type: 'error',
          content: `[${EXTENSION_NAME}] Run ${run.runId} failed: ${errMsg}`,
        });
        run.status = 'failed';
        setActiveRun(run);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      pi.appendEntry({
        type: 'error',
        content: `[${EXTENSION_NAME}] Failed to start run: ${errMsg}`,
      });
    }
  };

  // -- Register slash command: babysitter:call + aliases ----------------------
  pi.registerCommand('babysitter:call', { description: 'Start a babysitter orchestration run', handler: handleBabysitterCall });
  pi.registerCommand('call', { description: 'Start a babysitter orchestration run (alias)', handler: handleBabysitterCall });
  pi.registerCommand('babysitter', { description: 'Start a babysitter orchestration run (alias)', handler: handleBabysitterCall });

  // -- Register slash command: babysitter:status ------------------------------
  pi.registerCommand('babysitter:status', { description: 'Show babysitter run status', handler: async (...args: unknown[]) => {
    const runIdArg = args[0] as string | undefined;
    const sessionId = (args[1] as string) ?? 'default';

    // Determine the run to inspect
    const activeRun = getActiveRun(sessionId);
    let runDir: string | null = null;
    let runId: string | null = null;

    if (runIdArg) {
      // Explicit run ID — resolve the run directory
      const runsDir = process.env[ENV_RUNS_DIR] ?? path.resolve('.a5c', 'runs');
      const candidateDir = path.join(runsDir, runIdArg);
      if (fs.existsSync(path.join(candidateDir, 'run.json'))) {
        runDir = candidateDir;
        runId = runIdArg;
      } else {
        pi.appendEntry({
          type: 'error',
          content: `[${EXTENSION_NAME}] Run ${runIdArg} not found in ${runsDir}.`,
        });
        return;
      }
    } else if (activeRun) {
      runDir = activeRun.runDir;
      runId = activeRun.runId;
    } else {
      pi.appendEntry({
        type: 'warning',
        content: `[${EXTENSION_NAME}] No active run for this session. Pass a run ID or start a run with /babysitter:call.`,
      });
      return;
    }

    try {
      const status = await getRunStatus(runDir);
      const elapsed = activeRun
        ? Date.now() - new Date(activeRun.startedAt).getTime()
        : 0;
      const elapsedSec = Math.round(elapsed / 1000);

      const lines = [
        `[babysitter:status] Run ${runId}`,
        `  Process:    ${status.processId}`,
        `  Status:     ${status.status}`,
        `  Iteration:  ${activeRun?.iteration ?? 'N/A'}`,
        `  Elapsed:    ${elapsedSec}s`,
        `  Pending:    ${status.pendingEffects.length} effect(s)`,
      ];

      if (status.pendingEffects.length > 0) {
        lines.push('  Pending effects:');
        for (const effect of status.pendingEffects) {
          const title = effect.taskDef?.title ?? effect.label ?? effect.effectId;
          lines.push(`    - [${effect.kind}] ${title} (${effect.effectId})`);
        }
      }

      pi.appendEntry({ type: 'info', content: lines.join('\n') });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      pi.appendEntry({
        type: 'error',
        content: `[${EXTENSION_NAME}] Failed to read run status: ${errMsg}`,
      });
    }
  }});

  // -- Register slash command: babysitter:resume ------------------------------
  pi.registerCommand('babysitter:resume', { description: 'Resume an existing babysitter run', handler: async (...args: unknown[]) => {
    const runIdArg = args[0] as string | undefined;
    const sessionId = (args[1] as string) ?? 'default';

    if (!runIdArg) {
      pi.appendEntry({
        type: 'error',
        content: `[${EXTENSION_NAME}] /babysitter:resume requires a run ID. Usage: /babysitter:resume <runId>`,
      });
      return;
    }

    const runsDir = process.env[ENV_RUNS_DIR] ?? path.resolve('.a5c', 'runs');
    const runDir = path.join(runsDir, runIdArg);

    if (!fs.existsSync(path.join(runDir, 'run.json'))) {
      pi.appendEntry({
        type: 'error',
        content: `[${EXTENSION_NAME}] Run ${runIdArg} not found in ${runsDir}.`,
      });
      return;
    }

    // Check that the run is actually resumable
    try {
      const status = await getRunStatus(runDir);

      if (status.status === 'completed') {
        pi.appendEntry({
          type: 'warning',
          content: `[${EXTENSION_NAME}] Run ${runIdArg} has already completed. Nothing to resume.`,
        });
        return;
      }
      if (status.status === 'failed') {
        pi.appendEntry({
          type: 'warning',
          content: `[${EXTENSION_NAME}] Run ${runIdArg} has failed. Cannot resume a failed run.`,
        });
        return;
      }

      // Clear any existing active run for this session
      const existingRun = getActiveRun(sessionId);
      if (existingRun) {
        pi.appendEntry({
          type: 'warning',
          content: `[${EXTENSION_NAME}] Replacing active run ${existingRun.runId} for session ${sessionId}.`,
        });
        clearActiveRun(sessionId);
      }

      // Re-bind the run to this session
      setActiveRun({
        sessionId,
        runId: runIdArg,
        runDir,
        iteration: 0,
        maxIterations: 256,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        processId: status.processId,
        status: 'running',
      });

      pi.appendEntry({
        type: 'info',
        content: `[${EXTENSION_NAME}] Resuming run ${runIdArg}. Starting next iteration...`,
      });

      // Run the next iteration
      const iterResult = await iterate(runDir);
      const run = getActiveRun(sessionId);

      if (run) {
        run.iteration += 1;
        run.iterationTimes.push(0);
        setActiveRun(run);
      }

      if (iterResult.status === 'waiting' && run) {
        const continuationPrompt = buildContinuationPrompt(iterResult, {
          runId: run.runId,
          iteration: run.iteration,
        });
        pi.sendUserMessage({ role: 'user', content: continuationPrompt });
      } else if (iterResult.status === 'completed') {
        pi.appendEntry({
          type: 'info',
          content: `[${EXTENSION_NAME}] Run ${runIdArg} completed on resume.`,
        });
        clearActiveRun(sessionId);
      } else if (iterResult.status === 'failed') {
        const errMsg = iterResult.error instanceof Error
          ? iterResult.error.message
          : String(iterResult.error ?? 'unknown error');
        pi.appendEntry({
          type: 'error',
          content: `[${EXTENSION_NAME}] Run ${runIdArg} failed on resume: ${errMsg}`,
        });
        clearActiveRun(sessionId);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      pi.appendEntry({
        type: 'error',
        content: `[${EXTENSION_NAME}] Failed to resume run ${runIdArg}: ${errMsg}`,
      });
    }
  }});

  // -- Register slash command: babysitter:doctor ------------------------------
  pi.registerCommand('babysitter:doctor', { description: 'Diagnose babysitter run health', handler: async (...args: unknown[]) => {
    const runIdArg = args[0] as string | undefined;
    const sessionId = (args[1] as string) ?? 'default';

    // Determine the run to diagnose
    const activeRun = getActiveRun(sessionId);
    let runDir: string | null = null;
    let runId: string | null = null;

    if (runIdArg) {
      const runsDir = process.env[ENV_RUNS_DIR] ?? path.resolve('.a5c', 'runs');
      const candidateDir = path.join(runsDir, runIdArg);
      if (fs.existsSync(path.join(candidateDir, 'run.json'))) {
        runDir = candidateDir;
        runId = runIdArg;
      } else {
        pi.appendEntry({
          type: 'error',
          content: `[${EXTENSION_NAME}] Run ${runIdArg} not found.`,
        });
        return;
      }
    } else if (activeRun) {
      runDir = activeRun.runDir;
      runId = activeRun.runId;
    } else {
      pi.appendEntry({
        type: 'warning',
        content: `[${EXTENSION_NAME}] No active run. Pass a run ID or start a run with /babysitter:call.`,
      });
      return;
    }

    const checks: string[] = [`[babysitter:doctor] Diagnosing run ${runId}`, ''];

    // Check 1: Run directory structure
    const requiredPaths = ['run.json', 'inputs.json', 'journal'];
    const optionalPaths = ['state', 'tasks', 'blobs', 'process'];
    let structureOk = true;

    for (const p of requiredPaths) {
      const fullPath = path.join(runDir, p);
      if (fs.existsSync(fullPath)) {
        checks.push(`  [OK]   ${p} exists`);
      } else {
        checks.push(`  [FAIL] ${p} is missing`);
        structureOk = false;
      }
    }
    for (const p of optionalPaths) {
      const fullPath = path.join(runDir, p);
      if (fs.existsSync(fullPath)) {
        checks.push(`  [OK]   ${p} exists`);
      } else {
        checks.push(`  [WARN] ${p} not found (optional)`);
      }
    }

    // Check 2: Lock file
    const lockPath = path.join(runDir, 'run.lock');
    if (fs.existsSync(lockPath)) {
      try {
        const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf-8')) as {
          pid?: number;
          acquiredAt?: string;
        };
        const lockAge = lockData.acquiredAt
          ? Date.now() - new Date(lockData.acquiredAt).getTime()
          : 0;
        const lockAgeSec = Math.round(lockAge / 1000);
        if (lockAgeSec > 300) {
          checks.push(`  [WARN] Stale lock file detected (age: ${lockAgeSec}s, pid: ${lockData.pid ?? 'unknown'}). Consider deleting run.lock.`);
        } else {
          checks.push(`  [OK]   Lock file present (age: ${lockAgeSec}s, pid: ${lockData.pid ?? 'unknown'})`);
        }
      } catch {
        checks.push(`  [WARN] Lock file exists but could not be parsed.`);
      }
    } else {
      checks.push(`  [OK]   No lock file (run is not locked)`);
    }

    // Check 3: Journal integrity (basic)
    const journalDir = path.join(runDir, 'journal');
    if (fs.existsSync(journalDir)) {
      try {
        const entries = fs.readdirSync(journalDir).filter((f: string) => f.endsWith('.json')).sort();
        checks.push(`  [OK]   Journal has ${entries.length} event(s)`);

        if (entries.length === 0) {
          checks.push(`  [WARN] Journal is empty. The run may not have started.`);
        }
      } catch {
        checks.push(`  [FAIL] Could not read journal directory.`);
      }
    }

    // Check 4: State cache
    const statePath = path.join(runDir, 'state', 'state.json');
    if (fs.existsSync(statePath)) {
      checks.push(`  [OK]   State cache exists`);
    } else {
      checks.push(`  [WARN] State cache missing. Will be rebuilt on next iteration. Run: babysitter run:rebuild-state`);
    }

    // Check 5: Run status via SDK
    try {
      const status = await getRunStatus(runDir);
      checks.push(`  [OK]   SDK status: ${status.status}`);
      checks.push(`  [OK]   Pending effects: ${status.pendingEffects.length}`);

      if (status.pendingEffects.length > 0) {
        for (const effect of status.pendingEffects) {
          const title = effect.taskDef?.title ?? effect.label ?? effect.effectId;
          checks.push(`         - [${effect.kind}] ${title}`);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      checks.push(`  [FAIL] Could not read run status via SDK: ${errMsg}`);
    }

    // Check 6: Guard status (only for active runs)
    if (activeRun) {
      const guardResult = checkGuards(activeRun);
      if (guardResult.passed) {
        checks.push(`  [OK]   Guards passing (iteration ${activeRun.iteration}/${activeRun.maxIterations})`);
      } else {
        checks.push(`  [WARN] Guard tripped: ${guardResult.reason}`);
      }
    }

    // Summary
    checks.push('');
    if (!structureOk) {
      checks.push('Remediation: run `babysitter run:repair-journal` to fix structural issues.');
    } else {
      checks.push('No critical issues detected.');
    }

    pi.appendEntry({ type: 'info', content: checks.join('\n') });
  }});

  safeAppend({
    type: 'info',
    content: `[${EXTENSION_NAME}] v${EXTENSION_VERSION} activated.`,
  });
}
