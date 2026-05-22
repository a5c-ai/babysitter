import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useGateway } from '@a5c-ai/agent-mux-ui';

import { projectWearState, type WearStateProjection } from '../projection/wearState.js';
import { subscribeToWearMessages, updateWearState } from '../native/wearBridge.js';

type WearBridgeContextValue = {
  lastInboundPayload: string | null;
};

const WearBridgeContext = createContext<WearBridgeContextValue>({ lastInboundPayload: null });

export function WearBridgeProvider(props: { children: React.ReactNode }): JSX.Element {
  const { store } = useGateway();
  const previousProjection = useRef<WearStateProjection | undefined>(undefined);
  const [lastInboundPayload, setLastInboundPayload] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeStore = store.subscribe((state) => {
      const envelope = projectWearState(state, previousProjection.current);
      previousProjection.current = envelope.full;
      if (envelope.byteLength <= 4096 && Object.keys(envelope.diff).length > 0) {
        void updateWearState(JSON.stringify(envelope.diff));
      }
    });
    const unsubscribeWear = subscribeToWearMessages(setLastInboundPayload);
    return () => {
      unsubscribeStore();
      unsubscribeWear();
    };
  }, [store]);

  const value = useMemo(() => ({ lastInboundPayload }), [lastInboundPayload]);
  return <WearBridgeContext.Provider value={value}>{props.children}</WearBridgeContext.Provider>;
}

export function useWearBridge(): WearBridgeContextValue {
  return useContext(WearBridgeContext);
}
