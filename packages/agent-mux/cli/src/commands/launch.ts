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
  'yolo': { type: 'boolean' },
  'bridge-interactive': { type: 'boolean' },
  'bridge-hooks': { type: 'boolean' },
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
  project?: string;
  location?: string;
  useVertexAi?: boolean;
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
        project: providerConfig.params['project'] ? String(providerConfig.params['project']) : undefined,
        location: providerConfig.params['region'] ? String(providerConfig.params['region']) : undefined,
        useVertexAi: providerConfig.provider === 'vertex' || Boolean(providerConfig.params['useVertexAi']),
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
  bridgeInteractive?: boolean;
}

function appendHarnessSessionArgs(plan: LaunchPlan, session: SessionArgs): void {
  const interactive = session.interactive !== false;

  switch (plan.harness) {
    case 'claude':
      if (session.bridgeInteractive) {
        plan.args.push('--bare');
      }
      if (session.resumeId) plan.args.push('--resume', session.resumeId);
      if (session.sessionId) plan.args.push('--session-id', session.sessionId);
      if (session.prompt && !interactive) {
        plan.args.push('-p', session.prompt);
      }
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
      if (session.prompt) plan.args.push('--prompt', session.prompt);
      break;
    case 'pi':
      if (session.prompt && !interactive) {
        plan.args.push('--prompt', session.prompt);
      }
      break;
    case 'opencode':
      if (session.resumeId) plan.args.push('--session', session.resumeId);
      break;
  }
}

// ---------------------------------------------------------------------------
// Provider auth validation helper
// ---------------------------------------------------------------------------


async function prepareHarnessAutomationState(harness: string, cwd: string, env: Record<string, string>): Promise<void> {
  if (!isAutomationPreseedEnabled(env)) return;
  if (harness === 'claude') await prepareClaudeAutomationState(cwd, env);
  if (harness === 'codex') await prepareCodexAutomationState(cwd);
}

function isAutomationPreseedEnabled(env: Record<string, string>): boolean {
  return env['AMUX_PRESEED_HARNESS_ONBOARDING'] === '1' || env['CI'] === 'true' || env['GITHUB_ACTIONS'] === 'true' || process.env['CI'] === 'true' || process.env['GITHUB_ACTIONS'] === 'true';
}

function automationHome(): string | undefined {
  return process.env['HOME'] || process.env['USERPROFILE'];
}

