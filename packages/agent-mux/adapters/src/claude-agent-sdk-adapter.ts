import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';

import type {
  AgentCapabilities,
  ModelCapabilities,
  AgentConfigSchema,
  AuthState,
  AuthSetupGuidance,
  Session,
  RunOptions,
  AgentEvent,
  AgentConfig,
  InstalledPlugin,
  PluginInstallOptions,
  CostRecord,
  DetectInstallationResult,
  InteractionResponse,
  ProgrammaticRun,
} from '@a5c-ai/agent-mux-core';
import type {
  Options as ClaudeSdkOptions,
  Query as ClaudeSdkQuery,
  SDKMessage as ClaudeSdkMessage,
  SDKUserMessage as ClaudeSdkUserMessage,
  PermissionResult as ClaudePermissionResult,
  ElicitationResult as ClaudeElicitationResult,
} from '@anthropic-ai/claude-agent-sdk';

import { BaseProgrammaticAdapter } from './programmatic-adapter-base.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import { mcpListPlugins, mcpInstallPlugin, mcpUninstallPlugin } from './mcp-plugins.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

const require = createRequire(import.meta.url);

type ClaudeSdkModule = {
  query(params: {
    prompt: string | AsyncIterable<ClaudeSdkUserMessage>;
    options?: ClaudeSdkOptions;
  }): ClaudeSdkQuery;
};

type PendingApproval = {
  resolve: (value: ClaudePermissionResult) => void;
  reject: (reason?: unknown) => void;
};

type PendingInput = {
  resolve: (value: ClaudeElicitationResult) => void;
  reject: (reason?: unknown) => void;
};

type ToolState = {
  id: string;
  name: string;
  rawInput: string;
  thinking?: string;
};

class AsyncQueue<T> implements AsyncIterableIterator<T> {
  private readonly values: T[] = [];
  private readonly waiters: Array<{
    resolve: (value: IteratorResult<T>) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private closed = false;
  private failure: unknown = null;

  enqueue(value: T): void {
    if (this.closed) {
      throw new Error('Queue is closed');
    }
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve({ value, done: false });
      return;
    }
    this.values.push(value);
  }

