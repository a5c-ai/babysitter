import type { AgentEvent } from './events.js';
import type {
  HookDecision,
  RuntimeHookKind,
  RuntimeHookMode,
  RuntimeHooks,
} from './runtime-hooks.js';

export interface RuntimeHookDispatcherOptions {
  hooks?: RuntimeHooks;
  runId: string;
  agent: string;
  emit(event: AgentEvent): void | Promise<void>;
}

const ALLOW: HookDecision = { decision: 'allow' };

/**
 * Dispatches per-run runtime hooks and lets them inject synthetic run events.
 */
export class RuntimeHookDispatcher {
  private readonly hooks?: RuntimeHooks;
  readonly runId: string;
  readonly agent: string;
  private readonly emitEvent: RuntimeHookDispatcherOptions['emit'];

  constructor(options: RuntimeHookDispatcherOptions) {
    this.hooks = options.hooks;
    this.runId = options.runId;
    this.agent = options.agent;
    this.emitEvent = options.emit;
  }

  async dispatch(
    kind: RuntimeHookKind,
    payload: unknown,
    signal: AbortSignal,
    mode: Exclude<RuntimeHookMode, 'unsupported'>,
  ): Promise<HookDecision | void> {
    const handler = this.hooks?.[kind] as
      | ((payload: unknown, context: { signal: AbortSignal; emit(event: AgentEvent): Promise<void> }) => Promise<unknown> | unknown)
      | undefined;
    if (!handler) {
      return mode === 'blocking' ? ALLOW : undefined;
    }

    const context = {
      signal,
      emit: async (event: AgentEvent): Promise<void> => {
        await this.emitEvent({ ...event, source: 'hook' } as AgentEvent);
      },
    };

    if (mode === 'blocking') {
      try {
        return await handler(payload, context) as HookDecision;
      } catch (error) {
        return {
          decision: 'deny',
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    }

    void Promise.resolve(handler(payload, context)).catch(async (error) => {
      await context.emit({
        type: 'debug',
        runId: this.runId,
        agent: this.agent as AgentEvent['agent'],
        timestamp: Date.now(),
        level: 'warn',
        message: `runtime hook ${kind} failed: ${error instanceof Error ? error.message : String(error)}`,
      } as AgentEvent);
    });
  }
}
