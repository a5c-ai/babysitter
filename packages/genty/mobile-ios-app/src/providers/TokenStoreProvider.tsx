import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { clearGatewayAuth, readGatewayAuth, writeGatewayAuth } from '../native/keychain.js';
import type { StoredGatewayAuth } from '../types.js';

type TokenStoreContextValue = {
  auth: StoredGatewayAuth | null;
  hydrated: boolean;
  login(auth: StoredGatewayAuth): Promise<void>;
  logout(): Promise<void>;
};

const DEFAULT_HOST = 'http://127.0.0.1:7878';
const TokenStoreContext = createContext<TokenStoreContextValue | null>(null);

function normalizeGatewayUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : DEFAULT_HOST;
}

export function TokenStoreProvider(props: { children: React.ReactNode }): JSX.Element {
  const [auth, setAuth] = useState<StoredGatewayAuth | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void readGatewayAuth(DEFAULT_HOST)
      .then((stored) => {
        if (active) {
          setAuth(stored);
        }
      })
      .finally(() => {
        if (active) {
          setHydrated(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<TokenStoreContextValue>(
    () => ({
      auth,
      hydrated,
      async login(nextAuth) {
        const normalized = {
          gatewayUrl: normalizeGatewayUrl(nextAuth.gatewayUrl),
          token: nextAuth.token.trim(),
        };
        await writeGatewayAuth(normalized);
        setAuth(normalized);
      },
      async logout() {
        if (auth) {
          await clearGatewayAuth(auth.gatewayUrl);
        }
        setAuth(null);
      },
    }),
    [auth, hydrated],
  );

  return <TokenStoreContext.Provider value={value}>{props.children}</TokenStoreContext.Provider>;
}

export function useTokenStore(): TokenStoreContextValue {
  const value = useContext(TokenStoreContext);
  if (!value) {
    throw new Error('useTokenStore must be used inside TokenStoreProvider');
  }
  return value;
}
