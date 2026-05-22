import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useGateway } from '@a5c-ai/agent-mux-ui';

import { sendToWatch, subscribeToWatchMessages } from '../native/watchBridge.js';
import { projectWatchState, type WatchStateProjection } from '../projection/watchState.js';

type WatchBridgeContextValue = {
  lastInboundPayload: string | null;
};

const WatchBridgeContext = createContext<WatchBridgeContextValue>({ lastInboundPayload: null });

export function WatchBridgeProvider(props: { children: React.ReactNode }): JSX.Element {
  const { store } = useGateway();
  const previousProjection = useRef<WatchStateProjection | undefined>(undefined);
  const [lastInboundPayload, setLastInboundPayload] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeStore = store.subscribe((state) => {
      const envelope = projectWatchState(state, previousProjection.current);
      previousProjection.current = envelope.full;
      if (envelope.byteLength <= 4096 && Object.keys(envelope.diff).length > 0) {
        void sendToWatch(JSON.stringify(envelope.diff));
      }
    });
    const unsubscribeWatch = subscribeToWatchMessages(setLastInboundPayload);
    return () => {
      unsubscribeStore();
      unsubscribeWatch();
    };
  }, [store]);

  const value = useMemo(() => ({ lastInboundPayload }), [lastInboundPayload]);
  return <WatchBridgeContext.Provider value={value}>{props.children}</WatchBridgeContext.Provider>;
}

export function useWatchBridge(): WatchBridgeContextValue {
  return useContext(WatchBridgeContext);
}
