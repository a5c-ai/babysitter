/**
 * Maps babysitter effect kinds to oh-my-pi execution capabilities.
 *
 * Each effect kind (agent, node, shell, breakpoint, sleep, skill,
 * orchestrator_task) is dispatched to the appropriate oh-my-pi primitive:
 * sub-agent tasks, child_process execution, user prompts, timers, etc.
 *
 * Results are committed back to the run journal via the SDK's
 * `commitEffectResult` -- no CLI subprocess is spawned.
 *
 * @module effect-executor
 */

import { execSync } from 'child_process';

import {
  commitEffectResult,
  type EffectAction,
  type CommitEffectResultOptions,
} from '@a5c-ai/babysitter-sdk';

import { EFFECT_TIMEOUT_MS, DEFAULT_SLEEP_MS } from './constants';

// ---------------------------------------------------------------------------
// Public result shape
// ---------------------------------------------------------------------------

/** Outcome of executing a single effect. */
export interface EffectResult {
  status: 'ok' | 'error';
  value?: unknown;
  error?: unknown;
}

// ---------------------------------------------------------------------------
// executeEffect
// ---------------------------------------------------------------------------

/**
 * Execute a single babysitter effect using oh-my-pi capabilities.
 *
 * The mapping from effect kind to execution strategy is:
 *
 * | Effect kind          | oh-my-pi capability                       |
 * |----------------------|-------------------------------------------|
 * | `agent`              | Sub-agent via `pi.sendUserMessage()`      |
 * | `node`               | `execSync('node ...')`                    |
 * | `shell`              | `execSync('<command>')`                   |
 * | `breakpoint`         | Ask tool (user approval gate)             |
 * | `sleep`              | `setTimeout` with target timestamp check  |
 * | `skill`              | Command system / skill expansion          |
 * | `orchestrator_task`  | Sub-agent delegation with orchestrator    |
 *
 * @param action - The effect action descriptor from the babysitter runtime.
 * @param pi     - The oh-my-pi extension API handle.
 * @returns An {@link EffectResult} representing the outcome.
 */
export async function executeEffect(
  action: EffectAction,
  pi: unknown,
): Promise<EffectResult> {
  const kind = action.kind;

  switch (kind) {
    case 'agent':
      return executeAgentEffect(action, pi);

    case 'node':
      return executeNodeEffect(action);

    case 'shell':
      return executeShellEffect(action);

    case 'breakpoint':
      return executeBreakpointEffect(action, pi);

    case 'sleep':
      return executeSleepEffect(action);

    case 'skill':
      return executeSkillEffect(action, pi);

    case 'orchestrator_task':
      return executeOrchestratorEffect(action, pi);

    default:
      return {
        status: 'error',
        error: `Unknown effect kind: ${String(kind)}`,
      };
  }
}

// ---------------------------------------------------------------------------
// postEffectResult
// ---------------------------------------------------------------------------

/**
 * Post an effect result back into a run's journal using the SDK directly.
 *
 * This replaces the former CLI-based `task:post` approach with an in-process
 * call to `commitEffectResult`.
 *
 * @param runDir   - Absolute path to the run directory.
 * @param effectId - The effect identifier to resolve.
 * @param result   - The structured result payload.
 */
export async function postEffectResult(
  runDir: string,
  effectId: string,
  result: EffectResult,
): Promise<void> {
  const opts: CommitEffectResultOptions = {
    runDir,
    effectId,
    result: {
      status: result.status,
      value: result.status === 'ok' ? result.value : undefined,
      error: result.status === 'error' ? result.error : undefined,
    },
  };

  await commitEffectResult(opts);
}

// ---------------------------------------------------------------------------
// Kind-specific executors
// ---------------------------------------------------------------------------

/**
 * Dispatch an agent effect as a sub-agent task via oh-my-pi messaging.
 *
 * Uses `pi.sendUserMessage()` to inject an agent prompt into the
 * conversation, delegating execution to the host's sub-agent system.
 */
async function executeAgentEffect(
  action: EffectAction,
  pi: unknown,
): Promise<EffectResult> {
  try {
    const taskDef = action.taskDef ?? {};
    const args = (taskDef as Record<string, unknown>)['args'] as Record<string, unknown> | undefined;
    const prompt = (args?.['prompt'] as string)
      ?? (taskDef as Record<string, unknown>)['title'] as string
      ?? `Execute agent task ${action.effectId}`;

    const piApi = pi as { sendUserMessage: (msg: { role: string; content: string }) => void };
    piApi.sendUserMessage({
      role: 'user',
      content: `[babysitter:agent] ${prompt}`,
    });

    return {
      status: 'ok',
      value: { dispatched: true, effectId: action.effectId },
    };
  } catch (err: unknown) {
    return { status: 'error', error: String(err) };
  }
}

/**
 * Execute a node script via `child_process.execSync`.
 *
 * The script content is pulled from `action.taskDef.args.script` and
 * executed with `node -e`.
 */
async function executeNodeEffect(action: EffectAction): Promise<EffectResult> {
  try {
    const taskDef = action.taskDef ?? {};
    const args = (taskDef as Record<string, unknown>)['args'] as Record<string, unknown> | undefined;
    const script = (args?.['script'] as string) ?? '';
    const timeout = (args?.['timeout'] as number) ?? EFFECT_TIMEOUT_MS;

    const output = execSync(`node -e ${JSON.stringify(script)}`, {
      encoding: 'utf-8',
      timeout,
      maxBuffer: 10 * 1024 * 1024,
    });

    return { status: 'ok', value: output };
  } catch (err: unknown) {
    const execError = err as { stderr?: string; message?: string };
    return {
      status: 'error',
      error: execError.stderr ?? execError.message ?? String(err),
    };
  }
}

