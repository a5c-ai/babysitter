import React from 'react';

import { ThemeProvider, lightTheme } from '@a5c-ai/agent-mux-ui';

import { RootNavigator } from './navigation/RootNavigator.js';
import { BackgroundHookHandler } from './providers/BackgroundHookHandler.js';
import { GatewayProvider } from './providers/GatewayProvider.js';
import { NotificationProvider } from './providers/NotificationProvider.js';
import { TokenStoreProvider } from './providers/TokenStoreProvider.js';
import { WearBridgeProvider } from './providers/WearBridgeProvider.js';

export function App(): JSX.Element {
  return (
    <ThemeProvider value={lightTheme}>
      <TokenStoreProvider>
        <GatewayProvider>
          <NotificationProvider>
            <WearBridgeProvider>
              <BackgroundHookHandler />
              <RootNavigator />
            </WearBridgeProvider>
          </NotificationProvider>
        </GatewayProvider>
      </TokenStoreProvider>
    </ThemeProvider>
  );
}
