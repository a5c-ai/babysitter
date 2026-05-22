import { useSyncExternalStore } from 'react';

import { useGateway } from '@a5c-ai/agent-mux-ui';

export function useGatewaySelector<T>(
  selector: (state: ReturnType<ReturnType<typeof useGateway>['store']['getState']>) => T,
): T {
  const { store } = useGateway();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
