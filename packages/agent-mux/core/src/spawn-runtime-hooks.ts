import type { AgentAdapter } from './adapter.js';
import type { AgentEvent } from './events.js';
import type { RunHandleImpl } from './run-handle-impl.js';
import type { RunOptions } from './run-options.js';
import { RuntimeHookDispatcher } from './runtime-hook-dispatcher.js';
import type { HookDecision, RuntimeHookKind, RuntimeHookSetup } from './runtime-hooks.js';

function normalizePrompt(prompt: string | string[]): string {
  return Array.isArray(prompt) ? prompt.join('\n') : prompt;
}

function getRuntimeHookMode(
  adapter: AgentAdapter,
  kind: RuntimeHookKind,
): 'unsupported' | 'nonblocking' | 'blocking' {
  return adapter.capabilities.runtimeHooks?.[kind] ?? 'unsupported';
}

export interface SpawnRuntimeHookBridge {
  readonly sessionId: string | undefined;
  readonly setup: RuntimeHookSetup | undefined;
  enqueue(event: AgentEvent): void;
  dispatchPrompt(promptText: string): void;
  abort(): void;
  awaitIdle(): Promise<void>;
  finalize(exitReason: string, exitCode: number | null, signal: string | null): Promise<void>;
}

export async function createSpawnRuntimeHookBridge(
  handle: RunHandleImpl,
  adapter: AgentAdapter,
  options: RunOptions,
): Promise<SpawnRuntimeHookBridge> {
  const abortController = new AbortController();
  const dispatcher = options.hooks
    ? new RuntimeHookDispatcher({
        hooks: options.hooks,
        runId: handle.runId,
        agent: handle.agent,
        emit: (event) =>
          handle.emit({
            ...event,
            runId: handle.runId,
            agent: handle.agent,
            timestamp: event.timestamp ?? Date.now(),
            source: 'hook',
          } as AgentEvent),
      })
    : null;
  const setupResult = dispatcher && typeof adapter.setupRuntimeHooks === 'function'
    ? await adapter.setupRuntimeHooks(options, dispatcher)
    : undefined;
  const setup = setupResult ?? undefined;
  let sessionId = options.sessionId;
  const preToolSeen = new Set<string>();
  let eventChain = Promise.resolve();

  const emitHookDeniedTool = (event: AgentEvent, decision: HookDecision): void => {
    handle.emit({
      type: 'tool_error',
      runId: handle.runId,
      agent: handle.agent,
      timestamp: Date.now(),
      source: 'hook',
      toolCallId: (event as any).toolCallId ?? '',
      toolName: (event as any).toolName ?? '',
      error:
        decision.decision === 'deny'
          ? (decision.reason ?? 'Runtime hook denied tool use')
          : 'Runtime hook denied tool use',
    } as AgentEvent);
  };

  const emitRuntimeAware = async (event: AgentEvent): Promise<void> => {
    if (event.type === 'session_start') {
      sessionId = (event as { sessionId: string }).sessionId;
      const mode = getRuntimeHookMode(adapter, 'sessionStart');
      if (dispatcher && mode !== 'unsupported') {
        const decision = await dispatcher.dispatch(
          'sessionStart',
          {
            sessionId,
            resumed: (event as any).resumed,
            forkedFrom: (event as any).forkedFrom,
          },
          abortController.signal,
          mode === 'blocking' ? 'blocking' : 'nonblocking',
        );
        if (mode === 'blocking' && decision && decision.decision === 'deny') {
          return;
        }
      }
      handle.emit(event);
      return;
    }

    if (event.type === 'tool_call_start' || event.type === 'tool_call_ready') {
      const toolCallId = String((event as any).toolCallId ?? '');
      const mode = getRuntimeHookMode(adapter, 'preToolUse');
      if (dispatcher && mode !== 'unsupported' && !preToolSeen.has(toolCallId)) {
        preToolSeen.add(toolCallId);
        const decision = await dispatcher.dispatch(
          'preToolUse',
          {
            sessionId,
            toolCallId,
            toolName: (event as any).toolName ?? '',
            input: 'input' in event ? (event as any).input : (event as any).inputAccumulated,
          },
          abortController.signal,
          mode === 'blocking' ? 'blocking' : 'nonblocking',
        );
        if (mode === 'blocking' && decision && decision.decision === 'deny') {
          emitHookDeniedTool(event, decision);
          return;
        }
      }
      handle.emit(event);
      return;
    }

    handle.emit(event);

    if (event.type === 'tool_result' || event.type === 'tool_error') {
      const mode = getRuntimeHookMode(adapter, 'postToolUse');
      if (dispatcher && mode !== 'unsupported') {
        void dispatcher.dispatch(
          'postToolUse',
          {
            sessionId,
            toolCallId: (event as any).toolCallId ?? '',
            toolName: (event as any).toolName ?? '',
            output: 'output' in event ? (event as any).output : undefined,
            error: 'error' in event ? (event as any).error : undefined,
            durationMs: (event as any).durationMs ?? 0,
          },
          abortController.signal,
          mode === 'blocking' ? 'blocking' : 'nonblocking',
        );
      }
    }
  };

  const awaitIdle = async (): Promise<void> => {
    await eventChain.catch(() => {});
  };

  return {
    get sessionId() {
      return sessionId;
    },
    setup,
    enqueue(event: AgentEvent): void {
      eventChain = eventChain.then(
        () => emitRuntimeAware(event),
        () => emitRuntimeAware(event),
      );
    },
    dispatchPrompt(promptText: string): void {
      if (!dispatcher || promptText.length === 0) return;
      const mode = getRuntimeHookMode(adapter, 'userPromptSubmit');
      if (mode !== 'nonblocking') return;
      void dispatcher.dispatch(
        'userPromptSubmit',
        { prompt: normalizePrompt(promptText), sessionId },
        abortController.signal,
        'nonblocking',
      );
    },
    abort(): void {
      abortController.abort();
    },
    awaitIdle,
    async finalize(exitReason: string, exitCode: number | null, signal: string | null): Promise<void> {
      await awaitIdle();
      if (!dispatcher) {
        return;
      }
      const finalHookSignal = new AbortController().signal;
      const sessionEndMode = getRuntimeHookMode(adapter, 'sessionEnd');
      if (sessionId && sessionEndMode !== 'unsupported') {
        await dispatcher.dispatch(
          'sessionEnd',
          { sessionId, exitReason, exitCode, signal },
          finalHookSignal,
          sessionEndMode === 'blocking' ? 'blocking' : 'nonblocking',
        );
      }
      const stopMode = getRuntimeHookMode(adapter, 'stop');
      if (stopMode !== 'unsupported') {
        await dispatcher.dispatch(
          'stop',
          { sessionId, exitReason, exitCode, signal },
          finalHookSignal,
          stopMode === 'blocking' ? 'blocking' : 'nonblocking',
        );
      }
    },
  };
}
