/**
 * `amux launch` command implementation.
 *
 * Resolves a launch plan for a given harness+provider combination,
 * optionally starts the transport-mux runtime, then exec-forks the harness with
 * stdin/stdout passthrough and proper signal forwarding.
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-comm';
import {
  resolveProvider,
  resolveWorkspaceDefaultCwd,
  WorkspaceService,
} from '@a5c-ai/agent-mux-comm';
import type { ProviderId, TransportId } from '@a5c-ai/agent-mux-comm';
import { translateForHarness } from '@a5c-ai/agent-mux-adapters';
import {
  getLaunchBehavior,
  getAutomationEnv,
  getBridgeCapabilities,
  getYoloLaunchArgs,
} from '@a5c-ai/atlas/catalog';
import { startTransportMuxRuntime } from '@a5c-ai/agent-mux-transport';
import type { TransportMuxRuntime } from '@a5c-ai/agent-mux-transport';
import type { ParsedArgs, FlagDef } from './cli-helpers.js';
import { flagStr, flagNum, flagBool, flagArr } from './cli-helpers.js';
import { ExitCode } from './cli-helpers.js';
import { printError, printJsonError } from './cli-helpers.js';
import { resolve as resolvePath } from 'node:path';

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

export const PROMPT_ARTIFACT_MONITOR_TIMEOUT_MS = process.platform === 'win32' ? 2_700_000 : 900_000;

// ---------------------------------------------------------------------------
// Plan resolution
// ---------------------------------------------------------------------------

const CLI_COMMAND_MAP: Record<string, string> = {
  'copilot': 'gh copilot',
  'cursor': 'cursor-agent',
  'tula': 'tula yolo',
};

function resolveCliCommand(harness: string): { command: string; prefixArgs: string[] } {
  const cli = CLI_COMMAND_MAP[harness] ?? harness;
  const parts = cli.split(/\s+/);
  return { command: parts[0]!, prefixArgs: parts.slice(1) };
}

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
        useVertexAi: providerConfig.provider === 'vertex',
      }
    : undefined;

  const resolved = resolveCliCommand(input.harness);

  return {
    harness: input.harness,
    provider: providerConfig.provider,
    transport: providerConfig.transport,
    model: providerConfig.model,
    proxyNeeded,
    proxyReason,
    proxy,
    command: resolved.command,
    args: [...resolved.prefixArgs, ...translation.args],
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

function insertCodexOptionArgs(plan: LaunchPlan, optionArgs: string[]): void {
  if (plan.args[0] === 'exec') {
    plan.args.splice(1, 0, ...optionArgs);
    return;
  }
  plan.args.push(...optionArgs);
}
function appendHarnessSessionArgs(plan: LaunchPlan, session: SessionArgs): void {
  const interactive = session.interactive !== false;
  const lb = getLaunchBehavior(plan.harness);

  if (lb) {
    // Resume handling
    if (session.resumeId) {
      if (lb.resumeDelivery === 'subcommand' && lb.resumeSubcommand) {
        plan.args.unshift(lb.resumeSubcommand, session.resumeId);
      } else if (lb.resumeDelivery === 'flag' && lb.resumeFlag) {
        plan.args.push(lb.resumeFlag, session.resumeId);
      }
    }

    // Session ID
    if (session.sessionId && lb.sessionIdFlag) {
      plan.args.push(lb.sessionIdFlag, session.sessionId);
    }

    // Prompt delivery (non-interactive only for cli-flag/exec-subcommand)
    if (session.prompt && !session.resumeId) {
      if (lb.promptDelivery === 'cli-flag' && lb.promptFlag && !interactive) {
        plan.args.push(lb.promptFlag, session.prompt, ...(lb.promptExtraFlags ?? []));
      } else if (lb.promptDelivery === 'exec-subcommand' && lb.execSubcommand && !interactive) {
        plan.args.unshift(lb.execSubcommand, session.prompt);
      }
      // stdin delivery is handled after spawn via stdin.write()
    }

    // Max turns
    if (session.maxTurns && lb.maxTurnsFlag) {
      plan.args.push(lb.maxTurnsFlag, String(session.maxTurns));
    }
  } else {
    // Fallback for unknown harnesses: prompt via stdin (handled after spawn)
    if (session.resumeId) plan.args.push('--resume', session.resumeId);
    if (session.sessionId) plan.args.push('--session-id', session.sessionId);
    if (session.maxTurns) plan.args.push('--max-turns', String(session.maxTurns));
  }
}

// ---------------------------------------------------------------------------
// Windows spawn resolution — find the actual binary so we don't need shell:true
// which mangles arguments containing special characters.
// ---------------------------------------------------------------------------

function escapeCmdArg(arg: string): string {
  if (!/[\s&|<>^()%!"',;]/.test(arg)) return arg;
  // Escape internal double quotes and wrap in double quotes for cmd.exe
  return '"' + arg.replace(/"/g, '""') + '"';
}

async function resolveSpawnCommand(command: string, args: string[]): Promise<{ command: string; args: string[]; shell: boolean }> {
  if (process.platform !== 'win32') {
    // On macOS/Linux, resolve wrapper scripts to their underlying binary.
    // node-pty's posix_spawnp can fail on some script wrappers.
    try {
      const { execSync } = await import('node:child_process');
      const whichOutput = execSync(`which ${command}`, { encoding: 'utf8', timeout: 5000 }).trim();
      if (whichOutput) {
        const { readFileSync, statSync } = await import('node:fs');
        const stat = statSync(whichOutput);
        console.error(`[amux launch] which ${command} → ${whichOutput} (${stat.size} bytes, mode ${stat.mode.toString(8)})`);
        const content = readFileSync(whichOutput, 'utf8').slice(0, 500);
        console.error(`[amux launch] script content (first 200): ${content.slice(0, 200).replace(/\n/g, '\\n')}`);
        // Bash wrapper scripts (e.g. CI-generated shims): extract the node script path
        const execNodeMatch = content.match(/exec\s+node\s+"([^"]+)"/);
        if (execNodeMatch?.[1]) {
          console.error(`[amux launch] resolved wrapper → node ${execNodeMatch[1]}`);
          return { command: process.execPath, args: [execNodeMatch[1], ...args], shell: false };
        }
        // Also handle: node "path" or exec "path/node" "script"
        const nodeScriptMatch = content.match(/(?:exec\s+)?(?:"\$[^"]*node[^"]*"|node)\s+"([^"]+\.js)"/);
        if (nodeScriptMatch?.[1]) {
          console.error(`[amux launch] resolved wrapper → node ${nodeScriptMatch[1]}`);
          return { command: process.execPath, args: [nodeScriptMatch[1], ...args], shell: false };
        }
        return { command: whichOutput, args, shell: false };
      }
    } catch { /* which failed, use original */ }
    return { command, args, shell: false };
  }
  const { execSync } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  try {
    const whereOutput = execSync(`where ${command}`, { encoding: 'utf8', timeout: 5000 });
    const allPaths = whereOutput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Prefer .exe > .cmd > .ps1 > extensionless (npm bash shim won't work with shell:false)
    const resolved = allPaths.find(p => /\.exe$/i.test(p))
      ?? allPaths.find(p => /\.(cmd|bat)$/i.test(p))
      ?? allPaths.find(p => /\.(ps1|js)$/i.test(p))
      ?? allPaths[0];
    console.error(`[amux launch] where ${command} → ${allPaths.join(', ')} (selected: ${resolved})`);
    if (resolved) {
      if (/\.js$/i.test(resolved)) {
        return { command: process.execPath, args: [resolved, ...args], shell: false };
      }
      if (/\.(cmd|bat)$/i.test(resolved)) {
        // Parse the .cmd shim to find the actual binary (.js or .exe) and
        // spawn directly to avoid cmd.exe/powershell argument mangling.
        const { readFileSync } = await import('node:fs');
        const pathMod = await import('node:path');
        try {
          const cmdContent = readFileSync(resolved, 'utf8');
          console.error(`[amux launch] .cmd content (first 300): ${cmdContent.slice(0, 300).replace(/\n/g, '\\n')}`);
          // Look for .js entry point (node/npm packages)
          const cmdDir = pathMod.dirname(resolved);
          const jsMatch = cmdContent.match(/"([^"]+\.js)"/);
          if (jsMatch?.[1]) {
            // npm .cmd shims use %dp0% for the .cmd file's directory
            const jsRaw = jsMatch[1].replace(/%~?dp0%/gi, cmdDir + pathMod.sep);
            const jsPath = pathMod.resolve(cmdDir, jsRaw);
            if (existsSync(jsPath)) {
              console.error(`[amux launch] resolved .cmd → .js: ${jsPath}`);
              return { command: process.execPath, args: [jsPath, ...args], shell: false };
            }
          }
          // Look for .exe reference (Bun-compiled packages like Claude Code)
          // npm .cmd shims use %dp0% or %~dp0 for the directory
          const exeMatch = cmdContent.match(/"%(?:~?dp0)%\\([^"]+\.exe)"/);
          if (exeMatch?.[1]) {
            const exePath = pathMod.resolve(cmdDir, exeMatch[1]);
            if (existsSync(exePath)) {
              const { statSync } = await import('node:fs');
              const exeSize = statSync(exePath).size;
              if (exeSize > 10240) {
                console.error(`[amux launch] resolved .cmd → .exe: ${exePath} (${exeSize} bytes)`);
                return { command: exePath, args, shell: false };
              } else {
                console.error(`[amux launch] .exe shim too small (${exeSize} bytes), using .cmd fallback`);
              }
            }
          }
        } catch { /* couldn't parse .cmd */ }
        // Fallback: invoke .cmd via cmd.exe /c with shell:false to avoid
        // Node.js shell:true double-quoting (Node wraps in outer quotes for
        // cmd /s /c "...", which breaks inner escaped quotes in args).
        const quoteIfNeeded = (s: string) => s.includes(' ') || /[&|<>^()%!"',;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        console.error(`[amux launch] .cmd fallback raw args (${args.length}): ${args.map((a, i) => `[${i}]=${a.length > 50 ? a.slice(0, 50) + '...' : a}`).join(' ')}`);
        const cmdLine = `${quoteIfNeeded(resolved)} ${args.map(quoteIfNeeded).join(' ')}`;
        console.error(`[amux launch] .cmd fallback cmdLine (first 500): ${cmdLine.slice(0, 500)}`);
        return { command: process.env['ComSpec'] ?? 'cmd.exe', args: ['/c', cmdLine], shell: false };
      }
      if (/\.exe$/i.test(resolved)) {
        return { command: resolved, args, shell: false };
      }
      // Resolved path has no recognized extension — try it directly without shell
      return { command: resolved, args, shell: false };
    }
  } catch (err) {
    console.error(`[amux launch] where ${command} failed: ${err instanceof Error ? err.message : err}`);
  }
  return { command, args: args.map(escapeCmdArg), shell: true };
}

