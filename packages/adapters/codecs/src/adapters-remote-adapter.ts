/**
 * AgentMuxRemoteAdapter — pass-through adapter that delegates to another
 * `adapters` CLI installation. Transport is out of scope: this adapter emits
 * plain `adapters run ...` spawn args, and the caller wraps them with the
 * desired invocation mode (local/docker/ssh/k8s) via
 * `buildInvocationCommand()`.
 *
 * This lets adapters nest: a local adapters invocation dispatches to a second
 * adapters executing in a docker container, on a remote SSH host, or in a k8s
 * pod. All structured events are forwarded verbatim — the remote `adapters run`
 * emits JSONL which we pass through unchanged.
 *
 * Configuration is read from RunOptions.env:
 *   AGENT_MUX_REMOTE_AGENT  — agent name to invoke on the remote (default: claude)
 *
 * The transport-specific bits (host, identity file, docker image, ...) live
 * on `RunOptions.invocation` — not on this adapter.
 */

import type {
  AgentCapabilities,
  ModelCapabilities,
  AgentConfigSchema,
  AuthState,
  AuthSetupGuidance,
  Session,
  SpawnArgs,
  ParseContext,
  RunOptions,
  AgentEvent,
  AgentConfig,
} from '@a5c-ai/comm-adapter';

import { BaseAgentAdapter } from './base-adapter.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';

