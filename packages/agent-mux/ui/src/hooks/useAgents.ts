import { useStore } from 'zustand';

import { useGateway } from './useGateway.js';

export function useAgents() {
  const { store } = useGateway();
  return useStore(store, (state) => state.agents.items);
}
