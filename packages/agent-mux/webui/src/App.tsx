import React from 'react';
import { BrowserRouter } from 'react-router-dom-v6';
import { ToastProvider } from '@a5c-ai/compendium';

import { GatewayProvider } from './providers/GatewayProvider.js';
import { NotificationProvider } from './providers/NotificationProvider.js';
import { ThemeProvider } from './providers/ThemeProvider.js';
import { AppRouter } from './router.js';

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <GatewayProvider>
            <NotificationProvider>
              <AppRouter />
            </NotificationProvider>
          </GatewayProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
