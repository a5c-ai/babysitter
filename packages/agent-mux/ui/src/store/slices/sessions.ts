import type { GatewayStoreState } from '../index.js';

export function selectSessionsSlice(state: GatewayStoreState) {
  return state.sessions.byId;
}
