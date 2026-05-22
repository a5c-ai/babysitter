/**
 * BaseProgrammaticAdapter — abstract base class for programmatic (SDK) adapters.
 *
 * Provides shared utilities for direct SDK integration without subprocess
 * or network communication.
 */

import type {
  AgentName,
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
  RunOptions,
  AgentEvent,
  ProgrammaticAdapter,
  CostRecord,
  SpawnArgs,
  ParseContext,
} from '@a5c-ai/agent-mux-core';

/**
 * Abstract base class for programmatic adapters. Provides shared utilities
 * for direct SDK integration and common functionality.
 */
export abstract class BaseProgrammaticAdapter implements ProgrammaticAdapter {
  // ── Adapter Type ──────────────────────────────────────────────────

  readonly adapterType = 'programmatic' as const;

  // ── Legacy Compatibility (for validation with old interface) ────────

  readonly cliCommand = '[programmatic]'; // Stub for legacy validation
  buildSpawnArgs(_options: RunOptions): SpawnArgs {
    throw new Error('buildSpawnArgs not supported on programmatic adapters');
  }
  parseEvent(_line: string, _context: ParseContext): AgentEvent | AgentEvent[] | null {
    throw new Error('parseEvent not supported on programmatic adapters');
  }

  // ── Abstract members (must be implemented by subclasses) ──────────

  abstract readonly agent: AgentName;
  abstract readonly displayName: string;
  abstract readonly minVersion?: string;
  abstract readonly capabilities: AgentCapabilities;
  abstract readonly models: ModelCapabilities[];
  abstract readonly defaultModelId?: string;
  abstract readonly configSchema: AgentConfigSchema;

  abstract execute(options: RunOptions): AsyncIterableIterator<AgentEvent>;
  abstract detectAuth(): Promise<AuthState>;
  abstract getAuthGuidance(): AuthSetupGuidance;
  abstract sessionDir(cwd?: string): string;
  abstract parseSessionFile(filePath: string): Promise<Session>;
  abstract listSessionFiles(cwd?: string): Promise<string[]>;
  abstract readConfig(cwd?: string): Promise<AgentConfig>;
  abstract writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>;

  // ── Optional members ──────────────────────────────────────────────

  readonly hostEnvSignals?: readonly string[];

  listPlugins?(): Promise<InstalledPlugin[]>;
  installPlugin?(pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin>;
  uninstallPlugin?(pluginId: string): Promise<void>;
  searchPlugins?(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>;

  readHostMetadata?(env: NodeJS.ProcessEnv): Record<string, string | number | boolean | null>;

  // ── Protected utilities ───────────────────────────────────────────

  /**
   * Generate a unique run ID for this execution.
   */
  protected generateRunId(): string {
    return `${this.agent}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create base event structure with common fields.
   */
  protected createBaseEvent(type: string, runId: string): Record<string, unknown> {
    return {
      type,
      runId,
      agent: this.agent,
      timestamp: Date.now(),
    };
  }

  /**
   * Helper to create text delta events.
   */
  protected createTextDeltaEvent(runId: string, delta: string, accumulated?: string): AgentEvent {
    return {
      ...this.createBaseEvent('text_delta', runId),
      type: 'text_delta',
      delta,
      accumulated: accumulated || delta,
    } as AgentEvent;
  }

  /**
   * Helper to create tool call start events.
   */
  protected createToolCallStartEvent(
    runId: string,
    toolCallId: string,
    toolName: string,
    inputAccumulated: string
  ): AgentEvent {
    return {
      ...this.createBaseEvent('tool_call_start', runId),
      type: 'tool_call_start',
      toolCallId,
      toolName,
      inputAccumulated,
    } as AgentEvent;
  }

  /**
   * Helper to create tool result events.
   */
  protected createToolResultEvent(
    runId: string,
    toolCallId: string,
    toolName: string,
    output: unknown,
    durationMs: number = 0
  ): AgentEvent {
    return {
      ...this.createBaseEvent('tool_result', runId),
      type: 'tool_result',
      toolCallId,
      toolName,
      output,
      durationMs,
    } as AgentEvent;
  }

  /**
   * Helper to create cost events.
   */
  protected createCostEvent(runId: string, cost: CostRecord): AgentEvent {
    return {
      type: 'cost',
      runId,
      agent: this.agent,
      timestamp: Date.now(),
      cost,
    } as AgentEvent;
  }

  /**
   * Helper to create error events.
   */
  protected createErrorEvent(
    runId: string,
    code: string,
    message: string,
    recoverable: boolean = false
  ): AgentEvent {
    return {
      ...this.createBaseEvent('error', runId),
      type: 'error',
      code,
      message,
      recoverable,
    } as AgentEvent;
  }

  /**
   * Helper to create message stop events.
   */
  protected createMessageStopEvent(runId: string, text: string): AgentEvent {
    return {
      ...this.createBaseEvent('message_stop', runId),
      type: 'message_stop',
      text,
    } as AgentEvent;
  }

  /**
   * Validate that required options are present.
   */
  protected validateRunOptions(options: RunOptions): void {
    if (!options.prompt) {
      throw new Error('RunOptions.prompt is required');
    }

    if (!options.agent || options.agent !== this.agent) {
      throw new Error(`RunOptions.agent must be '${this.agent}'`);
    }
  }

  /**
   * Get the model to use for this run, with fallback to default.
   */
  protected resolveModel(options: RunOptions): string {
    if (options.model) {
      // Validate that the model is supported
      const supportedModel = this.models.find(m => m.modelId === options.model);
      if (!supportedModel) {
        throw new Error(`Model '${options.model}' is not supported by ${this.agent}`);
      }
      return options.model;
    }

    if (this.defaultModelId) {
      return this.defaultModelId;
    }

    if (this.models.length > 0) {
      return this.models[0].modelId;
    }

    throw new Error(`No models configured for ${this.agent}`);
  }

  /**
   * Extract cost information from SDK response.
   * Subclasses can override this to handle provider-specific cost formats.
   */
  protected extractCostFromResponse(response: unknown): Record<string, unknown> | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const obj = response as Record<string, unknown>;

    // Common patterns for cost/usage information
    const usage = obj.usage || obj.cost || obj.billing;
    if (usage && typeof usage === 'object') {
      return usage as Record<string, unknown>;
    }

    return null;
  }

  /**
   * Convert provider-specific prompt format to standard format.
   */
  protected normalizePrompt(prompt: string | string[]): string {
    if (Array.isArray(prompt)) {
      return prompt.join('\n');
    }
    return prompt;
  }
}