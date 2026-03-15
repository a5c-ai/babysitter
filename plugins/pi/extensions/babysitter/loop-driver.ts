/**
 * The orchestration loop driver.
 *
 * On every `agent_end` event the loop driver decides whether to continue
 * iterating: it checks guards, invokes `orchestrateIteration` via the SDK
 * bridge, maps pending effects to a continuation prompt, and schedules a
 * follow-up turn via `session.followUp()` if there is more work to do.
 *
 * This module uses the babysitter SDK directly -- no CLI subprocesses are
 * spawned, no JSON is scraped from stdout.  Everything runs in-process,
 * which is marginally less depressing than the alternative.
 *
 * @module loop-driver
 */

import type { ExtensionAPI } from './types.js';
import type { IterationResult, EffectAction } from '@a5c-ai/babysitter-sdk';
import { iterate, postResult, getRunStatus } from './sdk-bridge.js';
import { getActiveRun, setActiveRun, clearActiveRun } from './session-binder.js';
import { checkGuards, recordIterationDigest, resetDigests, recordIterationOutcome, recordPendingCount } from './guards.js';

// ---------------------------------------------------------------------------
// Promise-tag extraction
// ---------------------------------------------------------------------------

/**
 * Extract a `<promise>...</promise>` completion proof tag from agent output.
 *
 * The babysitter convention is that an agent signals "I'm done" by emitting
 * a `<promise>` tag.  If present, the loop driver treats the run as
 * completed and stops iterating.
 *
 * @param text - The raw agent output text to scan.
 * @returns The captured promise string, or `null` if no tag was found.
 */
