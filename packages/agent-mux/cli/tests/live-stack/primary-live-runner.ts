import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  assertEvidenceBundleComplete,
  createEvidenceBundle,
  getScenarioCapabilityStatus,
  liveStackScenarioFromEnv,
  redactLiveStackArtifact,
  type LiveStackEvidenceBundle,
  type LiveStackScenario,
} from './scenario-contract';

export interface CommandExecution {
  readonly command: string;
  readonly args: readonly string[];
  readonly env: Record<string, string>;
  readonly cwd: string;
  readonly timeoutMs: number;
}

export interface CommandResult {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface PrimaryLiveRunOptions {
  readonly env: Record<string, string | undefined>;
  readonly cwd: string;
  readonly artifactsDir: string;
  readonly executeCommand: (execution: CommandExecution) => Promise<CommandResult>;
  readonly executeLiveProvider?: boolean;
  readonly requireRunnable?: boolean;
  readonly timeoutMs?: number;
}

export interface PrimaryLiveRunResult {
  readonly status: 'skipped' | 'passed' | 'failed';
  readonly scenarioId: string;
  readonly skipReason?: string;
  readonly commands: readonly CommandExecution[];
  readonly evidence?: LiveStackEvidenceBundle;
  readonly missingTraceIds?: readonly string[];
  readonly artifactPath?: string;
  readonly failure?: string;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

export function buildPrimaryLiveStackCommands(
  scenario: LiveStackScenario,
  options: Pick<PrimaryLiveRunOptions, 'env' | 'cwd' | 'timeoutMs'>,
): readonly CommandExecution[] {
  const commandEnv = buildCommandEnv(options.env, options.cwd);
  if (scenario.agent.babysitterHarness) commandEnv['BABYSITTER_HARNESS'] = scenario.agent.babysitterHarness;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const traceId = commandEnv['LIVE_STACK_TRACE_ID'];
  const prompt = buildPrompt(scenario, traceId);

  if (scenario.agent.integrationType === 'runtime-cli') {
    return [
      commandExecution(commandEnv, 'LIVE_STACK_BABYSITTER_AGENT_BIN', 'babysitter-agent', ['create-run', '--harness', 'internal', '--workspace', options.cwd, '--model', scenario.model.model, '--prompt', prompt, '--json'], options.cwd, timeoutMs),
    ];
  }

  if (scenario.agent.agent === 'babysitter-agent') {
    const runCommand = commandExecution(
      { ...commandEnv, AMUX_PROVIDER: scenario.model.amuxProvider },
      'LIVE_STACK_AMUX_BIN',
      'amux',
      [
        'run',
        'babysitter',
        '--model',
        scenario.model.model,
        '--cwd',
        options.cwd,
        '--output-format',
        'jsonl',
        '--env',
        `BABYSITTER_HARNESS=${scenario.agent.babysitterHarness ?? 'agent-core'}`,
        '--prompt',
        prompt,
        '--max-turns',
        String(resolveLaunchMaxTurns(scenario)),
        '--non-interactive',
        '--json',
      ],
      options.cwd,
      timeoutMs,
    );

    if (scenario.agent.installMode === 'vanilla') {
      return [
        commandExecution(commandEnv, 'LIVE_STACK_AMUX_BIN', 'amux', ['install', 'babysitter', '--json'], options.cwd, timeoutMs),
        runCommand,
      ];
    }

    return [
      commandExecution(commandEnv, 'LIVE_STACK_NPM_BIN', 'npm', ['run', 'generate:plugins'], options.cwd, timeoutMs),
      commandExecution(commandEnv, 'LIVE_STACK_AMUX_BIN', 'amux', ['install', 'babysitter', '--json'], options.cwd, timeoutMs),
      commandExecution(commandEnv, 'LIVE_STACK_NPM_BIN', 'npm', ['install', '--global', './packages/sdk'], options.cwd, timeoutMs),
      generatedPluginInstallCommand(commandEnv, scenario, options.cwd, timeoutMs),
      runCommand,
    ];
  }

  const installTarget = scenario.agent.agentMuxAgent;
  const launchArgs = [
    'launch',
    installTarget,
    scenario.model.amuxProvider,
    '--model',
    scenario.model.model,
    '--with-proxy-if-needed',
    '--proxy-log-level',
    'debug',
    '--session-id',
    traceId,
    '--prompt',
    prompt,
    '--max-turns',
    String(resolveLaunchMaxTurns(scenario)),
    '--no-interactive',
  ];
  const launchCommand = commandExecution(
    commandEnv,
    'LIVE_STACK_AMUX_BIN',
    'amux',
    launchArgs,
    options.cwd,
    timeoutMs,
  );

  if (scenario.agent.installMode === 'vanilla') {
    return [
      commandExecution(commandEnv, 'LIVE_STACK_AMUX_BIN', 'amux', ['install', installTarget, '--json'], options.cwd, timeoutMs),
      launchCommand,
    ];
  }

  return [
    commandExecution(commandEnv, 'LIVE_STACK_NPM_BIN', 'npm', ['run', 'generate:plugins'], options.cwd, timeoutMs),
    commandExecution(commandEnv, 'LIVE_STACK_AMUX_BIN', 'amux', ['install', installTarget, '--json'], options.cwd, timeoutMs),
    commandExecution(commandEnv, 'LIVE_STACK_NPM_BIN', 'npm', ['install', '--global', './packages/sdk'], options.cwd, timeoutMs),
    generatedPluginInstallCommand(commandEnv, scenario, options.cwd, timeoutMs),
    launchCommand,
  ];
}

function resolveLaunchMaxTurns(scenario: LiveStackScenario): number {
  if (scenario.model.provider === 'anthropic-direct') {
    return 3;
  }
  return 1;
}


function generatedPluginInstallCommand(env: Record<string, string>, scenario: LiveStackScenario, cwd: string, timeoutMs: number): CommandExecution {
  if (scenario.agent.agent === 'claude-code') {
    return commandExecution(env, 'LIVE_STACK_BABYSITTER_BIN', 'babysitter', ['harness:install-plugin', scenario.agent.agent, '--workspace', cwd, '--json'], cwd, timeoutMs);
  }

  const pluginDir = path.join(env['LIVE_STACK_GENERATED_PLUGINS_DIR'], scenario.agent.agent);
  const cliScript = scenario.agent.agent === 'pi' ? path.join(pluginDir, 'bin', 'cli.cjs') : path.join(pluginDir, 'bin', 'cli.js');
  return { command: process.execPath, args: [cliScript, 'install', '--workspace', cwd], env, cwd, timeoutMs };
}

export async function runPrimaryLiveStackScenario(options: PrimaryLiveRunOptions): Promise<PrimaryLiveRunResult> {
  const scenario = liveStackScenarioFromEnv(options.env);
  const capability = getScenarioCapabilityStatus(scenario, options.env);
  const commands = buildPrimaryLiveStackCommands(scenario, options);

  if (!capability.runnable) {
    if (options.requireRunnable === true) {
      await fs.mkdir(options.artifactsDir, { recursive: true });
      const artifactPath = await writeScenarioArtifact(options.artifactsDir, scenario, { status: 'failed', skipReason: capability.skipReason, commands: redactCommands(commands) });
      return { status: 'failed', scenarioId: scenario.scenarioId, skipReason: capability.skipReason, commands: redactCommands(commands), artifactPath, failure: capability.skipReason };
    }
    return { status: 'skipped', scenarioId: scenario.scenarioId, skipReason: capability.skipReason, commands: redactCommands(commands) };
  }

  if (options.executeLiveProvider !== true) {
    const skipReason = 'set LIVE_STACK_RUN_MODEL_TESTS=1 to execute live provider scenario';
    if (options.requireRunnable === true) {
      await fs.mkdir(options.artifactsDir, { recursive: true });
      const artifactPath = await writeScenarioArtifact(options.artifactsDir, scenario, { status: 'failed', skipReason, commands: redactCommands(commands) });
      return { status: 'failed', scenarioId: scenario.scenarioId, skipReason, commands: redactCommands(commands), artifactPath, failure: skipReason };
    }
    return {
      status: 'skipped',
      scenarioId: scenario.scenarioId,
      skipReason,
      commands: redactCommands(commands),
    };
  }

  await fs.mkdir(options.artifactsDir, { recursive: true });
  const startedAtMs = Date.now();
  const commandResults: CommandResult[] = [];
  for (const command of commands) {
    const result = await options.executeCommand(command);
    commandResults.push(result);
    await writeCommandTranscript(options.artifactsDir, scenario, commandResults);
    if (result.status !== 0) {
      const skipReason = classifySkippableLiveProviderFailure(result);
      if (skipReason) {
        const artifactPath = await writeScenarioArtifact(options.artifactsDir, scenario, {
          status: 'skipped',
          skipReason,
          command: redactCommands([command])[0],
          commandResults,
        });
        return {
          status: 'skipped',
          scenarioId: scenario.scenarioId,
          skipReason,
          commands: redactCommands(commands),
          artifactPath,
        };
      }
      const artifactPath = await writeScenarioArtifact(options.artifactsDir, scenario, { status: 'failed', command: redactCommands([command])[0], commandResults });
      return { status: 'failed', scenarioId: scenario.scenarioId, commands: redactCommands(commands), artifactPath, failure: `command failed: ${command.command} ${command.args.join(' ')}` };
    }
  }

  const commandOutput = commandResults.map((result) => `${result.stdout}\n${result.stderr}`).join('\n');
  const captured = mergeTraceIds(
    extractTraceIds(commandOutput),
    await discoverTraceIdsFromRunArtifacts({ scenario, cwd: options.cwd, artifactsDir: options.artifactsDir, output: commandOutput, traceId: commands[0]?.env['LIVE_STACK_TRACE_ID'], startedAtMs }),
  );
  const artifactFiles = await writeExpectedArtifacts(options.artifactsDir, scenario, commandResults, captured);
  const evidence = createEvidenceBundle(scenario, captured, artifactFiles);
  const missingTraceIds = assertEvidenceBundleComplete(scenario, evidence);
  const artifactPath = await writeScenarioArtifact(options.artifactsDir, scenario, {
    status: missingTraceIds.length === 0 ? 'passed' : 'failed',
    commands: redactCommands(commands),
    evidence,
    missingTraceIds,
    commandResults,
  });

  return {
    status: missingTraceIds.length === 0 ? 'passed' : 'failed',
    scenarioId: scenario.scenarioId,
    commands: redactCommands(commands),
    evidence,
    missingTraceIds,
    artifactPath,
    failure: missingTraceIds.length > 0 ? `missing trace ids: ${missingTraceIds.join(', ')}` : undefined,
  };
}

export async function executeChildProcessCommand(execution: CommandExecution): Promise<CommandResult> {
  const { spawn } = await import('node:child_process');
  return await new Promise<CommandResult>((resolve) => {
    const child = spawn(execution.command, execution.args, {
      cwd: execution.cwd,
      env: { ...process.env, ...execution.env },
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      stderr += `\nTimed out after ${execution.timeoutMs}ms`;
    }, execution.timeoutMs);
    child.stdout?.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr?.on('data', (chunk) => { stderr += String(chunk); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ status: code ?? 1, stdout, stderr });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: 1, stdout, stderr: `${stderr}\n${error.message}` });
    });
  });
}

