import type { GatewayStoreState } from '../index.js';

export function selectRunsSlice(state: GatewayStoreState) {
  return state.runs.byId;
}