export class AgentMuxRemoteAdapter extends BaseAgentAdapter {
  readonly agent: string;
  readonly displayName = 'adapters (remote via invocation mode)';
  readonly cliCommand: string;
  readonly minVersion = '0.1.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase().replace(/agentmuxremote/, 'adapters-remote');
    this.cliCommand = cliCommand ?? 'adapters';
  }
  readonly hostEnvSignals = [] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'adapters-remote',
    canResume: true,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'none',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsThinkingStreaming: true,
    supportsNativeTools: true,
    supportsMCP: false,
    supportsParallelToolCalls: true,
    requiresToolApproval: false,
    approvalModes: ['yolo', 'prompt', 'deny'],
    runtimeHooks: createVirtualRuntimeHookCapabilities(),
    supportsThinking: true,
    thinkingEffortLevels: ['low', 'medium', 'high'],
    supportsThinkingBudgetTokens: true,
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    structuredSessionTransport: 'restart-per-turn',
    sessionControlPlane: 'external-host',
    supportsSkills: false,
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    supportsInteractiveMode: false,
    supportsStdinInjection: true,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins: false,
    pluginFormats: [],
    pluginRegistries: [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'Transport', description: 'Handled by invocation mode (local/docker/ssh/k8s).' },
    ],
    authFiles: [],
    installMethods: [
      { platform: 'all', type: 'manual', command: 'Install adapters on the target (see `adapters remote install <host>`).' },
    ],
  };

  readonly models: ModelCapabilities[] = [];
  readonly defaultModelId = undefined;

  readonly configSchema: AgentConfigSchema = {
    agent: 'adapters-remote',
    version: 1,
    fields: [],
    configFilePaths: [],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

  /** Resolve the remote agent name (which agent to invoke inside the nested adapters). */
  private resolveRemoteAgent(options: RunOptions): string {
    const env = options.env ?? {};
    return env['AGENT_MUX_REMOTE_AGENT'] ?? process.env['AGENT_MUX_REMOTE_AGENT'] ?? 'claude';
  }

  /**
   * Emit `adapters run --json --agent <agent> --prompt <...>` args.
   *
   * The caller is responsible for wrapping these with an invocation mode
   * (ssh/docker/k8s) via `buildInvocationCommand()`. This keeps the adapter
   * transport-agnostic so the same binary can be used inside a docker
   * container, on a remote SSH host, or in a k8s pod.
   */
  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const remoteAgent = this.resolveRemoteAgent(options);
    const prompt = Array.isArray(options.prompt) ? options.prompt.join('\n') : options.prompt;

    const args: string[] = ['run', '--json', '--agent', remoteAgent, '--prompt', prompt];

    if (options.model) args.push('--model', options.model);
    if (options.sessionId) args.push('--session', options.sessionId);
    if (options.approvalMode === 'yolo') args.push('--yolo');
    if (options.approvalMode === 'deny') args.push('--deny');

    return {
      command: this.cliCommand,
      args,
      env: this.buildEnvFromOptions(options),
      cwd: options.cwd ?? process.cwd(),
      usePty: false,
      timeout: options.timeout,
      inactivityTimeout: options.inactivityTimeout,
    };
  }

  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null {
    const parsed = this.parseJsonLine(line);
    if (parsed == null || typeof parsed !== 'object') return null;

    const obj = parsed as Record<string, unknown>;
    const event: Record<string, unknown> = { ...obj };
    if (typeof event['runId'] !== 'string') event['runId'] = context.runId;
    if (typeof event['timestamp'] !== 'number') event['timestamp'] = Date.now();
    event['agent'] = this.agent;
    if (typeof event['type'] !== 'string') return null;
    return event as unknown as AgentEvent;
  }

  /** Detect version via the local spawner running plain `adapters --version`. */
  async detectVersion(): Promise<string | null> {
    try {
      const res = await this._spawner('adapters', ['--version']);
      if (res.code !== 0) return null;
      const match = (res.stdout + '\n' + res.stderr).match(/\d+\.\d+\.\d+(?:-[\w.]+)?/);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  }

  protected override async detectVersionFromCli(): Promise<string | null> {
    return this.detectVersion();
  }

  async detectAuth(): Promise<AuthState> {
    return {
      status: 'authenticated',
      method: 'transport',
      identity: 'handled by invocation mode',
    };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'adapters-remote',
      providerName: 'adapters (remote)',
      steps: [
        { step: 1, description: 'Install adapters on the target (local, remote SSH host, docker image, or k8s pod).' },
        { step: 2, description: 'Set RunOptions.invocation to select the transport (ssh/docker/k8s).' },
        { step: 3, description: 'Optionally set AGENT_MUX_REMOTE_AGENT to choose which agent the nested adapters invokes.' },
      ],
      envVars: [
        { name: 'AGENT_MUX_REMOTE_AGENT', description: 'Agent to invoke on the remote (default: claude)', required: false },
      ],
      documentationUrls: [],
      verifyCommand: 'adapters --version',
    };
  }

  sessionDir(_cwd?: string): string {
    return '';
  }

  async parseSessionFile(_filePath: string): Promise<Session> {
    throw new Error('adapters-remote does not store sessions locally; use `adapters sessions list` on the remote.');
  }

  /** List remote sessions via plain `adapters sessions list --json` (transport is external). */
  async listSessionFiles(_cwd?: string): Promise<string[]> {
    try {
      const res = await this._spawner('adapters', ['sessions', 'list', '--json']);
      if (res.code !== 0) return [];
      const parsed = JSON.parse(res.stdout);
      const data = Array.isArray(parsed) ? parsed : (parsed?.data ?? []);
      if (!Array.isArray(data)) return [];
      return data
        .map((s: unknown) => {
          if (s && typeof s === 'object') {
            const sid = (s as Record<string, unknown>)['sessionId'] ?? (s as Record<string, unknown>)['id'];
            return typeof sid === 'string' ? sid : null;
          }
          return null;
        })
        .filter((s): s is string => typeof s === 'string');
    } catch {
      return [];
    }
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    return { agent: 'adapters-remote', source: 'global' };
  }

  async writeConfig(_config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    /* No local config to write. */
  }

  /**
   * Detect whether `adapters` is available at the current spawner scope (local or
   * wrapped). The wrapper — docker/ssh/k8s — is applied externally.
   */
  override async detectInstallation(): Promise<import('@a5c-ai/comm-adapter').DetectInstallationResult> {
    try {
      const res = await this._spawner('adapters', ['--version']);
      if (res.code !== 0) {
        return { installed: false, notes: `adapters probe failed (code ${res.code})` };
      }
      const version = this.parseVersionOutput(res.stdout + '\n' + res.stderr);
      const out: import('@a5c-ai/comm-adapter').DetectInstallationResult = {
        installed: true,
        path: 'adapters',
      };
      if (version) out.version = version;
      return out;
    } catch (err) {
      return {
        installed: false,
        notes: err instanceof Error ? `adapters probe error: ${err.message}` : 'adapters probe error',
      };
    }
  }

  /**
   * Install adapters via `npm install -g @a5c-ai/adapters-cli`.
   * Transport wrapping (ssh/docker/k8s) is the caller's responsibility.
   */
  override async install(
    opts: import('@a5c-ai/comm-adapter').AdapterInstallOptions = {},
  ): Promise<import('@a5c-ai/comm-adapter').InstallResult> {
    const command = 'npm install -g @a5c-ai/adapters-cli';
    if (opts.dryRun) {
      return { ok: true, method: 'npm', command, message: `[dry-run] would execute: ${command}` };
    }
    try {
      const res = await this._spawner('npm', ['install', '-g', '@a5c-ai/adapters-cli']);
      return {
        ok: res.code === 0,
        method: 'npm',
        command,
        stdout: res.stdout,
        stderr: res.stderr,
      };
    } catch (err) {
      return {
        ok: false,
        method: 'npm',
        command,
        stderr: err instanceof Error ? err.message : String(err),
      };
    }
  }

  override async update(
    opts: import('@a5c-ai/comm-adapter').AdapterUpdateOptions = {},
  ): Promise<import('@a5c-ai/comm-adapter').InstallResult> {
    const command = 'npm update -g @a5c-ai/adapters-cli';
    if (opts.dryRun) {
      return { ok: true, method: 'npm', command, message: `[dry-run] would execute: ${command}` };
    }
    try {
      const res = await this._spawner('npm', ['update', '-g', '@a5c-ai/adapters-cli']);
      return {
        ok: res.code === 0,
        method: 'npm',
        command,
        stdout: res.stdout,
        stderr: res.stderr,
      };
    } catch (err) {
      return {
        ok: false,
        method: 'npm',
        command,
        stderr: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