  fail(error: unknown): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.failure = error;
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(error);
    }
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    for (const waiter of this.waiters.splice(0)) {
      waiter.resolve({ value: undefined as T, done: true });
    }
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.values.length > 0) {
      return { value: this.values.shift()!, done: false };
    }
    if (this.failure != null) {
      throw this.failure;
    }
    if (this.closed) {
      return { value: undefined as T, done: true };
    }
    return new Promise<IteratorResult<T>>((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  async return(): Promise<IteratorResult<T>> {
    this.close();
    return { value: undefined as T, done: true };
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

export class ClaudeAgentSdkAdapter extends BaseProgrammaticAdapter {
  readonly agent: string;
  readonly displayName = 'Claude (Agent SDK)';
  readonly minVersion = '0.2.0';

  constructor(agent?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase().replace(/claudeagentsdk/, 'claude-agent-sdk');
  }
  readonly hostEnvSignals = ['ANTHROPIC_API_KEY', 'CLAUDE_AGENT_API_KEY', 'CLAUDE_CODE_ENTRYPOINT'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'claude-agent-sdk',
    canResume: true,
    canFork: true,
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
    runtimeHooks: createVirtualRuntimeHookCapabilities(),
    supportsThinking: true,
    thinkingEffortLevels: ['low', 'medium', 'high', 'max'],
    supportsThinkingBudgetTokens: true,
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    structuredSessionTransport: 'persistent',
    sessionControlPlane: 'self-managed',
    supportsSkills: true,
    supportsAgentsMd: true,
    skillsFormat: 'file',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 10,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: true,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins: true,
    pluginFormats: ['mcp-server'],
    pluginRegistries: [{ name: 'mcp', url: 'https://modelcontextprotocol.io', searchable: false }],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'API Key', description: 'ANTHROPIC_API_KEY environment variable' },
      { type: 'oauth', name: 'Claude Login', description: 'Claude Code browser login or stored credentials' },
    ],
    authFiles: ['.claude.json', '.claude/.credentials.json', '.claude/settings.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @anthropic-ai/claude-agent-sdk' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'claude-agent-sdk',
      modelId: 'claude-sonnet-4-20250514',
      modelAlias: 'sonnet',
      displayName: 'Claude Sonnet 4 (SDK)',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 16384,
      maxThinkingTokens: 128000,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      thinkingPricePerMillion: 3,
      cachedInputPricePerMillion: 0.3,
      supportsThinking: true,
      thinkingEffortLevels: ['low', 'medium', 'high', 'max'],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: true,
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: false,
      cliArgKey: 'model',
      cliArgValue: 'claude-sonnet-4-20250514',
      lastUpdated: '2025-05-14',
      source: 'bundled',
    },
    {
      agent: 'claude-agent-sdk',
      modelId: 'claude-opus-4-20250514',
      modelAlias: 'opus',
      displayName: 'Claude Opus 4 (SDK)',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 16384,
      maxThinkingTokens: 128000,
      inputPricePerMillion: 15,
      outputPricePerMillion: 75,
      thinkingPricePerMillion: 15,
      cachedInputPricePerMillion: 1.5,
      supportsThinking: true,
      thinkingEffortLevels: ['low', 'medium', 'high', 'max'],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: true,
      supportsImageInput: true,
      supportsImageOutput: false,
      supportsFileInput: false,
      cliArgKey: 'model',
      cliArgValue: 'claude-opus-4-20250514',
      lastUpdated: '2025-05-14',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'claude-sonnet-4-20250514';

  readonly configSchema: AgentConfigSchema = {
    agent: 'claude-agent-sdk',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.claude', 'settings.json')],
    projectConfigFilePaths: ['.claude/settings.json'],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  execute(options: RunOptions): ProgrammaticRun {
    this.validateRunOptions(options);

    const runId = this.generateRunId();
    const modelId = this.resolveModel(options);
    const events = new AsyncQueue<AgentEvent>();
    const prompts = new AsyncQueue<ClaudeSdkUserMessage>();
    const pendingApprovals = new Map<string, PendingApproval>();
    const pendingInputs = new Map<string, PendingInput>();
    const toolsByIndex = new Map<number, ToolState>();
    const toolsById = new Map<string, ToolState>();

    let queryHandle: ClaudeSdkQuery | null = null;
    let closed = false;
    let turnIndex = -1;
    let textAccumulated = '';
    let thinkingAccumulated = '';
    let sessionId: string | undefined;

    const queueError = (code: string, message: string): void => {
      events.enqueue(this.createErrorEvent(runId, code, message, false));
    };

    const rejectPending = (reason: unknown): void => {
      for (const pending of pendingApprovals.values()) {
        pending.reject(reason);
      }
      pendingApprovals.clear();
      for (const pending of pendingInputs.values()) {
        pending.reject(reason);
      }
      pendingInputs.clear();
    };

    const closeRun = async (): Promise<void> => {
      if (closed) {
        return;
      }
      closed = true;
      prompts.close();
      rejectPending(new Error('Claude Agent SDK session closed'));
      queryHandle?.close();
    };

    const sdkPromise = (async () => {
      try {
        const authState = await this.detectAuth();
        if (authState.status !== 'authenticated') {
          queueError('AUTH_MISSING', 'Anthropic authentication not found');
          return;
        }

        if (options.attachments?.some((attachment) => !this.isImageAttachment(attachment.mimeType, attachment.filePath, attachment.url))) {
          queueError('CAPABILITY_ERROR', 'claude-agent-sdk currently supports only image attachments through agent-mux');
          return;
        }

        const initialMessage = await this.buildUserMessage(this.normalizePrompt(options.prompt), options.attachments);
        prompts.enqueue(initialMessage);
        if (options.nonInteractive) {
          prompts.close();
        }

        const sdk = await this.loadSdkModule();
        queryHandle = sdk.query({
          prompt: prompts,
          options: this.buildSdkOptions(options, modelId, async (toolName, input, ctx) => {
            const interactionId = ctx.toolUseID || `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            events.enqueue({
              ...this.createBaseEvent('approval_request', runId),
              type: 'approval_request',
              interactionId,
              action: ctx.title || `Allow ${toolName}`,
              detail: ctx.description || JSON.stringify(input),
              toolName,
              riskLevel: this.estimateRiskLevel(toolName),
            } as AgentEvent);

            return await new Promise<ClaudePermissionResult>((resolve, reject) => {
              pendingApprovals.set(interactionId, { resolve, reject });
            });
          }, async (request) => {
            const interactionId = request.elicitationId || `input-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            events.enqueue({
              ...this.createBaseEvent('input_required', runId),
              type: 'input_required',
              interactionId,
              question: request.title || request.message,
              context: request.description || request.url,
              source: 'tool',
            } as AgentEvent);

            return await new Promise<ClaudeElicitationResult>((resolve, reject) => {
              pendingInputs.set(interactionId, { resolve, reject });
            });
          }),
        });

        for await (const message of queryHandle) {
          const translated = this.translateSdkMessage({
            runId,
            options,
            message,
            modelId,
            textAccumulated,
            thinkingAccumulated,
            toolsByIndex,
            toolsById,
            turnIndex,
            sessionId,
          });

          textAccumulated = translated.textAccumulated;
          thinkingAccumulated = translated.thinkingAccumulated;
          turnIndex = translated.turnIndex;
          sessionId = translated.sessionId;

          for (const event of translated.events) {
            events.enqueue(event);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        queueError('INTERNAL', `Claude Agent SDK error: ${message}`);
      } finally {
        await closeRun();
        events.close();
      }
    })();

    void sdkPromise;

    return Object.assign(events, {
      send: async (text: string) => {
        if (closed) {
          throw new Error('Claude Agent SDK session is closed');
        }
        prompts.enqueue(await this.buildUserMessage(text, []));
      },
      respond: async (interactionId: string, response: InteractionResponse) => {
        const pendingApproval = pendingApprovals.get(interactionId);
        if (pendingApproval) {
          pendingApprovals.delete(interactionId);
          if (response.type === 'approve') {
            events.enqueue({
              ...this.createBaseEvent('approval_granted', runId),
              type: 'approval_granted',
              interactionId,
            } as AgentEvent);
            pendingApproval.resolve({ behavior: 'allow' });
            return;
          }
          if (response.type === 'deny') {
            events.enqueue({
              ...this.createBaseEvent('approval_denied', runId),
              type: 'approval_denied',
              interactionId,
              reason: response.reason,
            } as AgentEvent);
            pendingApproval.resolve({ behavior: 'deny', message: response.reason || 'Denied by user' });
            return;
          }
          throw new Error('Approval requests require approve/deny responses');
        }

        const pendingInput = pendingInputs.get(interactionId);
        if (pendingInput) {
          pendingInputs.delete(interactionId);
          if (response.type !== 'text') {
            pendingInput.resolve({ action: 'decline' });
            return;
          }
          pendingInput.resolve({ action: 'accept', content: { response: response.text } });
          return;
        }

        throw new Error(`No pending Claude SDK interaction with id '${interactionId}'`);
      },
      interrupt: async () => {
        await queryHandle?.interrupt();
      },
      close: async () => {
        await closeRun();
      },
    } satisfies Partial<ProgrammaticRun>);
  }

  async detectInstallation(): Promise<DetectInstallationResult> {
    try {
      const sdkEntry = require.resolve('@anthropic-ai/claude-agent-sdk');
      const pkgPath = path.join(path.dirname(sdkEntry), 'package.json');
      const pkg = await readJsonFile<{ version?: string }>(pkgPath);
      return {
        installed: true,
        version: pkg?.version ?? undefined,
        path: sdkEntry,
      };
    } catch {
      return { installed: false };
    }
  }

  async detectAuth(): Promise<AuthState> {
    const apiKey = process.env['ANTHROPIC_API_KEY'] || process.env['CLAUDE_AGENT_API_KEY'];
    if (apiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `anthropic:...${apiKey.slice(-4)}`,
      };
    }

    for (const credentialsPath of [
      path.join(os.homedir(), '.claude', '.credentials.json'),
      path.join(os.homedir(), '.claude.json'),
      path.join(os.homedir(), '.claude', 'settings.json'),
    ]) {
      try {
        const data = await readJsonFile<Record<string, unknown>>(credentialsPath);
        if (data) {
          const email = typeof data['email'] === 'string' ? data['email'] : undefined;
          const userId = typeof data['userId'] === 'string'
            ? data['userId']
            : typeof (data['user'] as Record<string, unknown> | undefined)?.['id'] === 'string'
              ? ((data['user'] as Record<string, unknown>)['id'] as string)
              : undefined;
          if (email || userId || Object.keys(data).length > 0) {
            return {
              status: 'authenticated',
              method: 'oauth',
              identity: email ? `claude:${email}` : `claude:${userId ?? 'local'}`,
            };
          }
        }
      } catch {
        // Ignore missing or invalid auth files.
      }
    }

    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'claude-agent-sdk',
      providerName: 'Anthropic',
      steps: [
        {
          step: 1,
          description: 'Get an API key from https://console.anthropic.com/settings/keys',
          url: 'https://console.anthropic.com/settings/keys',
        },
        {
          step: 2,
          description: 'Set the ANTHROPIC_API_KEY environment variable',
          command: 'export ANTHROPIC_API_KEY=sk-ant-...',
        },
        {
          step: 3,
          description: 'Or sign in through Claude Code and let the SDK reuse the stored credentials',
          command: 'claude',
        },
      ],
      envVars: [
        { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: false, exampleFormat: 'sk-ant-...' },
        { name: 'CLAUDE_AGENT_API_KEY', description: 'Alternate Anthropic API key env var', required: false, exampleFormat: 'sk-ant-...' },
      ],
      documentationUrls: ['https://platform.claude.com/docs/en/agent-sdk/overview'],
      loginCommand: 'claude',
      verifyCommand: 'node -e "import(\'@anthropic-ai/claude-agent-sdk\').then(() => console.log(\'OK\'))"',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.claude', 'projects');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'claude-agent-sdk');
    return { ...parsed, agent: 'claude-agent-sdk' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'claude-agent-sdk', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'claude-agent-sdk', source: 'global', filePaths: [filePath], ...data };
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

  async listPlugins(): Promise<InstalledPlugin[]> {
    return mcpListPlugins(this.agent);
  }

  async installPlugin(pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin> {
    return mcpInstallPlugin(this.agent, pluginId, options);
  }

  async uninstallPlugin(pluginId: string, _options?: { global?: boolean }): Promise<void> {
    return mcpUninstallPlugin(this.agent, pluginId);
  }

  private async loadSdkModule(): Promise<ClaudeSdkModule> {
    return await import('@anthropic-ai/claude-agent-sdk') as ClaudeSdkModule;
  }

  private buildSdkOptions(
    options: RunOptions,
    modelId: string,
    canUseTool: NonNullable<ClaudeSdkOptions['canUseTool']>,
    onElicitation: NonNullable<ClaudeSdkOptions['onElicitation']>,
  ): ClaudeSdkOptions {
    const permissionMode = this.mapPermissionMode(options.approvalMode);
    const sdkOptions: ClaudeSdkOptions = {
      model: modelId,
      cwd: options.cwd ?? process.cwd(),
      env: options.env ? { ...process.env, ...options.env } : undefined,
      resume: options.sessionId ?? options.forkSessionId,
      forkSession: options.forkSessionId != null,
      persistSession: options.noSession ? false : true,
      permissionMode,
      allowDangerouslySkipPermissions: permissionMode === 'bypassPermissions',
      canUseTool,
      onElicitation,
      includePartialMessages: true,
      includeHookEvents: true,
      settingSources: ['user', 'project', 'local'],
      mcpServers: this.buildMcpServers(options),
      maxTurns: options.maxTurns,
      systemPrompt: this.buildSystemPrompt(options),
      stderr: (data) => {
        if (data.trim().length > 0) {
          // Surface stderr as a debug event via the regular SDK stream handling.
        }
      },
    };

    if (options.thinkingBudgetTokens != null) {
      sdkOptions.thinking = {
        type: 'enabled',
        budgetTokens: options.thinkingBudgetTokens,
      };
    }

    if (options.thinkingEffort) {
      sdkOptions.effort = options.thinkingEffort === 'max' ? 'max' : options.thinkingEffort;
    }

    return sdkOptions;
  }

  private buildMcpServers(options: RunOptions): ClaudeSdkOptions['mcpServers'] {
    if (!options.mcpServers || options.mcpServers.length === 0) {
      return undefined;
    }

    const servers: Record<string, Record<string, unknown>> = {};
    for (const server of options.mcpServers) {
      if (server.transport === 'stdio') {
        servers[server.name] = {
          type: 'stdio',
          command: server.command,
          args: server.args,
          env: server.env,
        };
        continue;
      }

      servers[server.name] = {
        type: server.transport === 'streamable-http' ? 'http' : 'sse',
        url: server.url,
        headers: server.headers,
      };
    }

    return servers as ClaudeSdkOptions['mcpServers'];
  }

  private buildSystemPrompt(options: RunOptions): ClaudeSdkOptions['systemPrompt'] {
    if (!options.systemPrompt) {
      return undefined;
    }
    if (options.systemPromptMode === 'append' || options.systemPromptMode == null) {
      return {
        type: 'preset',
        preset: 'claude_code',
        append: options.systemPrompt,
      };
    }
    if (options.systemPromptMode === 'replace') {
      return options.systemPrompt;
    }
    return {
      type: 'preset',
      preset: 'claude_code',
      append: options.systemPrompt,
    };
  }

  private mapPermissionMode(mode: RunOptions['approvalMode']): ClaudeSdkOptions['permissionMode'] {
    switch (mode) {
      case 'yolo':
        return 'bypassPermissions';
      case 'deny':
        return 'dontAsk';
      default:
        return 'default';
    }
  }

  private estimateRiskLevel(toolName: string): 'low' | 'medium' | 'high' {
    const lowered = toolName.toLowerCase();
    if (lowered.includes('bash') || lowered.includes('delete') || lowered.includes('write') || lowered.includes('edit')) {
      return 'high';
    }
    if (lowered.includes('read') || lowered.includes('grep') || lowered.includes('glob')) {
      return 'low';
    }
    return 'medium';
  }

  private async buildUserMessage(prompt: string, attachments: RunOptions['attachments'] = []): Promise<ClaudeSdkUserMessage> {
    const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];

    for (const attachment of attachments ?? []) {
      const mimeType = await this.resolveMimeType(attachment.mimeType, attachment.filePath, attachment.url);
      if (!mimeType || !mimeType.startsWith('image/')) {
        throw new Error('Only image attachments are currently supported for claude-agent-sdk');
      }
      const data = await this.readAttachmentAsBase64(attachment);
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data,
        },
      });
    }

    return {
      type: 'user',
      message: {
        role: 'user',
        content: attachments && attachments.length > 0 ? content as any : prompt,
      },
      parent_tool_use_id: null,
    };
  }

  private isImageAttachment(
    mimeType?: string,
    filePath?: string,
    url?: string,
  ): boolean {
    if (mimeType?.startsWith('image/')) {
      return true;
    }
    const source = filePath ?? url;
    if (!source) {
      return false;
    }
    return /\.(png|jpe?g|gif|webp|bmp)$/i.test(source);
  }

  private async readAttachmentAsBase64(attachment: NonNullable<RunOptions['attachments']>[number]): Promise<string> {
    if (attachment.base64) {
      return attachment.base64;
    }
    if (attachment.filePath) {
      const data = await fs.readFile(attachment.filePath);
      return data.toString('base64');
    }
    if (attachment.url) {
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch attachment from ${attachment.url}: ${response.status}`);
      }
      const data = Buffer.from(await response.arrayBuffer());
      return data.toString('base64');
    }
    throw new Error('Attachment must provide base64, filePath, or url');
  }

  private async resolveMimeType(mimeType?: string, filePath?: string, url?: string): Promise<string | undefined> {
    if (mimeType) {
      return mimeType;
    }
    const source = (filePath ?? url ?? '').toLowerCase();
    if (source.endsWith('.png')) return 'image/png';
    if (source.endsWith('.jpg') || source.endsWith('.jpeg')) return 'image/jpeg';
    if (source.endsWith('.gif')) return 'image/gif';
    if (source.endsWith('.webp')) return 'image/webp';
    if (source.endsWith('.bmp')) return 'image/bmp';
    return undefined;
  }

  private translateSdkMessage(args: {
    runId: string;
    options: RunOptions;
    message: ClaudeSdkMessage;
    modelId: string;
    textAccumulated: string;
    thinkingAccumulated: string;
    toolsByIndex: Map<number, ToolState>;
    toolsById: Map<string, ToolState>;
    turnIndex: number;
    sessionId?: string;
  }): {
    events: AgentEvent[];
    textAccumulated: string;
    thinkingAccumulated: string;
    turnIndex: number;
    sessionId?: string;
  } {
    const {
      runId,
      options,
      message,
      modelId,
      toolsByIndex,
      toolsById,
    } = args;

    let textAccumulated = args.textAccumulated;
    let thinkingAccumulated = args.thinkingAccumulated;
    let turnIndex = args.turnIndex;
    let sessionId = args.sessionId;
    const events: AgentEvent[] = [];

    if (message.type === 'system' && message.subtype === 'init') {
      sessionId = message.session_id;
      events.push({
        ...this.createBaseEvent('session_start', runId),
        type: 'session_start',
        sessionId,
        resumed: Boolean(options.sessionId),
        forkedFrom: options.forkSessionId,
      } as AgentEvent);
      return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
    }

    if (message.type === 'system' && message.subtype === 'session_state_changed') {
      if (message.state === 'running') {
        textAccumulated = '';
        thinkingAccumulated = '';
        turnIndex += 1;
        events.push({
          ...this.createBaseEvent('turn_start', runId),
          type: 'turn_start',
          turnIndex,
        } as AgentEvent);
      } else if (message.state === 'idle' && turnIndex >= 0) {
        if (thinkingAccumulated.length > 0) {
          events.push({
            ...this.createBaseEvent('thinking_stop', runId),
            type: 'thinking_stop',
            thinking: thinkingAccumulated,
          } as AgentEvent);
          thinkingAccumulated = '';
        }
        if (textAccumulated.length > 0) {
          events.push(this.createMessageStopEvent(runId, textAccumulated));
          textAccumulated = '';
        }
        events.push({
          ...this.createBaseEvent('turn_end', runId),
          type: 'turn_end',
          turnIndex,
        } as AgentEvent);
      }
      return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
    }

    if (message.type === 'stream_event') {
      const event = message.event as Record<string, any>;
      if (event.type === 'message_start') {
        events.push({
          ...this.createBaseEvent('message_start', runId),
          type: 'message_start',
        } as AgentEvent);
      }

      if (event.type === 'content_block_start' && event.content_block) {
        const contentBlock = event.content_block as Record<string, any>;
        if (contentBlock.type === 'tool_use' || contentBlock.type === 'server_tool_use' || contentBlock.type === 'mcp_tool_use') {
          const id = String(contentBlock.id ?? `tool-${event.index}`);
          const state: ToolState = {
            id,
            name: String(contentBlock.name ?? 'tool'),
            rawInput: contentBlock.input ? JSON.stringify(contentBlock.input) : '',
          };
          toolsByIndex.set(Number(event.index ?? 0), state);
          toolsById.set(id, state);
          events.push(this.createToolCallStartEvent(runId, id, state.name, state.rawInput));
        } else if (contentBlock.type === 'thinking') {
          events.push({
            ...this.createBaseEvent('thinking_start', runId),
            type: 'thinking_start',
          } as AgentEvent);
        }
      }

      if (event.type === 'content_block_delta' && event.delta) {
        const delta = event.delta as Record<string, any>;
        if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          textAccumulated += delta.text;
          events.push(this.createTextDeltaEvent(runId, delta.text, textAccumulated));
        } else if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string') {
          thinkingAccumulated += delta.thinking;
          events.push({
            ...this.createBaseEvent('thinking_delta', runId),
            type: 'thinking_delta',
            delta: delta.thinking,
            accumulated: thinkingAccumulated,
          } as AgentEvent);
        } else if (delta.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
          const state = toolsByIndex.get(Number(event.index ?? 0));
          if (state) {
            state.rawInput += delta.partial_json;
            events.push({
              ...this.createBaseEvent('tool_input_delta', runId),
              type: 'tool_input_delta',
              toolCallId: state.id,
              delta: delta.partial_json,
              inputAccumulated: state.rawInput,
            } as AgentEvent);
          }
        }
      }

      if (event.type === 'content_block_stop') {
        const state = toolsByIndex.get(Number(event.index ?? 0));
        if (state) {
          events.push({
            ...this.createBaseEvent('tool_call_ready', runId),
            type: 'tool_call_ready',
            toolCallId: state.id,
            toolName: state.name,
            input: this.parseToolInput(state.rawInput),
          } as AgentEvent);
        }
      }

      return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
    }

    if (message.type === 'user' && message.parent_tool_use_id && message.tool_use_result !== undefined) {
      const toolState = toolsById.get(message.parent_tool_use_id);
      events.push(this.createToolResultEvent(
        runId,
        message.parent_tool_use_id,
        toolState?.name ?? 'tool',
        message.tool_use_result,
      ));
      return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
    }

    if (message.type === 'result') {
      const cost = this.extractCostFromResult(
        message as ClaudeSdkMessage & { type: 'result'; usage?: unknown; total_cost_usd?: number },
        modelId,
      );
      if (cost) {
        events.push(this.createCostEvent(runId, cost));
      }
      if (message.is_error) {
        events.push(this.createErrorEvent(
          runId,
          'INTERNAL',
          message.subtype === 'success' ? 'Claude Agent SDK returned an error result' : message.errors.join('; ') || message.subtype,
          false,
        ));
      }
      events.push(this.createMessageStopEvent(
        runId,
        message.subtype === 'success' ? message.result : textAccumulated,
      ));
      return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
    }

    if (message.type === 'system' && message.subtype === 'notification') {
      events.push({
        ...this.createBaseEvent('debug', runId),
        type: 'debug',
        level: 'info',
        message: message.text,
      } as AgentEvent);
      return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
    }

    if (message.type === 'system' && message.subtype === 'local_command_output') {
      events.push(this.createTextDeltaEvent(runId, `${message.content}\n`, textAccumulated + `${message.content}\n`));
      textAccumulated += `${message.content}\n`;
      return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
    }

    return { events, textAccumulated, thinkingAccumulated, turnIndex, sessionId };
  }

  private parseToolInput(rawInput: string): unknown {
    if (!rawInput) {
      return {};
    }
    try {
      return JSON.parse(rawInput);
    } catch {
      return rawInput;
    }
  }

  private extractCostFromResult(
    result: ClaudeSdkMessage & { type: 'result'; usage?: unknown; total_cost_usd?: number },
    modelId: string,
  ): CostRecord | null {
    const model = this.models.find((candidate) => candidate.modelId === modelId);
    if (!model) {
      return null;
    }
    const usage = result.usage as any;
    const inputTokens = typeof usage?.input_tokens === 'number' ? usage.input_tokens : 0;
    const outputTokens = typeof usage?.output_tokens === 'number' ? usage.output_tokens : 0;
    const cachedTokens = typeof usage?.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : 0;
    const thinkingTokens = typeof usage?.server_tool_use === 'number' ? usage.server_tool_use : 0;
    return {
      totalUsd: result.total_cost_usd ?? (
        (inputTokens / 1_000_000) * (model.inputPricePerMillion ?? 0) +
        (outputTokens / 1_000_000) * (model.outputPricePerMillion ?? 0)
      ),
      inputTokens,
      outputTokens,
      cachedTokens,
      thinkingTokens,
    };
  }
}
