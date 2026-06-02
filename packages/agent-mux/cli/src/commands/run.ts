/**
 * `amux run` command implementation.
 *
 * @see docs/10-cli-reference.md Section 6
 */

import * as path from 'node:path';

import type { AgentMuxClient } from '@a5c-ai/agent-mux-comm';
import { AgentMuxError } from '@a5c-ai/agent-mux-comm';
import type { ParsedArgs } from '../parse-args.js';
import type { FlagDef } from '../parse-args.js';
import { flagStr, flagNum, flagBool, flagArr } from '../parse-args.js';
import { ExitCode, errorCodeToExitCode } from '../exit-codes.js';
import { printError, printJsonError } from '../output.js';

import { readStdin } from '../read-stdin.js';


/** Run-specific flag definitions. */
export const RUN_FLAGS: Record<string, FlagDef> = {
  'stream': { type: 'boolean' },
  'thinking-effort': { type: 'string' },
  'thinking-budget': { type: 'number' },
  'temperature': { type: 'number' },
  'top-p': { type: 'number' },
  'top-k': { type: 'number' },
  'thinking-override': { type: 'string' },
  'max-tokens': { type: 'number' },
  'max-output-tokens': { type: 'number' },
  'max-turns': { type: 'number' },
  'session': { type: 'string' },
  'fork': { type: 'string' },
  'no-session': { type: 'boolean' },
  'system': { type: 'string' },
  'system-mode': { type: 'string' },
  'cwd': { type: 'string' },
  'env': { type: 'string', repeatable: true },
  'yolo': { type: 'boolean' },
  'deny': { type: 'boolean' },
  'timeout': { type: 'number' },
  'inactivity-timeout': { type: 'number' },
  'output-format': { type: 'string' },
  'tag': { type: 'string', repeatable: true },
  'run-id': { type: 'string' },
  'attach': { type: 'string', repeatable: true },
  'skill': { type: 'string', repeatable: true },
  'agents-doc': { type: 'string' },
  'mcp-server': { type: 'string', repeatable: true },
  'project-id': { type: 'string' },
  'profile': { type: 'string' },
  'prompt': { short: 'p', type: 'string' },
  'non-interactive': { type: 'boolean' },
  'interactive': { short: 'i', type: 'boolean' },
  'quiet': { short: 'q', type: 'boolean' },
  'no-stream': { type: 'boolean' },
  'use-mock-harness': { type: 'boolean' },
  'mock-scenario': { type: 'string' },
};

/**
 * Validate mutual exclusion rules.
 * Returns an error message or null if valid.
 */
export function validateRunFlags(flags: Record<string, string | boolean | string[]>): string | null {
  const session = flagBool(flags, 'session') !== undefined || flagStr(flags, 'session') !== undefined;
  const noSession = flagBool(flags, 'no-session') === true;
  const fork = flagStr(flags, 'fork') !== undefined;
  const yolo = flagBool(flags, 'yolo') === true;
  const deny = flagBool(flags, 'deny') === true;
  const stream = flagBool(flags, 'stream') === true;
  const noStream = flagBool(flags, 'no-stream') === true;

  if (session && noSession) return 'Cannot use --session with --no-session';
  if (session && fork) return 'Cannot use --session with --fork';
  if (fork && noSession) return 'Cannot use --fork with --no-session';
  if (yolo && deny) return 'Cannot use --yolo with --deny';
  if (stream && noStream) return 'Cannot use --stream with --no-stream';

  return null;
}

/**
 * Build RunOptions from parsed args.
 */
