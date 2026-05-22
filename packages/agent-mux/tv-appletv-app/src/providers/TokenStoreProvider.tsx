import React, { createContext, useContext, useMemo, useState } from 'react';

type TVGatewayAuth = {
  gatewayUrl: string;
  token: string;
};

type TVTokenStoreContextValue = {
  auth: TVGatewayAuth | null;
  login(auth: TVGatewayAuth): void;
};

const TVTokenStoreContext = createContext<TVTokenStoreContextValue | null>(null);

export function TokenStoreProvider(props: { children: React.ReactNode }): JSX.Element {
  const [auth, setAuth] = useState<TVGatewayAuth | null>(null);
  const value = useMemo<TVTokenStoreContextValue>(
    () => ({
      auth,
      login(nextAuth) {
        setAuth(nextAuth);
      },
    }),
    [auth],
  );
  return <TVTokenStoreContext.Provider value={value}>{props.children}</TVTokenStoreContext.Provider>;
}

export function useTVTokenStore(): TVTokenStoreContextValue {
  const value = useContext(TVTokenStoreContext);
  if (!value) {
    throw new Error('useTVTokenStore must be used inside TokenStoreProvider');
  }
  return value;
}
