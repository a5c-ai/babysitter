import type { ConnectionSlice, GatewayStoreState } from '../index.js';

export function selectConnectionSlice(state: GatewayStoreState): ConnectionSlice {
  return state.connection;
}
