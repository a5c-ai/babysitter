/**
 * GeminiAdapter — Google Gemini CLI adapter.
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
  findProjectRootSync,
} from './session-fs.js';

export class GeminiAdapter extends BaseAgentAdapter {
  readonly agent = 'gemini' as const;
  readonly displayName = 'Gemini CLI';
  readonly cliCommand = 'gemini';
  readonly minVersion = '0.1.0';
  readonly hostEnvSignals = ['GEMINI_CLI', 'GEMINI_SESSION_ID'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'gemini',
    canResume: true,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsThinkingStreaming: true,
    supportsNativeTools: true,
    supportsMCP: true,
    supportsParallelToolCalls: true,
    requiresToolApproval: true,
    approvalModes: ['yolo', 'prompt'],
    runtimeHooks: createVirtualRuntimeHookCapabilities(),
    supportsThinking: true,
    thinkingEffortLevels: ['low', 'medium', 'high'],
    supportsThinkingBudgetTokens: true,
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    structuredSessionTransport: 'restart-per-turn',
    sessionControlPlane: 'self-managed',
    supportsSkills: false,
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: false,
    supportsParallelExecution: false,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: true,
    supportsImageOutput: false,
    supportsFileAttachments: true,
    supportsPlugins: true,
    pluginFormats: ['mcp-server'],
    pluginRegistries: [{ name: 'mcp', url: 'https://modelcontextprotocol.io', searchable: false }],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'API Key', description: 'GOOGLE_API_KEY or GEMINI_API_KEY environment variable' },
      { type: 'browser_login', name: 'Browser Login', description: 'Google account browser login' },
    ],
    authFiles: ['.config/gemini/settings.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @google/gemini-cli' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'gemini',
      modelId: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      deprecated: false,
      contextWindow: 1000000,
      maxOutputTokens: 65536,
      maxThinkingTokens: 65536,
      supportsThinking: true,
      thinkingEffortLevels: ['low', 'medium', 'high'],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: true,
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'gemini-2.5-pro',
      lastUpdated: '2025-03-01',
      source: 'bundled',
    },
    {
      agent: 'gemini',
      modelId: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      deprecated: false,
      contextWindow: 1000000,
      maxOutputTokens: 65536,
      supportsThinking: true,
      thinkingEffortLevels: ['low', 'medium', 'high'],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: true,
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'gemini-2.5-flash',
      lastUpdated: '2025-03-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'gemini-2.5-pro';

  readonly configSchema: AgentConfigSchema = {
    agent: 'gemini',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.config', 'gemini', 'settings.json')],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    if (options.model) {
      args.push('--model', options.model);
    }

    if (options.approvalMode === 'yolo') {
      args.push('--sandbox', 'false');
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

    if (type === 'thinking') {
      const thinking = (obj['content'] ?? '') as string;
      return { ...base, type: 'thinking_delta', delta: thinking, accumulated: thinking } as AgentEvent;
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
    const googleKey = process.env['GOOGLE_API_KEY'];
    if (googleKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `...${googleKey.slice(-4)}`,
      };
    }
    const geminiKey = process.env['GEMINI_API_KEY'];
    if (geminiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `...${geminiKey.slice(-4)}`,
      };
    }
    const home = os.homedir();
    const found = await readAuthConfigIdentity([
      path.join(home, '.gemini', 'credentials.json'),
      path.join(home, '.gemini', 'auth.json'),
      path.join(home, '.config', 'gemini', 'credentials.json'),
    ]);
    if (found) {
      return { status: 'authenticated', method: found.method, identity: found.identity };
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'gemini',
      providerName: 'Google',
      steps: [
        { step: 1, description: 'Get an API key from https://aistudio.google.com/apikey', url: 'https://aistudio.google.com/apikey' },
        { step: 2, description: 'Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable', command: 'export GOOGLE_API_KEY=...' },
        { step: 3, description: 'Alternatively, run `gemini` and follow the browser login flow', command: 'gemini' },
      ],
      envVars: [
        { name: 'GOOGLE_API_KEY', description: 'Google API key', required: false, exampleFormat: 'AIza...' },
        { name: 'GEMINI_API_KEY', description: 'Gemini API key (alternative)', required: false, exampleFormat: 'AIza...' },
      ],
      documentationUrls: ['https://github.com/google-gemini/gemini-cli'],
      loginCommand: 'gemini',
      verifyCommand: 'gemini --version',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.gemini', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'gemini');
    return { ...parsed, agent: 'gemini' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'gemini', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'gemini', source: 'global', filePaths: [filePath], ...data };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return;
    const existing = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    const { agent: _a, source: _s, filePaths: _fp, ...rest } = config as Record<string, unknown>;
    void _a; void _s; void _fp;
    await writeJsonFileAtomic(filePath, { ...existing, ...rest });
  }

  /**
   * Override: `gemini --version` output on some platforms is simply a bare
   * version line like `0.4.2`. The base semver regex handles that but this
   * override strips the leading `gemini-cli/` or `gemini ` prefix if present.
   */
  protected override parseVersionOutput(raw: string): string | undefined {
    const cleaned = raw
      .replace(/^\s*gemini[\s-]*(cli)?[\s-/]*/i, '')
      .trim();
    const match = cleaned.match(/\d+\.\d+\.\d+(?:[\w.+-]*)?/);
    return match ? match[0] : undefined;
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
registerAdapterFactory('gemini', () => new GeminiAdapter());
