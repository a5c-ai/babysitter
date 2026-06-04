import type { GatewayStoreState } from '../index.js';

export function selectHooksSlice(state: GatewayStoreState) {
  return state.hooks.byRunId;
}
