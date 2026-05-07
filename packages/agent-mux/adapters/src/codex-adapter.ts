/**
 * CodexAdapter — OpenAI Codex CLI adapter.
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
  AgentConfig,
} from '@a5c-ai/agent-mux-core';

import { BaseAgentAdapter } from './base-adapter.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import {
  listJsonlFiles,
  parseCodexSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';
import { readAuthConfigIdentity } from './auth-config.js';

export class CodexAdapter extends BaseAgentAdapter {
  readonly agent: string = this.constructor.name.replace(/Adapter$/, "").toLowerCase();
  readonly displayName = 'OpenAI Codex';
  readonly cliCommand: string = this.agent;
  readonly minVersion = '0.1.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
  }
  readonly hostEnvSignals = ['CODEX_SESSION_ID', 'CODEX_RUN_ID', 'CODEX_CLI'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: this.agent,
    canResume: true,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsThinkingStreaming: false,
    supportsNativeTools: true,
    supportsMCP: false,
    supportsParallelToolCalls: true,
    requiresToolApproval: true,
    approvalModes: ['yolo', 'prompt', 'deny'],
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
    supportsSubagentDispatch: false,
    supportsParallelExecution: false,
    supportsInteractiveMode: false,
    supportsStdinInjection: false,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins: false,
    pluginFormats: [],
    pluginRegistries: [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'API Key', description: 'OPENAI_API_KEY environment variable' },
    ],
    authFiles: ['.codex/config.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @openai/codex' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: this.agent,
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
      supportsThinkingStreaming: false,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsFileInput: false,
      cliArgKey: '--model',
      cliArgValue: 'o4-mini',
      lastUpdated: '2025-04-01',
      source: 'bundled',
    },
    {
      agent: this.agent,
      modelId: 'codex-mini-latest',
      displayName: 'Codex Mini',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
      supportsThinking: false,
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsFileInput: false,
      cliArgKey: '--model',
      cliArgValue: 'codex-mini-latest',
      lastUpdated: '2025-04-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'o4-mini';

  readonly configSchema: AgentConfigSchema = {
    agent: this.agent,
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.codex', 'config.json')],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];
    const sessionId = this.resolveSessionId(options);
    const isResume = sessionId && !options.forkSessionId;
    const prompt = this.normalizePrompt(options.prompt);
    // Codex requires the 'exec' subcommand for structured subprocess output.
    if (isResume) {
      args.push('exec', 'resume', '--json', sessionId);
      if (prompt.length > 0) {
        args.push(prompt);
      }
    } else {
      args.push('exec', '--json');
      args.push(prompt);
    }

    if (options.model) {
      args.push('--model', options.model);
    }

    if (options.approvalMode === 'yolo') {
      args.push('--full-auto');
    }

    return {
      command: this.cliCommand,
      args,
      env: this.buildEnvFromOptions(options),
      cwd: options.cwd ?? process.cwd(),
      usePty: false,
      closeStdinAfterSpawn: true,
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

    const type = obj['type'] as string | undefined;

    // Proper Codex event types from 'codex exec --json'
    if (type === 'thread.started') {
      const resumed = typeof context.sessionId === 'string' && context.sessionId.length > 0;
      const sessionId = resumed
        ? context.sessionId
        : String(obj['thread_id'] ?? context.sessionId ?? '');
      return { ...base, type: 'session_start', sessionId, resumed } as AgentEvent;
    }

    if (type === 'turn.started') {
      return { ...base, type: 'thinking_delta', delta: '', accumulated: '' } as AgentEvent;
    }

    if (type === 'item.completed') {
      const item = obj['item'] as Record<string, unknown> | undefined;
      if (!item) return null;
      if (item['type'] === 'agent_message' && typeof item['text'] === 'string' && item['text'].length > 0) {
        return { ...base, type: 'text_delta', delta: item['text'], accumulated: item['text'] } as AgentEvent;
      }
      if (item['type'] === 'function_call') {
        return {
          ...base,
          type: 'tool_call_start',
          toolCallId: String(item['call_id'] ?? item['id'] ?? ''),
          toolName: String(item['name'] ?? ''),
          inputAccumulated: JSON.stringify(item['arguments'] ?? item['input'] ?? {}),
        } as AgentEvent;
      }
      if (item['type'] === 'function_call_output') {
        return {
          ...base,
          type: 'tool_result',
          toolCallId: String(item['call_id'] ?? item['id'] ?? ''),
          toolName: String(item['name'] ?? ''),
          output: item['output'] ?? '',
          durationMs: 0,
        } as AgentEvent;
      }
      if (item['type'] === 'command_execution') {
        return {
          ...base,
          type: 'tool_result',
          toolCallId: String(item['id'] ?? ''),
          toolName: String(item['command'] ?? 'command'),
          output: item['aggregated_output'] ?? item['output'] ?? '',
          durationMs: 0,
        } as AgentEvent;
      }
    }

    if (type === 'turn.completed') {
      const events: AgentEvent[] = [];
      const text = (obj['content'] ?? obj['text'] ?? '') as string;
      if (text) {
        events.push({ ...base, type: 'message_stop', text } as AgentEvent);
      }
      // Parse usage/cost from turn.completed
      const usage = obj['usage'] as Record<string, unknown> | undefined;
      if (usage) {
        const cost = this.assembleCostRecord(usage);
        if (cost) {
          events.push({ ...base, type: 'cost', cost } as AgentEvent);
        }
      }
      return events.length > 0 ? events : null;
    }

    if (type === 'turn.failed') {
      const message = (obj['message'] ?? obj['error'] ?? 'Turn failed') as string;
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message,
        recoverable: false,
      } as AgentEvent;
    }

    if (type === 'item.started') {
      const item = obj['item'] as Record<string, unknown> | undefined;
      const kind = (item?.['type'] ?? obj['kind']) as string | undefined;
      const name = (item?.['name'] ?? item?.['command'] ?? obj['name'] ?? '') as string;
      const id = (item?.['id'] ?? obj['id'] ?? '') as string;

      if (kind === 'command_execution' || kind === 'function_call') {
        return {
          ...base,
          type: 'tool_call_start',
          toolCallId: id,
          toolName: name,
          inputAccumulated: JSON.stringify(item?.['arguments'] ?? item?.['input'] ?? item?.['command'] ?? obj['arguments'] ?? obj['input'] ?? {}),
        } as AgentEvent;
      }

      if (kind === 'message') {
        const content = (item?.['content'] ?? item?.['text'] ?? obj['content'] ?? obj['text'] ?? '') as string;
        if (content) {
          return { ...base, type: 'text_delta', delta: content, accumulated: content } as AgentEvent;
        }
      }
    }

    if (type === 'error') {
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message: (obj['message'] ?? 'Unknown Codex error') as string,
        recoverable: false,
      } as AgentEvent;
    }

    // Legacy fallback for old event types (backwards compatibility)
    if (type === 'message' || type === 'text') {
      const content = (obj['content'] ?? obj['text'] ?? '') as string;
      if (content) {
        return { ...base, type: 'text_delta', delta: content, accumulated: content } as AgentEvent;
      }
    }

    if (type === 'function_call' || type === 'tool_call') {
      return {
        ...base,
        type: 'tool_call_start',
        toolCallId: (obj['id'] ?? obj['call_id'] ?? '') as string,
        toolName: (obj['name'] ?? '') as string,
        inputAccumulated: JSON.stringify(obj['arguments'] ?? obj['input'] ?? {}),
      } as AgentEvent;
    }

    if (type === 'function_call_output' || type === 'tool_result') {
      return {
        ...base,
        type: 'tool_result',
        toolCallId: (obj['call_id'] ?? obj['id'] ?? '') as string,
        toolName: (obj['name'] ?? '') as string,
        output: obj['output'] ?? '',
        durationMs: 0,
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
        identity: `sk-...${apiKey.slice(-4)}`,
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
      agent: this.agent,
      providerName: 'OpenAI',
      steps: [
        { step: 1, description: 'Get an API key from https://platform.openai.com/api-keys', url: 'https://platform.openai.com/api-keys' },
        { step: 2, description: 'Set the OPENAI_API_KEY environment variable', command: 'export OPENAI_API_KEY=sk-...' },
      ],
      envVars: [
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: true, exampleFormat: 'sk-...' },
      ],
      documentationUrls: ['https://github.com/openai/codex'],
      verifyCommand: `${this.cliCommand} --version`,
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.codex', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseCodexSessionFile(filePath, this.agent);
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
   * Codex reads hook commands from ~/.codex/config.json under
   * `hooks[hookType] = [{ command }, ...]`. Append without clobbering.
   */
}

// Self-register in the global adapter registry
import { registerAdapterFactory } from './base-adapter.js';
import { getPluginTargetDescriptor } from '@a5c-ai/agent-catalog';

const _name = 'codex';
registerAdapterFactory(_name, () => new CodexAdapter(_name, getPluginTargetDescriptor(_name)?.cliCommand ?? _name));
