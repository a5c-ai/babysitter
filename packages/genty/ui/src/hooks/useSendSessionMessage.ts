import { useGateway } from './useGateway.js';

export function useSendSessionMessage() {
  const { client, store } = useGateway();
  return async (input: {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
  }) => {
    const response = await client.sendSessionMessage<Record<string, unknown>>(input);
    const run = response['run'] as Record<string, unknown> | undefined;
    const session = response['session'] as Record<string, unknown> | undefined;
    if (run && typeof run['runId'] === 'string') {
      store.getState().actions.mergeRun(run['runId'], run);
      client.subscribeRun(run['runId']);
    }
    if (session && typeof session['sessionId'] === 'string') {
      store.getState().actions.mergeSession(session['sessionId'], session);
      client.subscribeSession(session['sessionId']);
    }
    return response;
  };
}
