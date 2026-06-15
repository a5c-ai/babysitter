import { useStore } from 'zustand';

import { useGateway } from './useGateway.js';

export function useRun(runId: string) {
  const { store } = useGateway();
  return useStore(store, (state) => state.runs.byId[runId] ?? null);
}
