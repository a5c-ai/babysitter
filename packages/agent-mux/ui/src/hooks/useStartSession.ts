import { useGateway } from './useGateway.js';

export function useStartSession() {
  const { client, store } = useGateway();
  return async (input: {
    agent: string;
    prompt: string;
    model?: string;
    sessionId?: string;
    runId?: string;
    cwd?: string;
    workspaceId?: string;
    forkSessionId?: string;
  }) => {
    const response = await client.startSession<Record<string, unknown>>(input);
    const run = response['run'] as Record<string, unknown> | undefined;
    const session = response['session'] as Record<string, unknown> | undefined;
    const runId = typeof run?.['runId'] === 'string' ? run['runId'] : null;
    const sessionId =
      typeof session?.['sessionId'] === 'string'
        ? session['sessionId']
        : typeof run?.['sessionId'] === 'string'
          ? run['sessionId']
          : input.sessionId ?? null;
    if (run && runId) {
      store.getState().actions.mergeRun(runId, run);
      client.subscribeRun(runId);
    }
    if (sessionId) {
      store.getState().actions.mergeSession(sessionId, {
        ...(session ?? {}),
        sessionId,
        agent: typeof run?.['agent'] === 'string' ? run['agent'] : input.agent,
      });
      client.subscribeSession(sessionId);
    }
    return response;
  };
}