// ---------------------------------------------------------------------------
// Provider auth validation helper
// ---------------------------------------------------------------------------


async function prepareHarnessAutomationState(harness: string, cwd: string, env: Record<string, string>): Promise<void> {
  if (!isAutomationPreseedEnabled(env)) return;
  if (harness === 'claude') await prepareClaudeAutomationState(cwd, env);
  if (harness === 'codex') await prepareCodexAutomationState(cwd);
  const automationEnv = getAutomationEnv(harness);
  for (const [key, value] of Object.entries(automationEnv)) {
    if (typeof value === 'string') env[key] = value;
  }
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

async function prepareHermesConfig(input: {
  readonly model: string;
  readonly provider: string;
  readonly baseUrl?: string;
  readonly apiKey?: string;
}): Promise<void> {
  const { homedir } = await import('node:os');
  const { join } = await import('node:path');
  const fs = await import('node:fs/promises');
  const hermesHome = join(homedir(), '.hermes');
  await fs.mkdir(hermesHome, { recursive: true });
  const yamlValue = (value: string) => JSON.stringify(value);
  const lines = [
    'model:',
    `  default: ${yamlValue(input.model)}`,
    `  provider: ${yamlValue(input.provider)}`,
  ];
  if (input.baseUrl) lines.push(`  base_url: ${yamlValue(input.baseUrl)}`);
  if (input.apiKey) lines.push(`  api_key: ${yamlValue(input.apiKey)}`);
  lines.push('');
  await fs.writeFile(join(hermesHome, 'config.yaml'), lines.join('\n'));
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

function extractPromptArtifactPaths(prompt: string | undefined, cwd: string): string[] {
  if (!prompt) return [];
  const matches = prompt.matchAll(/(?:^|[\s`"'])((?:\.\/)?\.a5c-live-test\/[^\s`"')]+)/g);
  const paths = new Set<string>();
  for (const match of matches) {
    const cleaned = match[1]?.replace(/[.,;:!?]+$/, '');
    if (!cleaned) continue;
    paths.add(resolvePath(cwd, cleaned.replace(/^\.\//, '')));
  }
  return [...paths];
}

function promptRequiresBabysitterCompletion(prompt: string | undefined): boolean {
  return typeof prompt === 'string' && /(babysitter|\.a5c\/processes)/i.test(prompt);
}

function promptInvokesBabysitterSlashCommand(prompt: string | undefined): boolean {
  return typeof prompt === 'string' && /(?:^|\s)[/$]babysitter:[\w-]+/.test(prompt);
}

function buildBabysitterSkillFollowupPrompt(prompt: string | undefined): string {
  const originalRequest = (prompt ?? '').replace(/\s+/g, ' ').trim();
  return [
    'Continue the Babysitter command now; do not answer in prose and do not call the Skill tool again.',
    'Use the Bash tool now with this exact command: babysitter instructions:babysit-skill --harness claude-code --no-interactive',
    'Then follow the returned CLI instructions for the original /babysitter request until completion proof is produced.',
    originalRequest ? `Original /babysitter request: ${originalRequest}` : '',
  ].filter(Boolean).join(' ');
}

function stripTerminalControl(input: string): string {
  return input.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, '');
}

async function hasCompletedBabysitterRun(cwd: string): Promise<boolean> {
  const fs = await import('node:fs/promises');
  const { join } = await import('node:path');
  const runsDir = join(cwd, '.a5c', 'runs');
  let runIds: string[];
  try {
    runIds = await fs.readdir(runsDir);
  } catch {
    return false;
  }
  for (const runId of runIds.slice(-20).reverse()) {
    try {
      const runRaw = await fs.readFile(join(runsDir, runId, 'run.json'), 'utf8');
      const runMeta = JSON.parse(runRaw) as Record<string, unknown>;
      const metadata = recordObject(runMeta['metadata']);
      const proof = metadata['completionProof'] ?? runMeta['completionProof'];
      const processId = runMeta['processId'] ?? metadata['processId'];
      if (!proof || !processId || processId === 'bare-run') continue;
      const journalDir = join(runsDir, runId, 'journal');
      const journalFiles = await fs.readdir(journalDir);
      for (const journalFile of journalFiles) {
        const journal = await fs.readFile(join(journalDir, journalFile), 'utf8');
        if (journal.includes('RUN_COMPLETED')) return true;
      }
    } catch {
      // ignore incomplete runs while the harness is still flushing state
    }
  }
  return false;
}

function startPromptArtifactCompletionMonitor(input: {
  readonly prompt: string | undefined;
  readonly cwd: string;
  readonly onComplete: () => void;
}): ReturnType<typeof setInterval> | undefined {
  const expectedPaths = extractPromptArtifactPaths(input.prompt, input.cwd);
  if (expectedPaths.length === 0) return undefined;
  const requireBabysitterCompletion = promptRequiresBabysitterCompletion(input.prompt);
  const lastSizes = new Map<string, number>();
  const startedAt = Date.now();
  return setInterval(() => {
    void (async () => {
      if (Date.now() - startedAt > PROMPT_ARTIFACT_MONITOR_TIMEOUT_MS) {
        console.error(`[amux launch] artifact monitor timed out after ${PROMPT_ARTIFACT_MONITOR_TIMEOUT_MS / 1000}s — forcing completion`);
        input.onComplete();
        return;
      }
      const fs = await import('node:fs/promises');
      for (const expectedPath of expectedPaths) {
        try {
          const stat = await fs.stat(expectedPath);
          if (!stat.isFile() || stat.size <= 0) continue;
          if (lastSizes.get(expectedPath) === stat.size) {
            if (!requireBabysitterCompletion || await hasCompletedBabysitterRun(input.cwd)) {
              input.onComplete();
              return;
            }
          }
          lastSizes.set(expectedPath, stat.size);
        } catch {
          // expected artifact not written yet
        }
      }
    })();
  }, 1000);
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

  // Validate harness exists (via adapter registry or agent-catalog launch behavior)
  const adapter = client.adapters.get(harness);
  const catalogLaunchBehavior = getLaunchBehavior(harness);
  if (!adapter && !catalogLaunchBehavior) {
    const available = client.adapters.list().map((a) => a.agent).join(', ');
    const msg = `Unknown harness '${harness}'. Available: ${available}`;
    if (jsonMode) printJsonError('AGENT_NOT_FOUND', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  // Check harness is installed (only for adapter-backed harnesses)
  if (adapter?.detectInstallation) {
    const installResult = await adapter.detectInstallation();
    if (!installResult.installed) {
      const installCmd = adapter.capabilities?.installMethods?.[0]?.command ?? `npm install -g ${harness}`;
      const msg = `${harness} is not installed. Install with: ${installCmd}`;
      if (jsonMode) printJsonError('AGENT_NOT_FOUND', msg);
      else printError(msg);
      return ExitCode.USAGE_ERROR;
    }
  }

  if (flagStr(args.flags, 'resume') && adapter?.capabilities && !adapter.capabilities.canResume) {
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
    const defaults = (await import('@a5c-ai/agent-mux-comm')).PROVIDER_DEFAULTS;
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
    const caps = getBridgeCapabilities(plan.harness);
    if (!caps?.interactiveBridge) {
      const msg = `${plan.harness} does not support interactive bridging`;
      if (jsonMode) printJsonError('CAPABILITY_ERROR', msg);
      else printError(msg);
      return ExitCode.USAGE_ERROR;
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
  const codexModelFlag = modelFlag ?? (plan.harness === 'codex' ? plan.model : undefined);
  if (codexModelFlag && plan.harness === 'codex') {
    insertCodexOptionArgs(plan, ['-m', codexModelFlag]);
  } else if (modelFlag && ['pi', 'gemini', 'opencode'].includes(plan.harness)) {
    plan.args.push('--model', modelFlag);
  }

  // --yolo: add harness-specific auto-approve flags resolved through
  // agent-catalog → atlas graph (LaunchConfig records with commArgs)
  if (flagBool(args.flags, 'yolo')) {
    const yoloArgs = getYoloLaunchArgs(plan.harness);
    if (yoloArgs.length > 0) {
      plan.args.push(...yoloArgs);
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
      if ((plan.proxy.targetProvider === 'google' || plan.proxy.targetProvider === 'vertex')) {
        // Resolve the API key: prefer the explicitly resolved key from the proxy
        // plan, but fall back to reading GOOGLE_API_KEY / GEMINI_API_KEY from the
        // process environment so that CI secrets flow through even when
        // resolveProvider didn't capture them (e.g. the key was injected into the
        // runner env after provider resolution).
        const googleApiKey = plan.proxy.apiKey
          || process.env['GOOGLE_API_KEY']
          || process.env['GEMINI_API_KEY'];
        if (googleApiKey) {
          // Use Vertex AI mode when the provider is 'vertex' or when
          // GOOGLE_GENAI_USE_VERTEXAI is set (indicates the key is for Vertex AI,
          // not the Generative Language API).
          const useVertexAi = plan.proxy.targetProvider === 'vertex'
            || process.env['GOOGLE_GENAI_USE_VERTEXAI']?.toLowerCase() === 'true';
          const { createGoogleCompletionEngine } = await import('./completion-engine.js');
          const googleApiBase = useVertexAi ? undefined
            : (plan.proxy.apiBase && plan.proxy.apiBase.includes('googleapis.com') ? plan.proxy.apiBase : undefined);
          completionEngine = createGoogleCompletionEngine({
            apiBase: googleApiBase,
            apiKey: googleApiKey,
            targetModel: plan.proxy.targetModel,
            provider: plan.proxy.targetProvider,
            project: plan.proxy.project,
            location: plan.proxy.location,
            useVertexAi,
          });
        }
      } else if (plan.proxy.targetProvider === 'anthropic' && plan.proxy.apiKey) {
        const { createAnthropicCompletionEngine } = await import('./completion-engine.js');
        completionEngine = createAnthropicCompletionEngine({
          apiBase: plan.proxy.apiBase,
          apiKey: plan.proxy.apiKey,
          targetModel: plan.proxy.targetModel,
        });
      } else if (plan.proxy.apiBase && plan.proxy.apiKey) {
        const { createOpenAICompletionEngine } = await import('./completion-engine.js');
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
        // Gemini CLI, hermes, opencode don't send auth headers — disable proxy auth
        ...(['gemini', 'hermes', 'opencode'].includes(plan.harness) ? { authToken: null } : {}),
      });
      proxyRuntime.applyHarnessEnv(plan.env);
      if (plan.env['ANTHROPIC_API_KEY']) {
        plan.env['ANTHROPIC_AUTH_TOKEN'] = '';
      }

      // Gemini CLI: set GOOGLE_API_KEY to proxy token and GOOGLE_GEMINI_BASE_URL
      // to the proxy URL so gemini-cli connects through the transport-mux.
      // Note: GOOGLE_GEMINI_BASE_URL is the env var Gemini CLI reads for custom
      // API endpoints (see https://geminicli.com/docs/reference/configuration/).
      // The previously-used GOOGLE_AI_STUDIO_API_ENDPOINT was never recognised.
      if (plan.harness === 'gemini') {
        plan.env['GOOGLE_API_KEY'] = proxyRuntime.authToken ?? 'proxy-token';
        plan.env['GEMINI_API_KEY'] = proxyRuntime.authToken ?? 'proxy-token';
        const proxyOrigin = new URL(proxyRuntime.url).origin;
        plan.env['GOOGLE_GEMINI_BASE_URL'] = proxyOrigin;
        plan.env['GEMINI_CLI_TRUST_WORKSPACE'] = '1';
        plan.env['GOOGLE_GENAI_USE_VERTEXAI'] = 'false';
        plan.env['GOOGLE_CLOUD_PROJECT'] = '';
        plan.env['GOOGLE_CLOUD_LOCATION'] = '';
        console.error(`[amux launch] Gemini proxy: GOOGLE_API_KEY=${(plan.env['GOOGLE_API_KEY'] ?? '').slice(0, 8)}..., endpoint=${proxyOrigin}`);
      }

      // Tula (agent-core): set AMUX_* env vars to route through the proxy.
      // Use AMUX_API_BASE (non-Azure mode) so agent-core sends Authorization: Bearer
      // instead of api-key header. The proxy validates Bearer tokens.
      if (plan.harness === 'tula') {
        plan.env['AMUX_API_BASE'] = `${proxyRuntime.url}/v1`;
        plan.env['AMUX_API_KEY'] = proxyRuntime.authToken ?? 'proxy-token';
        plan.env['AMUX_MODEL'] = plan.proxy?.targetModel ?? plan.model ?? '';
        // Clear Azure env vars to prevent agent-core from using Azure mode
        delete plan.env['AZURE_API_KEY'];
        delete plan.env['AZURE_OPENAI_API_KEY'];
        delete plan.env['AZURE_OPENAI_PROJECT_NAME'];
        console.error(`[amux launch] Tula proxy: AMUX_API_BASE=${plan.env['AMUX_API_BASE']}, AMUX_MODEL=${plan.env['AMUX_MODEL']}`);
      }

      // Generic OpenAI-compatible harnesses: set OPENAI_API_KEY + OPENAI_BASE_URL
      // to route through the proxy for harnesses that use the openai-chat/responses transport.
      if (['codex', 'cursor', 'hermes', 'omp', 'openclaw', 'opencode'].includes(plan.harness)) {
        plan.env['OPENAI_API_KEY'] = proxyRuntime.authToken ?? 'proxy-token';
        plan.env['OPENAI_BASE_URL'] = `${proxyRuntime.url}/v1`;
        plan.env['OPENAI_API_BASE'] = `${proxyRuntime.url}/v1`;
        if (plan.harness === 'codex') {
          insertCodexOptionArgs(plan, [
            '-c', 'model_provider="amux-proxy"',
            '-c', 'model_providers.amux-proxy.name="amux-proxy"',
            '-c', `model_providers.amux-proxy.base_url="${proxyRuntime.url}/v1"`,
            '-c', 'model_providers.amux-proxy.env_key="OPENAI_API_KEY"',
            '-c', 'model_providers.amux-proxy.wire_api="responses"',
          ]);
        }
        // hermes provider flags handled outside the proxy block (below)
        console.error(`[amux launch] ${plan.harness} proxy: OPENAI_BASE_URL=${proxyRuntime.url}/v1`);
      }

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

  // Gemini: trust the workspace and skip the interactive trust prompt.
  if (plan.harness === 'gemini') {
    plan.env['GEMINI_CLI_TRUST_WORKSPACE'] = 'true';
    if (!plan.args.includes('--skip-trust')) {
      plan.args.push('--skip-trust');
    }
  }

  // Tula: ensure $HOME/.a5c/ exists — tula's SDK writes package.json there
  // on first run, and the atomic write fails on Windows if the dir is missing.
  if (plan.harness === 'tula') {
    const { mkdirSync } = await import('node:fs');
    const { join } = await import('node:path');
    const homeA5c = join(process.env['HOME'] ?? process.env['USERPROFILE'] ?? '/tmp', '.a5c');
    mkdirSync(homeA5c, { recursive: true });
    mkdirSync(join(launchCwd, '.a5c'), { recursive: true });
  }

  // Hermes: ensure pip user-bin is on PATH and configure platform-specific env.
  if (plan.harness === 'hermes') {
    const { homedir } = await import('node:os');
    const { join } = await import('node:path');
    const sep = process.platform === 'win32' ? ';' : ':';
    const home = homedir();
    const pipPaths = [
      join(home, '.local', 'bin'),
      ...(process.platform === 'darwin' ? [join(home, 'Library', 'Python', '3.12', 'bin'), join(home, 'Library', 'Python', '3.11', 'bin')] : []),
    ];
    const currentPath = plan.env['PATH'] ?? process.env['PATH'] ?? '';
    const missingPaths = pipPaths.filter(p => !currentPath.includes(p));
    if (missingPaths.length > 0) {
      const newPath = `${missingPaths.join(sep)}${sep}${currentPath}`;
      plan.env['PATH'] = newPath;
      process.env['PATH'] = newPath;
      console.error(`[amux launch] hermes: added pip paths to PATH: ${missingPaths.join(', ')}`);
    }
    if (process.platform === 'win32') {
      plan.env['TERM'] = '';
      plan.env['PYTHONUNBUFFERED'] = '1';
      const { writeFileSync, mkdirSync } = await import('node:fs');
      const { join } = await import('node:path');
      const patchDir = join(launchCwd, '.hermes-win-patch');
      mkdirSync(patchDir, { recursive: true });
      writeFileSync(join(patchDir, 'sitecustomize.py'), [
        'import sys, os',
        'if sys.platform == "win32":',
        '    try:',
        '        import prompt_toolkit.output.defaults as _ptd',
        '        _orig_create = _ptd.create_output',
        '        def _safe_create(*a, **kw):',
        '            try: return _orig_create(*a, **kw)',
        '            except Exception:',
        '                from prompt_toolkit.output.plain_text import PlainTextOutput',
        '                return PlainTextOutput(kw.get("stdout") or sys.stdout)',
        '        _ptd.create_output = _safe_create',
        '        import prompt_toolkit.output',
        '        prompt_toolkit.output.create_output = _safe_create',
        '        import prompt_toolkit.input.defaults as _pid',
        '        _orig_input = _pid.create_input',
        '        def _safe_input(*a, **kw):',
        '            try: return _orig_input(*a, **kw)',
        '            except Exception:',
        '                from prompt_toolkit.input.posixlike import PosixPipeInput',
        '                inp = PosixPipeInput()',
        '                import threading',
        '                def _bridge():',
        '                    try:',
        '                        while True:',
        '                            data = sys.stdin.buffer.read(1)',
        '                            if not data: break',
        '                            inp.feed(data.decode("utf-8", errors="replace"))',
        '                    except: pass',
        '                threading.Thread(target=_bridge, daemon=True).start()',
        '                return inp',
        '        _pid.create_input = _safe_input',
        '        import prompt_toolkit.input',
        '        prompt_toolkit.input.create_input = _safe_input',
        '    except Exception: pass',
      ].join('\n'));
      plan.env['PYTHONPATH'] = patchDir + (plan.env['PYTHONPATH'] ? `;${plan.env['PYTHONPATH']}` : '');
    }
  }
  if (plan.harness === 'hermes') {
    const targetProvider = plan.proxy?.targetProvider ?? plan.provider ?? '';
    const targetModel = plan.proxy?.targetModel ?? plan.model;
    // For providers that need proxy translation (foundry/Azure): use custom
    // provider pointed at the local proxy. Hermes custom provider speaks
    // OpenAI protocol; the proxy translates to Azure format.
    // For native providers (gemini, anthropic): use hermes built-in.
    const hermesProviderMap: Record<string, string> = {
      'google': 'gemini',
      'anthropic': 'anthropic',
    };
    const hermesProvider = hermesProviderMap[targetProvider] ?? 'custom';
    const proxyUrl = proxyRuntime ? `${proxyRuntime.url}/v1` : undefined;
    plan.args.push('--provider', hermesProvider, '--model', targetModel);
    await prepareHermesConfig({
      model: targetModel,
      provider: hermesProvider,
      baseUrl: proxyUrl,
      apiKey: proxyUrl ? 'proxy-token' : undefined,
    });
    console.error(`[amux launch] hermes: provider=${hermesProvider} model=${targetModel} baseUrl=${proxyUrl ?? 'default'}`);
  }

  // OpenCode: clear real OPENAI_API_KEY so it can't bypass proxy,
  // then prefix model with provider ID and write config file.
  if (plan.harness === 'opencode' && proxyRuntime) {
    delete plan.env['OPENAI_API_KEY'];
    plan.env['OPENAI_API_KEY'] = '';
  }
  // OpenCode model format is "provider/model" (e.g., "openai/gpt-5.5").
  if (plan.harness === 'opencode') {
    const modelIdx = plan.args.indexOf('--model');
    if (modelIdx >= 0 && modelIdx + 1 < plan.args.length) {
      const rawModel = plan.args[modelIdx + 1]!;
      if (!rawModel.includes('/')) {
        plan.args[modelIdx + 1] = `openai/${rawModel}`;
      }
    }
  }
  if (plan.harness === 'opencode' && plan.env['OPENCODE_CONFIG_CONTENT']) {
    const { writeFileSync, mkdirSync } = await import('node:fs');
    const { join } = await import('node:path');
    let configContent = plan.env['OPENCODE_CONFIG_CONTENT'];
    // Inject proxy baseURL into config if proxy is running
    if (proxyRuntime) {
      const proxyBase = `${proxyRuntime.url}/v1`;
      try {
        const parsed = JSON.parse(configContent);
        if (parsed.provider?.openai?.options) {
          parsed.provider.openai.options.baseURL = proxyBase;
        }
        configContent = JSON.stringify(parsed);
      } catch {
        configContent = configContent.replace(/"baseURL"\s*:\s*""/g, `"baseURL":"${proxyBase}"`);
      }
      plan.env['OPENAI_API_KEY'] = proxyRuntime.authToken ?? 'proxy-token';
      plan.env['OPENAI_BASE_URL'] = proxyBase;
      console.error(`[amux launch] opencode: injected proxy baseURL=${proxyBase}`);
    }
    const configPath = join(launchCwd, 'opencode.json');
    writeFileSync(configPath, configContent);
    plan.env['OPENCODE_CONFIG'] = configPath;
    const homeConfig = join(process.env['HOME'] ?? process.env['USERPROFILE'] ?? '/tmp', '.config', 'opencode');
    mkdirSync(homeConfig, { recursive: true });
    writeFileSync(join(homeConfig, 'opencode.json'), configContent);
    console.error(`[amux launch] opencode: wrote config to ${configPath} (OPENCODE_CONFIG set) and ${homeConfig}/opencode.json`);
    console.error(`[amux launch] opencode: config content: ${configContent}`);
  }

  // Cursor: pre-create ~/.cursor/auth.json so cursor-agent skips browser OAuth.
  // Runs outside the proxy block because cursor always needs auth, regardless
  // of whether the proxy was started.
  if (plan.harness === 'cursor') {
    const token = plan.env['CURSOR_API_KEY'] || 'proxy-token';
    plan.env['CURSOR_API_KEY'] = token;
    const { writeFileSync: wf, mkdirSync: md } = await import('node:fs');
    const { join: pj } = await import('node:path');
    const cursorDir = pj(process.env['HOME'] ?? process.env['USERPROFILE'] ?? '/tmp', '.cursor');
    md(cursorDir, { recursive: true });
    const auth = JSON.stringify({ accessToken: token, refreshToken: token, userId: 'ci-proxy', email: 'ci@proxy.local' });
    wf(pj(cursorDir, 'auth.json'), auth);
    wf(pj(cursorDir, 'credentials.json'), auth);
    console.error(`[amux launch] Cursor auth pre-seeded at ${cursorDir}/auth.json`);
  }

  // Bridge hooks: emulate lifecycle hooks when --bridge-hooks is set
  let bridgeHookEmulator: import('./bridge-hooks.js').BridgeHookEmulator | undefined;
  if (bridgeHooks) {
    const { BridgeHookEmulator } = await import('./bridge-hooks.js');
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
  let ptyTerminationExpected = false;
  let stdinPromptOverride: string | undefined;
  let spawnedArgsForPromptCheck = plan.args;
  let promptDeliveredInArgs = prompt ? plan.args.some(a => a === prompt) : false;
  const ptyCleanup: Array<() => void> = [];
  const capturedOutputChunks: string[] = [];
  const completePtyPrompt = () => {
    if (!ptyProcess || ptyTerminationExpected) return;
    ptyTerminationExpected = true;
    try { ptyProcess.kill('SIGTERM'); } catch { /* */ }
    setTimeout(() => {
      try { ptyProcess?.kill('SIGKILL'); } catch { /* */ }
    }, 2000);
  };

  if (isInteractive) {
    // Interactive mode: full TTY passthrough. If a prompt is provided, it's
    // injected as initial stdin after the harness starts (like typing it in).
    // Skip node-pty on macOS ARM64 CI — posix_spawnp fails for all binaries
    // and the native addon writes errors directly to stderr bypassing JS try/catch.
    const skipPty = process.platform === 'darwin' && process.arch === 'arm64' && process.env['CI'] === 'true';
    try {
      if (skipPty) throw new Error('Skipping node-pty on macOS ARM64 CI');
      const nodePty: any = await import('node-pty');
      const resolved = await resolveSpawnCommand(plan.command, plan.args);
      ptyProcess = nodePty.spawn(resolved.command, resolved.args, {
        name: 'xterm-256color',
        cols: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
        cwd: launchCwd,
        env: { ...process.env, ...plan.env } as Record<string, string>,
      });
      // Verify the PTY process actually started (posix_spawnp failures on macOS ARM64
      // may throw synchronously or result in an immediate exit with no pid)
      if (!ptyProcess || !ptyProcess.pid || ptyProcess.pid <= 0) {
        throw new Error('node-pty spawn returned invalid process — falling back to stdio');
      }
      // Give the process 100ms to fail — posix_spawnp errors on macOS ARM64 sometimes
      // manifest as immediate exit rather than a synchronous throw
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 100);
        ptyProcess.onExit?.((e: { exitCode: number }) => {
          if (e.exitCode !== 0) {
            clearTimeout(timer);
            reject(new Error(`PTY process exited immediately with code ${e.exitCode}`));
          }
        });
      });

      // End-of-turn detection: parse PTY output through adapter's event system
      let turnDetected = false;
      let lineBuf = '';
      let assembler: any = null;
      let adapter: any = null;
      try {
        const core = await import('@a5c-ai/agent-mux-comm');
        assembler = new core.StreamAssembler();
        // Resolve the adapter for this harness to use its parseEvent
        const adaptersModule = await import('@a5c-ai/agent-mux-adapters');
        const factory = adaptersModule.getAdapterFactory?.(plan.harness);
        adapter = factory ? factory() : null;
      } catch { /* core/adapters not available */ }

      // Pipe PTY to stdout + feed through event parser for turn detection
      let interactiveOutputBuf = '';
      let interactiveApiKeyHandled = false;
      let interactiveBypassHandled = false;
      let interactiveHooksTrustHandled = false;
      let babysitterSkillFollowupInjected = false;
      const maybeInjectBabysitterSkillFollowup = (output: string) => {
        if (babysitterSkillFollowupInjected || !promptInvokesBabysitterSlashCommand(prompt)) return;
        if (!stripTerminalControl(output).includes('Skill(babysitter:babysit)')) return;
        babysitterSkillFollowupInjected = true;
        setTimeout(() => {
          if (!ptyTerminationExpected) {
            ptyProcess.write(buildBabysitterSkillFollowupPrompt(prompt));
            setTimeout(() => ptyProcess.write('\r'), 500);
          }
        }, 1000);
      };
      ptyProcess.onData((data: string) => {
        process.stdout.write(data);
        interactiveOutputBuf += data;
        capturedOutputChunks.push(data);

        // Auto-respond to Claude Code onboarding prompts
        const stripped = interactiveOutputBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        if (!interactiveApiKeyHandled && stripped.includes('usethisAPIkey')) {
          interactiveApiKeyHandled = true;
          setTimeout(() => ptyProcess.write('\x1b[A\r'), 200);
        }
        if (!interactiveBypassHandled && stripped.includes('BypassPermissionsmode')) {
          interactiveBypassHandled = true;
          setTimeout(() => ptyProcess.write('\x1b[B\r'), 200);
        }
        if (!interactiveHooksTrustHandled && (stripped.includes('Hooks need review') || stripped.includes('hooks need review') || stripped.includes('Hooks can run outside the sandbox'))) {
          interactiveHooksTrustHandled = true;
          setTimeout(() => ptyProcess.write('2\r'), 300);
        }

        maybeInjectBabysitterSkillFollowup(interactiveOutputBuf);

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
                // Give the harness a moment to flush output, then end the PTY.
                setTimeout(completePtyPrompt, 1000);
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

      if (prompt && plan.args.some(a => a === prompt)) {
        let artifactMonitor: ReturnType<typeof setInterval> | undefined;
        artifactMonitor = startPromptArtifactCompletionMonitor({
          prompt,
          cwd: launchCwd,
          onComplete: () => {
            if (artifactMonitor) clearInterval(artifactMonitor);
            completePtyPrompt();
          },
        });
        ptyCleanup.push(() => { if (artifactMonitor) clearInterval(artifactMonitor); });
      }

      // Inject prompt after observed onboarding prompts are dismissed.
      if (prompt && !plan.args.some(a => a === prompt)) {
        const startedAt = Date.now();
        let promptInjected = false;
        let artifactMonitor: ReturnType<typeof setInterval> | undefined;
        const injectPrompt = () => {
          if (promptInjected) return;
          promptInjected = true;
          ptyProcess.write(prompt);
          setTimeout(() => ptyProcess.write('\r'), 500);
          artifactMonitor = startPromptArtifactCompletionMonitor({
            prompt,
            cwd: launchCwd,
            onComplete: () => {
              if (artifactMonitor) clearInterval(artifactMonitor);
              completePtyPrompt();
            },
          });
          ptyCleanup.push(() => { if (artifactMonitor) clearInterval(artifactMonitor); });
        };
        const checkAndInject = () => {
          if (promptInjected) return;
          if (interactiveOutputBuf.length === 0) {
            if (Date.now() - startedAt >= 1000) injectPrompt();
            else setTimeout(checkAndInject, 100);
            return;
          }
          const s = interactiveOutputBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
          if (interactiveApiKeyHandled || interactiveBypassHandled) {
            setTimeout(injectPrompt, 2000);
          } else if (s.includes('APIkey') || s.includes('Bypass')) {
            setTimeout(checkAndInject, 500);
          } else {
            setTimeout(injectPrompt, 3000);
          }
        };
        checkAndInject();
      }

      // Create a fake ChildProcess-like for signal handling
      child = { pid: ptyProcess.pid, kill: (sig: string) => ptyProcess.kill(sig) } as any;
    } catch (ptyError: unknown) {
      // node-pty not available or posix_spawnp failed (macOS ARM64), fall back to stdio
      const ptyMsg = ptyError instanceof Error ? ptyError.message : String(ptyError);
      console.error(`[amux launch] PTY fallback (${process.platform}/${process.arch}): ${ptyMsg}`);
      ptyProcess = null;
      const { spawn } = await import('node:child_process');
      const fallbackResolved = await resolveSpawnCommand(plan.command, plan.args);
      spawnedArgsForPromptCheck = fallbackResolved.args;
      console.error(`[amux launch] BI fallback spawn: ${fallbackResolved.command} args=${fallbackResolved.args.length} stdio=['pipe','pipe','pipe']`);
      child = spawn(fallbackResolved.command, fallbackResolved.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...plan.env },
        cwd: launchCwd,
      });
      child.stderr?.on('data', (chunk: Buffer) => process.stderr.write(chunk));
    }
  } else if (bridgeInteractive) {
    // Bridge-interactive: spawn via PTY like interactive mode, but:
    // - No human stdin forwarding
    // - Parse PTY output via adapter for structured events
    // - Emit events as NDJSON to stdout
    // - Auto-kill on turn completion
    // - Buffer PTY output to avoid pipe deadlock (stdout is piped)

    // Pre-create full Claude Code automation state to bypass all onboarding prompts
    if (plan.harness === 'claude') {
      await prepareClaudeAutomationState(launchCwd, plan.env);
    }

    // For harnesses that accept prompts via CLI flag (not REPL typing),
    // inject the prompt flag into args so both PTY and fallback paths work.
    const bridgeLb = getLaunchBehavior(plan.harness);
    const bridgeArgs = [...plan.args];
    if (prompt && bridgeLb?.promptDelivery === 'cli-flag' && bridgeLb.promptFlag && !bridgeArgs.some(a => a === prompt)) {
      bridgeArgs.push(bridgeLb.promptFlag, prompt, ...(bridgeLb.promptExtraFlags ?? []));
      promptDeliveredInArgs = true;
      console.error(`[amux launch] BI: injected prompt via ${bridgeLb.promptFlag} (cli-flag harness)`);
    }
    const resolvedBridge = await resolveSpawnCommand(plan.command, bridgeArgs);
    spawnedArgsForPromptCheck = resolvedBridge.args;
    // Skip node-pty on macOS ARM64 CI — posix_spawnp fails for all binaries
    const skipBridgePty = process.platform === 'darwin' && process.arch === 'arm64' && process.env['CI'] === 'true';
    let nodePty: any;
    if (!skipBridgePty) {
      try {
        nodePty = await import('node-pty');
      } catch {
        // node-pty not available — fall through to child_process fallback below
      }
    }

    if (nodePty) {
      const ptyCommand = process.platform === 'win32' ? resolvedBridge.command : '/bin/sh';
      const ptyArgs = process.platform === 'win32' ? resolvedBridge.args
        : ['-c', [resolvedBridge.command, ...resolvedBridge.args].map(a => a.includes(' ') || /[&|<>^()%!"';]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a).join(' ')];
      ptyProcess = nodePty.spawn(ptyCommand, ptyArgs, {
        name: 'xterm-256color',
        cols: 120,
        rows: 40,
        cwd: launchCwd,
        env: { ...process.env, ...plan.env } as Record<string, string>,
      });
    } else {
      // Fallback: child_process.spawn with piped stdio (same as NI path).
      // Without a PTY we can't type the prompt into a terminal, so inject
      // it into the command args using the harness's NI delivery method.
      console.error(`[amux launch] bridge-interactive: PTY unavailable (${skipBridgePty ? 'macOS ARM64 CI skip' : 'import failed'}) — using child_process fallback`);
      const fallbackLb = getLaunchBehavior(plan.harness);
      const bridgeFallbackArgs = [...plan.args];
      const promptInFallbackArgs = prompt ? bridgeFallbackArgs.some(a => a === prompt) : true;
      if (prompt && !promptInFallbackArgs && fallbackLb) {
        if (fallbackLb.promptDelivery === 'cli-flag' && fallbackLb.promptFlag) {
          bridgeFallbackArgs.push(fallbackLb.promptFlag, prompt, ...(fallbackLb.promptExtraFlags ?? []));
        } else if (fallbackLb.promptDelivery === 'exec-subcommand' && fallbackLb.execSubcommand) {
          bridgeFallbackArgs.unshift(fallbackLb.execSubcommand, prompt);
        }
        promptDeliveredInArgs = bridgeFallbackArgs.some(a => a === prompt);
        console.error(`[amux launch] BI fallback: injected prompt into args (${fallbackLb.promptDelivery})`);
      }
      const fallbackResolved = await resolveSpawnCommand(plan.command, bridgeFallbackArgs);
      spawnedArgsForPromptCheck = fallbackResolved.args;
      const { spawn } = await import('node:child_process');
      child = spawn(fallbackResolved.command, fallbackResolved.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...plan.env },
        cwd: launchCwd,
      });
      child.stderr?.on('data', (chunk: Buffer) => process.stderr.write(chunk));
    }

    // Set up adapter + assembler for parsing PTY output into structured events
    let assembler: import('@a5c-ai/agent-mux-comm').StreamAssembler | null = null;
    let adapter: { parseEvent(line: string, ctx: any): any } | null = null;
    try {
      const core = await import('@a5c-ai/agent-mux-comm');
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
    let hooksTrustHandled = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const IDLE_TIMEOUT_MS = 30_000;
    const harnessesWithEndEvents = new Set(['claude', 'codex', 'gemini', 'opencode']);
    const useIdleTimeout = !harnessesWithEndEvents.has(plan.harness);

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

    // Shared output handler: buffer, parse events, detect turn completion.
    // Used by both PTY onData and child_process stdout.
    const writeInput = (text: string) => {
      if (ptyProcess) ptyProcess.write(text);
      else if (child?.stdin?.writable) child.stdin.write(text);
    };

    let fatalErrorDetected = false;
    const FATAL_ERROR_PATTERNS = [
      'credit balance is too low',
      'insufficient_quota',
      'exceeded your current quota',
      'billing_not_active',
      'account has been deactivated',
      'payment required',
      'Your account does not have enough credits',
      'rate_limit_exceeded',
      'overloaded_error',
    ];

    const handleOutputChunk = (data: string) => {
      outputBuf += data;
      capturedOutputChunks.push(data);

      // Detect fatal API errors (credit exhaustion, billing) and fail fast
      // instead of waiting for idle/artifact timeout.
      if (!fatalErrorDetected && !turnComplete) {
        const stripped = outputBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        for (const pattern of FATAL_ERROR_PATTERNS) {
          if (stripped.includes(pattern)) {
            fatalErrorDetected = true;
            console.error(`[amux launch] FATAL API ERROR detected: "${pattern}" — terminating agent`);
            turnComplete = true;
            if (idleTimer) clearTimeout(idleTimer);
            setTimeout(completePtyPrompt, 500);
            return;
          }
        }
      }

      if (!assembler || !adapter || turnComplete) return;

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

            emitBridgeEvent({
              type: ev.type,
              timestamp: new Date().toISOString(),
              data: ev,
            });

            if (ev.type === 'message_stop' || ev.type === 'turn_end' || ev.type === 'session_end') {
              turnComplete = true;
              if (idleTimer) clearTimeout(idleTimer);
              setTimeout(completePtyPrompt, 1000);
              return;
            }

            if (useIdleTimeout) {
              if (idleTimer) clearTimeout(idleTimer);
              idleTimer = setTimeout(() => {
                if (!turnComplete) {
                  turnComplete = true;
                  completePtyPrompt();
                }
              }, IDLE_TIMEOUT_MS);
            }
          }
        } catch { /* parse error — ignore */ }
      }
    };

    let babysitterSkillFollowupInjected = false;
    const maybeInjectBabysitterSkillFollowup = (output: string) => {
      if (babysitterSkillFollowupInjected || !promptInvokesBabysitterSlashCommand(prompt)) return;
      if (!stripTerminalControl(output).includes('Skill(babysitter:babysit)')) return;
      babysitterSkillFollowupInjected = true;
      setTimeout(() => {
        if (!ptyTerminationExpected) {
          writeInput(buildBabysitterSkillFollowupPrompt(prompt));
          setTimeout(() => writeInput('\r'), 500);
        }
      }, 1000);
    };

    if (ptyProcess) {
      ptyProcess.onData((data: string) => {
        handleOutputChunk(data);

        const stripped = outputBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        if (!apiKeyPromptHandled && stripped.includes('usethisAPIkey')) {
          apiKeyPromptHandled = true;
          setTimeout(() => ptyProcess.write('\x1b[A\r'), 200);
        }
        if (!bypassPromptHandled && stripped.includes('BypassPermissionsmode')) {
          bypassPromptHandled = true;
          setTimeout(() => ptyProcess.write('\x1b[B\r'), 200);
        }
        if (!hooksTrustHandled && (stripped.includes('Hooks need review') || stripped.includes('hooks need review') || stripped.includes('Hooks can run outside the sandbox'))) {
          hooksTrustHandled = true;
          setTimeout(() => ptyProcess.write('2\r'), 300);
        }

        maybeInjectBabysitterSkillFollowup(outputBuf);
      });

      if (prompt) {
        const startedAt = Date.now();
        let promptInjected = false;
        let artifactMonitor: ReturnType<typeof setInterval> | undefined;
        const injectPrompt = () => {
          if (promptInjected) return;
          promptInjected = true;
          ptyProcess.write(prompt);
          setTimeout(() => ptyProcess.write('\r'), 500);
          artifactMonitor = startPromptArtifactCompletionMonitor({
            prompt,
            cwd: launchCwd,
            onComplete: () => {
              if (artifactMonitor) clearInterval(artifactMonitor);
              completePtyPrompt();
            },
          });
          ptyCleanup.push(() => { if (artifactMonitor) clearInterval(artifactMonitor); });
        };
        const checkAndInject = () => {
          if (promptInjected) return;
          if (outputBuf.length === 0) {
            if (Date.now() - startedAt >= 1000) injectPrompt();
            else setTimeout(checkAndInject, 100);
            return;
          }

          const stripped = outputBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
          if (apiKeyPromptHandled || bypassPromptHandled) {
            setTimeout(injectPrompt, 2000);
          } else if (stripped.includes('APIkey') || stripped.includes('Bypass')) {
            setTimeout(checkAndInject, 500);
          } else {
            setTimeout(injectPrompt, 3000);
          }
        };
        checkAndInject();
      }

      child = { pid: ptyProcess.pid, kill: (sig: string) => ptyProcess.kill(sig) } as any;

      const origOnExit = ptyProcess.onExit.bind(ptyProcess);
      const exitPromise = new Promise<number>((resolve) => {
        origOnExit(({ exitCode: code }: { exitCode: number }) => {
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
      (child as any).__bridgeExitPromise = exitPromise;
    } else {
      // child_process fallback: pipe stdout through shared handler. Prompt delivery
      // is handled by args when supported, otherwise by the common stdin path below.
      child.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        process.stdout.write(chunk);
        handleOutputChunk(text);
        maybeInjectBabysitterSkillFollowup(outputBuf);
      });

      const exitPromise = new Promise<number>((resolve) => {
        child.on('exit', (code: number | null, signal: string | null) => {
          if (outputBuf.length > 0) {
            emitBridgeEvent({
              type: 'output',
              timestamp: new Date().toISOString(),
              data: { text: outputBuf },
            });
            outputBuf = '';
          }
          resolve(signal ? 128 + (signal === 'SIGINT' ? 2 : 15) : (code ?? 1));
        });
      });
      (child as any).__bridgeExitPromise = exitPromise;
    }
  } else if (process.platform === 'win32' && plan.harness === 'hermes' && !bridgeHooks) {
    // Hermes on Windows NI (non-bridge): use ConPTY so prompt_toolkit gets a console.
    // In bridge-hooks mode, skip ConPTY — sitecustomize.py bridges real stdin to
    // PosixPipeInput via a daemon thread, making stdio pipes work without ConPTY overhead.
    try {
      const nodePty: any = await import('node-pty');
      const resolved = await resolveSpawnCommand(plan.command, plan.args);
      spawnedArgsForPromptCheck = resolved.args;
      console.error(`[amux launch] hermes Windows: using ConPTY for stdin delivery`);
      ptyProcess = nodePty.spawn(resolved.command, resolved.args, {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd: launchCwd,
        env: { ...process.env, ...plan.env } as Record<string, string>,
      });
      let niOutputBuf = '';
      ptyProcess.onData((data: string) => {
        process.stdout.write(data);
        capturedOutputChunks.push(data);
        niOutputBuf += data;
      });
      const fakeChild: any = { pid: ptyProcess.pid, stdin: null, stdout: null, stderr: null, kill: (sig: string) => ptyProcess.kill(sig) };
      fakeChild.on = (event: string, handler: (...args: any[]) => void) => {
        if (event === 'exit' || event === 'close') {
          ptyProcess.onExit?.((e: { exitCode: number }) => handler(e.exitCode, null));
        }
      };
      child = fakeChild;
    } catch (err) {
      console.error(`[amux launch] hermes Windows ConPTY failed, falling back to stdio: ${err instanceof Error ? err.message : err}`);
      const { spawn } = await import('node:child_process');
      const resolvedSpawn = await resolveSpawnCommand(plan.command, plan.args);
      spawnedArgsForPromptCheck = resolvedSpawn.args;
      child = spawn(resolvedSpawn.command, resolvedSpawn.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...plan.env },
        cwd: launchCwd,
        shell: resolvedSpawn.shell,
      });
    }
  } else {
    // Non-interactive: plain spawn. Each harness handles non-interactive mode
    // internally (claude -p, codex exec, gemini --prompt, pi -p).
    const { spawn } = await import('node:child_process');
    const resolvedSpawn = await resolveSpawnCommand(plan.command, plan.args);
    spawnedArgsForPromptCheck = resolvedSpawn.args;
    console.error(`[amux launch] spawn: ${resolvedSpawn.command} shell=${resolvedSpawn.shell} args[0..2]=${resolvedSpawn.args.slice(0, 3).join(' ')} totalArgs=${resolvedSpawn.args.length}${stdinPromptOverride ? ' (prompt→stdin)' : ''}`);
    child = spawn(resolvedSpawn.command, resolvedSpawn.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...plan.env },
      cwd: launchCwd,
      shell: resolvedSpawn.shell,
    });
    let niStderrBuf = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      process.stderr.write(chunk);
      capturedOutputChunks.push(text);
      niStderrBuf += text;
      if (niStderrBuf.length > 10_000) niStderrBuf = niStderrBuf.slice(-10_000);
      for (const pat of ['credit balance is too low', 'insufficient_quota', 'exceeded your current quota',
        'billing_not_active', 'payment required', 'rate_limit_exceeded', 'overloaded_error']) {
        if (niStderrBuf.includes(pat)) {
          console.error(`[amux launch] FATAL API ERROR in stderr: "${pat}" — killing agent`);
          try { child.kill('SIGTERM'); } catch { /* */ }
          niStderrBuf = '';
          return;
        }
      }
    });

    // Pipe stdout through + idle-timeout kill for harnesses that don't exit
    // after completing a non-interactive task (e.g., Pi doesn't exit on its own).
    // Harnesses with proper exit behavior (claude -p, codex exec) don't need this.
    const _lb = getLaunchBehavior(plan.harness);
    const niUseIdleKill = bridgeHooks ? false : (_lb ? _lb.needsIdleKill : true);
    let niIdleTimer: ReturnType<typeof setTimeout> | null = null;
    let niHasOutput = false;
    const NI_IDLE_TIMEOUT_MS = 30_000;
    let niFatalBuf = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      process.stdout.write(chunk);
      capturedOutputChunks.push(text);
      niHasOutput = true;
      // Detect fatal API errors and kill fast
      niFatalBuf += text;
      if (niFatalBuf.length > 10_000) niFatalBuf = niFatalBuf.slice(-10_000);
      const stripped = niFatalBuf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      for (const pat of ['credit balance is too low', 'insufficient_quota', 'exceeded your current quota',
        'billing_not_active', 'payment required', 'Your account does not have enough credits',
        'rate_limit_exceeded', 'overloaded_error']) {
        if (stripped.includes(pat)) {
          console.error(`[amux launch] FATAL API ERROR in NI mode: "${pat}" — killing agent`);
          try { child.kill('SIGTERM'); } catch { /* */ }
          niFatalBuf = '';
          return;
        }
      }
      if (niUseIdleKill) {
        if (niIdleTimer) clearTimeout(niIdleTimer);
        niIdleTimer = setTimeout(() => {
          if (niHasOutput) {
            try { child.kill('SIGTERM'); } catch { /* */ }
          }
        }, NI_IDLE_TIMEOUT_MS);
      }
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

  const launchBehavior = getLaunchBehavior(plan.harness);
  const effectivePrompt = stdinPromptOverride ?? prompt;
  const promptInArgs = effectivePrompt ? promptDeliveredInArgs || spawnedArgsForPromptCheck.some(a => a === effectivePrompt) : false;
  const needsStdinDelivery = stdinPromptOverride || !promptInArgs;
  const keepStdinOpen = launchBehavior?.stdinBehavior === 'keep-open';
  if (!isInteractive && effectivePrompt) {
    console.error(`[amux launch] stdin: promptInArgs=${promptInArgs} stdinOverride=${!!stdinPromptOverride} keepStdinOpen=${keepStdinOpen}`);
  }

  if (effectivePrompt && ptyProcess && !isInteractive && needsStdinDelivery) {
    // ConPTY path: write prompt to PTY stdin after a short delay for initialization
    setTimeout(() => { ptyProcess.write(prompt + '\n'); }, 2000);
  } else if (effectivePrompt && child.stdin && !ptyProcess && needsStdinDelivery) {
    child.stdin.write(prompt + '\n');
    if (!isInteractive && !keepStdinOpen) {
      child.stdin.end();
    } else if (!isInteractive && keepStdinOpen) {
      // Harnesses that need stdin open for tool-use loops; idle-kill handles termination
    } else {
      // Interactive with stdin pipe (no PTY): reconnect terminal stdin after prompt injection
      process.stdin.resume();
      process.stdin.pipe(child.stdin);
    }
  }
  if (promptInArgs && child.stdin && !ptyProcess) {
    child.stdin.end();
  }

  let exitCode = await (
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

  for (const cleanup of ptyCleanup.splice(0)) cleanup();
  if (ptyTerminationExpected && exitCode !== 0) exitCode = 0;

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
