/**
 * BaseAgentAdapter — abstract base class for agent adapters.
 *
 * Provides shared utilities and hook points with sensible defaults.
 * All built-in adapters extend this class.
 *
 * @see 05-adapter-system.md §4
 */

import * as os from 'node:os';
import * as fs from 'node:fs';

import type {
  AgentName,
  CostRecord,
  RetryPolicy,
  AgentCapabilities,
  ModelCapabilities,
  AgentConfig,
  AgentConfigSchema,
  AuthState,
  AuthSetupGuidance,
  Session,
  InstalledPlugin,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginListing,
  SpawnArgs,
  ParseContext,
  AgentAdapter,
  SubprocessAdapter,
  RunOptions,
  AgentEvent,
  ErrorCode,
  DetectInstallationResult,
  InstallResult,
  AdapterInstallOptions,
  AdapterUpdateOptions,
  Spawner,
  InstallMethod,
} from '@a5c-ai/agent-mux-comm';
import { StreamAssembler } from '@a5c-ai/agent-mux-comm';
import { runInstall, runUpdate, type InstallContext } from './adapter-install.js';
import { assembleCostRecord, defaultSpawner } from './base-adapter-helpers.js';

export { defaultSpawner } from './base-adapter-helpers.js';

/**
 * Abstract base class for subprocess-based agent adapters.
 * Provides shared utilities and hook points with sensible defaults.
 *
 * Implements SubprocessAdapter from the new multi-adapter architecture.
 * For HTTP/WebSocket/SDK adapters, create separate base classes.
 */
// ---------------------------------------------------------------------------
// Global adapter registry — adapters self-register at import time
// ---------------------------------------------------------------------------

const ADAPTER_FACTORIES = new Map<string, () => SubprocessAdapter>();

export function registerAdapterFactory(name: string, factory: () => SubprocessAdapter): void {
  ADAPTER_FACTORIES.set(name, factory);
}

export function getAdapterFactory(name: string): (() => SubprocessAdapter) | undefined {
  return ADAPTER_FACTORIES.get(name);
}

export function listRegisteredAdapters(): string[] {
  return Array.from(ADAPTER_FACTORIES.keys());
}

// ---------------------------------------------------------------------------

export abstract class BaseAgentAdapter implements SubprocessAdapter {
  // ── Adapter Type ──────────────────────────────────────────────────

  readonly adapterType = 'subprocess' as const;
  // ── Abstract members (must be implemented by subclasses) ──────────

  abstract readonly agent: AgentName;
  abstract readonly displayName: string;
  abstract readonly cliCommand: string;
  abstract readonly minVersion?: string;
  abstract readonly capabilities: AgentCapabilities;
  abstract readonly models: ModelCapabilities[];
  abstract readonly defaultModelId?: string;
  abstract readonly configSchema: AgentConfigSchema;

  abstract buildSpawnArgs(options: RunOptions): SpawnArgs;
  abstract parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null;
  abstract detectAuth(): Promise<AuthState>;
  abstract getAuthGuidance(): AuthSetupGuidance;
  abstract sessionDir(cwd?: string): string;
  abstract parseSessionFile(filePath: string): Promise<Session>;
  abstract listSessionFiles(cwd?: string): Promise<string[]>;
  abstract readConfig(cwd?: string): Promise<AgentConfig>;
  abstract writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>;

  // ── Optional plugin operations ────────────────────────────────────

