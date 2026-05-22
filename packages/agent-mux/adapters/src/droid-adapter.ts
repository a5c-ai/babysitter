/**
 * DroidAdapter — Factory AI Droid CLI adapter.
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
} from '@a5c-ai/agent-mux-core';

import { BaseAgentAdapter } from './base-adapter.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import { mcpListPlugins, mcpInstallPlugin, mcpUninstallPlugin } from './mcp-plugins.js';
import { readAuthConfigIdentity } from './auth-config.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

export class DroidAdapter extends BaseAgentAdapter {
  readonly agent: string;
  readonly displayName = 'Factory Droid';
  readonly cliCommand: string;
  readonly minVersion = '1.0.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase();
    this.cliCommand = cliCommand ?? this.agent;
  }
  readonly hostEnvSignals = ['DROID_API_KEY', 'DROID_CONFIG_PATH'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'droid',
    canResume: true,
    canFork: true,
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
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    structuredSessionTransport: 'restart-per-turn',
    sessionControlPlane: 'self-managed',
    supportsSkills: false, // Droid has its own automation system
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: true, // Droid supports parallel execution
    supportsParallelExecution: true,
    maxParallelTasks: 10,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: true,
    supportsImageOutput: false,
    supportsFileAttachments: true,
    supportsPlugins: true,
    pluginFormats: ['mcp-server'],
    pluginRegistries: [{ name: 'factory', url: 'https://factory.ai/plugins', searchable: true }],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'API Key', description: 'Factory AI API key via droid auth' },
      { type: 'oauth', name: 'OAuth', description: 'Factory AI OAuth via droid login' },
    ],
    authFiles: ['.config/droid/config.json', '.droid/auth.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @factory/droid-cli' },
      { platform: 'darwin', type: 'brew', command: 'brew install factory/tap/droid' },
      { platform: 'all', type: 'curl', command: 'curl -fsSL https://get.factory.ai/droid | bash' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'droid',
      modelId: 'gpt-5-turbo',
      modelAlias: 'gpt-5-turbo',
      displayName: 'GPT-5 Turbo',
      deprecated: false,
      contextWindow: 256000,
      maxOutputTokens: 16384,
      inputPricePerMillion: 2.0,
      outputPricePerMillion: 8.0,
      supportsThinking: false,
      thinkingEffortLevels: [],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'gpt-5-turbo',
      lastUpdated: '2026-03-15',
      source: 'bundled',
    },
    {
      agent: 'droid',
      modelId: 'claude-3-5-sonnet-20241022',
      modelAlias: 'claude-sonnet',
      displayName: 'Claude 3.5 Sonnet',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 8192,
      inputPricePerMillion: 3.0,
      outputPricePerMillion: 15.0,
      supportsThinking: false,
      thinkingEffortLevels: [],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'claude-3-5-sonnet',
      lastUpdated: '2024-10-22',
      source: 'bundled',
    },
    {
      agent: 'droid',
      modelId: 'gemini-2-flash',
      modelAlias: 'gemini-flash',
      displayName: 'Gemini 2.0 Flash',
      deprecated: false,
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      inputPricePerMillion: 0.075,
      outputPricePerMillion: 0.3,
      supportsThinking: false,
      thinkingEffortLevels: [],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'gemini-2-flash',
      lastUpdated: '2026-02-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'gpt-5-turbo';

  readonly configSchema: AgentConfigSchema = {
    agent: 'droid',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.config', 'droid', 'config.json')],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    // Basic command structure: droid chat [options] [prompt]
    if (options.sessionId) {
      // Resume existing session
      args.push('resume', options.sessionId);
    } else {
      // Start new chat
      args.push('chat');
    }

    // Model selection
    if (options.model) {
      args.push('--model', options.model);
    }

    // Output format
    args.push('--output', 'jsonl');
    args.push('--stream');

    // System prompt
    if (options.systemPrompt) {
      args.push('--system', options.systemPrompt);
    }

    // Tool approval mode
    if (options.approvalMode === 'yolo') {
      args.push('--auto-approve');
    }

    // Max turns
    if (options.maxTurns) {
      args.push('--max-turns', String(options.maxTurns));
    }

    // Working directory
    if (options.cwd) {
      args.push('--cwd', options.cwd);
    }

    const { prompt, stdin } = this.buildPromptTransport(options);
    if (stdin === undefined) {
      args.push('--headless');
      args.push('--prompt', prompt);
    }

    return {
      command: this.cliCommand,
      args,
      env: this.buildEnvFromOptions(options),
      cwd: options.cwd ?? process.cwd(),
      stdin,
      usePty: false,
    };
  }

  parseEvent(line: string, context: ParseContext): AgentEvent | null {
    if (!line.trim()) return null;

    try {
      const parsed = JSON.parse(line);
      const timestamp = Date.now();
      const { runId } = context;

      // Droid event format mapping
      switch (parsed.type) {
        case 'session_start':
          return {
            type: 'session_start',
            timestamp,
            runId,
            agent: this.agent,
            sessionId: parsed.sessionId || runId,
            resumed: false,
          };

        case 'text_delta':
          return {
            type: 'text_delta',
            timestamp,
            runId,
            agent: this.agent,
            delta: parsed.content || '',
            accumulated: parsed.accumulated || '',
          };

        case 'tool_call_start':
          return {
            type: 'tool_call_start',
            timestamp,
            runId,
            agent: this.agent,
            toolCallId: parsed.id || '',
            toolName: parsed.tool || '',
            inputAccumulated: '',
          };

        case 'tool_call_ready':
          return {
            type: 'tool_call_ready',
            timestamp,
            runId,
            agent: this.agent,
            toolCallId: parsed.id || '',
            toolName: parsed.tool || '',
            input: parsed.input || '',
          };

        case 'tool_result':
          return {
            type: 'tool_result',
            timestamp,
            runId,
            agent: this.agent,
            toolCallId: parsed.id || '',
            toolName: parsed.tool || '',
            output: parsed.result || parsed.output || '',
            durationMs: parsed.duration || 0,
          };

        case 'message_stop':
          return {
            type: 'message_stop',
            timestamp,
            runId,
            agent: this.agent,
            text: parsed.text || '',
          };

        case 'cost':
          return {
            type: 'cost',
            timestamp,
            runId,
            agent: this.agent,
            cost: {
              totalUsd: parsed.totalUsd || 0,
              inputTokens: parsed.inputTokens || 0,
              outputTokens: parsed.outputTokens || 0,
              thinkingTokens: 0,
            },
          };

        case 'error':
          return {
            type: 'error',
            timestamp,
            runId,
            agent: this.agent,
            code: parsed.code || 'UNKNOWN',
            message: parsed.message || 'Unknown error',
            recoverable: parsed.recoverable ?? false,
          };

        default:
          // Fallback for unknown events
          return null;
      }
    } catch {
      // Not valid JSON, ignore
      return null;
    }
  }

  async detectAuth(_cwd?: string): Promise<AuthState> {
    // Check for API key in environment
    const apiKey = process.env['DROID_API_KEY'];
    if (apiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `factory:...${apiKey.slice(-4)}`,
      };
    }

    // Check for config file authentication
    const found = await readAuthConfigIdentity([
      path.join(os.homedir(), '.config', 'droid', 'config.json'),
      path.join(os.homedir(), '.droid', 'auth.json'),
    ]);
    if (found) {
      return { status: 'authenticated', method: found.method, identity: found.identity };
    }

    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'droid',
      providerName: 'Factory AI Droid',
      steps: [
        { step: 1, description: 'Sign up for Factory AI account', url: 'https://factory.ai/signup' },
        { step: 2, description: 'Install Droid CLI', command: 'npm install -g @factory/droid-cli' },
        { step: 3, description: 'Authenticate with Factory AI', command: 'droid auth login' },
        { step: 4, description: 'Verify authentication', command: 'droid whoami' },
      ],
      documentationUrls: ['https://docs.factory.ai/droid'],
      loginCommand: 'droid auth login',
      verifyCommand: 'droid --version',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.config', 'droid', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'droid');
    return { ...parsed, agent: 'droid' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const configPath = path.join(os.homedir(), '.config', 'droid', 'config.json');
    const data = (await readJsonFile<Record<string, unknown>>(configPath)) ?? {};
    return { agent: 'droid', source: 'global', filePaths: [configPath], ...data };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    const configPath = path.join(os.homedir(), '.config', 'droid', 'config.json');
    const existing = (await readJsonFile<Record<string, unknown>>(configPath)) ?? {};
    const { agent: _a, source: _s, filePaths: _fp, ...rest } = config as Record<string, unknown>;
    void _a; void _s; void _fp;
    await writeJsonFileAtomic(configPath, { ...existing, ...rest });
  }

  private settingsPath(): string {
    return path.join(os.homedir(), '.config', 'droid', 'config.json');
  }

  async listPlugins(): Promise<InstalledPlugin[]> {
    return mcpListPlugins(this.settingsPath());
  }

  async installPlugin(
    pluginId: string,
    options?: PluginInstallOptions,
  ): Promise<InstalledPlugin> {
    return mcpInstallPlugin(this.settingsPath(), pluginId, options);
  }

  async uninstallPlugin(pluginId: string, options?: { global?: boolean }): Promise<void> {
    return mcpUninstallPlugin(this.settingsPath(), pluginId);
  }
}
