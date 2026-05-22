import type { RemoteAdapter, RemoteConnection } from './adapter-types.js';
import type { RunOptions } from './run-options.js';
import { AgentMuxError } from './errors.js';

import { RunHandleImpl } from './run-handle-impl.js';

export function startRemoteLoop(
  handle: RunHandleImpl,
  adapter: RemoteAdapter,
  options: RunOptions,
): void {
  queueMicrotask(() => {
    void runRemote(handle, adapter, options);
  });
}

async function runRemote(
  handle: RunHandleImpl,
  adapter: RemoteAdapter,
  options: RunOptions,
): Promise<void> {
  let aborted = false;
  let connection: RemoteConnection | null = null;
  let runTimeout: NodeJS.Timeout | null = null;
  let inactivityTimeout: NodeJS.Timeout | null = null;

  const clearTimers = (): void => {
    if (runTimeout) clearTimeout(runTimeout);
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
  };

  const closeConnection = async (): Promise<void> => {
    if (!connection) return;
    try {
      await adapter.disconnect(connection);
    } catch {
      // Ignore cleanup errors.
    } finally {
      connection = null;
    }
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
    await closeConnection();
    try {
      await originalAbort();
    } catch {
      // Ignore double-finalization races.
    }
  };

  try {
    handle.transitionTo('running');
  } catch {
    // Ignore if already transitioned.
  }

  try {
    connection = await adapter.connect(options);
    handle.bindInputTransport(async (text: string) => {
      if (!adapter.capabilities.supportsStdinInjection) {
        throw new AgentMuxError(
          'STDIN_NOT_AVAILABLE',
          `${adapter.agent} does not support live prompt injection in the current agent-mux transport`,
          false,
        );
      }
      if (!connection) {
        throw new AgentMuxError('STDIN_NOT_AVAILABLE', 'Remote session is no longer connected', false);
      }
      await connection.send({
        type: 'user_message',
        text,
        sessionId: options.sessionId,
      });
    });
    handle.bindInteractionTransport(async (interactionId, response) => {
      if (!connection) {
        throw new AgentMuxError('STDIN_NOT_AVAILABLE', 'Remote session is no longer connected', false);
      }
      await connection.send({
        type: 'interaction_response',
        interactionId,
        response,
      });
    });

    resetInactivity();
    for await (const event of connection.receive()) {
      resetInactivity();
      handle.emit(event);
    }
    clearTimers();
    await closeConnection();
    handle.complete(aborted ? 'aborted' : 'completed', aborted ? 1 : 0, null);
  } catch (err) {
    clearTimers();
    await closeConnection();
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
