import type { GatewayStoreState } from '../index.js';

export function selectEventsSlice(state: GatewayStoreState) {
  return state.events.byRunId;
}
