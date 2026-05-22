import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';

import type {
  AgentCapabilities,
  AgentConfig,
  AgentConfigSchema,
  AuthSetupGuidance,
  AuthState,
  ModelCapabilities,
  RemoteConnection,
  RunOptions,
  ServerHealth,
  ServerInfo,
  Session,
} from '@a5c-ai/agent-mux-core';

import { readAuthConfigIdentity } from './auth-config.js';
import { BaseRemoteAdapter } from './remote-adapter-base.js';
import { CodexWebSocketConnection } from './codex-websocket-connection.js';
import {
  listJsonlFiles,
  parseCodexSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

export { CodexWebSocketConnection } from './codex-websocket-connection.js';

export class CodexWebSocketAdapter extends BaseRemoteAdapter {
  readonly agent: string;
  readonly displayName = 'Codex (App Server)';
  readonly connectionType = 'websocket' as const;
  readonly minVersion = '0.121.0';

  constructor(agent?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase().replace(/websocket$/, '-websocket');
  }
  readonly hostEnvSignals = ['CODEX_APP_SERVER', 'OPENAI_API_KEY', 'CODEX_CLI'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'codex-websocket',
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
    approvalModes: ['yolo', 'prompt', 'deny'],
    runtimeHooks: {
      preToolUse: 'unsupported',
      postToolUse: 'unsupported',
      sessionStart: 'unsupported',
      sessionEnd: 'unsupported',
      stop: 'unsupported',
      userPromptSubmit: 'unsupported',
    },
    supportsThinking: true,
    thinkingEffortLevels: ['low', 'medium', 'high', 'max'],
    supportsThinkingBudgetTokens: false,
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    structuredSessionTransport: 'persistent',
    sessionControlPlane: 'external-host',
    supportsSkills: true,
    supportsAgentsMd: true,
    skillsFormat: 'directory',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
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
      { type: 'api_key', name: 'API Key', description: 'OPENAI_API_KEY environment variable' },
      { type: 'oauth', name: 'ChatGPT Login', description: 'Local Codex CLI account login' },
    ],
    authFiles: ['.codex/auth.json', '.codex/credentials.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @openai/codex' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'codex-websocket',
      modelId: 'o4-mini',
      displayName: 'o4-mini',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
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
      inputPricePerMillion: 0.15,
      outputPricePerMillion: 0.6,
      cachedInputPricePerMillion: 0.075,
      cliArgKey: 'model',
      cliArgValue: 'o4-mini',
      lastUpdated: '2026-04-01',
      source: 'bundled',
    },
    {
      agent: 'codex-websocket',
      modelId: 'codex-mini-latest',
      displayName: 'Codex Mini',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
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
      inputPricePerMillion: 0.1,
      outputPricePerMillion: 0.4,
      cachedInputPricePerMillion: 0.05,
      cliArgKey: 'model',
      cliArgValue: 'codex-mini-latest',
      lastUpdated: '2026-04-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'o4-mini';

  readonly configSchema: AgentConfigSchema = {
    agent: 'codex-websocket',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.codex', 'config.json')],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

  private readonly serverProcesses = new Map<string, ChildProcess>();

  async connect(options: RunOptions): Promise<RemoteConnection> {
    const serverInfo = await this.ensureServer();
    const connection = new CodexWebSocketConnection({
      websocketUrl: serverInfo.endpoint,
      connectionId: this.generateConnectionId(),
      prompt: Array.isArray(options.prompt) ? options.prompt.join('\n') : options.prompt ?? '',
      cwd: options.cwd ?? process.cwd(),
      requestedModel: options.model,
      approvalMode: options.approvalMode ?? 'prompt',
      sessionId: options.sessionId,
      models: this.models,
    });
    await connection.connect();
    this.registerConnection(connection);
    return connection;
  }

  async disconnect(connection: RemoteConnection): Promise<void> {
    await connection.close();
    this.unregisterConnection(connection.connectionId);
  }

  async startServer(): Promise<ServerInfo> {
    const external = process.env['CODEX_APP_SERVER'];
    if (external) {
      return {
        serverId: 'codex-app-server-external',
        serverType: 'codex-websocket',
        endpoint: this.normalizeEndpoint(external),
        port: this.extractPort(external),
        startedAt: new Date(),
      };
    }

    const resolved = this.resolveCodexCommand();
    if (!resolved) {
      throw new Error('Could not locate the Codex CLI needed for app-server transport');
    }

    const port = await this.findAvailablePort(32150);
    const serverId = this.generateServerId();
    const endpoint = `ws://127.0.0.1:${port}`;
    const child = spawn(resolved.command, [...resolved.args, 'app-server', '--listen', endpoint], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let startupError = '';
    child.stderr?.on('data', (chunk) => {
      startupError += String(chunk);
    });
    child.once('error', (error) => {
      startupError += error.message;
    });
    child.once('exit', (code) => {
      if (code !== 0 && this.serverProcesses.has(serverId)) {
        this.serverProcesses.delete(serverId);
      }
    });

    const serverInfo: ServerInfo = {
      serverId,
      serverType: 'codex-websocket',
      endpoint,
      pid: child.pid,
      port,
      startedAt: new Date(),
    };
    this.serverProcesses.set(serverId, child);
    this.registerServer(serverInfo);

    const started = await this.waitForHealthy(serverInfo, 10_000);
    if (!started) {
      this.serverProcesses.delete(serverId);
      this.unregisterServer(serverId);
      child.kill();
      throw new Error(startupError.trim() || 'Timed out waiting for codex app-server to become ready');
    }

    return serverInfo;
  }

  async stopServer(serverInfo: ServerInfo): Promise<void> {
    const processHandle = this.serverProcesses.get(serverInfo.serverId);
    if (processHandle && !processHandle.killed) {
      processHandle.kill();
    }
    this.serverProcesses.delete(serverInfo.serverId);
    this.unregisterServer(serverInfo.serverId);
  }

  async healthCheck(serverInfo: ServerInfo): Promise<ServerHealth> {
    const readyUrl = `${serverInfo.endpoint.replace(/^ws/, 'http')}/readyz`;
    try {
      const response = await fetch(readyUrl);
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        details: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async detectAuth(): Promise<AuthState> {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (apiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `openai:...${apiKey.slice(-4)}`,
      };
    }

    const codexHome = process.env['CODEX_HOME'] ?? path.join(os.homedir(), '.codex');
    const found = await readAuthConfigIdentity([
      path.join(codexHome, 'auth.json'),
      path.join(codexHome, 'credentials.json'),
    ]);
    if (found) {
      return { status: 'authenticated', method: found.method, identity: found.identity };
    }

    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'codex-websocket',
      providerName: 'OpenAI',
      steps: [
        {
          step: 1,
          description: 'Install the Codex CLI',
          command: 'npm install -g @openai/codex',
        },
        {
          step: 2,
          description: 'Authenticate with either OPENAI_API_KEY or the Codex login flow',
          command: 'codex',
        },
        {
          step: 3,
          description: 'Verify the app-server surface is available',
          command: 'codex app-server --help',
        },
      ],
      envVars: [
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false, exampleFormat: 'sk-...' },
        { name: 'CODEX_APP_SERVER', description: 'Optional external Codex app-server WebSocket endpoint', required: false, exampleFormat: 'ws://127.0.0.1:32150' },
      ],
      documentationUrls: ['https://developers.openai.com/codex/sdk'],
      loginCommand: 'codex',
      verifyCommand: 'codex app-server --help',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.codex', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseCodexSessionFile(filePath, 'codex-websocket');
    return { ...parsed, agent: 'codex-websocket' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'codex-websocket', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'codex-websocket', source: 'global', filePaths: [filePath], ...data };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return;
    const existing = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    const { agent: _agent, source: _source, filePaths: _filePaths, ...rest } = config as Record<string, unknown>;
    void _agent;
    void _source;
    void _filePaths;
    await writeJsonFileAtomic(filePath, { ...existing, ...rest });
  }

  protected async ensureServer(): Promise<ServerInfo> {
    for (const server of this.managedServers.values()) {
      if (server.serverType !== 'codex-websocket') {
        continue;
      }
      const health = await this.healthCheck?.(server);
      if (health?.status === 'healthy') {
        return server;
      }
    }
    return this.startServer();
  }

  private async waitForHealthy(serverInfo: ServerInfo, timeoutMs: number): Promise<boolean> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const health = await this.healthCheck(serverInfo);
      if (health.status === 'healthy') {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
  }

  private resolveCodexCommand(): { command: string; args: string[] } | null {
    const resolved = this.findCommandInPath('codex');
    if (!resolved) {
      return null;
    }

    if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(resolved)) {
      const powershellShim = resolved.replace(/\.(cmd|bat)$/i, '.ps1');
      if (fs.existsSync(powershellShim)) {
        return {
          command: 'powershell.exe',
          args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', powershellShim],
        };
      }
      return {
        command: 'cmd.exe',
        args: ['/d', '/s', '/c', resolved],
      };
    }

    if (process.platform === 'win32' && /\.ps1$/i.test(resolved)) {
      return {
        command: 'powershell.exe',
        args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolved],
      };
    }

    return { command: resolved, args: [] };
  }

  private findCommandInPath(command: string): string | null {
    const pathEnv = process.env['PATH'];
    if (!pathEnv) {
      return null;
    }
    const extensions = process.platform === 'win32'
      ? ['.exe', '.cmd', '.bat', '.ps1', '']
      : [''];
    for (const directory of pathEnv.split(path.delimiter)) {
      for (const extension of extensions) {
        const candidate = path.join(directory, `${command}${extension}`);
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }
    return null;
  }

  private normalizeEndpoint(endpoint: string): string {
    if (endpoint.startsWith('http://')) {
      return endpoint.replace(/^http/, 'ws');
    }
    if (endpoint.startsWith('https://')) {
      return endpoint.replace(/^https/, 'wss');
    }
    return endpoint;
  }

  private extractPort(endpoint: string): number {
    try {
      return Number(new URL(endpoint).port || 0);
    } catch {
      return 0;
    }
  }
}
