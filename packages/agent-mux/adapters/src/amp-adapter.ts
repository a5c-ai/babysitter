/**
 * Adapter for Sourcegraph Amp CLI.
 *
 * Amp is Sourcegraph's agentic coding assistant with multi-model support,
 * specialized subagents (Oracle, Librarian), and advanced code understanding.
 */

import { BaseAgentAdapter } from './base-adapter.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import type {
  AgentCapabilities,
  AgentConfigSchema,
  ModelCapabilities,
  AuthState,
  AuthSetupGuidance,
  Session,
  RunOptions,
  SpawnArgs,
  ParseContext,
  AgentEvent,
  InstalledPlugin,
  PluginInstallOptions,
  AgentConfig,
} from '@a5c-ai/agent-mux-comm';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

export class AmpAdapter extends BaseAgentAdapter {
  readonly agent: string;
  readonly displayName = 'Sourcegraph Amp';
  readonly cliCommand: string;
  readonly minVersion = '2.0.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase();
    this.cliCommand = cliCommand ?? this.agent;
  }
  readonly hostEnvSignals = ['SOURCEGRAPH_ACCESS_TOKEN', 'AMP_CONFIG_PATH'];

  readonly capabilities: AgentCapabilities = {
    agent: 'amp',
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
    supportsSkills: false,
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 8,
    supportsInteractiveMode: false,
    supportsStdinInjection: false,
    supportsImageInput: true,
    supportsImageOutput: false,
    supportsFileAttachments: true,
    supportsPlugins: false,
    pluginFormats: [],
    pluginRegistries: [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      {
        type: 'api_key',
        name: 'Sourcegraph Access Token',
        description: 'SOURCEGRAPH_ACCESS_TOKEN environment variable',
      },
      {
        type: 'browser_login',
        name: 'Sourcegraph OAuth',
        description: 'Interactive browser-based login',
      },
    ],
    authFiles: ['.config/amp/config.json'],
    installMethods: [
      {
        platform: 'all',
        type: 'npm',
        command: 'npm install -g @ampcode/cli',
      },
      {
        platform: 'linux',
        type: 'curl',
        command: 'curl -fsSL https://get.sourcegraph.com/amp | bash',
      },
      {
        platform: 'all',
        type: 'manual',
        command: 'open https://github.com/sourcegraph/amp/releases',
        notes: 'Download from GitHub Releases: https://github.com/sourcegraph/amp/releases',
      },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'amp',
      modelId: 'claude-3-5-sonnet-20241022',
      displayName: 'Claude 3.5 Sonnet',
      modelAlias: 'claude-sonnet',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 8192,
      inputPricePerMillion: 3.0,
      outputPricePerMillion: 15.0,
      supportsThinking: false,
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
      cliArgValue: 'claude-3-5-sonnet-20241022',
      lastUpdated: '2024-10-22',
      source: 'bundled',
    },
    {
      agent: 'amp',
      modelId: 'gpt-4o',
      displayName: 'GPT-4o',
      modelAlias: 'gpt-4o',
      deprecated: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputPricePerMillion: 5.0,
      outputPricePerMillion: 15.0,
      supportsThinking: false,
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
      cliArgValue: 'gpt-4o',
      lastUpdated: '2024-11-01',
      source: 'bundled',
    },
    {
      agent: 'amp',
      modelId: 'amp-oracle',
      displayName: 'Amp Oracle (Multi-Model)',
      modelAlias: 'oracle',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 8192,
      supportsThinking: false,
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
      cliArgValue: 'oracle',
      lastUpdated: '2026-01-01',
      source: 'bundled',
    },
    {
      agent: 'amp',
      modelId: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro',
      modelAlias: 'gemini-pro',
      deprecated: false,
      contextWindow: 2000000,
      maxOutputTokens: 8192,
      inputPricePerMillion: 1.25,
      outputPricePerMillion: 5.0,
      supportsThinking: false,
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
      cliArgValue: 'gemini-1.5-pro',
      lastUpdated: '2024-09-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'amp-oracle';

  readonly configSchema: AgentConfigSchema = {
    agent: 'amp',
    version: 1,
    fields: [],
    configFilePaths: [join(homedir(), '.config', 'amp', 'config.json')],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    // Command selection
    if (options.sessionId) {
      args.push('resume', options.sessionId);
    } else {
      args.push('chat');
    }

    // Output format
    args.push('--output', 'jsonl');
    args.push('--stream');

    // Model selection
    if (options.model) {
      args.push('--model', options.model);
    }

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
      cwd: options.cwd ?? process.cwd(),
      env: this.buildEnvFromOptions(options),
      stdin,
      usePty: false,
    };
  }

  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      const baseEvent = {
        agent: this.agent,
        runId: context.runId,
        timestamp: Date.now(),
      };

      switch (parsed.type) {
        case 'session_start':
          return {
            type: 'session_start' as const,
            ...baseEvent,
            sessionId: parsed.sessionId,
            resumed: false,
          };

        case 'text_delta':
          return {
            type: 'text_delta' as const,
            ...baseEvent,
            delta: parsed.content || parsed.delta,
            accumulated: parsed.accumulated,
          };

        case 'tool_call_start':
          return {
            type: 'tool_call_start' as const,
            ...baseEvent,
            toolCallId: parsed.id,
            toolName: parsed.tool || parsed.name,
            inputAccumulated: JSON.stringify(parsed.arguments || parsed.args || {}),
          };

        case 'tool_result':
          return {
            type: 'tool_result' as const,
            ...baseEvent,
            toolCallId: parsed.id,
            toolName: parsed.tool || parsed.name,
            output: parsed.result || parsed.output,
            durationMs: parsed.duration || parsed.durationMs,
          };

        case 'cost':
          return {
            type: 'cost' as const,
            ...baseEvent,
            cost: {
              totalUsd: parsed.totalUsd || parsed.total,
              inputTokens: parsed.inputTokens || parsed.input || 0,
              outputTokens: parsed.outputTokens || parsed.output || 0,
              thinkingTokens: parsed.thinkingTokens || 0,
              cacheReadTokens: parsed.cacheReadTokens,
              cacheCreationTokens: parsed.cacheCreationTokens,
            },
          };

        case 'error':
          return {
            type: 'error' as const,
            ...baseEvent,
            code: parsed.code,
            message: parsed.message,
            recoverable: parsed.recoverable ?? true,
          };

        case 'session_end':
          return {
            type: 'session_end' as const,
            ...baseEvent,
            sessionId: parsed.sessionId,
            turnCount: parsed.turnCount || parsed.turns || 0,
          };

        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  sessionDir(_cwd?: string): string {
    return join(homedir(), '.config', 'amp', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'amp');
    return { ...parsed, agent: 'amp', title: parsed.sessionId };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async detectAuth(): Promise<AuthState> {
    const token = process.env['SOURCEGRAPH_ACCESS_TOKEN'];
    if (token) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `token-...${token.slice(-4)}`,
      };
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'amp',
      providerName: 'Sourcegraph Amp',
      steps: [
        {
          step: 1,
          description: 'Sign up for a Sourcegraph account at sourcegraph.com',
          url: 'https://sourcegraph.com/sign-up',
        },
        {
          step: 2,
          description: 'Install the Amp CLI',
          command: 'npm install -g @ampcode/cli',
        },
        {
          step: 3,
          description: 'Generate an access token in Sourcegraph settings',
          url: 'https://sourcegraph.com/users/settings/tokens',
        },
        {
          step: 4,
          description: 'Authenticate with Sourcegraph',
          command: 'amp auth login',
        },
      ],
      envVars: [
        {
          name: 'SOURCEGRAPH_ACCESS_TOKEN',
          description: 'Sourcegraph access token for API authentication',
          required: false,
          exampleFormat: 'sgp_...',
        },
      ],
      documentationUrls: ['https://docs.sourcegraph.com/amp'],
      loginCommand: 'amp auth login',
      verifyCommand: 'amp --version',
    };
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const configPath = join(homedir(), '.config', 'amp', 'config.json');
    const data = (await readJsonFile<Record<string, unknown>>(configPath)) ?? {};
    return { agent: 'amp', source: 'global', filePaths: [configPath], ...data };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    const configPath = join(homedir(), '.config', 'amp', 'config.json');
    const existing = (await readJsonFile<Record<string, unknown>>(configPath)) ?? {};
    const { agent: _a, source: _s, filePaths: _fp, ...rest } = config as Record<string, unknown>;
    void _a; void _s; void _fp;
    await writeJsonFileAtomic(configPath, { ...existing, ...rest });
  }

  async listPlugins(): Promise<InstalledPlugin[]> {
    // Amp doesn't have native plugin support in the same way Claude does
    return [];
  }

  async installPlugin(
    _pluginId: string,
    _options?: PluginInstallOptions,
  ): Promise<InstalledPlugin> {
    throw new Error('Amp does not support plugin installation via agent-mux');
  }

  async uninstallPlugin(_pluginId: string): Promise<void> {
    throw new Error('Amp does not support plugin uninstallation via agent-mux');
  }
}
