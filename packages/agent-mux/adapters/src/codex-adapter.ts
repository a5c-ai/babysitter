/**
 * CodexAdapter — OpenAI Codex CLI adapter.
 */

import * as os from 'node:os';
import * as path from 'node:path';

import { getAdapterMetadata, getAdapterModels, getAgentVersion, getInstallMethods, getHostEnvSignals, getSessionConfig, getCapabilityFlags, getRuntimeHooks, getConfigSchema, getDisplayName, getDefaultModelId } from '@a5c-ai/atlas/catalog';

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
  InstallMethod,
} from '@a5c-ai/agent-comm-mux';

import { BaseAgentAdapter } from './base-adapter.js';

import {
  listJsonlFiles,
  parseCodexSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';
import { readAuthConfigIdentity } from './auth-config.js';

export class CodexAdapter extends BaseAgentAdapter {
  readonly agent: string = this.constructor.name.replace(/Adapter$/, "").toLowerCase();
  get displayName() { return getDisplayName(this.agent); }
  readonly cliCommand: string = this.agent;
  readonly minVersion = '0.1.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
  }
  get hostEnvSignals() { return getHostEnvSignals(this.agent); }

  get capabilities(): AgentCapabilities {
    const flags = getCapabilityFlags(this.agent);
    const hooks = getRuntimeHooks(this.agent);
    const metadata = getAdapterMetadata(this.agent);
    return {
      agent: this.agent,
      canResume: Boolean(flags.canResume),
      canFork: Boolean(flags.canFork),
      supportsMultiTurn: Boolean(flags.supportsMultiTurn),
      sessionPersistence: String(flags.sessionPersistence ?? 'file') as any,
      supportsTextStreaming: Boolean(flags.supportsTextStreaming),
      supportsToolCallStreaming: Boolean(flags.supportsToolCallStreaming),
      supportsThinkingStreaming: Boolean(flags.supportsThinkingStreaming),
      supportsNativeTools: Boolean(flags.supportsNativeTools),
      supportsMCP: Boolean(flags.supportsMCP),
      supportsParallelToolCalls: Boolean(flags.supportsParallelToolCalls),
      requiresToolApproval: Boolean(flags.requiresToolApproval),
      approvalModes: (metadata?.approvalModes ?? ['yolo', 'prompt']) as any,
      runtimeHooks: {
        preToolUse: (hooks.preToolUse ?? 'nonblocking') as any,
        postToolUse: (hooks.postToolUse ?? 'nonblocking') as any,
        sessionStart: (hooks.sessionStart ?? 'nonblocking') as any,
        sessionEnd: (hooks.sessionEnd ?? 'nonblocking') as any,
        stop: (hooks.stop ?? 'nonblocking') as any,
        userPromptSubmit: (hooks.userPromptSubmit ?? 'nonblocking') as any,
      },
      supportsThinking: Boolean(flags.supportsThinking),
      thinkingEffortLevels: flags.thinkingEffortLevels as any ?? [],
      supportsThinkingBudgetTokens: Boolean(flags.supportsThinkingBudgetTokens),
      supportsJsonMode: Boolean(flags.supportsJsonMode),
      supportsStructuredOutput: Boolean(flags.supportsStructuredOutput),
      structuredSessionTransport: String(flags.structuredSessionTransport ?? 'none') as any,
      sessionControlPlane: String(flags.sessionControlPlane ?? 'self-managed') as any,
      supportsSkills: Boolean(flags.supportsSkills),
      supportsAgentsMd: Boolean(flags.supportsAgentsMd),
      skillsFormat: (flags.skillsFormat ?? null) as any,
      supportsSubagentDispatch: Boolean(flags.supportsSubagentDispatch),
      supportsParallelExecution: Boolean(flags.supportsParallelExecution),
      maxParallelTasks: flags.maxParallelTasks as number | undefined,
      supportsInteractiveMode: Boolean(flags.supportsInteractiveMode),
      supportsStdinInjection: Boolean(flags.supportsStdinInjection),
      supportsImageInput: Boolean(flags.supportsImageInput),
      supportsImageOutput: Boolean(flags.supportsImageOutput),
      supportsFileAttachments: Boolean(flags.supportsFileAttachments),
      supportsPlugins: Boolean(flags.supportsPlugins),
      pluginFormats: flags.pluginFormats as any ?? [],
      pluginRegistries: flags.pluginRegistries as any ?? [],
      supportedPlatforms: flags.supportedPlatforms as any ?? ['darwin', 'linux', 'win32'],
      requiresGitRepo: Boolean(flags.requiresGitRepo),
      requiresPty: Boolean(flags.requiresPty),
      authMethods: (metadata?.authMethods ?? []).map(m => ({ type: m.type, name: m.name })),
      authFiles: metadata?.authFiles ?? [],
      installMethods: getInstallMethods(this.agent).map(m => ({ platform: 'all' as const, type: m.type as InstallMethod['type'], command: m.command })),
    };
  }

  get models(): ModelCapabilities[] {
    return getAdapterModels(this.agent).map((m) => ({
      ...m,
      agent: this.agent,
      thinkingEffortLevels: m.thinkingEffortLevels as ModelCapabilities['thinkingEffortLevels'],
    }));
  }

  get defaultModelId() { return getDefaultModelId(this.agent) ?? 'o4-mini'; }

  get configSchema(): AgentConfigSchema {
    const schema = getConfigSchema(this.agent);
    return {
      agent: this.agent,
      version: 1,
      fields: [],
      configFilePaths: schema.configFilePaths ?? [],
      projectConfigFilePaths: schema.projectConfigFilePaths ?? [],
      configFormat: (schema.configFormat ?? 'json') as any,
      supportsProjectConfig: (schema.projectConfigFilePaths ?? []).length > 0,
    };
  }

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
    return getSessionConfig(this.agent).sessionDir!;
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
import { getPluginTargetDescriptor } from '@a5c-ai/atlas/catalog';

const _name = 'codex';
registerAdapterFactory(_name, () => new CodexAdapter(_name, getPluginTargetDescriptor(_name)?.cliCommand ?? _name));
