/**
 * CursorAdapter — Cursor IDE CLI adapter.
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
import { readAuthConfigIdentity, tryKeychainLookup } from './auth-config.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
  findProjectRootSync,
} from './session-fs.js';

export class CursorAdapter extends BaseAgentAdapter {
  readonly agent: string = this.constructor.name.replace(/Adapter$/, "").toLowerCase();
  readonly displayName = 'Cursor';
  readonly cliCommand: string = this.agent;
  readonly minVersion = '0.40.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
  }
  readonly hostEnvSignals = ['CURSOR_SESSION', 'CURSOR_AGENT_SESSION'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: this.agent,
    canResume: true,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'sqlite',
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
    authMethods: [
      { type: 'api_key', name: 'API Key', description: 'CURSOR_API_KEY environment variable' },
      { type: 'browser_login', name: 'Browser Login', description: 'Cursor account browser login' },
    ],
    authFiles: ['.cursor/settings.json'],
    installMethods: [
      { platform: 'all', type: 'manual', command: 'Download from https://cursor.com' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: this.agent,
      modelId: 'cursor-fast',
      displayName: 'Cursor Fast',
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
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'cursor-fast',
      lastUpdated: '2025-01-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'cursor-fast';

  readonly configSchema: AgentConfigSchema = {
    agent: this.agent,
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.cursor', 'settings.json')],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];

    if (options.model) {
      args.push('--model', options.model);
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
    const apiKey = process.env['CURSOR_API_KEY'];
    if (apiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `...${apiKey.slice(-4)}`,
      };
    }
    const home = os.homedir();
    const found = await readAuthConfigIdentity([
      path.join(home, '.cursor', 'auth.json'),
      path.join(home, '.cursor', 'credentials.json'),
      path.join(home, '.config', 'cursor', 'auth.json'),
    ]);
    if (found) {
      return { status: 'authenticated', method: found.method, identity: found.identity };
    }
    const kc = await tryKeychainLookup('Cursor', 'token');
    if (kc) {
      return { status: 'authenticated', method: 'keychain', identity: `kc:...${kc.slice(-4)}` };
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: this.agent,
      providerName: 'Cursor',
      steps: [
        { step: 1, description: 'Download Cursor from https://cursor.com', url: 'https://cursor.com' },
        { step: 2, description: 'Sign in with your Cursor account in the IDE' },
        { step: 3, description: 'Optionally set CURSOR_API_KEY for CLI usage', command: 'export CURSOR_API_KEY=...' },
      ],
      envVars: [
        { name: 'CURSOR_API_KEY', description: 'Cursor API key', required: false },
      ],
      documentationUrls: ['https://cursor.com/docs'],
      verifyCommand: `${this.cliCommand} --version`,
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.cursor', 'sessions');
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

  /**
   * Override: Cursor is install-only via manual download. Return a clear
   * message rather than attempting to spawn anything.
   */
  override async install(
    _opts?: import('@a5c-ai/agent-mux-core').AdapterInstallOptions,
  ): Promise<import('@a5c-ai/agent-mux-core').InstallResult> {
    const method = this.capabilities.installMethods[0];
    const cmd = method?.command ?? 'https://cursor.com';
    return {
      ok: false,
      method: 'manual',
      command: cmd,
      message: `Cursor must be installed manually. ${cmd}`,
    };
  }

  /**
   * Override: no programmatic update path; surface a manual-update message.
   */
  override async update(
    _opts?: import('@a5c-ai/agent-mux-core').AdapterUpdateOptions,
  ): Promise<import('@a5c-ai/agent-mux-core').InstallResult> {
    return {
      ok: false,
      method: 'manual',
      command: '',
      message: 'Cursor updates are delivered via the Cursor desktop app; no CLI update is available.',
    };
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

const _name = 'cursor';
registerAdapterFactory(_name, () => new CursorAdapter(_name, getPluginTargetDescriptor(_name)?.cliCommand ?? _name));
