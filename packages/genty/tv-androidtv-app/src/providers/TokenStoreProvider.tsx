import React, { createContext, useContext, useMemo, useState } from 'react';

type TVAuth = {
  gatewayUrl: string;
  token: string;
};

type AndroidTVTokenStoreContextValue = {
  auth: TVAuth | null;
  login(auth: TVAuth): void;
};

const AndroidTVTokenStoreContext = createContext<AndroidTVTokenStoreContextValue | null>(null);

export function TokenStoreProvider(props: { children: React.ReactNode }): JSX.Element {
  const [auth, setAuth] = useState<TVAuth | null>(null);
  const value = useMemo(
    () => ({
      auth,
      login(nextAuth: TVAuth) {
        setAuth(nextAuth);
      },
    }),
    [auth],
  );
  return <AndroidTVTokenStoreContext.Provider value={value}>{props.children}</AndroidTVTokenStoreContext.Provider>;
}

export function useAndroidTVTokenStore(): AndroidTVTokenStoreContextValue {
  const value = useContext(AndroidTVTokenStoreContext);
  if (!value) {
    throw new Error('useAndroidTVTokenStore must be used inside TokenStoreProvider');
  }
  return value;
}