export function extractPromiseTag(text: string): string | null {
  const match = /<promise>([^<]+)<\/promise>/.exec(text);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Continuation prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the continuation prompt injected into the conversation to keep the
 * orchestration loop alive.
 *
 * The prompt tells the agent which effects are pending, what kind of work
 * each one requires, and reminds it to post results when done.
 *
 * @param iterationResult - The SDK iteration result containing nextActions.
 * @param runState        - The current run state snapshot.
 * @returns A prompt string for the next agent turn.
 */
export function buildContinuationPrompt(
  iterationResult: Extract<IterationResult, { status: 'waiting' }>,
  runState: { runId: string; iteration: number },
): string {
  const actions = iterationResult.nextActions;
  const header =
    `[babysitter] Iteration ${runState.iteration} | Run ${runState.runId} | ` +
    `Continue orchestration`;

  if (actions.length === 0) {
    return `${header}\n\nNo pending effects. Waiting for external resolution.`;
  }

  const effectLines = actions.map((action: EffectAction, idx: number) => {
    const title =
      action.taskDef?.title ?? action.label ?? `(effect ${action.effectId})`;
    return `  ${idx + 1}. [${action.kind}] ${title}  (effectId: ${action.effectId})`;
  });

  const instructionsByKind: Record<string, string> = {
    node: 'Execute the Node.js task and capture its output.',
    shell: 'Run the shell command and capture stdout/stderr.',
    agent: 'Delegate to a sub-agent and collect its response.',
    breakpoint: 'This is a human approval gate. Approve or reject to continue.',
    sleep: 'Wait for the specified duration, then post an OK result.',
    orchestrator_task: 'Delegate to the orchestrator sub-process.',
    skill: 'Invoke the named skill and return its result.',
  };

  const uniqueKinds = [...new Set(actions.map((a: EffectAction) => a.kind))];
  const instructions = uniqueKinds
    .map((kind) => {
      const instruction = instructionsByKind[kind] ?? `Handle the "${kind}" effect.`;
      return `  - ${kind}: ${instruction}`;
    })
    .join('\n');

  return [
    header,
    '',
    `Pending effects (${actions.length}):`,
    ...effectLines,
    '',
    'Instructions by effect kind:',
    instructions,
    '',
    'Execute the effects, post results, then stop.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// agent_end handler
// ---------------------------------------------------------------------------

/**
 * Handle the `agent_end` event from oh-my-pi.
 *
 * This is the core orchestration loop driver.  When the LLM finishes a
 * turn, we:
 *
 *   1. Look up the active babysitter run for the current session.
 *   2. Check for a `<promise>` completion proof in the agent output.
 *   3. Run guard checks (max iterations, time limits, doom-loop detection).
 *   4. Call `orchestrateIteration` via the SDK bridge.
 *   5. Based on the result, either clean up (completed/failed) or inject
 *      a follow-up prompt to continue the loop (waiting).
 *
 * @param event - The `agent_end` event payload from oh-my-pi.
 * @param pi    - The oh-my-pi {@link ExtensionAPI} handle.
 */
export async function onAgentEnd(
  event: {
    sessionId?: string;
    output?: string;
    text?: string;
  },
  pi: ExtensionAPI,
): Promise<void> {
  const sessionId = event.sessionId ?? 'default';

  // 1. Look up active run
  const run = getActiveRun(sessionId);
  if (!run) {
    return; // No active babysitter run -- nothing to do.
  }

  // 2. Extract agent output and check for completion proof
  const agentOutput = event.output ?? event.text ?? '';
  const promise = extractPromiseTag(agentOutput);

  if (promise) {
    // The agent declared itself done.  Verify the promise and wrap up.
    pi.appendEntry({
      type: 'info',
      content: `[babysitter] Completion proof received: "${promise}". Finalising run ${run.runId}.`,
    });
    clearActiveRun(sessionId);
    resetDigests();
    return;
  }

  // 3. Guard checks
  const guardResult = checkGuards(run);
  if (!guardResult.passed) {
    pi.appendEntry({
      type: 'warning',
      content: `[babysitter] Guard tripped: ${guardResult.reason}. Stopping run ${run.runId}.`,
    });
    clearActiveRun(sessionId);
    resetDigests();
    return;
  }

  // 4. Run SDK orchestration iteration
  let iterResult: IterationResult;
  const iterStart = Date.now();
  try {
    iterResult = await iterate(run.runDir);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    pi.appendEntry({
      type: 'error',
      content: `[babysitter] Iteration failed for run ${run.runId}: ${errMsg}`,
    });
    // Update state to reflect the error but don't kill the run on one failure
    recordIterationOutcome(false);
    run.iteration += 1;
    run.iterationTimes.push(Date.now() - iterStart);
    setActiveRun(run);
    return;
  }

  // Record timing and increment iteration
  recordIterationOutcome(true);
  run.iteration += 1;
  run.iterationTimes.push(Date.now() - iterStart);

  // Record digest and pending count for doom-loop detection
  if (iterResult.status === 'waiting') {
    recordIterationDigest(
      JSON.stringify(iterResult.nextActions.map((a: EffectAction) => a.effectId)),
    );
    recordPendingCount(iterResult.nextActions.length);
  }

  // 5. Handle the result
  switch (iterResult.status) {
    case 'completed': {
      pi.appendEntry({
        type: 'info',
        content: `[babysitter] Run ${run.runId} completed successfully after ${run.iteration} iteration(s).`,
      });
      run.status = 'completed';
      setActiveRun(run);
      clearActiveRun(sessionId);
      resetDigests();
      return;
    }

    case 'failed': {
      const failErr =
        iterResult.error instanceof Error
          ? iterResult.error.message
          : String(iterResult.error ?? 'unknown error');
      pi.appendEntry({
        type: 'error',
        content: `[babysitter] Run ${run.runId} failed: ${failErr}`,
      });
      run.status = 'failed';
      setActiveRun(run);
      clearActiveRun(sessionId);
      resetDigests();
      return;
    }

    case 'waiting': {
      run.status = 'running';
      setActiveRun(run);

      const prompt = buildContinuationPrompt(iterResult, {
        runId: run.runId,
        iteration: run.iteration,
      });

      pi.sendUserMessage({ role: 'user', content: prompt });
      return;
    }

    default: {
      // Exhaustiveness guard -- should never happen, but the universe
      // has a talent for producing things that should never happen.
      const _exhaustive: never = iterResult;
      pi.appendEntry({
        type: 'warning',
        content: `[babysitter] Unexpected iteration status. This should not happen.`,
      });
      void _exhaustive;
      return;
    }
  }
}
