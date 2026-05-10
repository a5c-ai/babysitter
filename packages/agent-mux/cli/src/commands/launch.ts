/**
 * `amux launch` command implementation.
 *
 * Resolves a launch plan for a given harness+provider combination,
 * optionally starts the transport-mux runtime, then exec-forks the harness with
 * stdin/stdout passthrough and proper signal forwarding.
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import {
  resolveProvider,
  resolveWorkspaceDefaultCwd,
  WorkspaceService,
} from '@a5c-ai/agent-mux-core';
import type { ProviderId, TransportId } from '@a5c-ai/agent-mux-core';
import { translateForHarness } from '@a5c-ai/agent-mux-adapters';
import { startTransportMuxRuntime } from '@a5c-ai/transport-mux';
import type { TransportMuxRuntime } from '@a5c-ai/transport-mux';
import type { ParsedArgs, FlagDef } from '../parse-args.js';
import { flagStr, flagNum, flagBool, flagArr } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printError, printJsonError } from '../output.js';

/** Launch-specific flag definitions (global flags like model/json/debug are excluded). */
export const LAUNCH_FLAGS: Record<string, FlagDef> = {
  'api-key': { type: 'string' },
  'profile': { type: 'string' },
  'api-base': { type: 'string' },
  'region': { type: 'string' },
  'project': { type: 'string' },
  'resource-group': { type: 'string' },
  'endpoint-name': { type: 'string' },
  'transport': { short: 't', type: 'string' },
  'auth-command': { type: 'string' },
  'with-proxy-if-needed': { type: 'boolean' },
  'with-proxy': { type: 'boolean' },
  'no-proxy': { type: 'boolean' },
  'proxy-port': { type: 'number' },
  'proxy-log-level': { type: 'string' },
  'resume': { short: 'r', type: 'string' },
  'session-id': { short: 's', type: 'string' },
  'prompt': { short: 'p', type: 'string' },
  'interactive': { short: 'i', type: 'boolean' },
  'max-turns': { type: 'number' },
  'max-budget-usd': { type: 'number' },
  'dry-run': { type: 'boolean' },
  'provider-arg': { type: 'string', repeatable: true },
  'observe': { type: 'boolean' },
  'workspace': { type: 'string' },
  'workspace-create': { type: 'boolean' },
  'workspace-mode': { type: 'string' },
  'workspace-repo': { type: 'string', repeatable: true },
  'workspace-name': { type: 'string' },
};

// ---------------------------------------------------------------------------
// Launch plan types
// ---------------------------------------------------------------------------

export interface LaunchPlanInput {
  harness: string;
  provider?: string;
  model?: string;
  transport?: string;
  apiKey?: string;
  apiBase?: string;
  region?: string;
  project?: string;
  resourceGroup?: string;
  endpointName?: string;
  authCommand?: string;
  profile?: string;
  proxyMode: 'always' | 'if-needed' | 'never';
  proxyPort?: number;
  adapter?: { translateProvider?(config: Record<string, unknown>): any };
  providerArgs?: Record<string, unknown>;
}

export interface ProxyPlan {
  targetProvider: string;
  targetModel: string;
  exposedTransport: TransportId;
  port: number;
  apiBase?: string;
  apiKey?: string;
}

