/**
 * CopilotAdapter — GitHub Copilot CLI adapter.
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
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

export class CopilotAdapter extends BaseAgentAdapter {
  readonly agent = 'copilot' as const;
  readonly displayName = 'GitHub Copilot';
  readonly cliCommand = 'gh copilot';
  readonly minVersion = '1.0.0';
  readonly hostEnvSignals = ['COPILOT_CLI_SESSION', 'GH_COPILOT_SESSION'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'copilot',
    canResume: false,
    canFork: false,
    supportsMultiTurn: false,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: false,
    supportsThinkingStreaming: false,
    supportsNativeTools: false,
    supportsMCP: false,
    supportsParallelToolCalls: false,
    requiresToolApproval: false,
    approvalModes: ['prompt'],
    runtimeHooks: createVirtualRuntimeHookCapabilities(),
    supportsThinking: false,
    thinkingEffortLevels: [],
    supportsThinkingBudgetTokens: false,
    supportsJsonMode: false,
    supportsStructuredOutput: false,
    structuredSessionTransport: 'none',
    sessionControlPlane: 'self-managed',
    supportsSkills: false,
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: false,
    supportsParallelExecution: false,
    supportsInteractiveMode: true,
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
      { type: 'github_token', name: 'GitHub Token', description: 'GITHUB_TOKEN environment variable' },
      { type: 'oauth_device', name: 'OAuth Device Flow', description: 'GitHub CLI OAuth device flow' },
    ],
    authFiles: ['.config/github-copilot/settings.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @github/copilot-cli' },
      { platform: 'all', type: 'gh-extension', command: 'gh extension install github/gh-copilot' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'copilot',
      modelId: 'gpt-4o',
      displayName: 'GPT-4o',
      deprecated: false,
      contextWindow: 128000,
      maxOutputTokens: 16384,
      supportsThinking: false,
      supportsToolCalling: false,
      supportsParallelToolCalls: false,
      supportsToolCallStreaming: false,
      supportsJsonMode: false,
      supportsStructuredOutput: false,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsFileInput: false,
      cliArgKey: '--model',
      cliArgValue: 'gpt-4o',
      lastUpdated: '2025-01-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'gpt-4o';

  readonly configSchema: AgentConfigSchema = {
    agent: 'copilot',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.config', 'github-copilot', 'settings.json')],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

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
      agent: 'copilot',
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
      verifyCommand: 'gh copilot --version',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.config', 'github-copilot', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'copilot');
    return { ...parsed, agent: 'copilot' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'copilot', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'copilot', source: 'global', filePaths: [filePath], ...data };
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
registerAdapterFactory('copilot', () => new CopilotAdapter());
