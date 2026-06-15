import { useStore } from 'zustand';

import { selectCostTotals } from '../store/selectors.js';
import { useGateway } from './useGateway.js';

export function useCostTotals(runId: string) {
  const { store } = useGateway();
  return useStore(store, (state) => selectCostTotals(state, runId));
}