export interface LaunchPlan {
  harness: string;
  provider: string;
  transport: string;
  model: string;
  proxyNeeded: boolean;
  proxyReason: string;
  proxy?: ProxyPlan;
  command: string;
  args: string[];
  env: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Plan resolution
// ---------------------------------------------------------------------------

export function resolveLaunchPlan(input: LaunchPlanInput): LaunchPlan {
  const providerConfig = resolveProvider({
    provider: input.provider as ProviderId | undefined,
    model: input.model,
    transport: input.transport as TransportId | undefined,
    apiKey: input.apiKey,
    apiBase: input.apiBase,
    region: input.region,
    project: input.project,
    resourceGroup: input.resourceGroup,
    endpointName: input.endpointName,
    authCommand: input.authCommand,
    profile: input.profile,
  });

  // Merge extra provider args into params
  if (input.providerArgs) {
    Object.assign(providerConfig.params, input.providerArgs);
  }

  const translation = translateForHarness(input.harness, providerConfig, input.adapter);

  let proxyNeeded = translation.proxyRequired;
  let proxyReason: string;

  if (!translation.proxyRequired) {
    if (input.proxyMode === 'always') {
      proxyNeeded = true;
      proxyReason = 'Proxy forced via --with-proxy';
    } else {
      proxyNeeded = false;
      proxyReason = `${input.harness} supports ${providerConfig.provider} natively`;
    }
  } else {
    if (input.proxyMode === 'never') {
      throw new Error(
        `${input.harness} does not support ${providerConfig.provider} natively. ` +
        `Use --with-proxy-if-needed to auto-launch the proxy.`,
      );
    }
    proxyReason =
      `${input.harness} does not support ${providerConfig.provider} natively; ` +
      `proxy bridges ${providerConfig.provider} → ${translation.proxyExposedTransport}`;
  }

  const proxy: ProxyPlan | undefined = proxyNeeded
    ? {
        targetProvider: providerConfig.provider,
        targetModel: providerConfig.model,
        exposedTransport: translation.proxyExposedTransport ?? 'openai-chat',
        port: input.proxyPort ?? 0,
        apiBase: providerConfig.params['apiBase'] ? String(providerConfig.params['apiBase']) : undefined,
        apiKey: providerConfig.auth.apiKey,
      }
    : undefined;

  return {
    harness: input.harness,
    provider: providerConfig.provider,
    transport: providerConfig.transport,
    model: providerConfig.model,
    proxyNeeded,
    proxyReason,
    proxy,
    command: input.harness,
    args: [...translation.args],
    env: { ...translation.env },
  };
}

// ---------------------------------------------------------------------------
// Session/prompt helpers
// ---------------------------------------------------------------------------

interface SessionArgs {
  resumeId?: string;
  sessionId?: string;
  prompt?: string;
  maxTurns?: number;
  interactive?: boolean;
}

function appendHarnessSessionArgs(plan: LaunchPlan, session: SessionArgs): void {
  const interactive = session.interactive !== false;

  switch (plan.harness) {
    case 'claude':
      if (session.resumeId) plan.args.push('--resume', session.resumeId);
      if (session.sessionId) plan.args.push('--session-id', session.sessionId);
      if (session.prompt && !interactive) plan.args.push('--print', session.prompt);
      if (session.maxTurns) plan.args.push('--max-turns', String(session.maxTurns));
      break;
    case 'codex':
      if (session.resumeId) {
        plan.args.unshift('resume', session.resumeId);
      } else if (session.prompt && !interactive) {
        plan.args.unshift('exec', session.prompt);
      }
      break;
    case 'gemini':
      if (session.prompt && !interactive) plan.args.push('--prompt', session.prompt);
      break;
    case 'pi':
      // Pi doesn't accept --prompt or --max-turns flags.
      // Prompt is passed via stdin after spawn.
      break;
    case 'opencode':
      if (session.resumeId) plan.args.push('--session', session.resumeId);
      break;
  }
}

// ---------------------------------------------------------------------------
// Provider auth validation helper
// ---------------------------------------------------------------------------

async function validateProviderAuth(plan: LaunchPlan): Promise<string | null> {
  const { execSync } = await import('node:child_process');
  try {
    switch (plan.provider) {
      case 'bedrock':
        execSync('aws sts get-caller-identity', { stdio: 'ignore', timeout: 10_000 });
        break;
      case 'vertex':
        execSync('gcloud auth application-default print-access-token', { stdio: 'ignore', timeout: 10_000 });
        break;
    }
  } catch {
    const guidance: Record<string, string> = {
      bedrock: 'AWS credentials not configured. Run: aws configure',
      vertex: 'GCP credentials not configured. Run: gcloud auth application-default login',
    };
    return guidance[plan.provider] ?? null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Ollama lifecycle helper
// ---------------------------------------------------------------------------

async function ensureOllamaReady(model: string): Promise<{ ok: boolean; message?: string }> {
  const { execSync, spawnSync } = await import('node:child_process');

  // Check if Ollama is running
  try {
    execSync('ollama list', { stdio: 'ignore', timeout: 5000 });
  } catch {
    return { ok: false, message: 'Ollama is not running. Start it with: ollama serve' };
  }

  // Check if model is available
  try {
    const list = execSync('ollama list', { encoding: 'utf-8', timeout: 5000 });
    const lines = list.split('\n').map(l => l.trim()).filter(Boolean);
    const modelNames = lines.slice(1).map(l => l.split(/\s+/)[0]);
    const modelBase = model.split(':')[0];
    if (!modelNames.some(n => n.startsWith(modelBase))) {
      console.error(`[amux launch] Model '${model}' not found locally. Pulling...`);
      const pull = spawnSync('ollama', ['pull', model], { stdio: 'inherit', timeout: 600_000 });
      if (pull.status !== 0) {
        return { ok: false, message: `Failed to pull model '${model}'` };
      }
    }
  } catch (e) {
    console.error(`[amux launch] Warning: could not verify model availability`);
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Main command handler
// ---------------------------------------------------------------------------

export async function launchCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const harness = args.positionals[0];
  const provider = args.positionals[1];

  if (!harness) {
    const msg =
      'Usage: amux launch <harness> [provider] [flags...]\nRun "amux launch --help" for details.';
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  // Validate harness exists
  const adapter = client.adapters.get(harness);
  if (!adapter) {
    const available = client.adapters.list().map((a) => a.agent).join(', ');
    const msg = `Unknown harness '${harness}'. Available: ${available}`;
    if (jsonMode) printJsonError('AGENT_NOT_FOUND', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  // Check harness is installed
  if (adapter.detectInstallation) {
    const installResult = await adapter.detectInstallation();
    if (!installResult.installed) {
      const installCmd = adapter.capabilities?.installMethods?.[0]?.command ?? `npm install -g ${harness}`;
      const msg = `${harness} is not installed. Install with: ${installCmd}`;
      if (jsonMode) printJsonError('AGENT_NOT_FOUND', msg);
      else printError(msg);
      return ExitCode.USAGE_ERROR;
    }
  }

  if (flagStr(args.flags, 'resume') && adapter.capabilities && !adapter.capabilities.canResume) {
    const msg = `${harness} does not support session resumption`;
    if (jsonMode) printJsonError('CAPABILITY_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  // Validate proxy flag mutual exclusion
  const withProxy = flagBool(args.flags, 'with-proxy') === true;
  const withProxyIfNeeded = flagBool(args.flags, 'with-proxy-if-needed') === true;
  const noProxy = flagBool(args.flags, 'no-proxy') === true;
  if ((withProxy || withProxyIfNeeded) && noProxy) {
    const msg = 'Cannot use --with-proxy/--with-proxy-if-needed with --no-proxy';
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  const dryRun = flagBool(args.flags, 'dry-run') === true;
  const proxyMode = noProxy ? 'never' as const
    : withProxy ? 'always' as const
    : withProxyIfNeeded ? 'if-needed' as const
    : 'never' as const;

  const providerArgs = flagArr(args.flags, 'provider-arg') ?? [];
  const extraParams: Record<string, unknown> = {};
  for (const arg of providerArgs) {
    const eqIdx = arg.indexOf('=');
    if (eqIdx > 0) {
      extraParams[arg.slice(0, eqIdx)] = arg.slice(eqIdx + 1);
    }
  }

  let plan: LaunchPlan;
  try {
    plan = resolveLaunchPlan({
      harness,
      provider: provider as ProviderId | undefined,
      model: flagStr(args.flags, 'model'),
      transport: flagStr(args.flags, 'transport'),
      apiKey: flagStr(args.flags, 'api-key'),
      apiBase: flagStr(args.flags, 'api-base'),
      region: flagStr(args.flags, 'region'),
      project: flagStr(args.flags, 'project'),
      resourceGroup: flagStr(args.flags, 'resource-group'),
      endpointName: flagStr(args.flags, 'endpoint-name'),
      authCommand: flagStr(args.flags, 'auth-command'),
      profile: flagStr(args.flags, 'profile'),
      proxyMode,
      proxyPort: flagNum(args.flags, 'proxy-port'),
      adapter: adapter as any,
      providerArgs: extraParams,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  // Warn if auth appears missing for the resolved provider
  const resolvedConfig = resolveProvider({
    provider: provider as ProviderId | undefined,
    model: flagStr(args.flags, 'model'),
    apiKey: flagStr(args.flags, 'api-key'),
    authCommand: flagStr(args.flags, 'auth-command'),
    profile: flagStr(args.flags, 'profile'),
  });
  if (resolvedConfig.auth.type === 'api_key' && !resolvedConfig.auth.apiKey) {
    const defaults = (await import('@a5c-ai/agent-mux-core')).PROVIDER_DEFAULTS;
    const provId = resolvedConfig.provider;
    const envKey = defaults[provId]?.envKey;
    if (envKey) {
      console.error(`Warning: No API key found for ${provId}. Set ${envKey} or use --api-key.`);
    }
  }

  // Provider-specific auth validation (Bedrock STS, Vertex ADC, etc.)
  if (!dryRun) {
    const authWarning = await validateProviderAuth(plan);
    if (authWarning) {
      console.error(`Warning: ${authWarning}`);
    }
  }

  // Ollama lifecycle: verify server is running and model is available (pull if needed)
  if (plan.provider === 'ollama' && plan.model && !dryRun) {
    const ollamaCheck = await ensureOllamaReady(plan.model);
    if (!ollamaCheck.ok) {
      if (jsonMode) printJsonError('SPAWN_ERROR', ollamaCheck.message!);
      else printError(ollamaCheck.message!);
      return ExitCode.GENERAL_ERROR;
    }
  }

  // Dry-run: print plan and exit without spawning anything
  if (dryRun) {
    const output = JSON.parse(JSON.stringify(plan)) as typeof plan & { env: Record<string, string> };
    for (const [k, v] of Object.entries(output.env)) {
      if (k.toLowerCase().includes('key') || k.toLowerCase().includes('token')) {
        output.env[k] = String(v).slice(0, 8) + '***';
      }
    }
    console.log(JSON.stringify(output, null, 2));
    return ExitCode.SUCCESS;
  }

  const workspaceService = new WorkspaceService();
  let launchCwd = process.cwd();
  const workspaceIdentifier = flagStr(args.flags, 'workspace');
  const workspaceCreate = flagBool(args.flags, 'workspace-create') === true;
  const workspaceRepos = flagArr(args.flags, 'workspace-repo');
  const workspaceName = flagStr(args.flags, 'workspace-name') ?? `${harness}-workspace`;

  if (workspaceCreate) {
    const repos = workspaceRepos.length > 0 ? workspaceRepos : [process.cwd()];
    const workspace = await workspaceService.createWorkspace({
      name: workspaceName,
      repos: repos.map((repo) => ({ path: repo })),
      mode: flagStr(args.flags, 'workspace-mode') === 'symlink' ? 'symlink' : 'worktree',
    });
    launchCwd = resolveWorkspaceDefaultCwd(workspace);
  } else if (workspaceIdentifier) {
    const workspace = await workspaceService.resolveWorkspace(workspaceIdentifier);
    if (!workspace) {
      const msg = `Unknown workspace '${workspaceIdentifier}'`;
      if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
      else printError(msg);
      return ExitCode.USAGE_ERROR;
    }
    launchCwd = resolveWorkspaceDefaultCwd(workspace);
  }

  // Resolve interactive mode (default: true)
  const interactiveFlag = flagBool(args.flags, 'interactive');
  const isInteractive = interactiveFlag !== false;

  // Append session/prompt args
  const prompt = flagStr(args.flags, 'prompt');
  appendHarnessSessionArgs(plan, {
    resumeId: flagStr(args.flags, 'resume'),
    sessionId: flagStr(args.flags, 'session-id'),
    prompt,
    maxTurns: flagNum(args.flags, 'max-turns'),
    interactive: isInteractive,
  });

  // Add --model for harnesses that accept it as a CLI arg
  const modelFlag = flagStr(args.flags, 'model');
  if (modelFlag && ['pi', 'gemini', 'opencode'].includes(plan.harness)) {
    plan.args.push('--model', modelFlag);
  }

  // Passthrough args after --
  const dashDashIdx = process.argv.indexOf('--');
  if (dashDashIdx >= 0) {
    plan.args.push(...process.argv.slice(dashDashIdx + 1));
  }

  // Launch runtime if needed
  let proxyRuntime: TransportMuxRuntime | undefined;
  if (plan.proxyNeeded && plan.proxy) {
    try {
      // When exposed transport differs from target (e.g., anthropic→foundry),
      // the proxy needs a completion engine to translate request/response formats.
      let completionEngine;
      if (plan.proxy.apiBase && plan.proxy.apiKey) {
        const { createOpenAICompletionEngine } = await import('./launch-completion-engine.js');
        completionEngine = createOpenAICompletionEngine({
          apiBase: plan.proxy.apiBase,
          apiKey: plan.proxy.apiKey,
          targetModel: plan.proxy.targetModel,
        });
      }

      proxyRuntime = await startTransportMuxRuntime({
        targetProvider: plan.proxy.targetProvider,
        targetModel: `${plan.proxy.targetProvider}/${plan.proxy.targetModel}`,
        exposedTransport: plan.proxy.exposedTransport,
        port: plan.proxy.port,
        apiBase: plan.proxy.apiBase,
        completionEngine,
      });
      proxyRuntime.applyHarnessEnv(plan.env);

      // Pi ignores OPENAI_BASE_URL — write a models.json config that registers
      // a custom provider pointing to the local proxy.
      if (plan.harness === 'pi') {
        const { writeFileSync, mkdirSync } = await import('node:fs');
        const { join } = await import('node:path');
        const piConfigDir = process.env['PI_CODING_AGENT_DIR']
          ?? join(process.env['HOME'] ?? process.env['USERPROFILE'] ?? '/tmp', '.pi', 'agent');
        mkdirSync(piConfigDir, { recursive: true });
        const modelsConfig = {
          providers: {
            'amux-proxy': {
              baseUrl: `${proxyRuntime.url}/v1`,
              api: 'openai-completions',
              apiKey: proxyRuntime.authToken ?? 'proxy-token',
              models: [{
                id: plan.model,
                reasoning: false,
                input: ['text'],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 16384,
              }],
            },
          },
        };
        const modelsPath = join(piConfigDir, 'models.json');
        writeFileSync(modelsPath, JSON.stringify(modelsConfig, null, 2));
        plan.args.push('--provider', 'amux-proxy');
        console.error(`[amux launch] Pi proxy config written to ${modelsPath}, proxy at ${proxyRuntime.url}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (jsonMode) printJsonError('SPAWN_ERROR', `Failed to launch transport runtime: ${msg}`);
      else printError(`Failed to launch transport runtime: ${msg}`);
      return ExitCode.GENERAL_ERROR;
    }
  }

  // Spawn harness

  let child: import('node:child_process').ChildProcess;
  let ptyProcess: any = null;

  if (isInteractive) {
    // Interactive mode: full TTY passthrough. If a prompt is provided, it's
    // injected as initial stdin after the harness starts (like typing it in).
    try {
      const nodePty: any = require('node-pty'); // dynamic require — node-pty is optional
      ptyProcess = nodePty.spawn(plan.command, plan.args, {
        name: 'xterm-256color',
        cols: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
        cwd: launchCwd,
        env: { ...process.env, ...plan.env } as Record<string, string>,
      });

      // Pipe PTY to stdout and stdin to PTY
      ptyProcess.onData((data: string) => process.stdout.write(data));
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();
      process.stdin.on('data', (data: Buffer) => ptyProcess.write(data.toString()));

      // Handle terminal resize
      process.stdout.on('resize', () => {
        ptyProcess.resize(process.stdout.columns || 80, process.stdout.rows || 24);
      });

      // Inject prompt as initial input after a short delay for the harness to start
      if (prompt && !plan.args.some(a => a === prompt)) {
        setTimeout(() => ptyProcess.write(prompt + '\n'), 500);
      }

      // Create a fake ChildProcess-like for signal handling
      child = { pid: ptyProcess.pid, kill: (sig: string) => ptyProcess.kill(sig) } as any;
    } catch {
      // node-pty not available, fall back to stdio inherit with stdin pipe for prompt injection
      const { spawn } = await import('node:child_process');
      child = spawn(plan.command, plan.args, {
        stdio: prompt ? ['pipe', 'inherit', 'inherit'] : 'inherit',
        env: { ...process.env, ...plan.env },
        cwd: launchCwd,
        shell: process.platform === 'win32',
      });
    }
  } else {
    // Non-interactive: pipe stdin, inherit stdout/stderr
    const { spawn } = await import('node:child_process');
    child = spawn(plan.command, plan.args, {
      stdio: ['pipe', 'inherit', 'inherit'],
      env: { ...process.env, ...plan.env },
      cwd: launchCwd,
      shell: process.platform === 'win32',
    });
  }

  if (flagBool(args.flags, 'observe')) {
    if (isInteractive) {
      console.error('[amux launch] Warning: --observe does not work with interactive PTY mode');
    } else {
      // Tee stdout to both console and a log file
      const logPath = `.amux-launch-${Date.now()}.log`;
      const logStream = (await import('node:fs')).createWriteStream(logPath);
      child.stdout?.on('data', (chunk: Buffer) => {
        process.stdout.write(chunk);
        logStream.write(chunk);
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        process.stderr.write(chunk);
        logStream.write(chunk);
      });
      child.on('exit', () => logStream.end());
      console.error(`[amux launch] Observing output to ${logPath}`);
    }
  }

  const forwardSignal = (sig: NodeJS.Signals) => {
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('node:child_process');
        execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
      } catch { /* process may already be dead */ }
    } else {
      child.kill(sig);
    }
  };
  process.on('SIGINT', forwardSignal);
  process.on('SIGTERM', forwardSignal);

  if (prompt && child.stdin && !ptyProcess) {
    child.stdin.write(prompt + '\n');
    if (!isInteractive) {
      child.stdin.end();
    } else {
      // Interactive with stdin pipe (no PTY): reconnect terminal stdin after prompt injection
      process.stdin.resume();
      process.stdin.pipe(child.stdin);
    }
  }

  const exitCode = await new Promise<number>((resolve) => {
    if (ptyProcess) {
      ptyProcess.onExit(({ exitCode: code }: { exitCode: number }) => {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        resolve(code);
      });
    } else {
      child.on('exit', (code: number | null, signal: string | null) => {
        resolve(signal ? 128 + (signal === 'SIGINT' ? 2 : 15) : (code ?? 1));
      });
    }
  });

  process.off('SIGINT', forwardSignal);
  process.off('SIGTERM', forwardSignal);

  if (proxyRuntime) {
    await proxyRuntime.stop();
  }

  return exitCode;
}