  listPlugins?(): Promise<InstalledPlugin[]>;
  installPlugin?(pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin>;
  uninstallPlugin?(pluginId: string): Promise<void>;
  searchPlugins?(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>;

  // ── Protected stream assembler ────────────────────────────────────

  protected readonly streamAssembler = new StreamAssembler();

  // ── Injectable spawner for install/update/detect ──────────────────

  /** Subprocess runner used by install/update/detect. Swap for tests. */
  protected _spawner: Spawner = defaultSpawner;

  /** Replaces the internal Spawner (used by tests and CLI DI). */
  setSpawner(spawner: Spawner): void {
    this._spawner = spawner;
  }

  protected normalizePrompt(prompt: string | string[]): string {
    return Array.isArray(prompt) ? prompt.join('\n') : prompt;
  }

  protected stripAnsi(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
  }

  protected parsePlaintextEvent(line: string, context: ParseContext): AgentEvent | null {
    const cleaned = this.stripAnsi(line).replace(/\r/g, '').trim();
    if (!cleaned) return null;

    const base = {
      runId: context.runId,
      agent: this.agent,
      timestamp: Date.now(),
    };

    const nextToolId = (): string => {
      const key = '__plainTextToolSeq';
      const current = typeof context.adapterState[key] === 'number' ? context.adapterState[key] as number : 0;
      const next = current + 1;
      context.adapterState[key] = next;
      return `plaintext-tool-${next}`;
    };

    if (/^(thinking|reasoning)([:.\s]|$)/i.test(cleaned)) {
      const delta = cleaned.replace(/^(thinking|reasoning)([:.\s-]*)/i, '').trim() || cleaned;
      return { ...base, type: 'thinking_delta', delta, accumulated: delta } as AgentEvent;
    }

    if (/^(tool|using tool|running|executing)([:.\s]|$)/i.test(cleaned)) {
      const toolName = cleaned.replace(/^(tool|using tool|running|executing)([:.\s-]*)/i, '').trim() || 'tool';
      const toolCallId = nextToolId();
      context.adapterState['__lastPlainTextToolId'] = toolCallId;
      return {
        ...base,
        type: 'tool_call_start',
        toolCallId,
        toolName,
        inputAccumulated: toolName,
      } as AgentEvent;
    }

    if (/^(tool result|result|completed)([:.\s]|$)/i.test(cleaned)) {
      const output = cleaned.replace(/^(tool result|result|completed)([:.\s-]*)/i, '').trim() || cleaned;
      const toolCallId = typeof context.adapterState['__lastPlainTextToolId'] === 'string'
        ? context.adapterState['__lastPlainTextToolId'] as string
        : nextToolId();
      return {
        ...base,
        type: 'tool_result',
        toolCallId,
        toolName: 'tool',
        output,
        durationMs: 0,
      } as AgentEvent;
    }

    if ((context.source === 'stderr' || /^error([:.\s]|$)/i.test(cleaned)) && /^error([:.\s]|$)/i.test(cleaned)) {
      return {
        ...base,
        type: 'error',
        code: 'INTERNAL' as const,
        message: cleaned.replace(/^error([:.\s-]*)/i, '').trim() || cleaned,
        recoverable: false,
      } as AgentEvent;
    }

    return {
      ...base,
      type: 'text_delta',
      delta: cleaned,
      accumulated: cleaned,
    } as AgentEvent;
  }

  protected buildPromptTransport(options: RunOptions): { prompt: string; stdin?: string } {
    const prompt = this.normalizePrompt(options.prompt);
    if (prompt.trim().length === 0) {
      return { prompt: '' };
    }
    if (options.nonInteractive === true || !this.capabilities.supportsStdinInjection) {
      return { prompt };
    }

    return {
      prompt,
      stdin: prompt.endsWith('\n') ? prompt : `${prompt}\n`,
    };
  }

  // ── detectInstallation ────────────────────────────────────────────

  /**
   * Locates the harness binary and queries its `--version`. Default
   * implementation uses `which`/`where` + `<cli> --version`.
   */
  async detectInstallation(): Promise<DetectInstallationResult> {
    const locator = process.platform === 'win32' ? 'where' : 'which';
    let binPath: string | undefined;
    try {
      const res = await this._spawner(locator, [this.cliCommand]);
      if (res.code === 0) {
        const first = res.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0];
        if (first) binPath = first;
      }
    } catch {
      // not found
    }

    if (!binPath) {
      return { installed: false };
    }

    binPath = this.resolveWindowsBinaryPath(binPath);

    let version: string | undefined;
    const versionCommands = [
      this.resolveVersionProbeCommand(binPath),
      ...(binPath.toLowerCase().includes(this.cliCommand.toLowerCase())
        ? [{ command: this.cliCommand, args: ['--version'] }]
        : []),
    ];
    for (const versionCommand of versionCommands) {
      try {
        const vres = await this._spawner(versionCommand.command, versionCommand.args);
        if (vres.code !== 0) {
          continue;
        }
        version = this.parseVersionOutput(vres.stdout + '\n' + vres.stderr);
        if (version) {
          break;
        }
      } catch {
        // ignore; still installed
      }
    }

    const out: DetectInstallationResult = { installed: true, path: binPath };
    if (version) out.version = version;
    return out;
  }

  /**
   * Parses a `--version` output line. Default: first semver-like token.
   * Override to accommodate bespoke version formats.
   */
  protected parseVersionOutput(raw: string): string | undefined {
    const match = raw.match(/\d+\.\d+\.\d+(?:[\w.+-]*)?/);
    return match ? match[0] : undefined;
  }

  protected resolveWindowsBinaryPath(binPath: string): string {
    if (process.platform !== 'win32') {
      return binPath;
    }
    if (/\.(cmd|bat|exe|ps1)$/i.test(binPath)) {
      return binPath;
    }
    for (const extension of ['.cmd', '.bat', '.exe', '.ps1']) {
      const candidate = `${binPath}${extension}`;
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return binPath;
  }

  protected resolveVersionProbeCommand(binPath: string): { command: string; args: string[] } {
    if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(binPath)) {
      const powershellShim = binPath.replace(/\.(cmd|bat)$/i, '.ps1');
      if (fs.existsSync(powershellShim)) {
        return {
          command: 'powershell.exe',
          args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', powershellShim, '--version'],
        };
      }
      return {
        command: 'cmd.exe',
        args: ['/d', '/s', '/c', `""${binPath}" --version"`],
      };
    }
    if (process.platform === 'win32' && /\.ps1$/i.test(binPath)) {
      return {
        command: 'powershell.exe',
        args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', binPath, '--version'],
      };
    }
    return {
      command: binPath,
      args: ['--version'],
    };
  }

  // ── install ────────────────────────────────────────────────────────

  /**
   * Picks an install method compatible with the current platform, runs it,
   * then re-detects. Honors `force` and `dryRun`.
   */
  private _installContext(): InstallContext {
    return {
      cliCommand: this.cliCommand,
      displayName: this.displayName,
      spawner: this._spawner,
      detectInstallation: () => this.detectInstallation(),
      pickInstallMethod: () => this.pickInstallMethod(),
      applyVersionToCommand: (m, v) => this.applyVersionToCommand(m, v),
      deriveUpdateCommand: (m) => this.deriveUpdateCommand(m),
    };
  }

  async install(opts: AdapterInstallOptions = {}): Promise<InstallResult> {
    return runInstall(this._installContext(), opts);
  }

  // ── update ────────────────────────────────────────────────────────

  /** Runs the update/upgrade variant of the install command. */
  async update(opts: AdapterUpdateOptions = {}): Promise<InstallResult> {
    return runUpdate(this._installContext(), opts);
  }

  // ── Helpers ───────────────────────────────────────────────────────

  /**
   * Picks the first InstallMethod compatible with the current platform,
   * preferring non-manual methods.
   */
  protected pickInstallMethod(): InstallMethod | undefined {
    const plat = os.platform();
    const methods = this.capabilities.installMethods ?? [];
    const compatible = methods.filter((m) => {
      if (m.platform === 'all') return true;
      if (m.platform === plat) return true;
      // brew is acceptable on darwin/linux; npm on all
      return false;
    });
    if (compatible.length === 0) return undefined;
    const rank = (t: string): number => {
      switch (t) {
        case 'npm': return 0;
        case 'brew': return plat === 'darwin' || plat === 'linux' ? 1 : 50;
        case 'gh-extension': return 2;
        case 'pip': return 3;
        case 'winget': return plat === 'win32' ? 2 : 50;
        case 'scoop': return plat === 'win32' ? 3 : 50;
        case 'nix': return 6;
        case 'curl': return 7;
        case 'manual': return 99;
        default: return 50;
      }
    };
    return [...compatible].sort((a, b) => rank(a.type) - rank(b.type))[0];
  }

  /**
   * Replace `<pkg>` tail with `<pkg>@<version>` for npm-typed methods.
   */
  protected applyVersionToCommand(method: InstallMethod, version?: string): string {
    if (!version) return method.command;
    if (method.type !== 'npm') return method.command;
    const parts = method.command.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return method.command;
    const last = parts[parts.length - 1]!;
    // Only apply version if not already version-pinned.
    if (/@\d/.test(last.replace(/^@[^@/]+\//, ''))) return method.command;
    parts[parts.length - 1] = `${last}@${version}`;
    return parts.join(' ');
  }

  /**
   * Derives an update command from an install method.
   */
  protected deriveUpdateCommand(method: InstallMethod): string | null {
    const parts = method.command.split(/\s+/).filter(Boolean);
    const pkg = parts[parts.length - 1];
    if (!pkg) return null;
    switch (method.type) {
      case 'npm':
        return `npm update -g ${pkg}`;
      case 'brew':
        return `brew upgrade ${pkg}`;
      case 'pip':
        return `pip install --upgrade ${pkg}`;
      case 'winget':
        return `winget upgrade ${pkg}`;
      case 'scoop':
        return `scoop update ${pkg}`;
      case 'curl':
        // Re-run the installer script.
        return method.command;
      case 'nix':
        return `nix-env -u ${pkg}`;
      case 'gh-extension':
        return `gh extension upgrade ${pkg}`;
      case 'manual':
        return null;
      default:
        return null;
    }
  }

  // ── Protected utilities ───────────────────────────────────────────

  /**
   * Attempts to parse a line as JSON. Returns the parsed value on success,
   * or null if the line is not valid JSON. Does not throw.
   */
  protected parseJsonLine(line: string): unknown | null {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }

  /**
   * Normalizes a raw cost/usage object from agent output into the
   * standard CostRecord type.
   */
  protected assembleCostRecord(raw: unknown): CostRecord | null {
    return assembleCostRecord(raw);
  }

  /**
   * Detects the installed CLI version. Returns null in the base implementation.
   * Subclasses should override to run the agent's CLI with a version flag.
   */
  protected async detectVersionFromCli(): Promise<string | null> {
    return null;
  }

  /**
   * Builds the environment variable record for the subprocess from RunOptions.
   */
  protected buildEnvFromOptions(options: RunOptions): Record<string, string> {
    const env: Record<string, string> = {};

    // Propagate harness-specific env vars that affect config/session location
    // or transport routing. Explicit RunOptions.env overrides.
    const passthrough = [
      'CODEX_HOME',                      // codex config/session root override
      'GH_HOST',                         // gh copilot — GitHub Enterprise host
      'GH_TOKEN',                        // gh copilot auth
      'GOOGLE_APPLICATION_CREDENTIALS',  // gemini service account
      'HTTPS_PROXY',
      'HTTP_PROXY',
      'NO_PROXY',
    ];
    for (const name of passthrough) {
      const v = process.env[name];
      if (v) env[name] = v;
    }

    if (options.env) {
      Object.assign(env, options.env);
    }

    return env;
  }

  /**
   * Resolves the session ID to use for this run.
   */
  protected resolveSessionId(options: RunOptions): string | undefined {
    if (options.sessionId) return options.sessionId;
    if (options.forkSessionId) return options.forkSessionId;
    if (options.noSession) return undefined;
    return undefined;
  }

  // ── Hook points (overridable, with defaults) ──────────────────────

  /**
   * Called when the agent subprocess fails to spawn.
   */
  onSpawnError(error: Error): AgentEvent {
    return {
      type: 'crash',
      runId: '',
      agent: this.agent,
      timestamp: Date.now(),
      exitCode: -1,
      stderr: error.message,
    } as AgentEvent;
  }

  /**
   * Called when the inactivity timeout fires.
   */
  onTimeout(): AgentEvent {
    return {
      type: 'error',
      runId: '',
      agent: this.agent,
      timestamp: Date.now(),
      code: 'TIMEOUT' as ErrorCode,
      message: 'Inactivity timeout',
      recoverable: false,
    } as AgentEvent;
  }

  /**
   * Called when the agent subprocess exits.
   */
  onProcessExit(exitCode: number, signal: string | null): AgentEvent[] {
    if (exitCode === 0) return [];

    if (signal) {
      return [
        {
          type: 'error',
          runId: '',
          agent: this.agent,
          timestamp: Date.now(),
          code: 'AGENT_CRASH' as ErrorCode,
          message: `Process killed by signal: ${signal}`,
          recoverable: false,
        } as AgentEvent,
      ];
    }

    return [
      {
        type: 'crash',
        runId: '',
        agent: this.agent,
        timestamp: Date.now(),
        exitCode,
        stderr: '',
      } as AgentEvent,
    ];
  }

  /**
   * Determines whether a failed run should be retried.
   */
  shouldRetry(event: AgentEvent, attempt: number, policy: RetryPolicy): boolean {
    const maxAttempts = policy.maxAttempts ?? 3;
    if (attempt >= maxAttempts) return false;

    const retryOn = policy.retryOn ?? ['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT'];

    // Check if the event has an error code
    if ('code' in event && typeof event.code === 'string') {
      return retryOn.includes(event.code as ErrorCode);
    }

    // Check if it's a crash event
    if (event.type === 'crash') {
      return retryOn.includes('AGENT_CRASH');
    }

    return false;
  }

  /**
   * Default hook installation: registers in .amux/hooks.json only.
   * Override in subclasses to also write native harness config (e.g.
   * ~/.claude/settings.json) so the hook fires without amux present.
   */
  async installHook(
    hookType: string,
    command: string,
    opts: { scope?: 'global' | 'project'; id?: string } = {},
  ): Promise<void> {
    await this.registerHookInConfig(hookType, command, opts);
    await this.writeNativeHook(hookType, command);
  }

  /** Register a hook in the unified .amux/hooks.json store. */
  protected async registerHookInConfig(
    hookType: string,
    command: string,
    opts: { scope?: 'global' | 'project'; id?: string } = {},
  ): Promise<void> {
    const { HookConfigManager } = await import('@a5c-ai/agent-mux-comm');
    const mgr = new HookConfigManager();
    const id = opts.id ?? `${this.agent}.${hookType}.${Date.now().toString(36)}`;
    await mgr.add(
      {
        id,
        agent: this.agent,
        hookType,
        handler: 'command',
        target: command,
        enabled: true,
      },
      opts.scope ?? 'project',
    );
  }

  /**
   * Write the hook into the harness's native config. Default: append
   * `{ command }` to `hooks[hookType]` in configFilePaths[0] if it is
   * a .json file. Subclasses override to use harness-specific schema.
   * Best-effort: failures are swallowed so SDK registration still succeeds.
   */
  protected async writeNativeHook(hookType: string, command: string): Promise<void> {
    const nativePath = this.configSchema.configFilePaths?.[0];
    if (!nativePath || !nativePath.endsWith('.json')) return;
    try {
      await this.appendJsonHook(nativePath, hookType, { command });
    } catch {
      // swallow
    }
  }

  async uninstallHook(
    id: string,
    opts: { scope?: 'global' | 'project' } = {},
  ): Promise<boolean> {
    const { HookConfigManager } = await import('@a5c-ai/agent-mux-comm');
    const mgr = new HookConfigManager();
    return await mgr.remove(id, opts.scope);
  }

  /**
   * Append `{ command }` to `hooks[hookType]` in the given JSON file,
   * preserving any existing hooks and creating the parent directory if
   * needed. Used by adapters that expose a simple JSON-based native
   * hook config (codex, gemini, copilot, cursor, opencode, pi, omp,
   * openclaw, hermes).
   */
  protected async appendJsonHook(
    settingsPath: string,
    hookType: string,
    entry: Record<string, unknown>,
  ): Promise<void> {
    const fsp = await import('node:fs/promises');
    const pathMod = await import('node:path');
    let doc: Record<string, unknown> = {};
    try {
      doc = JSON.parse(await fsp.readFile(settingsPath, 'utf8')) as Record<string, unknown>;
    } catch {
      doc = {};
    }
    const hooks = (doc['hooks'] && typeof doc['hooks'] === 'object'
      ? (doc['hooks'] as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const existing = Array.isArray(hooks[hookType])
      ? (hooks[hookType] as unknown[]).slice()
      : [];
    existing.push(entry);
    hooks[hookType] = existing;
    doc['hooks'] = hooks;
    await fsp.mkdir(pathMod.dirname(settingsPath), { recursive: true });
    await fsp.writeFile(settingsPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  }

}
