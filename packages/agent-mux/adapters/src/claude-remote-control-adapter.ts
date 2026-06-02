import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from 'node:child_process';

import type {
  AgentCapabilities,
  AgentConfig,
  AgentConfigSchema,
  AgentEvent,
  AuthSetupGuidance,
  AuthState,
  DetectInstallationResult,
  InstalledPlugin,
  ModelCapabilities,
  ParseContext,
  PluginInstallOptions,
  ProgrammaticRun,
  RunOptions,
  Session,
  CostRecord,
} from '@a5c-ai/agent-mux-comm';
import { StreamAssembler } from '@a5c-ai/agent-mux-comm';

import { BaseProgrammaticAdapter } from './programmatic-adapter-base.js';
import { ClaudeAdapter } from './claude-adapter.js';

type SpawnProcess = (
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio,
) => ChildProcessWithoutNullStreams;

type QueuedItem = IteratorResult<AgentEvent, void>;

export function extractClaudeRemoteControlUrl(
  line: string,
): { sessionId: string; url: string } | null {
  const match = line.match(/https:\/\/claude\.ai\/code\/(session_[A-Za-z0-9]+)/);
  if (!match) {
    return null;
  }
  return {
    sessionId: match[1]!,
    url: match[0],
  };
}

export function extractClaudeRemoteControlInitialSessionId(line: string): string | null {
  const match = line.match(/Created initial session (session_[A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

export function extractClaudeRemoteControlBridgeJson(line: string): string | null {
  const marker = '<<< ';
  const markerIndex = line.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }
  const payload = line.slice(markerIndex + marker.length).trim();
  if (!payload.startsWith('{') || !payload.endsWith('}')) {
    return null;
  }
  return payload;
}

class AsyncEventQueue implements ProgrammaticRun {
  private readonly values: QueuedItem[] = [];
  private readonly waiters: Array<{
    resolve: (value: QueuedItem) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private closed = false;
  private failure: unknown = null;
  private closeHandler: (() => Promise<void>) | null = null;

  setCloseHandler(handler: () => Promise<void>): void {
    this.closeHandler = handler;
  }

  push(event: AgentEvent): void {
    if (this.closed) {
      return;
    }
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve({ value: event, done: false });
      return;
    }
    this.values.push({ value: event, done: false });
  }

  fail(error: unknown): void {
    if (this.closed) {
      return;
    }
    this.failure = error;
    this.closed = true;
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(error);
    }
  }

  end(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    for (const waiter of this.waiters.splice(0)) {
      waiter.resolve({ value: undefined, done: true });
    }
  }

  async next(): Promise<QueuedItem> {
    if (this.values.length > 0) {
      return this.values.shift()!;
    }
    if (this.failure != null) {
      throw this.failure;
    }
    if (this.closed) {
      return { value: undefined, done: true };
    }
    return await new Promise<QueuedItem>((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  async return(): Promise<QueuedItem> {
    await this.close();
    return { value: undefined, done: true };
  }

  async close(): Promise<void> {
    await this.closeHandler?.();
    this.end();
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<AgentEvent> {
    return this;
  }
}

export class ClaudeRemoteControlAdapter extends BaseProgrammaticAdapter {
  readonly agent: string;
  readonly displayName = 'Claude Remote Control';
  readonly minVersion = '2.1.0';

  constructor(agent?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase().replace(/clauderemotecontrol/, 'claude-remote-control');
  }
  readonly hostEnvSignals = ['CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX', 'CLAUDE_CODE_SESSION_ID'] as const;

  private readonly claudeCli = new ClaudeAdapter();
  private readonly parseDelegate = new ClaudeAdapter();
  private spawnProcess: SpawnProcess = spawn;

  readonly capabilities: AgentCapabilities = {
    agent: 'claude-remote-control',
    canResume: false,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'none',
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
    supportsThinkingBudgetTokens: true,
    supportsJsonMode: false,
    supportsStructuredOutput: false,
    structuredSessionTransport: 'none',
    sessionControlPlane: 'external-host',
    supportsSkills: true,
    supportsAgentsMd: true,
    skillsFormat: 'file',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 32,
    supportsInteractiveMode: false,
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
      { type: 'browser_login', name: 'Claude Login', description: 'Requires a Claude subscription and Claude account login' },
    ],
    authFiles: ['.claude.json', '.claude/settings.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @anthropic-ai/claude-code' },
    ],
  };

  readonly models: ModelCapabilities[] = this.claudeCli.models.map((model) => ({
    ...model,
    agent: 'claude-remote-control',
  }));

  readonly defaultModelId = this.claudeCli.defaultModelId;

  readonly configSchema: AgentConfigSchema = {
    ...this.claudeCli.configSchema,
    agent: 'claude-remote-control',
  };

  setProcessSpawner(spawner: SpawnProcess): void {
    this.spawnProcess = spawner;
  }

  setSpawner(spawner: Parameters<ClaudeAdapter['setSpawner']>[0]): void {
    this.claudeCli.setSpawner(spawner);
  }

  execute(options: RunOptions): ProgrammaticRun {
    const queue = new AsyncEventQueue();
    const runId = this.generateRunId();
    const cwd = options.cwd ?? process.cwd();
    const debugDir = path.join(cwd, '.a5c', 'processes');
    const uniqueStem = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const debugFile = path.join(debugDir, `claude-remote-control-${uniqueStem}.log`);

    let child: ChildProcessWithoutNullStreams | null = null;
    let stdoutBuffer = '';
    let debugCarry = '';
    let debugOffset = 0;
    let debugPollTimer: NodeJS.Timeout | null = null;
    let childExited = false;
    let remoteSessionId: string | null = null;
    let remoteUrl: string | null = null;
    let remoteUrlAnnounced = false;
    const parseContext: ParseContext = {
      runId,
      agent: this.agent,
      sessionId: undefined,
      turnIndex: 0,
      debug: false,
      outputFormat: 'jsonl',
      source: 'stdout',
      assembler: new StreamAssembler(),
      eventCount: 0,
      lastEventType: null,
      adapterState: {},
    };

    // eslint-disable-next-line no-control-regex
    const stripAnsi = (value: string): string =>
      value
        .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '') // eslint-disable-line no-control-regex
        .replace(/\u001b\].*?(?:\u0007|\u001b\\)/g, '') // eslint-disable-line no-control-regex
        .replace(/\r/g, '')
        .trim();

    const emit = (event: AgentEvent): void => {
      queue.push({ ...event, runId, agent: this.agent });
      parseContext.eventCount += 1;
      parseContext.lastEventType = event.type;
    };

    const emitRemoteSessionStart = (): void => {
      if (!remoteSessionId) {
        return;
      }
      emit({
        type: 'session_start',
        runId,
        agent: this.agent,
        timestamp: Date.now(),
        sessionId: remoteSessionId,
        resumed: false,
        cwd,
      } as AgentEvent);
      if (remoteUrl) {
        emit({
          type: 'message_stop',
          runId,
          agent: this.agent,
          timestamp: Date.now(),
          text: `Remote Control URL: ${remoteUrl}`,
        } as AgentEvent);
        remoteUrlAnnounced = true;
      }
    };

    const maybeCaptureRemoteUrl = (line: string): void => {
      const extracted = extractClaudeRemoteControlUrl(line);
      if (!extracted) {
        return;
      }
      const hadSession = remoteSessionId != null;
      remoteSessionId = remoteSessionId ?? extracted.sessionId;
      remoteUrl = extracted.url;
      if (!hadSession) {
        emitRemoteSessionStart();
        return;
      }
      if (!remoteUrlAnnounced) {
        emit({
          type: 'message_stop',
          runId,
          agent: this.agent,
          timestamp: Date.now(),
          text: `Remote Control URL: ${remoteUrl}`,
        } as AgentEvent);
        remoteUrlAnnounced = true;
      }
    };

    const maybeCaptureInitialSession = (line: string): void => {
      const sessionId = extractClaudeRemoteControlInitialSessionId(line);
      if (!sessionId || remoteSessionId) {
        return;
      }
      remoteSessionId = sessionId;
      emitRemoteSessionStart();
    };

    const mapCostRecord = (cost: CostRecord): CostRecord => ({
      totalUsd: cost.totalUsd,
      inputTokens: cost.inputTokens,
      outputTokens: cost.outputTokens,
      thinkingTokens: cost.thinkingTokens,
      cachedTokens: cost.cachedTokens,
      cacheCreationTokens: cost.cacheCreationTokens,
      cacheReadTokens: cost.cacheReadTokens,
    });

    const maybeParseBridgePayload = (line: string): void => {
      const payload = extractClaudeRemoteControlBridgeJson(line);
      if (!payload) {
        return;
      }
      const parsed = this.parseDelegate.parseEvent(payload, parseContext);
      if (!parsed) {
        return;
      }
      const normalized = Array.isArray(parsed) ? parsed : [parsed];
      for (const event of normalized) {
        const rewritten = { ...event, runId, agent: this.agent } as AgentEvent;
        if (rewritten.type === 'session_start') {
          if (!remoteSessionId) {
            continue;
          }
          (rewritten as AgentEvent & { sessionId?: string }).sessionId = remoteSessionId;
        }
        if (rewritten.type === 'session_end' && remoteSessionId) {
          (rewritten as AgentEvent & { sessionId?: string }).sessionId = remoteSessionId;
        }
        if (rewritten.type === 'cost' && 'cost' in rewritten && rewritten.cost) {
          rewritten.cost = mapCostRecord(rewritten.cost);
        }
        emit(rewritten);
      }
    };

    const handleStdoutLine = (rawLine: string): void => {
      const line = stripAnsi(rawLine);
      if (!line) {
        return;
      }
      maybeCaptureRemoteUrl(line);
    };

    const handleDebugLine = (line: string): void => {
      maybeCaptureInitialSession(line);
      maybeParseBridgePayload(line);
    };

    const stopPolling = (): void => {
      if (debugPollTimer) {
        clearInterval(debugPollTimer);
        debugPollTimer = null;
      }
    };

    const pollDebugFile = async (): Promise<void> => {
      let content: string;
      try {
        content = await fsp.readFile(debugFile, 'utf8');
      } catch {
        return;
      }
      if (content.length <= debugOffset) {
        return;
      }
      const chunk = content.slice(debugOffset);
      debugOffset = content.length;
      debugCarry += chunk;
      let newlineIndex = debugCarry.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = debugCarry.slice(0, newlineIndex).replace(/\r$/, '');
        debugCarry = debugCarry.slice(newlineIndex + 1);
        handleDebugLine(line);
        newlineIndex = debugCarry.indexOf('\n');
      }
    };

    const closeChild = async (): Promise<void> => {
      stopPolling();
      if (!child || childExited) {
        return;
      }
      await new Promise<void>((resolve) => {
        const runningChild = child!;
        const done = () => resolve();
        runningChild.once('exit', done);
        try {
          runningChild.kill('SIGINT');
        } catch {
          resolve();
        }
        setTimeout(() => {
          try {
            runningChild.kill('SIGKILL');
          } catch {
            // Ignore forced-kill failures.
          }
          resolve();
        }, 2_000).unref();
      });
    };

    queue.setCloseHandler(closeChild);

    queueMicrotask(() => {
      void (async () => {
        try {
          await fsp.mkdir(debugDir, { recursive: true });
          const env: NodeJS.ProcessEnv = {
            ...process.env,
            ...options.env,
            CI: '1',
          };
          const defaultName = `agent-mux ${path.basename(cwd) || 'session'}`;
          const args = [
            'remote-control',
            '--spawn',
            'session',
            '--name',
            defaultName,
            '--debug-file',
            debugFile,
            '--permission-mode',
            this.mapPermissionMode(options.approvalMode),
          ];

          child = this.spawnProcess('claude', args, {
            cwd,
            env,
            windowsHide: true,
          });
          child.stdout.setEncoding('utf8');
          child.stderr.setEncoding('utf8');

          child.stdout.on('data', (chunk: string | Buffer) => {
            stdoutBuffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
            let newlineIndex = stdoutBuffer.indexOf('\n');
            while (newlineIndex !== -1) {
              const line = stdoutBuffer.slice(0, newlineIndex);
              stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
              handleStdoutLine(line);
              newlineIndex = stdoutBuffer.indexOf('\n');
            }
          });

          child.stderr.on('data', (chunk: string | Buffer) => {
            const raw = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
            for (const line of raw.split(/\r?\n/)) {
              if (!line.trim()) {
                continue;
              }
              emit(this.createErrorEvent(runId, 'INTERNAL', stripAnsi(line), false));
            }
          });

          child.on('error', (error) => {
            queue.fail(error);
          });

          child.on('exit', (code, signal) => {
            childExited = true;
            stopPolling();
            if (code && code !== 0) {
              emit(this.createErrorEvent(
                runId,
                'INTERNAL',
                `Claude Remote Control exited with code ${code}${signal ? ` (${signal})` : ''}`,
                false,
              ));
            }
            queue.end();
          });

          debugPollTimer = setInterval(() => {
            void pollDebugFile();
          }, 250);
          debugPollTimer.unref?.();
          await pollDebugFile();
        } catch (error) {
          queue.fail(error);
        }
      })();
    });

    return queue;
  }

  async detectInstallation(): Promise<DetectInstallationResult> {
    return await this.claudeCli.detectInstallation();
  }

  async detectAuth(): Promise<AuthState> {
    return await this.claudeCli.detectAuth();
  }

  getAuthGuidance(): AuthSetupGuidance {
    const guidance = this.claudeCli.getAuthGuidance();
    return {
      ...guidance,
      agent: 'claude-remote-control',
      steps: [
        ...guidance.steps,
        { step: guidance.steps.length + 1, description: 'Remote Control requires a Claude subscription and the Claude app or claude.ai/code' },
      ],
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.claude', 'projects');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const session = await this.claudeCli.parseSessionFile(filePath);
    return { ...session, agent: 'claude-remote-control' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return [];
  }

  async readConfig(cwd?: string): Promise<AgentConfig> {
    const config = await this.claudeCli.readConfig(cwd);
    return { ...config, agent: 'claude-remote-control' };
  }

  async writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void> {
    await this.claudeCli.writeConfig(config, cwd);
  }

  async listPlugins(): Promise<InstalledPlugin[]> {
    return await this.claudeCli.listPlugins?.() ?? [];
  }

  async installPlugin(
    pluginId: string,
    options?: PluginInstallOptions,
  ): Promise<InstalledPlugin> {
    const installer = this.claudeCli.installPlugin;
    if (!installer) {
      throw new Error('Claude Remote Control plugin install is unavailable');
    }
    return await installer.call(this.claudeCli, pluginId, options);
  }

  async uninstallPlugin(pluginId: string, options?: { global?: boolean }): Promise<void> {
    const uninstaller = this.claudeCli.uninstallPlugin;
    if (!uninstaller) {
      throw new Error('Claude Remote Control plugin uninstall is unavailable');
    }
    await uninstaller.call(this.claudeCli, pluginId, options);
  }

  private mapPermissionMode(mode: RunOptions['approvalMode']): string {
    if (mode === 'yolo') {
      return 'bypassPermissions';
    }
    if (mode === 'deny') {
      return 'plan';
    }
    return 'default';
  }
}
