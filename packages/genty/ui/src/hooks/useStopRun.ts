import { useGateway } from './useGateway.js';

export function useStopRun() {
  const { client } = useGateway();
  return async (runId: string) => {
    return await client.request({
      type: 'run.stop',
      runId,
    });
  };
}
