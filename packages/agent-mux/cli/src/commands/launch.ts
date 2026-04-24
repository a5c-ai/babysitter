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
  'max-turns': { type: 'number' },
  'max-budget-usd': { type: 'number' },
  'dry-run': { type: 'boolean' },
  'provider-arg': { type: 'string', repeatable: true },
  'observe': { type: 'boolean' },
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
  const providerId = (input.provider ?? 'anthropic') as ProviderId;

  const providerConfig = resolveProvider({
    provider: providerId,
    model: input.model,
    transport: input.transport as TransportId | undefined,
    apiKey: input.apiKey,
    apiBase: input.apiBase,
    region: input.region,
    project: input.project,
    resourceGroup: input.resourceGroup,
    endpointName: input.endpointName,
    authCommand: input.authCommand,
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
      proxyReason = `${input.harness} supports ${providerId} natively`;
    }
  } else {
    if (input.proxyMode === 'never') {
      throw new Error(
        `${input.harness} does not support ${providerId} natively. ` +
        `Use --with-proxy-if-needed to auto-launch the proxy.`,
      );
    }
    proxyReason =
      `${input.harness} does not support ${providerId} natively; ` +
      `proxy bridges ${providerId} → ${translation.proxyExposedTransport}`;
  }

  const proxy: ProxyPlan | undefined = proxyNeeded
    ? {
        targetProvider: providerId,
        targetModel: providerConfig.model,
        exposedTransport: translation.proxyExposedTransport ?? 'openai-chat',
        port: input.proxyPort ?? 0,
      }
    : undefined;

  return {
    harness: input.harness,
    provider: providerId,
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
}

function appendHarnessSessionArgs(plan: LaunchPlan, session: SessionArgs): void {
  switch (plan.harness) {
    case 'claude':
      if (session.resumeId) plan.args.push('--resume', session.resumeId);
      if (session.sessionId) plan.args.push('--session-id', session.sessionId);
      if (session.prompt) plan.args.push('--print', session.prompt);
      if (session.maxTurns) plan.args.push('--max-turns', String(session.maxTurns));
      break;
    case 'codex':
      if (session.resumeId) {
        plan.args.unshift('resume', session.resumeId);
      } else if (session.prompt) {
        plan.args.unshift('exec', session.prompt);
      }
      break;
    case 'gemini':
      if (session.prompt) plan.args.push('--prompt', session.prompt);
      break;
    case 'opencode':
      if (session.resumeId) plan.args.push('--session', session.resumeId);
      // OpenCode has no non-interactive prompt flag; prompt delivered via stdin after launch
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

  // Append session/prompt args
  const prompt = flagStr(args.flags, 'prompt');
  appendHarnessSessionArgs(plan, {
    resumeId: flagStr(args.flags, 'resume'),
    sessionId: flagStr(args.flags, 'session-id'),
    prompt,
    maxTurns: flagNum(args.flags, 'max-turns'),
  });

  // Passthrough args after --
  const dashDashIdx = process.argv.indexOf('--');
  if (dashDashIdx >= 0) {
    plan.args.push(...process.argv.slice(dashDashIdx + 1));
  }

  // Launch runtime if needed
  let proxyRuntime: TransportMuxRuntime | undefined;
  if (plan.proxyNeeded && plan.proxy) {
    try {
      proxyRuntime = await startTransportMuxRuntime({
        targetProvider: plan.proxy.targetProvider,
        targetModel: `${plan.proxy.targetProvider}/${plan.proxy.targetModel}`,
        exposedTransport: plan.proxy.exposedTransport,
        port: plan.proxy.port,
      });
      proxyRuntime.applyHarnessEnv(plan.env);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (jsonMode) printJsonError('SPAWN_ERROR', `Failed to launch transport runtime: ${msg}`);
      else printError(`Failed to launch transport runtime: ${msg}`);
      return ExitCode.GENERAL_ERROR;
    }
  }

  // Spawn harness
  const isInteractive = !prompt;

  let child: import('node:child_process').ChildProcess;
  let ptyProcess: any = null;

  if (isInteractive) {
    // Try to use node-pty for TUI harnesses
    try {
      const nodePty: any = require('node-pty'); // dynamic require — node-pty is optional
      ptyProcess = nodePty.spawn(plan.command, plan.args, {
        name: 'xterm-256color',
        cols: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
        cwd: process.cwd(),
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

      // Create a fake ChildProcess-like for signal handling
      child = { pid: ptyProcess.pid, kill: (sig: string) => ptyProcess.kill(sig) } as any;
    } catch {
      // node-pty not available, fall back to stdio inherit
      const { spawn } = await import('node:child_process');
      child = spawn(plan.command, plan.args, {
        stdio: 'inherit',
        env: { ...process.env, ...plan.env },
        cwd: process.cwd(),
        shell: false,
      });
    }
  } else {
    const { spawn } = await import('node:child_process');
    child = spawn(plan.command, plan.args, {
      stdio: ['pipe', 'inherit', 'inherit'],
      env: { ...process.env, ...plan.env },
      cwd: process.cwd(),
      shell: false,
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

  if (!isInteractive && prompt && child.stdin) {
    child.stdin.write(prompt);
    child.stdin.end();
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
