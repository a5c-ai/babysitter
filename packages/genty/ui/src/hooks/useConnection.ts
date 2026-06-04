import { useStore } from 'zustand';

import { useGateway } from './useGateway.js';

export function useConnection() {
  const { store } = useGateway();
  return useStore(store, (state) => state.connection);
}