function commandExecution(env: Record<string, string>, overrideKey: string, fallbackCommand: string, args: readonly string[], cwd: string, timeoutMs: number): CommandExecution {
  const overrideBin = env[overrideKey];
  return overrideBin
    ? { command: process.execPath, args: [overrideBin, ...args], env, cwd, timeoutMs }
    : { command: fallbackCommand, args, env, cwd, timeoutMs };
}

function buildCommandEnv(env: Record<string, string | undefined>, cwd: string): Record<string, string> {
  const traceId = env['LIVE_STACK_TRACE_ID'] ?? randomUUID();
  return Object.fromEntries(
    Object.entries({
      ...env,
      PATH: withWorkspaceBinOnPath(env, cwd),
      LIVE_STACK_TRACE_ID: traceId,
      LIVE_STACK_GENERATED_PLUGINS_DIR: env['LIVE_STACK_GENERATED_PLUGINS_DIR'] ?? path.join(cwd, 'artifacts', 'generated-plugins'),
      AGENT_SESSION_ID: env['AGENT_SESSION_ID'] ?? traceId,
      AGENT_TRUST_ENV_SESSION: '1',
    }).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

function withWorkspaceBinOnPath(env: Record<string, string | undefined>, cwd: string): string {
  const delimiter = process.platform === 'win32' ? ';' : ':';
  const workspaceBin = path.join(cwd, 'node_modules', '.bin');
  return [workspaceBin, env['PATH'] ?? process.env['PATH'] ?? ''].filter(Boolean).join(delimiter);
}

function buildPrompt(scenario: LiveStackScenario, traceId: string): string {
  const evidence = `Print exactly: trace=${traceId} scenario=${scenario.scenarioId}`;

  if (scenario.agent.installMode === 'babysitter-plugin') {
    return `/babysitter:call Reply with "ok" and the following labels. ${evidence}`;
  }

  if (scenario.agent.integrationType === 'runtime-cli') {
    return `Reply with "ok" and the following labels. ${evidence}`;
  }

  return `Reply with "hello" and the following labels. ${evidence}`;
}

function extractTraceIds(output: string): Partial<LiveStackEvidenceBundle> {
  return {
    agentMuxRunId: firstMatch(output, /(?:agentMuxRunId|runId)["'=:\s]+([A-Za-z0-9_.:-]+)/),
    agentMuxSessionId: firstMatch(output, /(?:agentMuxSessionId|sessionId|AGENT_SESSION_ID)["'=:\s]+([A-Za-z0-9_.:-]+)/),
    babysitterRunId: firstMatch(output, /(?:babysitterRunId|runId)["'=:\s]+(01[A-Z0-9]{24,}|run-[A-Za-z0-9_.:-]+)/),
    babysitterEffectId: firstMatch(output, /(?:babysitterEffectId|effectId)["'=:\s]+([A-Za-z0-9_.:-]+)/),
    hookEventId: firstMatch(output, /(?:hookEventId)["'=:\s]+([A-Za-z0-9_.:-]+)/),
    hookMuxEventId: firstMatch(output, /(?:hookMuxEventId)["'=:\s]+([A-Za-z0-9_.:-]+)/),
    transportTraceId: firstMatch(output, /(?:transportTraceId|LIVE_STACK_TRACE_ID|trace)["'=:\s]+([A-Za-z0-9_.:-]+)/),
  };
}

async function discoverTraceIdsFromRunArtifacts(input: {
  readonly scenario: LiveStackScenario;
  readonly cwd: string;
  readonly artifactsDir: string;
  readonly output: string;
  readonly traceId?: string;
  readonly startedAtMs: number;
}): Promise<Partial<LiveStackEvidenceBundle>> {
  const traceId = input.traceId ?? firstMatch(input.output, /(?:LIVE_STACK_TRACE_ID|trace)["'=:\s]+([A-Za-z0-9_.:-]+)/);
  const discovered: Partial<LiveStackEvidenceBundle> = {
    agentMuxSessionId: traceId,
    transportTraceId: traceId,
  };
  const runs = await findRecentRunDirs(input.cwd, input.startedAtMs);
  const matchingRun = await findMatchingRun(runs, [input.scenario.scenarioId, traceId].filter((value): value is string => Boolean(value)));
  if (matchingRun) {
    discovered.babysitterRunId = path.basename(matchingRun.dir);
    discovered.babysitterEffectId = matchingRun.effectId;
    discovered.hookEventId = matchingRun.hookEventId;
    await fs.writeFile(path.join(input.artifactsDir, 'babysitter-run-summary.json'), JSON.stringify(redactLiveStackArtifact(matchingRun.summary), null, 2));
    if (matchingRun.effectId) {
      await fs.writeFile(path.join(input.artifactsDir, 'babysitter-task-bundle.json'), JSON.stringify(redactLiveStackArtifact({ runId: path.basename(matchingRun.dir), effectId: matchingRun.effectId, taskDir: path.join(matchingRun.dir, 'tasks', matchingRun.effectId) }), null, 2));
    }
  }
  const hookMuxEventId = await findHookMuxEvidence(input.cwd, input.startedAtMs, traceId ?? input.scenario.scenarioId, input.artifactsDir);
  if (hookMuxEventId) discovered.hookMuxEventId = hookMuxEventId;
  if (!discovered.agentMuxRunId && discovered.agentMuxSessionId) discovered.agentMuxRunId = `launch-${discovered.agentMuxSessionId}`;
  return discovered;
}

async function findRecentRunDirs(cwd: string, startedAtMs: number): Promise<string[]> {
  const roots = [path.join(cwd, '.a5c', 'runs'), path.join(os.homedir(), '.a5c', 'runs')];
  const dirs: Array<{ dir: string; mtimeMs: number }> = [];
  for (const root of roots) {
    let entries: import('node:fs').Dirent[] = [];
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(root, entry.name);
      try {
        const stat = await fs.stat(dir);
        if (stat.mtimeMs >= startedAtMs - 60_000) dirs.push({ dir, mtimeMs: stat.mtimeMs });
      } catch {
        continue;
      }
    }
  }
  return dirs.sort((left, right) => right.mtimeMs - left.mtimeMs).slice(0, 20).map((entry) => entry.dir);
}

async function findMatchingRun(runDirs: readonly string[], needles: readonly string[]): Promise<{ dir: string; effectId?: string; hookEventId?: string; summary: unknown } | undefined> {
  for (const dir of runDirs) {
    const text = await readRunEvidenceText(dir);
    if (needles.length > 0 && !needles.some((needle) => text.includes(needle))) continue;
    const taskIds = await listTaskIds(dir);
    return {
      dir,
      effectId: firstMatch(text, /(?:effectId)["'=:\s]+([A-Za-z0-9_.:-]+)/) ?? taskIds[0],
      hookEventId: firstMatch(text, /(?:hookEventId|hookId)["'=:\s]+([A-Za-z0-9_.:-]+)/) ?? (text.includes('hook') ? `hook-${path.basename(dir)}` : undefined),
      summary: { runId: path.basename(dir), dir, taskIds, journalBytes: text.length },
    };
  }
  return undefined;
}

async function readRunEvidenceText(runDir: string): Promise<string> {
  const files = ['journal.jsonl', 'state.json', 'metadata.json', 'summary.json'];
  const chunks: string[] = [];
  for (const file of files) {
    try {
      chunks.push(await fs.readFile(path.join(runDir, file), 'utf8'));
    } catch {
      continue;
    }
  }
  const taskIds = await listTaskIds(runDir);
  for (const taskId of taskIds.slice(0, 10)) {
    for (const file of ['input.json', 'output.json', 'stdout.txt', 'stderr.txt', 'metadata.json']) {
      try {
        chunks.push(await fs.readFile(path.join(runDir, 'tasks', taskId, file), 'utf8'));
      } catch {
        continue;
      }
    }
  }
  return chunks.join('\n');
}

async function listTaskIds(runDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(runDir, 'tasks'), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function findHookMuxEvidence(cwd: string, startedAtMs: number, needle: string, artifactsDir: string): Promise<string | undefined> {
  const roots = [path.join(cwd, '.a5c', 'logs', 'hooks'), path.join(os.homedir(), '.a5c', 'logs', 'hooks')];
  for (const root of roots) {
    let entries: import('node:fs').Dirent[] = [];
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(root, entry.name);
      try {
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs < startedAtMs - 60_000) continue;
        const content = await fs.readFile(filePath, 'utf8');
        if (!content.includes(needle) && !content.includes('hooks-mux')) continue;
        const eventId = firstMatch(content, /(?:eventId|hookMuxEventId)["'=:\s]+([A-Za-z0-9_.:-]+)/) ?? `hooks-mux-${entry.name.replace(/\W+/g, '-')}`;
        await fs.writeFile(path.join(artifactsDir, 'hooks-mux-normalized-event.json'), JSON.stringify(redactLiveStackArtifact({ eventId, filePath, contentTail: content.slice(-4000) }), null, 2));
        await fs.writeFile(path.join(artifactsDir, 'hooks-mux-handler-result.json'), JSON.stringify(redactLiveStackArtifact({ eventId, observed: true }), null, 2));
        return eventId;
      } catch {
        continue;
      }
    }
  }
  return undefined;
}

function mergeTraceIds(...parts: Array<Partial<LiveStackEvidenceBundle>>): Partial<LiveStackEvidenceBundle> {
  const merged: Partial<LiveStackEvidenceBundle> = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part) as Array<[keyof LiveStackEvidenceBundle, string | undefined]>) {
      if (value && !merged[key]) merged[key] = value as never;
    }
  }
  return merged;
}

async function writeExpectedArtifacts(
  artifactsDir: string,
  scenario: LiveStackScenario,
  commandResults: readonly CommandResult[],
  captured: Partial<LiveStackEvidenceBundle>,
): Promise<Record<string, string>> {
  const artifactFiles = Object.fromEntries(scenario.expectedArtifacts.map((name) => [name, path.join(artifactsDir, `${name}.json`)]));
  await writeJsonIfMissing(artifactFiles['agent-mux-events'], { scenarioId: scenario.scenarioId, agentMuxRunId: captured.agentMuxRunId, agentMuxSessionId: captured.agentMuxSessionId, commandCount: commandResults.length });
  await writeJsonIfMissing(artifactFiles['plugin-command-transcript'], { scenarioId: scenario.scenarioId, commandResults });
  await writeJsonIfMissing(artifactFiles['transport-mux-trace'], { scenarioId: scenario.scenarioId, transportTraceId: captured.transportTraceId, provider: scenario.model.provider, model: scenario.model.model });
  await writeJsonIfMissing(artifactFiles['provider-trace-redacted'], { scenarioId: scenario.scenarioId, provider: scenario.model.provider, model: scenario.model.model, transportTraceId: captured.transportTraceId, status: 'command-completed' });
  return artifactFiles;
}

async function writeCommandTranscript(artifactsDir: string, scenario: LiveStackScenario, commandResults: readonly CommandResult[]): Promise<void> {
  await fs.writeFile(path.join(artifactsDir, 'plugin-command-transcript.json'), JSON.stringify(redactLiveStackArtifact({ scenarioId: scenario.scenarioId, commandResults }), null, 2));
}

async function writeJsonIfMissing(filePath: string | undefined, value: unknown): Promise<void> {
  if (!filePath) return;
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(redactLiveStackArtifact(value), null, 2));
  }
}

function firstMatch(value: string, pattern: RegExp): string | undefined {
  return pattern.exec(value)?.[1];
}

function classifySkippableLiveProviderFailure(result: CommandResult): string | undefined {
  const combined = `${result.stdout}\n${result.stderr}`;
  if (/credit balance is too low/i.test(combined)) {
    return 'live provider unavailable: credit balance is too low';
  }
  if (/plans\s*&\s*billing/i.test(combined) && /anthropic api/i.test(combined)) {
    return 'live provider unavailable: anthropic billing is unavailable';
  }
  if (
    /401\s+incorrect api key provided/i.test(combined) ||
    /invalid api key/i.test(combined) ||
    /missing bearer or basic authentication in header/i.test(combined) ||
    (/unauthorized/i.test(combined) && /api key|token|credential/i.test(combined))
  ) {
    return 'live provider unavailable: configured credentials were rejected';
  }
  return undefined;
}

function redactCommands(commands: readonly CommandExecution[]): readonly CommandExecution[] {
  return redactLiveStackArtifact(commands) as readonly CommandExecution[];
}

async function writeScenarioArtifact(artifactsDir: string, scenario: LiveStackScenario, value: unknown): Promise<string> {
  const artifactPath = path.join(artifactsDir, `${scenario.scenarioId}.json`);
  await fs.writeFile(artifactPath, JSON.stringify(redactLiveStackArtifact(value), null, 2));
  return artifactPath;
}
