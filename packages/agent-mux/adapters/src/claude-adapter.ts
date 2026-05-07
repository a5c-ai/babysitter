/**
 * ClaudeAdapter — Claude Code CLI adapter.
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
  RuntimeHookDispatcher,
  RuntimeHookSetup,
} from '@a5c-ai/agent-mux-core';

import { BaseAgentAdapter } from './base-adapter.js';
import { mcpListPlugins, mcpInstallPlugin, mcpUninstallPlugin } from './mcp-plugins.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
  findProjectRootSync,
} from './session-fs.js';
import { setupClaudeRuntimeHooks } from './claude-code/runtime-hooks/lifecycle.js';

export class ClaudeAdapter extends BaseAgentAdapter {
  readonly agent = 'claude' as const;
  readonly displayName = 'Claude Code';
  readonly cliCommand = 'claude';
  readonly minVersion = '1.0.0';
  readonly hostEnvSignals = ['CLAUDECODE', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE', 'CLAUDE_PROJECT_DIR'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'claude',
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
    runtimeHooks: {
      preToolUse: 'blocking',
      postToolUse: 'nonblocking',
      sessionStart: 'nonblocking',
      sessionEnd: 'nonblocking',
      stop: 'nonblocking',
      userPromptSubmit: 'blocking',
    },
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
    supportsFileAttachments: true,
    supportsPlugins: true,
    pluginFormats: ['mcp-server'],
    pluginRegistries: [{ name: 'mcp', url: 'https://modelcontextprotocol.io', searchable: false }],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'API Key', description: 'ANTHROPIC_API_KEY environment variable' },
      { type: 'browser_login', name: 'Browser Login', description: 'Interactive browser-based login' },
    ],
    authFiles: ['.claude.json', '.claude/settings.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @anthropic-ai/claude-code' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'claude',
      modelId: 'claude-sonnet-4-20250514',
      modelAlias: 'sonnet',
      displayName: 'Claude Sonnet 4',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 16384,
      maxThinkingTokens: 128000,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
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
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'claude-sonnet-4-20250514',
      lastUpdated: '2025-05-14',
      source: 'bundled',
    },
    {
      agent: 'claude',
      modelId: 'claude-opus-4-20250514',
      modelAlias: 'opus',
      displayName: 'Claude Opus 4',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 16384,
      maxThinkingTokens: 128000,
      inputPricePerMillion: 15,
      outputPricePerMillion: 75,
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
      supportsFileInput: true,
      cliArgKey: '--model',
      cliArgValue: 'claude-opus-4-20250514',
      lastUpdated: '2025-05-14',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'claude-sonnet-4-20250514';

  readonly configSchema: AgentConfigSchema = {
    agent: 'claude',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.claude', 'settings.json')],
    projectConfigFilePaths: ['.claude/settings.json'],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];
    const interactiveStreamJson = options.nonInteractive !== true;
    const { stdin } = this.buildPromptTransport(options);

    // Claude Code's real structured transport is `--print` with stream-json
    // on both stdin and stdout. Keeping stdin open yields a persistent
    // multi-turn session; closing it after the first message preserves the
    // old headless one-shot flow.
    args.push('--output-format', 'stream-json');
    args.push('--verbose');
    args.push('--include-partial-messages');
    args.push('--replay-user-messages');
    if (interactiveStreamJson) {
      args.push('--input-format', 'stream-json');
    }

    // Model
    if (options.model) {
      args.push('--model', options.model);
    }

    // Session resume. `--resume` is the reconnect flag; `--session-id` is new-session.
    // Heuristic: forkSessionId indicates a fork → new session-id; sessionId without fork → resume.
    const sessionId = this.resolveSessionId(options);
    if (sessionId) {
      const isFork = options.forkSessionId != null;
      args.push(isFork ? '--session-id' : '--resume', sessionId);
    }

    // Max turns
    if (options.maxTurns != null) {
      args.push('--max-turns', String(options.maxTurns));
    }

    // Approval mode
    if (options.approvalMode === 'yolo') {
      args.push('--dangerously-skip-permissions');
    }

    // System prompt
    if (options.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt);
    }

    // Claude Code only emits structured output under --print.
    if (interactiveStreamJson) {
      args.push('--print');
    } else {
      const prompt = this.normalizePrompt(options.prompt);
      args.push('--print', prompt);
    }

    return {
      command: this.cliCommand,
      args,
      stdin,
      env: this.buildEnvFromOptions(options),
      cwd: options.cwd ?? process.cwd(),
      usePty: false,
      closeStdinAfterSpawn: interactiveStreamJson ? false : true,
      timeout: options.timeout,
      inactivityTimeout: options.inactivityTimeout,
    };
  }

  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null {
    const parsed = this.parseJsonLine(line);
    if (parsed == null || typeof parsed !== 'object') {
      return context.outputFormat === 'text' ? this.parsePlaintextEvent(line, context) : null;
    }

    const obj = parsed as Record<string, unknown>;
    const ts = Date.now();
    const base = { runId: context.runId, agent: this.agent, timestamp: ts };

    // Claude Code JSONL events have a 'type' field
    const type = obj['type'] as string | undefined;

    if (type === 'system' && obj['subtype'] === 'init' && typeof obj['session_id'] === 'string') {
      const sessionId = obj['session_id'];
      const currentSessionId = context.adapterState['__claudeSessionId'];
      if (currentSessionId === sessionId) {
        return null;
      }
      context.adapterState['__claudeSessionId'] = sessionId;
      return {
        ...base,
        type: 'session_start',
        sessionId,
        resumed: Boolean(context.sessionId),
        forkedFrom: typeof context.adapterState['__claudeForkedFrom'] === 'string'
          ? context.adapterState['__claudeForkedFrom'] as string
          : undefined,
      } as AgentEvent;
    }

    if (type === 'system' && obj['subtype'] === 'status' && obj['status'] === 'requesting') {
      const nextTurnIndex = typeof context.adapterState['__claudeTurnIndex'] === 'number'
        ? (context.adapterState['__claudeTurnIndex'] as number) + 1
        : 0;
      context.adapterState['__claudeTurnIndex'] = nextTurnIndex;
      context.adapterState['__claudeTextAccumulated'] = '';
      context.adapterState['__claudeThinkingAccumulated'] = '';
      context.adapterState['__claudeMessageStopped'] = false;
      return {
        ...base,
        type: 'turn_start',
        turnIndex: nextTurnIndex,
      } as AgentEvent;
    }

    if (type === 'assistant' || type === 'text') {
      const content = (obj['content'] ?? obj['text'] ?? '') as string;
      if (content) {
        const accumulated = `${String(context.adapterState['__claudeTextAccumulated'] ?? '')}${content}`;
        context.adapterState['__claudeTextAccumulated'] = accumulated;
        return { ...base, type: 'text_delta', delta: content, accumulated } as AgentEvent;
      }
    }

    if (type === 'tool_use' || type === 'tool_call') {
      return {
        ...base,
        type: 'tool_call_start',
        toolCallId: (obj['id'] ?? obj['toolCallId'] ?? '') as string,
        toolName: (obj['name'] ?? obj['toolName'] ?? '') as string,
        inputAccumulated: JSON.stringify(obj['input'] ?? {}),
      } as AgentEvent;
    }

    if (type === 'tool_result') {
      return {
        ...base,
        type: 'tool_result',
        toolCallId: (obj['tool_use_id'] ?? obj['toolCallId'] ?? obj['id'] ?? '') as string,
        toolName: (obj['toolName'] ?? obj['name'] ?? '') as string,
        output: obj['content'] ?? obj['output'] ?? '',
        durationMs: 0,
      } as AgentEvent;
    }

    if (type === 'user' && typeof obj['parent_tool_use_id'] === 'string' && obj['tool_use_result'] !== undefined) {
      const toolsById = this.toolStateById(context);
      const toolCallId = obj['parent_tool_use_id'] as string;
      const state = toolsById.get(toolCallId);
      return {
        ...base,
        type: 'tool_result',
        toolCallId,
        toolName: state?.name ?? 'tool',
        output: obj['tool_use_result'],
        durationMs: 0,
      } as AgentEvent;
    }

    if (type === 'thinking') {
      const thinking = (obj['thinking'] ?? obj['content'] ?? '') as string;
      const accumulated = `${String(context.adapterState['__claudeThinkingAccumulated'] ?? '')}${thinking}`;
      context.adapterState['__claudeThinkingAccumulated'] = accumulated;
      return { ...base, type: 'thinking_delta', delta: thinking, accumulated } as AgentEvent;
    }

    if (type === 'error') {
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message: (obj['message'] ?? obj['error'] ?? 'Unknown error') as string,
        recoverable: false,
      } as AgentEvent;
    }

    // stream-json: wraps Anthropic API events inside a `stream_event` envelope.
    // The interesting shapes are content_block_delta (text_delta + input_json_delta)
    // and message_stop. Without this branch, live streaming output is silently dropped.
    if (type === 'stream_event') {
      const ev = obj['event'] as Record<string, unknown> | undefined;
      if (!ev) return null;
      const evType = ev['type'] as string | undefined;
      const toolsByIndex = this.toolStateByIndex(context);
      const toolsById = this.toolStateById(context);
      const index = Number(ev['index'] ?? 0);
      if (evType === 'content_block_start') {
        const contentBlock = ev['content_block'] as Record<string, unknown> | undefined;
        if (contentBlock?.['type'] === 'tool_use' || contentBlock?.['type'] === 'server_tool_use' || contentBlock?.['type'] === 'mcp_tool_use') {
          const toolCallId = String(contentBlock['id'] ?? `claude-tool-${index}`);
          const toolName = String(contentBlock['name'] ?? 'tool');
          const inputAccumulated = contentBlock['input'] ? JSON.stringify(contentBlock['input']) : '';
          const state = { id: toolCallId, name: toolName, inputAccumulated };
          toolsByIndex.set(index, state);
          toolsById.set(toolCallId, state);
          return {
            ...base,
            type: 'tool_call_start',
            toolCallId,
            toolName,
            inputAccumulated,
          } as AgentEvent;
        }
        if (contentBlock?.['type'] === 'thinking') {
          return {
            ...base,
            type: 'thinking_start',
          } as AgentEvent;
        }
      }
      if (evType === 'content_block_delta') {
        const delta = ev['delta'] as Record<string, unknown> | undefined;
        const dType = delta?.['type'] as string | undefined;
        if (dType === 'text_delta') {
          const text = (delta?.['text'] ?? '') as string;
          const accumulated = `${String(context.adapterState['__claudeTextAccumulated'] ?? '')}${text}`;
          context.adapterState['__claudeTextAccumulated'] = accumulated;
          return { ...base, type: 'text_delta', delta: text, accumulated } as AgentEvent;
        }
        if (dType === 'input_json_delta') {
          const partial = (delta?.['partial_json'] ?? '') as string;
          const state = toolsByIndex.get(index);
          if (state) {
            state.inputAccumulated = state.inputAccumulated === '{}' || state.inputAccumulated.length === 0
              ? partial
              : `${state.inputAccumulated}${partial}`;
          }
          return {
            ...base,
            type: 'tool_input_delta',
            toolCallId: state?.id ?? String(ev['index'] ?? ''),
            delta: partial,
            inputAccumulated: state?.inputAccumulated ?? partial,
          } as AgentEvent;
        }
        if (dType === 'thinking_delta') {
          const t = (delta?.['thinking'] ?? '') as string;
          const accumulated = `${String(context.adapterState['__claudeThinkingAccumulated'] ?? '')}${t}`;
          context.adapterState['__claudeThinkingAccumulated'] = accumulated;
          return { ...base, type: 'thinking_delta', delta: t, accumulated } as AgentEvent;
        }
      }
      if (evType === 'content_block_stop') {
        const state = toolsByIndex.get(index);
        if (!state) return null;
        return {
          ...base,
          type: 'tool_call_ready',
          toolCallId: state.id,
          toolName: state.name,
          input: this.parseToolInput(state.inputAccumulated),
        } as AgentEvent;
      }
      if (evType === 'message_stop') {
        context.adapterState['__claudeMessageStopped'] = true;
        return {
          ...base,
          type: 'message_stop',
          text: String(context.adapterState['__claudeTextAccumulated'] ?? ''),
        } as AgentEvent;
      }
      return null;
    }

    if (type === 'result') {
      const events: AgentEvent[] = [];
      const text = (obj['result'] ?? obj['text'] ?? '') as string;
      if (text && context.adapterState['__claudeMessageStopped'] !== true) {
        events.push({ ...base, type: 'message_stop', text } as AgentEvent);
      }
      const cost = this.assembleCostRecord(obj['cost'] ?? obj['usage']);
      if (cost) {
        events.push({ ...base, type: 'cost', cost } as AgentEvent);
      }
      if (typeof context.adapterState['__claudeTurnIndex'] === 'number') {
        events.push({
          ...base,
          type: 'turn_end',
          turnIndex: context.adapterState['__claudeTurnIndex'] as number,
          cost: cost ?? undefined,
        } as AgentEvent);
      }
      context.adapterState['__claudeTextAccumulated'] = '';
      context.adapterState['__claudeThinkingAccumulated'] = '';
      context.adapterState['__claudeMessageStopped'] = false;
      return events.length > 0 ? events : null;
    }

    return null;
  }

  private buildStreamJsonUserMessage(prompt: string): string {
    return `${JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: prompt,
      },
      parent_tool_use_id: null,
    })}\n`;
  }

  protected override buildPromptTransport(options: RunOptions): { prompt: string; stdin?: string } {
    const prompt = this.normalizePrompt(options.prompt);
    if (prompt.trim().length === 0) {
      return { prompt: '' };
    }
    if (options.nonInteractive === true) {
      return { prompt };
    }
    return {
      prompt,
      stdin: this.buildStreamJsonUserMessage(prompt),
    };
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

  private toolStateByIndex(context: ParseContext): Map<number, { id: string; name: string; inputAccumulated: string }> {
    const existing = context.adapterState['__claudeToolsByIndex'];
    if (existing instanceof Map) {
      return existing as Map<number, { id: string; name: string; inputAccumulated: string }>;
    }
    const created = new Map<number, { id: string; name: string; inputAccumulated: string }>();
    context.adapterState['__claudeToolsByIndex'] = created;
    return created;
  }

  private toolStateById(context: ParseContext): Map<string, { id: string; name: string; inputAccumulated: string }> {
    const existing = context.adapterState['__claudeToolsById'];
    if (existing instanceof Map) {
      return existing as Map<string, { id: string; name: string; inputAccumulated: string }>;
    }
    const created = new Map<string, { id: string; name: string; inputAccumulated: string }>();
    context.adapterState['__claudeToolsById'] = created;
    return created;
  }

  async detectAuth(): Promise<AuthState> {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (apiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `sk-ant-...${apiKey.slice(-4)}`,
      };
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'claude',
      providerName: 'Anthropic',
      steps: [
        { step: 1, description: 'Get an API key from https://console.anthropic.com/settings/keys', url: 'https://console.anthropic.com/settings/keys' },
        { step: 2, description: 'Set the ANTHROPIC_API_KEY environment variable', command: 'export ANTHROPIC_API_KEY=sk-ant-...' },
        { step: 3, description: 'Alternatively, run `claude` and follow the browser login flow', command: 'claude' },
      ],
      envVars: [
        { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: true, exampleFormat: 'sk-ant-api03-...' },
      ],
      documentationUrls: ['https://docs.anthropic.com/en/docs/claude-code'],
      loginCommand: 'claude',
      verifyCommand: 'claude --version',
    };
  }

  sessionDir(cwd?: string): string {
    return path.join(os.homedir(), '.claude', 'projects');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'claude');
    return { ...parsed, agent: 'claude', title: parsed.sessionId };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<import('@a5c-ai/agent-mux-core').AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'claude', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'claude', source: 'global', filePaths: [filePath], ...data };
  }

  async writeConfig(config: Partial<import('@a5c-ai/agent-mux-core').AgentConfig>, _cwd?: string): Promise<void> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return;
    const existing = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    const { agent: _a, source: _s, filePaths: _fp, ...rest } = config as Record<string, unknown>;
    void _a; void _s; void _fp;
    await writeJsonFileAtomic(filePath, { ...existing, ...rest });
  }

  /**
   * Override: in addition to the base `which claude` + `--version` check,
   * probe `~/.claude` as a secondary signal that the harness has been
   * installed and initialized at least once.
   */
  override async detectInstallation(): Promise<import('@a5c-ai/agent-mux-core').DetectInstallationResult> {
    const base = await super.detectInstallation();
    const claudeDir = path.join(os.homedir(), '.claude');
    let hasConfigDir = false;
    try {
      const { promises: fsp } = await import('node:fs');
      const st = await fsp.stat(claudeDir);
      hasConfigDir = st.isDirectory();
    } catch {
      hasConfigDir = false;
    }
    const notes = hasConfigDir
      ? `~/.claude config directory present`
      : `~/.claude config directory not found`;
    return { ...base, notes };
  }

  /**
   * Write a Claude native hook into ~/.claude/settings.json in addition
   * to registering with HookConfigManager. Claude supports a top-level
   * `hooks` object keyed by hook type (PreToolUse/PostToolUse/Stop/...).
   *
   * We append the command under settings.hooks[hookType] as
   * `{ matcher: '*', hooks: [{ type: 'command', command }] }`, preserving
   * any existing entries.
   */
  protected override async writeNativeHook(hookType: string, command: string): Promise<void> {
    await this.appendJsonHook(
      path.join(os.homedir(), '.claude', 'settings.json'),
      hookType,
      { matcher: '*', hooks: [{ type: 'command', command }] },
    );
  }

  /**
   * Claude plugins are MCP servers stored under `mcpServers` in
   * `~/.claude/settings.json`. Each entry is keyed by server id with a
   * `{ command, args?, env? }` body. We treat the server id as the pluginId
   * and surface an InstalledPlugin for each one.
   */
  private settingsPaths(): Record<string, string> {
    const HOME = os.homedir() || '.';
    return {
      global: path.join(HOME, '.claude', 'settings.json'),
      project: path.join(findProjectRootSync(), '.claude', 'settings.json'),
    };
  }

  override async listPlugins(): Promise<InstalledPlugin[]> {
    return mcpListPlugins(this.settingsPaths());
  }

  override async installPlugin(
    pluginId: string,
    options?: PluginInstallOptions,
  ): Promise<InstalledPlugin> {
    return mcpInstallPlugin(this.settingsPaths(), pluginId, options);
  }

  override async uninstallPlugin(pluginId: string, options?: { global?: boolean }): Promise<void> {
    return mcpUninstallPlugin(this.settingsPaths(), pluginId, options);
  }

  async setupRuntimeHooks(
    options: RunOptions,
    dispatcher: RuntimeHookDispatcher,
  ): Promise<RuntimeHookSetup | void> {
    return setupClaudeRuntimeHooks(options, dispatcher);
  }
}

// Self-register in the global adapter registry
import { registerAdapterFactory } from './base-adapter.js';
registerAdapterFactory('claude', () => new ClaudeAdapter());
