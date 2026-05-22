import { useStore } from 'zustand';

import { selectVisibleEventNodes } from '../store/selectors.js';
import { useGateway } from './useGateway.js';

export function useRunEvents(runId: string) {
  const { store } = useGateway();
  return useStore(store, (state) => selectVisibleEventNodes(state, runId));
}