export function buildRunOptions(
  args: ParsedArgs,
  registeredAgents: Set<string>,
): { agent?: string; prompt?: string; options: Record<string, unknown> } {
  const { flags, positionals } = args;
  const interactiveFlag = flagBool(flags, 'interactive') === true;

  // Resolve agent and prompt from flags/positionals.

  let agent = flagStr(flags, 'agent');
  const promptFlag = flagStr(flags, 'prompt');
  let prompt: string | undefined = promptFlag;

  if (positionals.length >= 1) {
    const positionalAgent = !agent && registeredAgents.has(positionals[0]!);
    if (positionalAgent) {
      agent = positionals[0];
    }
    if (prompt === undefined) {
      prompt = positionalAgent ? positionals.slice(1).join(' ') || undefined : positionals.join(' ');
    }
  }

  // Parse --env KEY=VALUE pairs
  const envArr = flagArr(flags, 'env');
  const env: Record<string, string> = {};
  for (const entry of envArr) {
    const eqIdx = entry.indexOf('=');
    if (eqIdx !== -1) {
      env[entry.slice(0, eqIdx)] = entry.slice(eqIdx + 1);
    }
  }

  // Determine approval mode
  let approvalMode: string | undefined;
  if (flagBool(flags, 'yolo')) approvalMode = 'yolo';
  else if (flagBool(flags, 'deny')) approvalMode = 'deny';

  // Determine stream mode
  let stream: boolean | undefined;
  if (flagBool(flags, 'stream') === true) stream = true;
  if (flagBool(flags, 'no-stream') === true) stream = false;

  // Parse thinking override
  let thinkingOverride: Record<string, unknown> | undefined;
  const toStr = flagStr(flags, 'thinking-override');
  if (toStr) {
    try {
      thinkingOverride = JSON.parse(toStr) as Record<string, unknown>;
    } catch {
      // Will be caught by validation
    }
  }

  const maxOutputTokens = flagNum(flags, 'max-output-tokens') ?? flagNum(flags, 'max-tokens');

  const options: Record<string, unknown> = {
    agent,
    prompt,
    model: flagStr(flags, 'model'),
    stream,
    thinkingEffort: flagStr(flags, 'thinking-effort'),
    thinkingBudgetTokens: flagNum(flags, 'thinking-budget'),
    thinkingOverride,
    temperature: flagNum(flags, 'temperature'),
    topP: flagNum(flags, 'top-p'),
    topK: flagNum(flags, 'top-k'),
    maxOutputTokens,
    maxTurns: flagNum(flags, 'max-turns'),
    sessionId: flagStr(flags, 'session'),
    forkSessionId: flagStr(flags, 'fork'),
    noSession: flagBool(flags, 'no-session'),
    systemPrompt: flagStr(flags, 'system'),
    systemPromptMode: flagStr(flags, 'system-mode'),
    cwd: flagStr(flags, 'cwd'),
    env: Object.keys(env).length > 0 ? env : undefined,
    approvalMode,
    timeout: flagNum(flags, 'timeout'),
    inactivityTimeout: flagNum(flags, 'inactivity-timeout'),
    outputFormat: flagStr(flags, 'output-format'),
    tags: flagArr(flags, 'tag').length > 0 ? flagArr(flags, 'tag') : undefined,
    runId: flagStr(flags, 'run-id'),
    skills: flagArr(flags, 'skill').length > 0 ? flagArr(flags, 'skill') : undefined,
    agentsDoc: flagStr(flags, 'agents-doc'),
    projectId: flagStr(flags, 'project-id'),
    profile: flagStr(flags, 'profile'),
    nonInteractive: flagBool(flags, 'non-interactive') === true && promptFlag !== undefined && !interactiveFlag ? true : undefined,
    interactive: interactiveFlag ? true : undefined,
  };

  // Remove undefined entries
  for (const key of Object.keys(options)) {
    if (options[key] === undefined) {
      delete options[key];
    }
  }

  return { agent, prompt, options };
}

/**
 * Execute the run command.
 */
export async function runCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const interactiveFlag = flagBool(args.flags, 'interactive') === true;

  // Validate mutual exclusions
  const exclusionError = validateRunFlags(args.flags);
  if (exclusionError) {
    if (jsonMode) {
      printJsonError('VALIDATION_ERROR', exclusionError);
    } else {
      printError(exclusionError);
    }
    return ExitCode.USAGE_ERROR;
  }

  // Get registered agents for positional resolution
  const adapters = client.adapters.list();
  const agentNames = new Set(adapters.map((a) => a.agent));

  const { agent, prompt, options } = buildRunOptions(args, agentNames);
  const explicitPrompt = prompt ?? (options['prompt'] as string | undefined);
  const stdinPrompt = explicitPrompt === undefined && process.stdin.isTTY === false
    ? await readStdin()
    : undefined;
  const resolvedPrompt = explicitPrompt
    ?? (stdinPrompt && stdinPrompt.trim() ? stdinPrompt : undefined)
    ?? (interactiveFlag ? ' ' : undefined);

  if (!agent && !options['agent']) {
    if (jsonMode) {
      printJsonError('VALIDATION_ERROR', 'No agent specified. Use --agent or provide agent as first argument.');
    } else {
      printError('No agent specified. Use --agent or provide agent as first argument.');
    }
    return ExitCode.USAGE_ERROR;
  }

  const effectiveAgent = agent ?? (options['agent'] as string | undefined);
  const adapterRegistry = client.adapters as unknown as {
    get?: (name: string) => { capabilities?: { supportsInteractiveMode?: boolean } } | undefined;
  };
  const selectedAdapter = effectiveAgent && typeof adapterRegistry.get === 'function'
    ? adapterRegistry.get(effectiveAgent)
    : undefined;

  // Interactive mode is now supported via PTY spawn in spawn-runner.
  // Pass it through to RunOptions so the spawn layer uses node-pty.

  if (!resolvedPrompt) {
    if (jsonMode) {
      printJsonError('VALIDATION_ERROR', 'No prompt specified. Provide a prompt argument or pipe via stdin.');
    } else {
      printError('No prompt specified. Provide a prompt argument or pipe via stdin.');
    }
    return ExitCode.USAGE_ERROR;
  }

  const useMock =
    flagBool(args.flags, 'use-mock-harness') === true ||
    process.env['USE_MOCK_HARNESS'] === '1' ||
    process.env['USE_MOCK_HARNESS'] === 'true';
  const mockScenario = flagStr(args.flags, 'mock-scenario');

  if (useMock) {
    const effectiveAgent = agent ?? (options['agent'] as string | undefined);
    if (effectiveAgent) {
      swapInMockAdapter(client, effectiveAgent, mockScenario);
    }
  }

  try {
    let runOpts = {
      agent: effectiveAgent as string,
      prompt: resolvedPrompt,
      ...options,
    } as Parameters<typeof client.run>[0];

    if (typeof runOpts.profile === 'string' && runOpts.profile.length > 0) {
      runOpts = await client.profiles.apply(runOpts.profile, runOpts) as Parameters<typeof client.run>[0];
    }

    const handle = client.run(runOpts);

    // If we get here, stream events
    if (jsonMode) {
      // JSONL mode
      for await (const event of handle) {
        process.stdout.write(JSON.stringify(event) + '\n');
      }
    } else {
      for await (const event of handle) {
        if (event.type === 'text_delta') {
          process.stdout.write(event.delta);
        }
      }
    }

    const result = await handle.result();
    if (jsonMode) {
      process.stdout.write(JSON.stringify({ type: 'run_result', ...result }) + '\n');
    }

    return runResultToExitCode(result);
  } catch (err: unknown) {
    if (err instanceof AgentMuxError) {
      if (jsonMode) {
        printJsonError(err.code, err.message, err.recoverable);
      } else {
        printError(err.message);
      }
      return errorCodeToExitCode(err.code);
    }

    const message = err instanceof Error ? err.message : String(err);
    if (jsonMode) {
      printJsonError('INTERNAL', message);
    } else {
      printError(message);
    }
    return ExitCode.GENERAL_ERROR;
  }
}

