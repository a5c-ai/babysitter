import type { GatewayStoreState } from '../index.js';

export function selectAgentsSlice(state: GatewayStoreState): string[] {
  return state.agents.items;
}
