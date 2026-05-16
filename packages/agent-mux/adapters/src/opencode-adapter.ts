/**
 * OpenCodeAdapter — OpenCode CLI adapter.
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
import { readAuthConfigIdentity } from './auth-config.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
  findProjectRootSync,
} from './session-fs.js';

export class OpenCodeAdapter extends BaseAgentAdapter {
  readonly agent: string = this.constructor.name.replace(/Adapter$/, "").toLowerCase();
  readonly displayName = 'OpenCode';
  readonly cliCommand: string = this.agent;
  readonly minVersion = '0.1.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
  }
  get hostEnvSignals() { return getHostEnvSignals(this.agent); }

  readonly capabilities: AgentCapabilities = {
    agent: this.agent,
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
    supportsSkills: true,
    supportsAgentsMd: true,
    skillsFormat: 'file',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 5,
    supportsInteractiveMode: false,
    supportsStdinInjection: false,
    supportsImageInput: true,
    supportsImageOutput: false,
    supportsFileAttachments: true,
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
      modelId: 'claude-3-5-sonnet-20241022',
      modelAlias: 'claude-sonnet',
      displayName: 'Claude 3.5 Sonnet',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 8192,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
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
      cliArgValue: 'claude-3-5-sonnet-20241022',
      lastUpdated: '2024-10-22',
      source: 'bundled',
    },
    {
      agent: this.agent,
      modelId: 'gpt-4o',
      modelAlias: 'gpt-4o',
      displayName: 'GPT-4o',
      deprecated: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputPricePerMillion: 2.5,
      outputPricePerMillion: 10,
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
      cliArgValue: 'gpt-4o',
      lastUpdated: '2024-05-13',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'claude-3-5-sonnet-20241022';

  readonly configSchema: AgentConfigSchema = {
    agent: this.agent,
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.config', 'opencode', 'opencode.json')],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    // OpenCode uses 'run' subcommand for non-interactive execution
    args.push('run');

    // Model selection
    if (options.model) {
      args.push('--model', options.model);
    }

    // Session management
    const sessionId = this.resolveSessionId(options);
    if (sessionId) {
      if (options.forkSessionId) {
        // Fork from existing session
        args.push('--fork', options.forkSessionId);
      } else {
        // Resume or create session
        args.push('--session', sessionId);
        if (options.sessionId && !options.forkSessionId) {
          args.push('--continue');
        }
      }
    }

    // Max turns
    if (options.maxTurns != null) {
      args.push('--max-turns', String(options.maxTurns));
    }

    // System prompt
    if (options.systemPrompt) {
      args.push('--system', options.systemPrompt);
    }

    // JSON output for parsing
    args.push('--format', 'json');

    // Main prompt
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
    const event = obj['event'] as string | undefined;

    // Handle OpenCode's event-based format
    if (event === 'message' || type === 'message') {
      const content = (obj['content'] ?? obj['data'] ?? '') as string;
      if (content) {
        return { ...base, type: 'text_delta', delta: content, accumulated: content } as AgentEvent;
      }
    }

    if (event === 'tool_start' || type === 'tool_start' || event === 'tool_call' || type === 'tool_call') {
      return {
        ...base,
        type: 'tool_call_start',
        toolCallId: (obj['id'] ?? obj['tool_id'] ?? '') as string,
        toolName: (obj['name'] ?? obj['tool_name'] ?? '') as string,
        inputAccumulated: JSON.stringify(obj['input'] ?? obj['arguments'] ?? {}),
      } as AgentEvent;
    }

    if (event === 'tool_result' || type === 'tool_result') {
      return {
        ...base,
        type: 'tool_result',
        toolCallId: (obj['id'] ?? obj['tool_id'] ?? '') as string,
        toolName: (obj['name'] ?? obj['tool_name'] ?? '') as string,
        output: obj['result'] ?? obj['output'] ?? '',
        durationMs: (obj['duration'] ?? 0) as number,
      } as AgentEvent;
    }

    if (event === 'session_start' || type === 'session_start') {
      return {
        ...base,
        type: 'session_start',
        sessionId: (obj['session_id'] ?? '') as string,
        resumed: (obj['resumed'] ?? false) as boolean,
      } as AgentEvent;
    }

    if (event === 'session_end' || type === 'session_end') {
      const events: AgentEvent[] = [];

      // Final message if present
      const finalMessage = (obj['final_message'] ?? obj['message'] ?? '') as string;
      if (finalMessage) {
        events.push({ ...base, type: 'message_stop', text: finalMessage } as AgentEvent);
      }

      // Cost information
      const usage = obj['usage'] as Record<string, unknown> | undefined;
      if (usage) {
        const cost = this.assembleCostRecord(usage);
        if (cost) {
          events.push({ ...base, type: 'cost', cost } as AgentEvent);
        }
      }

      return events.length > 0 ? events : null;
    }

    if (event === 'error' || type === 'error') {
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message: (obj['message'] ?? obj['error'] ?? 'Unknown error') as string,
        recoverable: (obj['recoverable'] ?? false) as boolean,
      } as AgentEvent;
    }

    // Legacy format fallback
    if (type === 'text' || type === 'content') {
      const content = (obj['content'] ?? obj['text'] ?? '') as string;
      if (content) {
        return { ...base, type: 'text_delta', delta: content, accumulated: content } as AgentEvent;
      }
    }

    return null;
  }

  async detectAuth(): Promise<AuthState> {
    // Check for provider API keys in environment
    const anthropicKey = process.env['ANTHROPIC_API_KEY'];
    const openaiKey = process.env['OPENAI_API_KEY'];
    const googleKey = process.env['GOOGLE_API_KEY'];

    if (anthropicKey || openaiKey || googleKey) {
      const provider = anthropicKey ? 'anthropic' : openaiKey ? 'openai' : 'google';
      const key = anthropicKey || openaiKey || googleKey;
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `${provider}:...${key!.slice(-4)}`,
      };
    }

    // Check OpenCode configuration files
    const home = os.homedir();
    const found = await readAuthConfigIdentity([
      path.join(home, '.config', 'opencode', 'config.json'),
      path.join(home, '.opencode', 'config.json'),
      path.join(home, '.config', 'opencode', 'auth.json'),
    ]);
    if (found) {
      return { status: 'authenticated', method: found.method, identity: found.identity };
    }

    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: this.agent,
      providerName: 'OpenCode',
      steps: [
        { step: 1, description: 'Configure authentication using OpenCode CLI', command: 'opencode auth' },
        { step: 2, description: 'Alternatively, set provider API keys directly' },
        { step: 3, description: 'For Anthropic: export ANTHROPIC_API_KEY=sk-ant-...', command: 'export ANTHROPIC_API_KEY=sk-ant-...' },
        { step: 4, description: 'For OpenAI: export OPENAI_API_KEY=sk-...', command: 'export OPENAI_API_KEY=sk-...' },
        { step: 5, description: 'For Google: export GOOGLE_API_KEY=...', command: 'export GOOGLE_API_KEY=...' },
      ],
      envVars: [
        { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: false },
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false },
        { name: 'GOOGLE_API_KEY', description: 'Google API key', required: false },
      ],
      documentationUrls: ['https://github.com/anomalyco/opencode'],
      loginCommand: `${this.cliCommand} auth`,
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

const _name = 'opencode';
registerAdapterFactory(_name, () => new OpenCodeAdapter(_name, getPluginTargetDescriptor(_name)?.cliCommand ?? _name));
