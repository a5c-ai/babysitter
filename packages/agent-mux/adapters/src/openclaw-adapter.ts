/**
 * OpenClawAdapter — OpenClaw CLI adapter.
 */

import * as os from 'node:os';
import * as path from 'node:path';

import { getAdapterMetadata, getAgentVersion, getInstallMethods, getHostEnvSignals, getSessionConfig } from '@a5c-ai/agent-catalog';

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
  InstalledPlugin,
  InstallMethod,
  PluginInstallOptions,
  AgentConfig,
} from '@a5c-ai/agent-mux-core';

import { BaseAgentAdapter } from './base-adapter.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import { mcpListPlugins, mcpInstallPlugin, mcpUninstallPlugin } from './mcp-plugins.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
  findProjectRootSync,
} from './session-fs.js';

export class OpenClawAdapter extends BaseAgentAdapter {
  readonly agent: string = this.constructor.name.replace(/Adapter$/, "").toLowerCase();
  readonly displayName = 'OpenClaw';
  readonly cliCommand: string = this.agent;
  readonly minVersion = '0.1.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
  }
  get hostEnvSignals() { return getHostEnvSignals(this.agent); }

  readonly capabilities: AgentCapabilities = {
    agent: this.agent,
    canResume: false,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsThinkingStreaming: false,
    supportsNativeTools: true,
    supportsMCP: true,
    supportsParallelToolCalls: true,
    requiresToolApproval: true,
    approvalModes: ['yolo', 'prompt'],
    runtimeHooks: createVirtualRuntimeHookCapabilities(),
    supportsThinking: false,
    thinkingEffortLevels: [],
    supportsThinkingBudgetTokens: false,
    supportsJsonMode: false,
    supportsStructuredOutput: false,
    structuredSessionTransport: 'none',
    sessionControlPlane: 'self-managed',
    supportsSkills: false,
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: false,
    supportsParallelExecution: false,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins: true,
    pluginFormats: ['mcp-server'],
    pluginRegistries: [{ name: 'mcp', url: 'https://modelcontextprotocol.io', searchable: false }],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: (getAdapterMetadata(this.agent)?.authMethods ?? []).map(m => ({ type: m.type, name: m.name })),
    authFiles: getAdapterMetadata(this.agent)?.authFiles ?? [],
    installMethods: getInstallMethods(this.agent).map(m => ({ platform: 'all' as const, type: m.type as InstallMethod['type'], command: m.command })),
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: this.agent,
      modelId: 'default',
      displayName: 'Default Model',
      deprecated: false,
      contextWindow: 128000,
      maxOutputTokens: 8192,
      supportsThinking: false,
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: false,
      supportsStructuredOutput: false,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsFileInput: false,
      cliArgKey: '--model',
      cliArgValue: 'default',
      lastUpdated: '2025-01-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'default';

  readonly configSchema: AgentConfigSchema = {
    agent: this.agent,
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.openclaw', 'config.json')],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    if (options.model) {
      args.push('--model', options.model);
    }

    if (options.approvalMode === 'yolo') {
      args.push('--auto-approve');
    }

    const { prompt, stdin } = this.buildPromptTransport(options);
    if (stdin === undefined) {
      args.push('--prompt', prompt);
    }

    return {
      command: this.cliCommand,
      args,
      env: this.buildEnvFromOptions(options),
      cwd: options.cwd ?? process.cwd(),
      usePty: false,
      stdin,
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
    if (process.env['ANTHROPIC_API_KEY']) {
      return { status: 'authenticated', method: 'api_key', identity: 'anthropic' };
    }
    if (process.env['OPENAI_API_KEY']) {
      return { status: 'authenticated', method: 'api_key', identity: 'openai' };
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: this.agent,
      providerName: 'OpenClaw',
      steps: [
        { step: 1, description: 'Set a provider-specific API key environment variable' },
        { step: 2, description: 'For example: export ANTHROPIC_API_KEY=sk-ant-...', command: 'export ANTHROPIC_API_KEY=sk-ant-...' },
      ],
      envVars: [
        { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: false },
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false },
      ],
      documentationUrls: ['https://github.com/openclaw/openclaw'],
      verifyCommand: `${this.cliCommand} --version`,
    };
  }

  sessionDir(_cwd?: string): string {
    return getSessionConfig(this.agent).sessionDir!;
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, this.agent);
    return { ...parsed, agent: this.agent };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: this.agent, source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: this.agent, source: 'global', filePaths: [filePath], ...data };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return;
    const existing = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    const { agent: _a, source: _s, filePaths: _fp, ...rest } = config as Record<string, unknown>;
    void _a; void _s; void _fp;
    await writeJsonFileAtomic(filePath, { ...existing, ...rest });
  }

  private pluginsPath(): string {
    return this.configSchema.configFilePaths?.[0] ?? '';
  }

  override async listPlugins(): Promise<InstalledPlugin[]> {
    return mcpListPlugins(this.pluginsPath());
  }

  override async installPlugin(
    pluginId: string,
    options?: PluginInstallOptions,
  ): Promise<InstalledPlugin> {
    return mcpInstallPlugin(this.pluginsPath(), pluginId, options);
  }

  override async uninstallPlugin(pluginId: string, options?: { global?: boolean }): Promise<void> {
    return mcpUninstallPlugin(this.pluginsPath(), pluginId);
  }
}

// Self-register in the global adapter registry
import { registerAdapterFactory } from './base-adapter.js';
import { getPluginTargetDescriptor } from '@a5c-ai/agent-catalog';

const _name = 'openclaw';
registerAdapterFactory(_name, () => new OpenClawAdapter(_name, getPluginTargetDescriptor(_name)?.cliCommand ?? _name));
