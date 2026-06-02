/**
 * QwenAdapter — Alibaba Qwen Code CLI adapter.
 *
 * Qwen Code is a fork of Google's Gemini CLI, adapted for Qwen3-Coder models.
 * It speaks an OpenAI-compatible API (DashScope or self-hosted), stores config
 * under ~/.qwen/settings.json, and supports MCP servers via `mcpServers`.
 *
 * Upstream: https://github.com/QwenLM/qwen-code
 */

import * as os from 'node:os';
import * as path from 'node:path';

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
  PluginInstallOptions,
  AgentConfig,
} from '@a5c-ai/agent-mux-comm';

import { BaseAgentAdapter } from './base-adapter.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import { mcpListPlugins, mcpInstallPlugin, mcpUninstallPlugin } from './mcp-plugins.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

export class QwenAdapter extends BaseAgentAdapter {
  readonly agent: string;
  readonly displayName = 'Qwen Code';
  readonly cliCommand: string;
  readonly minVersion = '0.0.1';

  constructor(agent?: string, cliCommand?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase();
    this.cliCommand = cliCommand ?? this.agent;
  }
  readonly hostEnvSignals = ['QWEN_CODE', 'QWEN_SESSION_ID'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'qwen',
    canResume: true,
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
    supportsAgentsMd: true,
    skillsFormat: null,
    supportsSubagentDispatch: false,
    supportsParallelExecution: false,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: true,
    supportsPlugins: true,
    pluginFormats: ['mcp-server'],
    pluginRegistries: [{ name: 'mcp', url: 'https://modelcontextprotocol.io', searchable: false }],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'OpenAI-compatible API Key', description: 'OPENAI_API_KEY (DashScope or compatible endpoint)' },
    ],
    authFiles: ['.qwen/settings.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @qwen-code/qwen-code' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'qwen',
      modelId: 'qwen3-coder-plus',
      displayName: 'Qwen3 Coder Plus',
      deprecated: false,
      contextWindow: 1000000,
      maxOutputTokens: 65536,
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
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'qwen3-coder-plus',
      lastUpdated: '2025-09-01',
      source: 'bundled',
    },
    {
      agent: 'qwen',
      modelId: 'qwen3-coder-flash',
      displayName: 'Qwen3 Coder Flash',
      deprecated: false,
      contextWindow: 1000000,
      maxOutputTokens: 65536,
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
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'qwen3-coder-flash',
      lastUpdated: '2025-09-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'qwen3-coder-plus';

  readonly configSchema: AgentConfigSchema = {
    agent: 'qwen',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.qwen', 'settings.json')],
    projectConfigFilePaths: ['.qwen/settings.json'],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    if (options.model) {
      args.push('--model', options.model);
    }

    if (options.approvalMode === 'yolo') {
      args.push('--yolo');
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
        inputAccumulated: JSON.stringify(obj['args'] ?? obj['input'] ?? {}),
      } as AgentEvent;
    }

    if (type === 'tool_result') {
      return {
        ...base,
        type: 'tool_result',
        toolCallId: (obj['id'] ?? '') as string,
        toolName: (obj['name'] ?? '') as string,
        output: obj['output'] ?? '',
        durationMs: 0,
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
    const apiKey = process.env['OPENAI_API_KEY'];
    if (apiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `...${apiKey.slice(-4)}`,
      };
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'qwen',
      providerName: 'Alibaba Cloud (DashScope)',
      steps: [
        { step: 1, description: 'Create a DashScope API key at https://dashscope.console.aliyun.com/', url: 'https://dashscope.console.aliyun.com/' },
        { step: 2, description: 'Export OpenAI-compatible env vars', command: 'export OPENAI_API_KEY=sk-... OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1 OPENAI_MODEL=qwen3-coder-plus' },
        { step: 3, description: 'Alternatively run `qwen` interactively and follow the OAuth login flow', command: 'qwen' },
      ],
      envVars: [
        { name: 'OPENAI_API_KEY', description: 'DashScope or OpenAI-compatible API key', required: true, exampleFormat: 'sk-...' },
        { name: 'OPENAI_BASE_URL', description: 'Compatible-mode endpoint', required: false },
        { name: 'OPENAI_MODEL', description: 'Default model id', required: false },
      ],
      documentationUrls: ['https://github.com/QwenLM/qwen-code'],
      loginCommand: 'qwen',
      verifyCommand: 'qwen --version',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.qwen', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'qwen');
    return { ...parsed, agent: 'qwen' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'qwen', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'qwen', source: 'global', filePaths: [filePath], ...data };
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
