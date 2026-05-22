import type { ProgrammaticAdapter } from './adapter-types.js';
import type { RunOptions } from './run-options.js';
import { AgentMuxError } from './errors.js';

import { RunHandleImpl } from './run-handle-impl.js';

export function startProgrammaticLoop(
  handle: RunHandleImpl,
  adapter: ProgrammaticAdapter,
  options: RunOptions,
): void {
  queueMicrotask(() => {
    void runProgrammatic(handle, adapter, options);
  });
}

async function runProgrammatic(
  handle: RunHandleImpl,
  adapter: ProgrammaticAdapter,
  options: RunOptions,
): Promise<void> {
  let aborted = false;
  let runTimeout: NodeJS.Timeout | null = null;
  let inactivityTimeout: NodeJS.Timeout | null = null;
  let stream: ReturnType<ProgrammaticAdapter['execute']> | null = null;

  const clearTimers = (): void => {
    if (runTimeout) clearTimeout(runTimeout);
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
  };

  const resetInactivity = (): void => {
    if (!options.inactivityTimeout || options.inactivityTimeout <= 0) return;
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      aborted = true;
      void handle.abort();
    }, options.inactivityTimeout);
  };

  if (options.timeout && options.timeout > 0) {
    runTimeout = setTimeout(() => {
      aborted = true;
      void handle.abort();
    }, options.timeout);
  }

  const originalAbort = handle.abort.bind(handle);
  handle.abort = async () => {
    aborted = true;
    clearTimers();
    if (stream && typeof stream.close === 'function') {
      try {
        await stream.close();
      } catch {
        // Ignore cleanup errors.
      }
    }
    try {
      await originalAbort();
    } catch {
      // Ignore double-finalization races.
    }
  };

  const originalInterrupt = handle.interrupt.bind(handle);
  handle.interrupt = async () => {
    if (stream && typeof stream.interrupt === 'function') {
      await stream.interrupt();
    }
    await originalInterrupt();
  };

  try {
    handle.transitionTo('running');
  } catch {
    // Ignore if already transitioned.
  }

  try {
    resetInactivity();
    stream = adapter.execute(options);

    handle.bindInputTransport(async (text: string) => {
      if (!adapter.capabilities.supportsStdinInjection || typeof stream?.send !== 'function') {
        throw new AgentMuxError(
          'STDIN_NOT_AVAILABLE',
          `${adapter.agent} does not support live prompt injection in the current agent-mux transport`,
          false,
        );
      }
      await stream.send(text);
    });

    handle.bindInteractionTransport(async (interactionId, response) => {
      if (typeof stream?.respond !== 'function') {
        throw new AgentMuxError(
          'STDIN_NOT_AVAILABLE',
          `${adapter.agent} does not support live interaction responses in the current agent-mux transport`,
          false,
        );
      }
      await stream.respond(interactionId, response);
    });

    for await (const event of stream) {
      resetInactivity();
      handle.emit(event);
    }
    clearTimers();
    handle.complete(aborted ? 'aborted' : 'completed', aborted ? 1 : 0, null);
  } catch (err) {
    clearTimers();
    if (stream && typeof stream.close === 'function') {
      try {
        await stream.close();
      } catch {
        // Ignore cleanup errors after failures.
      }
    }
    handle.emit({
      type: 'error',
      runId: handle.runId,
      agent: handle.agent,
      timestamp: Date.now(),
      code: 'INTERNAL',
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    });
    handle.complete(aborted ? 'aborted' : 'crashed', null, null);
  }
}
