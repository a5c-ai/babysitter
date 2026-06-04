import { useStore } from 'zustand';

import { useGateway } from './useGateway.js';

export function useSession(sessionId: string) {
  const { store } = useGateway();
  return useStore(store, (state) => state.sessions.byId[sessionId] ?? null);
}
