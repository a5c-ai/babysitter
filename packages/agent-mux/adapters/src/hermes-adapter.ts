/**
 * HermesAdapter — Hermes agent (NousResearch) CLI adapter.
 */

import * as os from 'node:os';
import * as path from 'node:path';

import { getAdapterMetadata, getAdapterModels, getAgentVersion, getInstallMethods, getHostEnvSignals, getSessionConfig, getCapabilityFlags, getRuntimeHooks, getConfigSchema, getDisplayName, getDefaultModelId } from '@a5c-ai/atlas/catalog';

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
  InstallMethod,
} from '@a5c-ai/agent-comm-mux';

import * as fs from 'node:fs/promises';

import { BaseAgentAdapter } from './base-adapter.js';

import {
  listJsonlFiles,
  parseJsonlSessionFile,
  parseFlatYaml,
  stringifyFlatYaml,
  writeTextFileAtomic,
} from './session-fs.js';

export class HermesAdapter extends BaseAgentAdapter {
  readonly agent: string;
  get displayName() { return getDisplayName(this.agent); }
  readonly cliCommand: string;
  readonly minVersion = '0.1.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase();
    this.cliCommand = cliCommand ?? this.agent;
  }
  get hostEnvSignals() { return getHostEnvSignals(this.agent); }

  get capabilities(): AgentCapabilities {
    const flags = getCapabilityFlags(this.agent);
    const hooks = getRuntimeHooks(this.agent);
    const metadata = getAdapterMetadata(this.agent);
    return {
      agent: this.agent,
      canResume: Boolean(flags.canResume),
      canFork: Boolean(flags.canFork),
      supportsMultiTurn: Boolean(flags.supportsMultiTurn),
      sessionPersistence: String(flags.sessionPersistence ?? 'file') as any,
      supportsTextStreaming: Boolean(flags.supportsTextStreaming),
      supportsToolCallStreaming: Boolean(flags.supportsToolCallStreaming),
      supportsThinkingStreaming: Boolean(flags.supportsThinkingStreaming),
      supportsNativeTools: Boolean(flags.supportsNativeTools),
      supportsMCP: Boolean(flags.supportsMCP),
      supportsParallelToolCalls: Boolean(flags.supportsParallelToolCalls),
      requiresToolApproval: Boolean(flags.requiresToolApproval),
      approvalModes: (metadata?.approvalModes ?? ['yolo', 'prompt']) as any,
      runtimeHooks: {
        preToolUse: (hooks.preToolUse ?? 'nonblocking') as any,
        postToolUse: (hooks.postToolUse ?? 'nonblocking') as any,
        sessionStart: (hooks.sessionStart ?? 'nonblocking') as any,
        sessionEnd: (hooks.sessionEnd ?? 'nonblocking') as any,
        stop: (hooks.stop ?? 'nonblocking') as any,
        userPromptSubmit: (hooks.userPromptSubmit ?? 'nonblocking') as any,
      },
      supportsThinking: Boolean(flags.supportsThinking),
      thinkingEffortLevels: flags.thinkingEffortLevels as any ?? [],
      supportsThinkingBudgetTokens: Boolean(flags.supportsThinkingBudgetTokens),
      supportsJsonMode: Boolean(flags.supportsJsonMode),
      supportsStructuredOutput: Boolean(flags.supportsStructuredOutput),
      structuredSessionTransport: String(flags.structuredSessionTransport ?? 'none') as any,
      sessionControlPlane: String(flags.sessionControlPlane ?? 'self-managed') as any,
      supportsSkills: Boolean(flags.supportsSkills),
      supportsAgentsMd: Boolean(flags.supportsAgentsMd),
      skillsFormat: (flags.skillsFormat ?? null) as any,
      supportsSubagentDispatch: Boolean(flags.supportsSubagentDispatch),
      supportsParallelExecution: Boolean(flags.supportsParallelExecution),
      maxParallelTasks: flags.maxParallelTasks as number | undefined,
      supportsInteractiveMode: Boolean(flags.supportsInteractiveMode),
      supportsStdinInjection: Boolean(flags.supportsStdinInjection),
      supportsImageInput: Boolean(flags.supportsImageInput),
      supportsImageOutput: Boolean(flags.supportsImageOutput),
      supportsFileAttachments: Boolean(flags.supportsFileAttachments),
      supportsPlugins: Boolean(flags.supportsPlugins),
      pluginFormats: flags.pluginFormats as any ?? [],
      pluginRegistries: flags.pluginRegistries as any ?? [],
      supportedPlatforms: flags.supportedPlatforms as any ?? ['darwin', 'linux', 'win32'],
      requiresGitRepo: Boolean(flags.requiresGitRepo),
      requiresPty: Boolean(flags.requiresPty),
      authMethods: (metadata?.authMethods ?? []).map(m => ({ type: m.type, name: m.name })),
      authFiles: metadata?.authFiles ?? [],
      installMethods: getInstallMethods(this.agent).map(m => ({ platform: 'all' as const, type: m.type as InstallMethod['type'], command: m.command })),
    };
  }

  get models(): ModelCapabilities[] {
    return getAdapterModels(this.agent).map((m) => ({
      ...m,
      agent: this.agent,
      thinkingEffortLevels: m.thinkingEffortLevels as ModelCapabilities['thinkingEffortLevels'],
    }));
  }

  get defaultModelId() { return getDefaultModelId(this.agent) ?? 'hermes-3-llama-3.1-405b'; }

  get configSchema(): AgentConfigSchema {
    const schema = getConfigSchema(this.agent);
    return {
      agent: this.agent,
      version: 1,
      fields: [],
      configFilePaths: schema.configFilePaths ?? [],
      projectConfigFilePaths: schema.projectConfigFilePaths ?? [],
      configFormat: (schema.configFormat ?? 'yaml') as any,
      supportsProjectConfig: (schema.projectConfigFilePaths ?? []).length > 0,
    };
  }

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    if (options.model) {
      args.push('--model', options.model);
    }

    if (options.approvalMode === 'yolo') {
      args.push('--yolo');
    }

    const { prompt, stdin } = this.buildPromptTransport(options);
    if (options.nonInteractive === true && prompt) {
      args.push('-z', prompt);
    }

    return {
      command: this.cliCommand,
      args,
      env: this.buildEnvFromOptions(options),
      cwd: options.cwd ?? process.cwd(),
      usePty: false,
      stdin: options.nonInteractive === true ? undefined : stdin,
      timeout: options.timeout,
      inactivityTimeout: options.inactivityTimeout,
    };
  }

  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null {
    const parsed = this.parseJsonLine(line);
    if (parsed == null || typeof parsed !== 'object') return null;

    const obj = parsed as Record<string, unknown>;
    const ts = Date.now();
    const base = { runId: context.runId, agent: this.agent, timestamp: ts };

    const type = obj['type'] as string | undefined;

    if (type === 'text' || type === 'message') {
      const content = (obj['content'] ?? obj['text'] ?? '') as string;
      if (content) {
        return { ...base, type: 'text_delta', delta: content, accumulated: content } as AgentEvent;
      }
    }

    if (type === 'tool_call') {
      return {
        ...base,
        type: 'tool_call_start',
        toolCallId: (obj['id'] ?? '') as string,
        toolName: (obj['name'] ?? '') as string,
        inputAccumulated: JSON.stringify(obj['input'] ?? {}),
      } as AgentEvent;
    }

    if (type === 'error') {
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message: (obj['message'] ?? 'Unknown error') as string,
        recoverable: false,
      } as AgentEvent;
    }

    return null;
  }

  async detectAuth(): Promise<AuthState> {
    const envVars = [
      'OPENROUTER_API_KEY',
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
      'NOUS_API_KEY',
      'GITHUB_TOKEN',
      'GOOGLE_API_KEY',
    ] as const;

    for (const envVar of envVars) {
      if (process.env[envVar]) {
        const method = envVar === 'GITHUB_TOKEN' ? 'github_token' : 'api_key';
        return {
          status: 'authenticated',
          method,
          identity: `${envVar.toLowerCase().replace('_api_key', '').replace('_token', '')}`,
        };
      }
    }

    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'hermes',
      providerName: 'NousResearch / Hermes',
      steps: [
        { step: 1, description: 'Set one or more provider API key environment variables' },
        { step: 2, description: 'OpenRouter: export OPENROUTER_API_KEY=sk-or-...', command: 'export OPENROUTER_API_KEY=sk-or-...' },
        { step: 3, description: 'Or use Anthropic, OpenAI, Nous, GitHub, or Google API keys' },
      ],
      envVars: [
        { name: 'OPENROUTER_API_KEY', description: 'OpenRouter API key', required: false, exampleFormat: 'sk-or-...' },
        { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: false },
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false },
        { name: 'NOUS_API_KEY', description: 'Nous API key', required: false },
        { name: 'GITHUB_TOKEN', description: 'GitHub token', required: false },
        { name: 'GOOGLE_API_KEY', description: 'Google API key', required: false },
      ],
      documentationUrls: ['https://github.com/NousResearch/hermes-agent'],
      verifyCommand: 'hermes --version',
    };
  }

  sessionDir(_cwd?: string): string {
    return getSessionConfig(this.agent).sessionDir!;
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'hermes');
    return { ...parsed, agent: 'hermes' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'hermes', source: 'global' };
    let text: string;
    try {
      text = await fs.readFile(filePath, 'utf8');
    } catch {
      return { agent: 'hermes', source: 'global', filePaths: [filePath] };
    }
    const data = parseFlatYaml(text);
    return { agent: 'hermes', source: 'global', filePaths: [filePath], ...data };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return;
    let existing: Record<string, unknown> = {};
    try {
      existing = parseFlatYaml(await fs.readFile(filePath, 'utf8'));
    } catch {
      existing = {};
    }
    const { agent: _a, source: _s, filePaths: _fp, ...rest } = config as Record<string, unknown>;
    void _a; void _s; void _fp;
    const merged = { ...existing, ...rest };
    await writeTextFileAtomic(filePath, stringifyFlatYaml(merged));
  }

  /**
   * Hermes stores config as flat YAML. We encode hooks as a nested
   * `hooks:` block with one `<hookType>: <command>` entry per line.
   * Multiple commands per hookType are joined with `&&` since flat YAML
   * allows only one value per key.
   */
  protected override async writeNativeHook(hookType: string, command: string): Promise<void> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return;
    try {
      let existing: Record<string, unknown> = {};
      try {
        existing = parseFlatYaml(await fs.readFile(filePath, 'utf8'));
      } catch {
        existing = {};
      }
      const hooks = (existing['hooks'] && typeof existing['hooks'] === 'object'
        ? (existing['hooks'] as Record<string, unknown>)
        : {}) as Record<string, unknown>;
      const prior = typeof hooks[hookType] === 'string' ? (hooks[hookType] as string) : '';
      hooks[hookType] = prior ? `${prior} && ${command}` : command;
      const merged = { ...existing, hooks };
      const fsp = await import('node:fs/promises');
      const pathMod = await import('node:path');
      await fsp.mkdir(pathMod.dirname(filePath), { recursive: true });
      await writeTextFileAtomic(filePath, stringifyFlatYaml(merged));
    } catch {
      // swallow
    }
  }
}
