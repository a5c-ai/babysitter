/**
 * CopilotAdapter — GitHub Copilot CLI adapter.
 */

import * as os from 'node:os';
import * as path from 'node:path';

import { getAdapterMetadata, getAdapterModels, getAgentVersion, getInstallMethods, getHostEnvSignals, getSessionConfig, getCapabilityFlags, getRuntimeHooks, getConfigSchema, getDisplayName, getDefaultModelId } from '@a5c-ai/agent-catalog';

import type {
  AgentCapabilities,
  ModelCapabilities,
  AgentConfigSchema,
  AuthState,
  AuthSetupGuidance,
  DetectInstallationResult,
  Session,
  SpawnArgs,
  ParseContext,
  RunOptions,
  AgentEvent,
  AgentConfig,
  InstallMethod,
} from '@a5c-ai/agent-mux-core';

import { BaseAgentAdapter } from './base-adapter.js';

import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

export class CopilotAdapter extends BaseAgentAdapter {
  readonly agent: string = this.constructor.name.replace(/Adapter$/, "").toLowerCase();
  get displayName() { return getDisplayName(this.agent); }
  readonly cliCommand: string = this.agent;
  readonly minVersion = '1.0.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
  }

  async detectInstallation(): Promise<DetectInstallationResult> {
    try {
      const res = await this._spawner('gh', ['copilot', '--version']);
      if (res.code === 0) {
        const version = res.stdout.trim().split(/\s+/).pop();
        return { installed: true, version };
      }
    } catch { /* not installed */ }
    try {
      const res = await this._spawner('gh', ['extension', 'list']);
      if (res.code === 0 && res.stdout.includes('copilot')) {
        return { installed: true };
      }
    } catch { /* gh not available */ }
    return { installed: false };
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

  get defaultModelId() { return getDefaultModelId(this.agent) ?? 'gpt-4o'; }

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
    const { prompt, stdin } = this.buildPromptTransport(options);
    const args = ['copilot', 'suggest'];
    if (stdin === undefined) {
      args.push(prompt);
    }

    return {
      command: 'gh',
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
    if (parsed != null && typeof parsed === 'object') {
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
      if (type === 'error') {
        return {
          ...base,
          type: 'error',
          code: 'INTERNAL' as const,
          message: (obj['message'] ?? 'Unknown error') as string,
          recoverable: false,
        } as AgentEvent;
      }
    }

    // Plain text output
    if (line.trim()) {
      return {
        runId: context.runId,
        agent: this.agent,
        timestamp: Date.now(),
        type: 'text_delta',
        delta: line,
        accumulated: line,
      } as AgentEvent;
    }

    return null;
  }

  async detectAuth(): Promise<AuthState> {
    const token = process.env['GITHUB_TOKEN'];
    if (token) {
      return {
        status: 'authenticated',
        method: 'github_token',
        identity: `ghp_...${token.slice(-4)}`,
      };
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: this.agent,
      providerName: 'GitHub',
      steps: [
        { step: 1, description: 'Install the GitHub CLI: https://cli.github.com', url: 'https://cli.github.com' },
        { step: 2, description: 'Authenticate with GitHub', command: 'gh auth login' },
        { step: 3, description: 'Install the Copilot extension', command: 'gh extension install github/gh-copilot' },
      ],
      envVars: [
        { name: 'GITHUB_TOKEN', description: 'GitHub personal access token', required: false, exampleFormat: 'ghp_...' },
      ],
      documentationUrls: ['https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line'],
      loginCommand: 'gh auth login',
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
}

// Self-register in the global adapter registry
import { registerAdapterFactory } from './base-adapter.js';
import { getPluginTargetDescriptor } from '@a5c-ai/agent-catalog';

const _name = 'copilot';
registerAdapterFactory(_name, () => new CopilotAdapter(_name, getPluginTargetDescriptor(_name)?.cliCommand ?? _name));
