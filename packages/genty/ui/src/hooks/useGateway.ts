import { useContext } from 'react';

import { GatewayClientContext, GatewayStoreContext } from './GatewayProvider.js';

export function useGateway() {
  const client = useContext(GatewayClientContext);
  const store = useContext(GatewayStoreContext);
  if (!client || !store) {
    throw new Error('useGateway must be used inside a GatewayProvider');
  }
  return { client, store };
}
