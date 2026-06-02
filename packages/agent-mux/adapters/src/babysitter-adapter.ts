/**
 * BabysitterAdapter — Babysitter orchestration harness adapter.
 *
 * Spawns the `agent-platform` CLI (`invoke` / `call`) and
 * parses its JSONL output into normalized AgentEvent streams.
 */

import * as path from 'node:path';
import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';

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
} from '@a5c-ai/agent-mux-comm';

import { BaseAgentAdapter } from './base-adapter.js';

export class BabysitterAdapter extends BaseAgentAdapter {
  readonly agent: string;
  readonly displayName = 'Babysitter';
  readonly cliCommand: string;
  readonly minVersion = '0.1.0';

  constructor(agent?: string, cliCommand?: string) {
    super();
    this.agent = agent ?? 'babysitter';
    this.cliCommand = cliCommand ?? 'agent-platform';
  }
  readonly hostEnvSignals = ['BABYSITTER_SESSION_ID', 'AGENT_SESSION_ID'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'babysitter',
    canResume: true,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: false,
    supportsThinkingStreaming: false,
    supportsNativeTools: false,
    supportsMCP: true,
    supportsParallelToolCalls: false,
    requiresToolApproval: true,
    approvalModes: ['yolo', 'prompt'],
    runtimeHooks: {
      preToolUse: 'unsupported',
      postToolUse: 'unsupported',
      sessionStart: 'unsupported',
      sessionEnd: 'unsupported',
      stop: 'unsupported',
      userPromptSubmit: 'unsupported',
    },
    supportsThinking: false,
    thinkingEffortLevels: [],
    supportsThinkingBudgetTokens: false,
    supportsJsonMode: true,
    supportsStructuredOutput: false,
    structuredSessionTransport: 'persistent',
    sessionControlPlane: 'self-managed',
    supportsSkills: true,
    supportsAgentsMd: false,
    skillsFormat: 'directory',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 4,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins: true,
    pluginFormats: ['skill-directory'],
    pluginInstallCmd: 'babysitter plugin:install',
    pluginListCmd: 'babysitter plugin:list-installed',
    pluginUninstallCmd: 'babysitter plugin:uninstall',
    pluginRegistries: [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'CLI Presence', description: 'Babysitter delegates auth to the underlying harness' },
    ],
    authFiles: [],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @a5c-ai/agent-platform' },
    ],
  };

  // Babysitter delegates model selection to the underlying harness.
  // Models are determined by the harness babysitter invokes, not babysitter itself.
  readonly models: ModelCapabilities[] = [];

  readonly defaultModelId = undefined;

  readonly configSchema: AgentConfigSchema = {
    agent: 'babysitter',
    version: 1,
    fields: [
      { key: 'defaultHarness', label: 'Default harness', type: 'string' as const, default: 'claude-code' },
      { key: 'maxIterations', label: 'Max iterations', type: 'number' as const, default: 256 },
      { key: 'runsDir', label: 'Runs directory', type: 'string' as const, default: '~/.a5c/runs' },
    ],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  buildSpawnArgs(options: RunOptions): SpawnArgs {
    const args: string[] = [];
    const harness = options.env?.['BABYSITTER_HARNESS'] || 'claude-code';
    const prompt = this.normalizePrompt(options.prompt);
    const sessionId = this.resolveSessionId(options);

    if (options.maxTurns && options.maxTurns > 1) {
      args.push('create-run');
      args.push('--harness', harness);
      args.push('--prompt', prompt);
      if (options.maxTurns) {
        args.push('--max-iterations', String(options.maxTurns));
      }
    } else {
      args.push('invoke', harness);
      args.push('--prompt', prompt);
    }

    if (options.cwd) {
      args.push('--workspace', options.cwd);
    }

    if (options.model) {
      args.push('--model', options.model);
    }

    if (sessionId) {
      args.push('--run-id', sessionId);
    }

    if (options.nonInteractive || options.approvalMode === 'yolo') {
      args.push('--non-interactive');
    }

    args.push('--output-format', 'amux-events');

    const timeout = options.timeout || 120000;

    return {
      command: this.cliCommand,
      args,
      env: {
        ...this.buildEnvFromOptions(options),
        AGENT_SESSION_ID: sessionId || '',
        BABYSITTER_MAX_ITERATIONS: String(options.maxTurns || 256),
      },
      cwd: options.cwd ?? process.cwd(),
      usePty: false,
      closeStdinAfterSpawn: true,
      timeout,
      inactivityTimeout: options.inactivityTimeout,
    };
  }

  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null {
    const parsed = this.parseJsonLine(line);
    if (parsed == null || typeof parsed !== 'object') {
      // Not JSON — treat as plaintext output
      return context.outputFormat === 'text' ? this.parsePlaintextEvent(line, context) : null;
    }

    const obj = parsed as Record<string, unknown>;
    const ts = Date.now();
    const base = { runId: context.runId, agent: this.agent, timestamp: ts };

    // babysitter outputs structured JSON with a 'type' field
    // matching agent-mux event types when --output-format amux-events is used
    if (obj['type'] && obj['runId']) {
      return obj as unknown as AgentEvent;
    }

    const type = obj['type'] as string | undefined;

    // Session/run events
    if (type === 'session_start' || type === 'run_started') {
      return {
        ...base,
        type: 'session_start',
        sessionId: String(obj['sessionId'] ?? obj['runId'] ?? context.sessionId ?? ''),
        resumed: Boolean(context.sessionId),
      } as AgentEvent;
    }

    // Text output
    if (type === 'text_delta' || type === 'text' || type === 'message') {
      const content = (obj['text'] ?? obj['delta'] ?? obj['content'] ?? '') as string;
      if (content) {
        const accumulated = `${String(context.adapterState['__babysitterTextAccumulated'] ?? '')}${content}`;
        context.adapterState['__babysitterTextAccumulated'] = accumulated;
        return { ...base, type: 'text_delta', delta: content, accumulated } as AgentEvent;
      }
    }

    // Tool call events
    if (type === 'tool_call_start' || type === 'tool_use') {
      return {
        ...base,
        type: 'tool_call_start',
        toolCallId: String(obj['toolCallId'] ?? obj['id'] ?? ''),
        toolName: String(obj['toolName'] ?? obj['name'] ?? ''),
        inputAccumulated: JSON.stringify(obj['input'] ?? {}),
      } as AgentEvent;
    }

    // Tool result events
    if (type === 'tool_result') {
      return {
        ...base,
        type: 'tool_result',
        toolCallId: String(obj['toolCallId'] ?? obj['id'] ?? ''),
        toolName: String(obj['toolName'] ?? obj['name'] ?? ''),
        output: obj['output'] ?? '',
        durationMs: 0,
      } as AgentEvent;
    }

    // Error events
    if (type === 'error') {
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message: (obj['message'] ?? obj['error'] ?? 'Unknown babysitter error') as string,
        recoverable: false,
      } as AgentEvent;
    }

    // Cost events
    if (type === 'cost') {
      const cost = this.assembleCostRecord(obj['cost'] ?? obj);
      if (cost) {
        return { ...base, type: 'cost', cost } as AgentEvent;
      }
    }

    // Turn boundary events (iteration boundaries)
    if (type === 'turn_start' || type === 'iteration_start') {
      const nextTurnIndex = typeof context.adapterState['__babysitterTurnIndex'] === 'number'
        ? (context.adapterState['__babysitterTurnIndex'] as number) + 1
        : 0;
      context.adapterState['__babysitterTurnIndex'] = nextTurnIndex;
      return {
        ...base,
        type: 'turn_start',
        turnIndex: nextTurnIndex,
      } as AgentEvent;
    }

    if (type === 'turn_end' || type === 'iteration_end') {
      return {
        ...base,
        type: 'turn_end',
        turnIndex: typeof context.adapterState['__babysitterTurnIndex'] === 'number'
          ? context.adapterState['__babysitterTurnIndex'] as number
          : 0,
      } as AgentEvent;
    }

    // Legacy format: older babysitter harness invoke output
    if (obj['status'] === 'completed') {
      return {
        ...base,
        type: 'session_end',
        sessionId: String(context.sessionId ?? context.runId),
        turnCount: typeof context.adapterState['__babysitterTurnIndex'] === 'number'
          ? (context.adapterState['__babysitterTurnIndex'] as number) + 1
          : 0,
      } as AgentEvent;
    }

    // Session end
    if (type === 'session_end' || type === 'run_completed') {
      return {
        ...base,
        type: 'session_end',
        sessionId: String(obj['sessionId'] ?? context.sessionId ?? context.runId),
        turnCount: typeof context.adapterState['__babysitterTurnIndex'] === 'number'
          ? (context.adapterState['__babysitterTurnIndex'] as number) + 1
          : 0,
      } as AgentEvent;
    }

    return null;
  }

  async detectAuth(): Promise<AuthState> {
    // Babysitter itself doesn't need auth — the underlying harness does.
    // Check if babysitter CLI is available.
    try {
      const installation = await this.detectInstallation();
      if (installation.installed) {
        return { status: 'authenticated', method: 'api_key', identity: 'babysitter-cli' };
      }
    } catch {
      // fall through
    }
    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'babysitter',
      providerName: 'Babysitter',
      steps: [
        { step: 1, description: 'Install babysitter agent CLI', command: 'npm i -g @a5c-ai/agent-platform' },
        { step: 2, description: 'Configure the underlying harness auth (e.g., Claude, Codex)', command: 'agent-platform discover' },
      ],
      envVars: [],
      documentationUrls: ['https://github.com/a5c-ai/babysitter'],
      verifyCommand: 'agent-platform version',
    };
  }

  sessionDir(cwd?: string): string {
    return path.join(cwd || process.cwd(), '.a5c', 'runs');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const raw = await fs.readFile(filePath, 'utf-8');
    const runJson = JSON.parse(raw) as Record<string, unknown>;
    return {
      agent: 'babysitter',
      sessionId: String(runJson['runId'] ?? ''),
      title: typeof runJson['prompt'] === 'string'
        ? (runJson['prompt'] as string).slice(0, 80) || 'Babysitter run'
        : 'Babysitter run',
      createdAt: typeof runJson['createdAt'] === 'string'
        ? runJson['createdAt'] as string
        : new Date().toISOString(),
      updatedAt: typeof runJson['createdAt'] === 'string'
        ? runJson['createdAt'] as string
        : new Date().toISOString(),
      turnCount: 0,
      model: typeof runJson['model'] === 'string' ? runJson['model'] as string : undefined,
      tags: runJson['processId'] ? [String(runJson['processId'])] : [],
      cwd: path.dirname(path.dirname(filePath)),
      messages: [],
    };
  }

  async listSessionFiles(cwd?: string): Promise<string[]> {
    const runsDir = this.sessionDir(cwd);
    if (!existsSync(runsDir)) return [];
    try {
      const entries = await fs.readdir(runsDir);
      const results: string[] = [];
      for (const entry of entries) {
        const runJsonPath = path.join(runsDir, entry, 'run.json');
        if (existsSync(runJsonPath)) {
          results.push(runJsonPath);
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    return { agent: 'babysitter', source: 'global' };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    // Babysitter config is managed by the babysitter CLI itself.
    // No-op in the agent-mux adapter.
  }
}
