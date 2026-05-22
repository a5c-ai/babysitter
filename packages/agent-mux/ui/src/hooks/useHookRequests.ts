import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { selectPendingHookRequests } from '../store/selectors.js';
import { useGateway } from './useGateway.js';

export function useHookRequests(runId?: string) {
  const { store } = useGateway();
  return useStore(store, useShallow((state) => selectPendingHookRequests(state, runId)));
}