function runResultToExitCode(
  result: { exitReason: string; error: { code: Parameters<typeof errorCodeToExitCode>[0] } | null },
): number {
  if (result.exitReason === 'completed') {
    return ExitCode.SUCCESS;
  }

  if (result.error?.code) {
    return errorCodeToExitCode(result.error.code);
  }

  switch (result.exitReason) {
    case 'timeout':
    case 'inactivity':
      return ExitCode.TIMEOUT;
    case 'aborted':
    case 'interrupted':
      return ExitCode.ABORTED;
    case 'crashed':
    case 'killed':
      return ExitCode.AGENT_CRASHED;
    default:
      return ExitCode.GENERAL_ERROR;
  }
}

const MOCK_SCENARIO_ALIASES: Record<string, string> = {
  'claude-basic': 'claude:basic-text',
  'codex-basic': 'codex:basic-text',
  'gemini-basic': 'gemini:basic-text',
  'copilot-basic': 'copilot:basic-text',
  'cursor-basic': 'cursor:basic-text',
  'opencode-basic': 'opencode:basic-text',
  'pi-basic': 'pi:basic-text',
  'omp-basic': 'omp:basic-text',
  'openclaw-basic': 'openclaw:basic-text',
  'hermes-basic': 'hermes:basic-text',
};

function resolveMockScenarioName(agent: string, scenario: string | undefined): string {
  const requested = scenario ?? `${agent}-basic`;
  return MOCK_SCENARIO_ALIASES[requested] ?? requested;
}

/**
 * Replace the target agent's registered adapter with a wrapper whose
 * `buildSpawnArgs` redirects the spawn to the `mock-harness` binary.
 * Enables `--use-mock-harness` / `USE_MOCK_HARNESS=1` for offline E2E.
 *
 * The scenario name defaults to `<agent>-basic` (resolved by the mock's
 * scenario registry at runtime); override with `--mock-scenario <name>`.
 */
function swapInMockAdapter(
  client: AgentMuxClient,
  agent: string,
  scenario: string | undefined,
): void {
  const original = client.adapters.get(agent);
  if (!original) return;

  const mockBin = process.env['AMUX_MOCK_HARNESS_BIN'] ?? 'mock-harness';
  const scenarioName = resolveMockScenarioName(agent, scenario);
  const mockExt = path.extname(mockBin).toLowerCase();
  const launchWithNode = ['.js', '.mjs', '.cjs'].includes(mockExt);

  const wrapped = Object.create(original) as typeof original;
  wrapped.buildSpawnArgs = function mockBuildSpawnArgs(options: Parameters<typeof original.buildSpawnArgs>[0]) {
    const real = original.buildSpawnArgs(options);
    return {
      ...real,
      command: launchWithNode ? process.execPath : mockBin,
      args: launchWithNode
        ? [mockBin, '--scenario', scenarioName, '--agent', agent]
        : ['--scenario', scenarioName, '--agent', agent],
      usePty: false,
    };
  };

  const registry = client.adapters as unknown as {
    register?: (a: typeof original) => void;
    unregister?: (name: string) => void;
  };
  if (typeof registry.unregister === 'function') {
    registry.unregister(agent);
  }
  if (typeof registry.register === 'function') {
    registry.register(wrapped);
  }
}