/**
 * Execute a shell command via `child_process.execSync`.
 *
 * The command string is pulled from `action.taskDef.args.command`.
 */
async function executeShellEffect(action: EffectAction): Promise<EffectResult> {
  try {
    const taskDef = action.taskDef ?? {};
    const args = (taskDef as Record<string, unknown>)['args'] as Record<string, unknown> | undefined;
    const command = (args?.['command'] as string) ?? '';
    const timeout = (args?.['timeout'] as number) ?? EFFECT_TIMEOUT_MS;

    const output = execSync(command, {
      encoding: 'utf-8',
      timeout,
      maxBuffer: 10 * 1024 * 1024,
    });

    return { status: 'ok', value: output };
  } catch (err: unknown) {
    const execError = err as { stderr?: string; message?: string };
    return {
      status: 'error',
      error: execError.stderr ?? execError.message ?? String(err),
    };
  }
}

/**
 * Present a breakpoint to the user for approval via oh-my-pi's ask tool.
 *
 * Sends a message with type `'ask'` and options `['Approve', 'Reject']`.
 * The user's response determines the result status.
 */
async function executeBreakpointEffect(
  action: EffectAction,
  pi: unknown,
): Promise<EffectResult> {
  try {
    const taskDef = action.taskDef ?? {};
    const args = (taskDef as Record<string, unknown>)['args'] as Record<string, unknown> | undefined;
    const message = (args?.['message'] as string)
      ?? (taskDef as Record<string, unknown>)['title'] as string
      ?? `Breakpoint: ${action.effectId}`;

    const piApi = pi as {
      sendMessage: (msg: {
        type: string;
        question: string;
        options: string[];
      }) => Promise<{ response?: string }> | void;
    };

    const response = await Promise.resolve(
      piApi.sendMessage({
        type: 'ask',
        question: `[babysitter:breakpoint] ${message}`,
        options: ['Approve', 'Reject'],
      }),
    );

    const approved = !response || response.response !== 'Reject';

    return {
      status: approved ? 'ok' : 'error',
      value: approved ? { approved: true, message } : undefined,
      error: approved ? undefined : 'Breakpoint rejected by user',
    };
  } catch (err: unknown) {
    return { status: 'error', error: String(err) };
  }
}

/**
 * Pause execution until a target timestamp is reached.
 *
 * If `schedulerHints.sleepUntilEpochMs` is present the sleep lasts until
 * that absolute time.  Otherwise falls back to `args.durationMs` or
 * the default sleep duration.
 */
async function executeSleepEffect(action: EffectAction): Promise<EffectResult> {
  try {
    const taskDef = action.taskDef ?? {};
    const args = (taskDef as Record<string, unknown>)['args'] as Record<string, unknown> | undefined;

    let durationMs: number;

    // Prefer the scheduler hint for an absolute target timestamp.
    const targetEpochMs = action.schedulerHints?.sleepUntilEpochMs;
    if (targetEpochMs != null) {
      const remaining = targetEpochMs - Date.now();
      durationMs = remaining > 0 ? remaining : 0;
    } else {
      durationMs = (args?.['durationMs'] as number) ?? DEFAULT_SLEEP_MS;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, durationMs));

    return {
      status: 'ok',
      value: { sleptMs: durationMs, wokeAt: new Date().toISOString() },
    };
  } catch (err: unknown) {
    return { status: 'error', error: String(err) };
  }
}

/**
 * Expand a skill via oh-my-pi's command system.
 *
 * Delegates to `pi.registerCommand` handler lookup or dispatches
 * through the command system.
 */
async function executeSkillEffect(
  action: EffectAction,
  pi: unknown,
): Promise<EffectResult> {
  try {
    const taskDef = action.taskDef ?? {};
    const args = (taskDef as Record<string, unknown>)['args'] as Record<string, unknown> | undefined;
    const skillName = (args?.['skill'] as string) ?? '';

    const piApi = pi as {
      sendMessage: (msg: { role: string; content: string }) => void;
    };

    piApi.sendMessage({
      role: 'system',
      content: `[babysitter:skill] Executing skill: ${skillName}`,
    });

    return {
      status: 'ok',
      value: { skill: skillName, dispatched: true },
    };
  } catch (err: unknown) {
    return { status: 'error', error: String(err) };
  }
}

/**
 * Delegate to a sub-agent for orchestrator tasks.
 *
 * Injects an orchestrator prompt into the conversation via
 * `pi.sendUserMessage()`, letting the host's agent system handle
 * the delegation.
 */
async function executeOrchestratorEffect(
  action: EffectAction,
  pi: unknown,
): Promise<EffectResult> {
  try {
    const taskDef = action.taskDef ?? {};
    const args = (taskDef as Record<string, unknown>)['args'] as Record<string, unknown> | undefined;
    const prompt = (args?.['prompt'] as string)
      ?? (taskDef as Record<string, unknown>)['title'] as string
      ?? `Orchestrator task ${action.effectId}`;

    const piApi = pi as { sendUserMessage: (msg: { role: string; content: string }) => void };
    piApi.sendUserMessage({
      role: 'user',
      content: `[babysitter:orchestrator] ${prompt}`,
    });

    return {
      status: 'ok',
      value: { dispatched: true, effectId: action.effectId },
    };
  } catch (err: unknown) {
    return { status: 'error', error: String(err) };
  }
}
