import type { UnifiedHookResult } from '../types/result';
import type { UnifiedHookEvent, UnifiedExecutionContext } from '../types/event';
import type { SupportLevel } from '../types/lifecycle';

// ---------------------------------------------------------------------------
// HookEventBuilder
// ---------------------------------------------------------------------------

/**
 * Build a UnifiedHookEvent for sending to hooks-mux stdin.
 * Used by in-process adapters or test harnesses.
 */
export class HookEventBuilder {
  private readonly _adapter: string;
  private readonly _phase: string;
  private _rawEventName: string;
  private _supportLevel: SupportLevel = 'native';
  private _payload: Record<string, unknown> = {};
  private _envInput: Record<string, string> = {};
  private _envPersisted: Record<string, string> = {};
  private _raw: unknown = {};

  // Execution context fields
  private _sessionId: string | null = null;
  private _turnId: string | null = null;
  private _cwd: string | null = null;
  private _model: string | null = null;
  private _toolName: string | null = null;
  private _toolCallId: string | null = null;
  private _persistedEnv: Record<string, string> = {};
  private _contextVars: Record<string, string> = {};

  constructor(adapter: string, phase: string) {
    this._adapter = adapter;
    this._phase = phase;
    this._rawEventName = phase; // default to phase
  }

  setSessionId(id: string): this {
    this._sessionId = id;
    return this;
  }

  setRawEventName(name: string): this {
    this._rawEventName = name;
    return this;
  }

  setSupportLevel(level: SupportLevel): this {
    this._supportLevel = level;
    return this;
  }

  setPayload(payload: Record<string, unknown>): this {
    this._payload = payload;
    return this;
  }

  setCwd(cwd: string): this {
    this._cwd = cwd;
    return this;
  }

  setModel(model: string): this {
    this._model = model;
    return this;
  }

  setToolName(name: string): this {
    this._toolName = name;
    return this;
  }

  setToolCallId(id: string): this {
    this._toolCallId = id;
    return this;
  }

  setPersistedEnv(env: Record<string, string>): this {
    this._persistedEnv = env;
    return this;
  }

  setContextVars(vars: Record<string, string>): this {
    this._contextVars = vars;
    return this;
  }

  setRaw(raw: unknown): this {
    this._raw = raw;
    return this;
  }

  build(): UnifiedHookEvent {
    if (!this._adapter) {
      throw new Error('HookEventBuilder: adapter is required');
    }
    if (!this._phase) {
      throw new Error('HookEventBuilder: phase is required');
    }

    const execution: UnifiedExecutionContext = {
      sessionId: this._sessionId,
      adapter: this._adapter,
      nativeEventName: this._rawEventName,
      persistedEnv: this._persistedEnv,
      contextVars: this._contextVars,
      metadata: {},
    };

    if (this._turnId !== undefined) execution.turnId = this._turnId;
    if (this._cwd !== null) execution.cwd = this._cwd;
    if (this._model !== null) execution.model = this._model;
    if (this._toolName !== null) execution.toolName = this._toolName;
    if (this._toolCallId !== null) execution.toolCallId = this._toolCallId;

    return {
      version: 'a5c.hooks.v1',
      adapter: this._adapter,
      phase: this._phase,
      rawEventName: this._rawEventName,
      supportLevel: this._supportLevel,
      execution,
      payload: this._payload,
      env: {
        input: this._envInput,
        persisted: this._envPersisted,
      },
      raw: this._raw,
    };
  }
}

// ---------------------------------------------------------------------------
// HookResultBuilder
// ---------------------------------------------------------------------------

type Decision = NonNullable<UnifiedHookResult['decision']>;

/**
 * Build a UnifiedHookResult for returning from hook handlers.
 */
export class HookResultBuilder {
  private _result: UnifiedHookResult = {};

  // -- Static factories -------------------------------------------------------

  static allow(reason?: string): HookResultBuilder {
    const b = new HookResultBuilder();
    b._result.decision = 'allow';
    if (reason !== undefined) b._result.reason = reason;
    return b;
  }

  static deny(reason?: string): HookResultBuilder {
    const b = new HookResultBuilder();
    b._result.decision = 'deny';
    if (reason !== undefined) b._result.reason = reason;
    return b;
  }

  static block(reason?: string): HookResultBuilder {
    const b = new HookResultBuilder();
    b._result.decision = 'block';
    if (reason !== undefined) b._result.reason = reason;
    return b;
  }

  static retry(reason?: string): HookResultBuilder {
    const b = new HookResultBuilder();
    b._result.decision = 'retry';
    if (reason !== undefined) b._result.reason = reason;
    return b;
  }

  static defer(): HookResultBuilder {
    const b = new HookResultBuilder();
    b._result.decision = 'defer';
    return b;
  }

  static noop(): HookResultBuilder {
    const b = new HookResultBuilder();
    b._result.decision = 'noop';
    return b;
  }

  static continue(): HookResultBuilder {
    const b = new HookResultBuilder();
    b._result.decision = 'continue';
    return b;
  }

  // -- Setters ----------------------------------------------------------------

  setDecision(decision: Decision): this {
    this._result.decision = decision;
    return this;
  }

  setReason(reason: string): this {
    this._result.reason = reason;
    return this;
  }

  setSystemMessage(msg: string): this {
    this._result.systemMessage = msg;
    return this;
  }

  setAdditionalContext(ctx: string): this {
    this._result.additionalContext = ctx;
    return this;
  }

  setFollowUpMessage(msg: string): this {
    this._result.followUpMessage = msg;
    return this;
  }

  setContinueSession(cont: boolean): this {
    this._result.continueSession = cont;
    return this;
  }

  setStopReason(reason: string): this {
    this._result.stopReason = reason;
    return this;
  }

  setPersistEnv(env: Record<string, string>): this {
    this._result.persistEnv = env;
    return this;
  }

  addPersistEnv(key: string, value: string): this {
    if (!this._result.persistEnv) {
      this._result.persistEnv = {};
    }
    this._result.persistEnv[key] = value;
    return this;
  }

  setUnsetEnv(keys: string[]): this {
    this._result.unsetEnv = keys;
    return this;
  }

  setContextVars(vars: Record<string, string>): this {
    this._result.contextVars = vars;
    return this;
  }

  setToolMutation(mode: 'replace' | 'patch', value: unknown): this {
    this._result.toolMutation = { mode, value };
    return this;
  }

  setMetadata(meta: Record<string, unknown>): this {
    this._result.metadata = meta;
    return this;
  }

  // -- Output -----------------------------------------------------------------

  build(): UnifiedHookResult {
    return { ...this._result };
  }

  toJSON(): string {
    return JSON.stringify(this._result);
  }
}
