import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { useGateway } from './useGateway.js';

export function useSessions() {
  const { store } = useGateway();
  return useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
}