async function readJsonObject(filePath: string): Promise<Record<string, unknown>> {
  try {
    const fs = await import('node:fs/promises');
    const value = JSON.parse(await fs.readFile(filePath, 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

async function writeJsonObject(filePath: string, value: Record<string, unknown>): Promise<void> {
  const { dirname } = await import('node:path');
  const fs = await import('node:fs/promises');
  await fs.mkdir(dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function recordObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numberAtLeast(value: unknown, minimum: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(numeric, minimum) : minimum;
}

function approveClaudeCustomApiKey(config: Record<string, unknown>, env: Record<string, string>): void {
  const apiKey = env['ANTHROPIC_API_KEY'] || process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) return;
  const fingerprint = apiKey.slice(-20);
  const responses = recordObject(config['customApiKeyResponses']);
  const approved = Array.isArray(responses['approved']) ? responses['approved'].filter((value): value is string => typeof value === 'string') : [];
  const rejected = Array.isArray(responses['rejected']) ? responses['rejected'].filter((value): value is string => typeof value === 'string' && value !== fingerprint) : [];
  if (!approved.includes(fingerprint)) approved.push(fingerprint);
  config['customApiKeyResponses'] = { ...responses, approved, rejected };
}

const AUTOMATION_CLAUDE_ONBOARDING_VERSION = '999.999.999';

async function prepareClaudeAutomationState(cwd: string, env: Record<string, string>): Promise<void> {
  const home = automationHome();
  if (!home) return;
  const { join, resolve } = await import('node:path');
  const settingsPath = join(home, '.claude', 'settings.json');
  const settings = await readJsonObject(settingsPath);
  await writeJsonObject(settingsPath, {
    ...settings,
    theme: typeof settings['theme'] === 'string' ? settings['theme'] : 'dark',
    skipDangerousModePermissionPrompt: true,
    permissions: {
      allow: [
        'Bash(*)', 'Read(*)', 'Write(*)', 'Edit(*)', 'Glob(*)', 'Grep(*)',
        'WebFetch(*)', 'WebSearch(*)', 'Agent(*)', 'Skill(*)',
        'TodoRead', 'TodoWrite',
      ],
      deny: [],
      ...recordObject(settings['permissions']),
    },
  });

  const configPath = join(home, '.claude.json');
  const config = await readJsonObject(configPath);
  approveClaudeCustomApiKey(config, env);
  const projects = recordObject(config['projects']);
  const projectPath = resolve(cwd).replace(/\\/g, '/');
  const project = recordObject(projects[projectPath]);
  projects[projectPath] = {
    allowedTools: [],
    mcpContextUris: [],
    mcpServers: {},
    enabledMcpjsonServers: [],
    disabledMcpjsonServers: [],
    hasClaudeMdExternalIncludesApproved: false,
    hasClaudeMdExternalIncludesWarningShown: false,
    ...project,
    projectOnboardingSeenCount: numberAtLeast(project['projectOnboardingSeenCount'], 1),
    hasTrustDialogAccepted: true,
    hasCompletedProjectOnboarding: true,
    lastVersionBase: AUTOMATION_CLAUDE_ONBOARDING_VERSION,
  };
  await writeJsonObject(configPath, {
    ...config,
    numStartups: numberAtLeast(config['numStartups'], 1),
    hasCompletedOnboarding: true,
    lastOnboardingVersion: AUTOMATION_CLAUDE_ONBOARDING_VERSION,
    lastReleaseNotesSeen: AUTOMATION_CLAUDE_ONBOARDING_VERSION,
    hasIdeOnboardingBeenShown: { vscode: true, ...recordObject(config['hasIdeOnboardingBeenShown']) },
    officialMarketplaceAutoInstallAttempted: true,
    officialMarketplaceAutoInstalled: true,
    projects,
  });
}

async function prepareCodexAutomationState(cwd: string): Promise<void> {
  const home = automationHome();
  if (!home) return;
  const { join, resolve, dirname } = await import('node:path');
  const fs = await import('node:fs/promises');
  const configPath = join(home, '.codex', 'config.toml');
  await fs.mkdir(dirname(configPath), { recursive: true });
  let config = '';
  try {
    config = await fs.readFile(configPath, 'utf8');
  } catch {
    config = '';
  }
  const projectPath = resolve(cwd);
  const basicKey = JSON.stringify(projectPath);
  const literalKey = `'${projectPath}'`;
  if (config.includes(`[projects.${basicKey}]`) || config.includes(`[projects.${literalKey}]`)) return;
  const prefix = config.trimEnd();
  const addition = `[projects.${basicKey}]\ntrust_level = "trusted"\n`;
  await fs.writeFile(configPath, `${prefix}${prefix ? '\n\n' : ''}${addition}`);
}

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

  // Bridge flags: --bridge-interactive and --bridge-hooks
  const bridgeInteractive = flagBool(args.flags, 'bridge-interactive') === true;
  const bridgeHooks = flagBool(args.flags, 'bridge-hooks') === true;

  if (bridgeInteractive && isInteractive) {
    const msg = '--bridge-interactive requires --no-interactive';
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  if (bridgeHooks && isInteractive) {
    const msg = '--bridge-hooks requires --no-interactive';
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  if (bridgeInteractive) {
    try {
      const { getBridgeCapabilities } = await import('@a5c-ai/agent-catalog');
      const caps = getBridgeCapabilities(plan.harness);
      if (!caps?.interactiveBridge) {
        const msg = `${plan.harness} does not support interactive bridging`;
        if (jsonMode) printJsonError('CAPABILITY_ERROR', msg);
        else printError(msg);
        return ExitCode.USAGE_ERROR;
      }
    } catch {
      // agent-catalog not available — skip capability check
    }
  }

  // Append session/prompt args
  const prompt = flagStr(args.flags, 'prompt');
  appendHarnessSessionArgs(plan, {
    resumeId: flagStr(args.flags, 'resume'),
    sessionId: flagStr(args.flags, 'session-id'),
    prompt,
    maxTurns: flagNum(args.flags, 'max-turns'),
    interactive: isInteractive || bridgeInteractive,
    bridgeInteractive,
  });

  // Add --model for harnesses that accept it as a CLI arg
  const modelFlag = flagStr(args.flags, 'model');
  if (modelFlag && ['pi', 'gemini', 'opencode'].includes(plan.harness)) {
    plan.args.push('--model', modelFlag);
  }

  // --yolo: add harness-specific auto-approve flags resolved through
  // agent-catalog → atlas graph (LaunchConfig records with commArgs)
  if (flagBool(args.flags, 'yolo')) {
    try {
      const { getYoloLaunchArgs } = await import('@a5c-ai/agent-catalog');
      const yoloArgs = getYoloLaunchArgs(plan.harness);
      if (yoloArgs.length > 0) {
        plan.args.push(...yoloArgs);
      }
    } catch {
      // agent-catalog not available
    }
  }

  // Passthrough args after --
  const dashDashIdx = process.argv.indexOf('--');
  if (dashDashIdx >= 0) {
    plan.args.push(...process.argv.slice(dashDashIdx + 1));
  }
  // Also check parsed positionals for -- separator (handles spawn() without shell)
  const argsDashIdx = args.positionals.indexOf('--');
  if (argsDashIdx >= 0) {
    plan.args.push(...args.positionals.slice(argsDashIdx + 1));
  }

  // Launch runtime if needed
  let proxyRuntime: TransportMuxRuntime | undefined;
  if (plan.proxyNeeded && plan.proxy) {
    try {
      // When exposed transport differs from target (e.g., anthropic→foundry),
      // the proxy needs a completion engine to translate request/response formats.
      let completionEngine;
      if ((plan.proxy.targetProvider === 'google' || plan.proxy.targetProvider === 'vertex') && plan.proxy.apiKey) {
        const { createGoogleCompletionEngine } = await import('./launch-completion-engine.js');
        completionEngine = createGoogleCompletionEngine({
          apiBase: plan.proxy.useVertexAi ? undefined : plan.proxy.apiBase,
          apiKey: plan.proxy.apiKey,
          targetModel: plan.proxy.targetModel,
          provider: plan.proxy.targetProvider,
          project: plan.proxy.project,
          location: plan.proxy.location,
          useVertexAi: plan.proxy.useVertexAi,
        });
      } else if (plan.proxy.apiBase && plan.proxy.apiKey) {
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

  // Bridge hooks: emulate lifecycle hooks when --bridge-hooks is set
  let bridgeHookEmulator: import('./launch-bridge-hooks.js').BridgeHookEmulator | undefined;
  if (bridgeHooks) {
    const { BridgeHookEmulator } = await import('./launch-bridge-hooks.js');
    bridgeHookEmulator = new BridgeHookEmulator({
      harness: plan.harness,
      cwd: launchCwd,
      env: plan.env,
      sessionId: flagStr(args.flags, 'session-id'),
      runsDir: plan.env['BABYSITTER_RUNS_DIR'] || undefined,
      verbose: flagBool(args.flags, 'debug') === true,
    });
    await bridgeHookEmulator.emulateSessionStart();
  }

  await prepareHarnessAutomationState(plan.harness, launchCwd, plan.env);

  // Spawn harness

  let child: import('node:child_process').ChildProcess = null as any;
  let ptyProcess: any = null;

  if (isInteractive) {
    // Interactive mode: full TTY passthrough. If a prompt is provided, it's
    // injected as initial stdin after the harness starts (like typing it in).
    try {
      const nodePty: any = await import('node-pty');
      ptyProcess = nodePty.spawn(plan.command, plan.args, {
        name: 'xterm-256color',
        cols: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
        cwd: launchCwd,
        env: { ...process.env, ...plan.env } as Record<string, string>,
      });

      // End-of-turn detection: parse PTY output through adapter's event system
      let turnDetected = false;
      let lineBuf = '';
      let assembler: any = null;
      let adapter: any = null;
      try {
        const core = await import('@a5c-ai/agent-mux-core');
        assembler = new core.StreamAssembler();
        // Resolve the adapter for this harness to use its parseEvent
        const adaptersModule = await import('@a5c-ai/agent-mux-adapters');
        const factory = adaptersModule.getAdapterFactory?.(plan.harness);
        adapter = factory ? factory() : null;
      } catch { /* core/adapters not available */ }

      // Pipe PTY to stdout + feed through event parser for turn detection
      ptyProcess.onData((data: string) => {
        process.stdout.write(data);
        if (!assembler || !adapter || turnDetected) return;

        // Strip ANSI escapes, then feed lines to the event parser
        const clean = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
        lineBuf += clean;
        let idx: number;
        while ((idx = lineBuf.indexOf('\n')) !== -1) {
          const line = lineBuf.slice(0, idx).replace(/\r$/, '');
          lineBuf = lineBuf.slice(idx + 1);
          if (line.length === 0) continue;

          const assembled = assembler.feed(line);
          if (assembled === null) continue;
          try {
            const ctx = { runId: 'launch', agent: plan.harness, sessionId: undefined, turnIndex: 0, debug: false, outputFormat: 'text', source: 'stdout', assembler, eventCount: 0, lastEventType: null, adapterState: {} };
            const result = adapter.parseEvent(assembled, ctx);
            if (result === null) continue;
            const events = Array.isArray(result) ? result : [result];
            for (const ev of events) {
              // Detect turn completion events
              if (ev.type === 'message_stop' || ev.type === 'turn_end' || ev.type === 'session_end') {
                turnDetected = true;
                // Give the harness a moment to flush output, then kill
                setTimeout(() => {
                  try { ptyProcess.kill('SIGTERM'); } catch { /* */ }
                }, 1000);
                return;
              }
            }
          } catch { /* parse error — ignore */ }
        }
      });
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
  } else if (bridgeInteractive) {
    // Bridge-interactive: spawn via PTY like interactive mode, but:
    // - No human stdin forwarding
    // - Parse PTY output via adapter for structured events
    // - Emit events as NDJSON to stdout
    // - Auto-kill on turn completion
    // - Buffer PTY output to avoid pipe deadlock (stdout is piped)

    // Pre-create full Claude Code automation state to skip all onboarding prompts
    if (plan.harness === 'claude') {
      await prepareClaudeAutomationState(launchCwd, plan.env);
    }

    let nodePty: any;
    try {
      nodePty = await import('node-pty');
    } catch {
      const msg = '--bridge-interactive requires node-pty but it is not available. Install it with: npm install node-pty';
      if (jsonMode) printJsonError('SPAWN_ERROR', msg);
      else printError(msg);
      return ExitCode.GENERAL_ERROR;
    }

    ptyProcess = nodePty.spawn(plan.command, plan.args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: launchCwd,
      env: { ...process.env, ...plan.env } as Record<string, string>,
    });

    // Set up adapter + assembler for parsing PTY output into structured events
    let assembler: import('@a5c-ai/agent-mux-core').StreamAssembler | null = null;
    let adapter: { parseEvent(line: string, ctx: any): any } | null = null;
    try {
      const core = await import('@a5c-ai/agent-mux-core');
      assembler = new core.StreamAssembler();
      const adaptersModule = await import('@a5c-ai/agent-mux-adapters');
      const factory = adaptersModule.getAdapterFactory?.(plan.harness);
      adapter = factory ? factory() : null;
    } catch { /* core/adapters not available — raw output only */ }

    /** Emit a bridge event as NDJSON, deferred to avoid blocking PTY callback. */
    function emitBridgeEvent(event: {
      type: string;
      timestamp: string;
      data: unknown;
    }): void {
      const line = JSON.stringify(event) + '\n';
      setImmediate(() => {
        try { process.stdout.write(line); } catch { /* stdout closed */ }
      });
    }

    let turnComplete = false;
    let lineBuf = '';
    let outputBuf = '';
    let eventCount = 0;
    let apiKeyPromptHandled = false;
    let bypassPromptHandled = false;

    const parseCtx = {
      runId: 'bridge',
      agent: plan.harness,
      sessionId: undefined,
      turnIndex: 0,
      debug: false,
      outputFormat: 'text' as const,
      source: 'stdout' as const,
      assembler: assembler!,
      eventCount: 0,
      lastEventType: null as string | null,
      adapterState: {},
    };

    ptyProcess.onData((data: string) => {
      // Buffer all PTY output — never write synchronously to stdout (pipe deadlock)
      outputBuf += data;

      // Auto-respond to Claude Code interactive prompts that block automation.
      // ANSI cursor-move codes replace spaces, so stripped text is concatenated.
      const stripped = outputBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      if (!apiKeyPromptHandled && stripped.includes('usethisAPIkey')) {
        apiKeyPromptHandled = true;
        // Default is "No (recommended)". Send Up arrow + Enter to select "Yes".
        setTimeout(() => ptyProcess.write('\x1b[A\r'), 200);
      }
      if (!bypassPromptHandled && stripped.includes('BypassPermissionsmode')) {
        bypassPromptHandled = true;
        // Default is "No, exit". Send Down arrow + Enter to select "Yes, I accept".
        setTimeout(() => ptyProcess.write('\x1b[B\r'), 200);
      }

      if (!assembler || !adapter || turnComplete) return;

      // Strip ANSI escapes, then feed lines to the event parser
      const clean = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
      lineBuf += clean;

      let idx: number;
      while ((idx = lineBuf.indexOf('\n')) !== -1) {
        const line = lineBuf.slice(0, idx).replace(/\r$/, '');
        lineBuf = lineBuf.slice(idx + 1);
        if (line.length === 0) continue;

        const assembled = assembler.feed(line);
        if (assembled === null) continue;
        try {
          parseCtx.eventCount = eventCount;
          const result = adapter.parseEvent(assembled, parseCtx);
          if (result === null) continue;
          const events = Array.isArray(result) ? result : [result];
          for (const ev of events) {
            eventCount++;
            parseCtx.lastEventType = ev.type;

            // Emit as NDJSON bridge event
            emitBridgeEvent({
              type: ev.type,
              timestamp: new Date().toISOString(),
              data: ev,
            });

            // Detect turn completion events — schedule PTY termination
            if (ev.type === 'message_stop' || ev.type === 'turn_end' || ev.type === 'session_end') {
              turnComplete = true;
              setTimeout(() => {
                try { ptyProcess.kill('SIGTERM'); } catch { /* */ }
              }, 1000);
              return;
            }
          }
        } catch { /* parse error — ignore */ }
      }
    });

    // Inject prompt after all onboarding prompts are dismissed.
    // If API key or bypass prompts appear, wait for them before sending the task.
    if (prompt) {
      const injectPrompt = () => ptyProcess.write(prompt + '\n');
      const checkAndInject = () => {
        if (apiKeyPromptHandled || bypassPromptHandled) {
          // Give Claude Code time to process the prompt response before injecting task
          setTimeout(injectPrompt, 2000);
        } else {
          const stripped = outputBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
          if (outputBuf.length > 0 && !stripped.includes('APIkey') && !stripped.includes('Bypass')) {
            injectPrompt();
          } else {
            setTimeout(checkAndInject, 500);
          }
        }
      };
      setTimeout(checkAndInject, 500);
    }

    // Create a fake ChildProcess-like for signal handling
    child = { pid: ptyProcess.pid, kill: (sig: string) => ptyProcess.kill(sig) } as any;

    // On PTY exit, flush remaining buffered text as a final output event
    const origOnExit = ptyProcess.onExit.bind(ptyProcess);
    const exitPromise = new Promise<number>((resolve) => {
      origOnExit(({ exitCode: code }: { exitCode: number }) => {
        // Flush any remaining output as a final bridge event
        if (outputBuf.length > 0) {
          emitBridgeEvent({
            type: 'output',
            timestamp: new Date().toISOString(),
            data: { text: outputBuf },
          });
          outputBuf = '';
        }
        resolve(code);
      });
    });

    // Store the exit promise so main exit handler can use it
    (child as any).__bridgeExitPromise = exitPromise;
  } else {
    // Non-interactive: plain spawn. Each harness handles non-interactive mode
    // internally (claude -p, codex exec, gemini --prompt, pi stdin).
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
    } else if (ptyProcess) {
      // PTY child runs in its own session — kill the process group to avoid orphans
      try { process.kill(-ptyProcess.pid, sig); } catch { /* */ }
      try { ptyProcess.kill(sig); } catch { /* */ }
    } else {
      child.kill(sig);
    }
  };
  process.on('SIGINT', forwardSignal);
  process.on('SIGTERM', forwardSignal);
  // Ensure PTY cleanup on exit
  if (ptyProcess) {
    process.on('exit', () => { try { ptyProcess.kill('SIGKILL'); } catch { /* */ } });
  }

  const promptPassedAsFlag = (plan.harness === 'pi' && !isInteractive && plan.args.includes('--prompt'));
  if (prompt && child.stdin && !ptyProcess && !promptPassedAsFlag) {
    child.stdin.write(prompt + '\n');
    if (!isInteractive) {
      child.stdin.end();
    } else {
      // Interactive with stdin pipe (no PTY): reconnect terminal stdin after prompt injection
      process.stdin.resume();
      process.stdin.pipe(child.stdin);
    }
  }
  // Close stdin for harnesses where prompt was passed as a CLI flag (not via stdin)
  // to prevent the process from hanging waiting for interactive input.
  if (promptPassedAsFlag && child.stdin && !ptyProcess) {
    child.stdin.end();
  }

  const exitCode = await (
    (child as any).__bridgeExitPromise
      ? (child as any).__bridgeExitPromise as Promise<number>
      : new Promise<number>((resolve) => {
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
        })
  );

  process.off('SIGINT', forwardSignal);
  process.off('SIGTERM', forwardSignal);

  // Bridge hooks: emulate stop hook and re-spawn if shouldContinue
  if (bridgeHookEmulator) {
    let stopResult = await bridgeHookEmulator.emulateStop();
    while (stopResult.shouldContinue && stopResult.resumeId) {
      // Re-spawn with --resume to continue the session
      const resumePlan = { ...plan, args: [...plan.args] };
      appendHarnessSessionArgs(resumePlan, {
        resumeId: stopResult.resumeId,
        interactive: false,
      });

      const { spawn: resumeSpawn } = await import('node:child_process');
      const resumeChild = resumeSpawn(resumePlan.command, resumePlan.args, {
        stdio: ['pipe', 'inherit', 'inherit'],
        env: { ...process.env, ...resumePlan.env },
        cwd: launchCwd,
        shell: process.platform === 'win32',
      });

      if (resumeChild.stdin) {
        resumeChild.stdin.end();
      }

      await new Promise<number>((resolve) => {
        resumeChild.on('exit', (code: number | null, signal: string | null) => {
          resolve(signal ? 128 + (signal === 'SIGINT' ? 2 : 15) : (code ?? 1));
        });
      });

      stopResult = await bridgeHookEmulator.emulateStop();
    }

    await bridgeHookEmulator.emulateSessionEnd();
  }

  if (proxyRuntime) {
    await proxyRuntime.stop();
  }

  return exitCode;
}
